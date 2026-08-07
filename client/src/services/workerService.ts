import { Worker } from "@/types";
import { api } from "@/services/api";

/**
 * Upload avatar image
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/worker/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.url;
};

/**
 * What a worker may submit for their own listing.
 *
 * Reputation is not part of it. The server stopped accepting `rating`,
 * `reviewsCount`, `cnicVerified` and `badges` on a gig -- a worker could
 * otherwise hand themselves a 5.0 rating, a "Top Rated" badge and the CNIC
 * verified tick without an admin ever seeing the account. Those four are
 * derived on read from the worker record instead.
 */
export type GigDraft = Omit<
  Worker,
  "id" | "rating" | "reviewsCount" | "cnicVerified" | "badges"
>;

/**
 * Create gig
 */
export const createGig = async (gig: GigDraft) => {
  const response = await api.post("/worker/gig", gig);
  return response.data;
};

/**
 * Get all gigs
 */
export const getGigs = async (): Promise<Worker[]> => {
  const response = await api.get("/worker/gigs");

  console.log("API Response:", response.data);

  return response.data.gigs;
};

/**
 * Get worker dashboard stats + active jobs
 */
export async function getWorkerDashboard() {
  const { data } = await api.get("/dashboard/worker");
  return data as {
    success: boolean;
    stats: {
      totalJobs: number;
      completedJobs: number;
      completionRate: number;
      avgRating: number;
      reviewsCount: number;
      totalEarnings: number;
      activeGigs: number;
      available: boolean;
      pendingJobs: number;
    };
    activeJobs: {
      bookingId: string;
      category: string;
      address: string;
      date: string;
      timeSlot: string;
      durationHours: number;
      customerName: string;
      status: string;
    }[];
  };
}

/**
 * Start a booking
 */
export async function startBooking(bookingId: string) {
  const { data } = await api.patch(`/bookings/${bookingId}/start`);
  return data as { success: boolean; message: string };
}

/**
 * Complete a booking
 */
export async function completeBooking(bookingId: string) {
  const { data } = await api.patch(`/bookings/${bookingId}/complete`);
  return data as { success: boolean; message: string };
}