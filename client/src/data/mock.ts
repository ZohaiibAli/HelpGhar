import type { WorkerCategory } from "@/types";
import {
  Home, Car, Baby, ChefHat, GraduationCap, Shield,
  Zap, Wrench, Sparkles, type LucideIcon,
} from "lucide-react";

/**
 * The nine service categories the platform supports, with the icon and
 * one-line description each is presented with. This is configuration, not
 * sample data -- the category names here must match the values stored on
 * gigs and workers, which is what makes the /services?category=... filter
 * and the landing page tiles line up.
 *
 * Everything else this file used to export -- sample bookings, transactions,
 * reviews, complaints, notifications, testimonials and a set of
 * i.pravatar.cc stock portraits -- has been removed. Every screen that
 * displayed them now reads the real records from the API, so keeping the
 * fixtures around only invited them to be wired back in.
 */

export interface CategoryDef {
  name: WorkerCategory;
  icon: LucideIcon;
  description: string;
}

export const categories: CategoryDef[] = [
  { name: "House Servants", icon: Home, description: "Daily household help" },
  { name: "Drivers", icon: Car, description: "Licensed personal drivers" },
  { name: "Baby Sitters", icon: Baby, description: "Caring & trained nannies" },
  { name: "Cooks", icon: ChefHat, description: "Desi & continental cooks" },
  { name: "Home Teachers", icon: GraduationCap, description: "Tutors for all grades" },
  { name: "Watchmen", icon: Shield, description: "Trusted security staff" },
  { name: "Electricians", icon: Zap, description: "On-demand electricians" },
  { name: "Plumbers", icon: Wrench, description: "Quick plumbing fixes" },
  { name: "Cleaners", icon: Sparkles, description: "Deep cleaning experts" },
];
