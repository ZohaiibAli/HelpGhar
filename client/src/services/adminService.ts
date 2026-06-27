import { api } from "./api";
import type { User, Worker, Complaint } from "@/types";

export const adminService = {
  listUsers: () => api.get<User[]>("/admin/users"),
  suspendUser: (id: string) => api.post(`/admin/users/${id}/suspend`),
  listPendingWorkers: () => api.get<Worker[]>("/admin/workers/pending"),
  approveWorker: (id: string) => api.post(`/admin/workers/${id}/approve`),
  rejectWorker: (id: string, reason: string) =>
    api.post(`/admin/workers/${id}/reject`, { reason }),
  listComplaints: () => api.get<Complaint[]>("/admin/complaints"),
  resolveComplaint: (id: string) => api.post(`/admin/complaints/${id}/resolve`),
};
