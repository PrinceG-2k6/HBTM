import React, { useEffect, useState } from "react";
import { Trophy, Lock, Star, Sparkles, Zap, Rocket, Flame, Brain, FileText, Code, Target, Award, Globe, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { AchievementsResponse } from "../api";

const CATEGORY_COLORS: Record<string, string> = {
  "Streak":    "bg-orange-100 border-orange-200",
  "Milestone": "bg-amber-100 border-amber-200",
  "Project":   "bg-blue-100 border-blue-200",
  "Learning":  "bg-emerald-100 border-emerald-200",
  "Community": "bg-violet-100 border-violet-200",
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Rocket: <Rocket size={24} className="text-amber-600" />,
  Flame: <Flame size={24} className="text-orange-500" />,
  Zap: <Zap size={24} className="text-yellow-500" />,
  Brain: <Brain size={24} className="text-violet-600" />,
  FileText: <FileText size={24} className="text-blue-600" />,
  Code: <Code size={24} className="text-emerald-600" />,
  Target: <Target size={24} className="text-rose-500" />,
  Trophy: <Trophy size={24} className="text-amber-500" />,
  Award: <Award size={24} className="text-purple-600" />,
  Globe: <Globe size={24} className="text-teal-600" />,
};

export const AchievementsPage: React.FC = () => {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    apiService.getAchievements().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12"><SkeletonCard rows={2} /><SkeletonCard rows={8} /></div>
  );
  if (!data) return null;

  const { achievements, totalXP, unlockedCount } = data;
  const filtered = filter === "unlocked" ? achievements.filter(a => a.unlocked)
    : filter === "locked" ? achievements.filter(a => !a.unlocked)
    : achievements;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Achievements</h1>
        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
          <Trophy size={16} className="text-amber-600" />
          <span>Your learning milestones, streaks, and accomplishments — earned on PACER.</span>
        </p>
      </div>

      {/* XP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <div className="text-2xs text-amber-700 uppercase tracking-wider">Total XP Earned</div>
            <div className="text-3xl text-amber-900">{totalXP.toLocaleString()}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Trophy size={22} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xs text-gray-500 uppercase tracking-wider">Unlocked</div>
            <div className="text-3xl text-gray-900">{unlockedCount} / {achievements.length}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
            <Star size={22} className="text-violet-600" />
          </div>
          <div>
            <div className="text-2xs text-gray-500 uppercase tracking-wider">In Progress</div>
            <div className="text-3xl text-gray-900">{achievements.filter(a => !a.unlocked && (a.progressCurrent ?? 0) > 0).length}</div>
          </div>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unlocked", "locked"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs cursor-pointer transition-all border flex items-center gap-1.5 ${
              filter === f ? "bg-black text-white border-black" : "bg-white/60 text-gray-700 border-white/80 hover:bg-white/80"
            }`}>
            {f === "all" ? "All" : f === "unlocked" ? <><CheckCircle2 size={12} /> Unlocked ({unlockedCount})</> : <><Lock size={12} /> Locked ({achievements.length - unlockedCount})</>}
          </button>
        ))}
      </div>

      {/* Achievement cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(ach => (
          <Card key={ach.id}
            className={`flex flex-col gap-3 border-2 transition-all ${
              ach.unlocked
                ? `${CATEGORY_COLORS[ach.category]} shadow-sm hover:shadow-md`
                : "bg-gray-50/80 border-gray-200 opacity-60 grayscale"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/80 border border-black/5 flex items-center justify-center">
                {ICON_MAP[ach.icon] || <Trophy size={24} className="text-amber-500" />}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-2xs px-2 py-0.5 rounded-full ${
                  ach.unlocked ? "bg-white/60 text-gray-700" : "bg-gray-200 text-gray-500"
                }`}>{ach.category}</span>
                <span className="flex items-center gap-1 text-2xs text-amber-700">
                  <Zap size={10} />{ach.xpReward} XP
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-900 flex items-center gap-1.5">
                {ach.unlocked ? <Sparkles size={13} className="text-amber-500" /> : <Lock size={13} className="text-gray-400" />}
                {ach.title}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">{ach.description}</p>
            </div>

            {ach.unlocked ? (
              <div className="text-2xs text-emerald-700 flex items-center gap-1 mt-auto">
                <CheckCircle2 size={12} /> Unlocked {ach.unlockedAt}
              </div>
            ) : (
              ach.progressCurrent !== undefined && ach.progressTarget !== undefined && (
                <div className="mt-auto space-y-1">
                  <div className="flex justify-between text-2xs text-gray-500">
                    <span>Progress</span>
                    <span>{ach.progressCurrent} / {ach.progressTarget}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (ach.progressCurrent / ach.progressTarget) * 100)}%` }} />
                  </div>
                </div>
              )
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

