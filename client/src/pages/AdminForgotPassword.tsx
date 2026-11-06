import { MainLayout } from "@/components/layout/MainLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function AdminForgotPasswordPage() {
  return (
    <MainLayout>
      <ForgotPasswordForm
        apiEndpoint="/admin/forgot-password"
        loginPath="/login"
        linkColor="text-slate-600"
        buttonClass="bg-slate-900 hover:bg-slate-700 text-white"
      />
    </MainLayout>
  );
}