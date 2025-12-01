import type { Document } from "../types";
import { formatDate } from "../utils";

type DocumentTableProps = {
  documents: Document[];
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  loading?: boolean;
};

export function DocumentTable({ documents, onEdit, onDelete, loading }: DocumentTableProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Document Tracker</p>
          <h3>Expiry watchlist</h3>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Expires</th>
              <th>Number</th>
              <th>Notes</th>
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
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No documents tracked yet.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id || doc.title}>
                  <td>{doc.title}</td>
                  <td>{doc.docType || "—"}</td>
                  <td>{formatDate(doc.expirationDate)}</td>
                  <td>{doc.number || "—"}</td>
                  <td>{doc.notes || "—"}</td>
                  <td>{doc.source}</td>
                  <td>
                    <div className="table-actions">
                      <button className="link-button" onClick={() => onEdit?.(doc)}>
                        Edit
                      </button>
                      <button className="link-button danger" onClick={() => onDelete?.(doc)}>
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
