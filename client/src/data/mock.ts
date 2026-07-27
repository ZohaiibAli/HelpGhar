import type {
  Worker, Booking, Transaction, Review, Complaint,
  NotificationItem, WorkerCategory,
} from "@/types";
import {
  Home, Car, Baby, ChefHat, GraduationCap, Shield,
  Zap, Wrench, Sparkles, type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  name: WorkerCategory;
  icon: LucideIcon;
  workersCount: number;
  description: string;
}

export const categories: CategoryDef[] = [
  { name: "House Servants", icon: Home, workersCount: 1240, description: "Daily household help" },
  { name: "Drivers", icon: Car, workersCount: 860, description: "Licensed personal drivers" },
  { name: "Baby Sitters", icon: Baby, workersCount: 420, description: "Caring & trained nannies" },
  { name: "Cooks", icon: ChefHat, workersCount: 530, description: "Desi & continental cooks" },
  { name: "Home Teachers", icon: GraduationCap, workersCount: 380, description: "Tutors for all grades" },
  { name: "Watchmen", icon: Shield, workersCount: 290, description: "Trusted security staff" },
  { name: "Electricians", icon: Zap, workersCount: 610, description: "On-demand electricians" },
  { name: "Plumbers", icon: Wrench, workersCount: 470, description: "Quick plumbing fixes" },
  { name: "Cleaners", icon: Sparkles, workersCount: 720, description: "Deep cleaning experts" },
];

const avatars = [
  "https://i.pravatar.cc/300?img=12",
  "https://i.pravatar.cc/300?img=22",
  "https://i.pravatar.cc/300?img=33",
  "https://i.pravatar.cc/300?img=47",
  "https://i.pravatar.cc/300?img=51",
  "https://i.pravatar.cc/300?img=59",
  "https://i.pravatar.cc/300?img=64",
  "https://i.pravatar.cc/300?img=68",
];

export const bookings: Booking[] = [
  {
    id: "b1001",
    bookingId: "BK00001",
    workerId: "w1",
    workerName: "Ayesha Khan",
    workerAvatar: avatars[0],
    category: "House Servants",
    date: "2025-11-22",
    timeSlot: "09:00 - 13:00",
    duration: 4,
    amount: 4800,
    fee: 200,
    total: 5000,
    status: "confirmed",
    address: "DHA Phase 5, Lahore",
    customerId: "c1",
    createdAt: "2025-11-20",
  },
  {
    id: "b1002",
    bookingId: "BK00002",
    workerId: "w6",
    workerName: "Rashid Mehmood",
    workerAvatar: avatars[5],
    category: "Electricians",
    date: "2025-11-15",
    timeSlot: "11:00 - 12:30",
    duration: 1.5,
    amount: 2200,
    fee: 100,
    total: 2300,
    status: "completed",
    address: "F-7 Markaz, Islamabad",
    customerId: "c2",
    createdAt: "2025-11-12",
  },
  {
    id: "b1003",
    bookingId: "BK00003",
    workerId: "w3",
    workerName: "Fatima Noor",
    workerAvatar: avatars[2],
    category: "Baby Sitters",
    date: "2025-10-28",
    timeSlot: "18:00 - 22:00",
    duration: 4,
    amount: 4000,
    fee: 200,
    total: 4200,
    status: "cancelled",
    address: "Bahria Town, Rawalpindi",
    customerId: "c3",
    createdAt: "2025-10-26",
  },
];

export const transactions: Transaction[] = [
  { id: "TXN-90021", bookingId: "b1001", date: "2025-11-20", method: "Card", amount: 5000, status: "successful" },
  { id: "TXN-90014", bookingId: "b1002", date: "2025-11-12", method: "Wallet", amount: 2300, status: "successful" },
  { id: "TXN-90009", bookingId: "b1003", date: "2025-10-26", method: "Card", amount: 4200, status: "refunded" },
  { id: "TXN-90030", bookingId: "b1004", date: "2025-11-24", method: "Bank", amount: 6500, status: "pending" },
];

export const reviews: Review[] = [
  { id: "r1", workerId: "w1", customerName: "Hassan Iqbal", rating: 5, date: "2025-11-10", comment: "Ayesha is incredibly professional and trustworthy. The house has never been cleaner." },
  { id: "r2", workerId: "w1", customerName: "Mariam Saeed", rating: 5, date: "2025-10-22", comment: "Best decision we made. Highly recommended." },
  { id: "r3", workerId: "w2", customerName: "Omar Sheikh", rating: 4, date: "2025-11-05", comment: "Always on time and drives safely. Knows every shortcut in Karachi." },
];

export const complaints: Complaint[] = [
  {
    id: "C-201",
    customerName: "Hassan Iqbal",
    workerName: "Imran Yousaf",
    subject: "Late arrival",
    description: "Worker showed up two hours after the scheduled time.",
    status: "in_review",
    date: "2025-11-18",
    createdAt: "2025-11-18",
  },
  {
    id: "C-202",
    customerName: "Mariam Saeed",
    workerName: "Adeel Raza",
    subject: "Incomplete work",
    description: "Plumbing leak reappeared the next day.",
    status: "open",
    date: "2025-11-21",
    createdAt: "2025-11-21",
  },
];

export const notifications: NotificationItem[] = [
  { id: "n1", type: "success", title: "Booking confirmed", message: "Your booking with Ayesha Khan is confirmed for Nov 22.", date: "2025-11-20", read: false },
  { id: "n2", type: "info", title: "New review received", message: "Hassan Iqbal left you a 5-star review.", date: "2025-11-11", read: false },
  { id: "n3", type: "warning", title: "Verification pending", message: "Please re-upload your CNIC back image.", date: "2025-11-09", read: true },
];

export const testimonials = [
  { name: "Sara Malik", role: "Customer, Karachi", quote: "HelpGhar made finding a trusted maid effortless. Verified profiles gave us total peace of mind.", avatar: avatars[2] },
  { name: "Bilal Ahmed", role: "Driver, Karachi", quote: "I get steady work and on-time payments. The platform truly respects workers.", avatar: avatars[1] },
  { name: "Zara Hussain", role: "Customer, Karachi", quote: "Booked an electrician in 5 minutes. Fixed the issue and the price was exactly as quoted.", avatar: avatars[7] },
];