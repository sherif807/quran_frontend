import Script from "next/script";
import Header from "../components/Header";
import ContactForm from "./ContactForm";

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return (
    <div className="py-4" dir="ltr">
      <Header />
      {siteKey ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      ) : null}
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <ContactForm siteKey={siteKey} />
        </div>
      </div>
    </div>
  );
}
