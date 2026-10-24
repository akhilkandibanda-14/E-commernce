import { useId, useRef, useState } from "react";
import { getAdminApiUrl } from "../../utils/apiConfig";
import { useAuth } from "../../context/AuthContext";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Image picker for admin editors: paste a URL or upload from the device.
 * Uploads go to POST /api/upload and the returned /uploads/... URL is saved.
 */
const ImageField = ({ label, value, onChange, hint }) => {
  const { token } = useAuth();
  const inputId = useId();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (PNG, JPG, WEBP, GIF or SVG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 15 MB.`);
      return;
    }
    setError("");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch(getAdminApiUrl("/api/upload"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image: e.target.result, fileName: file.name }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.url) {
          onChange(data.url);
        } else {
          setError(data.message || "Upload failed. Try again, or paste an image URL instead.");
        }
      } catch {
        setError("Couldn't reach the server to upload. Check your connection and try again.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setError("Couldn't read that file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="form-group gw-image-field">
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="gw-image-field-row">
        <div className="gw-image-field-preview" aria-hidden="true">
          {value ? <img src={value} alt="" /> : <i className="fa-regular fa-image"></i>}
        </div>
        <div className="gw-image-field-controls">
          <input
            id={inputId}
            type="text"
            className="form-input"
            value={value || ""}
            placeholder="https://… or /uploads/…"
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="gw-image-field-actions">
            <button
              type="button"
              className="btn-admin-outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <i className={uploading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-upload"} aria-hidden="true"></i>{" "}
              {uploading ? "Uploading…" : "Upload from device"}
            </button>
            {value && (
              <button type="button" className="btn-admin-outline" onClick={() => onChange("")}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => upload(e.target.files?.[0])}
          />
          {hint && <p className="gw-image-field-hint">{hint}</p>}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageField;
