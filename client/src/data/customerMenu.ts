// this is customerMenu.ts

import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Star,
  MessageSquareWarning,
  User,
  Settings,
} from "lucide-react";

export const customerItems = [
  { label: "Overview", to: "/dashboard/customer", icon: LayoutDashboard },
  { label: "My Bookings", to: "/my-bookings", icon: Calendar },
  { label: "Transactions", to: "/transactions", icon: CreditCard },
  { label: "Reviews", to: "/reviews", icon: Star },
  { label: "Disputes", to: "/disputes", icon: MessageSquareWarning },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];