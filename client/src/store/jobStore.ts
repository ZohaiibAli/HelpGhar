import { create } from "zustand";
import { JobPost, JobApplication } from "@/types";
import { jobService } from "@/services/jobService";

interface JobStore {
  openJobs: JobPost[];
  myJobs: JobPost[];
  myApplications: JobApplication[];
  fetchOpenJobs: (category?: string) => Promise<void>;
  fetchMyJobs: () => Promise<void>;
  fetchMyApplications: () => Promise<void>;
}

export const useJobStore = create<JobStore>((set) => ({
  openJobs: [],
  myJobs: [],
  myApplications: [],

  fetchOpenJobs: async (category) => {
    try {
      const openJobs = await jobService.getOpenJobs(category);
      set({ openJobs });
    } catch (err) {
      console.error("Failed to fetch open jobs:", err);
    }
  },

  fetchMyJobs: async () => {
    try {
      const myJobs = await jobService.getMyJobs();
      set({ myJobs });
    } catch (err) {
      console.error("Failed to fetch my jobs:", err);
    }
  },

  fetchMyApplications: async () => {
    try {
      const myApplications = await jobService.getMyApplications();
      set({ myApplications });
    } catch (err) {
      console.error("Failed to fetch my applications:", err);
    }
  },
}));
