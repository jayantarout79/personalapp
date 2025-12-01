const { createClient } = require("@supabase/supabase-js");
const config = require("./config");

if (!config.supabase.url || !config.supabase.key) {
  console.warn(
    "Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env."
  );
}

const supabase = config.supabase.url && config.supabase.key
  ? createClient(config.supabase.url, config.supabase.key)
  : null;

const mapRow = (row) => ({
  id: row.id,
  date: row.date,
  amount: Number(row.amount) || 0,
  currency: row.currency || "",
  category: row.category || "",
  paymentMethod: row.payment_method || "",
  description: row.description || "",
  source: row.source || "Manual",
  createdTime: row.created_at,
});

const mapBudgetRow = (row) => ({
  id: row.id,
  category: row.category,
  monthlyLimit: Number(row.monthly_limit) || 0,
  createdTime: row.created_at,
});

const mapDocumentRow = (row) => ({
  id: row.id,
  title: row.title || "",
  docType: row.doc_type || "",
  expirationDate: row.expiration_date,
  number: row.document_number || "",
  notes: row.notes || "",
  source: row.source || "Manual",
  email: row.email || "",
  createdTime: row.created_at,
});

const mapPolicyRow = (row) => ({
  id: row.id,
  policyName: row.policy_name || "",
  provider: row.provider || "",
  policyType: row.policy_type || "",
  policyNumber: row.policy_number || "",
  premiumAmount: Number(row.premium_amount) || 0,
  currency: row.currency || "USD",
  paymentFrequency: row.payment_frequency || "Monthly",
  startDate: row.start_date || "",
  endDate: row.end_date || "",
  nextPaymentDate: row.next_payment_date || "",
  notes: row.notes || "",
  source: row.source || "Manual",
  createdTime: row.created_at,
});

const listTransactions = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to fetch transactions.");
  }

  const { data, error } = await supabase
    .from(config.supabase.tableName)
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRow);
};

const createTransaction = async (transaction) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to save transaction.");
  }

  const payload = {
    date: transaction.date,
    amount: Number(transaction.amount),
    currency: transaction.currency || "USD",
    category: transaction.category || "Other",
    payment_method: transaction.paymentMethod || "Other",
    description: transaction.description || "",
    source: transaction.source || "Manual",
  };

  const { data, error } = await supabase
    .from(config.supabase.tableName)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
};

const updateTransaction = async (id, transaction) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to update transaction.");
  }

  const payload = {
    date: transaction.date,
    amount: Number(transaction.amount),
    currency: transaction.currency || "USD",
    category: transaction.category || "Other",
    payment_method: transaction.paymentMethod || "Other",
    description: transaction.description || "",
    source: transaction.source || "Manual",
  };

  const { data, error } = await supabase
    .from(config.supabase.tableName)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
};

const deleteTransaction = async (id) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to delete transaction.");
  }

  const { error } = await supabase.from(config.supabase.tableName).delete().eq("id", id);
  if (error) throw error;
  return { success: true };
};

const listBudgets = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to fetch budgets.");
  }
  const { data, error } = await supabase
    .from(config.supabase.budgetTableName)
    .select("*")
    .order("category");
  if (error) throw error;
  return (data || []).map(mapBudgetRow);
};

const upsertBudget = async (category, monthlyLimit) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to save budget.");
  }
  const payload = { category, monthly_limit: Number(monthlyLimit) };
  const { data, error } = await supabase
    .from(config.supabase.budgetTableName)
    .upsert(payload, { onConflict: "category" })
    .select()
    .single();
  if (error) throw error;
  return mapBudgetRow(data);
};

const listDocuments = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to fetch documents.");
  }
  const { data, error } = await supabase
    .from(config.supabase.documentsTableName)
    .select("*")
    .order("expiration_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapDocumentRow);
};

const createDocument = async (payload) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to save document.");
  }
  const insertPayload = {
    title: payload.title,
    doc_type: payload.docType || "",
    expiration_date: payload.expirationDate,
    document_number: payload.number || "",
    notes: payload.notes || "",
    source: payload.source || "Manual",
    email: payload.email || "",
  };
  const { data, error } = await supabase
    .from(config.supabase.documentsTableName)
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return mapDocumentRow(data);
};

const updateDocument = async (id, payload) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to update document.");
  }
  const updatePayload = {
    title: payload.title,
    doc_type: payload.docType || "",
    expiration_date: payload.expirationDate,
    document_number: payload.number || "",
    notes: payload.notes || "",
    source: payload.source || "Manual",
    email: payload.email || "",
  };
  const { data, error } = await supabase
    .from(config.supabase.documentsTableName)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapDocumentRow(data);
};

const deleteDocument = async (id) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to delete document.");
  }
  const { error } = await supabase.from(config.supabase.documentsTableName).delete().eq("id", id);
  if (error) throw error;
  return { success: true };
};

const listPolicies = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to fetch policies.");
  }
  const { data, error } = await supabase
    .from(config.supabase.policiesTableName)
    .select("*")
    .order("next_payment_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapPolicyRow);
};

const createPolicy = async (payload) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to save policy.");
  }
  const insertPayload = {
    policy_name: payload.policyName,
    provider: payload.provider || "",
    policy_type: payload.policyType || "",
    policy_number: payload.policyNumber || "",
    premium_amount: Number(payload.premiumAmount) || 0,
    currency: payload.currency || "USD",
    payment_frequency: payload.paymentFrequency || "Monthly",
    start_date: payload.startDate || "",
    end_date: payload.endDate || "",
    next_payment_date: payload.nextPaymentDate,
    notes: payload.notes || "",
    source: payload.source || "Manual",
  };
  const { data, error } = await supabase
    .from(config.supabase.policiesTableName)
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return mapPolicyRow(data);
};

const updatePolicy = async (id, payload) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to update policy.");
  }
  const updatePayload = {
    policy_name: payload.policyName,
    provider: payload.provider || "",
    policy_type: payload.policyType || "",
    policy_number: payload.policyNumber || "",
    premium_amount: Number(payload.premiumAmount) || 0,
    currency: payload.currency || "USD",
    payment_frequency: payload.paymentFrequency || "Monthly",
    start_date: payload.startDate || "",
    end_date: payload.endDate || "",
    next_payment_date: payload.nextPaymentDate,
    notes: payload.notes || "",
    source: payload.source || "Manual",
  };
  const { data, error } = await supabase
    .from(config.supabase.policiesTableName)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapPolicyRow(data);
};

const deletePolicy = async (id) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Unable to delete policy.");
  }
  const { error } = await supabase.from(config.supabase.policiesTableName).delete().eq("id", id);
  if (error) throw error;
  return { success: true };
};

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listBudgets,
  upsertBudget,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
};
