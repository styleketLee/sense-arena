import { create } from 'zustand';

const AD_INTERVAL = 3; // 3회마다 1회 광고 (3번째, 6번째, ...)

interface AdCounterState {
  count: number;
  increment: () => void;
  shouldShowAd: () => boolean;
}

export const useAdCounter = create<AdCounterState>((set, get) => ({
  count: 0,

  increment: () => set((s) => ({ count: s.count + 1 })),

  shouldShowAd: () => get().count > 0 && get().count % AD_INTERVAL === 0,
}));
