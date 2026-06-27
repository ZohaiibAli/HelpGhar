import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  remember: z.boolean().optional(),
});
type FormVals = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { mockLoginAs } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<UserRole>("customer");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { email: "demo@helpghar.pk", password: "demo123", remember: true },
  });

  const onSubmit = async (_data: FormVals) => {
    await new Promise((r) => setTimeout(r, 500));
    mockLoginAs(role);
    navigate(role === "admin" ? "/dashboard/admin" : role === "worker" ? "/dashboard/worker" : "/dashboard/customer");
  };

  return (
    <MainLayout>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden lg:block">
          <div className="rounded-3xl bg-hero-gradient p-10 shadow-card">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-dark">
              <ShieldCheck className="h-3.5 w-3.5" /> Welcome back
            </span>
            <h2 className="mt-5 text-4xl font-black leading-tight">Pick up where<br />you left off.</h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Manage bookings, message workers, and track payments — all from a single dashboard.
            </p>
            <div className="mt-10 aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-primary-soft to-card" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-black">Log in to HelpGhar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Don't have an account? <Link to="/register" className="font-semibold text-primary hover:underline">Create one</Link></p>

          <div className="mt-6 grid grid-cols-3 rounded-full bg-muted p-1 text-xs font-bold">
            {(["customer", "worker", "admin"] as UserRole[]).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`rounded-full py-2 capitalize transition ${role === r ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} type="email" className="hg-input" placeholder="you@example.com" />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <input {...register("password")} type={showPwd ? "text" : "password"} className="hg-input pr-10" />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" {...register("remember")} className="h-4 w-4 rounded border-input" /> Remember me</label>
              <Link to="/forgot-password" className="font-semibold text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark">
              {isSubmitting ? "Signing in…" : `Sign in as ${role}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Demo mode — any credentials log you in.</p>
          </form>
        </div>
      </div>

      <style>{`.hg-input{width:100%;height:48px;border-radius:12px;border:1px solid var(--input);background:var(--card);padding:0 14px;font-size:14px;outline:none;transition:.15s;}
      .hg-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 18%,transparent);}`}</style>
    </MainLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
