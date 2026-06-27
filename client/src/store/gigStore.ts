import { create } from "zustand";
import { workers } from "@/data/mock";

export type Worker = typeof workers[0];  // 👈 derives the type from the array

interface GigStore {
  gigs: Worker[];
  addGig: (gig: Worker) => void;
}

export const useGigStore = create<GigStore>((set) => ({
  gigs: [],
  addGig: (gig) => set((state) => ({ gigs: [...state.gigs, gig] })),
}));