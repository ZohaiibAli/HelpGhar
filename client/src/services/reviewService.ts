import { api } from "./api";
import type { Review } from "@/types";

export const reviewService = {
  getReviews: () =>
    api.get<{ success: boolean; reviews: Review[] }>("/reviews/admin"),
  createReview: (data: { workerId: string; rating: number; comment: string }) =>
    api.post<Review>("/reviews", data),
};
