// Helper functions for financial and sales calculations
// TODO: implement and refine in Phase 2

export function calculateDifference(saleAmount: number, depositAmount: number): number {
  return saleAmount - depositAmount;
}

export function isShortfall(saleAmount: number, depositAmount: number): boolean {
  return depositAmount < saleAmount;
}

export function isExcess(saleAmount: number, depositAmount: number): boolean {
  return depositAmount > saleAmount;
}
