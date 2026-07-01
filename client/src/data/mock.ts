// this is mock.ts

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

// export const workers: Worker[] = [
//   {
//     id: "w1", fullName: "Ayesha Khan", avatar: avatars[0], category: "House Servants",
//     city: "Lahore", age: 32, gender: "Female", experienceYears: 8,
//     memberSince: "2022-03-14", rating: 4.9, reviewsCount: 184,
//     priceMin: 15000, priceMax: 25000, priceUnit: "month", available: true,
//     cnicVerified: true, badges: ["Top Rated", "Most Trusted"],
//     bio: "Hardworking and reliable with 8 years of experience in elite households across Lahore.",
//     skills: ["Cleaning", "Laundry", "Cooking basics", "Childcare assistance"],
//     certificates: ["Hygiene Training 2023", "First Aid Basic"],
//   },
//   {
//     id: "w2", fullName: "Bilal Ahmed", avatar: avatars[1], category: "Drivers",
//     city: "Karachi", age: 38, gender: "Male", experienceYears: 12,
//     memberSince: "2021-08-02", rating: 4.8, reviewsCount: 220,
//     priceMin: 35000, priceMax: 55000, priceUnit: "month", available: true,
//     cnicVerified: true, badges: ["Top Rated"],
//     bio: "Safe and punctual driver, fluent in all major routes of Karachi.",
//     skills: ["LTV License", "Defensive Driving", "Long Routes"],
//     certificates: ["LTV License", "Defensive Driving Course"],
//   },
//   {
//     id: "w3", fullName: "Fatima Noor", avatar: avatars[2], category: "Baby Sitters",
//     city: "Islamabad", age: 28, gender: "Female", experienceYears: 5,
//     memberSince: "2023-01-10", rating: 4.95, reviewsCount: 96,
//     priceMin: 600, priceMax: 1200, priceUnit: "hour", available: true,
//     cnicVerified: true, badges: ["Most Trusted", "Rising Star"],
//     bio: "Loving and patient nanny with early childhood development training.",
//     skills: ["Newborn care", "Toddler activities", "First aid"],
//     certificates: ["Early Childhood Development", "CPR Certified"],
//   },
//   {
//     id: "w4", fullName: "Imran Yousaf", avatar: avatars[3], category: "Cooks",
//     city: "Lahore", age: 41, gender: "Male", experienceYears: 15,
//     memberSince: "2020-06-21", rating: 4.85, reviewsCount: 312,
//     priceMin: 30000, priceMax: 60000, priceUnit: "month", available: false,
//     cnicVerified: true, badges: ["Top Rated"],
//     bio: "Specialist in Desi, Mughlai and continental cuisines. Has cooked for five-star hotels.",
//     skills: ["Desi", "BBQ", "Continental", "Pastries"],
//     certificates: ["Diploma in Culinary Arts"],
//   },
//   {
//     id: "w5", fullName: "Sana Tariq", avatar: avatars[4], category: "Home Teachers",
//     city: "Karachi", age: 26, gender: "Female", experienceYears: 4,
//     memberSince: "2023-09-05", rating: 4.9, reviewsCount: 78,
//     priceMin: 1500, priceMax: 3000, priceUnit: "hour", available: true,
//     cnicVerified: true, badges: ["Rising Star"],
//     bio: "Math and science tutor for O/A levels with a 98% pass rate.",
//     skills: ["Mathematics", "Physics", "Chemistry", "SAT prep"],
//     certificates: ["BSc Mathematics", "Cambridge Trainer"],
//   },
//   {
//     id: "w6", fullName: "Rashid Mehmood", avatar: avatars[5], category: "Electricians",
//     city: "Rawalpindi", age: 35, gender: "Male", experienceYears: 10,
//     memberSince: "2022-11-19", rating: 4.7, reviewsCount: 140,
//     priceMin: 800, priceMax: 2500, priceUnit: "hour", available: true,
//     cnicVerified: true, badges: ["Most Trusted"],
//     bio: "Certified electrician for home and commercial wiring jobs.",
//     skills: ["Wiring", "Inverters", "Solar", "Repairs"],
//     certificates: ["TEVTA Electrical Diploma"],
//   },
//   {
//     id: "w7", fullName: "Adeel Raza", avatar: avatars[6], category: "Plumbers",
//     city: "Faisalabad", age: 33, gender: "Male", experienceYears: 9,
//     memberSince: "2023-02-28", rating: 4.6, reviewsCount: 102,
//     priceMin: 700, priceMax: 2200, priceUnit: "hour", available: true,
//     cnicVerified: true, badges: ["Top Rated"],
//     bio: "Quick and clean plumbing service with one-year workmanship warranty.",
//     skills: ["Leak repair", "Fittings", "Drain cleaning"],
//     certificates: ["Plumbing Certification"],
//   },
//   {
//     id: "w8", fullName: "Hina Pervez", avatar: avatars[7], category: "Cleaners",
//     city: "Lahore", age: 30, gender: "Female", experienceYears: 6,
//     memberSince: "2022-07-15", rating: 4.88, reviewsCount: 160,
//     priceMin: 1200, priceMax: 2800, priceUnit: "hour", available: true,
//     cnicVerified: true, badges: ["Top Rated", "Most Trusted"],
//     bio: "Deep cleaning specialist using eco-friendly products.",
//     skills: ["Deep clean", "Kitchen", "Bathroom", "Move-in/out"],
//     certificates: ["Hospitality Cleaning Certificate"],
//   },
// ];

export const bookings: Booking[] = [
  {
    id: "b1001", workerId: "w1", workerName: "Ayesha Khan", workerAvatar: avatars[0],
    category: "House Servants", date: "2025-11-22", timeSlot: "09:00 - 13:00",
    durationHours: 4, amount: 4800, platformFee: 200, total: 5000,
    status: "confirmed", address: "DHA Phase 5, Lahore",
  },
  {
    id: "b1002", workerId: "w6", workerName: "Rashid Mehmood", workerAvatar: avatars[5],
    category: "Electricians", date: "2025-11-15", timeSlot: "11:00 - 12:30",
    durationHours: 1.5, amount: 2200, platformFee: 100, total: 2300,
    status: "completed", address: "F-7 Markaz, Islamabad",
  },
  {
    id: "b1003", workerId: "w3", workerName: "Fatima Noor", workerAvatar: avatars[2],
    category: "Baby Sitters", date: "2025-10-28", timeSlot: "18:00 - 22:00",
    durationHours: 4, amount: 4000, platformFee: 200, total: 4200,
    status: "cancelled", address: "Bahria Town, Rawalpindi",
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
  { id: "C-201", customerName: "Hassan Iqbal", workerName: "Imran Yousaf", subject: "Late arrival", description: "Worker showed up two hours after the scheduled time.", status: "in_review", date: "2025-11-18" },
  { id: "C-202", customerName: "Mariam Saeed", workerName: "Adeel Raza", subject: "Incomplete work", description: "Plumbing leak reappeared the next day.", status: "open", date: "2025-11-21" },
];

export const notifications: NotificationItem[] = [
  { id: "n1", type: "success", title: "Booking confirmed", message: "Your booking with Ayesha Khan is confirmed for Nov 22.", date: "2025-11-20", read: false },
  { id: "n2", type: "info", title: "New review received", message: "Hassan Iqbal left you a 5-star review.", date: "2025-11-11", read: false },
  { id: "n3", type: "warning", title: "Verification pending", message: "Please re-upload your CNIC back image.", date: "2025-11-09", read: true },
];

export const testimonials = [
  { name: "Sara Malik", role: "Customer, Lahore", quote: "HelpGhar made finding a trusted maid effortless. Verified profiles gave us total peace of mind.", avatar: avatars[2] },
  { name: "Bilal Ahmed", role: "Driver, Karachi", quote: "I get steady work and on-time payments. The platform truly respects workers.", avatar: avatars[1] },
  { name: "Zara Hussain", role: "Customer, Islamabad", quote: "Booked an electrician in 5 minutes. Fixed the issue and the price was exactly as quoted.", avatar: avatars[7] },
];