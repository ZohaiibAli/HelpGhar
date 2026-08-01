import axios from "axios";
import { getToken, handleAuthFailure, isTokenExpired } from "@/lib/session";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  // An expired token is never attached -- it would only come back 401. Public
  // endpoints called from public pages still go through unauthenticated, while
  // a protected one answers 403, which the response interceptor turns into a
  // logout. That keeps landing/services pages from force-redirecting.
  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {

    // 401 (rejected token) and 403 (missing bearer / wrong role) both end the
    // session and send the user to the login page they actually belong to.
    if (handleAuthFailure(error?.response)) {

      return Promise.reject({
        message: "Your session has ended. Please sign in again.",
        status: error?.response?.status,
        raw: error,
      });
    }

    const message =
      error?.response?.data?.detail ??
      error?.response?.data?.message ??
      error?.message ??
      "Something went wrong. Please try again.";

    return Promise.reject({
      message,
      status: error?.response?.status,
      raw: error,
    });

  }
);
