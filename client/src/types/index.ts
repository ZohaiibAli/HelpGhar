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
  price: number;
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
  // Worker side of the 5% cut: the worker receives amount - workerFee.
  workerFee?: number;
  workerPayout?: number;

  address: string;

  status: BookingStatus;

  customerId: string;
  createdAt: string;

  // Escrow (admin list only). paymentStatus is "unpaid" before payment.
  paymentStatus?: PaymentStatus | "unpaid";
  pinLocked?: boolean;
  // Only ever sent to the customer who owns the booking.
  completionPin?: string;
}

// Escrow: "held" until the worker completes the job with the customer's
// PIN, then "released" to the worker; "refunded" if the booking is cancelled.
export type PaymentStatus = "held" | "released" | "pending" | "refunded";
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

export type PaymentResolution = "released" | "refunded" | "completed_with_pin";

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
  bookingId?: string;
  // Customer/worker view: true once an admin acted on the complaint.
  // Admin view: the action itself.
  actionTaken?: boolean | { action: AccountStatus | "warned"; days?: number | null; at: string };
  // "payment" = worker's payment dispute (customer didn't give the PIN).
  type?: "complaint" | "payment";
  amount?: number | null;
  // Payment disputes: how it was decided. A string in the worker view,
  // the full record in the admin view.
  resolution?: PaymentResolution | { decision: PaymentResolution; note?: string | null; at?: string } | null;
  // Admin view only: the account being complained about, live.
  against?: {
    role: "customer" | "worker";
    id: string;
    name?: string;
    status: AccountStatus | null;
    suspendedUntil?: string | null;
    reason?: string | null;
  };
}

export type AccountStatus = "active" | "suspended" | "blocked";

// One person you've had bookings with, for the complaint picker.
export interface BookedCounterpart {
  workerId?: string;
  customerId?: string;
  fullName: string;
  lastBookedAt?: string;
  lastCategory?: string;
  bookings: {
    bookingId: string;
    category?: string;
    date?: string;
    timeSlot?: string;
    status?: string;
  }[];
}

export type JobStatus = "open" | "assigned" | "completed" | "cancelled";

export interface JobPost {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  category: WorkerCategory;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  budgetUnit: "hour" | "day" | "month" | "fixed";
  address: string;
  preferredDate: string;
  preferredTime: string;
  status: JobStatus;
  applicationsCount?: number;
  alreadyApplied?: boolean;
  /** Only on the public job board: the poster's average rating from workers. */
  customerRating?: number;
  customerReviewsCount?: number;
  createdAt: string;
}

/** A worker's review of a customer, left after a completed booking. */
export interface CustomerReview {
  reviewId: string;
  bookingId?: string;
  category?: string;
  workerId: string;
  workerName: string;
  workerAvatar?: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface JobApplication {
  id: string;
  applicationId: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerAvatar?: string;
  message: string;
  proposedPrice: number;
  status: ApplicationStatus;
  createdAt: string;

  // Present on the customer's "applicants" view (worker reputation).
  rating?: number;
  reviewsCount?: number;
  cnicVerified?: boolean;

  // Present on the worker's "my applications" view (parent job snapshot).
  jobTitle?: string;
  jobCategory?: WorkerCategory;
  jobStatus?: JobStatus;
}

export interface NotificationItem {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  date: string;
  read: boolean;
}