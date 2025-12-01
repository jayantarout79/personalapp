const dayjs = require("dayjs");
const {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("./supabaseClient");

const allowedCategories = [
  "Food",
  "Rent",
  "Grocery",
  "Travel",
  "Shopping",
  "Utilities",
  "Other",
];

const allowedPaymentMethods = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Other",
];

const sanitizeCategory = (value) => {
  if (!value) return "Other";
  const match = allowedCategories.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  );
  return match || "Other";
};

const sanitizePaymentMethod = (value) => {
  if (!value) return "Other";
  const match = allowedPaymentMethods.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  );
  return match || "Other";
};

const validateTransactionPayload = (payload) => {
  const errors = [];

  const dateValue = payload.date || dayjs().format("YYYY-MM-DD");
  const amountProvided =
    payload.amount !== undefined && payload.amount !== null && payload.amount !== "";
  if (!amountProvided) errors.push("amount is required");
  if (!payload.currency) errors.push("currency is required");

  const amountNumber = Number(payload.amount);
  if (amountNumber <= 0) errors.push("amount must be greater than 0");
  if (Number.isNaN(amountNumber)) errors.push("amount must be a number");

  if (errors.length) {
    const error = new Error(errors.join(", "));
    error.status = 400;
    throw error;
  }

  return {
    date: dateValue,
    amount: amountNumber,
    currency: payload.currency,
    category: sanitizeCategory(payload.category),
    paymentMethod: sanitizePaymentMethod(payload.paymentMethod),
    description: payload.description || "",
    source: payload.source || "Manual",
  };
};

const filterTransactions = (transactions, filters = {}) => {
  const { from, to, category } = filters;
  const fromDate = from ? dayjs(from) : null;
  const toDate = to ? dayjs(to) : null;
  const categoryLower = category ? category.toLowerCase() : null;

  return transactions.filter((tx) => {
    const txDate = tx.date ? dayjs(tx.date) : null;
    if (fromDate && (!txDate || txDate.isBefore(fromDate, "day"))) return false;
    if (toDate && (!txDate || txDate.isAfter(toDate, "day"))) return false;
    if (categoryLower && tx.category.toLowerCase() !== categoryLower) return false;
    return true;
  });
};

const computeInsights = (transactions = []) => {
  const totalsByCategory = {};
  const totalsByDate = {};
  let total = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    total += amount;

    const categoryKey = tx.category || "Other";
    totalsByCategory[categoryKey] = (totalsByCategory[categoryKey] || 0) + amount;

    const dateKey = tx.date || "Unknown";
    totalsByDate[dateKey] = (totalsByDate[dateKey] || 0) + amount;
  });

  const categoryBreakdown = Object.entries(totalsByCategory).map(
    ([category, amount]) => ({ category, amount })
  );
  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  const trend = Object.entries(totalsByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

  const daysCount = trend.length || 1;
  const averageDaily = total / daysCount;
  const topCategory = categoryBreakdown[0] || { category: "N/A", amount: 0 };

  return {
    totalSpent: total,
    averageDaily,
    topCategory,
    categoryBreakdown,
    trend,
    count: transactions.length,
  };
};

const saveTransaction = async (payload) => {
  const validated = validateTransactionPayload(payload);
  return createTransaction(validated);
};

const editTransaction = async (id, payload) => {
  if (!id) {
    const error = new Error("transaction id is required");
    error.status = 400;
    throw error;
  }
  const validated = validateTransactionPayload(payload);
  return updateTransaction(id, validated);
};

const removeTransaction = async (id) => {
  if (!id) {
    const error = new Error("transaction id is required");
    error.status = 400;
    throw error;
  }
  return deleteTransaction(id);
};

const getTransactionsWithFilters = async (filters) => {
  const transactions = await listTransactions();
  return filterTransactions(transactions, filters);
};

module.exports = {
  validateTransactionPayload,
  saveTransaction,
  editTransaction,
  removeTransaction,
  getTransactionsWithFilters,
  computeInsights,
  allowedCategories,
  allowedPaymentMethods,
};
