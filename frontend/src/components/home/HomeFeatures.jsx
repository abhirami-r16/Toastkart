import React from "react";
import { Store, DollarSign, ShieldCheck, ShoppingCart } from "lucide-react";

export default function HomeFeatures() {
  return (
    <section id="features" className="py-5 my-5">
      <div className="container-xl">
        <div className="text-center mb-5 pb-4">
          <div className="goslot-eyebrow">Enterprise Grade</div>
          <h2 className="display-5 fw-bolder mb-3" style={{ letterSpacing: '-0.02em' }}>Everything you need to scale</h2>
          <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 600 }}>Powerful tools engineered to help you manage products, process orders, and grow revenue on autopilot.</p>
        </div>
        <div className="row g-4 pt-2">
          {[
            { icon: Store, title: "Custom Storefronts", desc: "Merchants get branded subdomains, unlimited catalogs, and conversion-optimized checkout flows." },
            { icon: DollarSign, title: "Automated Payouts", desc: "Split payments seamlessly. Instant merchant commissions routed directly to linked bank accounts." },
            { icon: ShieldCheck, title: "Enterprise Security", desc: "Rest easy with bank-grade 256-bit SSL encryption, PCI compliance, and full transaction audit logs." },
            { icon: ShoppingCart, title: "Unified Cart System", desc: "Shoppers can effortlessly buy from multiple vendors in a single, lightning-fast checkout flow." }
          ].map((f, i) => (
            <div key={i} className="col-12 col-md-6 col-lg-3">
              <div className="goslot-card glow-on-hover h-100 d-flex flex-column p-4" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4 shadow-sm" style={{ width: 64, height: 64, background: "linear-gradient(135deg, rgba(255,87,34,0.12), rgba(255,87,34,0.03))", color: "var(--primary)" }}>
                  <f.icon size={32} className="icon-float" />
                </div>
                <h3 className="fs-4 fw-bold mb-3">{f.title}</h3>
                <p className="fs-6 text-muted mb-0" style={{ lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
