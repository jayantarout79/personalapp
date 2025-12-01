/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { currencies } from "../types";
import type { Transaction } from "../types";

type TransactionFormProps = {
  categories: string[];
  paymentMethods: string[];
  onSubmit: (payload: Transaction) => Promise<void> | void;
  submitting?: boolean;
  prefill?: Transaction | null;
  onClearPrefill?: () => void;
  mode?: "create" | "edit";
  onCancelEdit?: () => void;
};

const buildEmptyTransaction = (category: string, paymentMethod: string): Transaction => ({
  date: "",
  amount: 0,
  currency: "USD",
  category,
  paymentMethod,
  description: "",
  source: "Manual",
});

export function TransactionForm({
  categories,
  paymentMethods,
  onSubmit,
  submitting,
  prefill,
  onClearPrefill,
  mode = "create",
  onCancelEdit,
}: TransactionFormProps) {
  const defaultCategory = categories[0] || "Other";
  const defaultPayment = paymentMethods[0] || "Other";

  const [form, setForm] = useState<Transaction>(
    prefill || buildEmptyTransaction(defaultCategory, defaultPayment)
  );

  useEffect(() => {
    if (prefill) {
      setForm({
        ...buildEmptyTransaction(defaultCategory, defaultPayment),
        ...prefill,
      });
    } else {
      setForm(buildEmptyTransaction(defaultCategory, defaultPayment));
    }
  }, [prefill, defaultCategory, defaultPayment]);

  const formTitle = useMemo(
    () => (prefill ? "Review AI draft" : "Add transaction"),
    [prefill]
  );

  const handleChange = (field: keyof Transaction, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
    if (!prefill && mode === "create") {
      setForm(buildEmptyTransaction(defaultCategory, defaultPayment));
    }
  };

  const isEdit = mode === "edit";
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">
            {isEdit ? "Edit existing transaction" : prefill ? "Image → AI → Form" : "Manual Entry"}
          </p>
          <h3>{isEdit ? "Edit transaction" : formTitle}</h3>
        </div>
        {prefill && (
          <button type="button" className="ghost-button" onClick={onClearPrefill}>
            Clear draft
          </button>
        )}
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Amount</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Currency</span>
          <select
            value={form.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            required
          >
            {currencies.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Category</span>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Payment method</span>
          <select
            value={form.paymentMethod}
            onChange={(e) => handleChange("paymentMethod", e.target.value)}
          >
            {paymentMethods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Source</span>
          <select
            value={form.source}
            onChange={(e) => handleChange("source", e.target.value)}
          >
            <option>Manual</option>
            <option>Image AI</option>
          </select>
        </label>
        <label className="form-field form-field-full">
          <span>Description</span>
          <input
            type="text"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Short note e.g. Grocery at Walmart"
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update transaction" : "Save transaction"}
          </button>
          {isEdit && (
            <button
              type="button"
              className="ghost-button"
              onClick={onCancelEdit || onClearPrefill}
              disabled={submitting}
            >
              Cancel edit
            </button>
          )}
          <p className="hint">
            {isEdit
              ? "Update details and save. Auto-saved AI entries can be edited here."
              : prefill
              ? "AI pre-filled these values. Adjust anything before saving."
              : "Manual entry stays fast. Use the upload flow for quicker drafts."}
          </p>
        </div>
      </form>
    </div>
  );
}
