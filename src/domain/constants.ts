import type { TestConfig, TestType } from './types';

export const TEST_CONFIGS: { [K in TestType]: TestConfig } = {
  color: {
    type: 'color',
    name: '색감 테스트',
    description: '미세한 색 차이를 구분해 보세요',
    duration: 60,
    icon: '🎨',
    themeColor: '#9B59B6',
    rounds: 20,
  },
  reaction: {
    type: 'reaction',
    name: '반응속도 테스트',
    description: '화면 변화를 빠르게 감지해 보세요',
    duration: 30,
    icon: '⚡',
    themeColor: '#E74C3C',
    rounds: 10,
  },
  memory: {
    type: 'memory',
    name: '순간기억력 테스트',
    description: '숫자 순서를 기억해 보세요',
    duration: 60,
    icon: '🧠',
    themeColor: '#3498DB',
    rounds: 10,
  },
  audio: {
    type: 'audio',
    name: '청각 테스트',
    description: '주파수 차이를 구분해 보세요',
    duration: 60,
    icon: '🎵',
    themeColor: '#2ECC71',
    rounds: 15,
  },
};

export const SCORING_PARAMS = {
  color: { mean: 12, stdDev: 3.5 },
  reaction: { mean: 320, stdDev: 80, isLowerBetter: true },
  memory: { mean: 6, stdDev: 1.8 },
  audio: { mean: 10, stdDev: 3 },
} as const;

export const STORAGE_KEY = 'sense-arena-records';
export const STORAGE_VERSION = 1;

export const AD_GROUP_IDS = {
  interstitial: 'ait.v2.live.01e8ddf30be64641',
  banner: 'ait.v2.live.d9da2dd266214c4a',
} as const;

export const MAX_HISTORY_PER_TEST = 50;
