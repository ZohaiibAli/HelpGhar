import { api } from "./api";

export interface AdminOverviewStats {
  totalUsers: number;
  totalCustomers: number;
  totalWorkers: number;
  pendingVerifications: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  grossRevenue: number;
  platformEarnings: number;
  openComplaints: number;
  avgRating: number;
  reviewsCount: number;
}

export interface SeriesPoint {
  day: string;
  date: string;
  value: number;
}

export interface PendingWorker {
  workerId: string;
  fullName: string;
  email: string;
  category: string;
  cnic: string;
  avatar: string;
  appliedAt: string;
}

export interface AdminOverview {
  success: boolean;
  stats: AdminOverviewStats;
  // null means "no previous week to compare against" -- the UI shows a
  // dash instead of inventing a percentage.
  trends: { bookings: number | null; revenue: number | null };
  series: { bookings: SeriesPoint[]; revenue: SeriesPoint[] };
  verificationQueue: PendingWorker[];
}

export const adminService = {
  // Platform overview (real stats, trends, charts, verification queue)
  getOverview: () => api.get<AdminOverview>("/dashboard/admin"),

  // Approve / reject a worker's CNIC verification
  setWorkerVerification: (workerId: string, action: "approve" | "reject") =>
    api.patch(`/admin/workers/${workerId}/verification`, { action }),

  // Get all customers + workers
  getUsers: () => api.get("/admin/users"),

  // Suspend / Activate
  toggleUserStatus: (role: string, id: string) =>
    api.patch(`/admin/users/${role}/${id}/status`),

  // Delete user
  deleteUser: (role: string, id: string) =>
    api.delete(`/admin/users/${role}/${id}`),

  // Existing complaint APIs
  getCustomerComplaints: () =>
    api.get("/admin/disputes/customer"),

  getWorkerComplaints: () =>
    api.get("/admin/disputes/worker"),

  resolveComplaint: (id: string) =>
    api.patch(`/admin/dispute/${id}/resolve`),

  deleteComplaint: (id: string) =>
    api.delete(`/admin/dispute/${id}`),
};