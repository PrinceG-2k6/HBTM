import React, { useEffect, useState } from "react";
import { Sparkles, Brain, Plus, Shield, RefreshCw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { apiService } from "../api";
import type { MemoryVector } from "../api/types";

export const MemoryPage: React.FC = () => {
  const [memoryNodes, setMemoryNodes] = useState<MemoryVector[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newStatement, setNewStatement] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryVector["category"]>("Identity & Aspirations");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchMemory = async () => {
      setLoading(true);
      try {
        const data = await apiService.getLearnerMemory();
        setMemoryNodes(data);
      } catch (err) {
        console.error("Axios GET /api/memory failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemory();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;

    setSubmitting(true);
    try {
      const updated = await apiService.addMemoryVector({
        category: newCategory,
        statement: newStatement
      });
      setMemoryNodes(updated);
      setNewStatement("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Axios POST /api/memory failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">
            Learner Vector <span>Memory</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Brain size={16} className="text-amber-600" />
            <span>PACER's evolving mental model of your aspirations, habits, and cognitive identity.</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-full bg-black text-white text-xs flex items-center gap-2 hover:bg-gray-800 transition-all cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          <span>Add Identity Memory</span>
        </button>
      </div>

      {/* Add Memory Modal / Form */}
      {showAddForm && (
        <Card className="bg-amber-50/90 border-amber-200 space-y-3">
          <h3 className="text-sm text-amber-950 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600" />
            <span>Teach PACER about your evolving identity & rules</span>
          </h3>

          <form onSubmit={handleAddMemory} className="space-y-3">
            <div>
              <label className="text-xs text-amber-900 block mb-1">Memory Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white outline-none"
              >
                <option value="Identity & Aspirations">Identity & Aspirations</option>
                <option value="Learning Habits">Learning Habits</option>
                <option value="Cognitive Style">Cognitive Style</option>
                <option value="Curator Filters">Curator Filters</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-amber-900 block mb-1">Aspiration / Preference Statement</label>
              <input
                type="text"
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                placeholder="e.g., Suppress all videos longer than 20 minutes unless they contain interactive sandboxes."
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-full text-xs text-gray-600 hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-full bg-amber-600 text-white text-xs hover:bg-amber-700 cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Posting via Axios..." : "Save Memory Vector"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Memory Nodes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 p-8 text-center bg-white/70 rounded-3xl">Loading memory bank via Axios...</div>
        ) : (
          memoryNodes.map((node) => (
            <Card key={node.id} className="flex flex-col justify-between space-y-4 border-white/80">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-2xs uppercase tracking-wider">
                    {node.category}
                  </span>
                  <span className="text-2xs text-emerald-700 flex items-center gap-1">
                    <Shield size={12} />
                    {node.confidence}% Confidence
                  </span>
                </div>

                <h3 className="text-sm text-gray-900 leading-snug">
                  "{node.statement}"
                </h3>
              </div>

              <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200/60 text-xs text-gray-700 space-y-1">
                <p className="text-gray-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Impact on PACER Curation:</span>
                </p>
                <p className="text-gray-600 pl-5">{node.impactOnCurator}</p>
              </div>

              <div className="flex items-center justify-between text-2xs text-gray-400 pt-2 border-t border-gray-100">
                <span>Updated: {node.lastUpdated}</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <RefreshCw size={10} /> Active Vector Index
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
