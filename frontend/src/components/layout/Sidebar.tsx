import React, { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, LineChart, FlaskConical, User2,
  Briefcase, Trophy, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Settings, Bot, Menu, X, MoreHorizontal, MessageCircle, ShoppingBag
} from "lucide-react";
import { useAuth } from "../../contexts/auth.context";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", shortLabel: "Home", path: "/dashboard" },
  { icon: FlaskConical, label: "Curation Feed", shortLabel: "Curation", path: "/curation" },
  { icon: LineChart, label: "Skill Sandbox", shortLabel: "Sandbox", path: "/sandbox" },
  { icon: ShoppingBag, label: "Products", shortLabel: "Products", path: "/shop" },
  { icon: User2, label: "Peer Reviews", shortLabel: "Reviews", path: "/reviews" },
  { icon: MessageCircle, label: "AI Coach", shortLabel: "AI Coach", path: "/ai-chat" },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMobileMenuOpen(false);
    logout();
    navigate("/signin");
  };

  const isAppPage = NAV_ITEMS.some(n => location.pathname.startsWith(n.path));
  if (!isAppPage) return null;

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "PA";

  const primaryMobileNav = NAV_ITEMS.slice(0, 4);

  return (
    <>
      {/* ── Desktop Left Sidebar (Visible on md: 768px and larger) ──────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col duration-300 bg-[#1A1A1D] text-nowrap"
        style={{
          width: collapsed ? "72px" : "220px"
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-6 select-none overflow-hidden">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="w-7 h-7 rounded-2xl shrink-0"
            />
            {!collapsed && (
              <div>
                <span className="font-extrabold text-white text-base tracking-wider block leading-none">
                  UVOM<span className="text-purple-400"> AI</span>
                </span>
                <span className="text-[10px] text-zinc-400 tracking-widest uppercase mt-0.5 block">
                  Upgraded Version of Me
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3.5 top-7 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-10 shadow-xl bg-[#232326] text-zinc-400 hover:text-white hover:shadow-[0_0_20px_1px_#6D28D9]"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Nav Links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pt-3 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-medium transition-all duration-200 group overflow-hidden whitespace-nowrap
                ${isActive
                  ? "bg-linear-to-r from-[#6D28D9] to-transparent text-white shadow-lg shadow-purple-950/40"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/4"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-gray-300 group-hover:text-zinc-200"
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
        <div className="p-2 space-y-2 border-t border-white/5">
          <Link
            to="/profile"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-gray-300 hover:text-zinc-100 hover:bg-white/[0.04] transition-all overflow-hidden whitespace-nowrap cursor-pointer"
          >
            <Settings size={18} className="flex-shrink-0 text-gray-300" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* User Card */}
          <div className="flex items-center justify-between p-1.5 rounded-2xl bg-zinc-900/60 overflow-hidden hover:bg-zinc-800 transition-colors">
            <Link to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
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
                  <p className="text-gray-200 text-xs font-semibold truncate capitalize">{user?.name || "Growth Aspirant"}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email || "user@pacer.ai"}</p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Brand Header (Visible on screens < md) ──────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-zinc-950/90 backdrop-blur-xl px-4 flex items-center justify-between border-b border-purple-500/20 shadow-lg">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.ico"
            alt="Logo"
            className="w-7 h-7 rounded-2xl shrink-0"
          />
          <span className="text-white tracking-wider">
            UVOM<span className="text-purple-400"> AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-1.5 rounded-md text-gray-300 bg-[#232326] hover:text-white cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Bottom Quick Nav Bar (Visible on screens < md) ──────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-2xl px-3 py-2 border-t border-purple-500/20 shadow-2xl flex items-center justify-around">
        {primaryMobileNav.map(({ icon: Icon, shortLabel, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${isActive
                ? "text-white bg-[#6D28D9] font-semibold"
                : "text-gray-400 hover:text-gray-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-white" : "text-zinc-400"} />
                <span className="text-[10px] tracking-tight">{shortLabel}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More Button */}
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 cursor-pointer ${mobileMenuOpen ? "text-purple-300 bg-purple-500/20 font-semibold" : "text-zinc-400"
            }`}
        >
          <MoreHorizontal size={18} className={mobileMenuOpen ? "text-purple-400" : "text-zinc-400"} />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </nav>

      {/* ── Mobile Drawer Navigation Overlay ─────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
                >
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-lg tracking-wider block leading-none">
                    UVOM<span className="text-purple-400"> AI</span>
                  </span>
                  <span className="text-xs text-zinc-400">Upgraded Version of Me</span>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-2xl bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav Grid */}
            <div className="grid grid-cols-2 gap-3 pt-6">
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3.5 rounded-2xl text-sm font-medium transition-all ${isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-950/50"
                      : "bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* User Account & Logout */}
          <div className="pt-6 space-y-3 border-t border-white/10 mt-6">
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 transition-colors">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-100 font-semibold truncate">{user?.name || "Growth Aspirant"}</p>
                <p className="text-xs text-purple-400 truncate">{user?.email || "user@pacer.ai"}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
