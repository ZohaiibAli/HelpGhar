import { create } from "zustand";
import { Worker } from "@/types";
import { getGigs } from "@/services/workerService";

interface GigStore {
  gigs: Worker[];
  fetchGigs: () => Promise<void>;
}

export const useGigStore = create<GigStore>((set) => ({
  gigs: [],

  fetchGigs: async () => {
    try {
      const gigs = await getGigs();
      set({ gigs });
    } catch (err) {
      console.error("Failed to fetch gigs:", err);
    }
  },
}));