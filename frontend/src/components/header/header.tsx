import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { X, Search, LogOut, User as UserIcon, Menu } from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuth } from "../../contexts/auth.context";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Roadmap", path: "/roadmap" },
    { label: "Insights", path: "/insights" },
    { label: "Learning Lab", path: "/learning-lab" },
    { label: "Future Self", path: "/future-self" },
    { label: "Opportunities", path: "/opportunities" },
    { label: "Achievements", path: "/achievements" },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/roadmap?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4 pointer-events-none">
      <div className="max-w-7xl mx-auto w-full pointer-events-auto">
        
        {/* Main Navbar Bar */}
        <div className="bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/80 rounded-full px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3 shadow-2xl transition-all">
          
          {/* Left Logo */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/landing"}
            className="flex items-center gap-2 text-white tracking-wider text-sm hover:opacity-90 transition-opacity shrink-0"
          >
            <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs shadow-md shadow-amber-400/20 font-bold">
              U
            </div>
            <span className="hidden sm:inline-block font-mono font-bold">UVOM AI</span>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap",
                    isActive
                      ? "bg-amber-400 text-amber-950 shadow-md shadow-amber-400/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Search Input Box */}
            <div ref={searchRef} className="relative">
              {!searchOpen ? (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <Search size={16} />
                </button>
              ) : (
                <form onSubmit={handleSearchSubmit} className="w-44 sm:w-56 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                  <Search size={14} className="text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    autoFocus
                    className="w-full bg-transparent outline-none text-white text-xs placeholder-zinc-500"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-0.5 hover:bg-zinc-800 rounded-full cursor-pointer shrink-0"
                  >
                    <X size={14} className="text-zinc-400" />
                  </button>
                </form>
              )}
            </div>

            {/* Profile or Auth Links */}
            {isAuthenticated && user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 sm:pr-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-amber-400/40"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="hidden sm:inline-block text-xs text-zinc-200">{user.name}</span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 p-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 space-y-1 text-xs">
                    <div className="px-3 py-2 border-b border-zinc-800/80">
                      <p className="text-white truncate">{user.name}</p>
                      <p className="text-2xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/learning-profile");
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserIcon size={14} className="text-amber-400" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        navigate("/landing");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/signin"
                  className="px-3 py-1.5 rounded-full text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-full text-xs bg-amber-400 text-amber-950 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} className="text-amber-400" /> : <Menu size={18} />}
            </button>
          </div>

        </div>

        {/* Mobile Nav Overlay Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-3 bg-zinc-950/95 border border-zinc-800/90 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-2xl text-xs transition-all",
                    isActive
                      ? "bg-amber-400 text-amber-950"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;