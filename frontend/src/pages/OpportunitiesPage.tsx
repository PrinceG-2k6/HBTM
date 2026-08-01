import React, { useEffect, useState } from "react";
import { Sparkles, ExternalLink, Filter } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { Opportunity } from "../api/types";

const ALL_TYPES = ["All", "Hackathon", "Workshop", "Mentorship", "Open Source", "Conference"];

export const OpportunitiesPage: React.FC = () => {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    apiService.getOpportunities()
      .then(d => { setOpps(d); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const defaultOpps: Opportunity[] = [
    {
      id: "opp-1",
      title: "Distributed AI Systems Masterclass",
      type: "Workshop",
      organizer: "PACER AI Academy",
      relevanceScore: 98,
      deadline: "August 15, 2026",
      description: "Interactive session on multi-node agent orchestration and state synchronization.",
      link: "https://hubermanlab.com",
      bookmarked: false,
      tags: ["AI", "Architecture"],
    },
    {
      id: "opp-2",
      title: "1-on-1 Architecture Mentorship",
      type: "Mentorship",
      organizer: "Senior Principal Engineer",
      relevanceScore: 95,
      deadline: "August 20, 2026",
      description: "Direct feedback on system design blueprints and career trajectory.",
      link: "https://jamesclear.com",
      bookmarked: true,
      tags: ["Mentorship", "Career"],
    },
    {
      id: "opp-3",
      title: "High-Performance Habits Workshop",
      type: "Workshop",
      organizer: "Growth Institute",
      relevanceScore: 92,
      deadline: "Self-paced",
      description: "Practical exercises for eliminating high-dopamine distraction traps.",
      link: "https://hubermanlab.com",
      bookmarked: false,
      tags: ["Habits", "Focus"],
    },
  ];

  const activeOpps = opps.length > 0 ? opps : defaultOpps;
  const filtered = filter === "All" ? activeOpps : activeOpps.filter(o => o.type === filter);

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      <SkeletonCard rows={2} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonCard rows={5} /><SkeletonCard rows={5} /></div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white">Curated <span className="text-purple-400">Opportunities</span></h1>
        <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-purple-400" />
          <span>Hand-selected mentorships, workshops, and masterclasses matching your target identity.</span>
        </p>
      </div>

      {/* Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-400 flex items-center gap-1"><Filter size={14} /> Filter:</span>
        {ALL_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              filter === type
                ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40"
                : "bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(opp => (
          <Card key={opp.id} className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                  {opp.type}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {opp.relevanceScore}% Match
                </span>
              </div>
              <h3 className="text-lg text-white font-medium">{opp.title}</h3>
              <p className="text-sm text-zinc-400">By {opp.organizer}</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{opp.description}</p>
            </div>

            <a
              href={opp.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              Apply / Learn More <ExternalLink size={14} />
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
};
