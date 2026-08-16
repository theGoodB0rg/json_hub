import { create } from 'zustand';

interface ProState {
  isPro: boolean;
  setIsPro: (val: boolean) => void;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  setIsPro: (val: boolean) => set({ isPro: val }),
}));
