import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends a catalogue request to the same enquiries inbox the sales team already works from.
const NewsletterSection = () => {
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setErrorMessage("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage("Enter your work email to receive the catalogue.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus("error");
      setErrorMessage("Check the email address. It should look like name@company.com.");
      return;
    }

    setStatus("loading");
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: trimmed,
          category: "Catalogue request",
          notes: "Requested the corporate gifting catalogue from the home page.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.message || "The request didn't go through. Try again in a moment.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
    }
  };

  return (
    <section className="newsletter-editorial-section" aria-labelledby="newsletter-title">
      <div className="container">
        <div className="newsletter-editorial-card">
          <h2 id="newsletter-title" className="newsletter-headline title">
            Get the corporate catalogue
          </h2>
          <p className="newsletter-subtext">
            Tell us where to send it. Our team emails the current catalogue with volume pricing,
            usually within two working hours.
          </p>

          {status === "success" ? (
            <div className="newsletter-success-state" role="status">
              <div className="success-icon">
                <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
              </div>
              <h3 className="success-title">Request received</h3>
              <p className="success-desc">
                We&apos;ll send the catalogue to <strong>{email.trim()}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setEmail("");
                }}
                className="btn-luxury btn-outline"
                style={{ marginTop: "16px" }}
              >
                Send to another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter-form-editorial" noValidate>
              <div className="newsletter-input-group">
                <div className="newsletter-input-wrapper">
                  <i className="fa-regular fa-envelope input-icon" aria-hidden="true"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="name@company.com"
                    className={`newsletter-input ${status === "error" ? "input-error" : ""}`}
                    aria-label="Work email"
                    aria-invalid={status === "error"}
                    aria-describedby={status === "error" ? "newsletter-error" : undefined}
                    autoComplete="email"
                    disabled={status === "loading"}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-luxury btn-primary newsletter-submit-btn"
                >
                  {status === "loading" ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Sending…
                    </>
                  ) : (
                    "Send me the catalogue"
                  )}
                </button>
              </div>

              {status === "error" && (
                <p id="newsletter-error" className="newsletter-error-text" role="alert">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {errorMessage}
                </p>
              )}

              <p className="newsletter-privacy-note">
                We only use your email to send the catalogue and follow up on this request.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
