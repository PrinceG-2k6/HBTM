from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uuid
import json
import os
import aiofiles
from datetime import datetime

from db.database import get_db
from db.models import User, UserSkill, SandboxSubmission, HITLReview
from schemas.sandbox_schemas import SandboxGenerateRequest, SandboxGenerateResponse, HitlGradeRequest, PendingReviewResponse
from config import BASE_DIR, GOOGLE_API_KEY, GEMINI_MODEL

router = APIRouter(prefix="/api", tags=["sandbox", "hitl"])

# Ensure uploads directory exists
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/sandbox/generate", response_model=SandboxGenerateResponse)
async def generate_sandbox_scenario(req: SandboxGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate an active sandbox scenario using Gemini."""
    # Verify user and skill
    skill_result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == req.user_id, UserSkill.skill_name == req.target_skill)
    )
    user_skill = skill_result.scalar_one_or_none()
    
    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found for user")
        
    target_level = user_skill.sandbox_unlocked_level
    if target_level is None:
        raise HTTPException(status_code=400, detail="Skill is not currently locked at a milestone")

    import google.genai as genai
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    prompt = f"""
    You are generating a 60-second roleplay challenge for a user trying to reach level {target_level}/10 in '{req.target_skill}'.
    Create a highly specific, corporate or daily life scenario where they must demonstrate this skill.
    
    Return EXACTLY this JSON structure:
    {{
      "prompt": "Scenario description...",
      "time_limit_seconds": 60,
      "required_keywords": ["word1", "word2", "word3"]
    }}
    """
    
    try:
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        res_text = response.text.strip()
        if res_text.startswith("```json"): res_text = res_text[7:]
        if res_text.startswith("```"): res_text = res_text[3:]
        if res_text.endswith("```"): res_text = res_text[:-3]
        
        scenario_data = json.loads(res_text.strip())
    except Exception as e:
        # Fallback
        scenario_data = {
            "prompt": f"Demonstrate your {req.target_skill} skills in a brief 60 second pitch.",
            "time_limit_seconds": 60,
            "required_keywords": [req.target_skill.lower()]
        }
        
    scenario_id = f"sc_{uuid.uuid4().hex[:8]}"
    
    # Save a draft submission to hold the scenario context
    sub = SandboxSubmission(
        id=scenario_id,
        user_id=req.user_id,
        skill_name=req.target_skill,
        target_level=target_level,
        scenario_prompt=scenario_data["prompt"],
        media_url="", # Will be updated on submit
        status="draft"
    )
    db.add(sub)
    await db.commit()
    
    return SandboxGenerateResponse(
        scenario_id=scenario_id,
        prompt=scenario_data["prompt"],
        time_limit_seconds=scenario_data.get("time_limit_seconds", 60),
        required_keywords=scenario_data.get("required_keywords", [])
    )


@router.post("/sandbox/submit")
async def submit_sandbox(
    scenario_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Process the uploaded audio/video using Whisper and LLM scoring."""
    # Find draft submission
    sub_result = await db.execute(select(SandboxSubmission).where(SandboxSubmission.id == scenario_id))
    submission = sub_result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Scenario ID not found")
        
    # Save file locally
    file_ext = os.path.splitext(file.filename)[1] or ".webm"
    file_path = UPLOAD_DIR / f"{scenario_id}{file_ext}"
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    submission.media_url = str(file_path)
    
    # 1. First-Pass AI Inference (Whisper)
    try:
        import whisper
        # Use base model for speed during hackathon
        model = whisper.load_model("base") 
        result = model.transcribe(str(file_path))
        transcript = result["text"]
    except Exception as e:
        print(f"Whisper failed: {e}")
        transcript = "Transcription failed or simulated."
        
    submission.transcript = transcript
    
    # 2. LLM Scoring
    import google.genai as genai
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    score_prompt = f"""
    Evaluate this user's audio transcript for a {submission.skill_name} challenge.
    Scenario: {submission.scenario_prompt}
    Transcript: {transcript}
    
    Score them from 0 to 10. Return ONLY the numeric score (e.g., 8.5).
    """
    
    try:
        score_resp = client.models.generate_content(model=GEMINI_MODEL, contents=score_prompt)
        ai_score = float(score_resp.text.strip())
    except:
        ai_score = 6.0
        
    submission.ai_score = ai_score
    
    # 3. HITL Routing Logic
    # If it's a high level milestone (>= 6) or AI confidence is low (score < 7.5), send to human review
    if submission.target_level >= 6.0 or ai_score < 7.5:
        submission.status = "grading"
        msg = "AI review complete. Score was borderline or this is a critical milestone. Routed to human peers for verification."
    else:
        submission.status = "passed"
        msg = f"AI review passed with score {ai_score}! Milestone unlocked."
        # Unlock the skill
        await db.execute(
            update(UserSkill)
            .where(UserSkill.user_id == submission.user_id, UserSkill.skill_name == submission.skill_name)
            .values(sandbox_unlocked_level=None, current_level=submission.target_level)
        )
        
    await db.commit()
    
    return {
        "status": "processing",
        "message": msg,
        "submission_id": scenario_id,
        "ai_score": ai_score
    }


@router.get("/hitl/pending-reviews/{user_id}", response_model=list[PendingReviewResponse])
async def get_pending_reviews(user_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch anonymized submissions waiting for peer review."""
    # Find submissions not belonging to this user that need grading
    result = await db.execute(
        select(SandboxSubmission)
        .where(SandboxSubmission.status == "grading", SandboxSubmission.user_id != user_id)
        .limit(5)
    )
    
    submissions = result.scalars().all()
    
    return [
        PendingReviewResponse(
            submission_id=s.id,
            skill_name=s.skill_name,
            target_level=s.target_level,
            scenario_prompt=s.scenario_prompt,
            media_url=f"/static/uploads/{os.path.basename(s.media_url)}" if s.media_url else "",
            transcript=s.transcript,
            ai_score=s.ai_score,
            created_at=s.created_at.isoformat()
        )
        for s in submissions
    ]

@router.post("/hitl/grade")
async def submit_peer_grade(req: HitlGradeRequest, db: AsyncSession = Depends(get_db)):
    """Submit human grading for a sandbox challenge."""
    # Verify submission
    sub_result = await db.execute(select(SandboxSubmission).where(SandboxSubmission.id == req.submission_id))
    submission = sub_result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    # Save review
    review = HITLReview(
        submission_id=req.submission_id,
        reviewer_id=req.reviewer_id,
        score=req.score,
        feedback=req.feedback,
        approved=req.approved_for_milestone
    )
    db.add(review)
    
    if req.approved_for_milestone:
        submission.status = "passed"
        # Unlock the original user's skill!
        await db.execute(
            update(UserSkill)
            .where(UserSkill.user_id == submission.user_id, UserSkill.skill_name == submission.skill_name)
            .values(sandbox_unlocked_level=None, current_level=submission.target_level)
        )
    else:
        submission.status = "failed"
        # Keep it locked, user must try again
        
    await db.commit()
    
    return {
        "status": "success",
        "message": "Peer review recorded. Original user has been notified and RLHF data logged."
    }
