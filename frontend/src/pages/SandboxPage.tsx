import React, { useEffect, useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, Zap, Brain, Target, CheckCircle2, XCircle, HelpCircle, Award, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkillHeatmap } from "../components/charts/SkillHeatmap";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService, curationApi } from "../api";

/* ─── Interactive Skill Milestone Challenge Data ──────────────────── */
const SKILL_CHALLENGES: Record<string, { question: string; options: string[]; correctIndex: number; explanation: string }> = {
  "Confidence": {
    question: "When facing a high-stakes meeting or public presentation, which behavioral practice best activates the parasympathetic nervous system to build calm confidence?",
    options: [
      "Rapid shallow breathing to increase heart rate",
      "Physiological sigh (two deep inhales, long exhale)",
      "Avoiding eye contact until the end",
      "Memorizing every single word verbatim"
    ],
    correctIndex: 1,
    explanation: "The physiological sigh rapidly reduces nervous arousal, restoring physiological calm and self-control."
  },
  "Communication": {
    question: "What is the primary objective of active listening in crucial conversations?",
    options: [
      "Preparing your counter-argument while the other person speaks",
      "Paraphrasing the speaker's core message to confirm zero distortion before responding",
      "Interrupting immediately when you spot a flaw in logic",
      "Nodding continuously without processing the verbal message"
    ],
    correctIndex: 1,
    explanation: "Reflective paraphrasing ensures accurate understanding and builds deep trust."
  },
  "Programming": {
    question: "Which algorithmic complexity is achieved when searching in a balanced binary search tree?",
    options: ["O(N^2)", "O(N)", "O(log N)", "O(1)"],
    correctIndex: 2,
    explanation: "Binary search divides the search space in half with every step, yielding logarithmic O(log N) time."
  },
  "Time Management": {
    question: "In the Eisenhower Decision Matrix, which quadrant fosters sustainable high-performance and deep work?",
    options: [
      "Urgent & Not Important (Distractions)",
      "Important & Not Urgent (Proactive Growth / Deep Work)",
      "Urgent & Important (Crises & Fires)",
      "Not Urgent & Not Important (Time Wasters)"
    ],
    correctIndex: 1,
    explanation: "Proactive growth happens in Quadrant 2 (Important & Not Urgent), preventing future crises."
  }
};

const DEFAULT_CHALLENGE = {
  question: "Which daily habit best accelerates skill retention and long-term neural plasticity?",
  options: [
    "Passive background listening while multitasking",
    "Spaced repetition combined with active retrieval practice",
    "Cramming 8 hours once a month",
    "Skimming titles without note taking"
  ],
  correctIndex: 1,
  explanation: "Active retrieval and spaced repetition strengthen synaptic connections for permanent retention."
};

export const SandboxPage: React.FC = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Challenge state
  const [activeSkillIdx, setActiveSkillIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [earnedBonus, setEarnedBonus] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      apiService.getDashboardData().catch(() => null),
      apiService.getProfile().catch(() => null),
    ]).then(([dash, profile]) => {
      setDashData(dash);
      if (profile?.skills?.length) {
        setSkills(profile.skills);
      } else if (dash?.profile?.skills) {
        setSkills(dash.profile.skills);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
        <SkeletonCard rows={2} />
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        <SkeletonCard rows={10} />
      </div>
    );
  }

  // Current selected skill for challenge
  const currentChallengeSkill = skills[activeSkillIdx] || skills[0] || { skill_name: "Confidence", current_level: 1.0 };
  const currentSkillName = currentChallengeSkill.skill_name || currentChallengeSkill.skill || "Confidence";
  const challengeData = SKILL_CHALLENGES[currentSkillName] || DEFAULT_CHALLENGE;

  const handleOptionSelect = (idx: number) => {
    if (challengeSubmitted) return;
    setSelectedOption(idx);
  };

  const handleChallengeSubmit = async () => {
    if (selectedOption === null || challengeSubmitted) return;
    const correct = selectedOption === challengeData.correctIndex;
    setIsCorrect(correct);
    setChallengeSubmitted(true);

    if (correct) {
      setEarnedBonus(true);
      // Synchronously bump skill level in DB!
      try {
        await curationApi.markContentComplete({
          url: `sandbox-challenge-${Date.now()}`,
          title: `Milestone Challenge: ${currentSkillName}`,
          content_type: "action",
          platform: "sandbox",
          skill_name: currentSkillName
        });
        // Update local skills state immediately
        setSkills(prev => prev.map((s, idx) => {
          if (idx === activeSkillIdx || (s.skill_name === currentSkillName)) {
            const newLvl = Math.min(10.0, (s.current_level || 0) + 0.2);
            return { ...s, current_level: newLvl };
          }
          return s;
        }));
      } catch (err) {
        console.error("Failed to apply challenge bonus", err);
      }
    }
  };

  const resetChallenge = (newSkillIdx: number) => {
    setActiveSkillIdx(newSkillIdx);
    setSelectedOption(null);
    setChallengeSubmitted(false);
    setIsCorrect(false);
    setEarnedBonus(false);
  };

  // Build skill matrix on 0-10 level scale
  const skillMatrix = skills.map((s: any) => {
    const rawLvl = s.current_level || 0;
    return {
      skill: s.skill_name || s.skill,
      score: rawLvl,
      rawLevel: rawLvl,
      target: rawLvl < 3.0 ? 3.0 : rawLvl < 6.0 ? 6.0 : rawLvl < 9.0 ? 9.0 : 10.0,
      category: "Growth Area",
    };
  });

  const avgLevel = skills.length > 0
    ? skills.reduce((sum: number, s: any) => sum + (s.current_level || 0), 0) / skills.length
    : 0;
  
  const completedContent = dashData?.profile?.totalContentAnalyzed || 0;

  const growthVelocity = Math.round(avgLevel * 10);
  const focusRate = Math.min(100, Math.round(60 + completedContent * 2));
  const fatigueIndex = Math.max(10, Math.min(80, 50 - Math.round(avgLevel * 3)));

  const topSkills = [...skills]
    .sort((a: any, b: any) => (b.current_level || 0) - (a.current_level || 0))
    .slice(0, 3);
  
  const weakSkills = [...skills]
    .sort((a: any, b: any) => (a.current_level || 0) - (b.current_level || 0))
    .slice(0, 2);

  const aiSummary = skills.length > 0
    ? `You are tracking ${skills.length} active growth skills. ${topSkills.length > 0 ? `Your leading skill is ${topSkills[0]?.skill_name || topSkills[0]?.skill} at Level ${(topSkills[0]?.current_level || 0).toFixed(1)}/10.` : ''} ${weakSkills.length > 0 ? `Focus on ${weakSkills[0]?.skill_name || weakSkills[0]?.skill} to reach your next milestone.` : ''}`
    : "Complete onboarding and start consuming content to see your skill analytics here.";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white">Skill <span className="text-purple-400">Sandbox</span></h1>
        <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-purple-400" />
          <span>Real-time skill levels (0-10 scale) & Milestone Challenges (Levels 3, 6, 9).</span>
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Growth Velocity</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl text-white">{growthVelocity}%</p>
          <p className="text-sm text-emerald-300">Avg Level: {avgLevel.toFixed(1)} / 10</p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Focus Rate</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl text-white">{focusRate}%</p>
          <p className="text-sm text-emerald-300">{completedContent} items completed</p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Fatigue Index</span>
            <Brain size={18} className="text-purple-400" />
          </div>
          <p className="text-3xl text-white">{fatigueIndex} / 100</p>
          <p className="text-sm text-purple-300">{fatigueIndex < 40 ? "Optimal stamina" : "Consider resting"}</p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Skills Tracked</span>
            <Target size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl text-white">{skills.length}</p>
          <p className="text-sm text-amber-300">Active growth areas</p>
        </Card>
      </div>

      {/* ── Daily Scheduler Milestone Skill Challenge ──────────────────── */}
      {skills.length > 0 && (
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-zinc-950 border border-purple-500/20 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="text-amber-400" size={20} />
                <h2 className="text-xl text-white font-bold tracking-tight">Daily Skill Milestone Challenge</h2>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Pass daily milestone challenge questions to earn direct +0.2 skill level bumps!
              </p>
            </div>

            {/* Skill Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {skills.map((s: any, idx: number) => {
                const sName = s.skill_name || s.skill;
                const isSel = idx === activeSkillIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => resetChallenge(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isSel
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-950/50"
                        : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {sName} (Lvl {(s.current_level || 0).toFixed(1)})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Box */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle size={18} />
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-1">
                  {currentSkillName} Challenge
                </span>
                <p className="text-sm sm:text-base text-white font-medium leading-relaxed">
                  {challengeData.question}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {challengeData.options.map((opt, oIdx) => {
                let btnStyle = "bg-zinc-900/80 border-white/5 text-zinc-300 hover:bg-purple-950/40 hover:border-purple-500/30";
                
                if (selectedOption === oIdx) {
                  btnStyle = "bg-purple-600/30 border-purple-500 text-white font-semibold";
                }
                if (challengeSubmitted) {
                  if (oIdx === challengeData.correctIndex) {
                    btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold";
                  } else if (selectedOption === oIdx) {
                    btnStyle = "bg-rose-950/80 border-rose-500 text-rose-200";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleOptionSelect(oIdx)}
                    disabled={challengeSubmitted}
                    className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all cursor-pointer flex items-start gap-3 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs shrink-0 font-bold">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit / Result Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
              {!challengeSubmitted ? (
                <button
                  onClick={handleChallengeSubmit}
                  disabled={selectedOption === null}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-950/50 cursor-pointer flex items-center justify-center gap-2"
                >
                  Submit Answer <ArrowRight size={14} />
                </button>
              ) : (
                <div className="w-full space-y-3">
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    isCorrect ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200" : "bg-rose-950/60 border-rose-500/40 text-rose-200"
                  }`}>
                    {isCorrect ? (
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-sm">
                        {isCorrect ? "Correct! +0.2 Skill Bump Awarded 🎉" : "Incorrect Answer"}
                      </p>
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">
                        {challengeData.explanation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => resetChallenge((activeSkillIdx + 1) % skills.length)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                  >
                    Next Skill Challenge →
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Skill Breakdown (0-10 Scale with Milestone Indicators) */}
      {skills.length > 0 && (
        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-white">Your Skill Levels (0 - 10 Scale)</h2>
            <span className="text-xs text-purple-300 font-semibold">Milestones: Level 3.0 • Level 6.0 • Level 9.0</span>
          </div>

          <div className="space-y-4">
            {skills.map((s: any, i: number) => {
              const level = s.current_level || 0;
              const nextMilestone = level < 3.0 ? 3.0 : level < 6.0 ? 6.0 : level < 9.0 ? 9.0 : 10.0;
              const pctOfMilestone = Math.min(100, (level / nextMilestone) * 100);

              return (
                <div key={i} className="p-4 rounded-2xl bg-zinc-950/60 space-y-2 border border-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-semibold">{s.skill_name || s.skill}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-purple-300 font-bold text-base">
                        Lvl {level.toFixed(1)} <span className="text-xs font-normal text-zinc-400">/ 10</span>
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/20">
                        Target: Lvl {nextMilestone.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar relative to 10 */}
                  <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                    {/* Milestone threshold markers at 30%, 60%, 90% */}
                    <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-zinc-700 z-10" title="Milestone 1 (Lvl 3)" />
                    <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-zinc-700 z-10" title="Milestone 2 (Lvl 6)" />
                    <div className="absolute top-0 bottom-0 left-[90%] w-0.5 bg-zinc-700 z-10" title="Milestone 3 (Lvl 9)" />

                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, (level / 10) * 100)}%`,
                        background: level >= 9 ? 'linear-gradient(90deg, #10b981, #34d399)' : level >= 6 ? 'linear-gradient(90deg, #8b5cf6, #ec4899)' : 'linear-gradient(90deg, #f59e0b, #8b5cf6)',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
                    <span>{s.level_label || "Beginner"}</span>
                    <span>{(nextMilestone - level) > 0 ? `${(nextMilestone - level).toFixed(1)} pts to Lvl ${nextMilestone.toFixed(1)} Milestone` : "Milestone Passed!"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Growth Summary */}
      <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-purple-300 text-sm">
          <TrendingUp size={18} />
          <span>Growth Summary</span>
        </div>
        <p className="text-base text-zinc-100 leading-relaxed">
          {aiSummary}
        </p>
      </Card>

      {/* Skill Heatmap */}
      {skillMatrix.length > 0 && (
        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-white">Skill Mastery Heatmap</h2>
            <span className="text-sm text-purple-300 font-semibold">0 - 10 Scale (Milestones 3 • 6 • 9)</span>
          </div>
          <SkillHeatmap skillMatrix={skillMatrix} />
        </Card>
      )}
    </div>
  );
};

