/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import type { Document } from "../types";
import { documentTypes } from "../types";

type DocumentFormProps = {
  onSubmit: (payload: Document) => Promise<void> | void;
  submitting?: boolean;
  prefill?: Document | null;
  onClear?: () => void;
};

const emptyDocument: Document = {
  title: "",
  docType: "Passport",
  expirationDate: "",
  number: "",
  notes: "",
  source: "Manual",
};

export function DocumentForm({ onSubmit, submitting, prefill, onClear }: DocumentFormProps) {
  const [form, setForm] = useState<Document>(prefill || emptyDocument);

  useEffect(() => {
    if (prefill) {
      setForm({ ...emptyDocument, ...prefill });
    } else {
      setForm(emptyDocument);
    }
  }, [prefill]);

  const handleChange = (field: keyof Document, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
    if (!prefill) setForm(emptyDocument);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{prefill ? "Edit document" : "Document Tracker"}</p>
          <h3>{prefill ? "Update document" : "Add document"}</h3>
        </div>
        {prefill && (
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear edit
          </button>
        )}
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Passport - John Doe"
            required
          />
        </label>
        <label className="form-field">
          <span>Type</span>
          <select value={form.docType} onChange={(e) => handleChange("docType", e.target.value)}>
            {documentTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Expiration date</span>
          <input
            type="date"
            value={form.expirationDate}
            onChange={(e) => handleChange("expirationDate", e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Document number</span>
          <input
            value={form.number || ""}
            onChange={(e) => handleChange("number", e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="form-field form-field-full">
          <span>Notes</span>
          <input
            value={form.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Country, issuing authority, holder, etc."
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Saving..." : prefill ? "Update" : "Save"}
          </button>
          <p className="hint">
            Attach screenshots via the upload card; AI will draft the fields automatically.
          </p>
        </div>
      </form>
    </div>
  );
}
