import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Lock, Mail, User as UserIcon, Briefcase, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useAuth } from "../contexts/auth.context";

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupWithJWT, loginWithGoogle } = useAuth();

  const [name, setName] = useState("Prince");
  const [email, setEmail] = useState("prince@pacer.ai");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("AI Systems Founder & Cognitive Engineer");
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"jwt" | "google">("jwt");
  const [error, setError] = useState("");

  const handleJWTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signupWithJWT(name, email, password, role);
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch {
      setError("Google Sign Up failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center py-6 px-3">
      <div className="w-full max-w-md space-y-6">

        {/* Branding Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-white text-sm hover:border-amber-500/50 transition-all">
            <Sparkles size={16} className="text-amber-400" />
            <span className="tracking-wider">PACER AI</span>
          </Link>
          <h1 className="text-3xl text-white tracking-tight">Create your account</h1>
          <p className="text-xs text-zinc-400">
            Start curating high-signal knowledge optimized for your potential
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-zinc-950/90 border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-5">

          {/* Auth Method Selector */}
          <div className="flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs">
            <button
              onClick={() => setAuthMethod("jwt")}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                authMethod === "jwt"
                  ? "bg-amber-400 text-amber-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              JWT Account
            </button>
            <button
              onClick={() => setAuthMethod("google")}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                authMethod === "google"
                  ? "bg-amber-400 text-amber-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Google Auth
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <ShieldCheck size={14} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Auth Container */}
          {authMethod === "google" ? (
            <div className="space-y-4 py-2">
              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                Create your account in seconds using Google OAuth 2.0.
              </p>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? "Creating Google Account..." : "Sign Up with Google"}</span>
              </button>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-2xs text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={12} /> Instant Identity Vector Initialization
                </div>
                <p>PACER automatically generates your initial cognitive profile vector.</p>
              </div>
            </div>
          ) : (
            /* JWT Sign Up Form */
            <form onSubmit={handleJWTSubmit} className="space-y-3.5">
              <div>
                <label className="text-2xs text-zinc-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    required
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-2xs text-zinc-400 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-2xs text-zinc-400 uppercase tracking-wider block mb-1">
                  Aspirational Role / Goal
                </label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="AI Systems Founder & Cognitive Engineer">AI Systems Founder & Cognitive Engineer</option>
                    <option value="AI Research Engineer">AI Research Engineer</option>
                    <option value="Senior ML / Backend Systems Engineer">Senior ML / Backend Systems Engineer</option>
                    <option value="Human Potential Technical Researcher">Human Potential Technical Researcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-2xs text-zinc-400 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-2xs text-zinc-400 pt-1">
                <input type="checkbox" defaultChecked required className="rounded accent-amber-400" />
                <span>I agree to PACER's Ethical Curation & Privacy Policy</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-400 text-amber-950 text-xs flex items-center justify-center gap-2 hover:bg-amber-300 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/10"
              >
                <span>{loading ? "Creating Account..." : "Create Account & Start"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-900">
            <span>Already have an account? </span>
            <Link to="/signin" className="text-amber-400 hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
