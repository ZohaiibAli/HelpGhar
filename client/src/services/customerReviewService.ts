import { api } from "@/services/api";
import type { CustomerReview } from "@/types";

export type CustomerReviewSummary = {
  customerId: string;
  fullName: string;
  rating: number;
  reviewsCount: number;
};

/** Workers rating customers after a completed job. */
export const customerReviewService = {
  submit: (data: { bookingId: string; rating: number; comment: string }) =>
    api
      .post("/customer-reviews/", data)
      .then((res) => res.data as { success: boolean; message: string; review: CustomerReview }),

  /** Reviews the logged-in worker has written. */
  getGiven: () =>
    api.get("/customer-reviews/given").then((res) => res.data.reviews as CustomerReview[]),

  /** Everything workers have said about one customer. */
  getForCustomer: (customerId: string) =>
    api
      .get(`/customer-reviews/customer/${customerId}`)
      .then((res) => res.data as { customer: CustomerReviewSummary; reviews: CustomerReview[] }),
};
