import axios from "axios";
import { logoutUser } from "@/store/authStore";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {

    if (error?.response?.status === 401) {

      logoutUser();

      window.location.href = "/";

      return Promise.reject(error);
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