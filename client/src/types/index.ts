// Shared domain types for HelpGhar

export type UserRole = "customer" | "worker" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;

  cnic?: string;
  dob?: string;
  gender?: "Male" | "Female";
  category?: WorkerCategory;
  experience?: string;
  pricing?: string;
  skills?: string;

}

export type WorkerCategory =
  | "House Servants"
  | "Drivers"
  | "Baby Sitters"
  | "Cooks"
  | "Home Teachers"
  | "Watchmen"
  | "Electricians"
  | "Plumbers"
  | "Cleaners";

export interface Worker {
  id: string;
  fullName: string;
  avatar: string;
  category: WorkerCategory;
  city: string;
  age: number;
  gender: "Male" | "Female";
  experienceYears: number;
  memberSince: string;
  rating: number;
  reviewsCount: number;
  priceMin: number;
  priceMax: number;
  priceUnit: "month" | "hour" | "day";
  available: boolean;
  cnicVerified: boolean;
  badges: ("Top Rated" | "Most Trusted" | "Rising Star")[];
  bio: string;
  skills: string[];
  certificates: string[];
}

export type BookingStatus =
  | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface Booking {
  id: string;
  workerId: string;
  workerName: string;
  workerAvatar: string;
  category: WorkerCategory;
  date: string;
  timeSlot: string;
  durationHours: number;
  amount: number;
  platformFee: number;
  total: number;
  status: BookingStatus;
  address: string;
}

export type PaymentStatus = "successful" | "pending" | "refunded";
export interface Transaction {
  id: string;
  bookingId: string;
  date: string;
  method: "Card" | "Wallet" | "Bank";
  amount: number;
  status: PaymentStatus;
}

export interface Review {
  id: string;
  workerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Complaint {
  id: string;
  customerName: string;
  workerName: string;
  subject: string;
  description: string;
  status: "open" | "in_review" | "resolved" | "closed";
  date: string;
}

export interface NotificationItem {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  date: string;
  read: boolean;
}
