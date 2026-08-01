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

const getHeatColor = (score: number): { bg: string; text: string } => {
  if (score >= 90) return { bg: "bg-emerald-950/80 border border-emerald-500/30", text: "text-emerald-300" };
  if (score >= 75) return { bg: "bg-purple-950/80 border border-purple-500/30", text: "text-purple-300" };
  if (score >= 60) return { bg: "bg-amber-950/80 border border-amber-500/30", text: "text-amber-300" };
  return { bg: "bg-rose-950/80 border border-rose-500/30", text: "text-rose-300" };
};

const getHeatLabel = (score: number): string => {
  if (score >= 90) return "Expert";
  if (score >= 75) return "Proficient";
  if (score >= 60) return "Developing";
  return "Needs Focus";
};

export const SkillHeatmap: React.FC<Props> = ({ skillMatrix }) => {
  const activeMatrix = (skillMatrix && skillMatrix.length > 0) ? skillMatrix : DEFAULT_SKILL_MATRIX;
  const categories = Array.from(new Set(activeMatrix.map((s) => s.category || "General")));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {[
          { label: "Expert (90+)", color: "text-emerald-300 bg-emerald-950/80" },
          { label: "Proficient (75+)", color: "text-purple-300 bg-purple-950/80" },
          { label: "Developing (60+)", color: "text-amber-300 bg-amber-950/80" },
          { label: "Needs Focus (<60)", color: "text-rose-300 bg-rose-950/80" },
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
              {skills.map((skill) => {
                const { bg, text } = getHeatColor(skill.score);
                const label = getHeatLabel(skill.score);
                const gap = (skill.target || 100) - skill.score;
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
                      <span className="text-2xl font-extrabold text-white">{skill.score}%</span>
                      <span className="text-xs text-zinc-300">Target: {skill.target || 100}%</span>
                    </div>

                    {/* Progress Bar & Gap */}
                    <div className="space-y-1">
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(skill.score / (skill.target || 100)) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        {gap > 0 ? (
                          <span>{gap} pts to target</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> Target reached
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
