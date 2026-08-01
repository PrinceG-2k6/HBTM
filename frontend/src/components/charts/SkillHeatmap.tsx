import React from "react";
import { Check } from "lucide-react";
import type { CognitiveMetrics } from "../../api/types";

interface Props {
  skillMatrix?: CognitiveMetrics["skillMatrix"];
}

const DEFAULT_SKILL_MATRIX: CognitiveMetrics["skillMatrix"] = [
  { skill: "System Architecture", score: 85, target: 95, category: "Career & Wealth" },
  { skill: "TypeScript Generics", score: 94, target: 98, category: "Career & Wealth" },
  { skill: "Focus Protocol", score: 82, target: 90, category: "Mindset & Peace" },
  { skill: "Metabolic Health", score: 70, target: 85, category: "Health & Vitality" },
  { skill: "AI Agent Loops", score: 65, target: 90, category: "Career & Wealth" },
  { skill: "Creative Narrative", score: 78, target: 85, category: "Creative Expression" },
];

const getHeatColor = (level: number): { bg: string; text: string } => {
  if (level >= 9.0) return { bg: "bg-emerald-950/80 border border-emerald-500/30", text: "text-emerald-300" };
  if (level >= 6.0) return { bg: "bg-purple-950/80 border border-purple-500/30", text: "text-purple-300" };
  if (level >= 3.0) return { bg: "bg-amber-950/80 border border-amber-500/30", text: "text-amber-300" };
  return { bg: "bg-rose-950/80 border border-rose-500/30", text: "text-rose-300" };
};

const getHeatLabel = (level: number): string => {
  if (level >= 9.0) return "Mastery (9+)";
  if (level >= 6.0) return "Advanced (6+)";
  if (level >= 3.0) return "Intermediate (3+)";
  return "Beginner (0-3)";
};

const getMilestoneTarget = (level: number) => {
  if (level < 3.0) return { target: 3.0, label: "Lvl 3.0 Milestone" };
  if (level < 6.0) return { target: 6.0, label: "Lvl 6.0 Milestone" };
  if (level < 9.0) return { target: 9.0, label: "Lvl 9.0 Milestone" };
  return { target: 10.0, label: "Lvl 10.0 Mastery" };
};

export const SkillHeatmap: React.FC<Props> = ({ skillMatrix }) => {
  const activeMatrix = (skillMatrix && skillMatrix.length > 0) ? skillMatrix : DEFAULT_SKILL_MATRIX;
  const categories = Array.from(new Set(activeMatrix.map((s) => s.category || "General")));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {[
          { label: "Mastery (Lvl 9-10)", color: "text-emerald-300 bg-emerald-950/80" },
          { label: "Advanced (Lvl 6-9)", color: "text-purple-300 bg-purple-950/80" },
          { label: "Intermediate (Lvl 3-6)", color: "text-amber-300 bg-amber-950/80" },
          { label: "Beginner (Lvl 0-3)", color: "text-rose-300 bg-rose-950/80" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full ${l.color} text-xs font-semibold`}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* Heat Grid grouped by category */}
      {categories.map((cat) => {
        const skills = activeMatrix.filter((s) => s.category === cat);
        return (
          <div key={cat} className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-purple-300 font-semibold">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {skills.map((skill: any) => {
                // Determine 0-10 level
                const level = typeof skill.rawLevel === 'number' ? skill.rawLevel : (skill.score > 10 ? skill.score / 10 : skill.score);
                const { bg, text } = getHeatColor(level);
                const label = getHeatLabel(level);
                const ms = getMilestoneTarget(level);
                const pointsNeeded = roundToOneDecimal(Math.max(0, ms.target - level));

                return (
                  <div
                    key={skill.skill}
                    className={`${bg} rounded-2xl p-4 flex flex-col justify-between gap-2 shadow-lg`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-white">{skill.skill}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${text}`}>{label}</span>
                    </div>

                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-extrabold text-white">Lvl {level.toFixed(1)} <span className="text-xs font-normal text-zinc-400">/ 10</span></span>
                      <span className="text-xs text-purple-300 font-medium">Target: Lvl {ms.target.toFixed(1)}</span>
                    </div>

                    {/* Progress Bar & Gap */}
                    <div className="space-y-1">
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (level / ms.target) * 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        {pointsNeeded > 0 ? (
                          <span>{pointsNeeded} pts to {ms.label}</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> {ms.label} Unlocked!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const roundToOneDecimal = (num: number) => Math.round(num * 10) / 10;
