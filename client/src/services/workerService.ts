import axios from "axios";
import { Worker } from "@/types";
import { api } from "@/services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Upload avatar image
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_BASE_URL}/worker/upload-avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  return response.data.url;
};

/**
 * Create gig
 */
export const createGig = async (gig: Omit<Worker, "id">) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_BASE_URL}/worker/gig`,
    gig,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  return response.data;
};

/**
 * Get all gigs
 */
export const getGigs = async (): Promise<Worker[]> => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API_BASE_URL}/worker/gigs`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  console.log("API Response:", response.data);

  return response.data.gigs;
};


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

export async function startBooking(bookingId: string) {
  const { data } = await api.patch(`/bookings/${bookingId}/start`);
  return data as { success: boolean; message: string };
}

export async function completeBooking(bookingId: string) {
  const { data } = await api.patch(`/bookings/${bookingId}/complete`);
  return data as { success: boolean; message: string };
}