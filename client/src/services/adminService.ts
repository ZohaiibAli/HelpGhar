import { api } from "./api";

export const adminService = {
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