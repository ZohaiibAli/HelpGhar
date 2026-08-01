import { MainLayout } from "@/components/layout/MainLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <MainLayout>
      <ResetPasswordForm
        apiEndpoint="/customer/reset-password"
        loginPath="/login"
        buttonClass="bg-primary hover:bg-primary-dark"
        linkColor="text-primary"
      />
    </MainLayout>
  );
}