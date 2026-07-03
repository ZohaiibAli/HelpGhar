import { useNavigate } from "react-router-dom";
import { HgAlert } from "@/components/ui/HgAlert";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, CheckCircle2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types";


const cnicRegex = /^\d{5}-\d{7}-\d$/;


const baseCustomerSchema = z.object({
  fullName: z.string().trim().min(2, "Required").max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10, "Enter a valid phone"),
  address: z.string().trim().min(5).max(200),
  password: z.string()
    .min(6, "Min 6 chars")
    .regex(/\d/, "Add a number"),
  confirmPassword: z.string(),
});

const customerSchema = baseCustomerSchema.refine(
  (d) => d.password === d.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

const workerSchema = baseCustomerSchema.extend({
  cnic: z.string().regex(cnicRegex, "Format: 12345-1234567-1"),
  dob: z.string().min(1, "Required"),
  gender: z.enum(["Male", "Female"]),
  category: z.string().min(1, "Required"),
  experience: z.string().min(1, "Required"),
  pricing: z.string().min(1, "Required"),
  skills: z.string().min(10, "Tell us a bit more"),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function RegisterPage() {
  const navigate = useNavigate()
  const [customerId, setCustomerId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [submitted, setSubmitted] = useState(false);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "server";
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({ open: false, type: "error", title: "", description: "" });

  const schema = role === "worker" ? workerSchema : customerSchema;
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(schema as any),
  });

  const onSubmit = async (data: any) => {

    try {

      const api =
        role === "customer"
          ? "http://127.0.0.1:8000/customer/register"
          : "http://127.0.0.1:8000/worker/register";

      const response = await fetch(api, {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(data),

      });

      const result = await response.json();

      if (result.success) {

        if (role === "customer") {
          setCustomerId(result.customerId);
        }

        if (role === "worker") {
          setWorkerId(result.workerId);
        }

        setSubmitted(true);
        reset();
      } else {

        setAlertState({
          open: true,
          type: "error",
          title: "Email already exists",
          description: "An account with this email is already registered. Try signing in instead, or use a different email.",
          actionLabel: "Sign in",
          onAction: () => navigate("/login"),  // add: import { useNavigate } from "react-router-dom" and const navigate = useNavigate()
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

  if (submitted) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary"><CheckCircle2 className="h-8 w-8" /></div>
          <h1 className="mt-6 text-3xl font-black">Account created</h1>
          role === "worker" ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Your account is pending admin verification.
              We'll notify you within 24 hours.
            </p>

            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm text-muted-foreground">
                Your Worker ID
              </p>

              <p className="mt-1 text-2xl font-black text-amber-600">
                {workerId}
              </p>
            </div>
          </>
          )  : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              You're all set! Log in to start booking trusted workers.
            </p>

            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">
                Your Customer ID
              </p>

              <p className="mt-1 text-2xl font-black text-primary">
                {customerId}
              </p>
            </div>
          </>
          )
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="bg-primary hover:bg-primary-dark"><Link to="/login">Go to login</Link></Button>
            <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black md:text-4xl">Create your HelpGhar account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose how you'd like to use the platform.</p>
        </div>

        <div className="mx-auto mb-8 grid max-w-md grid-cols-2 gap-2 rounded-full bg-muted p-1 text-sm font-bold">
          {(["customer", "worker"] as UserRole[]).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`rounded-full py-2.5 capitalize transition ${role === r ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
              I am a {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-10">
          <Section title="Personal information">
            <Grid>
              <F label="Full name" error={errors.fullName?.message as any}><input className="hg-input" {...register("fullName")} /></F>
              <F label="Email" error={errors.email?.message as any}><input type="email" className="hg-input" {...register("email")} /></F>
              <F label="Phone" error={errors.phone?.message as any}><input className="hg-input" placeholder="+92 300 1234567" {...register("phone")} /></F>
              <F label="Address" error={errors.address?.message as any}><input className="hg-input" {...register("address")} /></F>
            </Grid>
          </Section>

          {role === "worker" && (
            <>
              <Section title="Worker details">
                <Grid>
                  <F label="CNIC number" error={errors.cnic?.message as any}><input className="hg-input" placeholder="12345-1234567-1" {...register("cnic")} /></F>
                  <F label="Date of birth" error={errors.dob?.message as any}><input type="date" className="hg-input" {...register("dob")} /></F>
                  <F label="Gender" error={errors.gender?.message as any}>
                    <select className="hg-input" {...register("gender")}>
                      <option value="">Select</option><option>Male</option><option>Female</option>
                    </select>
                  </F>
                  <F label="Service category" error={errors.category?.message as any}>
                    <select className="hg-input" {...register("category")}>
                      <option value="">Select category</option>
                      {["House Servants", "Drivers", "Baby Sitters", "Cooks", "Home Teachers", "Watchmen", "Electricians", "Plumbers", "Cleaners"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </F>
                  <F label="Experience (years)" error={errors.experience?.message as any}><input type="number" min="0" className="hg-input" {...register("experience")} /></F>
                  <F label="Pricing (Rs.)" error={errors.pricing?.message as any}><input className="hg-input" placeholder="e.g. 15000 - 25000 / month" {...register("pricing")} /></F>
                </Grid>
                <F label="Skills & description" error={errors.skills?.message as any}>
                  <textarea rows={4} className="hg-input !h-auto py-3" {...register("skills")} />
                </F>
              </Section>

              <Section title="Documents">
                <Grid>
                  <FileUpload label="CNIC front" />
                  <FileUpload label="CNIC back" />
                  <FileUpload label="Certificates (optional)" />
                </Grid>
              </Section>
            </>
          )}

          <Section title="Security">
            <Grid>
              <F label="Password" error={errors.password?.message as any}><input type="password" className="hg-input" {...register("password")} /></F>
              <F label="Confirm password" error={errors.confirmPassword?.message as any}><input type="password" className="hg-input" {...register("confirmPassword")} /></F>
            </Grid>
          </Section>

          <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark">
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
        </form>
      </div>
      <HgAlert
        open={alertState.open}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
        actionLabel={alertState.actionLabel}
        onAction={alertState.onAction}
      />
      <style>{`.hg-input{width:100%;height:44px;border-radius:12px;border:1px solid var(--input);background:var(--card);padding:0 14px;font-size:14px;outline:none;transition:.15s;}
      .hg-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 18%,transparent);}`}</style>
    </MainLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
function FileUpload({ label }: { label: string }) {
  return (
    <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-muted/40 text-center transition hover:border-primary hover:bg-accent/30">
      <Upload className="h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-xs font-semibold">{label}</p>
      <p className="text-[10px] text-muted-foreground">PNG or JPG, up to 5MB</p>
      <input type="file" accept="image/*" className="hidden" />
    </label>
  );
}
