import React, { useEffect, useRef } from "react";

export const Interactive3DCanvas: React.FC<{ className?: string }> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse coordinates
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetX = (e.clientX - width / 2) * 0.0005;
      targetY = (e.clientY - height / 2) * 0.0005;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 3D Geometry: 3 Concentric Gyro Rings
    const ringRadii = [Math.min(width, height) * 0.24, Math.min(width, height) * 0.32, Math.min(width, height) * 0.4];
    const ringSegments = [32, 48, 64];

    let rotX = 0.4;
    let rotY = 0.2;
    let rotZ = 0.1;

    // Ambient floating light particles
    const particles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * width * 1.2,
      y: (Math.random() - 0.5) * height * 1.2,
      z: (Math.random() - 0.5) * 500,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.2 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth inertia
      rotX += 0.002 + (targetY - rotX) * 0.03;
      rotY += 0.003 + (targetX - rotY) * 0.03;
      rotZ += 0.001;

      // Draw subtle ambient cursor light orb
      const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 350);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.06)");
      grad.addColorStop(0.5, "rgba(245, 158, 11, 0.02)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 500;

      // Render Ambient 3D Particles
      for (let p of particles) {
        p.z -= p.speed;
        if (p.z < -250) p.z = 250;

        const scale = fov / (fov + p.z + 300);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;

        ctx.fillStyle = `rgba(245, 158, 11, ${p.opacity * scale})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render 3D Gyroscope Rings
      ringRadii.forEach((r, idx) => {
        const segs = ringSegments[idx];
        const ringRotX = rotX * (idx % 2 === 0 ? 1 : -0.8);
        const ringRotY = rotY * (idx % 2 === 0 ? -1 : 1.2);
        const ringRotZ = rotZ + idx * 0.4;

        const points: { x: number; y: number; z: number }[] = [];

        for (let i = 0; i < segs; i++) {
          const theta = (i / segs) * Math.PI * 2;
          let px = r * Math.cos(theta);
          let py = r * Math.sin(theta);
          let pz = 0;

          // Rotate 3D Z
          let x1 = px * Math.cos(ringRotZ) - py * Math.sin(ringRotZ);
          let y1 = px * Math.sin(ringRotZ) + py * Math.cos(ringRotZ);
          let z1 = pz;

          // Rotate 3D Y
          let x2 = x1 * Math.cos(ringRotY) + z1 * Math.sin(ringRotY);
          let y2 = y1;
          let z2 = -x1 * Math.sin(ringRotY) + z1 * Math.cos(ringRotY);

          // Rotate 3D X
          let x3 = x2;
          let y3 = y2 * Math.cos(ringRotX) - z2 * Math.sin(ringRotX);
          let z3 = y2 * Math.sin(ringRotX) + z2 * Math.cos(ringRotX);

          // Perspective Projection
          const scale = fov / (fov + z3 + 400);
          const screenX = cx + x3 * scale;
          const screenY = cy + y3 * scale;

          points.push({ x: screenX, y: screenY, z: z3 });
        }

        // Draw ring vector lines
        ctx.strokeStyle = idx === 0 ? "rgba(245, 158, 11, 0.15)" : idx === 1 ? "rgba(59, 130, 246, 0.12)" : "rgba(16, 185, 129, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
          const next = points[(i + 1) % points.length];
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(next.x, next.y);
        }
        ctx.stroke();

        // Draw glowing segment nodes along circumference
        for (let i = 0; i < points.length; i += 4) {
          const pt = points[i];
          ctx.fillStyle = idx === 0 ? "#f59e0b" : idx === 1 ? "#3b82f6" : "#10b981";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
};
