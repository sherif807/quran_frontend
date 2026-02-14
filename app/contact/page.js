import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <>
      <nav className="navbar navbar-light bg-light mb-3 sticky-top shadow-sm">
        <div className="d-flex w-100 align-items-center justify-content-between">
          <a className="navbar-brand mb-0" href="/1">
            Quranalive
          </a>
          <a className="btn btn-sm btn-outline-secondary" href="/">
            Back
          </a>
        </div>
      </nav>
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="mb-0">Contact Us</h3>
              <a className="btn btn-sm btn-outline-secondary" href="/">
                Back
              </a>
            </div>
            <p className="text-muted mb-4">
              Send us a message and we will get back to you.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
