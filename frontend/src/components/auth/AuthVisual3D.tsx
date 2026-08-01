import React, { useEffect, useRef } from "react";

export const AuthVisual3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // 3D Particles setup
    const numParticles = 110;
    interface Particle3D {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      radius: number;
      color: string;
    }

    const particles: Particle3D[] = [];
    const colors = ["#a855f7", "#ec4899", "#6366f1", "#8b5cf6", "#d946ef"];

    // Distribute particles on a 3D sphere surface
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = 210 + (Math.random() - 0.5) * 50;

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        radius: Math.random() * 2.8 + 1.8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let angleX = 0.003;
    let angleY = 0.005;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const fov = 450;

      // Rotate and project particles
      const projected: { x: number; y: number; scale: number; color: string; radius: number; z: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Rotation matrix Y
        let x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
        let z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);

        // Rotation matrix X
        let y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX);

        p.x = x1;
        p.y = y2;
        p.z = z2;

        const scale = fov / (fov + z2 + 250);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;

        projected.push({
          x: projX,
          y: projY,
          scale,
          color: p.color,
          radius: p.radius * scale,
          z: z2,
        });
      }

      // Sort by Z for depth
      projected.sort((a, b) => b.z - a.z);

      // Draw connecting neural lines between close projected points
      ctx.lineWidth = 0.9;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.3 * Math.min(projected[i].scale, projected[j].scale);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw 3D projected glowing nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 14 * p.scale;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw central glowing core
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 200);
      gradient.addColorStop(0, "rgba(168, 85, 247, 0.3)");
      gradient.addColorStop(0.5, "rgba(219, 39, 119, 0.12)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[650px] relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 shadow-2xl flex items-center justify-center">
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-35 blur-[140px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #a855f7 0%, #ec4899 50%, transparent 100%)" }}
      />

      {/* Pure 3D Canvas Visual Container */}
      <canvas ref={canvasRef} className="w-full h-full pointer-events-none relative z-10" />
    </div>
  );
};
