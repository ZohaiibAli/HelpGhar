import { MainLayout } from "@/components/layout/MainLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function AdminResetPasswordPage() {
  return (
    <MainLayout>
      <ResetPasswordForm
        apiEndpoint="/admin/reset-password"
        loginPath="/login"
        buttonClass="bg-slate-900 hover:bg-slate-700 text-white"
        linkColor="text-slate-600"
      />
    </MainLayout>
  );
}