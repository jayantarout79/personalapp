import type { Filters, Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils";

type TableProps = {
  transactions: Transaction[];
  loading?: boolean;
  filters: Filters;
  categories: string[];
  onFilterChange: (next: Filters) => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
};

export function TransactionsTable({
  transactions,
  loading,
  filters,
  categories,
  onFilterChange,
  onEdit,
  onDelete,
}: TableProps) {
  const handleFilterChange = (field: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [field]: value || undefined });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Transactions</p>
          <h3>Recent activity</h3>
        </div>
        <div className="filters">
          <input
            type="date"
            value={filters.from || ""}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            aria-label="Filter from date"
          />
          <input
            type="date"
            value={filters.to || ""}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            aria-label="Filter to date"
          />
          <select
            value={filters.category || ""}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <button className="ghost-button" onClick={() => onFilterChange({})}>
            Clear
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="muted">
                  Loading...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No transactions yet. Add one manually or upload a receipt.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id || `${tx.date}-${tx.description}`}>
                  <td>{formatDate(tx.date)}</td>
                  <td>{tx.description || "—"}</td>
                  <td>
                    <span className="pill">{tx.category}</span>
                  </td>
                  <td className="numeric">{formatCurrency(tx.amount, tx.currency)}</td>
                  <td>{tx.paymentMethod}</td>
                  <td>{tx.source}</td>
                  <td>
                    <div className="table-actions">
                      <button className="link-button" onClick={() => onEdit?.(tx)}>
                        Edit
                      </button>
                      <button
                        className="link-button danger"
                        onClick={() => onDelete?.(tx)}
                        aria-label="Delete transaction"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
