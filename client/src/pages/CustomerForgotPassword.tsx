import { MainLayout } from "@/components/layout/MainLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <MainLayout>
      <ForgotPasswordForm
        apiEndpoint="/customer/forgot-password"
        loginPath="/login"
        linkColor="text-primary"
        buttonClass="bg-primary hover:bg-primary-dark"
      />
    </MainLayout>
  );
}