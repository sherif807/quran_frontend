"use client";

import React from "react";

export default class ContactErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    // Log to console for debugging in case the overlay is suppressed.
    // eslint-disable-next-line no-console
    console.error("Contact page error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-4" dir="ltr">
          <div className="alert alert-danger" role="alert">
            Contact page failed to render:{" "}
            {this.state.error?.message || "Unknown error"}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
