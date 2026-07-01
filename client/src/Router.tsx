import { Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import ServicesPage from "@/pages/Services";
import WorkerDetailsPage from "@/pages/WorkerDetails";
import BookingPage from "@/pages/BookingPage";
import PaymentPage from "@/pages/PaymentPage";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import ProfilePage from "@/pages/Customer_profile";
import SettingsPage from "@/pages/Settings";
import MyBookingsPage from "@/pages/MyBookings";
import TransactionsPage from "@/pages/Transactions";
import ReviewsPage from "@/pages/ReviewsPage";
import DisputePage from "@/pages/DisputePage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import WorkerDashboard from "@/pages/WorkerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

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
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/disputes" element={<DisputePage />} />
      <Route path="/dashboard/customer" element={<CustomerDashboard />} />
      <Route path="/dashboard/worker" element={<WorkerDashboard />} />
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
