"use client";

import { useMemo, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export default function ContactForm({ siteKey }) {
  const startedAtRef = useRef(Date.now());
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUseCaptcha = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(siteKey);
  }, [siteKey]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setStatus(null);

    if (!siteKey) {
      setStatus({ type: "error", message: "reCAPTCHA is not configured." });
      return;
    }

    if (!window.grecaptcha || typeof window.grecaptcha.execute !== "function") {
      setStatus({ type: "error", message: "reCAPTCHA is still loading." });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await window.grecaptcha.execute(siteKey, {
        action: "contact",
      });

      const formData = new FormData(event.currentTarget);
      const payload = Object.fromEntries(formData.entries());

      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          startedAt: startedAtRef.current,
          captchaToken: token,
          captchaAction: "contact",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus({ type: "success", message: "Message sent. Thank you!" });
      event.currentTarget.reset();
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to send message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h3 className="mb-3">Contact Us</h3>
        <p className="text-muted mb-4">
          Send us a message and we will get back to you.
        </p>
        {!siteKey && (
          <div className="alert alert-warning" role="alert">
            reCAPTCHA site key is missing.
          </div>
        )}
        {status && (
          <div
            className={`alert ${
              status.type === "success" ? "alert-success" : "alert-danger"
            }`}
            role="alert"
          >
            {status.message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="small text-muted mb-1">Name</label>
            <input
              className="form-control"
              type="text"
              name="name"
              placeholder="Your name"
            />
          </div>
          <div className="form-group contact-honeypot">
            <label className="small text-muted mb-1">Website</label>
            <input
              className="form-control"
              type="text"
              name="website"
              autoComplete="off"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label className="small text-muted mb-1">Email</label>
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="small text-muted mb-1">Subject</label>
            <input
              className="form-control"
              type="text"
              name="subject"
              placeholder="Subject"
            />
          </div>
          <div className="form-group">
            <label className="small text-muted mb-1">Message</label>
            <textarea
              className="form-control"
              rows="6"
              name="message"
              placeholder="Write your message..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send message"}
          </button>
          <a className="btn btn-sm btn-outline-secondary ml-2" href="/">
            Back
          </a>
        </form>
        {canUseCaptcha && (
          <p className="small text-muted mt-3 mb-0">
            This site is protected by reCAPTCHA and the Google Privacy Policy and
            Terms of Service apply.
          </p>
        )}
      </div>
    </div>
  );
}
