import { create } from 'zustand';
import type { TestType, TestResult, TestRecord } from '../domain/types';
import { MAX_HISTORY_PER_TEST } from '../domain/constants';
import { storageAdapter } from '../storage/storageAdapter';

interface RecordState {
  records: Record<TestType, TestRecord>;
  isLoaded: boolean;

  loadRecords: () => Promise<void>;
  addResult: (result: TestResult) => void;
  getBestScore: (testType: TestType) => number;
  getBestPercentile: (testType: TestType) => number;
}

const emptyRecord = (testType: TestType): TestRecord => ({
  testType,
  bestScore: 0,
  bestPercentile: 0,
  history: [],
});

const defaultRecords: Record<TestType, TestRecord> = {
  color: emptyRecord('color'),
  reaction: emptyRecord('reaction'),
  memory: emptyRecord('memory'),
  audio: emptyRecord('audio'),
};

let saveInFlight: Promise<void> | null = null;

export const useRecordStore = create<RecordState>((set, get) => ({
  records: { ...defaultRecords },
  isLoaded: false,

  loadRecords: async () => {
    const saved = await storageAdapter.load();
    if (saved) {
      set({ records: saved, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },

  addResult: (result) => {
    const state = get();
    const record = state.records[result.testType];
    const isReaction = result.testType === 'reaction';

    const isBetter = isReaction
      ? record.bestScore === 0 || result.score < record.bestScore
      : result.score > record.bestScore;

    const updatedRecord: TestRecord = {
      ...record,
      bestScore: isBetter ? result.score : record.bestScore,
      bestPercentile: isBetter ? result.percentile : record.bestPercentile,
      history: [result, ...record.history].slice(0, MAX_HISTORY_PER_TEST),
    };

    const newRecords = {
      ...state.records,
      [result.testType]: updatedRecord,
    };

    set({ records: newRecords });

    // 직렬화된 비동기 저장 (이전 저장 완료 후 다음 저장)
    const doSave = async () => {
      if (saveInFlight) await saveInFlight;
      await storageAdapter.save(newRecords);
    };
    saveInFlight = doSave().finally(() => { saveInFlight = null; });
  },

  getBestScore: (testType) => get().records[testType].bestScore,
  getBestPercentile: (testType) => get().records[testType].bestPercentile,
}));
