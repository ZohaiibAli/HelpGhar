import { api } from "./api";
import type { Booking } from "@/types";

export const bookingService = {
  getBookings: () => api.get<Booking[]>("/bookings"),
  createBooking: (data: Partial<Booking>) => api.post<Booking>("/bookings", data),
  cancelBooking: (id: string) => api.post(`/bookings/${id}/cancel`),
  rescheduleBooking: (id: string, date: string, timeSlot: string) =>
    api.post(`/bookings/${id}/reschedule`, { date, timeSlot }),
};
