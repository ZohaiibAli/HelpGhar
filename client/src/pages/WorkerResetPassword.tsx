import { MainLayout } from "@/components/layout/MainLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function WorkerResetPasswordPage() {
  return (
    <MainLayout>
      <ResetPasswordForm
        apiEndpoint="/worker/reset-password"
        loginPath="/login"
        buttonClass="bg-amber-500 hover:bg-amber-600 text-white"
        linkColor="text-amber-600"
      />
    </MainLayout>
  );
}