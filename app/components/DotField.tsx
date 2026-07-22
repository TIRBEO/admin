'use client';

import { useEffect, useRef, memo } from 'react';
import './DotField.css';

const TWO_PI = Math.PI * 2;

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowRadius?: number;
}

const DotField = memo(({
  dotRadius = 1.2,
  dotSpacing = 15,
  cursorRadius = 220,
  bulgeStrength = 16,
  waveAmplitude = 0,
  gradientFrom = 'rgba(234, 247, 251, 0.82)',
  gradientTo = 'rgba(18, 58, 107, 0.16)',
  glowRadius = 220,
}: DotFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }

    function tick() {
      const m = mouseRef.current;
      const step = dotRadius * 2 + dotSpacing;
      const cols = Math.ceil(width / step) + 1;
      const rows = Math.ceil(height / step) + 1;
      const padX = ((width - (cols - 1) * step) % step) / 2;
      const padY = ((height - (rows - 1) * step) % step) / 2;
      const cr = cursorRadius;
      const crSq = cr * cr;

      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, gradientFrom);
      grad.addColorStop(1, gradientTo);
      ctx.fillStyle = grad;
      ctx.beginPath();

      for (let row = 0; row < rows; row++) {
        const ay = padY + row * step;
        const dy = m.y - ay;
        const dySq = dy * dy;
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step;
          const dx = m.x - ax;
          const distSq = dx * dx + dySq;
          let drawX = ax;
          let drawY = ay;

          if (distSq < crSq) {
            const dist = Math.sqrt(distSq);
            const falloff = 1 - dist / cr;
            const push = falloff * falloff * bulgeStrength;
            const angle = Math.atan2(dy, dx);
            drawX -= Math.cos(angle) * push;
            drawY -= Math.sin(angle) * push;
          }

          if (waveAmplitude > 0) {
            drawY += Math.sin(drawX * 0.02) * waveAmplitude;
          }

          ctx.moveTo(drawX + dotRadius, drawY);
          ctx.arc(drawX, drawY, dotRadius, 0, TWO_PI);
        }
      }

      ctx.fill();
      rafRef.current = window.requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [dotRadius, dotSpacing, cursorRadius, bulgeStrength, waveAmplitude, gradientFrom, gradientTo]);

  return <div className="dot-field-container"><canvas ref={canvasRef} /></div>;
});

DotField.displayName = 'DotField';
export default DotField;
