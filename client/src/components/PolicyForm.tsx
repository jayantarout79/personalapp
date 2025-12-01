/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import type { Policy } from "../types";
import { currencies, policyFrequencies, policyTypes } from "../types";

type PolicyFormProps = {
  onSubmit: (payload: Policy) => Promise<void> | void;
  submitting?: boolean;
  prefill?: Policy | null;
  onClear?: () => void;
};

const defaultPolicy: Policy = {
  policyName: "",
  provider: "",
  policyType: "Health",
  policyNumber: "",
  premiumAmount: 0,
  currency: currencies[0],
  paymentFrequency: "Monthly",
  startDate: "",
  endDate: "",
  nextPaymentDate: new Date().toISOString().slice(0, 10),
  notes: "",
  source: "Manual",
};

export function PolicyForm({ onSubmit, submitting, prefill, onClear }: PolicyFormProps) {
  const [form, setForm] = useState<Policy>(prefill || defaultPolicy);

  useEffect(() => {
    if (prefill) {
      setForm({ ...defaultPolicy, ...prefill });
    } else {
      setForm(defaultPolicy);
    }
  }, [prefill]);

  const handleChange = (field: keyof Policy, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
    if (!prefill) setForm(defaultPolicy);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{prefill ? "Edit policy" : "Policy Tracker"}</p>
          <h3>{prefill ? "Update policy" : "Add policy"}</h3>
        </div>
        {prefill && (
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear edit
          </button>
        )}
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Policy name</span>
          <input
            value={form.policyName}
            onChange={(e) => handleChange("policyName", e.target.value)}
            placeholder="Health Shield Plus"
            required
          />
        </label>
        <label className="form-field">
          <span>Provider</span>
          <input
            value={form.provider}
            onChange={(e) => handleChange("provider", e.target.value)}
            placeholder="Insurer / Company"
            required
          />
        </label>
        <label className="form-field">
          <span>Type</span>
          <select
            value={form.policyType || "Other"}
            onChange={(e) => handleChange("policyType", e.target.value)}
          >
            {policyTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Policy number</span>
          <input
            value={form.policyNumber || ""}
            onChange={(e) => handleChange("policyNumber", e.target.value)}
            placeholder="ID / member number"
          />
        </label>
        <label className="form-field">
          <span>Premium amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.premiumAmount}
            onChange={(e) => handleChange("premiumAmount", Number(e.target.value) || 0)}
            placeholder="0.00"
          />
        </label>
        <label className="form-field">
          <span>Currency</span>
          <select
            value={form.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Payment frequency</span>
          <select
            value={form.paymentFrequency}
            onChange={(e) => handleChange("paymentFrequency", e.target.value)}
          >
            {policyFrequencies.map((freq) => (
              <option key={freq}>{freq}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Next payment date</span>
          <input
            type="date"
            value={form.nextPaymentDate}
            onChange={(e) => handleChange("nextPaymentDate", e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Start date</span>
          <input
            type="date"
            value={form.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>End date</span>
          <input
            type="date"
            value={form.endDate || ""}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
        </label>
        <label className="form-field form-field-full">
          <span>Notes</span>
          <input
            value={form.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Coverage highlights, riders, renewal notes"
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Saving..." : prefill ? "Update" : "Save"}
          </button>
          <p className="hint">Track premiums and renewal dates. Next payment drives insights.</p>
        </div>
      </form>
    </div>
  );
}
