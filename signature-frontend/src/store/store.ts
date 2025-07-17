import { create } from 'zustand';

interface AppState {
  signingProgress: { [key: string]: { current: number; total: number } };
  setSigningProgress: (requestId: string, progress: { current: number; total: number }) => void;
}

export const useAppStore1 = create<AppState>((set) => ({
  signingProgress: {},
  setSigningProgress: (requestId, progress) =>
    set((state) => ({
      signingProgress: { ...state.signingProgress, [requestId]: progress },
    })),
}));