import { api } from "./api";
import { Worker } from "@/types";

/**
 * Upload avatar image to backend
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/worker/upload-avatar",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.url;
};

/**
 * Create a new gig
 */
export const createGig = async (gig: Omit<Worker, "id">) => {
  const response = await api.post("/worker/gig", gig);
  return response.data;
};

/**
 * Get all gigs
 */
export const getGigs = async (): Promise<Worker[]> => {
  const response = await api.get("/worker/gigs");
  return response.data.gigs;
};