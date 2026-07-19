export default function LoadingSearchSuggestPage() {
  return (
    <div className="py-3">
      <div className="mb-3">
        <h4 className="mb-1">Search results</h4>
        <div className="text-muted small">Loading full results…</div>
      </div>

      <div className="alert alert-light border" role="status" aria-live="polite">
        Fetching matching verses…
      </div>

      <div className="card mb-3">
        <div className="card-header">
          <span className="placeholder-glow d-block">
            <span className="placeholder col-3" />
          </span>
        </div>
        <div className="card-body" style={{ backgroundColor: "#f7f2d1" }}>
          <div className="placeholder-glow">
            <span className="placeholder col-10 mb-2" />
            <span className="placeholder col-8 mb-2" />
            <span className="placeholder col-9 mb-2" />
            <span className="placeholder col-7" />
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">
          <span className="placeholder-glow d-block">
            <span className="placeholder col-3" />
          </span>
        </div>
        <div className="card-body" style={{ backgroundColor: "#f7f2d1" }}>
          <div className="placeholder-glow">
            <span className="placeholder col-9 mb-2" />
            <span className="placeholder col-11 mb-2" />
            <span className="placeholder col-8 mb-2" />
            <span className="placeholder col-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
