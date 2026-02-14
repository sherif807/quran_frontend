"use client";

import { useState } from "react";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4317/api";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startedAt }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to send message.");
      }
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {success && (
        <div className="alert alert-success" role="alert">
          Message sent. Thank you!
          <div className="mt-2">
            <a className="btn btn-sm btn-outline-secondary" href="/">
              Back
            </a>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="form-group">
          <label className="small text-muted mb-1">Name</label>
          <input
            className="form-control"
            type="text"
            value={form.name}
            onChange={update("name")}
            placeholder="Your name"
          />
        </div>
        <div className="form-group contact-honeypot">
          <label className="small text-muted mb-1">Website</label>
          <input
            className="form-control"
            type="text"
            value={form.website}
            onChange={update("website")}
            autoComplete="off"
            tabIndex={-1}
          />
        </div>
        <div className="form-group">
          <label className="small text-muted mb-1">Email</label>
          <input
            className="form-control"
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label className="small text-muted mb-1">Subject</label>
          <input
            className="form-control"
            type="text"
            value={form.subject}
            onChange={update("subject")}
            placeholder="Subject"
          />
        </div>
        <div className="form-group">
          <label className="small text-muted mb-1">Message</label>
          <textarea
            className="form-control"
            rows="6"
            value={form.message}
            onChange={update("message")}
            placeholder="Write your message..."
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Sending..." : "Send message"}
        </button>
      </form>
    </>
  );
}
