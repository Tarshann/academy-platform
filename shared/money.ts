export type MoneyInput = number | string;

export const normalizeAmount = (amount: MoneyInput): number => {
  const parsed = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toCents = (amount: MoneyInput): number =>
  Math.round(normalizeAmount(amount) * 100);

export const formatUsd = (amount: MoneyInput): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(normalizeAmount(amount));
