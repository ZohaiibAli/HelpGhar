import { create } from "zustand";
import { workers } from "@/data/mock";
import { gigService } from "@/services/gigService";

export type Worker = typeof workers[0];

interface GigStore {
  gigs: Worker[];
  loading: boolean;
  fetchGigs: () => Promise<void>;
  addGig: (gig: Worker) => Promise<void>;
}

export const useGigStore = create<GigStore>((set) => ({
  gigs: [],
  loading: false,

  fetchGigs: async () => {
    set({ loading: true });
    try {
      const res = await gigService.getGigs();
      set({ gigs: res.data.gigs });
    } catch (e) {
      console.error("Failed to fetch gigs:", e);
    } finally {
      set({ loading: false });
    }
  },

  addGig: async (gig: Worker) => {
    try {
      await gigService.createGig(gig);
      // refetch so the new gig gets its real MongoDB id
      const res = await gigService.getGigs();
      set({ gigs: res.data.gigs });
    } catch (e) {
      console.error("Failed to save gig:", e);
    }
  },
}));