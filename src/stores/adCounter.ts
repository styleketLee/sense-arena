import { create } from 'zustand';

const AD_INTERVAL = 3; // 3회 무료 후 1회 광고, 이후 3회마다 반복

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
