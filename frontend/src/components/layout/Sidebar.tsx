import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, LineChart, FlaskConical, User2,
  Briefcase, Trophy, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Settings
} from "lucide-react";
import { useAuth } from "../../contexts/auth.context";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
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
      className="fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300"
      style={{
        width: collapsed ? "68px" : "220px",
        background: "linear-gradient(180deg, #0d0d12 0%, #0a0a0f 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 select-none overflow-hidden">
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
          <Sparkles size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm tracking-wide whitespace-nowrap">
            PACER<span className="text-purple-400"> AI</span>
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border border-zinc-700 hover:border-purple-500 transition-colors z-10"
        style={{ background: "#151520" }}
      >
        {collapsed
          ? <ChevronRight size={12} className="text-zinc-400" />
          : <ChevronLeft size={12} className="text-zinc-400" />
        }
      </button>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1 px-2 pt-2 overflow-hidden">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group overflow-hidden whitespace-nowrap
              ${isActive
                ? "bg-purple-500/15 text-white"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`flex-shrink-0 ${isActive ? "text-purple-400" : "group-hover:text-zinc-300"}`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Account Section */}
      <div className="px-2 pb-4 space-y-1 border-t border-white/5 pt-3">
        {/* Settings */}
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all overflow-hidden whitespace-nowrap cursor-pointer"
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 overflow-hidden">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
              : initials
            }
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.name || "Learner"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer flex-shrink-0"
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
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
