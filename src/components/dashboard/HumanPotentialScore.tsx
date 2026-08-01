import React, { useEffect, useRef } from "react";
import type { HumanPotentialBreakdown } from "../../api";

interface Props {
  score: number;
  breakdown: HumanPotentialBreakdown;
}

const BREAKDOWN_ITEMS = [
  { key: "taskCompletion",    label: "Task Completion",         weight: "30%", color: "#10b981" },
  { key: "consistency",       label: "Consistency",             weight: "20%", color: "#3b82f6" },
  { key: "appliedPractice",   label: "Applied Practice",        weight: "15%", color: "#f97316" },
  { key: "reflectionQuality", label: "Reflection Quality",      weight: "15%", color: "#a855f7" },
  { key: "balancedGrowth",    label: "Balanced Growth",         weight: "10%", color: "#fbbf24" },
  { key: "noveltyLearning",   label: "Novelty & New Learning",  weight: "10%", color: "#14b8a6" },
] as const;

export const HumanPotentialScore: React.FC<Props> = ({ score, breakdown }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  // Animate the ring on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 140;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = 56;
    const TARGET = score / 100;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Track
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 8;
      ctx.stroke();

      // Gradient arc
      const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      grad.addColorStop(0, "#fbbf24");
      grad.addColorStop(1, "#f97316");

      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + progressRef.current * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, endAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.stroke();

      // Score text
      const displayScore = Math.round(progressRef.current * score);
      ctx.fillStyle = "#fafafa";
      ctx.font = "300 28px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${displayScore}`, cx, cy - 6);

      ctx.fillStyle = "#71717a";
      ctx.font = "300 10px 'Outfit', sans-serif";
      ctx.fillText("/ 100", cx, cy + 14);

      // Animate
      if (progressRef.current < TARGET) {
        progressRef.current = Math.min(progressRef.current + 0.012, TARGET);
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  return (
    <div className="flex flex-col gap-6">
      {/* Ring + label */}
      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <canvas ref={canvasRef} style={{ width: 140, height: 140 }} />
        </div>
        <div>
          <div className="text-zinc-100 text-lg mb-1">Human Potential Score</div>
          <div className="text-zinc-500 text-sm leading-relaxed">
            A composite metric that measures how intentionally you are growing toward your aspirational self.
          </div>
          {breakdown.passivePenalty > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400">−{breakdown.passivePenalty} pts passive consumption penalty</span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="flex flex-col gap-3">
        {BREAKDOWN_ITEMS.map((item) => {
          const val = breakdown[item.key];
          return (
            <div key={item.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">{item.label}</span>
                <span className="text-zinc-300">{val} <span className="text-zinc-600">· {item.weight}</span></span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${val}%`, background: item.color }}
                />
              </div>
            </div>
          );
        })}

        {/* Penalty bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-500">Passive Consumption Penalty</span>
            <span className="text-red-400">−{breakdown.passivePenalty}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-1 rounded-full"
              style={{ width: `${breakdown.passivePenalty}%`, background: "#ef4444" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
