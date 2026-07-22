import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { HgAlert } from "@/components/ui/HgAlert";
import ChangePasswordSection from "@/components/workers/ChangePasswordSection";

export default function WorkerSettingsPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handleDeleteAccount = async () => {
    setConfirmOpen(true); // just open the confirm dialog, no window.confirm
  };

  const confirmDelete = async () => {
    setConfirmOpen(false);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/worker/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("worker");
        navigate("/login");
      } else {
        setErrorOpen(true);
      }
    } catch (error) {
      console.log(error);
      setErrorOpen(true);
    }
  };

  return (
    <DashboardLayout
      title="Worker"
      items={workerItems}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage security of your account.</p>

        <div className="mt-8">
          <Card title="Security">
            <div className="space-y-6">

              {/* Change Password */}

              <div>
                <h3 className="font-semibold">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your account password to keep your account secure.
                </p>

                <ChangePasswordSection />
              </div>

              <hr />

              {/* Delete Account */}

              <div>
                <h3 className="font-semibold text-destructive">
                  Delete Account
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your HelpGhar account.
                </p>

                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  Delete My Account
                </Button>

              </div>

            </div>
          </Card>
        </div>
      </div>
      {/* Confirm delete dialog */}
      <HgAlert
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        type="warning"
        title="Delete your account?"
        description="This action is permanent and cannot be undone. All your data will be removed."
        actionLabel="Yes, delete my account"
        onAction={confirmDelete}
        cancelLabel="Cancel"
      />

      {/* Error dialog */}
      <HgAlert
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        type="server"
        title="Something went wrong"
        description="We couldn't delete your account. Please try again or contact support."
      />
    </DashboardLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}