import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <MainLayout>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"><CheckCircle2 className="h-7 w-7" /></div>
              <h1 className="mt-4 text-2xl font-black">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">We've sent a password reset link if the account exists.</p>
              <Button asChild className="mt-6 bg-primary hover:bg-primary-dark"><Link to="/login">Back to login</Link></Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
              className="space-y-4"
            >
              <h1 className="text-2xl font-black">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              <input required type="email" placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark">Send reset link</Button>
              <p className="text-center text-xs text-muted-foreground">Remembered it? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link></p>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
