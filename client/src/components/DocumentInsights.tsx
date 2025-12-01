import type { Document } from "../types";
import { formatDate } from "../utils";

type DocumentInsightsProps = {
  documents: Document[];
  windowMonths: number;
};

export function DocumentInsights({ documents, windowMonths }: DocumentInsightsProps) {
  const now = new Date();
  const limit = new Date();
  limit.setMonth(limit.getMonth() + windowMonths);

  const expiring = documents
    .filter((doc) => {
      if (!doc.expirationDate) return false;
      const dt = new Date(doc.expirationDate);
      return dt >= now && dt <= limit;
    })
    .slice(0, 5);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Expiring soon</p>
          <h3>Next {windowMonths} months</h3>
        </div>
      </div>
      {expiring.length === 0 ? (
        <p className="muted">No documents expiring in this window.</p>
      ) : (
        <ul className="doc-list">
          {expiring.map((doc) => (
            <li key={doc.id || doc.title}>
              <div>
                <strong>{doc.title}</strong> <span className="muted">({doc.docType || "Type?"})</span>
              </div>
              <div className="muted">Expires {formatDate(doc.expirationDate)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
