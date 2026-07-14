import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Star,
  ShieldCheck,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle2,
  Award,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useGigStore } from "@/store/gigStore";
import { useAuthStore } from "@/store/authStore";
import { HgAlert } from "@/components/ui/HgAlert";
import { handleHireNowClick } from "@/lib/hireNow";
import AIInsightsCard from "@/components/ai/AIInsightsCard";


export default function WorkerDetailsPage() {

  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [showWorkerAlert, setShowWorkerAlert] = useState(false);

  const [details, setDetails] = useState({
    about: "",
    skills: "",
    certifications: "",
  });
  const [reviews, setReviews] = useState<any[]>([]);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const { id } = useParams<{ id: string }>();

  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const worker = gigs.find((w) => w.id === id);

  useEffect(() => {
    if (!worker?.workerId) return;

    const fetchDetails = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/worker/details/public/${worker.workerId}`
        );

        if (!response.ok) return;

        const data = await response.json();
        setDetails(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDetails();
  }, [worker?.workerId]);

  useEffect(() => {
    if (!worker?.workerId) return;

    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/reviews/worker/${worker.workerId}`
        );

        if (!response.ok) return;

        const data = await response.json();

        setReviews(data.reviews || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchReviews();
  }, [worker?.workerId]);

  if (gigs.length === 0) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          Loading...
        </div>
      </MainLayout>
    );
  }

  if (!worker) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Worker not found</h1>
          <Button
            asChild
            className="mt-6 bg-primary hover:bg-primary-dark"
          >
            <Link to="/services">Browse workers</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="h-40 bg-gradient-to-br from-primary/30 to-primary-soft" />
              <div className="-mt-16 grid gap-4 p-6 sm:flex sm:items-end">
                <img src={worker.avatar} alt={worker.fullName} className="h-28 w-28 shrink-0 rounded-2xl border-4 border-card object-cover shadow-card" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black">{worker.fullName}</h1>
                    {worker.cnicVerified && <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary-dark"><ShieldCheck className="h-3 w-3" /> CNIC Verified</span>}
                    {worker.badges.map(b => <span key={b} className="rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-bold text-background">{b}</span>)}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{worker.category} • {worker.city}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> <strong className="text-foreground"> {averageRating.toFixed(1)}</strong>{" "}({reviews.length} reviews) </span>
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {worker.experienceYears} years experience</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {worker.city}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Since {new Date(worker.memberSince).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>

            {
              worker.marketplaceScore && (

                <AIInsightsCard

                  worker={worker}

                />

              )
            }

            <Section title="About">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {details.about || "This worker hasn't added a description yet."}
              </p>
            </Section>

            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {details.skills
                  ? details.skills.split("\n").filter(Boolean).map((s) => (
                    <span key={s} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                      {s}
                    </span>
                  ))
                  : <p className="text-sm text-muted-foreground">No skills listed yet.</p>}
              </div>
            </Section>

            <Section title="Certifications">
              <ul className="space-y-2">
                {details.certifications
                  ? details.certifications.split("\n").filter(Boolean).map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" /> {c}
                    </li>
                  ))
                  : <p className="text-sm text-muted-foreground">No certifications listed yet.</p>}
              </ul>
            </Section>

            <Section title={`Reviews (${reviews.length})`}>
              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
                {reviews.map(r => (
                  <div key={r._id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{r.customerName}</p>

                      <span

                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold

${r.sentiment === "Positive"

                            ? "bg-emerald-100 text-emerald-700"

                            : r.sentiment === "Neutral"

                              ? "bg-yellow-100 text-yellow-700"

                              : "bg-red-100 text-red-700"

                          }`}

                      >

                        {r.sentiment}

                      </span>
                      <div className="flex items-center gap-0.5 text-yellow-400">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pricing</p>
              <p className="mt-1 text-2xl font-black">Rs. {worker.priceMin.toLocaleString()} – {worker.priceMax.toLocaleString()}<span className="text-sm font-medium text-muted-foreground">/{worker.priceUnit}</span></p>
              {worker.available ? (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-dark"><CheckCircle2 className="h-3.5 w-3.5" /> Available now</p>
              ) : (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Currently busy</p>
              )}
              <Button
                className="mt-5 h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark"
                onClick={() =>
                  handleHireNowClick({
                    user,
                    token,
                    navigate,
                    workerId: worker.id,
                    onWorkerTriesToHire: () => setShowWorkerAlert(true),
                  })
                }
              >
                Hire now
              </Button>
              <Button asChild variant="outline" className="mt-2 h-12 w-full rounded-xl text-base font-bold">
                <Link to="/services">Back to results</Link>
              </Button>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                <Stat n={reviews.length} l="Reviews" />
                <Stat n={worker.experienceYears + "y"} l="Exp" />
                <Stat n={averageRating.toFixed(1)} l="Rating" />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <HgAlert
        open={showWorkerAlert}
        onClose={() => setShowWorkerAlert(false)}
        type="warning"
        title="Wrong account type"
        description="Please log in from a customer profile to hire a worker."
        cancelLabel="Got it"
      />
    </MainLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
function Stat({ n, l }: { n: React.ReactNode; l: string }) {
  return <div className="rounded-xl bg-muted py-2"><p className="text-base font-black">{n}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>;
}
