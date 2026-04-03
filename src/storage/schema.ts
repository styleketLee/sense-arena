import type { TestType, TestRecord } from '../domain/types';
import { STORAGE_VERSION } from '../domain/constants';

export interface StorageSchema {
  version: number;
  records: Record<TestType, TestRecord>;
}

export function createDefaultSchema(): StorageSchema {
  return {
    version: STORAGE_VERSION,
    records: {
      color: { testType: 'color', bestScore: 0, bestPercentile: 0, history: [] },
      reaction: { testType: 'reaction', bestScore: 0, bestPercentile: 0, history: [] },
      memory: { testType: 'memory', bestScore: 0, bestPercentile: 0, history: [] },
      audio: { testType: 'audio', bestScore: 0, bestPercentile: 0, history: [] },
    },
  };
}
