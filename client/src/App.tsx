import { useCallback, useEffect, useState } from "react";
import { api, setAuthToken } from "./api";
import { ImageUpload } from "./components/ImageUpload";
import { InsightsPanel } from "./components/InsightsPanel";
import { NavBar } from "./components/NavBar";
import { SignIn } from "./components/SignIn";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionsTable } from "./components/TransactionsTable";
import { BudgetSummary } from "./components/BudgetSummary";
import { DocumentForm } from "./components/DocumentForm";
import { DocumentUpload } from "./components/DocumentUpload";
import { DocumentTable } from "./components/DocumentTable";
import { DocumentInsights } from "./components/DocumentInsights";
import { PolicyForm } from "./components/PolicyForm";
import { PolicyUpload } from "./components/PolicyUpload";
import { PolicyTable } from "./components/PolicyTable";
import { PolicyInsights } from "./components/PolicyInsights";
import { TextExpense } from "./components/TextExpense";
import {
  categories as defaultCategories,
  paymentMethods as defaultPaymentMethods,
} from "./types";
import type {
  BudgetStatus,
  Document,
  Filters,
  InsightSummary,
  Policy,
  PolicyInsightSummary,
  Transaction,
} from "./types";
import "./App.css";
import { supabase } from "./supabaseClient";

type Toast = { message: string; tone: "success" | "error" | "info" };

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [insights, setInsights] = useState<InsightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Transaction | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [uploadingAI, setUploadingAI] = useState(false);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docPrefill, setDocPrefill] = useState<Document | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [documentWindow, setDocumentWindow] = useState(8);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyPrefill, setPolicyPrefill] = useState<Policy | null>(null);
  const [policySubmitting, setPolicySubmitting] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyInsights, setPolicyInsights] = useState<PolicyInsightSummary | null>(null);
  const [policyInsightsLoading, setPolicyInsightsLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [activeModule, setActiveModule] = useState<
    "Finance Tracker" | "Document Tracker" | "Policy Tracker"
  >("Finance Tracker");
  const [toast, setToast] = useState<Toast | null>(null);
  const [meta, setMeta] = useState({
    categories: defaultCategories,
    paymentMethods: defaultPaymentMethods,
  });
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"] | null>(null);

  const handleModuleSelect = (label: string) => {
    if (
      label === "Finance Tracker" ||
      label === "Document Tracker" ||
      label === "Policy Tracker"
    ) {
      setActiveModule(label);
    }
  };

  const showToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    setToast({ message, tone });
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const data = await api.getMeta();
      setMeta({
        categories: data.categories,
        paymentMethods: data.paymentMethods,
      });
    } catch {
      // Keep defaults if meta fails.
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    try {
      const data = await api.getBudgets();
      setBudgets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load budgets.";
      showToast(message, "error");
    }
  }, [showToast]);

  const loadDocs = useCallback(async () => {
    setDocLoading(true);
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load documents.";
      showToast(message, "error");
    } finally {
      setDocLoading(false);
    }
  }, [showToast]);

  const loadPolicies = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load policies.";
      showToast(message, "error");
    } finally {
      setPolicyLoading(false);
    }
  }, [showToast]);

  const loadPolicyInsights = useCallback(async () => {
    setPolicyInsightsLoading(true);
    try {
      const data = await api.getPolicyInsights();
      setPolicyInsights(data);
    } catch (err) {
      setPolicyInsights(null);
      const message = err instanceof Error ? err.message : "Unable to load policy insights.";
      showToast(message, "error");
    } finally {
      setPolicyInsightsLoading(false);
    }
  }, [showToast]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setInsightsLoading(true);
    try {
      const data = await api.getTransactions(filters);
      setTransactions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load transactions.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }

    try {
      const insightData = await api.getInsights(filters);
      setInsights(insightData);
    } catch (err) {
      setInsights(null);
      const message = err instanceof Error ? err.message : "Unable to load insights.";
      showToast(message, "error");
    } finally {
      setInsightsLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        const currentSession = data.session;
        setSession(currentSession);
        setAuthToken(currentSession?.access_token || null);
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthToken(newSession?.access_token || null);
      if (!newSession) {
        setTransactions([]);
        setInsights(null);
        setDocuments([]);
        setPolicies([]);
        setPolicyInsights(null);
      }
    });

    loadMeta();
    syncSession();

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [loadMeta]);

  useEffect(() => {
    if (!session) return;
    loadTransactions();
  }, [filters, loadTransactions, session]);

  useEffect(() => {
    if (!session) return;
    loadBudgets();
    loadDocs();
    loadPolicies();
    loadPolicyInsights();
  }, [loadBudgets, loadDocs, loadPolicies, loadPolicyInsights, session]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (payload: Transaction) => {
    setSubmitting(true);
    try {
      const tx = {
        ...payload,
        source: payload.source || "Manual",
      };
      if (formMode === "edit") {
        if (!payload.id) {
          throw new Error("Missing transaction id for update.");
        }
        await api.updateTransaction(payload.id, tx);
        showToast("Transaction updated", "success");
      } else {
        await api.createTransaction(tx);
        showToast("Transaction saved", "success");
      }
      setDraft(null);
      setFormMode("create");
      await loadTransactions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save transaction.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setDraft(tx);
    setFormMode("edit");
  };

  const handleDelete = async (tx: Transaction) => {
    if (!tx.id) {
      showToast("Missing transaction id.", "error");
      return;
    }
    try {
      await api.deleteTransaction(tx.id);
      showToast("Transaction deleted", "success");
      await loadTransactions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete transaction.";
      showToast(message, "error");
    }
  };

  const ensureDate = (value?: string) => {
    if (value) return value;
    return new Date().toISOString().slice(0, 10);
  };

  const handleUpload = async (files: File[]) => {
    setUploadingAI(true);
    try {
      let savedCount = 0;
      let skipped = 0;
      for (const file of files) {
        const extracted = await api.extractFromImage(file);
        for (const tx of extracted) {
          const amount = Number(tx.amount) || 0;
          if (!amount || amount <= 0) {
            skipped += 1;
            continue;
          }
          await api.createTransaction({
            ...tx,
            date: ensureDate(tx.date),
            source: tx.source || "Image AI",
          });
          savedCount += 1;
        }
      }
      if (savedCount === 0) {
        showToast("AI could not find any transactions.", "info");
      } else {
        const skippedNote = skipped ? ` Skipped ${skipped} with missing amounts.` : "";
        showToast(`AI saved ${savedCount} transaction${savedCount === 1 ? "" : "s"}.${skippedNote}`, "success");
        await loadTransactions();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save AI transactions automatically.";
      showToast(message, "error");
      throw err;
    } finally {
      setUploadingAI(false);
    }
  };

  const handleNoteSubmit = async (note: string) => {
    setNoteSaving(true);
    try {
      const tx = await api.extractFromText(note);
      await api.createTransaction({
        ...tx,
        date: ensureDate(tx.date),
        source: tx.source || "Text AI",
      });
      showToast("Saved from note", "success");
      await loadTransactions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save from note.";
      showToast(message, "error");
      throw err;
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSaveBudget = async (category: string, limit: number) => {
    setBudgetSaving(true);
    try {
      await api.saveBudget(category, limit);
      await loadBudgets();
      showToast("Budget saved", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save budget.";
      showToast(message, "error");
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    setBudgetSaving(true);
    try {
      await api.deleteBudget(id);
      await loadBudgets();
      showToast("Budget deleted", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete budget.";
      showToast(message, "error");
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleSaveDocuments = async (docs: Document[]) => {
    setDocSubmitting(true);
    try {
      for (const doc of docs) {
        if (doc.id) {
          await api.updateDocument(doc.id, doc);
        } else {
          await api.createDocument(doc);
        }
      }
      showToast("Document(s) saved", "success");
      setDocPrefill(null);
      await loadDocs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save document.";
      showToast(message, "error");
    } finally {
      setDocSubmitting(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!doc.id) {
      showToast("Missing document id.", "error");
      return;
    }
    try {
      await api.deleteDocument(doc.id);
      showToast("Document deleted", "success");
      await loadDocs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete document.";
      showToast(message, "error");
    }
  };

  const handleDocumentSubmit = async (doc: Document) => {
    await handleSaveDocuments([{ ...doc, source: doc.source || "Manual" }]);
  };

  const handleSavePolicies = async (items: Policy[]) => {
    setPolicySubmitting(true);
    try {
      for (const policy of items) {
        if (policy.id) {
          await api.updatePolicy(policy.id, policy);
        } else {
          await api.createPolicy(policy);
        }
      }
      showToast("Policy saved", "success");
      setPolicyPrefill(null);
      await Promise.all([loadPolicies(), loadPolicyInsights()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save policy.";
      showToast(message, "error");
    } finally {
      setPolicySubmitting(false);
    }
  };

  const handlePolicySubmit = async (policy: Policy) => {
    await handleSavePolicies([{ ...policy, source: policy.source || "Manual" }]);
  };

  const handleDeletePolicy = async (policy: Policy) => {
    if (!policy.id) {
      showToast("Missing policy id.", "error");
      return;
    }
    try {
      await api.deletePolicy(policy.id);
      showToast("Policy deleted", "success");
      await Promise.all([loadPolicies(), loadPolicyInsights()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete policy.";
      showToast(message, "error");
    }
  };

  if (!authReady) {
    return (
      <div className="app-shell">
        <NavBar active={activeModule} onSelect={handleModuleSelect} />
        <main className="content">
          <div className="card">
            <p className="muted">Loading authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <NavBar active={activeModule} onSelect={handleModuleSelect} />
        <main className="content">
          <SignIn onSignedIn={(token) => setAuthToken(token)} />
        </main>
      </div>
    );
  }

  const financeView = (
    <>
      <section className="grid">
        <InsightsPanel
          insights={insights}
          loading={insightsLoading}
          transactions={transactions}
          categories={meta.categories}
        />
      </section>

      <section className="grid">
        <ImageUpload onUpload={handleUpload} onMessage={showToast} busy={uploadingAI} />
        <TextExpense onSubmit={handleNoteSubmit} loading={noteSaving} />
      </section>

      <section className="grid two-columns">
        <TransactionForm
          categories={meta.categories}
          paymentMethods={meta.paymentMethods}
          onSubmit={handleSubmit}
          submitting={submitting}
          prefill={draft}
          mode={formMode}
          onClearPrefill={() => {
            setDraft(null);
            setFormMode("create");
          }}
          onCancelEdit={() => {
            setDraft(null);
            setFormMode("create");
          }}
        />
        <BudgetSummary
          budgets={budgets}
          categories={meta.categories}
          onSave={handleSaveBudget}
          onDelete={handleDeleteBudget}
          saving={budgetSaving}
        />
      </section>

      <section className="grid">
        <TransactionsTable
          transactions={transactions}
          loading={loading}
          filters={filters}
          categories={meta.categories}
          onFilterChange={setFilters}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </section>
    </>
  );

  const documentView = (
    <>
      <section className="grid two-columns">
        <DocumentUpload onCreated={handleSaveDocuments} onMessage={showToast} />
        <DocumentForm
          onSubmit={handleDocumentSubmit}
          submitting={docSubmitting}
          prefill={docPrefill}
          onClear={() => setDocPrefill(null)}
        />
      </section>

      <section className="grid two-columns">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Document window</p>
              <h3>Upcoming expiry filter</h3>
            </div>
            <div className="budget-form">
              <input
                type="number"
                min="1"
                value={documentWindow}
                onChange={(e) => setDocumentWindow(Number(e.target.value) || 1)}
                style={{ width: "120px" }}
              />
              <span className="hint">months</span>
            </div>
          </div>
        </div>
        <DocumentInsights documents={documents} windowMonths={documentWindow} />
      </section>

      <section className="grid">
        <DocumentTable
          documents={documents}
          loading={docLoading}
          onEdit={(doc) => setDocPrefill(doc)}
          onDelete={handleDeleteDocument}
        />
      </section>
    </>
  );

  const policyView = (
    <>
      <section className="grid two-columns">
        <PolicyUpload onCreated={handleSavePolicies} onMessage={showToast} />
        <PolicyForm
          onSubmit={handlePolicySubmit}
          submitting={policySubmitting}
          prefill={policyPrefill}
          onClear={() => setPolicyPrefill(null)}
        />
      </section>

      <section className="grid">
        <PolicyInsights insights={policyInsights} loading={policyInsightsLoading} />
      </section>

      <section className="grid">
        <PolicyTable
          policies={policies}
          loading={policyLoading}
          onEdit={(policy) => setPolicyPrefill(policy)}
          onDelete={handleDeletePolicy}
        />
      </section>
    </>
  );

  return (
    <div className="app-shell">
      <NavBar active={activeModule} onSelect={handleModuleSelect} />

      <main className="content">
        {activeModule === "Finance Tracker"
          ? financeView
          : activeModule === "Document Tracker"
            ? documentView
            : policyView}
      </main>

      {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
    </div>
  );
}

export default App;
