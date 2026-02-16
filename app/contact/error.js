"use client";

export default function ContactError({ error, reset }) {
  return (
    <div className="container py-4" dir="ltr">
      <div className="alert alert-danger" role="alert">
        Contact page error: {error?.message || "Unknown error"}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
