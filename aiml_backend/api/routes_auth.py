from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, Any
import jwt
from datetime import datetime, timedelta
import bcrypt
from db.database import get_db
from db.models import User
import uuid

router = APIRouter()

SECRET_KEY = "hbtm_super_secret_key_for_jwt_auth_demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    role: Optional[str] = "Personal Growth Aspirant"
    onboarding: Optional[Dict[str, Any]] = None

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

def verify_password(plain_password, hashed_password):
    if not hashed_password or not plain_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if exists
    result = await db.execute(select(User).where(User.email == req.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pw = get_password_hash(req.password) if req.password else None
    import json
    onboarding_str = json.dumps(req.onboarding) if req.onboarding else None
    
    new_user = User(
        id=str(uuid.uuid4()),
        name=req.name,
        email=req.email,
        hashed_password=hashed_pw,
        role=req.role,
        onboarding_data=onboarding_str,
        onboarding_completed=bool(req.onboarding)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.id})
    return {
        "message": "User registered successfully", 
        "token": token, 
        "user": {
            "id": new_user.id, 
            "name": new_user.name, 
            "email": new_user.email,
            "role": new_user.role,
            "avatarUrl": new_user.avatar_url,
            "onboarding": req.onboarding
        }
    }
@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if req.password and user.hashed_password:
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
    token = create_access_token({"sub": user.id})
    import json
    onboarding = json.loads(user.onboarding_data) if user.onboarding_data else None
    return {
        "message": "Login successful", 
        "token": token, 
        "user": {
            "id": user.id, 
            "name": user.name, 
            "email": user.email,
            "onboarding": onboarding
        }
    }

class GoogleAuthRequest(BaseModel):
    googleToken: Optional[str] = None
    credential: Optional[str] = None
    email: str
    name: str
    avatarUrl: Optional[str] = None
    picture: Optional[str] = None
    onboarding: Optional[Dict[str, Any]] = None

@router.post("/google")
async def google_auth(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    import json
    onboarding_str = json.dumps(req.onboarding) if req.onboarding else None
    
    if not user:
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            name=req.name,
            email=req.email,
            avatar_url=req.avatarUrl or req.picture,
            role="Personal Growth Aspirant",
            onboarding_data=onboarding_str,
            onboarding_completed=bool(req.onboarding)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update avatar if missing or empty
        if not user.avatar_url and (req.avatarUrl or req.picture):
            user.avatar_url = req.avatarUrl or req.picture
            await db.commit()
            await db.refresh(user)
            
    token = create_access_token({"sub": user.id})
    onboarding = json.loads(user.onboarding_data) if user.onboarding_data else None
    
    return {
        "message": "Google auth successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatarUrl": user.avatar_url,
            "onboarding": onboarding
        }
    }

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    if not credentials:
        # For hackathon, default to first user if no token (fallback)
        result = await db.execute(select(User))
        user = result.scalars().first()
        if user: return user
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    import json
    onboarding = json.loads(current_user.onboarding_data) if current_user.onboarding_data else None
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "avatarUrl": current_user.avatar_url,
            "onboarding": onboarding
        }
    }
