import React, { useRef, useEffect, useState } from "react";
import type { TopicProgress, NodeState } from "../../api";

interface Props {
  topics: TopicProgress[];
  onTopicHover?: (topicName: string | null) => void;
}

interface BubbleNode {
  topic: TopicProgress;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  glowPhase: number; // for pulsing glow animation
}

// State → color mapping
const STATE_COLORS: Record<NodeState, { fill: string; stroke: string; text: string; glow: string }> = {
  Exploring:    { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd", glow: "#3b82f620" },
  Learning:     { fill: "#3b2800", stroke: "#f59e0b", text: "#fcd34d", glow: "#f59e0b20" },
  Practicing:   { fill: "#3b1800", stroke: "#f97316", text: "#fdba74", glow: "#f9731620" },
  Applying:     { fill: "#052e16", stroke: "#10b981", text: "#6ee7b7", glow: "#10b98120" },
  Mastering:    { fill: "#2d1b00", stroke: "#fbbf24", text: "#fde68a", glow: "#fbbf2420" },
  Neglected:    { fill: "#2d0c0c", stroke: "#ef4444", text: "#fca5a5", glow: "#ef444420" },
  Overconsumed: { fill: "#2e1065", stroke: "#a855f7", text: "#d8b4fe", glow: "#a855f720" },
  Blocked:      { fill: "#1c1c1c", stroke: "#6b7280", text: "#9ca3af", glow: "#6b728020" },
  Completed:    { fill: "#042f2e", stroke: "#14b8a6", text: "#5eead4", glow: "#14b8a620" },
};

// Identity-level nodes get an extra purple outer ring
const IDENTITY_RING = "#c084fc";

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/** Multi-dimensional physics-based bubble graph */
export const TopicBubbleChart: React.FC<Props> = ({ topics, onTopicHover }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ topic: TopicProgress; x: number; y: number } | null>(null);
  const nodesRef = useRef<BubbleNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ w: 700, h: 420 });
  const tickRef = useRef(0);

  // Build a map from id → node for drawing connection lines
  const idToNodeRef = useRef<Map<string, BubbleNode>>(new Map());

  // Initialise bubble nodes once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth || 700;
    const h = canvas.offsetHeight || 420;
    setCanvasSize({ w, h });

    const MIN_R = 26;
    const MAX_R = 62;
    const MAX_TIME = Math.max(...topics.map((t) => t.timeInvested), 1);

    nodesRef.current = topics.map((t) => {
      // Node SIZE = time invested (normalized)
      const timeFrac = t.timeInvested / MAX_TIME;
      const r = MIN_R + timeFrac * (MAX_R - MIN_R);
      return {
        topic: t,
        x: Math.random() * (w - 2 * r) + r,
        y: Math.random() * (h - 2 * r) + r,
        r,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        glowPhase: Math.random() * Math.PI * 2,
      };
    });
    // Build id→node map
    const map = new Map<string, BubbleNode>();
    nodesRef.current.forEach((n) => map.set(n.topic.id, n));
    idToNodeRef.current = map;
  }, [topics]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvasSize.w;
    const H = canvasSize.h;
    canvas.width = W;
    canvas.height = H;

    const cx = W / 2;
    const cy = H / 2;

    const draw = () => {
      tickRef.current++;
      ctx.clearRect(0, 0, W, H);

      const nodes = nodesRef.current;

      // Physics
      nodes.forEach((n) => {
        n.vx += (cx - n.x) * 0.0015;
        n.vy += (cy - n.y) * 0.0015;
        n.vx *= 0.96;
        n.vy *= 0.96;
        n.x += n.vx;
        n.y += n.vy;
        n.x = clamp(n.x, n.r + 4, W - n.r - 4);
        n.y = clamp(n.y, n.r + 4, H - n.r - 4);
        n.glowPhase += 0.025;
      });

      // Collision resolution
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const minDist = a.r + b.r + 6;
          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = (dx / dist) * overlap;
            const ny = (dy / dist) * overlap;
            a.x -= nx; a.y -= ny;
            b.x += nx; b.y += ny;
          }
        }
      }

      // ── Draw dependency connection lines ──────────────────────
      ctx.save();
      nodes.forEach((n) => {
        const deps = n.topic.dependencies ?? [];
        deps.forEach((depId) => {
          const target = idToNodeRef.current.get(depId);
          if (!target) return;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = "#ffffff12";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });
      ctx.restore();

      // ── Draw nodes ────────────────────────────────────────────
      nodes.forEach((n) => {
        const colors = STATE_COLORS[n.topic.nodeState] ?? STATE_COLORS["Learning"];
        const pct = n.topic.completedPercent;
        const conf = n.topic.confidenceLevel;
        const isRecent = n.topic.recentlyActive;
        const isIdentity = n.topic.isIdentityLevel;

        // Glow for recently active nodes
        if (isRecent) {
          const glowAlpha = 0.4 + 0.3 * Math.sin(n.glowPhase);
          ctx.save();
          ctx.shadowColor = colors.stroke;
          ctx.shadowBlur = 18 * glowAlpha;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 2, 0, Math.PI * 2);
          ctx.strokeStyle = colors.stroke + "44";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        // Identity-level outer ring
        if (isIdentity) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = IDENTITY_RING + "55";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Base circle (fill)
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = colors.fill;
        ctx.fill();

        // Progress wedge — Node Fill % = task completion
        if (pct > 0) {
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (pct / 100) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.arc(n.x, n.y, n.r, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = colors.stroke + "30";
          ctx.fill();

          // Progress arc ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r - 2.5, startAngle, endAngle);
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Border — width = confidence level
        const borderW = 1 + (conf / 100) * 2.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.strokeStyle = colors.stroke + "cc";
        ctx.lineWidth = borderW;
        ctx.stroke();

        // Label
        ctx.fillStyle = colors.text;
        const fontSize = n.r > 44 ? 11 : 9;
        ctx.font = `300 ${fontSize}px 'Outfit', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const words = n.topic.name.split(" ");
        const lineY = n.r > 40 ? -8 : -6;
        if (words.length === 1 || n.r < 36) {
          ctx.fillText(n.topic.name, n.x, n.y + lineY);
        } else if (words.length === 2) {
          ctx.fillText(words[0], n.x, n.y + lineY - 6);
          ctx.fillText(words[1], n.x, n.y + lineY + 7);
        } else {
          ctx.fillText(words.slice(0, 2).join(" "), n.x, n.y + lineY - 6);
          ctx.fillText(words.slice(2).join(" "), n.x, n.y + lineY + 7);
        }

        // Percent label
        ctx.font = `300 ${fontSize - 1}px 'Outfit', sans-serif`;
        ctx.fillStyle = colors.text + "aa";
        ctx.fillText(`${pct}%`, n.x, n.y + (n.r > 40 ? 10 : 8));
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasSize]);

  // Mouse hover for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: BubbleNode | null = null;
    for (const n of nodesRef.current) {
      const dx = mx - n.x;
      const dy = my - n.y;
      if (Math.sqrt(dx * dx + dy * dy) <= n.r) {
        found = n;
        break;
      }
    }
    setTooltip(found ? { topic: found.topic, x: mx, y: my } : null);
    onTopicHover?.(found ? found.topic.name : null);
  };

  const stateColor = (state: NodeState) => STATE_COLORS[state]?.stroke ?? "#888";

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="w-full rounded-2xl cursor-crosshair"
        style={{ height: 380 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setTooltip(null); onTopicHover?.(null); }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 rounded-2xl shadow-2xl border border-zinc-700/60 bg-zinc-950/95 backdrop-blur-xl px-4 py-3 text-xs"
          style={{ left: tooltip.x + 14, top: Math.max(0, tooltip.y - 10), minWidth: 190 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: stateColor(tooltip.topic.nodeState) }}
            />
            <span className="text-zinc-100 text-sm">{tooltip.topic.name}</span>
          </div>
          <div className="flex flex-col gap-1.5 text-zinc-400">
            <div className="flex justify-between">
              <span>State</span>
              <span style={{ color: stateColor(tooltip.topic.nodeState) }}>{tooltip.topic.nodeState}</span>
            </div>
            <div className="flex justify-between">
              <span>Category</span>
              <span className="text-zinc-300">{tooltip.topic.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Progress</span>
              <span className="text-zinc-300">{tooltip.topic.completedItems}/{tooltip.topic.totalItems} items ({tooltip.topic.completedPercent}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Time invested</span>
              <span className="text-zinc-300">{tooltip.topic.timeInvested}h</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence</span>
              <span className="text-zinc-300">{tooltip.topic.confidenceLevel}%</span>
            </div>
            {tooltip.topic.isIdentityLevel && (
              <div className="mt-1 text-purple-400 text-xs">Identity-level aspiration</div>
            )}
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1 mt-2.5">
            <div
              className="h-1 rounded-full"
              style={{ width: `${tooltip.topic.completedPercent}%`, background: stateColor(tooltip.topic.nodeState) }}
            />
          </div>
        </div>
      )}

      {/* Legend — state colors */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 px-1">
        {(Object.keys(STATE_COLORS) as NodeState[]).map((state) => (
          <div key={state} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-2 h-2 rounded-full" style={{ background: STATE_COLORS[state].stroke }} />
            <span>{state}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 ml-2">
          <div className="w-2 h-2 rounded-full border border-dashed border-purple-400" style={{ background: "transparent" }} />
          <span>Identity aspiration</span>
        </div>
      </div>

      {/* Dimension key */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 px-1">
        {[
          { label: "Node size", desc: "Time invested" },
          { label: "Fill wedge", desc: "Task completion %" },
          { label: "Border width", desc: "Confidence level" },
          { label: "Glow pulse", desc: "Recently active" },
          { label: "Dashed ring", desc: "Identity aspiration" },
          { label: "Dashed lines", desc: "Skill dependencies" },
        ].map((d) => (
          <div key={d.label} className="flex flex-col text-xs">
            <span className="text-zinc-300">{d.label}</span>
            <span className="text-zinc-600">{d.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
