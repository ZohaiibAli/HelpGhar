import { MainLayout } from "@/components/layout/MainLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function WorkerForgotPasswordPage() {
  return (
    <MainLayout>
      <ForgotPasswordForm
        apiEndpoint="/worker/forgot-password"
        loginPath="/login"
        linkColor="text-amber-600"
        buttonClass="bg-amber-500 hover:bg-amber-600 text-white"
      />
    </MainLayout>
  );
}