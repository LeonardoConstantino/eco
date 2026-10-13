export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;        // 1 -> 0
  maxLife: number;
  color: string;
  size: number;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  isOrbiting?: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private centerX = 0;
  private centerY = 0;

  public setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
  }

  public emitFromPad(
    x: number,
    y: number,
    color: string,
    sequenceStep: number,
    count = 14
  ): void {
    // Higher sequence steps yield slightly more and faster particles
    const adjustedCount = Math.min(36, count + Math.floor(sequenceStep * 1.5));
    const speedBase = 1.8 + Math.min(2.5, sequenceStep * 0.15);

    for (let i = 0; i < adjustedCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 1.5) * speedBase;
      const life = 0.6 + Math.random() * 0.5;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: life,
        color,
        size: 2 + Math.random() * 3.5
      });
    }
  }

  public emitRecordCelebration(colors: string[]): void {
    // Ambient orbit particles celebrating a new record
    const count = 48;
    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const orbitRadius = 90 + Math.random() * 110;
      const orbitAngle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const orbitSpeed = (0.015 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);

      this.particles.push({
        x: this.centerX + Math.cos(orbitAngle) * orbitRadius,
        y: this.centerY + Math.sin(orbitAngle) * orbitRadius,
        vx: 0,
        vy: 0,
        life: 1.0,
        maxLife: 2.2 + Math.random() * 1.2,
        color,
        size: 2.5 + Math.random() * 3,
        orbitAngle,
        orbitRadius,
        orbitSpeed,
        isOrbiting: true
      });
    }
  }

  public emitErrorDispersal(): void {
    // Gentle fade/slowdown of any active particles to simulate the aesthetic of silence
    for (const p of this.particles) {
      p.vx *= 0.3;
      p.vy *= 0.3;
      p.life = Math.min(p.life, 0.4);
    }
  }

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isOrbiting && p.orbitAngle !== undefined && p.orbitRadius !== undefined && p.orbitSpeed !== undefined) {
        p.orbitAngle += p.orbitSpeed;
        p.x = this.centerX + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = this.centerY + Math.sin(p.orbitAngle) * p.orbitRadius;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96; // air drag
        p.vy *= 0.96;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8 * alpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
  }
}
