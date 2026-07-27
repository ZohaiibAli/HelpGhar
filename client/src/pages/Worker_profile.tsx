import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera, Eye, Pencil, X } from "lucide-react";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  profileImage?: string;
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

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);

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

  const handleEditToggle = () => {
    if (isEditing) {
      // Restore original values
      setFullName(user?.fullName || "");
      setEmail(user?.email || "");
      setPhone(user?.phone || "");
      setAddress(user?.address || "");
      setCnic(user?.cnic || "");
      setDob(user?.dob || "");
      setGender(user?.gender || "");
      setCategory(user?.category || "");
      setExperience(user?.experience || "");
      setPricing(user?.pricing || "");
      setSkills(user?.skills || "");
    }

    setIsEditing(!isEditing);
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.put(
        "/worker/profile-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                profileImage: data.profileImage,
              }
            : prev
        );

        setAlertState({
          open: true,
          type: "success",
          title: "Profile Updated",
          description: data.message,
        });
      }
    } catch (error) {
      console.log(error);

      setAlertState({
        open: true,
        type: "server",
        title: "Upload Failed",
        description: "Unable to upload profile image.",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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

      if (result.success) {
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

        (document.activeElement as HTMLElement)?.blur();
        setIsEditing(false);

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
    } catch (error: any) {
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
            <div
              className="group relative mx-auto h-28 w-28 overflow-hidden rounded-full cursor-pointer"
              onClick={() => setPhotoOptionsOpen(true)}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.fullName}
                  className="h-full w-full cursor-pointer object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-primary-soft text-3xl font-black text-primary-dark">
                  {user?.fullName?.charAt(0) ?? "U"}
                </div>
              )}

              {/* Uploading Overlay */}
              {uploadingImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  <span className="mt-2 text-xs font-medium">
                    Uploading...
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/30 opacity-0 transition duration-300 group-hover:opacity-100" />
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleProfileImageUpload}
              />
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
            <Card
              title="Personal information"
              editing={isEditing}
              onEditToggle={handleEditToggle}
            >
              <Grid>
                <F
                  label="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                />
                <F
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
                <F
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                />
                <F
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
            </Card>

            <Card title="Worker details">
              <Grid>
                <F
                  label="CNIC number"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="12345-1234567-1"
                  disabled={!isEditing}
                />

                <F
                  label="Date of birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={!isEditing}
                />

                <SelectF
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={["Male", "Female"]}
                  disabled={!isEditing}
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
                  disabled={!isEditing}
                />

                <F
                  label="Experience (years)"
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={!isEditing}
                />

                <F
                  label="Pricing (Rs.)"
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                  placeholder="e.g. 15000 - 25000 / month"
                  disabled={!isEditing}
                />
              </Grid>

              <TextAreaF
                label="Skills & description"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                disabled={!isEditing}
              />
            </Card>

            {isEditing && (
              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="bg-primary hover:bg-primary-dark"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={photoOptionsOpen}
        onOpenChange={setPhotoOptionsOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <h2 className="text-lg font-semibold text-center">
            Profile Picture
          </h2>

          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setPhotoOptionsOpen(false);

                if (user?.profileImage) {
                  setPreviewOpen(true);
                } else {
                  setAlertState({
                    open: true,
                    type: "error",
                    title: "No Profile Picture",
                    description: "Please upload a profile picture first.",
                  });
                }
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Photo
            </Button>

            <Button
              className="w-full justify-start"
              onClick={() => {
                setPhotoOptionsOpen(false);
                fileInputRef.current?.click();
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Upload / Update Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md border-none bg-transparent shadow-none">
          {user?.profileImage && (
            <img
              src={user.profileImage}
              alt={user.fullName}
              className="w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

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

function Card({
  title,
  children,
  editing,
  onEditToggle,
}: {
  title: string;
  children: React.ReactNode;
  editing?: boolean;
  onEditToggle?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {title}
        </h3>

        {onEditToggle && (
          <button
            onClick={onEditToggle}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition"
          >
            {editing ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Edit
              </>
            )}
          </button>
        )}
      </div>

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
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition
${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      />
    </div>
  );
}

function SelectF({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition
${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border px-3 py-3 text-sm outline-none transition
${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      />
    </div>
  );
}