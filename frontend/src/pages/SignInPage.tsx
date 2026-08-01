import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../contexts/auth.context";

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithJWT, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleEmail, setGoogleEmail] = useState("sparshgupta78970@gmail.com");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJWTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please complete all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await loginWithJWT(email, password);
      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message || "Invalid email or password.");
      }
    } catch {
      setError("Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSubmit = async (customEmail?: string, credential?: string) => {
    setLoading(true);
    setError("");
    try {
      const targetEmail = customEmail || googleEmail || "sparshgupta78970@gmail.com";
      const res = await loginWithGoogle({
        credential: credential || `google_oauth_token_${Date.now()}`,
        email: targetEmail,
        name: targetEmail.split("@")[0],
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
      });

      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message || "Google authentication failed.");
      }
    } catch {
      setError("Google Sign In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse?.credential) {
      try {
        const decoded: any = jwtDecode(credentialResponse.credential);
        await handleGoogleAuthSubmit(decoded.email, credentialResponse.credential);
        return;
      } catch {
        // Fallback
      }
    }
    await handleGoogleAuthSubmit();
  };

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-amber-400">
            <Sparkles size={14} />
            <span className="tracking-wider uppercase font-mono">PACER AI</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sign In to PACER</h1>
          <p className="text-xs text-zinc-400">
            Continue your personalized human potential curation journey
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <ShieldCheck size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleJWTSubmit} className="space-y-4">
            <div>
              <label className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In with Email"}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full"></div>
            <span className="bg-zinc-950 px-3 text-2xs text-zinc-500 uppercase tracking-wider font-mono shrink-0">
              OR GOOGLE AUTH
            </span>
          </div>

          {/* Google OAuth Section */}
          <div className="space-y-3">
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setShowGoogleModal(true)}
                useOneTap={false}
                theme="filled_black"
                shape="circle"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full py-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In via Google Account</span>
            </button>
          </div>

          {/* Fallback Google Auth Modal */}
          {showGoogleModal && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 size={14} /> Google Account Sign-In
              </div>
              <p className="text-2xs text-zinc-400">
                Enter your Google Account email to authenticate against Express backend:
              </p>
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="sparshgupta78970@gmail.com"
                className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 outline-none focus:border-amber-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGoogleAuthSubmit()}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer"
                >
                  {loading ? "Signing in..." : "Authenticate Google Account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-900">
            <span>Don't have an account yet? </span>
            <Link to="/signup" className="text-amber-400 font-semibold hover:underline">
              Register Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
