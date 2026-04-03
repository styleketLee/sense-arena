import { create } from 'zustand';
import type { TestType } from '../domain/types';

interface TestState {
  isRunning: boolean;
  currentRound: number;
  score: number;
  timeLeft: number;
  testType: TestType | null;

  startTest: (testType: TestType, duration: number) => void;
  nextRound: () => void;
  addScore: (points: number) => void;
  setTimeLeft: (time: number) => void;
  endTest: () => void;
  reset: () => void;
}

export const useTestStore = create<TestState>((set) => ({
  isRunning: false,
  currentRound: 0,
  score: 0,
  timeLeft: 0,
  testType: null,

  startTest: (testType, duration) =>
    set({
      isRunning: true,
      currentRound: 1,
      score: 0,
      timeLeft: duration,
      testType,
    }),

  nextRound: () =>
    set((state) => ({ currentRound: state.currentRound + 1 })),

  addScore: (points) =>
    set((state) => ({ score: state.score + points })),

  setTimeLeft: (time) =>
    set({ timeLeft: time }),

  endTest: () =>
    set({ isRunning: false }),

  reset: () =>
    set({
      isRunning: false,
      currentRound: 0,
      score: 0,
      timeLeft: 0,
      testType: null,
    }),
}));
