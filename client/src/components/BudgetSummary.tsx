import type { BudgetStatus } from "../types";
import { formatCurrency } from "../utils";

type BudgetSummaryProps = {
  budgets: BudgetStatus[];
  onSave: (category: string, limit: number) => Promise<void>;
  categories: string[];
  saving?: boolean;
};

export function BudgetSummary({ budgets, onSave, categories, saving }: BudgetSummaryProps) {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = String(formData.get("category") || "");
    const limit = Number(formData.get("limit") || 0);
    await onSave(category, limit);
    event.currentTarget.reset();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Budgets</p>
          <h3>Monthly limits by category</h3>
        </div>
        <form className="budget-form" onSubmit={handleSubmit}>
          <select name="category" required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input name="limit" type="number" step="0.01" min="0" placeholder="Limit" required />
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save limit"}
          </button>
        </form>
      </div>
      <div className="budget-grid">
        {budgets.map((budget) => {
          const danger = budget.percentUsed >= 80;
          return (
            <div className={`budget-bar ${danger ? "danger" : ""}`} key={budget.id || budget.category}>
              <div className="budget-bar__header">
                <span className="budget-bar__title">{budget.category}</span>
                <span className="budget-bar__meta">
                  {formatCurrency(budget.remaining, "USD")} left / {formatCurrency(budget.monthlyLimit, "USD")}
                </span>
              </div>
              <div className="budget-bar__track">
                <div className="budget-bar__fill" style={{ width: `${budget.percentUsed}%` }} />
              </div>
              <div className="budget-bar__footer">
                <span>{budget.period}</span>
                <span className={danger ? "text-danger" : ""}>
                  {budget.percentUsed.toFixed(0)}% used
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
