import { api } from "./api";
import type { Review } from "@/types";

export const reviewService = {
  getReviews: (workerId?: string) =>
    api.get<Review[]>("/reviews", { params: workerId ? { workerId } : undefined }),
  createReview: (data: { workerId: string; rating: number; comment: string }) =>
    api.post<Review>("/reviews", data),
};
