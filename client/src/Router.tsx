import ProtectedRoute from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/pages/LandingPage";
import ServicesPage from "@/pages/Services";
import WorkerDetailsPage from "@/pages/WorkerDetails";
import BookingPage from "@/pages/BookingPage";
import PaymentPage from "@/pages/PaymentPage";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ForgotPasswordPage from "@/pages/CustomerForgotPassword";
import ResetPasswordPage from "./pages/CustomerResetPassword";
import ProfilePage from "@/pages/Customer_profile";
import WorkerProfilePage from "@/pages/Worker_profile";
import SettingsPage from "@/pages/Customer_settings";
import MyBookingsPage from "@/pages/Customer_bookings";
import TransactionsPage from "@/pages/Transactions";
import ReviewsPage from "@/pages/Customer_review";
import DisputePage from "@/pages/Customer_Dispute_Page";
import WorkerDisputePage from "@/pages/Worker_dispute";
import CustomerDashboard from "@/pages/CustomerDashboard";
import WorkerDashboard from "@/pages/WorkerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminAnalytics from "@/pages/Admin_analytics";
import AdminUsers from "@/pages/Admin_users";
import AdminBookings from "@/pages/Admin_bookings";
import AdminComplaints from "@/pages/Admin_complaints";
import AdminReviews from "@/pages/Admin_reviews";
import AdminSettings from "@/pages/Admin_settings";
import AdminProfile from "@/pages/Admin_profile";
import AdminForgotPasswordPage from "./pages/AdminForgotPassword";
import AdminResetPasswordPage from "./pages/AdminResetPassword";
import MessagesPage from "@/pages/Messages";
import NotFound from "@/pages/NotFound";
import WorkerSettingsPage from "./pages/Worker_settings";
import WorkerReviewsPage from "./pages/Worker_review";
import WorkerBookings from "./pages/Worker_bookings";
import WorkerDetailsDescriptionPage from "./pages/worker_details_description";
import WorkerForgotPasswordPage from "@/pages/WorkerForgotPassword";
import WorkerResetPasswordPage from "@/pages/WorkerResetPassword";

import { ChatPage } from "./pages/Main_ChatBot";
import Customer_PostJob from "@/pages/Customer_PostJob";
import Customer_MyJobs from "@/pages/Customer_MyJobs";
import Customer_JobApplicants from "@/pages/Customer_JobApplicants";
import Worker_JobBoard from "@/pages/Worker_JobBoard";
import Worker_MyApplications from "@/pages/Worker_MyApplications";

function ProfileRouter() {
  const { user } = useAuthStore();

  if (user?.role === "worker") {
    return <WorkerProfilePage />;
  }

  return <ProfilePage />;
}

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/workers/:id" element={<WorkerDetailsPage />} />
        {/* <Route path="/booking" element={<BookingPage />} /> */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        {/* <Route path="/profile" element={<ProfileRouter />} /> */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["customer", "worker"]}>
              <ProfileRouter />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/my-bookings" element={<MyBookingsPage />} /> */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/transactions" element={<TransactionsPage />} /> */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/reviews" element={<ReviewsPage />} /> */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <ReviewsPage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/disputes" element={<DisputePage />} /> */}
        <Route
          path="/disputes"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <DisputePage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/dashboard/customer" element={<CustomerDashboard />} /> */}
        <Route
          path="/dashboard/customer"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/dashboard/worker" element={<WorkerDashboard />} /> */}
        <Route
          path="/dashboard/worker"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/complaints"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/reviews"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
         <Route
          path="/admin-forgot-password"
          element={<AdminForgotPasswordPage />}
        />
        <Route
          path="/admin-reset-password"
          element={<AdminResetPasswordPage />}
        />
        <Route
          path="/worker/reviews"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/details"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerDetailsDescriptionPage />
            </ProtectedRoute>
          }
        />

        {/* <Route path="/worker/profile" element={<WorkerProfilePage />} /> */}
        <Route
          path="/worker/profile"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/settings"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker-forgot-password"
          element={<WorkerForgotPasswordPage />}
        />
        <Route
          path="/worker-reset-password"
          element={<WorkerResetPasswordPage />}
        />
        <Route
          path="/worker/dispute"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerDisputePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/bookings"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post-job"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Customer_PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Customer_MyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs/:jobId"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Customer_JobApplicants />
            </ProtectedRoute>
          }
        />
        {/* Public on purpose, same as /services -- anyone can browse open
            job requests without an account. Applying still requires a
            worker login, enforced inside the page and by the API. */}
        <Route path="/job-board" element={<Worker_JobBoard />} />
        <Route
          path="/worker/applications"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <Worker_MyApplications />
            </ProtectedRoute>
          }
        />
        {/* One inbox shared by both sides -- the page renders the right
            sidebar and copy from the signed-in role, so a customer and a
            worker land on the same URL and see their own conversations. */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={["customer", "worker"]}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}