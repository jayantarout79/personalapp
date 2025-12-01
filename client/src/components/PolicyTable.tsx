import type { Policy } from "../types";
import { formatCurrency, formatDate } from "../utils";

type PolicyTableProps = {
  policies: Policy[];
  loading?: boolean;
  onEdit?: (policy: Policy) => void;
  onDelete?: (policy: Policy) => void;
};

export function PolicyTable({ policies, loading, onEdit, onDelete }: PolicyTableProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Policy Tracker</p>
          <h3>Premium & renewal board</h3>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Provider</th>
              <th>Type</th>
              <th>Next payment</th>
              <th>Premium</th>
              <th>Frequency</th>
              <th>Notes</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="muted">
                  Loading...
                </td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan={9} className="muted">
                  No policies tracked yet.
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.id || policy.policyNumber || policy.policyName}>
                  <td>{policy.policyName}</td>
                  <td>{policy.provider}</td>
                  <td>{policy.policyType || "—"}</td>
                  <td>{formatDate(policy.nextPaymentDate)}</td>
                  <td className="numeric">{formatCurrency(policy.premiumAmount, policy.currency)}</td>
                  <td>{policy.paymentFrequency}</td>
                  <td>{policy.notes || "—"}</td>
                  <td>{policy.source || "Manual"}</td>
                  <td>
                    <div className="table-actions">
                      <button className="link-button" onClick={() => onEdit?.(policy)}>
                        Edit
                      </button>
                      <button className="link-button danger" onClick={() => onDelete?.(policy)}>
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
