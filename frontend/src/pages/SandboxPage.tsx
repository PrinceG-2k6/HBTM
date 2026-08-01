import React, { useEffect, useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, Zap, Brain } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkillHeatmap } from "../components/charts/SkillHeatmap";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { InsightsDataResponse } from "../api";

export const SandboxPage: React.FC = () => {
  const [data, setData] = useState<InsightsDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getInsights().then(setData).catch(console.error).finally(() => setLoading(false));
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

  const defaultInsightsData: InsightsDataResponse = {
    metrics: {
      growthVelocity: 88,
      attentionToIntentRatio: 92,
      retentionRate: 85,
      fatigueIndex: 32,
      dailyFocusLogs: [
        { day: "Mon", mindfulHours: 1.5, skimmingHours: 0.5, intentionality: 75 },
        { day: "Tue", mindfulHours: 2.8, skimmingHours: 0.4, intentionality: 88 },
        { day: "Wed", mindfulHours: 1.2, skimmingHours: 0.6, intentionality: 68 },
        { day: "Thu", mindfulHours: 3.4, skimmingHours: 0.3, intentionality: 94 },
        { day: "Fri", mindfulHours: 2.4, skimmingHours: 0.5, intentionality: 82 },
        { day: "Sat", mindfulHours: 1.8, skimmingHours: 0.4, intentionality: 76 },
        { day: "Sun", mindfulHours: 0.9, skimmingHours: 0.7, intentionality: 62 },
      ],
      skillMatrix: [
        { skill: "System Architecture", score: 85, target: 95, category: "Career" },
        { skill: "TypeScript Generics", score: 94, target: 98, category: "Career" },
        { skill: "Focus Protocol", score: 82, target: 90, category: "Mindset" },
        { skill: "Metabolic Health", score: 70, target: 85, category: "Vitality" },
      ],
      topicProgress: [],
    },
    weeklyInsights: {
      hoursStudied: 14.5,
      lessonsCompleted: 8,
      projectsCompleted: 2,
      consistencyPercent: 86,
      strengths: [{ topic: "System Design", score: 90, note: "High retention" }],
      weaknesses: [{ topic: "CQRS Partitioning", score: 65, suggestion: "Review Stage 2 guide" }],
      aiSummary: "High learning consistency across System Architecture and Deep Focus protocols. Your focus quality peak occurs between 9:00 AM and 11:30 AM.",
      suggestedPractice: [],
    },
  };

  const activeData = data || defaultInsightsData;
  const { metrics, weeklyInsights } = activeData;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white">Learning <span className="text-purple-400">Insights</span></h1>
        <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-purple-400" />
          <span>Your weekly learning analytics — powered by PACER cognitive tracking.</span>
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Mindful Focus Rate</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl text-white">{metrics.attentionToIntentRatio}%</p>
          <p className="text-sm text-emerald-300">+8% vs last week</p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Fatigue Index</span>
            <Brain size={18} className="text-purple-400" />
          </div>
          <p className="text-3xl text-white">{metrics.fatigueIndex} / 100</p>
          <p className="text-sm text-purple-300">Optimal stamina level</p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>Retention Rate</span>
            <Zap size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl text-white">{metrics.retentionRate}%</p>
          <p className="text-sm text-amber-300">Target identity aligned</p>
        </Card>
      </div>

      {/* Weekly Insights Summary */}
      <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-purple-300 text-sm">
          <TrendingUp size={18} />
          <span>Curator Weekly Summary</span>
        </div>
        <p className="text-base text-zinc-100 leading-relaxed">
          {weeklyInsights.aiSummary}
        </p>
      </Card>

      {/* Skill Heatmap */}
      <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-white">Skill Mastery Heatmap</h2>
          <span className="text-sm text-zinc-300">Updated today</span>
        </div>
        <SkillHeatmap skillMatrix={metrics.skillMatrix} />
      </Card>
    </div>
  );
};
