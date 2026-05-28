/** LKR formatting helpers — single-currency today, extensible later. */

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatLkr(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "LKR 0.00";
  return lkrFormatter.format(value);
}

export function parsePriceInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
