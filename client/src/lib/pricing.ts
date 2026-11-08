// Mirrors server/helper/price_helper.py -- keep the two in sync.

export type PriceUnit = "hour" | "day" | "month";

export const PLATFORM_FEE_RATE = 0.05;

/** Allowed booking duration per gig unit (inclusive). */
export const DURATION_LIMITS: Record<PriceUnit, { min: number; max: number }> = {
  hour: { min: 1, max: 12 },
  day: { min: 1, max: 30 },
  month: { min: 1, max: 12 },
};

export const unitLabel = (unit: PriceUnit, count = 1) => `${unit}${count === 1 ? "" : "s"}`;

export const formatPrice = (price: number, unit: PriceUnit) =>
  `Rs. ${(price ?? 0).toLocaleString()}/${unit}`;

export function calculateBookingPrice(price: number, duration: number) {
  const amount = (price ?? 0) * duration;
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
  return { amount, platformFee, total: amount + platformFee };
}

/** "3 hours" / "2 months" -- falls back to durationHours on older bookings. */
export function formatDuration(b: {
  duration?: number | null;
  durationUnit?: PriceUnit | null;
  durationHours?: number | null;
}) {
  if (b.duration && b.durationUnit) return `${b.duration} ${unitLabel(b.durationUnit, b.duration)}`;
  if (b.durationHours) return `${b.durationHours} ${unitLabel("hour", b.durationHours)}`;
  return "";
}
