import type {
  BudgetStatus,
  Document,
  Filters,
  InsightSummary,
  Policy,
  PolicyInsightSummary,
  Transaction,
} from "./types";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

const buildQuery = (filters?: Filters) => {
  const params = new URLSearchParams();
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.category) params.set("category", filters.category);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const parseResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  const payload = await response.json();
  return payload.data;
};

export const api = {
  async getTransactions(filters?: Filters): Promise<Transaction[]> {
    const query = buildQuery(filters);
    const response = await fetch(`${API_BASE}/api/transactions${query}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async createTransaction(payload: Transaction): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  },

  async updateTransaction(id: string, payload: Transaction): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  },

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Request failed");
    }
  },

  async extractFromImage(file: File): Promise<Transaction[]> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/api/ai/extract`, {
      method: "POST",
      body: formData,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async extractFromText(note: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/api/ai/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ note }),
    });
    return parseResponse(response);
  },

  async getInsights(filters?: Filters): Promise<InsightSummary> {
    const query = buildQuery(filters);
    const response = await fetch(`${API_BASE}/api/insights${query}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async getMeta(): Promise<{ categories: string[]; paymentMethods: string[] }> {
    const response = await fetch(`${API_BASE}/api/meta`);
    return parseResponse(response);
  },

  async getBudgets(): Promise<BudgetStatus[]> {
    const response = await fetch(`${API_BASE}/api/budgets`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async saveBudget(category: string, monthlyLimit: number): Promise<BudgetStatus> {
    const response = await fetch(`${API_BASE}/api/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ category, monthlyLimit }),
    });
    return parseResponse(response);
  },

  async deleteBudget(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/budgets/${id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Request failed");
    }
  },

  async getDocuments(params?: { months?: string; upcoming?: boolean }): Promise<Document[]> {
    const search = new URLSearchParams();
    if (params?.months) search.set("months", params.months);
    if (params?.upcoming) search.set("upcoming", "true");
    const query = search.toString();
    const response = await fetch(
      `${API_BASE}/api/documents${query ? `?${query}` : ""}`,
      {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      }
    );
    return parseResponse(response);
  },

  async createDocument(payload: Document): Promise<Document> {
    const response = await fetch(`${API_BASE}/api/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  },

  async updateDocument(id: string, payload: Document): Promise<Document> {
    const response = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  },

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Request failed");
    }
  },

  async extractDocument(file: File): Promise<Document[]> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/api/ai/documents`, {
      method: "POST",
      body: formData,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async getPolicies(params?: { months?: string; upcoming?: boolean }): Promise<Policy[]> {
    const search = new URLSearchParams();
    if (params?.months) search.set("months", params.months);
    if (params?.upcoming) search.set("upcoming", "true");
    const query = search.toString();
    const response = await fetch(`${API_BASE}/api/policies${query ? `?${query}` : ""}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async getPolicyInsights(): Promise<PolicyInsightSummary> {
    const response = await fetch(`${API_BASE}/api/policies/insights`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },

  async createPolicy(payload: Policy): Promise<Policy> {
    const response = await fetch(`${API_BASE}/api/policies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  },

  async updatePolicy(id: string, payload: Policy): Promise<Policy> {
    const response = await fetch(`${API_BASE}/api/policies/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  },

  async deletePolicy(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/policies/${id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Request failed");
    }
  },

  async extractPolicy(file: File): Promise<Policy[]> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/api/ai/policies`, {
      method: "POST",
      body: formData,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return parseResponse(response);
  },
};
