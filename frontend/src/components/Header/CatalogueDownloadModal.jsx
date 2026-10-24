import { useEffect, useRef, useState } from "react";
import { CATALOGUES_LIST, CONTACT_INFO } from "../../data/navigationData";
import { useAuth } from "../../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Catalogues are sent by the sales team, so each request is logged as an enquiry.
const CatalogueDownloadModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [email, setEmail] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [requested, setRequested] = useState({});
  const [error, setError] = useState("");
  const emailRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (user?.email) setEmail((prev) => prev || user.email);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    emailRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, user, onClose]);

  if (!isOpen) return null;

  const handleRequest = async (catalog) => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Enter a valid work email so we know where to send the catalogue.");
      emailRef.current?.focus();
      return;
    }
    setError("");
    setSendingId(catalog.id);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: trimmed,
          name: user?.name,
          category: `Catalogue request: ${catalog.title}`,
          notes: `Requested "${catalog.title}" from the catalogues menu.`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "The request didn't go through. Try again in a moment.");
        return;
      }
      setRequested((prev) => ({ ...prev, [catalog.id]: true }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div
        className="catalogue-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalogue-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close catalogues"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>

        <div className="catalogue-modal-header">
          <h2 id="catalogue-modal-title">Request a catalogue</h2>
          <p>
            Choose a catalogue and we&apos;ll email it to you with specifications, colour options and
            minimum order quantities.
          </p>
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label htmlFor="catalogue-email">Work email</label>
            <input
              id="catalogue-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "catalogue-email-error" : undefined}
            />
            {error && (
              <p id="catalogue-email-error" className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <ul className="catalogues-modal-list">
          {CATALOGUES_LIST.map((catalog) => {
            const isSending = sendingId === catalog.id;
            const isRequested = requested[catalog.id];

            return (
              <li key={catalog.id} className="catalogue-item-card">
                <div className="catalogue-file-icon" aria-hidden="true">
                  <i className={catalog.icon}></i>
                </div>

                <div className="catalogue-file-info">
                  <h3 className="catalogue-item-title">{catalog.title}</h3>
                  <p className="catalogue-item-sub">{catalog.subtitle}</p>
                </div>

                <div className="catalogue-file-action">
                  <button
                    type="button"
                    onClick={() => handleRequest(catalog)}
                    disabled={isSending || isRequested}
                    className={`btn-catalogue-download ${isRequested ? "downloaded" : ""}`}
                  >
                    {isSending ? (
                      <span>
                        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…
                      </span>
                    ) : isRequested ? (
                      <span>
                        <i className="fa-solid fa-check" aria-hidden="true"></i> Requested
                      </span>
                    ) : (
                      <span>Email me this</span>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="catalogue-modal-footer">
          <div className="catalogue-whatsapp-box">
            <i className="fa-brands fa-whatsapp whatsapp-icon" aria-hidden="true"></i>
            <div>
              <strong>Prefer WhatsApp?</strong>
              <p>Message us and we&apos;ll send the catalogues to your phone.</p>
            </div>
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^0-9]/g, "")}?text=Please%20send%20me%20the%20complete%20Corporate%20Gifting%20Catalogues%20PDF`}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp-cat-link"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogueDownloadModal;
