import { useRef, useEffect } from 'react';
import type { TestType } from '../domain/types';
import { TEST_CONFIGS } from '../domain/constants';
import { getGrade } from '../domain/scoring';

interface ResultCardProps {
  testType: TestType;
  score: number;
  percentile: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function ResultCard({ testType, score, percentile, onCanvasReady }: ResultCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = TEST_CONFIGS[testType];
  const grade = getGrade(percentile);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 340;
    const height = 440;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, config.themeColor);
    gradient.addColorStop(1, adjustBrightness(config.themeColor, -30));
    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // App title
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('센스 아레나', width / 2, 40);

    // Test icon
    ctx.font = '48px serif';
    ctx.fillText(config.icon, width / 2, 100);

    // Test name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px -apple-system, sans-serif';
    ctx.fillText(config.name, width / 2, 145);

    // Score
    ctx.font = '800 64px -apple-system, sans-serif';
    ctx.fillText(formatScore(testType, score), width / 2, 230);

    // Score unit
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '500 16px -apple-system, sans-serif';
    ctx.fillText(getScoreUnit(testType), width / 2, 255);

    // Percentile badge
    const badgeY = 290;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, width / 2 - 80, badgeY - 20, 160, 40, 20);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px -apple-system, sans-serif';
    ctx.fillText(`상위 ${100 - percentile}%`, width / 2, badgeY + 6);

    // Grade
    ctx.font = '32px serif';
    ctx.fillText(grade.emoji, width / 2, 360);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 18px -apple-system, sans-serif';
    ctx.fillText(grade.label, width / 2, 390);

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '400 12px -apple-system, sans-serif';
    ctx.fillText('sense-arena.toss.im', width / 2, 425);

    onCanvasReady?.(canvas);
  }, [testType, score, percentile, config, grade, onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 340,
        height: 440,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function formatScore(testType: TestType, score: number): string {
  if (testType === 'reaction') return `${score}`;
  return `${score}`;
}

function getScoreUnit(testType: TestType): string {
  switch (testType) {
    case 'color': return '점';
    case 'reaction': return 'ms (평균 반응시간)';
    case 'memory': return '점';
    case 'audio': return '점';
  }
}
