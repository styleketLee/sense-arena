import type { ColorQuestion, MemoryQuestion, AudioQuestion } from './types';

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateColorQuestion(round: number): ColorQuestion {
  const difficulty = Math.min(round, 20);
  const hueDiff = Math.max(3, 30 - difficulty * 1.3);

  const baseHue = Math.random() * 360;
  const baseSaturation = 50 + Math.random() * 30;
  const baseLightness = 40 + Math.random() * 20;

  const gridSize = Math.min(4 + Math.floor(round / 4), 9);
  const totalCells = gridSize * gridSize;
  const differentIndex = Math.floor(Math.random() * totalCells);

  const baseColor = hslToHex(baseHue, baseSaturation, baseLightness);
  const diffColor = hslToHex(baseHue + hueDiff, baseSaturation, baseLightness);

  const colors = Array.from({ length: totalCells }, (_, i) =>
    i === differentIndex ? diffColor : baseColor,
  );

  return { colors, differentIndex, difficulty };
}

export function generateMemoryQuestion(round: number): MemoryQuestion {
  const difficulty = Math.min(3 + Math.floor(round / 2), 12);
  const sequence = Array.from({ length: difficulty }, () =>
    Math.floor(Math.random() * 10),
  );
  return { sequence, difficulty };
}

export function generateAudioQuestion(round: number): AudioQuestion {
  const difficulty = Math.min(round, 15);
  const freqDiff = Math.max(5, 50 - difficulty * 3);

  const baseFrequency = 250 + Math.random() * 500; // 250~750Hz (freqDiff 반영 안전 범위)
  const direction = Math.random() > 0.5 ? 1 : -1;
  const targetFrequency = baseFrequency + freqDiff * direction;

  return { baseFrequency, targetFrequency, difficulty };
}
