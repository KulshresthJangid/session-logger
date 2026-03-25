import { BillingType } from '@prisma/client';

/**
 * Compute cost for a session.
 * - HOURLY: (durationSecs / 3600) * hourlyRate
 * - FIXED:  fixedRate (flat, regardless of duration)
 */
export function computeCost(
  billingType: BillingType,
  billingSnapshot: number,
  durationSecs: number,
): number {
  if (billingType === BillingType.HOURLY) {
    return parseFloat(((durationSecs / 3600) * billingSnapshot).toFixed(2));
  }
  // FIXED
  return parseFloat(billingSnapshot.toFixed(2));
}

/**
 * Compute duration in seconds between two dates.
 */
export function computeDuration(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Format seconds to "1h 23m" for display purposes (used in reports).
 */
export function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
