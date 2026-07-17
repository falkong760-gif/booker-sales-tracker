// Core financial and sales calculation helper functions for the system

export type ShortfallStatus = 'shortfall' | 'excess' | 'exact match';

/**
 * Categorizes an entry's shortfall status based on sales vs deposits.
 * - Positive shortfall (sales > deposits) means a deficit/shortfall (Red).
 * - Negative shortfall (sales < deposits) means an overpayment/excess (Green).
 * - Zero shortfall means exact match (Neutral).
 */
export function getShortfallStatus(saleAmount: number, depositAmount: number): ShortfallStatus {
  const diff = saleAmount - depositAmount;
  if (diff > 0) {
    return 'shortfall';
  } else if (diff < 0) {
    return 'excess';
  } else {
    return 'exact match';
  }
}

export interface RunningBalanceEntry {
  id: string;
  booker_id: string;
  entry_date: string;
  sale_amount: number;
  deposit_amount: number;
  shortfall: number;
  remarks: string | null;
  created_at: string;
  running_balance?: number;
}

/**
 * Calculates the live running cumulative shortfall balance of daily entries.
 * Accumulates the shortfall values (sale_amount - deposit_amount) in ascending date order.
 * Note: Running balance is never stored in the database per SRS Section 5.
 */
export function calculateRunningBalance<T extends { entry_date: string; shortfall: number }>(
  entries: T[]
): (T & { running_balance: number })[] {
  // Sort by entry_date ascending to ensure correct cumulative running order
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  let currentCumulativeSum = 0;

  return sorted.map((entry) => {
    currentCumulativeSum += Number(entry.shortfall);
    return {
      ...entry,
      running_balance: parseFloat(currentCumulativeSum.toFixed(2)),
    };
  });
}
