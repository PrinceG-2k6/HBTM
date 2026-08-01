import React, { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Sparkles, ExternalLink, Filter, Search } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { Opportunity } from "../api/types";


const TYPE_COLORS: Record<string, string> = {
  "Hackathon":     "bg-violet-100 text-violet-900",
  "Internship":    "bg-blue-100 text-blue-900",
  "Open Source":   "bg-emerald-100 text-emerald-900",
  "Research Paper":"bg-amber-100 text-amber-900",
  "Meetup":        "bg-pink-100 text-pink-900",
  "Competition":   "bg-orange-100 text-orange-900",
  "Conference":    "bg-indigo-100 text-indigo-900",
};

const ALL_TYPES = ["All", "Hackathon", "Internship", "Open Source", "Research Paper", "Meetup", "Competition", "Conference"];

export const OpportunitiesPage: React.FC = () => {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiService.getOpportunities()
      .then(d => { setOpps(d); const bm: Record<string, boolean> = {}; d.forEach(o => { if (o.bookmarked) bm[o.id] = true; }); setBookmarks(bm); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleBookmark = (id: string) => setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = filter === "All" ? opps : opps.filter(o => o.type === filter);

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      <SkeletonCard rows={2} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonCard rows={5} /><SkeletonCard rows={5} /></div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Opportunity <span>Feed</span></h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-600" />
            <span>Curated by PACER based on your skills, identity, and roadmap progress.</span>
          </p>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <Filter size={14} />{filtered.length} opportunities
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all border ${
              filter === type ? "bg-black text-white border-black" : "bg-white/60 text-gray-700 border-white/80 hover:bg-white/80"
            }`}>
            {type}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(opp => (
          <Card key={opp.id} className="flex flex-col justify-between space-y-3 border-white/80 hover:shadow-md transition-all">
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs ${TYPE_COLORS[opp.type] || "bg-gray-100 text-gray-700"}`}>{opp.type}</span>
                <button onClick={() => toggleBookmark(opp.id)} className="p-1 hover:bg-black/5 rounded-full cursor-pointer shrink-0">
                  {bookmarks[opp.id]
                    ? <BookmarkCheck size={15} className="text-amber-600" />
                    : <Bookmark size={15} className="text-gray-400" />}
                </button>
              </div>
              <h3 className="text-base text-gray-900 mt-2 leading-snug">{opp.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{opp.organizer}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{opp.description}</p>
            </div>

            <div>
              {/* Relevance */}
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Curator Relevance</span>
                <span className="text-emerald-700">{opp.relevanceScore}%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${opp.relevanceScore}%` }} />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {opp.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-white/70 border border-gray-200 rounded-full text-gray-600">{tag}</span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                {opp.deadline && <span className="text-xs text-orange-700">Deadline: {opp.deadline}</span>}
                <button className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-black text-white hover:bg-gray-800 cursor-pointer">
                  <span>View</span><ExternalLink size={12} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">No opportunities match this filter.</p>
          <button onClick={() => setFilter("All")} className="mt-3 text-xs text-gray-700 underline cursor-pointer">Show all</button>
        </div>
      )}
    </div>
  );
};
