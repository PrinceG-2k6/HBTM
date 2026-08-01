import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Sparkles, AlertTriangle, Brain, ShieldCheck, Zap, BookOpen,
  Filter, Target, Trophy, Flame, Bookmark, BookmarkCheck,
  Info, PlayCircle, Star, Clock, Lightbulb, Check
} from "lucide-react";

import { Card } from "../components/ui/Card";
import { ActivityChart } from "../components/charts/ActivityChart";
import { TopicBubbleChart } from "../components/charts/TopicBubbleChart";
import { HumanPotentialScore } from "../components/dashboard/HumanPotentialScore";
import { DrawerModal } from "../components/ui/DrawerModal";
import { ReflectionModal } from "../components/ReflectionModal";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { DashboardDataResponse, TopicProgress } from "../api";
import type { CuratedResource } from "../api/types";

const DIFF_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-950 text-emerald-300 border border-emerald-800",
  Intermediate: "bg-amber-950 text-amber-300 border border-amber-800",
  Advanced: "bg-rose-950 text-rose-300 border border-rose-800",
};

const ResourceCard: React.FC<{
  item: CuratedResource;
  onBookmark: (id: string) => void;
  onExplain: (item: CuratedResource) => void;
  onLearn: (title: string) => void;
}> = ({ item, onBookmark, onExplain, onLearn }) => (
  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-400/50 transition-all group shadow-md">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-2xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">{item.type}</span>
          <span className="text-2xs text-zinc-400">{item.estTime}</span>
          <span className={`text-2xs px-2 py-0.5 rounded-full ${DIFF_COLORS[item.difficulty]}`}>{item.difficulty}</span>
        </div>
        <h4 className="text-sm font-semibold text-white leading-snug">{item.title}</h4>
        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
          <Star size={10} className="fill-emerald-400 text-emerald-400" />
          Skill gain: {item.skillGain}
        </p>
        <p className="text-xs text-zinc-300 mt-1">
          <strong className="text-white">Why:</strong> {item.reasoning}
        </p>
      </div>
      <button
        onClick={() => onBookmark(item.id)}
        className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
      >
        {item.bookmarked
          ? <BookmarkCheck size={14} className="text-amber-400" />
          : <Bookmark size={14} className="text-zinc-500" />
        }
      </button>
    </div>

    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 gap-2">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 flex items-center gap-1 text-2xs font-medium">
          <ShieldCheck size={12} />{item.intentionalityScore}% Signal
        </span>
        <button
          onClick={() => onExplain(item)}
          className="flex items-center gap-1 text-2xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Info size={11} /> Why this?
        </button>
      </div>
      <button
        onClick={() => onLearn(item.title)}
        className="flex items-center gap-1.5 text-2xs px-3 py-1.5 rounded-full bg-amber-400 text-amber-950 font-semibold hover:bg-amber-300 transition-colors cursor-pointer"
      >
        <PlayCircle size={12} /> Continue Learning
      </button>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    "task-1": true, "task-2": true, "task-3": false, "task-4": false,
  });
  const [openSection, setOpenSection] = useState<string | null>("identity");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [explainItem, setExplainItem] = useState<CuratedResource | null>(null);
  const [reflectionLesson, setReflectionLesson] = useState<string | null>(null);

  useEffect(() => {
    apiService.getDashboardData().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleTask = (id: string) => setCompletedTasks(prev => ({ ...prev, [id]: !prev[id] }));

  const handleBookmark = (id: string) => setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 pt-2">
        <SkeletonCard rows={2} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SkeletonCard rows={4} /><SkeletonCard rows={4} /><SkeletonCard rows={4} />
        </div>
        <SkeletonCard rows={6} />
      </div>
    );
  }

  if (!data) return null;

  const { profile, intervention, resources, metrics, todayMission, aiCoach, learningConsistency, goalPlanner } = data;
  const overallProgress = profile.overallRoadmapProgress;
  const circumference = 2 * Math.PI * 38;
  const progressOffset = circumference - (overallProgress / 100) * circumference;

  const activeTasks = [
    { id: "task-1", title: "12-Min Negotiation Tactics Podcast", time: "08:30 AM", type: "Podcast" },
    { id: "task-2", title: "Record 2-Min Impromptu Speech", time: "10:30 AM", type: "Practice" },
    { id: "task-3", title: "Psychology of Money — Key Chapter", time: "12:30 PM", type: "Book Summary" },
    { id: "task-4", title: "AI Agents & Human Growth — Paper", time: "04:00 PM", type: "Research" },
  ];
  const completedCount = Object.values(completedTasks).filter(Boolean).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-amber-400">{profile.name}</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
            <Brain size={16} className="text-amber-400" />
            <span>Identity: <strong className="text-zinc-200">{profile.aspirationalIdentity}</strong></span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-800 shadow-md text-xs">
            <span className="text-zinc-400">Human Potential Index</span>
            <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">{profile.humanPotentialScore}/100</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-800 shadow-md text-xs">
            <span className="text-zinc-400">Mindful Rate</span>
            <span className="bg-emerald-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full">{profile.mindfulConsumptionRate}%</span>
          </div>
          <div className="hidden xl:flex items-center gap-6 ml-3 border-l border-zinc-800 pl-5">
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{overallProgress}%</div>
              <div className="text-2xs text-zinc-400 uppercase tracking-wider">Roadmap</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-400">{profile.activeStreakDays}d</div>
              <div className="text-2xs text-zinc-400 uppercase tracking-wider">Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's Mission + AI Coach + Consistency row ─ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Today's Mission */}
        <Card dark className="flex flex-col gap-3 border-zinc-800">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-zinc-400 font-semibold">Today's Mission</span>
              <span className="text-2xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                {todayMission.taskType}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mt-2 leading-snug">{todayMission.taskTitle}</h3>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-2xs text-zinc-400">
              <span>Progress</span><span className="text-amber-400 font-mono">{todayMission.progressPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${todayMission.progressPercent}%` }} />
            </div>
          </div>
          <div className="text-2xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5"><Clock size={12} className="text-zinc-400" /><span>Est. {todayMission.estimatedMinutes} min</span></div>
            <div className="flex items-center gap-1.5"><Target size={12} className="text-amber-400" /><span className="text-amber-300">{todayMission.reward}</span></div>
          </div>
          <Link
            to={todayMission.route}
            className="mt-auto w-full py-2.5 rounded-full bg-amber-400 text-amber-950 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-amber-300 transition-colors"
          >
            <PlayCircle size={14} /> Continue Learning
          </Link>
        </Card>

        {/* AI Coach */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">AI Coach Recommendation</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${aiCoach.energyLevel === "High" ? "bg-emerald-400" : aiCoach.energyLevel === "Medium" ? "bg-amber-400" : "bg-rose-400"}`} />
                <span className="text-2xs text-zinc-400">{aiCoach.energyLevel} Energy Day</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{aiCoach.message}</p>
          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-amber-500/30 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Target size={12} className="text-amber-400" />
              <span className="text-white font-medium">Focus today:</span>
            </div>
            <p className="text-amber-300 text-2xs">{aiCoach.focusTopic}</p>
          </div>
          <p className="text-2xs text-zinc-400 italic flex items-center gap-1">
            <Lightbulb size={12} className="text-amber-400 shrink-0" /> {aiCoach.tip}
          </p>
        </Card>

        {/* Learning Consistency */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Learning Consistency</h3>
            <Trophy size={16} className="text-amber-400" />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white flex items-center gap-1">
                <Flame size={22} className="text-orange-500" />
                {learningConsistency.currentStreak}
              </div>
              <div className="text-2xs text-zinc-400 mt-0.5">Day Streak</div>
              <div className="text-2xs text-zinc-500">Best: {learningConsistency.bestStreak}d</div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex justify-between text-2xs text-zinc-400 mb-1">
                  <span>Weekly Consistency</span><span className="text-emerald-400 font-semibold">{learningConsistency.weeklyConsistencyPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${learningConsistency.weeklyConsistencyPercent}%` }} />
                </div>
              </div>
              <div className="text-xs text-zinc-300">{learningConsistency.weeklyHours}h study this week</div>
            </div>
          </div>

          {/* Daily dots */}
          <div className="flex items-center justify-between gap-1">
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs transition-all ${
                  learningConsistency.dailyGoalMet[i] ? "bg-emerald-500 text-white font-bold" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {learningConsistency.dailyGoalMet[i] ? <Check size={12} /> : d}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Profile + Main Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Profile Card (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="p-0 overflow-hidden border-zinc-800">
            <div className="h-48 w-full relative">
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex flex-col justify-end p-5 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl">{profile.name}</h2>
                    <p className="text-xs text-zinc-300">{profile.currentRole}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs">{profile.curatorStatus}</span>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2 text-sm">
              {[
                { key: "identity", icon: <Sparkles size={14} className="text-amber-400" />, label: "Aspirational Identity", content: <p className="text-xs text-zinc-300 mt-1 leading-relaxed pl-1">{profile.aspirationalIdentity}</p> },
                { key: "filters", icon: <Filter size={14} className="text-zinc-400" />, label: "Active Curator Filters", content: <div className="mt-1 space-y-1 pl-1 text-xs text-zinc-300"><p>• Suppress passive short-form video loops</p><p>• Prioritize identity-aligned podcasts & papers</p><p>• Enforce 45-min intentional sessions</p></div> },
                { key: "milestone", icon: <Zap size={14} className="text-emerald-400" />, label: "Current Milestone", content: <div className="mt-1 text-xs text-emerald-300 pl-1 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">{profile.currentMilestone}</div> },
              ].map(({ key, icon, label, content }) => (
                <div key={key} className="border-b last:border-0 border-zinc-800/80 pb-2 last:pb-0">
                  <button onClick={() => setOpenSection(openSection === key ? null : key)} className="w-full flex items-center justify-between text-zinc-200 py-1">
                    <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-400">{icon}<span>{label}</span></span>
                    {openSection === key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openSection === key && content}
                </div>
              ))}
            </div>
          </Card>

          {/* Human Potential Score */}
          <Card className="space-y-2">
            <HumanPotentialScore
              score={profile.humanPotentialScore}
              breakdown={profile.humanPotentialBreakdown}
            />
          </Card>

          {/* Goal Planner */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-amber-400" />
              <h3 className="text-sm text-white">Life Goal Planner</h3>
            </div>
            <div>
              <p className="text-xs text-white">{goalPlanner.careerGoal}</p>
              <p className="text-2xs text-zinc-400 mt-0.5">Target: {goalPlanner.targetDate} · {goalPlanner.weeklyStudyHours}h/week</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-2xs text-zinc-400"><span>Overall Progress</span><span className="text-amber-400">{goalPlanner.progressPercent}%</span></div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-700" style={{ width: `${goalPlanner.progressPercent}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              {goalPlanner.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                  {m.done ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <Circle size={14} className="text-zinc-600 shrink-0" />}
                  <span className={m.done ? "line-through text-zinc-500" : ""}>{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 8 cols */}
        <div className="lg:col-span-8 space-y-5">

          {/* Row: Progress Ring + Bar Chart + Action Stack */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Roadmap Progress Ring */}
            <Card className="flex flex-col items-center justify-center gap-3 py-4">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold self-start">Roadmap Progress</h3>
              <div className="relative">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#f59e0b" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progressOffset}
                    transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{overallProgress}%</span>
                  <span className="text-2xs text-zinc-400">Done</span>
                </div>
              </div>
              <Link to="/roadmap" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium">
                <Target size={12} /><span>View Roadmap</span><ArrowUpRight size={12} />
              </Link>
            </Card>

            {/* Weekly Hours Bar */}
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Growth Velocity</h3>
                  <div className="text-2xl font-bold text-white mt-1">{profile.weeklyFocusHours}h</div>
                  <span className="text-2xs text-zinc-400">Mindful focus this week</span>
                </div>
                <Link to="/insights" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <ArrowUpRight size={18} className="text-zinc-400" />
                </Link>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-20 px-1 mt-3">
                {["M","T","W","T","F","S","S"].map((day, idx) => {
                  const heights = [35,70,50,25,60,45,30];
                  const isPeak = idx === 1;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      {isPeak && <span className="text-2xs bg-amber-400 text-amber-950 font-bold px-1 py-0.5 rounded-full -mb-1">5.2h</span>}
                      <div className="w-full bg-zinc-800 rounded-full h-14 flex items-end overflow-hidden">
                        <div className={`w-full rounded-full transition-all duration-500 ${isPeak ? "bg-amber-400" : "bg-emerald-500"}`} style={{ height: `${heights[idx]}%` }} />
                      </div>
                      <span className="text-2xs text-zinc-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Action Stack */}
            <Card dark className="flex flex-col justify-between border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Action Stack</h3>
                <span className="text-xl font-bold text-amber-400">{completedCount}/{activeTasks.length}</span>
              </div>
              <div className="space-y-2 my-3 max-h-44 overflow-y-auto pr-1">
                {activeTasks.map((task) => {
                  const isDone = completedTasks[task.id];
                  return (
                    <div key={task.id} onClick={() => toggleTask(task.id)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 transition-colors cursor-pointer border border-zinc-800">
                      {isDone ? <CheckCircle2 size={14} className="text-amber-400 shrink-0" /> : <Circle size={14} className="text-zinc-600 shrink-0" />}
                      <div className="truncate">
                        <p className={`text-xs truncate ${isDone ? "line-through text-zinc-500" : "text-zinc-200"}`}>{task.title}</p>
                        <span className="text-2xs text-zinc-400">{task.time} · {task.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Intervention Alert */}
          {intervention && (
            <div className="rounded-3xl p-5 bg-gradient-to-r from-rose-950 via-zinc-900 to-rose-950 border border-rose-800/60 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                    <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">{intervention.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-rose-100">{intervention.problemSummary}</p>
                  <p className="text-xs text-rose-300/80">{intervention.curatorActionTaken}</p>
                </div>
                <Link to={intervention.actionRoute}
                  className="px-5 py-2.5 rounded-full bg-amber-400 text-amber-950 font-semibold text-xs flex items-center gap-2 shrink-0 hover:bg-amber-300 transition-colors">
                  <span>{intervention.suggestedActionText}</span><ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* Resource Feed + Activity Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <Card className="md:col-span-7 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-400" />Curated High-Signal Feed
                  </h3>
                  <p className="text-xs text-zinc-400">Zero clickbait · Filtered for your identity</p>
                </div>
                <Link to="/roadmap" className="text-xs text-amber-400 hover:underline">View roadmap</Link>
              </div>
              <div className="space-y-3">
                {resources.slice(0, 3).map((item) => (
                  <ResourceCard
                    key={item.id}
                    item={{ ...item, bookmarked: bookmarks[item.id] ?? item.bookmarked }}
                    onBookmark={handleBookmark}
                    onExplain={setExplainItem}
                    onLearn={(title) => setReflectionLesson(title)}
                  />
                ))}
              </div>
            </Card>

            <Card className="md:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-white">Mindful vs Skimming</h3>
                  <span className="text-xs text-zinc-400">Hours / Day</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">Intentional learning ratio log</p>
                <ActivityChart data={metrics.dailyFocusLogs} />
              </div>
              <div className="pt-3 border-t border-zinc-800 mt-2 flex items-center justify-between text-xs">
                <span className="text-zinc-300">Overall Intentionality</span>
                <span className="text-emerald-400 font-semibold">{metrics.attentionToIntentRatio}% Optimal</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Growth Identity Map ────────────────────────── */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base text-white flex items-center gap-2">
              <Brain size={16} className="text-amber-400" />Growth Identity Map
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Every node is a dimension of your life. Size = time invested. Hover any node to inspect its state and confidence.
            </p>
          </div>
          <Link to="/roadmap" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
            Full Roadmap <ArrowUpRight size={12} />
          </Link>
        </div>
        <TopicBubbleChart topics={metrics.topicProgress as unknown as TopicProgress[]} />
      </Card>

      {/* ── Recommendation Explanation Drawer ─────────── */}
      <DrawerModal
        open={!!explainItem}
        onClose={() => setExplainItem(null)}
        title="Why This Was Recommended"
      >
        {explainItem && (
          <div className="space-y-4 text-sm text-zinc-200">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Resource</h4>
              <p className="text-white font-semibold">{explainItem.title}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-2xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">{explainItem.type}</span>
                <span className={`text-2xs px-2 py-0.5 rounded-full ${DIFF_COLORS[explainItem.difficulty]}`}>{explainItem.difficulty}</span>
              </div>
            </div>
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2">
              <div>
                <p className="text-2xs uppercase tracking-wider text-amber-400 mb-0.5 font-semibold">Why PACER Selected This</p>
                <p className="text-xs text-zinc-300">{explainItem.reasoning}</p>
              </div>
            </div>
            {explainItem.buildsUpon && (
              <div>
                <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-0.5">Builds Upon</p>
                <p className="text-xs text-zinc-300">{explainItem.buildsUpon}</p>
              </div>
            )}
            {explainItem.unlocksGoal && (
              <div>
                <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-0.5">Unlocks</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Zap size={12} />{explainItem.unlocksGoal}
                </p>
              </div>
            )}
            <div>
              <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-0.5">Expected Skill Gain</p>
              <p className="text-xs text-zinc-300 flex items-center gap-1">
                <Star size={12} className="text-amber-400" />{explainItem.skillGain}
              </p>
            </div>
            <div>
              <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-0.5">Signal Score</p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${explainItem.intentionalityScore}%` }} />
                </div>
                <span className="text-xs text-emerald-400 font-semibold shrink-0">{explainItem.intentionalityScore}%</span>
              </div>
            </div>
            <Link
              to={explainItem.actionRoute || "/learning-lab"}
              className="w-full py-2.5 rounded-full bg-amber-400 text-amber-950 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-amber-300 transition-colors"
              onClick={() => setExplainItem(null)}
            >
              <PlayCircle size={14} /> Start This Resource
            </Link>
          </div>
        )}
      </DrawerModal>

      {/* ── Reflection Modal ──────────────────────────── */}
      <ReflectionModal
        open={!!reflectionLesson}
        lessonTitle={reflectionLesson || ""}
        onClose={() => setReflectionLesson(null)}
      />
    </div>
  );
};
