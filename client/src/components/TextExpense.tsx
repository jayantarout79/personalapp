import { useState } from "react";

type TextExpenseProps = {
  onSubmit: (note: string) => Promise<void> | void;
  loading?: boolean;
};

export function TextExpense({ onSubmit, loading }: TextExpenseProps) {
  const [note, setNote] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!note.trim()) return;
    await onSubmit(note.trim());
    setNote("");
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Natural language</p>
          <h3>Type an expense</h3>
        </div>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field form-field-full">
          <span>Note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='e.g. "Spent 14 dollars today at HEB for grocery"'
            rows={3}
            required
          />
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Reading..." : "Save from note"}
          </button>
          <p className="hint">AI will parse the note and auto-save the transaction.</p>
        </div>
      </form>
    </div>
  );
}
