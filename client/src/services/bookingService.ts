import { api } from "./api";
import type { Booking } from "@/types";

export const bookingService = {
  getMyBookings: () =>
    api.get("/bookings/my"),

  getAllBookings: () =>
    api.get("/bookings/admin/all"),

  createBooking: (data: Partial<Booking>) =>
    api.post("/bookings", data),

  cancelBooking: (bookingId: string) =>
    api.patch(`/bookings/admin/${bookingId}/cancel`),

  // Escrow overrides for disputes (e.g. customer won't share the PIN).
  releaseEscrow: (bookingId: string) =>
    api.patch(`/bookings/admin/${bookingId}/escrow/release`),

  refundEscrow: (bookingId: string) =>
    api.patch(`/bookings/admin/${bookingId}/escrow/refund`),

  unlockPin: (bookingId: string) =>
    api.patch(`/bookings/admin/${bookingId}/pin/unlock`),
};