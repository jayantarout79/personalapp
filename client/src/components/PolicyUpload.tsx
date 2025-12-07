import { useState, type ChangeEvent } from "react";
import { api } from "../api";
import type { Policy } from "../types";

type PolicyUploadProps = {
  onCreated: (policies: Policy[]) => Promise<void> | void;
  onMessage: (message: string, tone?: "success" | "error" | "info") => void;
};

export function PolicyUpload({ onCreated, onMessage }: PolicyUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    setUploading(true);
    setFileName(files.map((f) => f.name).join(", "));

    try {
      const policiesToSave: Policy[] = [];
      for (const file of files) {
        const extracted = await api.extractPolicy(file);
        for (const policy of extracted) {
          policiesToSave.push({
            ...policy,
            policyName: policy.policyName || policy.policyType || "Policy",
            provider: policy.provider || "Unknown provider",
            policyType: policy.policyType || "Other",
            premiumAmount: Number(policy.premiumAmount) || 0,
            currency: policy.currency || "USD",
            paymentFrequency: policy.paymentFrequency || "Monthly",
            nextPaymentDate: policy.nextPaymentDate || new Date().toISOString().slice(0, 10),
            source: "Policy AI",
          });
        }
      }
      if (policiesToSave.length) {
        await onCreated(policiesToSave);
        onMessage(
          `Saved ${policiesToSave.length} policy${policiesToSave.length === 1 ? "" : "ies"} from upload.`,
          "success"
        );
      } else {
        onMessage("No policies found in the files.", "info");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to read policy files.";
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
          <p className="eyebrow">Policy upload</p>
          <h3>Upload image → AI draft</h3>
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
          {uploading ? "Reading..." : "Upload file(s)"}
        </label>
        <div className="upload-copy">
          <p>Drop clear insurance photos. AI will capture renewal and premium details.</p>
          {fileName && <small className="hint">Last file: {fileName}</small>}
        </div>
      </div>
    </div>
  );
}
