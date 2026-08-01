import React, { useEffect, useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, Zap, Brain, Target } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkillHeatmap } from "../components/charts/SkillHeatmap";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";

export const SandboxPage: React.FC = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // Build skill matrix from real user skills
  const skillMatrix = skills.map((s: any) => ({
    skill: s.skill_name || s.skill,
    score: Math.round((s.current_level || 0) * 10), // Convert 0-10 scale to 0-100
    target: Math.min(100, Math.round((s.current_level || 0) * 10) + 15),
    category: "Growth",
  }));

  // Compute aggregate metrics from real skills
  const avgLevel = skills.length > 0
    ? skills.reduce((sum: number, s: any) => sum + (s.current_level || 0), 0) / skills.length
    : 0;
  
  const completedContent = dashData?.profile?.totalContentAnalyzed || 0;
  const streakDays = dashData?.streakDays || 0;

  const growthVelocity = Math.round(avgLevel * 10);
  const retentionRate = Math.min(100, Math.round(50 + avgLevel * 5));
  const focusRate = Math.min(100, Math.round(60 + completedContent * 2));
  const fatigueIndex = Math.max(10, Math.min(80, 50 - Math.round(avgLevel * 3)));

  // Generate a summary from real data
  const topSkills = [...skills]
    .sort((a: any, b: any) => (b.current_level || 0) - (a.current_level || 0))
    .slice(0, 3);
  
  const weakSkills = [...skills]
    .sort((a: any, b: any) => (a.current_level || 0) - (b.current_level || 0))
    .slice(0, 2);

  const aiSummary = skills.length > 0
    ? `You're making progress across ${skills.length} skill${skills.length > 1 ? 's' : ''}. ${topSkills.length > 0 ? `Your strongest area is ${topSkills[0]?.skill_name || topSkills[0]?.skill} at level ${(topSkills[0]?.current_level || 0).toFixed(1)}.` : ''} ${weakSkills.length > 0 ? `Focus more on ${weakSkills[0]?.skill_name || weakSkills[0]?.skill} to balance your growth.` : ''}`
    : "Complete your onboarding and start consuming content to see your learning analytics here.";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white">Skill <span className="text-purple-400">Sandbox</span></h1>
        <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-purple-400" />
          <span>Your real-time skill analytics — powered by your content consumption.</span>
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
          <p className="text-sm text-emerald-300">Avg skill level: {avgLevel.toFixed(1)}/10</p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Focus Rate</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl text-white">{focusRate}%</p>
          <p className="text-sm text-emerald-300">{completedContent} items consumed</p>
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

      {/* Skill Breakdown */}
      {skills.length > 0 && (
        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-4">
          <h2 className="text-xl text-white">Your Skills</h2>
          <div className="space-y-3">
            {skills.map((s: any, i: number) => {
              const level = s.current_level || 0;
              const pct = Math.round(level * 10);
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-zinc-300 w-40 truncate">{s.skill_name || s.skill}</span>
                  <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, pct)}%`,
                        background: pct > 60 ? 'linear-gradient(90deg, #a855f7, #22c55e)' : 'linear-gradient(90deg, #6d28d9, #a855f7)',
                      }}
                    />
                  </div>
                  <span className="text-sm text-zinc-400 w-20 text-right">
                    {level.toFixed(1)} / 10
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 w-24 text-center">
                    {s.level_label || "Beginner"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Weekly Insights Summary */}
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
            <span className="text-sm text-zinc-300">Based on real progress</span>
          </div>
          <SkillHeatmap skillMatrix={skillMatrix} />
        </Card>
      )}
    </div>
  );
};
