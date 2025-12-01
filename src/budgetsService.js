const dayjs = require("dayjs");
const { listBudgets, upsertBudget, deleteBudget, listTransactions } = require("./supabaseClient");

const computeSpentByCategory = (transactions = []) => {
  const startOfMonth = dayjs().startOf("month");
  const endOfMonth = dayjs().endOf("month");
  const spent = {};
  transactions.forEach((tx) => {
    const txDate = tx.date ? dayjs(tx.date) : null;
    if (!txDate) return;
    if (txDate.isBefore(startOfMonth, "day") || txDate.isAfter(endOfMonth, "day")) return;
    const key = tx.category || "Other";
    spent[key] = (spent[key] || 0) + (Number(tx.amount) || 0);
  });
  return spent;
};

const getBudgetStatuses = async () => {
  const [budgets, transactions] = await Promise.all([listBudgets(), listTransactions()]);
  const spentByCategory = computeSpentByCategory(transactions);
  const start = dayjs().startOf("month").format("YYYY-MM-DD");
  const end = dayjs().endOf("month").format("YYYY-MM-DD");

  return budgets.map((budget) => {
    const spent = spentByCategory[budget.category] || 0;
    const remaining = Math.max(0, budget.monthlyLimit - spent);
    const percentUsed = budget.monthlyLimit > 0 ? Math.min(100, (spent / budget.monthlyLimit) * 100) : 0;
    return {
      ...budget,
      spent,
      remaining,
      percentUsed,
      period: `${start} → ${end}`,
    };
  });
};

const saveBudget = async (category, monthlyLimit) => {
  if (!category) {
    const error = new Error("category is required");
    error.status = 400;
    throw error;
  }
  const limitNumber = Number(monthlyLimit);
  if (Number.isNaN(limitNumber) || limitNumber <= 0) {
    const error = new Error("monthly limit must be greater than 0");
    error.status = 400;
    throw error;
  }
  return upsertBudget(category, limitNumber);
};

module.exports = {
  getBudgetStatuses,
  saveBudget,
  removeBudget: deleteBudget,
};
