import React, { useEffect, useRef, useCallback } from 'react';
import { PaletteDefinition, PadTheme } from '../types';
import { ParticleSystem } from './ParticleSystem';

interface SlotCoord {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

interface CanvasBoardProps {
  palette: PaletteDefinition;
  activePad: number | null;
  glowIntensity?: number; // 0 to 1
  padSlotMap: number[]; // padSlotMap[padIndex] = slotIndex (0: TL, 1: TR, 2: BL, 3: BR)
  isReshuffling?: boolean;
  onPadPress?: (padIndex: number) => void;
  onPadRelease?: (padIndex: number) => void;
  interactive?: boolean;
  showKeyHints?: boolean;
  particleSystemRef?: React.MutableRefObject<ParticleSystem | null>;
  className?: string;
  size?: number;
}

const KEY_LABELS = ['1 / A', '2 / S', '3 / Z', '4 / X'];

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  palette,
  activePad,
  glowIntensity = 1,
  padSlotMap,
  isReshuffling = false,
  onPadPress,
  onPadRelease,
  interactive = true,
  showKeyHints = true,
  particleSystemRef,
  className = '',
  size = 380
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const localParticleSystem = useRef<ParticleSystem>(new ParticleSystem());
  const animationFrameRef = useRef<number>(0);
  const pressedPadsRef = useRef<Set<number>>(new Set());

  // Pad visual positions for smooth interpolation during LiveBoard reshuffling
  const padVisualPosRef = useRef<Array<{ x: number; y: number }>>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  ]);

  const lastTimeRef = useRef<number>(performance.now());

  // Expose particle system if parent provided a ref
  useEffect(() => {
    if (particleSystemRef) {
      particleSystemRef.current = localParticleSystem.current;
    }
  }, [particleSystemRef]);

  // Calculate 4 slot bounding boxes given board width/height
  const getSlotCoords = useCallback((boardSize: number): SlotCoord[] => {
    const gap = Math.max(12, Math.floor(boardSize * 0.05));
    const padding = Math.max(16, Math.floor(boardSize * 0.06));
    const available = boardSize - padding * 2 - gap;
    const padSize = available / 2;
    const radius = Math.max(18, Math.floor(padSize * 0.24));

    return [
      // Slot 0: Top-Left
      {
        x: padding,
        y: padding,
        width: padSize,
        height: padSize,
        radius
      },
      // Slot 1: Top-Right
      {
        x: padding + padSize + gap,
        y: padding,
        width: padSize,
        height: padSize,
        radius
      },
      // Slot 2: Bottom-Left
      {
        x: padding,
        y: padding + padSize + gap,
        width: padSize,
        height: padSize,
        radius
      },
      // Slot 3: Bottom-Right
      {
        x: padding + padSize + gap,
        y: padding + padSize + gap,
        width: padSize,
        height: padSize,
        radius
      }
    ];
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isRunning = true;

    const render = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const currentSize = Math.min(rect.width, rect.height) || size;

      if (canvas.width !== currentSize * dpr || canvas.height !== currentSize * dpr) {
        canvas.width = currentSize * dpr;
        canvas.height = currentSize * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, currentSize, currentSize);

      const center = currentSize / 2;
      localParticleSystem.current.setCenter(center, center);
      localParticleSystem.current.update(dt);

      const slotCoords = getSlotCoords(currentSize);

      // Interpolate pad positions smoothly toward their assigned slot target
      for (let padIdx = 0; padIdx < 4; padIdx++) {
        const targetSlotIdx = padSlotMap[padIdx] ?? padIdx;
        const targetSlot = slotCoords[targetSlotIdx];

        if (!padVisualPosRef.current[padIdx] || padVisualPosRef.current[padIdx].x === 0) {
          padVisualPosRef.current[padIdx] = { x: targetSlot.x, y: targetSlot.y };
        } else {
          const lerpFactor = isReshuffling ? 0.12 : 0.25;
          padVisualPosRef.current[padIdx].x += (targetSlot.x - padVisualPosRef.current[padIdx].x) * lerpFactor;
          padVisualPosRef.current[padIdx].y += (targetSlot.y - padVisualPosRef.current[padIdx].y) * lerpFactor;
        }
      }

      // Draw subtle background machine plate
      drawMachinePlate(ctx, currentSize);

      // Draw each pad
      for (let padIdx = 0; padIdx < 4; padIdx++) {
        const padDef = palette.pads[padIdx];
        const targetSlotIdx = padSlotMap[padIdx] ?? padIdx;
        const baseSlot = slotCoords[targetSlotIdx];
        const currentPos = padVisualPosRef.current[padIdx];

        const isActive = activePad === padIdx || pressedPadsRef.current.has(padIdx);

        drawSinglePad(
          ctx,
          padDef,
          currentPos.x,
          currentPos.y,
          baseSlot.width,
          baseSlot.height,
          baseSlot.radius,
          isActive,
          glowIntensity,
          time,
          showKeyHints ? KEY_LABELS[padIdx] : undefined
        );
      }

      // Draw particles on top of pads
      localParticleSystem.current.render(ctx);

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [palette, activePad, glowIntensity, padSlotMap, isReshuffling, showKeyHints, size, getSlotCoords]);

  // Draw background plate & central cross divider
  const drawMachinePlate = (ctx: CanvasRenderingContext2D, boardSize: number) => {
    const radius = Math.floor(boardSize * 0.16);
    const padding = 6;

    // Dark chassis container
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(padding, padding, boardSize - padding * 2, boardSize - padding * 2, radius);
    ctx.fillStyle = '#0b0d13';
    ctx.fill();

    // Subtle edge highlight
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Center circular hub
    const center = boardSize / 2;
    const hubRadius = Math.max(14, Math.floor(boardSize * 0.065));

    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#07080c';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.stroke();

    // Subtle center power dot
    ctx.beginPath();
    ctx.arc(center, center, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232, 236, 242, 0.25)';
    ctx.fill();

    ctx.restore();
  };

  // Draw individual tactile pad
  const drawSinglePad = (
    ctx: CanvasRenderingContext2D,
    pad: PadTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    isActive: boolean,
    intensity: number,
    time: number,
    keyHint?: string
  ) => {
    ctx.save();

    // Scale slightly when active for tactile physical feel
    const scale = isActive ? 1.03 : 1.0;
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // 1. Outer Glow when active
    if (isActive) {
      ctx.shadowColor = pad.glowColor;
      ctx.shadowBlur = pad.glowRadius * intensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // Very soft idle breathing luminescence
      const breathe = Math.sin(time * 0.002 + pad.id * 1.5) * 0.04;
      ctx.shadowColor = pad.glowColor;
      ctx.shadowBlur = (8 + breathe * 4) * intensity;
    }

    // 2. Base Pad Body
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);

    if (isActive) {
      // Active gradient: bright radiant center
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, width * 0.7);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, pad.activeColor);
      grad.addColorStop(1, pad.activeColor);
      ctx.fillStyle = grad;
    } else {
      // Idle gradient: deep rich saturation
      const grad = ctx.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, pad.baseColor);
      grad.addColorStop(1, shadeColor(pad.baseColor, -20));
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // 3. Inner Bevel Highlight
    ctx.shadowBlur = 0;
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    // 4. Subtle inner lens shine arc
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, width - 8, height * 0.35, [radius - 2, radius - 2, 4, 4]);
    const shineGrad = ctx.createLinearGradient(x, y, x, y + height * 0.35);
    shineGrad.addColorStop(0, isActive ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)');
    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shineGrad;
    ctx.fill();

    // 5. Note / Character watermark (very subtle)
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isActive ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.35)';
    ctx.fillText(pad.noteName.split(' ')[0], cx, cy - 4);

    // 6. Keyboard hint badge
    if (keyHint) {
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillStyle = isActive ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.25)';
      ctx.fillText(keyHint, cx, cy + 14);
    }

    ctx.restore();
  };

  // Color helper
  const shadeColor = (color: string, percent: number) => {
    let num = parseInt(color.replace('#', ''), 16);
    if (isNaN(num)) return color;
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00ff) + percent;
    let b = (num & 0x0000ff) + percent;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Hit test from pointer coordinates to pad index
  const hitTestPad = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      const currentSize = Math.min(rect.width, rect.height) || size;
      const slotCoords = getSlotCoords(currentSize);

      for (let padIdx = 0; padIdx < 4; padIdx++) {
        const slotIdx = padSlotMap[padIdx] ?? padIdx;
        const slot = slotCoords[slotIdx];

        if (
          clickX >= slot.x &&
          clickX <= slot.x + slot.width &&
          clickY >= slot.y &&
          clickY <= slot.y + slot.height
        ) {
          return padIdx;
        }
      }
      return null;
    },
    [getSlotCoords, padSlotMap, size]
  );

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    const padIdx = hitTestPad(e.clientX, e.clientY);
    if (padIdx !== null) {
      pressedPadsRef.current.add(padIdx);
      if (onPadPress) onPadPress(padIdx);

      // Emit touch particles
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const color = palette.pads[padIdx].activeColor;
        localParticleSystem.current.emitFromPad(
          e.clientX - rect.left,
          e.clientY - rect.top,
          color,
          2,
          10
        );
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const padIdx = hitTestPad(e.clientX, e.clientY);
    if (padIdx !== null) {
      pressedPadsRef.current.delete(padIdx);
      if (onPadRelease) onPadRelease(padIdx);
    } else {
      pressedPadsRef.current.clear();
    }
  };

  const handlePointerLeave = () => {
    pressedPadsRef.current.clear();
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none touch-none aspect-square ${className}`}
      style={{ width: size, maxWidth: '100%' }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-full rounded-3xl touch-none ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
