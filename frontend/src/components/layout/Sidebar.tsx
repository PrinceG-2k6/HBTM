import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, LineChart, FlaskConical, User2,
  Briefcase, Trophy, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Settings, Bot
} from "lucide-react";
import { useAuth } from "../../contexts/auth.context";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Bot, label: "AI Curator Chat", path: "/ai-chat" },
  { icon: Map, label: "Roadmap", path: "/roadmap" },
  { icon: LineChart, label: "Insights", path: "/insights" },
  { icon: FlaskConical, label: "Learning Lab", path: "/learning-lab" },
  { icon: User2, label: "Future Self", path: "/future-self" },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Trophy, label: "Achievements", path: "/achievements" },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const isAppPage = NAV_ITEMS.some(n => location.pathname.startsWith(n.path));
  if (!isAppPage) return null;

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "PA";

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 backdrop-blur-2xl shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
      style={{
        width: collapsed ? "72px" : "230px",
        background: "linear-gradient(180deg, rgba(13,13,18,0.95) 0%, rgba(8,8,12,0.98) 100%)",
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-6 select-none overflow-hidden">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-purple-900/30"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-extrabold text-white text-base tracking-wider block leading-none">
                PACER<span className="text-purple-400"> AI</span>
              </span>
              <span className="text-[10px] text-zinc-500 tracking-widest uppercase mt-0.5 block">
                Growth Curator
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3.5 top-7 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-10 shadow-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-purple-600/80"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1.5 px-3 pt-3 overflow-hidden">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group overflow-hidden whitespace-nowrap
              ${isActive
                ? "bg-gradient-to-r from-purple-900/40 via-purple-600/20 to-transparent text-white shadow-lg shadow-purple-950/40"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Account Section */}
      <div className="p-3 space-y-2 pt-3 bg-zinc-950/40">
        <button
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-all overflow-hidden whitespace-nowrap cursor-pointer"
        >
          <Settings size={18} className="flex-shrink-0 text-zinc-500" />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-zinc-900/60 overflow-hidden">
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full rounded-xl object-cover" />
            ) : (
              initials
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-100 font-semibold truncate">{user?.name || "Growth Aspirant"}</p>
              <p className="text-[10px] text-purple-400 truncate font-mono">{user?.email || "user@pacer.ai"}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2.5 rounded-2xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
