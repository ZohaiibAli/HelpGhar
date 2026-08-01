import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";

const schema = z
    .object({
        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),

        confirmPassword: z
            .string()
            .min(6, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type FormValues = z.infer<typeof schema>;

interface ResetPasswordFormProps {
    apiEndpoint: string;
    loginPath: string;
    buttonClass: string;
    linkColor: string;
}

export default function ResetPasswordForm({
    apiEndpoint,
    loginPath,
    buttonClass,
    linkColor,
}: ResetPasswordFormProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const token = new URLSearchParams(location.search).get("token");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [alertState, setAlertState] = useState({
        open: false,
        type: "error" as "error" | "server" | "success",
        title: "",
        description: "",
    });

    const closeAlert = () =>
        setAlertState((prev) => ({ ...prev, open: false }));

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {
        if (!token) {
            setAlertState({
                open: true,
                type: "error",
                title: "Invalid Link",
                description: "Reset link is invalid.",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}${apiEndpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        password: data.password,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                setAlertState({
                    open: true,
                    type: "success",
                    title: "Password Updated",
                    description:
                        "Your password has been changed successfully.",
                });

                setTimeout(() => {
                    navigate(loginPath);
                }, 2000);
            } else {
                setAlertState({
                    open: true,
                    type: "error",
                    title: "Reset Failed",
                    description: result.message,
                });
            }
        } catch {
            setAlertState({
                open: true,
                type: "server",
                title: "Server Error",
                description: "Please try again later.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="mx-auto max-w-md px-4 py-20">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
                    <h1 className="text-2xl font-black">Reset Password</h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your new password.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">

                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    className="hg-input pr-10"
                                    {...register("password")}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    className="hg-input pr-10"
                                    {...register("confirmPassword")}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className={`h-12 w-full rounded-xl text-base font-bold ${buttonClass}`}
                        >
                            {loading ? "Updating..." : "Reset Password"}
                        </Button>

                        <p className="text-center text-sm">
                            <Link
                                to={loginPath}
                                className={`${linkColor} hover:underline`}
                            >
                                Back to Login
                            </Link>
                        </p>
                    </form>
                </div>

                <HgAlert
                    open={alertState.open}
                    onClose={closeAlert}
                    type={alertState.type}
                    title={alertState.title}
                    description={alertState.description}
                />
            </div>

            <style>{`
        .hg-input{
          width:100%;
          height:48px;
          border-radius:12px;
          border:1px solid var(--input);
          background:var(--card);
          padding:0 14px;
          font-size:14px;
          outline:none;
        }

        .hg-input:focus{
          border-color:var(--primary);
          box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 18%,transparent);
        }
      `}</style>
        </>
    );
}