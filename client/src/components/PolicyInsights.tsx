import type { PolicyInsightSummary } from "../types";
import { formatCurrency, formatDate } from "../utils";

type PolicyInsightsProps = {
  insights: PolicyInsightSummary | null;
  loading?: boolean;
};

export function PolicyInsights({ insights, loading }: PolicyInsightsProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Policy insights</p>
            <h3>Next payment</h3>
          </div>
        </div>
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!insights || insights.total === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Policy insights</p>
            <h3>Next payment</h3>
          </div>
        </div>
        <p className="muted">Add a policy to see the next payment reminder.</p>
      </div>
    );
  }

  const dueSoon = insights.dueSoon.slice(0, 4);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Policy insights</p>
          <h3>Next payment</h3>
        </div>
      </div>
      {insights.nextPayment ? (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card__label">Upcoming</div>
            <div className="summary-card__value">{insights.nextPayment.policyName}</div>
            <div className="muted">
              {insights.nextPayment.provider} · Due {formatDate(insights.nextPayment.date)}
            </div>
            <div className="summary-card__meta">
              {formatCurrency(insights.nextPayment.amount, insights.nextPayment.currency)} ·{" "}
              {insights.nextPayment.paymentFrequency}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Due within 30 days</div>
            <div className="summary-card__value">{insights.dueSoonCount}</div>
            <div className="muted">Policies with payments this month</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Tracked policies</div>
            <div className="summary-card__value">{insights.total}</div>
            <div className="muted">In your Policy Tracker</div>
          </div>
        </div>
      ) : (
        <p className="muted">No upcoming payment dates found.</p>
      )}

      {dueSoon.length > 0 && (
        <div>
          <h4>Due soon</h4>
          <ul className="doc-list">
            {dueSoon.map((policy) => (
              <li key={policy.id || policy.policyNumber || policy.policyName}>
                <div>
                  <strong>{policy.policyName}</strong>{" "}
                  <span className="muted">({policy.provider})</span>
                </div>
                <div className="muted">
                  {formatCurrency(policy.premiumAmount, policy.currency)} · {policy.paymentFrequency} ·{" "}
                  Due {formatDate(policy.nextPaymentDate)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
