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
};