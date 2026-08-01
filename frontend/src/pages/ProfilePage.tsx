import React, { useEffect, useState } from "react";
import {
  User, Edit3, Save, Plus, Trash2, Sparkles, TrendingUp,
  Award, Calendar, X
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import { useAuth } from "../contexts/auth.context";
import { PREDEFINED_SKILLS } from "../data/predefinedSkills";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAspiration, setEditAspiration] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [addingSkill, setAddingSkill] = useState<string | null>(null);

  useEffect(() => {
    apiService.getProfile().then((res: any) => {
      setProfile(res.user);
      setSkills(res.skills || []);
      setEditName(res.user?.name || "");
      setEditAspiration(res.user?.aspiration_text || "");
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiService.updateProfile({
        name: editName,
        aspiration_text: editAspiration,
      });
      setProfile((prev: any) => ({ ...prev, name: editName, aspiration_text: editAspiration }));
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skillName: string) => {
    setAddingSkill(skillName);
    try {
      const res = await apiService.addSkill(skillName);
      if (res.skill) {
        setSkills((prev) => [...prev, res.skill]);
      }
      setShowAddSkill(false);
      setSkillSearch("");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add skill");
    } finally {
      setAddingSkill(null);
    }
  };

  const handleRemoveSkill = async (skillId: string, skillName: string) => {
    if (!confirm(`Remove "${skillName}" from your skills?`)) return;
    try {
      await apiService.removeSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err) {
      console.error("Failed to remove skill", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-5 pb-12">
        <SkeletonCard rows={4} />
        <SkeletonCard rows={6} />
      </div>
    );
  }

  const existingSkillNames = new Set(skills.map((s: any) => s.skill_name?.toLowerCase()));
  const availableSkills = PREDEFINED_SKILLS.filter(
    (s) => !existingSkillNames.has(s.toLowerCase()) &&
      s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white">Your <span className="text-purple-400">Profile</span></h1>
        <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
          <User size={16} className="text-purple-400" />
          <span>Manage your identity, skills, and growth goals.</span>
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {(profile?.name || "U")[0].toUpperCase()}
            </div>
            <div>
              {editing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl text-white bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <h2 className="text-xl text-white font-semibold">{profile?.name || "User"}</h2>
              )}
              <p className="text-sm text-zinc-400">{profile?.email}</p>
              <p className="text-xs text-zinc-500 mt-1">{profile?.role || "Growth Aspirant"}</p>
            </div>
          </div>

          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-purple-400 transition-colors"
            >
              <Edit3 size={14} /> Edit
            </button>
          )}
        </div>

        {/* Aspiration */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-400" /> Aspiration
          </label>
          {editing ? (
            <textarea
              value={editAspiration}
              onChange={(e) => setEditAspiration(e.target.value)}
              rows={3}
              placeholder="What's your vision for who you want to become?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          ) : (
            <p className="text-sm text-zinc-200 bg-zinc-800/50 rounded-lg px-4 py-3">
              {profile?.aspiration_text || "No aspiration set yet. Click Edit to add one."}
            </p>
          )}
        </div>

        {/* Member since */}
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <Calendar size={12} />
          <span>Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "recently"}</span>
        </div>
      </Card>

      {/* Skills Section */}
      <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-purple-400" />
            <h2 className="text-xl text-white font-semibold">Your Skills</h2>
            <span className="text-xs text-zinc-500 ml-2">({skills.length} tracked)</span>
          </div>
          <button
            onClick={() => setShowAddSkill(!showAddSkill)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-500/60 rounded-lg transition-all"
          >
            <Plus size={14} /> Add Skill
          </button>
        </div>

        {/* Add Skill Dropdown */}
        {showAddSkill && (
          <div className="mb-6 bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 space-y-3">
            <input
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableSkills.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-2">
                  {skillSearch ? "No matching skills found" : "All skills already added"}
                </p>
              ) : (
                availableSkills.slice(0, 15).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleAddSkill(skill)}
                    disabled={addingSkill === skill}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-purple-600/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addingSkill === skill ? "Adding..." : skill}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setShowAddSkill(false); setSkillSearch(""); }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Close
            </button>
          </div>
        )}

        {/* Skills List */}
        {skills.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">No skills tracked yet. Add skills to start your growth journey.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.map((s: any) => {
              const level = s.current_level || 0;
              const pct = Math.round(level * 10);
              return (
                <div key={s.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white font-medium">{s.skill_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300">
                          {s.level_label || "Beginner"}
                        </span>
                        <span className="text-xs text-zinc-500">{level.toFixed(1)}/10</span>
                        <button
                          onClick={() => handleRemoveSkill(s.id, s.skill_name)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                          title="Remove skill"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, pct)}%`,
                          background: pct > 60
                            ? 'linear-gradient(90deg, #a855f7, #22c55e)'
                            : 'linear-gradient(90deg, #6d28d9, #a855f7)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Onboarding Data */}
      {profile?.onboarding && (
        <Card className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 shadow-xl">
          <h2 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" /> Your Identity Blueprint
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.onboarding.currentSelf?.length > 0 && (
              <div>
                <h3 className="text-sm text-zinc-400 mb-2">Current Self</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.onboarding.currentSelf.map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.onboarding.imagineSelf?.length > 0 && (
              <div>
                <h3 className="text-sm text-zinc-400 mb-2">Imagine Self</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.onboarding.imagineSelf.map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 text-xs bg-purple-950/30 text-purple-300 rounded-lg border border-purple-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
