import React, { useEffect, useState } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import { Card } from "../components/ui/Card";
import { apiService } from "../api";
import type { CognitiveMetrics } from "../api/types";

export const AnalysisPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<CognitiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const data = await apiService.getCognitiveAnalysis();
        setAnalysis(data);
      } catch (err) {
        console.error("Axios GET /api/analysis failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  if (loading || !analysis) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-gray-700">Loading Cognitive Analysis via Axios...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900">
          Quick <span>Analysis</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-amber-600" />
          <span>Measuring human potential growth rate, retention, and intentionality ratios.</span>
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-2xs text-gray-500 uppercase tracking-wider">Growth Velocity</div>
            <div className="text-3xl text-gray-900 mt-1 flex items-center gap-1">
              <span>+{analysis.growthVelocity}%</span>
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Milestone completion rate</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Zap size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <div className="text-2xs text-gray-500 uppercase tracking-wider">Intentionality Ratio</div>
            <div className="text-3xl text-gray-900 mt-1">
              {analysis.attentionToIntentRatio}%
            </div>
            <p className="text-xs text-emerald-700 mt-1">High-Intent vs Skimming</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <div className="text-2xs text-gray-500 uppercase tracking-wider">Concept Retention</div>
            <div className="text-3xl text-gray-900 mt-1">
              {analysis.retentionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Measured via dry-run traces</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Skill Mastery Radar (6 cols) */}
        <Card className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base text-gray-900">Skill Competency Radar</h3>
            <p className="text-xs text-gray-500 mb-4">Current mastery level vs target readiness goal</p>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analysis.skillMatrix}>
                  <PolarGrid stroke="#e4e4e7" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#3f3f46', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Current Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                  <Radar name="Target Goal" dataKey="target" stroke="#18181b" fill="#18181b" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-200/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Current Mastery Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-800" />
              <span>Target Readiness Goal</span>
            </div>
          </div>
        </Card>

        {/* Skill Score Bar Breakdown (6 cols) */}
        <Card className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base text-gray-900">Domain Mastery Breakdown</h3>
            <p className="text-xs text-gray-500 mb-4">Granular evaluation by PACER Agent</p>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.skillMatrix} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} />
                  <YAxis dataKey="skill" type="category" tick={{ fill: '#3f3f46', fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#18181b" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>Primary Focus Area: <strong>Vector Retrieval & Math (65%)</strong></span>
            <span>PACER Simulation Active</span>
          </div>
        </Card>

      </div>
    </div>
  );
};
