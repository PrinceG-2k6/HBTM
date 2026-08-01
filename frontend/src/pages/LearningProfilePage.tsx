import React, { useEffect, useState } from "react";
import { Brain, Plus, Sparkles, RefreshCw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { LearningProfileResponse } from "../api";
import type { MemoryVector } from "../api/types";

export const LearningProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<LearningProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newStatement, setNewStatement] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryVector["category"]>("Identity & Aspirations");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    apiService.getLearningProfile()
      .then(d => { setProfileData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const defaultProfileData: LearningProfileResponse = {
    memoryVectors: [
      {
        id: "mem-1",
        category: "Identity & Aspirations",
        statement: "Shifting identity from Burnt Out Engineer to Principal AI System Architect & High-Vitality Leader.",
        confidence: 96,
        lastUpdated: "2026-07-28T10:00:00Z",
        impactOnCurator: "High priority filter for architecture and AI orchestration guides",
        active: true,
      },
      {
        id: "mem-2",
        category: "Learning Habits",
        statement: "Prefers 90-minute ultradian blocks with 0 phone notifications during deep work sessions.",
        confidence: 94,
        lastUpdated: "2026-07-29T14:30:00Z",
        impactOnCurator: "Recommends 90-minute focus routines during morning sessions",
        active: true,
      },
      {
        id: "mem-3",
        category: "Cognitive Style",
        statement: "Resonates best with event-driven architecture and CQRS patterns over monolithic systems.",
        confidence: 90,
        lastUpdated: "2026-07-30T08:15:00Z",
        impactOnCurator: "Weights system architecture content toward event-sourcing patterns",
        active: true,
      },
      {
        id: "mem-4",
        category: "Curator Filters",
        statement: "Prefers high-signal podcasts, expert guides, and hands-on exercises over generic news feeds.",
        confidence: 92,
        lastUpdated: "2026-07-31T16:00:00Z",
        impactOnCurator: "Filters out low-signal attention traps and clickbait",
        active: true,
      },
    ],
    preferences: {
      learningStyle: "Visual",
      dailyGoalMinutes: 45,
      preferredFormat: "Articles",
      difficultyLevel: "Intermediate",
      lastUpdated: "2026-07-31T16:00:00Z",
    },
    aiKnows: [],
  };

  const activeData = profileData && profileData.memoryVectors?.length ? profileData : defaultProfileData;
  const { memoryVectors, preferences } = activeData;

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;
    setSubmitting(true);
    try {
      const updated = await apiService.addMemoryVector({ category: newCategory, statement: newStatement });
      setProfileData(prev => prev ? { ...prev, memoryVectors: updated } : null);
      setNewStatement("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12"><SkeletonCard rows={2} /><SkeletonCard rows={8} /></div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white">Curator <span className="text-purple-400">Memory Profile</span></h1>
          <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
            <Brain size={16} className="text-purple-400" />
            <span>Persistent facts and habits known by your AI curator to personalize your daily feed.</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all cursor-pointer shadow-lg shadow-purple-950/40 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Memory Fact
        </button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <Card className="p-6 bg-zinc-900/60 backdrop-blur-xl border-0 shadow-xl space-y-4">
          <h3 className="text-lg text-white">Add New Memory Vector</h3>
          <form onSubmit={handleAddMemory} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-300 block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full bg-zinc-950 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Identity & Aspirations">Identity & Aspirations</option>
                <option value="Cognitive Style">Cognitive Style</option>
                <option value="Learning Habits">Learning Habits</option>
                <option value="Curator Filters">Curator Filters</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-zinc-300 block mb-1">Statement</label>
              <textarea
                value={newStatement}
                onChange={e => setNewStatement(e.target.value)}
                placeholder="e.g., Prefers 45-minute morning workouts before technical focus sessions."
                className="w-full bg-zinc-950 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />} Save Fact
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Preferences Summary */}
      <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-3">
        <h2 className="text-xl text-white">Curator Curation Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-2">
          <div>
            <span className="text-zinc-400 block">Daily Target</span>
            <span className="text-white font-medium">{preferences?.dailyGoalMinutes || 45} Minutes / Day</span>
          </div>
          <div>
            <span className="text-zinc-400 block">Media Formats</span>
            <span className="text-purple-300 font-medium">{preferences?.preferredFormat || "Articles"}</span>
          </div>
          <div>
            <span className="text-zinc-400 block">Target Level</span>
            <span className="text-emerald-300 font-medium">{preferences?.difficultyLevel || "Intermediate"}</span>
          </div>
        </div>
      </Card>

      {/* Memory Vectors List */}
      <div className="space-y-4">
        <h2 className="text-xl text-white">Known Facts & Memory Vectors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {memoryVectors.map(mem => (
            <Card key={mem.id} className="p-6 bg-zinc-900/40 backdrop-blur-xl border-0 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                  {mem.category}
                </span>
                <span className="text-sm font-semibold text-emerald-400">{mem.confidence}% Confidence</span>
              </div>
              <p className="text-base text-zinc-100 leading-relaxed">{mem.statement}</p>
              <p className="text-xs text-zinc-400 pt-1">Impact: {mem.impactOnCurator}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
