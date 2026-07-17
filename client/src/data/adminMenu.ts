import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquareWarning,
  Star,
  Settings,
} from "lucide-react";

export const adminItems = [
  { label: "Profile", to: "/dashboard/admin/profile", icon: Users },
  { label: "Dashboard", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", to: "/dashboard/admin/users", icon: Users },
  { label: "Bookings", to: "/dashboard/admin/bookings", icon: Calendar },
  { label: "Complaints", to: "/dashboard/admin/complaints", icon: MessageSquareWarning },
  { label: "Reviews", to: "/dashboard/admin/reviews", icon: Star },
  { label: "Settings", to: "/dashboard/admin/settings", icon: Settings },
];