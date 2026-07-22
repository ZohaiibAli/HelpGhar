export type UserRole = "customer" | "worker" | "admin";

export interface User {
  id: string;
  customerId?: string;
  workerId?: string;   // <-- ADD THIS
  status?: string;
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

export interface RecommendationReason {
  title: string;
}

export interface Worker {
  id: string;
  workerId?: string;   // <-- ADD THIS
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
  /*
 -------------------------
 AI Fields
 -------------------------
 */

  marketplaceScore?: number;

  reputationLabel?: string;

  recommendationScore?: number;

  recommendationReasons?: string[];

  contentScore?: number;

  collaborativeScore?: number;

  reviewSummary?: {

    positive: number;

    neutral: number;

    negative: number;

    positivePercentage: number;

  };

  aiSummary?: {

    headline: string;

    summary: string;

    strengths: string[];

    improvements: string[];

    marketplaceScore?: number;

    reputationLabel?: string;

    // recommendationScore?: number;

    // recommendationReasons?: string[];

    reviewSummary?: {
      positive: number;
      neutral: number;
      negative: number;
      positivePercentage: number;
    }

  }

};


export type BookingStatus =
  | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface Booking {
  id: string;          // Mongo ObjectId
  bookingId: string;   // BK00001

  workerId: string;
  workerName: string;
  workerAvatar: string;

  category: WorkerCategory;

  date: string;
  timeSlot: string;

  duration: number;

  amount: number;
  fee: number;
  total: number;

  address: string;

  status: BookingStatus;

  customerId: string;
  createdAt: string;
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
  date?: string;
  createdAt?: string;
}

export interface Complaint {
  id: string;
  customerId?: string;
  customerName?: string;
  workerId?: string;
  workerName?: string;
  subject: string;
  description: string;
  status: "open" | "in_review" | "resolved" | "closed";
  date?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  date: string;
  read: boolean;
}