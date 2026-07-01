import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { HgAlert } from "@/components/ui/HgAlert";

interface CustomerProfile {

  id: string;

  fullName: string;

  email: string;

  phone: string;

  address: string;

}

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
  const [saving, setSaving] = useState(false);
  // const { user } = useAuthStore();
  const navigate = useNavigate();
  const { setSession, token } = useAuthStore();
  const [user, setUser] = useState<CustomerProfile | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {

    const fetchProfile = async () => {

      const authToken = localStorage.getItem("token");

      console.log(token);

      if (!token) {

        navigate("/login/customer");

        return;

      }

      try {

        const response = await fetch(
          `${API_BASE_URL}/customer/profile`,
          {

            method: "GET",

            headers: {

              Authorization: `Bearer ${authToken}`,

            }

          }
        );

        if (!response.ok) {

          // localStorage.removeItem("token");

          // navigate("/customer-login");

          // console.log(await response.text());
          if (!response.ok) {

            console.log("Status:", response.status);
            console.log("Response:", await response.text());

            return;

          }

          return;

        }

        const data = await response.json();

        setUser(data);
        setFullName(data.fullName);

        setPhone(data.phone);

        setAddress(data.address);
        setEmail(data.email);

      }

      catch (error) {

        console.error(error);
      }

    };

    fetchProfile();

  }, []);
  const handleUpdate = async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/customer-login");
      return;
    }

    setSaving(true);

    try {

      const response = await fetch(
        `${API_BASE_URL}/customer/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            address,
          }),
        }
      );

      const result = await response.json();
      if (response.status === 401) {

        localStorage.removeItem("token");

        navigate("/customer-login");

        return;

      }

      if (response.ok) {

        setSession(
          {
            id: user!.id,
            fullName,
            email,
            phone,
            address,
            role: "customer",
            createdAt: new Date().toISOString(),
          },
          token!
        );

        setUser({
          ...user!,
          fullName,
          phone,
          address,
        });

        setAlertState({
          open: true,
          type: "success",
          title: "Profile Updated",
          description: result.message,
        });

      } else {

        setAlertState({
          open: true,
          type: "error",
          title: "Update Failed",
          description: result.detail || result.message,
        });

      }

    } catch (error) {

      console.log(error);

      setAlertState({
        open: true,
        type: "server",
        title: "Server Error",
        description: "Unable to update profile.",
      });

    } finally {

      setSaving(false);

    }

  };
  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>

          <h2 className="text-lg font-semibold">
            Loading your profile...
          </h2>

          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your details.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Profile</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-primary-soft">
              <div className="grid h-full w-full place-items-center text-3xl font-black text-primary-dark">{user?.fullName?.charAt(0) ?? "U"}</div>
              <button className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"><Camera className="h-4 w-4" /></button>
            </div>
            <p className="mt-4 text-lg font-bold">{user?.fullName ?? "Guest user"}</p>
            <p className="text-xs text-muted-foreground capitalize">
              Customer
            </p>
          </div>

          <div className="space-y-6">
            <Card title="Personal information">
              <Grid>
                <F

                  label="Full name"

                  value={fullName}

                  onChange={(e) => setFullName(e.target.value)}

                />
                <F

                  label="Email"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                />
                <F

                  label="Phone"

                  value={phone}

                  onChange={(e) => setPhone(e.target.value)}

                />
                <F

                  label="Address"

                  value={address}

                  onChange={(e) => setAddress(e.target.value)}

                />
              </Grid>
            </Card>
            <Card title="Change password">
              <Grid>
                <F
                  label="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <F
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Grid>
            </Card>
            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button
                onClick={handleUpdate}
                disabled={saving}
                className="bg-primary hover:bg-primary-dark"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />
    </MainLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">{title}</h3>{children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
function F({

  label,

  type = "text",

  value,

  onChange

}: {

  label: string;

  type?: string;

  value: string;

  onChange: (e: any) => void;

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

  )

}
