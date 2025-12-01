const dayjs = require("dayjs");
const {
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} = require("./supabaseClient");

const allowedFrequencies = ["Monthly", "Quarterly", "Yearly", "One-time"];

const sanitizeFrequency = (value) => {
  if (!value) return "Monthly";
  const match = allowedFrequencies.find((item) => item.toLowerCase() === value.toLowerCase());
  return match || "Monthly";
};

const validatePolicy = (payload) => {
  const errors = [];
  if (!payload.policyName && !payload.name) errors.push("policyName is required");
  if (!payload.provider) errors.push("provider is required");
  if (!payload.nextPaymentDate) errors.push("nextPaymentDate is required");

  const premiumProvided =
    payload.premiumAmount !== undefined &&
    payload.premiumAmount !== null &&
    payload.premiumAmount !== "";
  const premiumAmount = premiumProvided ? Number(payload.premiumAmount) : 0;
  if (premiumProvided && (Number.isNaN(premiumAmount) || premiumAmount < 0)) {
    errors.push("premiumAmount must be a positive number");
  }

  if (errors.length) {
    const error = new Error(errors.join(", "));
    error.status = 400;
    throw error;
  }

  return {
    policyName: payload.policyName || payload.name || "",
    provider: payload.provider || "",
    policyType: payload.policyType || "",
    policyNumber: payload.policyNumber || "",
    premiumAmount,
    currency: payload.currency || "USD",
    paymentFrequency: sanitizeFrequency(payload.paymentFrequency || payload.frequency),
    startDate: payload.startDate || "",
    endDate: payload.endDate || "",
    nextPaymentDate: payload.nextPaymentDate,
    notes: payload.notes || "",
    source: payload.source || "Manual",
  };
};

const getPolicies = async ({ monthsWindow, upcomingOnly } = {}) => {
  const policies = await listPolicies();
  if (!upcomingOnly && !monthsWindow) return policies;

  const now = dayjs();
  const until = monthsWindow ? now.add(Number(monthsWindow), "month") : null;

  return policies.filter((policy) => {
    if (!policy.nextPaymentDate) return false;
    const nextDate = dayjs(policy.nextPaymentDate);
    if (!nextDate.isValid()) return false;
    if (nextDate.isBefore(now, "day")) return false;
    if (until && nextDate.isAfter(until, "day")) return false;
    return true;
  });
};

const getPolicyInsights = async () => {
  const policies = await listPolicies();
  const now = dayjs();
  const withDates = policies
    .filter((p) => p.nextPaymentDate && dayjs(p.nextPaymentDate).isValid())
    .sort((a, b) => dayjs(a.nextPaymentDate).valueOf() - dayjs(b.nextPaymentDate).valueOf());

  const nextPayment = withDates[0]
    ? {
        policyName: withDates[0].policyName,
        provider: withDates[0].provider,
        amount: withDates[0].premiumAmount,
        currency: withDates[0].currency,
        paymentFrequency: withDates[0].paymentFrequency,
        date: withDates[0].nextPaymentDate,
      }
    : null;

  const dueSoon = withDates.filter((p) => {
    const date = dayjs(p.nextPaymentDate);
    return date.isSame(now, "day") || (date.isAfter(now, "day") && date.isBefore(now.add(30, "day")));
  });

  return {
    total: policies.length,
    nextPayment,
    dueSoonCount: dueSoon.length,
    dueSoon,
  };
};

const savePolicy = async (payload) => {
  const validated = validatePolicy(payload);
  return createPolicy(validated);
};

const editPolicy = async (id, payload) => {
  if (!id) {
    const error = new Error("policy id is required");
    error.status = 400;
    throw error;
  }
  const validated = validatePolicy(payload);
  return updatePolicy(id, validated);
};

const removePolicy = async (id) => {
  if (!id) {
    const error = new Error("policy id is required");
    error.status = 400;
    throw error;
  }
  return deletePolicy(id);
};

module.exports = {
  getPolicies,
  getPolicyInsights,
  savePolicy,
  editPolicy,
  removePolicy,
  allowedFrequencies,
};
