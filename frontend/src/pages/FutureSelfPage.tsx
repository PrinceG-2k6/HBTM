import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { FutureSelfResponse } from "../api";

export const FutureSelfPage: React.FC = () => {
  const [data, setData] = useState<FutureSelfResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getFutureSelf().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-12"><SkeletonCard rows={4} /><SkeletonCard rows={6} /></div>
  );

  const defaultData: FutureSelfResponse = {
    milestones: [
      {
        period: "3 Months",
        skills: ["Ultradian Focus Protocol", "System Architecture Teardowns"],
        projects: ["Event Sourcing Mini Parser"],
        careerReadiness: 75,
        goalCompletion: 60,
        description: "Complete 100 deep focus blocks and publish 2 technical architecture teardowns.",
      },
      {
        period: "6 Months",
        skills: ["AI Agent Orchestration", "Vector Memory Systems"],
        projects: ["Autonomous Agent Execution Engine"],
        careerReadiness: 88,
        goalCompletion: 40,
        description: "Architect multi-agent autonomous systems with persistent vector memory.",
      },
      {
        period: "1 Year",
        skills: ["Principal Identity Mastery", "Metabolic Stamina"],
        projects: ["Full Identity Curation Platform"],
        careerReadiness: 98,
        goalCompletion: 20,
        description: "Embody complete focus, financial independence, and high physical vitality.",
      },
    ],
    profile: {
      name: "Growth Aspirant",
      avatarUrl: "",
      currentRole: "Personal Growth Aspirant",
      aspirationalIdentity: "Principal AI System Architect & High-Vitality Leader",
      humanPotentialScore: 84,
      humanPotentialBreakdown: {
        taskCompletion: 80,
        consistency: 85,
        appliedPractice: 75,
        reflectionQuality: 80,
        balancedGrowth: 70,
        noveltyLearning: 80,
        passivePenalty: 5,
        total: 84,
      },
      mindfulConsumptionRate: 88,
      weeklyFocusHours: 5.2,
      dopamineTrapsBlocked: 42,
    },
  };

  const activeData = data && data.milestones?.length ? data : defaultData;
  const { milestones, profile } = activeData;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl lg:text-4xl text-white">Future <span className="text-purple-400">Self</span></h1>
        <p className="text-sm text-zinc-300 flex items-center justify-center gap-1.5">
          <Sparkles size={16} className="text-purple-400" />
          <span>Where your learning journey takes you — based on your current trajectory.</span>
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-sm text-zinc-400">Target Identity:</span>
          <span className="text-sm text-purple-300 font-semibold px-3 py-1 rounded-full bg-purple-950/40">{profile?.aspirationalIdentity || "Principal Architect"}</span>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-6">
        {milestones.map((m, idx) => (
          <Card key={idx} className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-300 px-3 py-1 rounded-full bg-purple-950/50">
                {m.period}
              </span>
              <span className="text-sm text-emerald-400">{m.careerReadiness}% Career Readiness</span>
            </div>
            <p className="text-base text-zinc-200 leading-relaxed">{m.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {(m.skills || []).map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                  {s}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
