import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/pages/LandingPage";
import ServicesPage from "@/pages/Services";
import WorkerDetailsPage from "@/pages/WorkerDetails";
import BookingPage from "@/pages/BookingPage";
import PaymentPage from "@/pages/PaymentPage";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import ProfilePage from "@/pages/Customer_profile";
import WorkerProfilePage from "@/pages/Worker_profile";
import SettingsPage from "@/pages/Customer_settings";
import MyBookingsPage from "@/pages/MyBookings";
import TransactionsPage from "@/pages/Transactions";
import ReviewsPage from "@/pages/Customer_review";
import DisputePage from "@/pages/DisputePage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import WorkerDashboard from "@/pages/WorkerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import WorkerSettingsPage from "./pages/Worker_settings";
import WorkerReviewsPage from "./pages/Worker_review";

function ProfileRouter() {
  const { user } = useAuthStore();

  if (user?.role === "worker") {
    return <WorkerProfilePage />;
  }

  return <ProfilePage />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/workers/:id" element={<WorkerDetailsPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/login" element={<LoginPage />} />  // auto-redirects → /login/customer
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/profile" element={<ProfileRouter />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/disputes" element={<DisputePage />} />
      <Route path="/dashboard/customer" element={<CustomerDashboard />} />
      <Route path="/dashboard/worker" element={<WorkerDashboard />} />
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/worker" element={<WorkerDashboard />} />
      <Route path="/worker/reviews" element={<WorkerReviewsPage />} />
      <Route path="/worker/profile" element={<WorkerProfilePage />} />
      <Route path="/worker/settings" element={<WorkerSettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
