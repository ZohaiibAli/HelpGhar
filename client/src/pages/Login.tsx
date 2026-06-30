import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import CustomerLoginForm from "@/pages/Customer_login";
import WorkerLoginForm from "@/pages/Worker_login";
import AdminLoginForm from "@/pages/Admin_login";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["customer", "worker", "admin"];

function isValidRole(r: string | undefined): r is UserRole {
  return ROLES.includes(r as UserRole);
}

export default function LoginPage() {
  const { role } = useParams<{ role?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isValidRole(role)) {
      navigate("/login/customer", { replace: true });
    }
  }, [role, navigate]);

  const activeRole: UserRole = isValidRole(role) ? role : "customer";

  return (
    <MainLayout>
      {/* Tab switcher */}
      <div className="flex justify-center border-b bg-background px-4 pt-4 pb-0">
        <div className="grid w-full max-w-xs grid-cols-3 rounded-full bg-muted p-1 text-xs font-bold">
          {ROLES.map((r) => (
            <Link
              key={r}
              to={`/login/${r}`}
              className={`rounded-full py-2 text-center capitalize transition ${
                activeRole === r
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      {activeRole === "customer" && <CustomerLoginForm />}
      {activeRole === "worker"   && <WorkerLoginForm />}
      {activeRole === "admin"    && <AdminLoginForm />}
    </MainLayout>
  );
}