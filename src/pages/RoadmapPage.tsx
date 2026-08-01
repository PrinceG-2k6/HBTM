import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Sparkles, BookOpen, ArrowRight, ExternalLink, ShieldCheck,
  Target, TrendingUp, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, PlayCircle
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { TopicBubbleChart } from "../components/charts/TopicBubbleChart";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { RoadmapDataResponse, TopicProgress } from "../api";

const LEARNING_PATHS = [
  { id: "all", label: "All Tracks" },
  { id: "research", label: "Research Track" },
  { id: "product", label: "Product Track" },
  { id: "backend", label: "Backend AI Track" },
  { id: "startup", label: "Startup Track" },
];

const SCHEDULE_STYLES: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  "on-track": { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 size={12} />, label: "On Track" },
  "ahead":    { cls: "bg-blue-100 text-blue-800 border-blue-200",         icon: <TrendingUp size={12} />,   label: "Ahead" },
  "behind":   { cls: "bg-red-100 text-red-800 border-red-200",            icon: <AlertCircle size={12} />,   label: "Behind" },
};

export const RoadmapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [data, setData] = useState<RoadmapDataResponse | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activeTrack, setActiveTrack] = useState("all");
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [roadmapRes, analysisRes] = await Promise.all([
          apiService.getRoadmapData(),
          apiService.getCognitiveAnalysis(),
        ]);
        setData(roadmapRes);
        setTopicProgress(analysisRes.topicProgress);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
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

  if (!data) return null;

  const { stages, adaptedCount } = data;

  const filtered = filter === "adapted" ? stages.filter(s => s.status === "ai-adapted") : stages;
  const searched = searchQuery
    ? filtered.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.items.some(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())))
    : filtered;

  const overallProgress = Math.round(stages.reduce((s, st) => s + st.progressPercent, 0) / stages.length);
  const bubbleTopics = activeStageId ? topicProgress.filter(t => t.relatedStageId === activeStageId) : topicProgress;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-zinc-100">Your Growth <span className="text-amber-400">Roadmap</span></h1>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-400" />
            <span>The curator continuously adapts your path based on your evolving identity, habits, and skill gaps.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md p-1.5 rounded-full border border-white/80 shadow-2xs">
          {["all", "adapted"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs cursor-pointer transition-all ${filter === f ? (f === "adapted" ? "bg-amber-400 text-amber-950" : "bg-black text-white") : "text-gray-700 hover:bg-black/5"}`}>
              {f === "all" ? `All Stages (${stages.length})` : `AI Adapted (${adaptedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Learning Path Tabs */}
      <div className="flex flex-wrap gap-2">
        {LEARNING_PATHS.map(track => (
          <button key={track.id} onClick={() => setActiveTrack(track.id)}
            className={`px-4 py-2 rounded-full text-xs cursor-pointer transition-all border ${
              activeTrack === track.id
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white/60 text-gray-700 border-white/80 hover:bg-white/80"
            }`}>
            {track.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#e4e4e7" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#f59e0b" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - overallProgress / 100)}
                transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-900">{overallProgress}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Overall Progress</div>
            <div className="text-base text-gray-900 mt-0.5">Roadmap Completion</div>
            <div className="text-xs text-gray-500">{stages.filter(s => s.status === "completed").length}/{stages.length} stages done</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock size={22} className="text-amber-700" />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Active Stage</div>
            <div className="text-sm text-gray-900 mt-0.5">{stages.find(s => s.status === "in-progress")?.title.split(" ").slice(0, 3).join(" ") ?? "–"}</div>
            <div className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
              <Clock size={10} />{stages.find(s => s.status === "in-progress")?.remainingDays} days remaining
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Target size={22} className="text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Topics Tracked</div>
            <div className="text-base text-gray-900 mt-0.5">{topicProgress.length} Topics</div>
            <div className="text-xs text-gray-500 mt-0.5">{topicProgress.filter(t => t.completedPercent === 100).length} fully mastered</div>
          </div>
        </Card>
      </div>

      {searchQuery && (
        <div className="bg-amber-100/80 border border-amber-300 rounded-2xl p-3 text-xs text-amber-900 flex items-center justify-between">
          <span>Filtering for: <strong>"{searchQuery}"</strong></span>
          <Link to="/roadmap" className="underline">Clear</Link>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          {searched.map((stage) => {
            const sched = SCHEDULE_STYLES[stage.scheduleStatus];
            const isExpanded = expandedStageId === stage.id;
            return (
              <Card key={stage.id}
                className={`space-y-4 border-white/80 cursor-pointer transition-all duration-200 ${activeStageId === stage.id ? "ring-2 ring-amber-400/60" : ""}`}
                onClick={() => setActiveStageId(activeStageId === stage.id ? null : stage.id)}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-2xl bg-black text-white flex items-center justify-center text-xs">S{stage.stageNumber}</div>
                    <div>
                      <h3 className="text-base text-gray-900">{stage.title}</h3>
                      <p className="text-xs text-gray-500">{stage.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={stage.status === "ai-adapted" ? "ai-adapted" : "upcoming"}>
                      {stage.status === "ai-adapted" ? "AI Adapted" : stage.status === "in-progress" ? "In Progress" : "Upcoming"}
                    </Badge>
                    <div className={`flex items-center gap-1 text-2xs px-2 py-1 rounded-full border ${sched.cls}`}>
                      {sched.icon}<span>{sched.label}</span>
                    </div>
                  </div>
                </div>

                {/* Time info */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400" />{stage.estimatedDays}d estimated</span>
                  {stage.remainingDays > 0 && <span className="flex items-center gap-1 text-amber-700"><Target size={12} />{stage.remainingDays}d remaining</span>}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs text-gray-600">
                    <span>Stage Completion</span><span>{stage.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${stage.progressPercent}%` }} />
                  </div>
                </div>

                {/* Topic pills */}
                <div className="flex flex-wrap gap-2">
                  {topicProgress.filter(t => t.relatedStageId === stage.id).map(t => (
                    <span key={t.id} className="inline-flex items-center gap-1.5 text-2xs bg-white/80 border border-black/10 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.completedPercent >= 80 ? "#22c55e" : t.completedPercent >= 50 ? "#f59e0b" : "#9ca3af" }} />
                      {t.name}<span className="text-gray-400">{t.completedPercent}%</span>
                    </span>
                  ))}
                </div>

                {/* Expandable details */}
                <button
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setExpandedStageId(isExpanded ? null : stage.id); }}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? "Hide" : "Show"} stage details
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1" onClick={e => e.stopPropagation()}>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <p className="text-2xs uppercase tracking-wider text-emerald-700 mb-1.5">Skills Gained</p>
                      <div className="space-y-1">
                        {stage.skillsGained.map(s => (
                          <div key={s} className="flex items-center gap-1.5 text-xs text-emerald-800">
                            <CheckCircle2 size={11} className="shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                      <p className="text-2xs uppercase tracking-wider text-amber-700 mb-1.5">Prerequisites</p>
                      <div className="space-y-1">
                        {stage.prerequisites.map(p => (
                          <div key={p} className="flex items-center gap-1.5 text-xs text-amber-800">
                            <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />{p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <p className="text-2xs uppercase tracking-wider text-zinc-600 mb-1.5">Career Impact</p>
                      <p className="text-xs text-zinc-700 leading-relaxed">{stage.careerImpact}</p>
                    </div>
                  </div>
                )}

                {/* Stage Items */}
                <div className="space-y-3 pt-1">
                  {stage.items.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-white/60 border border-gray-200/80 hover:border-black/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-2xs bg-zinc-900 text-white px-2 py-0.5 rounded-full">{item.type}</span>
                            <span className="text-2xs text-gray-500">{item.estTime}</span>
                            <span className="text-2xs text-emerald-700">{item.skillGain}</span>
                          </div>
                          <h4 className="text-sm text-gray-900 mt-1">{item.title}</h4>
                          <p className="text-xs text-gray-600 mt-0.5"><strong className="text-gray-900">Curator Logic:</strong> {item.reasoning}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-2xs">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <ShieldCheck size={12} />{item.intentionalityScore}% Signal
                        </span>
                        <Link to="/learning-lab" className="px-3 py-1 rounded-full bg-black text-white text-2xs hover:bg-gray-800 transition-colors flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <PlayCircle size={10} />Open Interactive<ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="space-y-3">
            <div>
              <h3 className="text-sm text-gray-900 flex items-center gap-2">
                <Target size={16} className="text-amber-600" />
                {activeStageId ? `Stage Topics` : "All Topic Progress"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Click a stage card to filter</p>
            </div>
            <TopicBubbleChart topics={bubbleTopics} />
            {activeStageId && (
              <button className="text-xs text-gray-500 underline cursor-pointer" onClick={() => setActiveStageId(null)}>
                Show all topics
              </button>
            )}
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm text-gray-900 flex items-center gap-2">
              <BookOpen size={16} className="text-amber-600" />Human Potential vs Dopamine
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Unlike traditional algorithms that maximize attention, PACER measures your <strong>actual comprehension rate</strong> and auto-suppresses fluff.
            </p>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
              <div className="flex justify-between text-amber-900"><span>Signal vs Noise Filter</span><span>94.2%</span></div>
              <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden"><div className="bg-amber-600 h-full w-[94.2%]" /></div>
              <p className="text-2xs text-amber-800">42 clickbait links auto-blocked this sprint.</p>
            </div>
          </Card>

          <Card dark className="space-y-3">
            <h3 className="text-sm text-white">Adjust Curation Pace</h3>
            <p className="text-xs text-zinc-400">Overwhelmed or need more depth? Recalibrate PACER's pace instantly.</p>
            <button className="w-full py-2.5 rounded-full bg-amber-400 text-amber-950 text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <span>Recalibrate Pace</span><ArrowRight size={14} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
