/**
 * Get UTC start/end of a given month (YYYY-MM format).
 * Returns { start: Date, end: Date } as first and last moment of that month.
 */
export function getMonthBounds(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
  return { start, end };
}

/**
 * Return current month as YYYY-MM string.
 */
export function currentMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
