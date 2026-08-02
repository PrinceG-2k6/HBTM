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
    <div className="relative w-full min-h-screen bg-[#141416] text-zinc-100 pb-24 overflow-x-hidden selection:bg-amber-400 selection:text-black">
      {/* 3D Background Canvas */}
      <Interactive3DCanvas />

      {/* Ambient Radial Glow Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[450px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* ── Top Header Brand Row ──────────────── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-8 pb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <Link to="/" className="group flex flex-col">
            <span className="text-2xl sm:text-3xl font-black tracking-wider text-white font-mono group-hover:text-amber-400 transition-colors">
              UVOM
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-zinc-400 font-bold uppercase -mt-1">
              UPGRADED VERSION OF ME
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 rounded-full bg-amber-400 text-amber-950 text-xs sm:text-sm font-semibold hover:bg-amber-300 transition-all cursor-pointer shadow-xl shadow-amber-400/20 hover:scale-105 flex items-center gap-2"
            >
              <span>Dashboard</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <Link
                to="/signin"
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white text-xs sm:text-sm font-medium transition-all backdrop-blur-xl hover:scale-105"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 space-y-32">

        {/* ── 1. Hero Section (Replicating exact image layout in dark theme) ───── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-8 sm:pt-12">
          
          {/* Left Column: Headline, Description & CTA */}
          <div className="lg:col-span-5 flex flex-col space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs backdrop-blur-xl w-max">
              <Sparkles size={14} className="text-amber-400" />
              <span className="font-medium">Curating Human Potential</span>
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Become the self <br className="hidden sm:inline" />
              you imagine
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl font-normal">
              We are a guide, curating a unique personalized path to the self you imagine through media, products, pieces and experiences.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to={isAuthenticated ? "/dashboard" : "/signup"}
                className="px-9 py-4 rounded-full bg-white text-black font-semibold text-sm sm:text-base hover:bg-amber-400 hover:text-black transition-all duration-300 shadow-2xl hover:scale-105 flex items-center gap-3 cursor-pointer group"
              >
                <span>Start Here</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/sandbox"
                className="px-6 py-4 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs sm:text-sm transition-all backdrop-blur-xl flex items-center gap-2"
              >
                <PlayCircle size={16} className="text-amber-400" />
                <span>Explore 3D Sandbox</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80 max-w-lg">
              <div>
                <div className="text-2xl font-bold text-white font-mono">99.8%</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Signal Quality</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400 font-mono">0 Fluff</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">Attention Filter</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">1-on-1</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">AI Curation</div>
              </div>
            </div>
          </div>

          {/* Right Column: Staggered Portrait Collage Grid */}
          <div className="lg:col-span-7 relative flex justify-center lg:justify-end items-center gap-3 sm:gap-4 py-4">
            
            {/* Column 1 (Left Portrait) */}
            <div className="flex flex-col gap-4 mt-10 sm:mt-14">
              <div className="relative group overflow-hidden rounded-[2rem] border border-zinc-800/90 shadow-2xl w-32 sm:w-44 xl:w-48 h-56 sm:h-72 xl:h-80 transition-all duration-500 hover:scale-[1.03] hover:border-amber-400/50">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                  alt="Personalized Path Aspirant"
                  className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                  <span className="text-2xs font-semibold text-amber-300">Identity & Focus</span>
                </div>
              </div>
            </div>

            {/* Column 2 (Center 2 Stacked Portraits) */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* B&W Top Portrait */}
              <div className="relative group overflow-hidden rounded-[2rem] border border-zinc-800/90 shadow-2xl w-32 sm:w-44 xl:w-48 h-44 sm:h-56 xl:h-60 transition-all duration-500 hover:scale-[1.03] hover:border-amber-400/50">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                  alt="Mindset & Mastery"
                  className="w-full h-full object-cover filter grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Cyan/Blue Neon Bottom Portrait */}
              <div className="relative group overflow-hidden rounded-[2rem] border border-zinc-800/90 shadow-2xl w-32 sm:w-44 xl:w-48 h-36 sm:h-48 xl:h-52 transition-all duration-500 hover:scale-[1.03] hover:border-amber-400/50">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
                  alt="Experiential Growth"
                  className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Column 3 (Right 2 Stacked Portraits) */}
            <div className="flex flex-col gap-3 sm:gap-4 -mt-6 sm:-mt-10">
              {/* Blue backdrop Hoodie Top Portrait */}
              <div className="relative group overflow-hidden rounded-[2rem] border border-zinc-800/90 shadow-2xl w-32 sm:w-44 xl:w-48 h-48 sm:h-60 xl:h-64 transition-all duration-500 hover:scale-[1.03] hover:border-amber-400/50">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
                  alt="Self Evolution"
                  className="w-full h-full object-cover filter brightness-[0.92] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Golden Lighting Bottom Portrait */}
              <div className="relative group overflow-hidden rounded-[2rem] border border-zinc-800/90 shadow-2xl w-32 sm:w-44 xl:w-48 h-52 sm:h-64 xl:h-72 transition-all duration-500 hover:scale-[1.03] hover:border-amber-400/50">
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
                  alt="Human Potential Realized"
                  className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

          </div>

        </section>

        {/* ── 2. Interactive Hero Demo Showcase ────────────── */}
        <section className="relative rounded-3xl bg-zinc-950/90 border border-zinc-800/90 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">Interactive Curation Simulator</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Experience Curation Protocol Live</h2>
            </div>

            <div className="flex p-1 bg-zinc-900 rounded-full border border-zinc-800 text-xs">
              {(["signal", "adaptive", "vector"] as const).map((sim) => (
                <button
                  key={sim}
                  onClick={() => setActiveSim(sim)}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer font-medium capitalize text-xs ${activeSim === sim
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-rose-400 uppercase font-semibold">
                  <span>Traditional Feed (Attention Economy)</span>
                  <span className="bg-rose-950 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-800 text-2xs">Auto Blocked</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-mono">
                  "10 Secrets to Master AI in 5 Minutes!" (45-min video with clickbait ads)
                </p>
                <div className="text-xs text-rose-300/80 flex items-center gap-1.5 pt-1">
                  <span>Result: Dopamine loop → 0% retention → Attention wasted</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-400 uppercase font-semibold">
                  <span>UVOM Curation (Human Potential Economy)</span>
                  <span className="bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 text-2xs">99.8% Signal</span>
                </div>
                <p className="text-sm text-white leading-relaxed font-mono">
                  "Vector Embeddings & Cosine Similarity 3D Dry-Run Sandbox"
                </p>
                <div className="text-xs text-emerald-300 flex items-center gap-1.5 pt-1 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Result: 15-min interactive simulation → +38% retention score</span>
                </div>
              </div>
            </div>
          )}

          {activeSim === "adaptive" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="text-2xs bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-semibold">Stage 1 · 78%</span>
                <h4 className="text-sm font-semibold text-white">Foundational Systems</h4>
                <p className="text-xs text-zinc-400">Deep focus habits, cognitive energy profiling & signal filtering</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/50 space-y-2 shadow-lg shadow-amber-500/5">
                <span className="text-2xs bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">Stage 2 (Active) · 45%</span>
                <h4 className="text-sm font-semibold text-white">Autonomous Identity Memory</h4>
                <p className="text-xs text-zinc-400">Vector identity mapping, personalized media diet curation</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 opacity-60">
                <span className="text-2xs bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-semibold">Stage 3 · 10%</span>
                <h4 className="text-sm font-semibold text-white">Future Self Integration</h4>
                <p className="text-xs text-zinc-400">High-dimensional milestone projection & experiential guides</p>
              </div>
            </div>
          )}

          {activeSim === "vector" && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Brain size={18} /> Learner Vector Identity Representation
                </span>
                <span className="text-2xs text-emerald-400 bg-emerald-950 px-3 py-0.5 rounded-full border border-emerald-800 font-mono">
                  Updated Live
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-mono">
                "Aspires to build technology that elevates human potential and technical mastery rather than exploiting dopamine loops."
              </p>
            </div>
          )}
        </section>

        {/* ── 3. System Architecture ────────────── */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">System Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Designed for total clarity</h2>
            <p className="text-sm text-zinc-400">Four core pillars engineered to turn information into wisdom.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <ShieldCheck size={24} className="text-amber-400" />,
                title: "01. Noise Suppression Gate",
                desc: "Filters out clickbait, outrage media, and superficial video feeds using high-dimensional cosine similarity indexing before anything hits your feed.",
              },
              {
                icon: <Target size={24} className="text-emerald-400" />,
                title: "02. Dynamic Adaptive Roadmap",
                desc: "Nodes continuously reorganize based on your daily retention scores and cognitive fatigue metrics. Zero rigid one-size-fits-all courses.",
              },
              {
                icon: <Cpu size={24} className="text-blue-400" />,
                title: "03. Interactive 3D Sandboxes",
                desc: "Replaces passive video scrolling with interactive 3D simulations, dry-run code sandboxes, and concept maps for peak retention.",
              },
              {
                icon: <Brain size={24} className="text-violet-400" />,
                title: "04. Future Self Projection",
                desc: "Maps your current trajectory against 3-month, 6-month, and 1-year aspirational milestones for skills, projects, and identity goals.",
              },
            ].map((pillar, idx) => (
              <div key={idx} className="group space-y-3 p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-400/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-amber-400/50 transition-colors shrink-0">
                    {pillar.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pl-16">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Comparison List ───────────────── */}
        <section className="p-8 sm:p-10 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-8">
          <div className="text-center max-w-md mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How UVOM Compares</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Transforming your digital media & growth diet.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-4">
              <h3 className="text-rose-400 text-base font-semibold">Legacy Social Feeds</h3>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-center gap-2">• Optimizes for time-on-site & ad clicks</li>
                <li className="flex items-center gap-2">• Surfaces rage-bait & superficial video shorts</li>
                <li className="flex items-center gap-2">• Zero tracking of long-term skill retention</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-4">
              <h3 className="text-amber-300 text-base font-semibold">UVOM AI Curator</h3>
              <ul className="space-y-3 text-zinc-200">
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check size={16} /> Optimizes for Human Potential & Self Mastery
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check size={16} /> Auto-suppresses fluff; surfaces 3D sandboxes & curated guides
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check size={16} /> Dynamic adaptive roadmap recalculates daily
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── 5. Final CTA Banner ────── */}
        <section className="text-center space-y-8 pt-4 pb-12">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Ready to elevate your trajectory?
            </h2>
            <p className="text-sm sm:text-base text-zinc-400">
              Join thinkers, creators, and leaders using UVOM to become the self they imagine.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              className="px-9 py-4 rounded-full bg-white text-black font-semibold text-sm sm:text-base hover:bg-amber-400 hover:text-black transition-all shadow-2xl hover:scale-105 flex items-center gap-3 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
