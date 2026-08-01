import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame, Trophy, Clock, Target, Sparkles, TrendingUp,
  ArrowRight, CheckCircle2, Circle, Zap,
  ChevronRight, Play, BarChart2, BookMarked, Video,
  Headphones, CheckSquare
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, AreaChart, Area
} from "recharts";
import { TopicBubbleChart } from "../components/charts/TopicBubbleChart";
import { useAuth } from "../contexts/auth.context";
import { apiService } from "../api";
import type { DashboardDataResponse } from "../api";
import { DUMMY_GROWTH_AREAS, type DummyGrowthAreaTopic } from "../data/dummyGrowthAreas";

/* ─── Greeting Helper ────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ─── Borderless Stat Card Component ─────────────────────────── */
const BorderlessStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  badge?: string;
  gradient: string;
  accentColor: string;
}> = ({ icon, label, value, sub, badge, gradient, accentColor }) => (
  <div
    className="relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-xl group"
    style={{ background: gradient }}
  >
    {/* Subtle ambient glow effect */}
    <div
      className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-45"
      style={{ background: accentColor }}
    />

    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{label}</span>
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
    </div>

    <div className="flex items-baseline justify-between">
      <div>
        <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
        <p className="text-xs text-zinc-400 mt-1 font-medium">{sub}</p>
      </div>
      {badge && (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
          {badge}
        </span>
      )}
    </div>
  </div>
);

/* ─── Task Item ──────────────────────────────────────────────── */
const TaskRow: React.FC<{
  title: string;
  done: boolean;
  tag: string;
  time: string;
  onToggle: () => void;
}> = ({ title, done, tag, time, onToggle }) => (
  <div
    onClick={onToggle}
    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/40 cursor-pointer transition-all duration-200 group"
  >
    <div className="flex items-center gap-3.5 min-w-0">
      <button className="flex-shrink-0 transition-transform group-hover:scale-110">
        {done ? (
          <CheckCircle2 size={20} className="text-purple-400 fill-purple-400/20" />
        ) : (
          <Circle size={20} className="text-zinc-600 group-hover:text-zinc-400" />
        )}
      </button>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${done ? "line-through text-zinc-500" : "text-zinc-200"}`}>
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
            {tag}
          </span>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Clock size={11} /> {time}
          </span>
        </div>
      </div>
    </div>
    <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
  </div>
);

/* ─── Dashboard Main Component ───────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Growth area selection state for hover & interactive details
  const [activeGrowthArea, setActiveGrowthArea] = useState<DummyGrowthAreaTopic>(DUMMY_GROWTH_AREAS[0]);

  // Daily Tasks
  const [tasks, setTasks] = useState([
    { id: "t1", title: "Complete 25m Focus Block on System Architecture", tag: "System Design", time: "25 min", done: true },
    { id: "t2", title: "Review Huberman Lab Protocol for Deep Focus", tag: "Mindset", time: "15 min", done: false },
    { id: "t3", title: "Log Daily Cognitive Reflection Note", tag: "Reflection", time: "5 min", done: false },
    { id: "t4", title: "Execute 1 TypeScript Generic Types Exercise", tag: "Code Mastery", time: "20 min", done: false },
  ]);

  useEffect(() => {
    apiService
      .getDashboardData()
      .then((res) => {
        setDashboardData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const streak = dashboardData?.learningConsistency?.bestStreak ?? 7;
  const weeklyHours = dashboardData?.learningConsistency?.weeklyHours ?? 5.2;

  // Handle Bubble Chart Hover
  const handleTopicHover = (topicName: string | null) => {
    if (!topicName) return;
    const found = DUMMY_GROWTH_AREAS.find(
      (g) => g.name.toLowerCase() === topicName.toLowerCase()
    );
    if (found) {
      setActiveGrowthArea(found);
    }
  };

  // Weekly focus log chart data
  const weeklyLogs = dashboardData?.metrics?.dailyFocusLogs ?? [
    { day: "Mon", mindfulHours: 1.5, intentionality: 75 },
    { day: "Tue", mindfulHours: 2.8, intentionality: 88 },
    { day: "Wed", mindfulHours: 1.2, intentionality: 68 },
    { day: "Thu", mindfulHours: 3.4, intentionality: 94 },
    { day: "Fri", mindfulHours: 2.4, intentionality: 82 },
    { day: "Sat", mindfulHours: 1.8, intentionality: 76 },
    { day: "Sun", mindfulHours: 0.9, intentionality: 62 },
  ];

  // 7-day login streak visualization
  const streakDays = [
    { day: "M", active: true },
    { day: "T", active: true },
    { day: "W", active: true },
    { day: "T", active: true },
    { day: "F", active: true },
    { day: "S", active: true },
    { day: "S", active: false },
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-12 w-72 rounded-2xl bg-zinc-900/60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-zinc-900/50" />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-zinc-900/50" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* ── Top Header Greeting ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 tracking-wider uppercase block mb-1">
            {getGreeting()}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {user?.name ? user.name.split(" ")[0] : "Growth Aspirant"} ✨
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Your identity curation algorithm is active. Current streak:{" "}
            <span className="text-purple-300 font-semibold">{streak} Days</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/learning-lab"
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Play size={16} className="fill-white" />
            Resume Learning
          </Link>
        </div>
      </div>

      {/* ── Top Stats Row (Borderless Glass Cards) ────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <BorderlessStatCard
          icon={<Flame size={20} />}
          label="Active Streak"
          value={`${streak} Days`}
          sub="Personal record"
          badge="🔥 Hot"
          gradient="linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(20,20,30,0.6) 100%)"
          accentColor="#f97316"
        />
        <BorderlessStatCard
          icon={<Clock size={20} />}
          label="Weekly Focus"
          value={`${weeklyHours} hrs`}
          sub="12% vs last week"
          badge="+0.8h"
          gradient="linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(20,20,30,0.6) 100%)"
          accentColor="#a855f7"
        />
        <BorderlessStatCard
          icon={<Target size={20} />}
          label="Daily Intent"
          value={`${completedCount}/${tasks.length}`}
          sub="Missions finished"
          gradient="linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(20,20,30,0.6) 100%)"
          accentColor="#10b981"
        />
        <BorderlessStatCard
          icon={<TrendingUp size={20} />}
          label="Growth Potential"
          value={`${dashboardData?.profile?.humanPotentialBreakdown?.total ?? 84}%`}
          sub="Identity Alignment"
          badge="Top 5%"
          gradient="linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(20,20,30,0.6) 100%)"
          accentColor="#ec4899"
        />
      </div>

      {/* ── Main Growth Areas Bubble Section ───────────────────── */}
      <div className="rounded-3xl p-7 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                Interactive Growth Areas
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Hover over any growth bubble node to view live topic details & curated recommendations.
            </p>
          </div>

          {/* Active Area Pill Badge */}
          <div className="flex items-center gap-3 bg-purple-950/40 px-4 py-2 rounded-2xl self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_#a855f7]" />
            <span className="text-xs font-semibold text-purple-200">
              Active: {activeGrowthArea.name} (+{activeGrowthArea.growthRate}% Growth)
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Bubble Chart + Interactive Recommendations Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Physics Bubble Canvas (Col 7) */}
          <div className="lg:col-span-7 rounded-2xl bg-black/40 p-4 min-h-[400px]">
            <TopicBubbleChart
              topics={DUMMY_GROWTH_AREAS}
              onTopicHover={handleTopicHover}
            />
          </div>

          {/* Right: Rich Interactive Recommendations Panel (Col 5) */}
          <div className="lg:col-span-5 rounded-2xl bg-zinc-900/60 p-6 space-y-5 flex flex-col justify-between h-full min-h-[400px]">
            <div className="space-y-4">
              {/* Selected Topic Info Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                    {activeGrowthArea.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-2">
                    {activeGrowthArea.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">
                    +{activeGrowthArea.growthRate}%
                  </span>
                  <p className="text-[10px] text-zinc-500 uppercase font-medium">Growth Rate</p>
                </div>
              </div>

              {/* Progress & Stats Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Topic Mastery</span>
                  <span className="text-purple-300">{activeGrowthArea.completedPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${activeGrowthArea.completedPercent}%`,
                      background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
                  <span>Time: {activeGrowthArea.timeInvested}h</span>
                  <span>Confidence: {activeGrowthArea.confidenceLevel}%</span>
                  <span>State: {activeGrowthArea.nodeState}</span>
                </div>
              </div>

              {/* Curated Recommendations List */}
              <div className="space-y-3 pt-3">
                <p className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center gap-1.5">
                  <Zap size={14} className="text-purple-400" /> Curated Growth Resources
                </p>

                {activeGrowthArea.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-950/60 hover:bg-purple-950/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {rec.type === "Book" && <BookMarked size={14} className="text-amber-400" />}
                        {rec.type === "Video" && <Video size={14} className="text-rose-400" />}
                        {rec.type === "Podcast" && <Headphones size={14} className="text-sky-400" />}
                        {rec.type === "Action" && <CheckSquare size={14} className="text-emerald-400" />}
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300">
                          {rec.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-medium">{rec.duration}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 pl-5 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/roadmap"
              className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-purple-600 text-zinc-200 hover:text-white text-xs font-bold text-center transition-all duration-200 flex items-center justify-center gap-2"
            >
              Explore Full Roadmap Stage <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Middle Section: Tasks & Weekly Streak ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks List (Col 7) */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Today's Focus Missions</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {completedCount} of {tasks.length} tasks completed today
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300">
              {Math.round((completedCount / tasks.length) * 100)}% Done
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                title={task.title}
                done={task.done}
                tag={task.tag}
                time={task.time}
                onToggle={() => toggleTask(task.id)}
              />
            ))}
          </div>
        </div>

        {/* Weekly Streak Calendar & Login Presence (Col 5) */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame size={18} className="text-orange-400" /> Weekly Presence Log
              </h3>
              <span className="text-xs font-bold text-emerald-400">6/7 Active</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Your daily logins and active time are recorded in the database.
            </p>

            <div className="grid grid-cols-7 gap-2 my-4">
              {streakDays.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                      d.active
                        ? "bg-purple-600/30 text-purple-300 shadow-md shadow-purple-900/40"
                        : "bg-zinc-800/40 text-zinc-600"
                    }`}
                  >
                    {d.active ? "✓" : "–"}
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/20 space-y-1">
            <p className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" /> Consistency Milestone
            </p>
            <p className="text-xs text-zinc-400">
              Maintaining 5+ active days per week accelerates identity adaptation by 2.4x.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Day vs Time Focus Chart & Intentionality ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day vs Time Chart */}
        <div className="rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-purple-400" /> Day vs Time Log
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Hours spent per day this week</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Total: {weeklyHours}h</span>
          </div>

          <div className="h-48 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyLogs} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(168,85,247,0.06)" }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-zinc-200">{item.day}</p>
                          <p className="text-purple-300 font-semibold">{item.mindfulHours} hrs Mindful Focus</p>
                          <p className="text-zinc-400">{item.intentionality}% Intentionality</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mindfulHours" radius={[8, 8, 0, 0]}>
                  {weeklyLogs.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.mindfulHours >= 2.0 ? "#a855f7" : "#3f3f46"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intentionality Trend Area Chart */}
        <div className="rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" /> Focus Quality Trend
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Intentionality score percentage</p>
            </div>
            <span className="text-xs font-bold text-emerald-400">Avg 80%</span>
          </div>

          <div className="h-48 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyLogs} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis dataKey="intentionality" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  cursor={{ stroke: "#a855f7", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-zinc-200">{item.day}</p>
                          <p className="text-emerald-400 font-semibold">{item.intentionality}% Intentionality Score</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="intentionality" stroke="#a855f7" strokeWidth={3} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
