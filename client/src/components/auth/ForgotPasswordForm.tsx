import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";


interface ForgotPasswordFormProps {
  apiEndpoint: string;
  loginPath: string;
  linkColor: string;
  buttonClass: string;
}

export default function ForgotPasswordForm({
  apiEndpoint,
  loginPath,
  linkColor,
  buttonClass,
}: ForgotPasswordFormProps) {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  return (
   
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"><CheckCircle2 className="h-7 w-7" /></div>
              <h1 className="mt-4 text-2xl font-black">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">We've sent a password reset link if the account exists.</p>
              <Button asChild className={`mt-6 h-12 w-full rounded-xl text-base font-bold ${buttonClass}`}><Link to={loginPath}>Back to login</Link></Button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                setLoading(true);

                try {

                  const response = await fetch(`${API_BASE_URL}${apiEndpoint}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email,
                      }),
                    }
                  );

                  const result = await response.json();

                  if (result.success) {
                    setSent(true);
                  }

                } catch (error) {
                  console.error(error);
                  alert("Something went wrong.");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <h1 className="text-2xl font-black">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <Button
                type="submit"
                disabled={loading}
                className={`h-12 w-full rounded-xl text-base font-bold ${buttonClass}`}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Remembered it? <Link
                to={loginPath}
                className={`font-semibold ${linkColor} hover:underline`}
              >Log in</Link></p>
            </form>
          )}
        </div>
      </div>
    
  );
}