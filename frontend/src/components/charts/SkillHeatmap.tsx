import React from "react";
import { Check } from "lucide-react";
import type { CognitiveMetrics } from "../../api/types";

interface Props {
  skillMatrix: CognitiveMetrics["skillMatrix"];
}

const getHeatColor = (score: number): { bg: string; text: string } => {
  if (score >= 90) return { bg: "bg-emerald-500", text: "text-white" };
  if (score >= 75) return { bg: "bg-emerald-300", text: "text-emerald-900" };
  if (score >= 60) return { bg: "bg-amber-300", text: "text-amber-950" };
  if (score >= 45) return { bg: "bg-orange-300", text: "text-orange-950" };
  return { bg: "bg-red-300", text: "text-red-950" };
};

const getHeatLabel = (score: number): string => {
  if (score >= 90) return "Expert";
  if (score >= 75) return "Proficient";
  if (score >= 60) return "Developing";
  if (score >= 45) return "Beginner";
  return "Needs Focus";
};

export const SkillHeatmap: React.FC<Props> = ({ skillMatrix }) => {
  const categories = [...new Set(skillMatrix.map((s) => s.category))];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-2xs">
        {[
          { label: "Expert (90+)", bg: "bg-emerald-500", text: "text-white" },
          { label: "Proficient (75+)", bg: "bg-emerald-300", text: "text-emerald-900" },
          { label: "Developing (60+)", bg: "bg-amber-300", text: "text-amber-950" },
          { label: "Beginner (45+)", bg: "bg-orange-300", text: "text-orange-950" },
          { label: "Needs Focus (<45)", bg: "bg-red-300", text: "text-red-950" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.bg}`} />
            <span className="text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Heat Grid grouped by category */}
      {categories.map((cat) => {
        const skills = skillMatrix.filter((s) => s.category === cat);
        return (
          <div key={cat}>
            <p className="text-2xs uppercase tracking-wider text-gray-500 mb-2">{cat}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skills.map((skill) => {
                const { bg, text } = getHeatColor(skill.score);
                const label = getHeatLabel(skill.score);
                const gap = skill.target - skill.score;
                return (
                  <div
                    key={skill.skill}
                    className={`${bg} rounded-2xl p-3 flex flex-col gap-1 transition-transform hover:scale-[1.02]`}
                  >
                    <span className={`text-xs leading-tight ${text}`}>{skill.skill}</span>
                    <div className="flex items-end justify-between">
                      <span className={`text-xl leading-none ${text}`}>{skill.score}%</span>
                      <span className={`text-2xs ${text} opacity-70`}>{label}</span>
                    </div>
                    {/* Gap to target */}
                    <div className="mt-1">
                      <div className="w-full bg-black/10 rounded-full h-1">
                        <div
                          className="bg-white/60 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${(skill.score / skill.target) * 100}%` }}
                        />
                      </div>
                      <span className={`text-2xs ${text} opacity-60 mt-0.5 flex items-center gap-1`}>
                        {gap > 0 ? `${gap}pts to target` : <><Check size={10} /> Target reached</>}
                      </span>
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
