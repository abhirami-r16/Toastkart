import React from "react";
import { MapPin, Mail, Phone } from "lucide-react";

export default function HomeContact() {
  return (
    <section id="contact" className="py-5 bg-white">
      <div className="container-xl" style={{ maxWidth: 1000 }}>
        <div className="text-center mb-5">
          <div className="goslot-eyebrow">Contact Us</div>
          <h2 className="fs-2 fw-bolder mb-3">Get in Touch</h2>
          <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 600 }}>
            Have questions or need help setting up your store? Reach out to our team.
          </p>
        </div>
        <div className="row g-4 justify-content-center text-center">
          {/* Address */}
          <div className="col-12 col-md-4">
            <div className="goslot-card glow-on-hover h-100 p-4 p-xl-5" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
              <MapPin size={40} className="mb-3 icon-float" style={{ color: "var(--primary)" }} />
              <h3 className="fs-5 fw-bold mb-3">Address</h3>
              <p className="fs-6 text-muted mb-0">
                Webtoast<br />
                inQ Tower, 1st floor<br />
                Opp EMC NH Bypass<br />
                Palarivattom, Kochi, Kerala 682025
              </p>
            </div>
          </div>
          {/* Email */}
          <div className="col-12 col-md-4">
            <div className="goslot-card glow-on-hover h-100 p-4 p-xl-5" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Mail size={40} className="mb-3 icon-float" style={{ color: "var(--primary)" }} />
              <h3 className="fs-5 fw-bold mb-3">Email Support</h3>
              <p className="fs-6 text-muted mb-4">
                Send us an email and our support team will get back to you within 24 hours.
              </p>
              <a href="mailto:business@webtoast.in" className="fw-bold text-decoration-none" style={{ color: "var(--primary)" }}>
                business@webtoast.in
              </a>
            </div>
          </div>
          {/* Phone */}
          <div className="col-12 col-md-4">
            <div className="goslot-card glow-on-hover h-100 p-4 p-xl-5" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Phone size={40} className="mb-3 icon-float" style={{ color: "var(--primary)" }} />
              <h3 className="fs-5 fw-bold mb-3">Phone</h3>
              <p className="fs-6 text-muted mb-4">
                Call us directly for immediate assistance during business hours.
              </p>
              <a href="tel:9526706406" className="fw-bold text-decoration-none" style={{ color: "var(--primary)" }}>
                9526706406
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
