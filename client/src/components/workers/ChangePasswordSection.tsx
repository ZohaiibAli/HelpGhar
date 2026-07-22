import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";

export default function ChangePasswordSection() {
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "success" | "error" | "server";
    title: string;
    description: string;
  }>({
    open: false,
    type: "success",
    title: "",
    description: "",
  });

  const closeAlert = () =>
    setAlertState((s) => ({
      ...s,
      open: false,
    }));

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setAlertState({
        open: true,
        type: "error",
        title: "Missing Fields",
        description: "Please fill in both password fields.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setAlertState({
        open: true,
        type: "error",
        title: "Weak Password",
        description: "New password must be at least 6 characters.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setAlertState({
        open: true,
        type: "error",
        title: "Invalid Password",
        description:
          "New password must be different from your current password.",
      });
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login/worker");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/worker/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        setAlertState({
          open: true,
          type: "error",
          title: "Incorrect Password",
          description: result.detail || "Current password is incorrect.",
        });
        return;
      }

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");

        setAlertState({
          open: true,
          type: "success",
          title: "Password Updated",
          description: result.message,
        });
      } else {
        setAlertState({
          open: true,
          type: "error",
          title: "Password Change Failed",
          description: result.detail || result.message,
        });
      }
    } catch {
      setAlertState({
        open: true,
        type: "server",
        title: "Server Error",
        description: "Unable to change password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <Field
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleChangePassword}
          disabled={changingPassword}
          className="bg-primary hover:bg-primary-dark"
        >
          {changingPassword ? "Updating..." : "Change Password"}
        </Button>
      </div>

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />
    </>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}