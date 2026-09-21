import React from "react";

export default function HomeTemplates() {
  return (
    <section id="templates" className="py-5 position-relative" style={{ 
      background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)',
      overflow: 'hidden'
    }}>
      <div className="position-absolute rounded-circle" style={{ width: 400, height: 400, background: 'rgba(255, 87, 34, 0.15)', top: -100, right: -100, filter: 'blur(60px)' }}></div>
      <div className="position-absolute rounded-circle" style={{ width: 600, height: 600, background: 'rgba(255, 152, 0, 0.15)', bottom: -200, left: -200, filter: 'blur(80px)' }}></div>
      <div className="position-absolute w-100 h-100" style={{ top: 0, left: 0, background: 'radial-gradient(circle at center, transparent 30%, rgba(255, 255, 255, 0.3) 100%)', pointerEvents: 'none' }}></div>
      <div className="container-xl position-relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-5">
          <div className="goslot-eyebrow">Stunning Templates</div>
          <h2 className="fs-2 mb-3">Launch With Beautiful Themes</h2>
          <p className="fs-6 text-muted mx-auto" style={{ maxWidth: 600 }}>Choose from our collection of premium, conversion-optimized themes tailored specifically for your industry.</p>
        </div>
        <div className="d-flex flex-column pt-4">
          {[
            { title: "Fashion Theme", url: "https://themewagon.github.io/eflyer/", img: null, desc: "Vibrant and modern aesthetic for apparel and boutiques." },
            { title: "Beauty & Cosmetics", url: null, img: "/beauty-template.webp", desc: "Elegant and clean layouts for skincare and makeup brands." },
            { title: "Home & Living", url: "https://themewagon.github.io/aranoz/", img: null, desc: "Warm and inviting design for furniture and home decor stores." },
            { title: "Jewelry & Luxury", url: null, img: "/jewelry-template.webp", desc: "Premium, luxurious aesthetic for fine jewelry and accessories." }
          ].map((t, i) => (
            <div key={i} className={`row align-items-center mb-5 pb-4`}>
              <div className={`col-12 col-lg-7 ${i % 2 !== 0 ? 'order-lg-2' : ''}`}>
                <div className="template-iframe-container">
                  {t.url ? (
                    <iframe
                      src={t.url}
                      title={t.title}
                      className="template-iframe"
                    />
                  ) : (
                    <img src={t.img} alt={t.title} className="w-100 h-100" style={{ objectFit: 'cover' }} loading="lazy" decoding="async" />
                  )}
                </div>
              </div>
              <div className={`col-12 col-lg-5 mt-4 mt-lg-0 ${i % 2 !== 0 ? 'order-lg-1 pe-lg-5' : 'ps-lg-5'}`}>
                <h3 className="display-5 fw-bold mb-3">{t.title}</h3>
                <p className="fs-5 text-muted mb-4">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
