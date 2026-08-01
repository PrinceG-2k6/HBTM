import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, ShieldCheck, Zap, BarChart2, Star, AlertTriangle, PlayCircle, Brain } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkillHeatmap } from "../components/charts/SkillHeatmap";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { InsightsDataResponse } from "../api";

export const InsightsPage: React.FC = () => {
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

  if (!data) return null;

  const { metrics, weeklyInsights } = data;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Learning <span>Insights</span></h1>
        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-amber-600" />
          <span>Your weekly learning analytics — powered by PACER cognitive tracking.</span>
        </p>
      </div>

      {/* Weekly Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hours Studied",    value: `${weeklyInsights.hoursStudied}h`, icon: <BarChart2 size={20} className="text-amber-600" />, bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Lessons Done",     value: weeklyInsights.lessonsCompleted,   icon: <ShieldCheck size={20} className="text-emerald-600" />, bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Projects",         value: weeklyInsights.projectsCompleted,  icon: <Zap size={20} className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Consistency",      value: `${weeklyInsights.consistencyPercent}%`, icon: <TrendingUp size={20} className="text-violet-600" />, bg: "bg-violet-50", border: "border-violet-200" },
        ].map(stat => (
          <Card key={stat.label} className={`${stat.bg} ${stat.border} flex items-center gap-3`}>
            <div className="shrink-0">{stat.icon}</div>
            <div>
              <div className="text-2xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              <div className="text-2xl text-gray-900">{stat.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Weekly Summary */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-zinc-700">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Brain size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm text-white flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-amber-400" />
              AI-Generated Weekly Summary
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{weeklyInsights.aiSummary}</p>
          </div>
        </div>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <Card className="space-y-4">
          <h3 className="text-base text-gray-900 flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-400" />
            Your Strengths
          </h3>
          <div className="space-y-3">
            {(weeklyInsights?.strengths || []).map((s: any, i: number) => (
              <div key={i} className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-emerald-900">{s.topic}</span>
                  <span className="text-sm text-emerald-700">{s.score}%</span>
                </div>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${s.score}%` }} />
                </div>
                <p className="text-xs text-emerald-700">{s.note}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Weaknesses */}
        <Card className="space-y-4">
          <h3 className="text-base text-gray-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            Areas to Focus
          </h3>
          <div className="space-y-3">
            {(weeklyInsights?.weaknesses || []).map((w: any, i: number) => (
              <div key={i} className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-orange-900">{w.topic}</span>
                  <span className="text-sm text-orange-700">{w.score}%</span>
                </div>
                <div className="w-full bg-orange-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${w.score}%` }} />
                </div>
                <p className="text-xs text-orange-700">{w.suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Suggested Practice */}
      <Card className="space-y-4">
        <h3 className="text-base text-gray-900">Suggested Practice for Weak Topics</h3>
        <p className="text-xs text-gray-500">PACER curated these specifically to address your knowledge gaps.</p>
        <div className="space-y-3">
          {(weeklyInsights?.suggestedPractice || []).map((practice: any, i: number) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/60 border border-black/5 hover:border-amber-300/60 transition-all flex items-start justify-between gap-3">
              <div>
                <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">{practice.type}</span>
                <h4 className="text-base text-gray-900 mt-1.5">{practice.title}</h4>
                <p className="text-sm text-gray-600 mt-0.5">{practice.reason}</p>
              </div>
              <Link to={practice.route || "/learning-lab"}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors shrink-0">
                <PlayCircle size={13} />Start
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* Skill Heatmap */}
      <Card className="space-y-4">
        <div>
          <h3 className="text-base text-gray-900">Skill Mastery Heatmap</h3>
          <p className="text-xs text-gray-500">Color intensity = mastery level. Hover for details.</p>
        </div>
        <SkillHeatmap skillMatrix={metrics?.skillMatrix || []} />
      </Card>

      {/* Domain bar breakdown */}
      <Card className="space-y-4">
        <h3 className="text-base text-gray-900">Domain Progress</h3>
        <div className="space-y-3">
          {(metrics?.skillMatrix || []).map((skill: any) => (
            <div key={skill.skill}>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>{skill.skill}</span>
                <span className="text-gray-500">{skill.score}% / {skill.target}% target</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden relative">
                <div className="bg-black h-full rounded-full transition-all duration-700" style={{ width: `${skill.score}%` }} />
                <div className="absolute top-0 h-full border-r-2 border-amber-500 opacity-70" style={{ left: `${skill.target}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-black" /><span>Current Score</span></div>
          <div className="flex items-center gap-1.5"><div className="w-0.5 h-3 bg-amber-500" /><span>Target Goal</span></div>
        </div>
      </Card>
    </div>
  );
};
