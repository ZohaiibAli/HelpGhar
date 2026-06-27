import { api } from "./api";
import type { Transaction } from "@/types";

export const paymentService = {
  makePayment: (payload: { bookingId: string; method: string; cardToken?: string }) =>
    api.post<Transaction>("/payments", payload),
  getTransactions: () => api.get<Transaction[]>("/payments"),
};
