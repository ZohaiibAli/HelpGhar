import { api } from "@/services/api";
import type { JobPost, JobApplication } from "@/types";

export type JobPostDraft = Omit<
  JobPost,
  "id" | "jobId" | "customerId" | "customerName" | "status" | "applicationsCount" | "alreadyApplied" | "createdAt"
>;

export type JobApplicationDraft = {
  message: string;
  proposedPrice: number;
};

export const jobService = {
  createJob: (data: JobPostDraft) =>
    api.post("/jobs/", data).then((res) => res.data as { success: boolean; message: string; jobId: string }),

  getMyJobs: () =>
    api.get("/jobs/my").then((res) => res.data.jobs as JobPost[]),

  getJob: (jobId: string) =>
    api.get(`/jobs/${jobId}`).then((res) => res.data.job as JobPost),

  getJobApplications: (jobId: string) =>
    api.get(`/jobs/${jobId}/applications`).then((res) => res.data as { job: JobPost; applications: JobApplication[] }),

  cancelJob: (jobId: string) =>
    api.patch(`/jobs/${jobId}/cancel`).then((res) => res.data as { success: boolean; message: string }),

  acceptApplication: (jobId: string, applicationId: string) =>
    api
      .patch(`/jobs/${jobId}/applications/${applicationId}/accept`)
      .then((res) => res.data as { success: boolean; message: string; bookingId: string }),

  rejectApplication: (jobId: string, applicationId: string) =>
    api
      .patch(`/jobs/${jobId}/applications/${applicationId}/reject`)
      .then((res) => res.data as { success: boolean; message: string }),

  getOpenJobs: (category?: string) =>
    api
      .get("/jobs/open", { params: category ? { category } : undefined })
      .then((res) => res.data.jobs as JobPost[]),

  applyToJob: (jobId: string, data: JobApplicationDraft) =>
    api
      .post(`/jobs/${jobId}/apply`, data)
      .then((res) => res.data as { success: boolean; message: string; applicationId: string }),

  getMyApplications: () =>
    api.get("/jobs/worker/my-applications").then((res) => res.data.applications as JobApplication[]),

  withdrawApplication: (jobId: string, applicationId: string) =>
    api
      .patch(`/jobs/${jobId}/applications/${applicationId}/withdraw`)
      .then((res) => res.data as { success: boolean; message: string }),
};
