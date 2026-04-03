import { SCORING_PARAMS } from './constants';
import type { TestType } from './types';

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);

  return 0.5 * (1.0 + sign * y);
}

export function getPercentile(score: number, testType: TestType): number {
  const params = SCORING_PARAMS[testType];
  const { mean, stdDev } = params;

  const zScore = (score - mean) / stdDev;

  const isLowerBetter = 'isLowerBetter' in params && params.isLowerBetter;
  const cdf = normalCDF(isLowerBetter ? -zScore : zScore);

  const percentile = Math.max(1, Math.min(99, Math.round(cdf * 100)));
  return percentile;
}

export function getGrade(percentile: number): { label: string; emoji: string } {
  if (percentile >= 95) return { label: '천재', emoji: '👑' };
  if (percentile >= 85) return { label: '뛰어남', emoji: '🌟' };
  if (percentile >= 70) return { label: '우수', emoji: '✨' };
  if (percentile >= 50) return { label: '평균 이상', emoji: '👍' };
  if (percentile >= 30) return { label: '평균', emoji: '😊' };
  return { label: '발전 가능', emoji: '💪' };
}

export function getTopPercent(percentile: number): number {
  return 100 - percentile;
}

export function getPercentileMessage(percentile: number): string {
  const top = getTopPercent(percentile);
  if (percentile >= 95) return `상위 ${top}%의 놀라운 감각이에요!`;
  if (percentile >= 85) return `상위 ${top}%! 대단해요!`;
  if (percentile >= 70) return `상위 ${top}%예요. 훌륭해요!`;
  if (percentile >= 50) return `상위 ${top}%! 평균 이상이에요.`;
  if (percentile >= 30) return `도전할수록 감각이 좋아져요!`;
  return `연습하면 더 좋아질 수 있어요!`;
}
