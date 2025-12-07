export const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);

export const parseLocalDate = (value?: string) => {
  if (!value) return null;
  const parts = value.split("-").map((n) => Number(n));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

export const formatDate = (value?: string) => {
  const date = parseLocalDate(value);
  if (!date) return value || "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
