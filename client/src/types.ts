export type Transaction = {
  id?: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  paymentMethod: string;
  description: string;
  source: string;
};

export type Filters = {
  from?: string;
  to?: string;
  category?: string;
};

export type InsightSummary = {
  totalSpent: number;
  averageDaily: number;
  topCategory: {
    category: string;
    amount: number;
  };
  categoryBreakdown: { category: string; amount: number }[];
  trend: { date: string; amount: number }[];
  count: number;
};

export const categories = [
  "Food",
  "Rent",
  "Grocery",
  "Travel",
  "Shopping",
  "Utilities",
  "Education",
  "Entertainment",
  "Insurance",
  "Business",
  "Savings",
  "Other",
];

export const paymentMethods = ["Cash", "Credit Card", "Debit Card", "UPI", "Other"];

export const currencies = ["USD", "EUR", "GBP", "INR", "CAD"];

export type BudgetStatus = {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  period: string;
};

export type Document = {
  id?: string;
  title: string;
  docType: string;
  expirationDate: string;
  number?: string;
  notes?: string;
  source: string;
  email?: string;
};

export const documentTypes = ["Passport", "Visa", "Driving License", "ID", "Insurance", "Other"];

export type Policy = {
  id?: string;
  policyName: string;
  provider: string;
  policyType?: string;
  policyNumber?: string;
  premiumAmount: number;
  currency: string;
  paymentFrequency: PolicyFrequency;
  startDate?: string;
  endDate?: string;
  nextPaymentDate: string;
  notes?: string;
  source: string;
};

export type PolicyInsightSummary = {
  total: number;
  nextPayment: {
    policyName: string;
    provider: string;
    amount: number;
    currency: string;
    paymentFrequency: PolicyFrequency;
    date: string;
  } | null;
  dueSoonCount: number;
  dueSoon: Policy[];
};

export type PolicyFrequency = "Monthly" | "Quarterly" | "Yearly" | "One-time";

export const policyTypes = ["Health", "Life", "Auto", "Home", "Travel", "Other"];

export const policyFrequencies: PolicyFrequency[] = ["Monthly", "Quarterly", "Yearly", "One-time"];
