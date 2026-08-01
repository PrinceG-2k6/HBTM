import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, ShieldCheck, Brain, Target, PlayCircle,
  CheckCircle2, Cpu, Lock, Check
} from "lucide-react";
import { Interactive3DCanvas } from "../components/3d/Interactive3DCanvas";
import { useAuth } from "../contexts/auth.context";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeSim, setActiveSim] = useState<"signal" | "adaptive" | "vector">("signal");

  return (
    <div className="relative w-full min-h-screen text-zinc-100 pb-20 overflow-hidden">
      {/* 3D Background Canvas */}
      <Interactive3DCanvas />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[500px] h-[350px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-28 pt-8">

        {/* ── 1. Hero Section ─────────────────────────────── */}
        <div className="flex flex-col items-center text-center space-y-8 pt-10 max-w-3xl mx-auto">
          
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs backdrop-blur-xl hover:border-amber-400/50 transition-all cursor-pointer shadow-lg group">
            <Sparkles size={14} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Optimizing for human potential, not attention</span>
            <ArrowRight size={12} className="text-amber-400" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl tracking-tight text-white leading-[1.15]">
            Not an algorithm. A <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400">curator</span>. For your human potential.
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
            Today's algorithms optimize for attention. PACER optimizes for <em>you</em> — understanding your aspirations, habits, and evolving identity to continuously surface the right media, ideas, and experiences at the right moment in your journey.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3.5 rounded-full bg-amber-400 text-amber-950 text-xs sm:text-sm hover:bg-amber-300 transition-all cursor-pointer shadow-xl shadow-amber-400/20 hover:scale-105 flex items-center gap-2"
              >
                <span>Launch My Workspace</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-8 py-3.5 rounded-full bg-amber-400 text-amber-950 text-xs sm:text-sm hover:bg-amber-300 transition-all cursor-pointer shadow-xl shadow-amber-400/20 hover:scale-105 flex items-center gap-2"
                >
                  <span>Start Free Curation</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/signin"
                  className="px-6 py-3.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs sm:text-sm transition-all backdrop-blur-xl flex items-center gap-2 hover:scale-105"
                >
                  <Lock size={14} className="text-zinc-400" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
            <Link
              to="/learning-lab"
              className="px-6 py-3.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/80 text-zinc-300 text-xs sm:text-sm transition-all backdrop-blur-xl flex items-center gap-2"
            >
              <PlayCircle size={16} className="text-amber-400" />
              <span>Try Interactive 3D Lab</span>
            </Link>
          </div>

          {/* Live Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full pt-10 border-t border-zinc-800/60 mt-4">
            <div className="space-y-0.5">
              <div className="text-2xl text-white font-mono">74</div>
              <div className="text-2xs text-zinc-400 uppercase tracking-wider">Human Potential Score</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl text-amber-400 font-mono">37</div>
              <div className="text-2xs text-zinc-400 uppercase tracking-wider">Attention Traps Blocked</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl text-emerald-400 font-mono">14 Days</div>
              <div className="text-2xs text-zinc-400 uppercase tracking-wider">Growth Streak</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl text-blue-400 font-mono">86%</div>
              <div className="text-2xs text-zinc-400 uppercase tracking-wider">Mindful Consumption</div>
            </div>
          </div>
        </div>

        {/* ── 2. Interactive Hero Demo Showcase ────────────── */}
        <div className="relative rounded-3xl bg-zinc-950/90 border border-zinc-800/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <span className="text-2xs uppercase tracking-wider text-amber-400">Interactive Hero Simulator</span>
              <h2 className="text-lg text-white mt-0.5">Experience PACER Curation Protocol Live</h2>
            </div>

            <div className="flex p-1 bg-zinc-900 rounded-full border border-zinc-800 text-xs">
              {(["signal", "adaptive", "vector"] as const).map((sim) => (
                <button
                  key={sim}
                  onClick={() => setActiveSim(sim)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer capitalize text-xs ${
                    activeSim === sim
                      ? "bg-amber-400 text-amber-950 shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {sim === "signal" ? "Signal Filter" : sim === "adaptive" ? "Dynamic Roadmap" : "Vector Identity"}
                </button>
              ))}
            </div>
          </div>

          {activeSim === "signal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-rose-900/40 space-y-2">
                <div className="flex items-center justify-between text-2xs text-rose-400 uppercase">
                  <span>Traditional Feed (Attention Economy)</span>
                  <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800">Auto Blocked</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  "10 Secrets to Master AI in 5 Minutes!" (45-min video with clickbait ads)
                </p>
                <div className="text-2xs text-rose-300/80 flex items-center gap-1 pt-1">
                  <span>Result: Dopamine loop → 0% retention → Attention wasted</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between text-2xs text-emerald-400 uppercase">
                  <span>PACER Curation (Human Potential Economy)</span>
                  <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">99.8% Signal</span>
                </div>
                <p className="text-xs text-white leading-relaxed">
                  "Vector Embeddings & Cosine Similarity 3D Dry-Run Sandbox"
                </p>
                <div className="text-2xs text-emerald-300 flex items-center gap-1 pt-1">
                  <CheckCircle2 size={12} />
                  <span>Result: 15-min interactive 3D simulation → +38% retention score</span>
                </div>
              </div>
            </div>
          )}

          {activeSim === "adaptive" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="text-2xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">Stage 1 · 78%</span>
                <h4 className="text-xs text-white">Foundational AI Systems</h4>
                <p className="text-2xs text-zinc-400">Python execution models, stack unwinding, memory profiling</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/50 space-y-2 shadow-lg shadow-amber-500/5">
                <span className="text-2xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">Stage 2 (Active) · 45%</span>
                <h4 className="text-xs text-white">Autonomous Vector Memory</h4>
                <p className="text-2xs text-zinc-400">HNSW vector search, cosine similarity, multi-agent consensus</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 opacity-60">
                <span className="text-2xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">Stage 3 · 10%</span>
                <h4 className="text-xs text-white">Human Potential Curation</h4>
                <p className="text-2xs text-zinc-400">Platform architecture for intentional learning systems</p>
              </div>
            </div>
          )}

          {activeSim === "vector" && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Brain size={16} /> Learner Vector Memory Representation
                </span>
                <span className="text-2xs text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Updated Live
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                "Aspires to build technology that elevates human potential and technical mastery rather than exploiting dopamine loops."
              </p>
            </div>
          )}
        </div>

        {/* ── 3. Minimalist System Architecture ────────────── */}
        <div className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-2xs uppercase tracking-wider text-amber-400">System Architecture</span>
            <h2 className="text-3xl text-white tracking-tight">Designed for total clarity</h2>
            <p className="text-xs text-zinc-400">Four core pillars engineered to turn information into wisdom.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <ShieldCheck size={22} className="text-amber-400" />,
                title: "01. Noise Suppression Gate",
                desc: "Filters out clickbait, outrage media, and superficial video feeds using high-dimensional cosine similarity indexing before anything hits your feed.",
              },
              {
                icon: <Target size={22} className="text-emerald-400" />,
                title: "02. Dynamic Adaptive Roadmap",
                desc: "Nodes continuously reorganize based on your daily retention scores and cognitive fatigue metrics. Zero rigid one-size-fits-all courses.",
              },
              {
                icon: <Cpu size={22} className="text-blue-400" />,
                title: "03. Interactive 3D Labs",
                desc: "Replaces passive video scrolling with interactive 3D simulations, dry-run code sandboxes, and concept maps for peak retention.",
              },
              {
                icon: <Brain size={22} className="text-violet-400" />,
                title: "04. Future Self Projection",
                desc: "Maps your current trajectory against 3-month, 6-month, and 1-year aspirational milestones for skills, projects, and career readiness.",
              },
            ].map((pillar, idx) => (
              <div key={idx} className="group space-y-3 p-2 hover:translate-x-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-amber-400/50 transition-colors">
                    {pillar.icon}
                  </div>
                  <h3 className="text-base text-white">{pillar.title}</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-13">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Comparison List ───────────────── */}
        <div className="p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1">
            <h2 className="text-2xl text-white">How PACER Compares</h2>
            <p className="text-xs text-zinc-400">Transforming your digital media diet.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <h3 className="text-rose-400 text-sm">Legacy Social Feeds</h3>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2">• Optimizes for time-on-site & ad clicks</li>
                <li className="flex items-center gap-2">• Surfaces rage-bait & superficial video shorts</li>
                <li className="flex items-center gap-2">• Zero tracking of long-term skill retention</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
              <h3 className="text-amber-300 text-sm">PACER AI Curator</h3>
              <ul className="space-y-2 text-zinc-200">
                <li className="flex items-center gap-2 text-emerald-400">
                  <Check size={14} /> Optimizes for Human Potential & Skill Mastery
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <Check size={14} /> Auto-suppresses fluff; surfaces 3D sandboxes & ArXiv papers
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <Check size={14} /> Dynamic adaptive roadmap recalculates daily
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── 5. CTA Banner ────── */}
        <div className="text-center space-y-6 pt-4 pb-8">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl text-white tracking-tight">
              Ready to elevate your media diet?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Join founders, researchers, and engineers using PACER to become the self they imagine.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-full bg-amber-400 text-amber-950 text-xs sm:text-sm hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20 hover:scale-105 flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs sm:text-sm hover:bg-zinc-800 transition-all"
            >
              View Live Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
