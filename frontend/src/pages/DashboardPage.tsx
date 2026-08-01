import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "../api/axiosClient";
import {
  Flame, Trophy, Clock, Target, Sparkles, TrendingUp,
  ArrowRight, CheckCircle2, Circle, Zap,
  ChevronRight, Play, BarChart2, BookMarked, Video,
  Headphones, CheckSquare, LogOut
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, AreaChart, Area
} from "recharts";
import { TopicBubbleChart } from "../components/charts/TopicBubbleChart";
import { useAuth } from "../contexts/auth.context";
import { apiService, curationApi } from "../api";
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
    className="relative overflow-hidden rounded-lg p-5 transition-all duration-300 shadow-xl group"
    style={{ background: gradient }}
  >
    {/* Subtle ambient glow effect */}
    <div
      className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-45"
      style={{ background: accentColor }}
    />

    <div className="flex justify-between mb-6">
      <span className="font-bold text-gray-200 tracking-wider">{label}</span>
      <div>
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
    </div>

    <div className="flex items-end justify-between">
      <div>
        <p className="text-3xl text-white tracking-tight">{value}</p>
        <p className="text-gray-400 mt-1">{sub}</p>
      </div>
      {badge && (
        <span className="text-sm px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
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
          <Circle size={20} className="text-zinc-400 group-hover:text-zinc-200" />
        )}
      </button>
      <div className="min-w-0">
        <p className={`text-base ${done ? "line-through text-zinc-400" : "text-zinc-100"}`}>
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
            {tag}
          </span>
          <span className="text-sm text-zinc-300 flex items-center gap-1">
            <Clock size={13} /> {time}
          </span>
        </div>
      </div>
    </div>
    <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
  </div>
);

/* ─── Dashboard Main Component ───────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  // Helper to store checked tasks locally by date + title
  const getLocalCheckedTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`tasks_${today}`);
    return stored ? JSON.parse(stored) : [];
  };
  
  const saveLocalCheckedTask = (title: string) => {
    const today = new Date().toISOString().split('T')[0];
    const checked = getLocalCheckedTasks();
    if (!checked.includes(title)) {
      checked.push(title);
      localStorage.setItem(`tasks_${today}`, JSON.stringify(checked));
    }
  };
  
  const removeLocalCheckedTask = (title: string) => {
    const today = new Date().toISOString().split('T')[0];
    const checked = getLocalCheckedTasks();
    const updated = checked.filter((t: string) => t !== title);
    localStorage.setItem(`tasks_${today}`, JSON.stringify(updated));
  };
  const [isYoutubeSynced, setIsYoutubeSynced] = useState(() => {
    return localStorage.getItem("youtube_synced") === "true";
  });

  useEffect(() => {
    if (location.search.includes("youtube=success")) {
      setIsYoutubeSynced(true);
      localStorage.setItem("youtube_synced", "true");
      // Clean up URL without triggering reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const [dashboardData, setDashboardData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Growth area selection state for hover & interactive details
  const [activeGrowthArea, setActiveGrowthArea] = useState<DummyGrowthAreaTopic>(DUMMY_GROWTH_AREAS[0]);
  const [dynamicGrowthAreas, setDynamicGrowthAreas] = useState<DummyGrowthAreaTopic[]>(DUMMY_GROWTH_AREAS);

  const [tasks, setTasks] = useState<{ id: string, title: string, tag: string, time: string, done: boolean }[]>([]);

  useEffect(() => {
    apiService
      .getDashboardData()
      .then((res) => {
        setDashboardData(res);
        if (res?.metrics?.skillMatrix?.length) {
          const mappedAreas = res.metrics.skillMatrix.map((s, idx) => ({
            id: `ga-${idx}`,
            name: s.skill,
            category: s.category || "Core Skill",
            completedPercent: s.score,
            totalItems: 10,
            completedItems: Math.round(s.score / 10),
            nodeState: s.score > 80 ? "Mastering" : s.score > 40 ? "Practicing" : "Learning",
            timeInvested: Math.round(s.score * 0.5),
            confidenceLevel: s.score,
            lastActive: new Date().toISOString(),
            recentlyActive: true,
            isIdentityLevel: false,
            growthRate: Math.round(s.score / 5) || 5,
            dependencies: [],
            relatedStageId: `s${idx}`,
            recommendations: [
              {
                title: `Advance your ${s.skill} skills`,
                type: "Action",
                duration: "20m",
                description: `Practice and consume more content regarding ${s.skill}.`,
                impactScore: 85 + Math.round(Math.random() * 10),
              }
            ]
          })) as DummyGrowthAreaTopic[];
          setDynamicGrowthAreas(mappedAreas);
          setActiveGrowthArea(mappedAreas[0]);
        } else {
          // If the user has no skills yet, show a starter node
          const starterArea: DummyGrowthAreaTopic = {
            id: "ga-start",
            name: "Your Journey Begins",
            category: "Onboarding",
            completedPercent: 0,
            totalItems: 5,
            completedItems: 0,
            nodeState: "Learning",
            timeInvested: 0,
            confidenceLevel: 10,
            lastActive: new Date().toISOString(),
            recentlyActive: true,
            isIdentityLevel: false,
            growthRate: 0,
            dependencies: [],
            relatedStageId: "s0",
            recommendations: [
              {
                title: "Complete Your First Mission",
                type: "Action",
                duration: "10m",
                description: "Head to the Roadmap or Sandbox to start analyzing content.",
                impactScore: 100,
              }
            ]
          };
          setDynamicGrowthAreas([starterArea]);
          setActiveGrowthArea(starterArea);
        }

        // Setup dynamic tasks based on dashboardData
        if (res?.daily_tasks && Array.isArray(res.daily_tasks)) {
          const checkedTitles = getLocalCheckedTasks();
          const formattedTasks = res.daily_tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            done: checkedTitles.includes(t.title),
            tag: t.tag || "Focus",
            time: t.estimated_minutes ? `${t.estimated_minutes} min` : "15 min"
          }));
          setTasks(formattedTasks);
        } else if (res?.todayMission) {
          setTasks([
            {
              id: "t1",
              title: res.todayMission.taskTitle,
              tag: res.todayMission.taskType,
              time: `${res.todayMission.estimatedMinutes} min`,
              done: res.todayMission.progressPercent >= 100
            }
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newDone = !t.done;
        if (newDone) {
          saveLocalCheckedTask(t.title);
          if (t.tag) {
            curationApi.markContentComplete({
              url: `dashboard-task-${Date.now()}`,
              title: t.title,
              content_type: "action",
              platform: "dashboard",
              skill_name: t.tag
            }).catch(console.error);
          }
        } else {
          removeLocalCheckedTask(t.title);
        }
        return { ...t, done: newDone };
      }
      return t;
    }));
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const streak = dashboardData?.learningConsistency?.currentStreak ?? 0;
  const weeklyHours = dashboardData?.learningConsistency?.weeklyHours ?? 0;

  // Handle Bubble Chart Hover
  const handleTopicHover = (topicName: string | null) => {
    if (!topicName) return;
    const found = dynamicGrowthAreas.find(
      (g) => g.name.toLowerCase() === topicName.toLowerCase()
    );
    if (found) {
      setActiveGrowthArea(found);
    }
  };

  // Weekly focus log chart data from real database activity
  const weeklyLogs = dashboardData?.metrics?.dailyFocusLogs ?? [
    { day: "Mon", mindfulHours: 0, intentionality: 0 },
    { day: "Tue", mindfulHours: 0, intentionality: 0 },
    { day: "Wed", mindfulHours: 0, intentionality: 0 },
    { day: "Thu", mindfulHours: 0, intentionality: 0 },
    { day: "Fri", mindfulHours: 0, intentionality: 0 },
    { day: "Sat", mindfulHours: 0, intentionality: 0 },
    { day: "Sun", mindfulHours: 0, intentionality: 0 },
  ];

  // 7-day login streak visualization from real database activity
  const streakDays = (dashboardData as any)?.weeklyPresence ?? [
    { day: "M", active: false },
    { day: "T", active: false },
    { day: "W", active: false },
    { day: "T", active: false },
    { day: "F", active: false },
    { day: "S", active: false },
    { day: "S", active: true },
  ];

  const activeDaysCount = (dashboardData as any)?.activeDaysCount ?? streakDays.filter((d: any) => d.active).length;

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
    <div className="w-full max-w-7xl mx-auto space-y-16 pb-12">
      {/* ── Top Header Greeting ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 py-8">
        <div>
          
          <h1 className="text-4xl text-white tracking-tight capitalize flex gap-1.5">
            <span className="text-purple-300 tracking-wider block mb-2">
            {getGreeting() + ","}
          </span>
            {user?.name ? user.name.split(" ")[0] : "Growth Aspirant"}
          </h1>
          <p className="text-lg text-zinc-300 mt-1">
            Your identity curation algorithm is active. Current streak:{" "}
            <span className="text-purple-300 font-semibold">{streak} Days</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isYoutubeSynced ? (
            <div className="h-fit flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600/20 border border-green-500/50 cursor-default">
              <CheckCircle2 size={18} className="text-green-400" />
              YouTube Synced
            </div>
          ) : (
            <a
              href={`http://localhost:8000/api/auth/youtube/login?user_id=${user?.id || (user as any)?._id}`}
              className="h-fit flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50 transition-all cursor-pointer"
            >
              <Video size={18} />
              Connect YouTube
            </a>
          )}
          <Link
            to="/curation"
            className="h-fit flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold text-white border-2 border-[#6D28D9] shadow-[0_0_50px_1px_#6c28d984] duration-200 hover:bg-[#6c28d95b]"
          >
            <Play size={18} className="fill-white" />
            Resume Learning
          </Link>
          <button
            onClick={handleLogout}
            className="h-fit flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/60 transition-all cursor-pointer shadow-md"
            title="Log out of your account"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>

      {/* ── Top Stats Row (Borderless Glass Cards) ────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <BorderlessStatCard
          icon={<Flame size={20} />}
          label="Active Streak"
          value={`${streak} Days`}
          sub="Personal record"
          badge="Hot"
          gradient="linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(20,20,30,0.6) 100%)"
          accentColor="#f97316"
        />
        <BorderlessStatCard
          icon={<Clock size={20} />}
          label="Weekly Focus"
          value={`${weeklyHours} hrs`}
          sub={weeklyHours > 0 ? "Total time logged" : "First week active"}
          badge={weeklyHours > 0 ? `${weeklyHours}h` : "Active"}
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
          value={`${Number(dashboardData?.profile?.humanPotentialBreakdown?.total ?? 0).toFixed(1)}%`}
          sub="Identity Alignment"
          badge="Top 5%"
          gradient="linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(20,20,30,0.6) 100%)"
          accentColor="#ec4899"
        />
      </div>

      {/* ── Main Growth Areas Bubble Section ───────────────────── */}
      <div className="rounded-lg p-7 bg-[#1A1A1D] backdrop-blur-2xl shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-x-2.5 gap-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <h2 className="text-2xl text-white tracking-wide">
                Interactive Growth Areas
              </h2>
            </div>
            <p className="text-lg text-zinc-300 mt-2">
              Hover over any growth bubble node to view live topic details & curated recommendations.
            </p>
          </div>

          {/* Active Area Pill Badge */}
          <div className="flex items-center gap-3 bg-[#8c1fd439] px-4 py-2 rounded-2xl self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_#a855f7]" />
            <span className="text-purple-200">
              Active: {activeGrowthArea.name} (+{activeGrowthArea.growthRate}% Growth)
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Bubble Chart + Interactive Recommendations Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Physics Bubble Canvas (Col 7) */}
          <div className="lg:col-span-7 rounded-2xl bg-black/40 p-4 min-h-100">
            <TopicBubbleChart
              topics={dynamicGrowthAreas}
              onTopicHover={handleTopicHover}
            />
          </div>

          {/* Right: Rich Interactive Recommendations Panel (Col 5) */}
          <div className="lg:col-span-5 rounded-2xl bg-zinc-900/60 p-6 space-y-5 flex flex-col justify-between h-full min-h-100">
            <div className="space-y-4">
              {/* Selected Topic Info Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs tracking-widest uppercase px-3 py-1 rounded-full bg-purple-500/20 text-purple-200">
                    {activeGrowthArea.category}
                  </span>
                  <h3 className="text-xl text-white ml-1.25 mt-2">
                    {activeGrowthArea.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl text-emerald-400">
                    +{activeGrowthArea.growthRate}%
                  </span>
                  <p className="text-xs text-zinc-400">Growth Rate</p>
                </div>
              </div>

              {/* Progress & Stats Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Topic Mastery</span>
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
                <div className="flex justify-between text-xs text-zinc-300 pt-1">
                  <span>Time: {activeGrowthArea.timeInvested}h</span>
                  <span>Confidence: {activeGrowthArea.confidenceLevel}%</span>
                  <span>State: {activeGrowthArea.nodeState}</span>
                </div>
              </div>

              {/* Curated Recommendations List */}
              <div className="space-y-3 pt-3">
                <p className="text-xs font-semibold text-zinc-200 tracking-wider uppercase flex items-center gap-1.5">
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
                        <span className="text-sm text-zinc-100 group-hover:text-purple-300">
                          {rec.title}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0">{rec.duration}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-1 pl-5 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Middle Section: Tasks & Weekly Streak ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks List (Col 7) */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl text-white">Today's Focus Missions</h3>
              <p className="text-sm text-zinc-300 mt-0.5">
                {completedCount} of {tasks.length} tasks completed today
              </p>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-200">
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
              <h3 className="text-xl text-white flex items-center gap-2">
                <Flame size={18} className="text-orange-400" /> Weekly Presence Log
              </h3>
              <span className="text-sm text-emerald-300">{activeDaysCount}/7 Active</span>
            </div>
            <p className="text-sm text-zinc-300 mb-4">
              Your daily logins and active time are recorded in the database.
            </p>

            <div className="grid grid-cols-7 gap-2 my-4">
              {streakDays.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition-all ${
                      d.active
                        ? "bg-purple-600/40 text-purple-200 shadow-md shadow-purple-900/40"
                        : "bg-zinc-800/60 text-zinc-500"
                    }`}
                  >
                    {d.active ? "✓" : "–"}
                  </div>
                  <span className="text-xs text-zinc-400">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 space-y-1">
            <p className="text-sm text-purple-200 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" /> Consistency Milestone
            </p>
            <p className="text-sm text-zinc-300">
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
              <h3 className="text-lg text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-purple-400" /> Day vs Time Log
              </h3>
              <p className="text-sm text-zinc-300 mt-0.5">Hours spent per day this week</p>
            </div>
            <span className="text-sm font-mono text-zinc-300">Total: {weeklyHours}h</span>
          </div>

          <div className="h-48 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyLogs} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(168,85,247,0.06)" }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
                          <p className="text-zinc-200">{item.day}</p>
                          <p className="text-purple-300">{item.mindfulHours} hrs Mindful Focus</p>
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
                      fill={entry.mindfulHours >= 2.0 ? "#a855f7" : "#52525b"}
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
              <h3 className="text-lg text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" /> Focus Quality Trend
              </h3>
              <p className="text-sm text-zinc-300 mt-0.5">Intentionality score percentage</p>
            </div>
            <span className="text-sm text-emerald-300">Avg 80%</span>
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
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis dataKey="intentionality" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  cursor={{ stroke: "#a855f7", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
                          <p className="text-zinc-200">{item.day}</p>
                          <p className="text-emerald-300">{item.intentionality}% Intentionality Score</p>
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
