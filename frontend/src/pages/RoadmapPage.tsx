import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Sparkles, Clock, Target, CheckCircle2,
  ChevronDown, ChevronUp, PlayCircle
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { RoadmapDataResponse } from "../api";

export const RoadmapPage: React.FC = () => {
  const [data, setData] = useState<RoadmapDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedStageId, setExpandedStageId] = useState<string | null>("stage-1");

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    apiService.getRoadmapData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
        <SkeletonCard rows={2} />
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        <SkeletonCard rows={8} />
      </div>
    );
  }

  const defaultRoadmapData = {
    adaptedCount: 4,
    stages: [
      {
        id: "stage-1",
        stageNumber: 1,
        title: "Stage 1: Neural Focus & Habit Stack Foundation",
        description: "Establish 90-minute focus protocols and eliminate high-dopamine distraction traps.",
        status: "in-progress",
        scheduleStatus: "on-track",
        estimatedDays: 14,
        remainingDays: 5,
        progressPercent: 65,
        careerImpact: "Accelerates daily deep work output by 2.5x and establishes consistent cognitive endurance.",
        skillsGained: ["Ultradian Focus", "Dopamine Management", "Habit Stacking"],
        prerequisites: ["Completed Onboarding Curation Profile"],
        items: [
          { id: "item-1", title: "Huberman Lab: Protocol for Peak Focus", type: "Podcast", duration: "25m", completed: true },
          { id: "item-2", title: "Atomic Habits Re-engineering Guide", type: "Guide", duration: "15m", completed: true },
          { id: "item-3", title: "Execute 1 Ultradian Focus Block Exercise", type: "Action", duration: "45m", completed: false },
        ],
      },
      {
        id: "stage-2",
        stageNumber: 2,
        title: "Stage 2: System Architecture & TypeScript Mastery",
        description: "Master event-driven microservices teardowns, CQRS patterns, and generic type inference.",
        status: "ai-adapted",
        scheduleStatus: "on-track",
        estimatedDays: 21,
        remainingDays: 14,
        progressPercent: 40,
        careerImpact: "Prepares you for Principal AI System Architect roles and scalable backend design.",
        skillsGained: ["System Architecture", "TypeScript Generics", "CQRS Pattern"],
        prerequisites: ["Stage 1 Focus Protocol"],
        items: [
          { id: "item-4", title: "Designing Data-Intensive Applications (Ch 5)", type: "Book", duration: "45m", completed: true },
          { id: "item-5", title: "Microservices Anti-Patterns Video Teardown", type: "Video", duration: "20m", completed: false },
          { id: "item-6", title: "Implement Event Sourcing Mini Parser", type: "Action", duration: "30m", completed: false },
        ],
      },
      {
        id: "stage-3",
        stageNumber: 3,
        title: "Stage 3: Autonomous AI Agent Orchestration",
        description: "Build multi-agent autonomous execution loops with persistent vector memory.",
        status: "upcoming",
        scheduleStatus: "on-track",
        estimatedDays: 30,
        remainingDays: 30,
        progressPercent: 10,
        careerImpact: "Unlocks cutting-edge AI engineering abilities for next-gen agentic platforms.",
        skillsGained: ["Vector Memory", "Tool Schema Definition", "Agentic Loops"],
        prerequisites: ["Stage 2 System Architecture"],
        items: [
          { id: "item-7", title: "Autonomous Agent Memory Systems Breakdown", type: "Guide", duration: "20m", completed: false },
          { id: "item-8", title: "Build Tool Calling & Execution Loop", type: "Action", duration: "60m", completed: false },
        ],
      },
    ],
  };

  const activeData = data || defaultRoadmapData;
  const { stages } = activeData;

  const filtered = filter === "adapted" ? stages.filter((s: any) => s.status === "ai-adapted") : stages;
  const searched = searchQuery
    ? filtered.filter((s: any) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.items || []).some((i: any) => i.title.toLowerCase().includes(searchQuery.toLowerCase())))
    : filtered;

  const overallProgress = Math.round(stages.reduce((s: number, st: any) => s + (st.progressPercent || 0), 0) / (stages.length || 1));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white">Your Growth <span className="text-purple-400">Roadmap</span></h1>
          <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
            <Sparkles size={16} className="text-purple-400" />
            <span>The curator continuously adapts your path based on your evolving identity, habits, and skill gaps.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/60 p-1.5 rounded-full border border-purple-500/20 shadow-lg">
          {["all", "adapted"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                filter === f
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              {f === "all" ? `All Stages (${stages.length})` : `AI Adapted (${activeData.adaptedCount || 4})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl p-6">
          <div className="relative flex-shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#27272a" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#a855f7" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - overallProgress / 100)}
                transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{overallProgress}%</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Overall Progress</div>
            <div className="text-lg text-white font-medium mt-0.5">Roadmap Completion</div>
            <div className="text-xs text-purple-300">{stages.filter((s: any) => s.status === "completed").length}/{stages.length} stages done</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 flex items-center justify-center flex-shrink-0">
            <Clock size={22} className="text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Active Stage</div>
            <div className="text-sm text-white font-medium mt-0.5">
              {stages.find((s: any) => s.status === "in-progress")?.title.split(": ")[1] || "Stage 1 Focus Protocol"}
            </div>
            <div className="text-xs text-purple-300 mt-0.5 flex items-center gap-1">
              <Clock size={12} />{stages.find((s: any) => s.status === "in-progress")?.remainingDays || 5} days remaining
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 flex items-center justify-center flex-shrink-0">
            <Target size={22} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Career Alignment</div>
            <div className="text-lg text-white font-medium mt-0.5">Principal AI Architect</div>
            <div className="text-xs text-emerald-400 mt-0.5">High identity match</div>
          </div>
        </Card>
      </div>

      {/* Main Roadmap Stages List */}
      <div className="space-y-6">
        {searched.map((stage: any) => {
          const isExpanded = expandedStageId === stage.id;
          return (
            <Card
              key={stage.id}
              className={`p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-4 transition-all duration-200 ${
                isExpanded ? "ring-2 ring-purple-500/60" : ""
              }`}
            >
              {/* Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-sm">
                    S{stage.stageNumber || 1}
                  </div>
                  <div>
                    <h3 className="text-xl text-white font-medium">{stage.title}</h3>
                    <p className="text-sm text-zinc-300 mt-0.5">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    stage.status === "ai-adapted"
                      ? "bg-purple-500/20 text-purple-300"
                      : stage.status === "in-progress"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {stage.status === "ai-adapted" ? "AI Adapted" : stage.status === "in-progress" ? "In Progress" : "Upcoming"}
                  </span>
                  <button
                    onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Progress & Time Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-zinc-300">
                  <span>Stage Progress</span>
                  <span className="text-purple-300 font-semibold">{stage.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stage.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* Expanded Items */}
              {isExpanded && (
                <div className="space-y-4 pt-3 border-t border-white/5">
                  <p className="text-sm text-zinc-300 font-semibold uppercase tracking-wider">Curated Stage Resources</p>
                  <div className="space-y-2.5">
                    {(stage.items || []).map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-zinc-950/60 hover:bg-purple-950/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2
                            size={18}
                            className={item.completed ? "text-emerald-400" : "text-zinc-600"}
                          />
                          <div>
                            <p className={`text-sm font-medium ${item.completed ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                              {item.title}
                            </p>
                            <span className="text-xs text-purple-300">{item.type} • {item.duration}</span>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white transition-all cursor-pointer">
                          <PlayCircle size={14} /> Start
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-950/30 text-xs text-purple-200 leading-relaxed">
                    💡 <strong>Career Impact</strong>: {stage.careerImpact}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
