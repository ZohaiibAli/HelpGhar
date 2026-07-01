import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { HgAlert } from "@/components/ui/HgAlert";

interface WorkerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  cnic: string;
  dob: string;
  gender: string;
  category: string;
  experience: string;
  pricing: string;
  skills: string;
}

export default function WorkerProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [pricing, setPricing] = useState("");
  const [skills, setSkills] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingCredentials, setSavingCredentials] = useState(false);

  const [user, setUser] = useState<WorkerProfile | null>(null);
  const [saving, setSaving] = useState(false);
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
    setAlertState((s) => ({ ...s, open: false }));
  const navigate = useNavigate();
  const { token, setSession } = useAuthStore();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      const authToken = localStorage.getItem("token");

      if (!token) {
        navigate("/login/worker");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/worker/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          console.log("Status:", response.status);
          console.log("Response:", await response.text());
          return;
        }

        const data = await response.json();

        setUser(data);
        setFullName(data.fullName);
        setPhone(data.phone);
        setAddress(data.address);
        setCnic(data.cnic);
        setDob(data.dob);
        setGender(data.gender);
        setCategory(data.category);
        setExperience(data.experience);
        setPricing(data.pricing);
        setSkills(data.skills);
        setEmail(data.email);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login/worker");
      return;
    }

    setSaving(true);

    try {

      const response = await fetch(
        `${API_BASE_URL}/worker/profile`,
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
            cnic,
            dob,
            gender,
            category,
            experience,
            pricing,
            skills,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login/worker");
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
            role: "worker",
            createdAt: new Date().toISOString(),
          },
          token
        );

        setUser({
          ...user!,
          fullName,
          email,
          phone,
          address,
          cnic,
          dob,
          gender,
          category,
          experience,
          pricing,
          skills,
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

  const handlePasswordUpdate = async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login/worker");
      return;
    }

    if (!currentPassword || !newPassword) {

      setAlertState({
        open: true,
        type: "error",
        title: "Missing fields",
        description: "Please enter both your current and new password.",
      });

      return;

    }

    setSavingCredentials(true);

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
          title: "Incorrect password",
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
        description: "Unable to update password.",
      });

    } finally {

      setSavingCredentials(false);

    }

  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-lg font-semibold">Loading your profile...</h2>
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
              <div className="grid h-full w-full place-items-center text-3xl font-black text-primary-dark">
                {user?.fullName?.charAt(0) ?? "U"}
              </div>

              <button className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-lg font-bold">
              {user?.fullName ?? "Guest user"}
            </p>

            <p className="text-xs text-muted-foreground capitalize">
              Worker
            </p>
          </div>

          <div className="space-y-6">
            <Card title="Personal information">
              <Grid>
                <F label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <F label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <F label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <F label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Grid>
            </Card>

            <Card title="Worker details">
              <Grid>
                <F
                  label="CNIC number"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="12345-1234567-1"
                />

                <F
                  label="Date of birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                <SelectF
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={["Male", "Female"]}
                />

                <SelectF
                  label="Service category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    "House Servants",
                    "Drivers",
                    "Baby Sitters",
                    "Cooks",
                    "Home Teachers",
                    "Watchmen",
                    "Electricians",
                    "Plumbers",
                    "Cleaners",
                  ]}
                />

                <F
                  label="Experience (years)"
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />

                <F
                  label="Pricing (Rs.)"
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                  placeholder="e.g. 15000 - 25000 / month"
                />
              </Grid>

              <TextAreaF
                label="Skills & description"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </Card>

            <Card title="Change password">
              <Grid>
                <F
                  label="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <F
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </Grid>

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={savingCredentials}
                  className="bg-primary hover:bg-primary-dark"
                >
                  {savingCredentials ? "Saving..." : "Change Password"}
                </Button>
              </div>
            </Card>

            <Card title="Documents">
              <Grid>
                <FileUpload label="CNIC front" />
                <FileUpload label="CNIC back" />
                <FileUpload label="Certificates (optional)" />
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
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">{title}</h3>
      <div className="space-y-4">{children}</div>
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
  onChange,
  placeholder = "",
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function SelectF({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function TextAreaF({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
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
