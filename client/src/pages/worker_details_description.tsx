import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";

interface WorkerDetails {
  about: string;
  skills: string;
  certifications: string;
}

export default function WorkerDetailsDescriptionPage() {
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const navigate = useNavigate();
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

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
        try {
          const { data } = await api.get("/worker/details");

          setAbout(data.about ?? "");
          setSkills(data.skills ?? "");
          setCertifications(data.certifications ?? "");
          setLoaded(true);
        } catch (error) {
          console.error(error);
          setLoaded(true);
        }
      };

    const handleSave = async () => {
      setSaving(true);

      try {
        const { data: result } = await api.put("/worker/details", {
          about,
          skills,
          certifications,
        });

        setAlertState({
          open: true,
          type: "success",
          title: "Details Updated",
          description: result.message,
        });
      } catch (error: any) {
        console.log(error);
        setAlertState({
          open: true,
          type: "error",
          title: "Update Failed",
          description: error?.message || "Unable to update details.",
        });
      } finally {
        setSaving(false);
      }
    };

  if (!loaded) {
    return (
      <DashboardLayout title="Worker" items={workerItems}>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-lg font-semibold">Loading your details...</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Worker" items={workerItems}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Details</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell customers more about yourself, your skills, and your qualifications.
        </p>

        <div className="mt-8 space-y-6">
          <Card title="About">
            <textarea
              rows={5}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="A short introduction about yourself, your work ethic, and your experience..."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Card>

          <Card title="Skills">
            <textarea
              rows={4}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="List your key skills, e.g. Deep cleaning, laundry management, cooking (continental & desi)..."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Card>

          <Card title="Certifications">
            <textarea
              rows={4}
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="List any certifications, training, or courses you've completed..."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary-dark"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
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
      {children}
    </div>
  );
}