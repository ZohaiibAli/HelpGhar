import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";

interface WorkerProfile {
  id: string;
  workerId: string;
  status: string;
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
      if (!token) {
        navigate("/login/worker");
        return;
      }

      try {
        const { data } = await api.get("/worker/profile");

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
    setSaving(true);

    try {
      const { data: result } = await api.put("/worker/profile", {
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

      setSession(
        {
          id: user!.id,
          workerId: user!.workerId,
          status: user!.status,
          fullName,
          email,
          phone,
          address,
          role: "worker",
          createdAt: new Date().toISOString(),
        },
        token!
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
    } catch (error: any) {
      console.log(error);

      setAlertState({
        open: true,
        type: "error",
        title: "Update Failed",
        description: error?.message || "Unable to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout title="Worker" items={workerItems}>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-lg font-semibold">Loading your profile...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your details.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Worker" items={workerItems}>
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
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Worker ID
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {user.workerId}
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Status
              </p>

              <p className="mt-1 font-semibold text-green-600">
                {user.status}
              </p>
            </div>
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
    </DashboardLayout>
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