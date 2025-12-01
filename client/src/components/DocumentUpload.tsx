import { useState, type ChangeEvent } from "react";
import { api } from "../api";
import type { Document } from "../types";

type DocumentUploadProps = {
  onCreated: (docs: Document[]) => Promise<void> | void;
  onMessage: (message: string, tone?: "success" | "error" | "info") => void;
};

export function DocumentUpload({ onCreated, onMessage }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    setUploading(true);
    setFileName(files.map((f) => f.name).join(", "));

    try {
      let saved = 0;
      const docsToSave: Document[] = [];
      for (const file of files) {
        const extracted = await api.extractDocument(file);
        for (const doc of extracted) {
          const payload: Document = {
            ...doc,
            title: doc.title || doc.docType || "Document",
            docType: doc.docType || "Other",
            source: "Image AI",
          };
          docsToSave.push(payload);
        }
      }
      if (docsToSave.length) {
        await onCreated(docsToSave);
        saved = docsToSave.length;
      }
      onMessage(
        saved ? `Saved ${saved} document${saved === 1 ? "" : "s"} from upload.` : "No documents found.",
        saved ? "success" : "info"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to read document image.";
      onMessage(message, "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Document upload</p>
          <h3>Upload → AI expiry draft</h3>
        </div>
      </div>
      <div className="upload-zone">
        <label className="upload-button">
          <input
            type="file"
            accept="image/*"
            hidden
            multiple
            disabled={uploading}
            onChange={handleFileChange}
          />
          {uploading ? "Reading..." : "Upload image(s)"}
        </label>
        <div className="upload-copy">
          <p>Drop passport/visa/license screenshots. AI will capture expiry.</p>
          {fileName && <small className="hint">Last file: {fileName}</small>}
        </div>
      </div>
    </div>
  );
}
