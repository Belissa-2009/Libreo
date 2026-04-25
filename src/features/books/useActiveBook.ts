import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActiveBookState {
  activeBookId: string | null;
  setActiveBook: (id: string) => void;
  clearActiveBook: () => void;
}

export const useActiveBook = create<ActiveBookState>()(
  persist(
    (set) => ({
      activeBookId: null,
      setActiveBook: (id) => set({ activeBookId: id }),
      clearActiveBook: () => set({ activeBookId: null }),
    }),
    { name: 'active-book' }
  )
);
