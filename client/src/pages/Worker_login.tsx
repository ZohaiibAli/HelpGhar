import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { HgAlert } from "@/components/ui/HgAlert";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  remember: z.boolean().optional(),
});
type FormVals = z.infer<typeof schema>;

export default function WorkerLoginForm() {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "server";
    title: string;
    description: string;
  }>({ open: false, type: "error", title: "", description: "" });

  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const onSubmit = async (data: FormVals) => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/worker/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {

        localStorage.setItem("token", result.token);

          setSession(
            {
              id: result.worker.id,
              workerId: result.worker.workerId,
              status: result.worker.status,
              fullName: result.worker.fullName,
              email: result.worker.email,
              phone: result.worker.phone,
              address: result.worker.address,
              role: "worker",
              createdAt: result.worker.createdAt ?? new Date().toISOString(),
            },
            result.token
          );

          navigate("/dashboard/worker");

      } else {

        setAlertState({
          open: true,
          type: "error",
          title: "Invalid credentials",
          description: result.message || "The email or password you entered is incorrect. Please try again.",
        });
      }

    } catch (error) {

      console.log(error);
      setAlertState({
        open: true,
        type: "server",
        title: "Something went wrong",
        description: "We couldn't reach the server. Please check your connection and try again.",
      });

    }

  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="hidden lg:block">
        <div className="rounded-3xl bg-hero-gradient p-10 shadow-card">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <Briefcase className="h-3.5 w-3.5" /> Worker Portal
          </span>
          <h2 className="mt-5 text-4xl font-black leading-tight">Manage your<br />jobs & earnings.</h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            View incoming requests, track completed jobs, and get paid — all from your worker dashboard.
          </p>
          <div className="mt-10 aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-200/40 via-amber-50 to-card" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <Briefcase className="h-3 w-3" /> Worker
        </div>
        <h1 className="text-3xl font-black">Worker sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Not a worker yet?{" "}
          <Link to="/register" className="font-semibold text-amber-600 hover:underline">Apply to join</Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" className="hg-input-worker" placeholder="you@example.com" />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <input {...register("password")} type={showPwd ? "text" : "password"} className="hg-input-worker pr-10" />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" {...register("remember")} className="h-4 w-4 rounded border-input" /> Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-amber-600 hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-amber-500 text-base font-bold text-white hover:bg-amber-600">
            {isSubmitting ? "Signing in…" : "Sign in as Worker"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Demo mode — any credentials log you in.</p>
        </form>
      </div>
      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />

      <style>{`
        .hg-input-worker{width:100%;height:48px;border-radius:12px;border:1px solid var(--input);background:var(--card);padding:0 14px;font-size:14px;outline:none;transition:.15s;}
        .hg-input-worker:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgb(245 158 11 / 18%);}
      `}</style>
    </div>
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