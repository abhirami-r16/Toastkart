import React from "react";

export default function HomeAbout() {
  return (
    <section id="about" className="py-5 bg-white">
      <div className="container-xl" style={{ maxWidth: 900 }}>
        <div className="text-center mb-5">
          <div className="goslot-eyebrow">About ToastKart</div>
          <h2 className="display-6 fw-bolder mb-4">Build. Sell. Grow.</h2>

          <p className="fs-5 text-muted mb-4">
            ToastKart is a simple and powerful e-commerce platform designed to help businesses create, manage, and grow their online stores without the complexity.
          </p>
          <p className="fs-6 text-muted mb-4">
            Whether you're starting your first online business or expanding an existing brand, ToastKart gives you the tools you need to build a professional online store, showcase your products, manage orders, and reach your customers—all in one place.
          </p>
          <p className="fs-6 text-muted mb-5">
            We believe creating an online store should be <strong className="text-dark">simple, affordable, and accessible to everyone</strong>. That's why ToastKart is built with an easy-to-use interface and practical features that let you focus on what matters most: <strong className="text-dark">growing your business</strong>.
          </p>
        </div>

        <div className="p-5 rounded-4 text-center mt-4" style={{ background: "linear-gradient(135deg, rgba(255,87,34,0.08), rgba(255,87,34,0.02))", border: "1px solid rgba(255,87,34,0.15)" }}>
          <h3 className="fs-4 fw-bold mb-3" style={{ color: "var(--primary)" }}>Our Mission</h3>
          <p className="fs-5 mb-4 text-dark mx-auto" style={{ maxWidth: 700, lineHeight: 1.6 }}>
            Our mission is to empower entrepreneurs and businesses with simple technology that makes selling online easier.
          </p>
          <div className="fw-bolder fs-5" style={{ color: "var(--primary)" }}>
            Your business. Your store. Your growth. Powered by ToastKart.
          </div>
        </div>
      </div>
    </section>
  );
}
