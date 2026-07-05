import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { HgAlert } from "@/components/ui/HgAlert";

const schema = z.object({
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    remember: z.boolean().optional(),
});
type FormVals = z.infer<typeof schema>;

export default function AdminLoginForm() {
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

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<FormVals>({
        resolver: zodResolver(schema),
    });
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const onSubmit = async (data: FormVals) => {
        try {

            // const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/admin/login`, {
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

                setSession(result.admin, result.token);
                localStorage.setItem("token", result.token);
                console.log(result.admin);

                navigate("/dashboard/admin");

            } else {

                setAlertState({
                    open: true,
                    type: "error",
                    title: "Invalid credentials",
                    description: "The email or password you entered is incorrect. Please try again.",
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
    <div className="w-full">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        <ShieldCheck className="h-3 w-3" /> Admin
      </div>
      <h1 className="text-3xl font-black">Admin sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Restricted access. Authorised personnel only.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="Admin Email" error={errors.email?.message}>
          <input {...register("email")} type="email" className="hg-input-admin" placeholder="Enter admin email" />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input {...register("password")} type={showPwd ? "text" : "password"} className="hg-input-admin pr-10" />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" {...register("remember")} className="h-4 w-4 rounded border-input" /> Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-slate-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-slate-900 text-base font-bold text-white hover:bg-slate-700">
          {isSubmitting ? "Verifying…" : "Sign in as Admin"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Enter your administrator credentials to continue.</p>
      </form>

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />

      <style>{`
        .hg-input-admin{width:100%;height:48px;border-radius:12px;border:1px solid var(--input);background:var(--card);padding:0 14px;font-size:14px;outline:none;transition:.15s;}
        .hg-input-admin:focus{border-color:#0f172a;box-shadow:0 0 0 3px rgb(15 23 42 / 12%);}
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