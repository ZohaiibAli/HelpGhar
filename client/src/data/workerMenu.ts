import {
  LayoutDashboard,
  Star,
  User,
  Settings,
} from "lucide-react";

export const workerItems = [
  {
    label: "Overview",
    to: "/dashboard/worker",
    icon: LayoutDashboard,
  },
  {
    label: "Reviews",
    to: "/worker/reviews",
    icon: Star,
  },
  {
    label: "Profile",
    to: "/worker/profile",
    icon: User,
  },
  {
    label: "Settings",
    to: "/worker/settings",
    icon: Settings,
  },
];