// admin_profile.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera, Pencil, X, Eye } from "lucide-react";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";
import { useRef } from "react";



import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
}

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [user, setUser] = useState<AdminProfile | null>(null);

  const navigate = useNavigate();
  const { setSession, token } = useAuthStore();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

    const authToken = localStorage.getItem("token");
    if (!authToken) {
      navigate("/login/admin");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login/admin");
        return;
      }

      if (result.success) {
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
          description: result.message,
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

  useEffect(() => {
    const fetchProfile = async () => {
      const authToken = localStorage.getItem("token");

      if (!authToken) {
        navigate("/login/admin");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/admin/profile`, {
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
        "/admin/profile-image",
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

    } catch {

      setAlertState({
        open: true,
        type: "server",
        title: "Upload Failed",
        description: "Unable to upload image.",
      });

    } finally {

      setUploadingImage(false);

      if (fileInputRef.current) {

        fileInputRef.current.value = "";

      }

    }

  };

  const handleUpdate = async () => {
    const authToken = localStorage.getItem("token");

    if (!authToken) {
      navigate("/login/admin");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login/admin");
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
            role: "admin",
            createdAt: new Date().toISOString(),
          },
          authToken
        );

        setUser({
          ...user!,
          fullName,
          phone,
          address,
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
      <DashboardLayout title="Admin" items={adminItems}>
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
    <DashboardLayout title="Admin" items={adminItems}>
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
                  onClick={() => setPreviewOpen(true)}
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
            <p className="text-xs text-muted-foreground capitalize">Admin</p>
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
              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
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
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-primary hover:bg-primary-dark"
                >
                  {changingPassword ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </Card>

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
      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      >
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

      {children}
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
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: any) => void;
  disabled?: boolean;
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
        disabled={disabled}
        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition
          ${disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
      />
    </div>
  );
}