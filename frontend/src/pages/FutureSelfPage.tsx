import React, { useEffect, useState } from "react";
import { Sparkles, ArrowDown, CheckCircle2, Briefcase } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { FutureSelfResponse } from "../api";

const PERIOD_COLORS: Record<string, { ring: string; dot: string; badge: string }> = {
  "Now":      { ring: "border-gray-300",   dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-700" },
  "3 Months": { ring: "border-amber-400",  dot: "bg-amber-400",  badge: "bg-amber-100 text-amber-900" },
  "6 Months": { ring: "border-blue-400",   dot: "bg-blue-400",   badge: "bg-blue-100 text-blue-900" },
  "1 Year":   { ring: "border-emerald-500",dot: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-900" },
};

export const FutureSelfPage: React.FC = () => {
  const [data, setData] = useState<FutureSelfResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getFutureSelf().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-12"><SkeletonCard rows={4} /><SkeletonCard rows={6} /></div>
  );
  if (!data) return null;

  const { milestones, profile } = data;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl lg:text-4xl text-gray-900">Future <span>Self</span></h1>
        <p className="text-sm text-gray-600 flex items-center justify-center gap-1.5">
          <Sparkles size={16} className="text-amber-600" />
          <span>Where your learning journey takes you — based on your current trajectory.</span>
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs text-gray-500">Current Identity:</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs">{profile.aspirationalIdentity}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-amber-300 to-emerald-400 -translate-x-1/2 hidden md:block" />

        <div className="space-y-6">
          {milestones.map((milestone: any, idx: number) => {
            const colors = PERIOD_COLORS[milestone.period] || PERIOD_COLORS["6 Months"];
            const isLeft = idx % 2 === 0;
            return (
              <div key={milestone.period} className="relative">
                {/* Center connector dot */}
                <div className={`hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 w-5 h-5 rounded-full ${colors.dot} border-4 border-white shadow-md z-10`} />

                {/* Arrow connector */}
                {idx < milestones.length - 1 && (
                  <div className="hidden md:flex justify-center relative z-20 mt-1 mb-1 pointer-events-none">
                    <ArrowDown size={16} className="text-gray-400" />
                  </div>
                )}

                <div className={`md:w-[46%] ${isLeft ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}>
                  <Card className={`border-2 ${colors.ring} space-y-4`}>
                    {/* Period header */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs ${colors.badge}`}>{milestone.period}</span>
                      <div className="text-right">
                        <div className="text-2xl text-gray-900">{milestone.goalCompletion}%</div>
                        <div className="text-2xs text-gray-500">Goal Complete</div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">{milestone.description}</p>

                    {/* Career Readiness */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-2xs text-gray-600">
                        <span className="flex items-center gap-1"><Briefcase size={10} />Career Readiness</span>
                        <span className="text-emerald-700">{milestone.careerReadiness}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${milestone.careerReadiness}%`,
                            background: milestone.careerReadiness >= 80 ? "#22c55e" : milestone.careerReadiness >= 60 ? "#f59e0b" : "#94a3b8"
                          }} />
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-2xs uppercase tracking-wider text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {milestone.skills.map((s: any) => (
                          <span key={s} className="text-2xs px-2.5 py-1 bg-white/80 border border-gray-200 rounded-full text-gray-700 flex items-center gap-1">
                            <CheckCircle2 size={9} className="text-emerald-500" />{s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Projects */}
                    <div>
                      <p className="text-2xs uppercase tracking-wider text-gray-500 mb-2">Projects</p>
                      <div className="space-y-1">
                        {milestone.projects.map((p: any) => (
                          <div key={p} className="flex items-center gap-1.5 text-xs text-gray-700">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />{p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
