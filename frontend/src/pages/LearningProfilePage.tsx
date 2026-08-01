import React, { useEffect, useState } from "react";
import { Brain, Plus, Shield, RefreshCw, Sparkles, Edit2, Save, X } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { LearningProfileResponse } from "../api";
import type { MemoryVector, LearnerPreferences } from "../api/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Identity & Aspirations": "bg-violet-100 text-violet-900",
  "Cognitive Style": "bg-blue-100 text-blue-900",
  "Learning Habits": "bg-emerald-100 text-emerald-900",
  "Curator Filters": "bg-amber-100 text-amber-900",
};

export const LearningProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<LearningProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [newStatement, setNewStatement] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryVector["category"]>("Identity & Aspirations");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Partial<LearnerPreferences>>({});

  useEffect(() => {
    apiService.getLearningProfile()
      .then(d => { setProfileData(d); setPrefs(d.preferences); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;
    setSubmitting(true);
    try {
      const updated = await apiService.addMemoryVector({ category: newCategory, statement: newStatement });
      setProfileData((d: any) => d ? { ...d, memoryVectors: updated } : d);
      setNewStatement("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      const updated = await apiService.updatePreferences(prefs);
      setProfileData((d: any) => d ? { ...d, preferences: updated } : d);
      setEditingPrefs(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
        <SkeletonCard rows={2} /><SkeletonCard rows={6} />
      </div>
    );
  }

  if (!profileData) return null;

  const { memoryVectors, preferences, aiKnows } = profileData;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">My Learning <span>Profile</span></h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Brain size={16} className="text-amber-600" />
            <span>PACER's evolving model of your aspirations, habits, and cognitive identity.</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-full bg-black text-white text-xs flex items-center gap-2 hover:bg-gray-800 cursor-pointer shadow-sm"
        >
          <Plus size={16} />Add Identity Memory
        </button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <Card className="bg-amber-50/90 border-amber-200 space-y-3">
          <h3 className="text-sm text-amber-950 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600" />
            Teach PACER about your evolving identity & rules
          </h3>
          <form onSubmit={handleAddMemory} className="space-y-3">
            <div>
              <label className="text-xs text-amber-900 block mb-1">Memory Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as MemoryVector["category"])}
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white outline-none">
                <option>Identity & Aspirations</option>
                <option>Learning Habits</option>
                <option>Cognitive Style</option>
                <option>Curator Filters</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-amber-900 block mb-1">Statement</label>
              <input type="text" value={newStatement} onChange={e => setNewStatement(e.target.value)}
                placeholder="e.g., I prefer 20-minute focused sessions over long video lectures."
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 rounded-full text-xs text-gray-600 hover:bg-black/5 cursor-pointer">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-full bg-amber-600 text-white text-xs hover:bg-amber-700 cursor-pointer disabled:opacity-50">
                {submitting ? "Saving..." : "Save Memory"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left col — AI Knows + Preferences */}
        <div className="lg:col-span-5 space-y-5">

          {/* Things AI Knows About You */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm text-gray-900">Things AI Knows About You</h3>
                <p className="text-2xs text-gray-500">Learned from your behavior & reflections</p>
              </div>
            </div>
            <div className="space-y-2">
              {aiKnows.map((fact: any) => (
                <div key={fact.id || fact.fact} className="p-3 rounded-2xl bg-white/80 border border-black/5 hover:border-amber-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-800 leading-relaxed">"{fact.fact}"</p>
                    <span className="text-2xs text-emerald-700 shrink-0">{fact.confidenceLevel || fact.confidence}%</span>
                  </div>
                  <div className="mt-1.5">
                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${fact.confidenceLevel || fact.confidence}%` }} />
                    </div>
                    <span className="text-2xs text-gray-400 mt-0.5 block">{fact.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Editable Preferences */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-900">Learning Preferences</h3>
              {editingPrefs ? (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingPrefs(false); setPrefs(preferences); }}
                    className="p-1.5 hover:bg-black/5 rounded-full cursor-pointer"><X size={14} className="text-gray-500" /></button>
                  <button onClick={handleSavePrefs} disabled={savingPrefs}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-black text-white text-2xs cursor-pointer disabled:opacity-50">
                    <Save size={12} />{savingPrefs ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingPrefs(true)}
                  className="flex items-center gap-1 text-2xs text-gray-600 hover:text-gray-900 cursor-pointer p-1 hover:bg-black/5 rounded-full">
                  <Edit2 size={12} />Edit
                </button>
              )}
            </div>

            <div className="space-y-3">
              {[
                { key: "learningStyle" as keyof LearnerPreferences, label: "Learning Style", options: ["Visual", "Reading", "Hands-on", "Auditory"] },
                { key: "preferredFormat" as keyof LearnerPreferences, label: "Preferred Format", options: ["Video", "Articles", "Code Sandboxes", "Research Papers", "Mixed"] },
                { key: "difficultyLevel" as keyof LearnerPreferences, label: "Difficulty Level", options: ["Beginner", "Intermediate", "Advanced"] },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-2xs text-gray-500 uppercase tracking-wider block mb-1">{field.label}</label>
                  {editingPrefs ? (
                    <select value={prefs[field.key] as string || ""}
                      onChange={e => setPrefs(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white outline-none">
                      {field.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-900 px-3 py-1.5 bg-white/70 border border-gray-200 rounded-xl block">{preferences[field.key] as string}</span>
                  )}
                </div>
              ))}

              <div>
                <label className="text-2xs text-gray-500 uppercase tracking-wider block mb-1">Daily Goal (minutes)</label>
                {editingPrefs ? (
                  <input type="number" value={prefs.dailyGoalMinutes || 90}
                    onChange={e => setPrefs(p => ({ ...p, dailyGoalMinutes: parseInt(e.target.value) }))}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white outline-none" />
                ) : (
                  <span className="text-xs text-gray-900 px-3 py-1.5 bg-white/70 border border-gray-200 rounded-xl block">{preferences.dailyGoalMinutes} minutes/day</span>
                )}
              </div>
            </div>

            <p className="text-2xs text-gray-400">Last updated: {preferences.lastUpdated}</p>
          </Card>
        </div>

        {/* Right — Memory Vectors */}
        <div className="lg:col-span-7">
          <h3 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
            <Brain size={16} className="text-amber-600" />
            Identity Memory Vectors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryVectors.map((node: any) => (
              <Card key={node.id} className="flex flex-col justify-between space-y-3 border-white/80">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-2xs uppercase tracking-wider ${CATEGORY_COLORS[node.category] || "bg-gray-100 text-gray-700"}`}>
                      {node.category}
                    </span>
                    <span className="text-2xs text-emerald-700 flex items-center gap-1">
                      <Shield size={10} />{node.confidence}%
                    </span>
                  </div>
                  <h3 className="text-xs text-gray-900 leading-snug">"{node.statement}"</h3>
                </div>

                <div className="p-2.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 text-xs space-y-1">
                  <p className="text-gray-900 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-600" />Impact on PACER:
                  </p>
                  <p className="text-gray-600 pl-4">{node.impactOnCurator}</p>
                </div>

                <div className="flex items-center justify-between text-2xs text-gray-400 pt-1 border-t border-gray-100">
                  <span>Updated: {node.lastUpdated}</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <RefreshCw size={10} />Active Index
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
