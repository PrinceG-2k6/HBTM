import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame, Trophy, Clock, Target, Sparkles, TrendingUp,
  ArrowRight, CheckCircle2, Circle, BookOpen, Zap,
  ChevronRight, Play, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, AreaChart, Area
} from "recharts";
import { TopicBubbleChart } from "../components/charts/TopicBubbleChart";
import { useAuth } from "../contexts/auth.context";
import { apiService } from "../api";
import type { DashboardDataResponse, TopicProgress } from "../api";

/* ─── helpers ─────────────────────────────────────────────────── */
const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}> = ({ icon, label, value, sub, accent = "#a855f7" }) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-3"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500 tracking-wide uppercase">{label}</span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
    </div>
    <div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const TaskItem: React.FC<{
  title: string;
  done: boolean;
  tag: string;
  time: string;
  onToggle: () => void;
}> = ({ title, done, tag, time, onToggle }) => (
  <div
    className="flex items-start gap-3 py-3 border-b last:border-0 border-white/5 cursor-pointer group"
    onClick={onToggle}
  >
    <button className="mt-0.5 flex-shrink-0">
      {done
        ? <CheckCircle2 size={16} className="text-purple-400" />
        : <Circle size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      }
    </button>
    <div className="flex-1 min-w-0">
      <p className={`text-sm ${done ? "line-through text-zinc-600" : "text-zinc-200"}`}>{title}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{tag}</span>
        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
          <Clock size={10} />{time}
        </span>
      </div>
    </div>
  </div>
);

/* ─── recommendations per aspiration domain ───────────────────── */
const DOMAIN_RECS: Record<string, string[]> = {
  "Career & Wealth": [
    "Read: The Psychology of Money",
    "Watch: 10-min compound interest visualization",
    "Practice: Update your LinkedIn for visibility",
  ],
  "Mindset & Peace": [
    "Listen: Huberman Lab – Stress inoculation",
    "Practice: 4-7-8 breathing for 5 min",
    "Read: Viktor Frankl – Man's Search for Meaning (ch.1)",
  ],
  "Health & Vitality": [
    "Move: 20-min Zone 2 cardio today",
    "Eat: Add one high-protein meal",
    "Sleep: Set wind-down alarm 30 min before bed",
  ],
  "Creative Expression": [
    "Create: Sketch one idea with no rules",
    "Listen: Creative Pep Talk podcast",
    "Challenge: Write 200 words of anything",
  ],
  "Relationships & Social": [
    "Reach out: Send a message to one person you admire",
    "Read: The Art of Asking Good Questions",
    "Practice: Active listening in your next 3 conversations",
  ],
};

/* ─── Main Dashboard ──────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState([
    { id: "1", title: "Complete today's focus session", tag: "Focus", time: "20 min", done: false },
    { id: "2", title: "Review roadmap progress", tag: "Roadmap", time: "5 min", done: false },
    { id: "3", title: "Log one reflection note", tag: "Reflection", time: "3 min", done: true },
    { id: "4", title: "Read 10 pages of current book", tag: "Reading", time: "15 min", done: false },
  ]);

  const [hoveredBubbleTopic, setHoveredBubbleTopic] = useState<string | null>(null);

  useEffect(() => {
    apiService.getDashboardData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Track login time to backend
    apiService.getDashboardData().catch(() => null);
  }, []);

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const completedCount = tasks.filter(t => t.done).length;
  const streak = data?.learningConsistency?.bestStreak ?? 7;
  const weeklyHours = data?.learningConsistency?.weeklyHours ?? 4.5;

  const aspirationDomains: string[] = user?.onboarding?.aspirationFocus?.length
    ? user.onboarding.aspirationFocus
    : ["Career & Wealth", "Mindset & Peace"];

  // Build topics from user onboarding domains OR backend data
  const bubbleTopics: TopicProgress[] = data?.metrics?.topicProgress?.length
    ? data.metrics.topicProgress
    : aspirationDomains.map((d, i) => ({
        id: `topic-${i}`,
        name: d,
        category: d,
        nodeState: (["Exploring", "Learning", "Practicing", "Applying"] as const)[i % 4],
        completedPercent: [25, 45, 60, 30, 80][i % 5],
        completedItems: i + 2,
        totalItems: (i + 2) * 2,
        timeInvested: 2 + i * 1.5,
        confidenceLevel: [40, 55, 70, 35, 85][i % 5],
        isIdentityLevel: i === 0,
        recentlyActive: i < 2,
        lastActive: new Date().toISOString(),
        dependencies: [],
        relatedStageId: `s${i + 1}`,
        aiRecommendation: (DOMAIN_RECS[d] || ["Keep exploring this area"])[0],
      }));

  // Weekly activity data
  const weeklyData = data?.metrics?.dailyFocusLogs ?? [
    { day: "Mon", mindfulHours: 1.2, intentionality: 72 },
    { day: "Tue", mindfulHours: 2.5, intentionality: 85 },
    { day: "Wed", mindfulHours: 0.8, intentionality: 60 },
    { day: "Thu", mindfulHours: 3.1, intentionality: 91 },
    { day: "Fri", mindfulHours: 2.0, intentionality: 78 },
    { day: "Sat", mindfulHours: 1.5, intentionality: 68 },
    { day: "Sun", mindfulHours: 0.5, intentionality: 50 },
  ];

  // Streak data (last 7 days login presence)
  const streakData = [
    { day: "M", active: true },
    { day: "T", active: true },
    { day: "W", active: false },
    { day: "T", active: true },
    { day: "F", active: true },
    { day: "S", active: true },
    { day: "S", active: false },
  ];

  // Recommendations for hovered bubble
  const hoveredRecs = hoveredBubbleTopic
    ? (DOMAIN_RECS[hoveredBubbleTopic] || ["Keep exploring this area", "Set a 15-min daily goal"])
    : null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-zinc-800/50" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-800/40" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-96 rounded-2xl bg-zinc-800/40" />
          <div className="h-96 rounded-2xl bg-zinc-800/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7">

      {/* ── Header Greeting ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 mb-1">{greet()}</p>
          <h1 className="text-2xl font-semibold text-white">
            {user?.name ? `${user.name.split(" ")[0]}` : "Learner"} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            You're on a <span className="text-purple-400 font-medium">{streak}-day streak</span>. Keep the momentum.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/roadmap"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
          >
            <Sparkles size={15} />
            View Roadmap
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame size={16} />}
          label="Day Streak"
          value={`${streak} days`}
          sub="Best streak yet!"
          accent="#f97316"
        />
        <StatCard
          icon={<Clock size={16} />}
          label="This Week"
          value={`${weeklyHours}h`}
          sub="Time invested"
          accent="#a855f7"
        />
        <StatCard
          icon={<Target size={16} />}
          label="Today's Tasks"
          value={`${completedCount}/${tasks.length}`}
          sub="Completed"
          accent="#10b981"
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Growth Score"
          value={`${data?.profile?.humanPotentialBreakdown?.total ?? 72}%`}
          sub="Potential unlocked"
          accent="#f59e0b"
        />
      </div>

      {/* ── Main 2-col grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Bubble Chart ──────────────────────────── */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-medium text-white">Growth Areas</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Hover a bubble for personalized recommendations</p>
            </div>
            <Link to="/insights" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              Full analysis <ArrowRight size={12} />
            </Link>
          </div>

          {/* Bubble chart with hover→recs */}
          <div className="relative">
            <TopicBubbleChart
              topics={bubbleTopics}
              onTopicHover={setHoveredBubbleTopic}
            />

            {/* Recommendations panel shown on hover */}
            {hoveredRecs && hoveredBubbleTopic && (
              <div
                className="absolute top-3 right-3 rounded-xl p-4 max-w-[200px] text-xs space-y-2 z-30 transition-all"
                style={{
                  background: "rgba(10,10,15,0.95)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  backdropFilter: "blur(16px)"
                }}
              >
                <p className="text-purple-300 font-medium mb-2 flex items-center gap-1">
                  <Zap size={12} /> {hoveredBubbleTopic}
                </p>
                {hoveredRecs.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-zinc-400">
                    <ChevronRight size={10} className="mt-0.5 text-purple-500 flex-shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Tasks + Streak ───────────────────────── */}
        <div className="space-y-5">

          {/* Streak calendar */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-white">Weekly Activity</h2>
              <Flame size={16} className="text-orange-400" />
            </div>
            <div className="flex items-end gap-2 justify-between">
              {streakData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all"
                    style={{
                      background: d.active ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                      border: d.active ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {d.active && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-600">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's tasks */}
          <div
            className="rounded-2xl p-5 flex-1"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-medium text-white">Today's Tasks</h2>
              <span className="text-xs text-zinc-500">{completedCount}/{tasks.length}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-zinc-800 mb-4">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(completedCount / tasks.length) * 100}%`,
                  background: "linear-gradient(90deg, #7c3aed, #db2777)"
                }}
              />
            </div>
            <div>
              {tasks.map(t => (
                <TaskItem
                  key={t.id}
                  title={t.title}
                  done={t.done}
                  tag={t.tag}
                  time={t.time}
                  onToggle={() => toggleTask(t.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Charts row ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Day vs Time bar chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-medium text-white">Daily Focus Time</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Hours per day this week</p>
            </div>
            <BarChart2 size={16} className="text-zinc-500" />
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(168,85,247,0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
                          <p className="text-zinc-300">{d.day}</p>
                          <p className="text-purple-300">{d.mindfulHours}h focused</p>
                          <p className="text-zinc-500">{d.intentionality}% intentionality</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mindfulHours" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={(entry.mindfulHours ?? 0) >= 2 ? "#a855f7" : "#3f3f46"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intentionality trend area chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-medium text-white">Focus Quality</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Intentionality score trend</p>
            </div>
            <TrendingUp size={16} className="text-zinc-500" />
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="intentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 11 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(168,85,247,0.2)" }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
                          <p className="text-zinc-300">{d.day}</p>
                          <p className="text-purple-300">{d.intentionality}% intentionality</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="intentionality"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#intentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Quick Nav links ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Continue Learning", icon: <Play size={14} />, path: "/learning-lab", color: "#7c3aed" },
          { label: "View Roadmap", icon: <BookOpen size={14} />, path: "/roadmap", color: "#0891b2" },
          { label: "See Insights", icon: <TrendingUp size={14} />, path: "/insights", color: "#059669" },
          { label: "Achievements", icon: <Trophy size={14} />, path: "/achievements", color: "#d97706" },
        ].map(({ label, icon, path, color }) => (
          <Link
            key={path}
            to={path}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm text-zinc-300 hover:text-white transition-all group"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ color }}>{icon}</span>
              <span>{label}</span>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};
