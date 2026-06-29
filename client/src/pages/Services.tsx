import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { categories } from "@/data/mock";
import { useGigStore } from "@/store/gigStore";

export default function ServicesPage() {
  const gigs = useGigStore((s) => s.gigs);
  const fetchGigs = useGigStore((s) => s.fetchGigs);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const allWorkers = useMemo(() => gigs, [gigs]);

  const filtered = useMemo(() => allWorkers.filter((w) => {
    if (activeCat !== "All" && w.category !== activeCat) return false;
    if (query && !`${w.fullName} ${w.category} ${w.city}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (w.rating < minRating) return false;
    if (w.priceMin > maxPrice) return false;
    if (onlyAvailable && !w.available) return false;
    return true;
  }), [query, activeCat, minRating, maxPrice, onlyAvailable, allWorkers]);

  return (
    <MainLayout>
      <section className="border-b border-border bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black md:text-4xl">Find your perfect worker</h1>
          <p className="mt-2 text-sm text-muted-foreground">Filter by category, rating, price and availability.</p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-2 shadow-soft">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, service or city"
              className="h-11 flex-1 bg-transparent text-sm outline-none" />
            {/* <button className="hidden h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold md:inline-flex">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button> */}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["All", ...categories.map(c => c.name)].map((c) => (
                <button key={c} onClick={() => setActiveCat(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeCat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Minimum rating</p>
            <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} className="mt-3 w-full accent-primary" />
            <p className="mt-1 text-xs text-muted-foreground">{minRating.toFixed(1)} stars and above</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max price</p>
            <input type="range" min={500} max={100000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-3 w-full accent-primary" />
            <p className="mt-1 text-xs text-muted-foreground">Up to Rs. {maxPrice.toLocaleString()}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
            Available now
          </label>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between text-sm">
            <p className="font-semibold">{filtered.length} workers found</p>
            <select className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs">
              <option>Sort: Top rated</option><option>Price: Low to high</option><option>Price: High to low</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-bold">No workers match these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try widening your price or rating range.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((w, i) => <WorkerCard key={w.id} worker={w} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}