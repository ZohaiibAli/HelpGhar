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
import DisputePage from "@/pages/Customer_Dispute_Page";
import WorkerDisputePage from "@/pages/Worker_dispute";
import CustomerDashboard from "@/pages/CustomerDashboard";
import WorkerDashboard from "@/pages/WorkerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/Admin_users";
import AdminBookings from "@/pages/Admin_bookings";
import AdminComplaints from "@/pages/Admin_complaints";
import AdminReviews from "@/pages/Admin_reviews";
import AdminAnalytics from "@/pages/Admin_analytics";
import AdminSettings from "@/pages/Admin_settings";
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
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="/dashboard/admin/users" element={<AdminUsers />} />
      <Route path="/dashboard/admin/bookings" element={<AdminBookings />} />
      <Route path="/dashboard/admin/complaints" element={<AdminComplaints />} />
      <Route path="/dashboard/admin/reviews" element={<AdminReviews />} />
      <Route path="/dashboard/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/dashboard/admin/settings" element={<AdminSettings />} />
      <Route path="/worker/reviews" element={<WorkerReviewsPage />} />
      <Route path="/worker/profile" element={<WorkerProfilePage />} />
      <Route path="/worker/settings" element={<WorkerSettingsPage />} />
      <Route path="/worker/dispute" element={<WorkerDisputePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}