import { useState, type ChangeEvent } from "react";

type ImageUploadProps = {
  onUpload: (files: File[]) => Promise<void>;
  onMessage: (message: string, tone?: "success" | "error" | "info") => void;
  busy?: boolean;
};

export function ImageUpload({ onUpload, onMessage, busy }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    setUploading(true);
    setFileName(files.map((file) => file.name).join(", "));

    try {
      await onUpload(files);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to read image.";
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
          <p className="eyebrow">Image upload</p>
          <h3>Upload receipt → Auto save</h3>
        </div>
      </div>
      <div className="upload-zone">
        <label className="upload-button">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
            multiple
            disabled={uploading || busy}
          />
          {uploading || busy ? "Reading..." : "Upload image(s)"}
        </label>
        <div className="upload-copy">
          <p>Drop one or more receipts. AI will read and save transactions automatically.</p>
          {fileName && <small className="hint">Last file: {fileName}</small>}
        </div>
      </div>
    </div>
  );
}
