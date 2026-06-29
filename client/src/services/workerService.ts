import axios from "axios";
import { Worker } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Upload avatar image
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("hg_token");

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
  const token = localStorage.getItem("hg_token");

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
  const token = localStorage.getItem("hg_token");

  const response = await axios.get(
    `${API_BASE_URL}/worker/gigs`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  return response.data.gigs;
};