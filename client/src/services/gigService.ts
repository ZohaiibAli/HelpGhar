import { api } from "./api";
import { Worker } from "@/store/gigStore";

export const gigService = {
  // 👇 upload image file, get back a URL string
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ success: boolean; url: string }>(
      "/worker/upload-avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.url;
  },

  createGig: (gig: Worker) => api.post("/worker/gig", gig),
  getGigs: () => api.get<{ success: boolean; gigs: Worker[] }>("/worker/gigs"),
};