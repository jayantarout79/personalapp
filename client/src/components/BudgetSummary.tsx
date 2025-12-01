import type { BudgetStatus } from "../types";
import { formatCurrency } from "../utils";

type BudgetSummaryProps = {
  budgets: BudgetStatus[];
  onSave: (category: string, limit: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: string[];
  saving?: boolean;
};

export function BudgetSummary({ budgets, onSave, onDelete, categories, saving }: BudgetSummaryProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limit, setLimit] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const limitValue = Number(limit || 0);
    await onSave(selectedCategory, limitValue);
    setSelectedCategory("");
    setLimit("");
  };

  const handleEdit = (budget: BudgetStatus) => {
    setSelectedCategory(budget.category);
    setLimit(String(budget.monthlyLimit));
  };

  const handleDelete = async (budget: BudgetStatus) => {
    if (!budget.id) return;
    await onDelete(budget.id);
    if (selectedCategory === budget.category) {
      setSelectedCategory("");
      setLimit("");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Budgets</p>
          <h3>Monthly limits by category</h3>
        </div>
        <form className="budget-form" onSubmit={handleSubmit}>
          <select
            name="category"
            required
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            name="limit"
            type="number"
            step="0.01"
            min="0"
            placeholder="Limit"
            required
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : selectedCategory ? "Update limit" : "Save limit"}
          </button>
          {selectedCategory && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setLimit("");
              }}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </form>
      </div>
      <div className="budget-grid">
        {budgets.map((budget) => {
          const danger = budget.percentUsed >= 80;
          return (
            <div className={`budget-bar ${danger ? "danger" : ""}`} key={budget.id || budget.category}>
              <div className="budget-bar__header">
                <span className="budget-bar__title">{budget.category}</span>
                <div className="budget-actions">
                  <span className="budget-bar__meta">
                    {formatCurrency(budget.remaining, "USD")} left / {formatCurrency(budget.monthlyLimit, "USD")}
                  </span>
                  <div className="budget-action-buttons">
                    <button type="button" onClick={() => handleEdit(budget)} disabled={saving}>
                      Edit
                    </button>
                    {budget.id && (
                      <button
                        type="button"
                        className="text-danger"
                        onClick={() => handleDelete(budget)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
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
