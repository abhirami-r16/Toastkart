import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CreditCard,
  RotateCcw,
  FileText,
  Lock,
  Briefcase,
  Heart,
  Sparkles,
  Globe,
  Award,
  CheckCircle2,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ThemeCoconutContentPages({ page, storeData }) {
  const location = useLocation();

  // Scroll to top on page mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Determine base path for home link
  const getBasePath = () => {
    const p = window.location.pathname;
    const match = p.match(/^(\/store\/[^/]+)/);
    if (match) return match[1];
    if (p.startsWith('/storefront')) return '/storefront';
    return '';
  };
  const basePath = getBasePath();

  // Contact Information Constants
  const CONTACT = {
    brand: "AMIORA",
    company: "LA EMVITHA",
    fullTitle: "AMIORA – LA EMVITHA",
    phone: "+91 8289988076",
    phoneTel: "+918289988076",
    whatsappUrl: "https://wa.me/918289988076",
    emailPrimary: "business@amiora.in",
    emailSecondary: "lamvitha@gmail.com",
    website: "https://cocoamiora.com",
    addressLines: [
      "14/97, Cherukunnam,",
      "Asamannoor P.O.,",
      "Perumbavoor, Ernakulam District,",
      "Kerala – 683549, India."
    ],
    supportHours: "Monday to Saturday, 10:00 AM to 6:00 PM IST"
  };

  return (
    <div className="coconut-content-page-wrapper" style={{ backgroundColor: '#FDFBF7', minHeight: '85vh', paddingBottom: '4rem' }}>
      {/* Professional Breadcrumb & Back Bar */}
      <div className="coconut-breadcrumb-bar py-3" style={{ borderBottom: '1px solid rgba(20, 39, 28, 0.08)', backgroundColor: '#FAF7F0' }}>
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
          <Link
            to={basePath || '/'}
            className="d-inline-flex align-items-center gap-2 text-decoration-none px-3 py-1 rounded-pill shadow-xs"
            style={{
              backgroundColor: '#ffffff',
              color: '#14271C',
              border: '1px solid #D5CEBF',
              fontSize: '0.86rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Shop</span>
          </Link>

          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
              <li className="breadcrumb-item">
                <Link to={basePath || '/'} className="text-decoration-none" style={{ color: '#6B7280' }}>
                  Home
                </Link>
              </li>
              <li className="breadcrumb-item">
                <span style={{ color: '#9CA3AF' }}>LA EMVITHA</span>
              </li>
              <li className="breadcrumb-item active fw-bold" aria-current="page" style={{ color: '#14271C', textTransform: 'capitalize' }}>
                {page.replace(/-/g, ' ')}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container my-5">
        {page === 'contact' && <ContactPage CONTACT={CONTACT} basePath={basePath} />}
        {page === 'about' && <AboutPage CONTACT={CONTACT} basePath={basePath} />}
        {page === 'careers' && <CareersPage CONTACT={CONTACT} basePath={basePath} />}
        {(page === 'payment-info' || page === 'payments') && <PaymentPage CONTACT={CONTACT} basePath={basePath} />}
        {(page === 'shipping-policy' || page === 'shipping') && <ShippingPage CONTACT={CONTACT} basePath={basePath} />}
        {(page === 'terms' || page === 'terms-of-service') && <TermsPage CONTACT={CONTACT} basePath={basePath} />}
        {(page === 'refund-policy' || page === 'refunds') && <RefundPage CONTACT={CONTACT} basePath={basePath} />}
        {(page === 'privacy-policy' || page === 'privacy') && <PrivacyPage CONTACT={CONTACT} basePath={basePath} />}
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 1 – CONTACT US
   ========================================================================= */
function ContactPage({ CONTACT }) {
  return (
    <div className="coconut-page-container">
      <div className="text-center mb-5">
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
          AMIORA – LA EMVITHA
        </div>
        <h1 className="fw-bold display-5 mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          Contact Us
        </h1>
        <p className="lead text-muted mx-auto mb-0" style={{ maxWidth: '650px', fontSize: '1.05rem' }}>
          We are here to assist you with order inquiries, product guidance, bulk orders, and customer support.
        </p>
      </div>

      <div className="row justify-content-center">
        {/* Official Contact Details Card */}
        <div className="col-lg-7 col-md-9">
          <div className="p-4 p-md-5 rounded-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-4 pb-2 border-bottom" style={{ color: '#14271C' }}>Official Contact Details</h4>

            {/* Store & Office Address */}
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <MapPin size={24} />
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#14271C' }}>Store & Office Address</h6>
                <p className="mb-0 text-muted" style={{ lineHeight: '1.6' }}>
                  {CONTACT.addressLines.map((line, idx) => (
                    <span key={idx}>{line}<br /></span>
                  ))}
                </p>
              </div>
            </div>

            {/* Phone & WhatsApp Support */}
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <Phone size={24} />
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#14271C' }}>Phone & WhatsApp Support</h6>
                <p className="mb-2">
                  <a href={`tel:${CONTACT.phoneTel}`} className="fw-bold text-decoration-none" style={{ color: '#14271C', fontSize: '1.05rem' }}>
                    {CONTACT.phone}
                  </a>
                </p>
                <a
                  href={CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-2 fw-semibold px-3 py-2 text-white"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={16} />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Email Addresses */}
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <Mail size={24} />
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#14271C' }}>Email Addresses</h6>
                <p className="mb-1">
                  <a href={`mailto:${CONTACT.emailPrimary}`} className="text-decoration-none fw-semibold" style={{ color: '#14271C' }}>
                    {CONTACT.emailPrimary}
                  </a>
                </p>
                <p className="mb-0">
                  <a href={`mailto:${CONTACT.emailSecondary}`} className="text-decoration-none fw-semibold" style={{ color: '#14271C' }}>
                    {CONTACT.emailSecondary}
                  </a>
                </p>
              </div>
            </div>

            {/* Official Website */}
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <Globe size={24} />
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#14271C' }}>Official Website</h6>
                <p className="mb-0">
                  <a
                    href={CONTACT.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fw-bold text-decoration-none d-inline-flex align-items-center gap-1"
                    style={{ color: '#C2844E', fontSize: '1.02rem' }}
                  >
                    {CONTACT.website}
                    <ExternalLink size={15} />
                  </a>
                </p>
              </div>
            </div>

            {/* Support Hours */}
            <div className="d-flex align-items-start gap-3">
              <div className="p-3 rounded-circle" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <Clock size={24} />
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#14271C' }}>Support Hours</h6>
                <p className="mb-0 text-muted">{CONTACT.supportHours}</p>
                <small className="text-success fw-semibold">Orders can be placed online 24/7</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 2 – ABOUT US
   ========================================================================= */
function AboutPage({ CONTACT }) {
  const products = [
    {
      title: "Cold-Pressed Extra Virgin Coconut Oil"
    },
    {
      title: "Coconut Oil"
    },
    {
      title: "Coconut Milk"
    },
    {
      title: "Desiccated Coconut Powder"
    }
  ];

  const missionPoints = [
    "To create premium-quality, naturally crafted food products rooted in purity and trust.",
    "To design jewellery and fashion that reflect grace, confidence, and refined individuality.",
    "To blend heritage craftsmanship with contemporary aesthetics in every creation.",
    "To grow sustainably and ethically while uplifting communities and empowering women.",
    "To consistently deliver excellence, integrity, and lasting value to customers worldwide."
  ];

  return (
    <div className="coconut-page-container">
      {/* Hero Header */}
      <div className="text-center mb-5">
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
          Kerala to Global
        </div>
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          About Us
        </h1>
        <h3 className="fw-semibold mb-2 coconut-subtitle-gold" style={{ color: '#C2844E' }}>
          AMIORA – Crafted with Care, Loved Everywhere
        </h3>
        <p className="lead fw-semibold text-muted mx-auto" style={{ maxWidth: '650px', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
          Kerala to Global
        </p>
      </div>

      {/* Main Introduction Story */}
      <div className="row g-4 align-items-stretch mb-5">
        <div className="col-lg-12">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="rounded-pill px-3 py-1 fw-bold" style={{ backgroundColor: '#E8F0EA', color: '#14271C', fontSize: '0.85rem' }}>
                🌴 Rooted in Kerala
              </span>
              <span className="rounded-pill px-3 py-1 fw-bold" style={{ backgroundColor: '#FDFBF7', color: '#8C5627', border: '1px solid #C2844E', fontSize: '0.85rem' }}>
                LA EMVITHA
              </span>
            </div>

            <p className="lead mb-4" style={{ color: '#14271C', lineHeight: '1.8', fontSize: '1.12rem' }}>
              <strong>AMIORA</strong>, a brand of <strong>LA EMVITHA</strong>, is a women-led entrepreneurial venture founded by three passionate women entrepreneurs with a shared vision of bringing the natural goodness and rich heritage of Kerala to customers across the world.
            </p>

            <p className="text-muted mb-4" style={{ lineHeight: '1.8', fontSize: '1.02rem' }}>
              Rooted in Kerala, the land of coconuts, we are committed to offering quality coconut-based products that reflect nature, purity, care and trust.
            </p>

            <p className="text-muted mb-0" style={{ lineHeight: '1.8', fontSize: '1.02rem' }}>
              At AMIORA, we believe that good products begin with good choices. We carefully select our products and work with trusted suppliers to maintain quality, consistency and customer satisfaction.
            </p>
          </div>
        </div>
      </div>

      {/* OUR PRODUCTS */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm mb-5" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <div className="text-center mb-4">
          <div className="text-uppercase fw-bold mb-1" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
            Pure & Authentic
          </div>
          <h2 className="fw-bold mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            OUR PRODUCTS
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '1.02rem' }}>
            Our product range includes:
          </p>
        </div>

        <div className="row g-3 justify-content-center mb-4">
          {products.map((item, idx) => (
            <div className="col-md-6 col-lg-3" key={idx}>
              <div
                className="p-3 p-md-4 rounded-4 text-center h-100 d-flex flex-column align-items-center justify-content-center"
                style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8F0EA', minHeight: '90px', transition: 'transform 0.2s ease' }}
              >
                <h6 className="fw-bold mb-0" style={{ color: '#14271C', fontSize: '1.02rem', lineHeight: '1.4' }}>{item.title}</h6>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-3 rounded-3" style={{ backgroundColor: '#E8F0EA' }}>
          <p className="mb-0 fw-medium" style={{ color: '#14271C', fontSize: '0.98rem' }}>
            We aim to bring the goodness of coconut from Kerala to global markets through quality products, attractive packaging and reliable service.
          </p>
        </div>
      </div>

      {/* VISION & MISSION */}
      <div className="row g-4 mb-5">
        {/* OUR VISION */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100 d-flex flex-column" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <Sparkles size={24} />
              </div>
              <h3 className="fw-bold mb-0 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
                OUR VISION
              </h3>
            </div>
            <p className="text-muted mb-0" style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
              To establish LA EMVITHA – AMIORA as an internationally respected lifestyle brand offering pure nourishment, sophisticated jewellery, and timeless fashion that elevate everyday living with elegance and authenticity.
            </p>
          </div>
        </div>

        {/* OUR MISSION */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100 d-flex flex-column" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: '#E8F0EA', color: '#14271C' }}>
                <Award size={24} />
              </div>
              <h3 className="fw-bold mb-0 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
                OUR MISSION
              </h3>
            </div>
            <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
              {missionPoints.map((point, idx) => (
                <li key={idx} className="d-flex align-items-start gap-3">
                  <div className="pt-1" style={{ color: '#C2844E' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-muted" style={{ lineHeight: '1.6', fontSize: '0.98rem' }}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* WOMEN-LED. QUALITY-DRIVEN. GLOBALLY CONNECTED. */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm text-center mb-4 coconut-dark-card" style={{ backgroundColor: '#14271C', color: '#FFFFFF' }}>
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.88rem' }}>
          Our Founding Spirit
        </div>
        <h2 className="fw-bold display-6 mb-4" style={{ color: '#FFFFFF', fontFamily: 'Playfair Display, Georgia, serif' }}>
          WOMEN-LED. QUALITY-DRIVEN. GLOBALLY CONNECTED.
        </h2>
        <p className="lead mx-auto mb-4" style={{ maxWidth: '820px', color: '#E8F0EA', lineHeight: '1.8', fontSize: '1.1rem' }}>
          AMIORA represents the vision, dedication and entrepreneurial spirit of three women who believe in creating opportunities, building trust and taking Kerala's products to the world.
        </p>
        <p className="mx-auto mb-4" style={{ maxWidth: '780px', color: '#D1DCD3', lineHeight: '1.8', fontSize: '1.02rem' }}>
          From the heart of Kerala to customers across the globe, every product represents our commitment to quality and care.
        </p>

        <div className="pt-4 border-top border-secondary mx-auto" style={{ maxWidth: '600px', borderColor: 'rgba(194, 132, 78, 0.3) !important' }}>
          <h4 className="fw-bold mb-1" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            AMIORA – Crafted with Care, Loved Everywhere.
          </h4>
          <p className="fw-semibold mb-0" style={{ color: '#FDFBF7', letterSpacing: '1px' }}>
            Kerala to Global.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 3 – CAREERS AT AMIORA
   ========================================================================= */
function CareersPage({ CONTACT }) {
  const whyJoin = [
    {
      title: "Growth Opportunities",
      desc: "Be part of an emerging brand with exciting opportunities for professional and personal growth."
    },
    {
      title: "Women Empowerment",
      desc: "Join a women-led entrepreneurial journey built on ambition, confidence and collaboration."
    },
    {
      title: "Creativity & Innovation",
      desc: "Contribute fresh ideas and creative thinking to our growing business."
    },
    {
      title: "Learning & Development",
      desc: "Learn, develop new skills and grow along with the organization."
    },
    {
      title: "Shared Values",
      desc: "Work with a team that values integrity, responsibility, quality and customer satisfaction."
    }
  ];

  const opportunityAreas = [
    "Sales & Marketing",
    "Digital Marketing & Social Media",
    "E-commerce & Customer Support",
    "Export Documentation & Business Development",
    "Jewellery & Fashion Business",
    "Operations & Administration"
  ];

  return (
    <div className="coconut-page-container">
      {/* Hero Header */}
      <div className="text-center mb-5">
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
          Grow With Us. Create With Purpose.
        </div>
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          Careers at AMIORA
        </h1>
        <h3 className="fw-semibold mb-2 coconut-subtitle-gold" style={{ color: '#C2844E' }}>
          Grow With Us. Create With Purpose.
        </h3>
        <p className="lead fw-semibold text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
          Kerala to Global
        </p>
      </div>

      {/* Main Introduction Story */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm mb-5" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <p className="lead mb-4" style={{ color: '#14271C', lineHeight: '1.8', fontSize: '1.15rem' }}>
          At <strong>AMIORA</strong>, we believe that great journeys begin with passionate people and shared dreams.
        </p>
        <p className="text-muted mb-4" style={{ lineHeight: '1.8', fontSize: '1.04rem' }}>
          Founded by three women entrepreneurs, <strong>LA EMVITHA – AMIORA</strong> is an emerging lifestyle brand with a vision to bring quality products, creativity and innovation to customers worldwide.
        </p>
        <p className="text-muted mb-0" style={{ lineHeight: '1.8', fontSize: '1.04rem' }}>
          With our growing presence in coconut-based food products, jewellery and fashion, we look forward to building a passionate team of individuals who share our commitment to quality, creativity, trust and excellence.
        </p>
      </div>

      {/* WHY JOIN AMIORA? */}
      <div className="mb-5">
        <div className="text-center mb-4">
          <div className="text-uppercase fw-bold mb-1" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
            Our Culture & Values
          </div>
          <h2 className="fw-bold mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            WHY JOIN AMIORA?
          </h2>
        </div>

        <div className="row g-4 justify-content-center">
          {whyJoin.map((item, idx) => (
            <div className="col-lg-4 col-md-6" key={idx}>
              <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
                <h5 className="fw-bold mb-2" style={{ color: '#14271C' }}>{item.title}</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.94rem', lineHeight: '1.7' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ARE YOU INTERESTED IN WORKING WITH US? */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm mb-5" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <div className="text-center mb-4">
          <div className="text-uppercase fw-bold mb-1" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
            Explore Opportunities
          </div>
          <h2 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            ARE YOU INTERESTED IN WORKING WITH US?
          </h2>
          <p className="lead text-muted mx-auto mb-3" style={{ maxWidth: '750px', fontSize: '1.05rem', lineHeight: '1.7' }}>
            We welcome applications from enthusiastic, talented and motivated individuals who are interested in growing with AMIORA.
          </p>
          <p className="fw-semibold mb-0" style={{ color: '#14271C', fontSize: '1.02rem' }}>
            We may have opportunities in areas such as:
          </p>
        </div>

        <div className="row g-3 justify-content-center">
          {opportunityAreas.map((area, idx) => (
            <div className="col-md-6 col-lg-4" key={idx}>
              <div
                className="p-3 p-md-4 rounded-4 d-flex align-items-center gap-3 h-100"
                style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8F0EA' }}
              >
                <div className="p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E8F0EA', color: '#C2844E' }}>
                  <CheckCircle2 size={20} />
                </div>
                <span className="fw-bold" style={{ color: '#14271C', fontSize: '0.98rem' }}>
                  {area}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LET'S BUILD SOMETHING MEANINGFUL TOGETHER! */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm text-center mb-4 coconut-dark-card" style={{ backgroundColor: '#14271C', color: '#FDFBF7' }}>
        <h2 className="fw-bold display-6 mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          LET'S BUILD SOMETHING MEANINGFUL TOGETHER!
        </h2>
        <p className="lead mx-auto mb-4" style={{ maxWidth: '750px', color: '#E8F0EA', lineHeight: '1.8', fontSize: '1.08rem' }}>
          Even if there are no current vacancies, we welcome you to share your profile with us. We will consider suitable applications as opportunities arise.
        </p>

        {/* CV Submission Info Box */}
        <div
          className="p-4 rounded-4 text-start mx-auto mb-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(194, 132, 78, 0.4)', maxWidth: '560px' }}
        >
          <div className="fw-bold text-uppercase mb-2" style={{ color: '#C2844E', letterSpacing: '1px', fontSize: '0.85rem' }}>
            Application Details
          </div>

          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong>Send your CV to:</strong>
          </p>
          <p className="mb-3">
            <a
              href={`mailto:${CONTACT.emailPrimary}?subject=Career%20Opportunity%20%E2%80%93%20[Your%20Area%20of%20Interest]`}
              className="fw-bold text-decoration-none d-inline-flex align-items-center gap-2"
              style={{ color: '#C2844E', fontSize: '1.18rem' }}
            >
              <Mail size={20} />
              {CONTACT.emailPrimary}
            </a>
          </p>

          <p className="mb-3" style={{ color: '#E8F0EA', fontSize: '0.96rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Subject:</strong>{" "}
            <span style={{ color: '#C2844E', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              Career Opportunity – [Your Area of Interest]
            </span>
          </p>

          <p className="mb-0" style={{ color: '#E8F0EA', fontSize: '0.96rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Contact / WhatsApp:</strong>{" "}
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none fw-bold"
              style={{ color: '#25D366' }}
            >
              {CONTACT.phone}
            </a>
          </p>
        </div>



        {/* Brand Signoff */}
        <div className="pt-4 border-top border-secondary mx-auto" style={{ maxWidth: '600px', borderColor: 'rgba(194, 132, 78, 0.3) !important' }}>
          <h4 className="fw-bold mb-1" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            AMIORA – Crafted with Care, Loved Everywhere.
          </h4>
          <p className="fw-semibold mb-0" style={{ color: '#FDFBF7', letterSpacing: '1px' }}>
            Kerala to Global.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 4 – PAYMENT INFORMATION
   ========================================================================= */
function PaymentPage({ CONTACT, basePath }) {
  const methods = [
    "UPI Payments",
    "Debit Cards",
    "Credit Cards",
    "Net Banking",
    "Other payment methods supported by our payment gateway."
  ];

  return (
    <div className="coconut-page-container">
      {/* Hero Header */}
      <div className="text-center mb-5">
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
          Safe, Secure & Convenient Payments
        </div>
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          Payment Information
        </h1>
        <h3 className="fw-semibold mb-2 coconut-subtitle-gold" style={{ color: '#C2844E' }}>
          Safe, Secure & Convenient Payments
        </h3>
        <p className="lead fw-semibold text-muted mx-auto" style={{ maxWidth: '650px', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
          Kerala to Global
        </p>
      </div>

      {/* Intro Card */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm mb-5" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <p className="lead mb-3" style={{ color: '#14271C', lineHeight: '1.8', fontSize: '1.12rem' }}>
          At <strong>AMIORA</strong>, we aim to provide our customers with a smooth, convenient and secure shopping experience.
        </p>
        <p className="text-muted mb-0" style={{ lineHeight: '1.8', fontSize: '1.02rem' }}>
          We offer multiple online payment options through our trusted payment gateway, making it easy for customers to complete their purchases safely and conveniently.
        </p>
      </div>

      {/* Sections 1 & 2 */}
      <div className="row g-4 mb-4">
        {/* 1. ACCEPTED PAYMENT METHODS */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              1. ACCEPTED PAYMENT METHODS
            </h4>
            <p className="text-muted mb-3" style={{ fontSize: '0.98rem' }}>
              Customers can make payments using the payment options available at checkout, which may include:
            </p>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-3">
              {methods.map((method, idx) => (
                <li key={idx} className="d-flex align-items-center gap-2">
                  <span style={{ color: '#C2844E' }}>•</span>
                  <span className="fw-medium text-dark" style={{ fontSize: '0.95rem' }}>{method}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted mb-0 fst-italic" style={{ fontSize: '0.9rem' }}>
              Available payment options will be displayed during checkout.
            </p>
          </div>
        </div>

        {/* 2. SECURE PAYMENT PROCESS */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              2. SECURE PAYMENT PROCESS
            </h4>
            <p className="text-muted mb-3" style={{ lineHeight: '1.7', fontSize: '0.98rem' }}>
              We prioritize the security and privacy of our customers' payment information.
            </p>
            <p className="text-muted mb-3" style={{ lineHeight: '1.7', fontSize: '0.98rem' }}>
              All online payments are processed through our authorized payment gateway using its security systems and payment processing protocols.
            </p>
            <div className="p-3 rounded-3" style={{ backgroundColor: '#FAF7F0', border: '1px solid #E8F0EA' }}>
              <p className="mb-0 fw-semibold" style={{ color: '#14271C', fontSize: '0.92rem' }}>
                ⚠️ Customers are advised not to share their card details, UPI PIN, OTP or banking passwords with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections 3, 4, 5 */}
      <div className="row g-4 mb-4">
        {/* 3. ORDER CONFIRMATION */}
        <div className="col-lg-4 col-md-6">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h5 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              3. ORDER CONFIRMATION
            </h5>
            <p className="text-muted mb-2" style={{ lineHeight: '1.7', fontSize: '0.94rem' }}>
              Once a payment is successfully completed, customers will receive an order confirmation through the contact details provided during checkout.
            </p>
            <p className="text-muted mb-0" style={{ lineHeight: '1.7', fontSize: '0.94rem' }}>
              An order will be processed after successful payment verification and confirmation.
            </p>
          </div>
        </div>

        {/* 4. PAYMENT FAILURE */}
        <div className="col-lg-4 col-md-6">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h5 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              4. PAYMENT FAILURE
            </h5>
            <p className="text-muted mb-2" style={{ lineHeight: '1.7', fontSize: '0.94rem' }}>
              If a payment fails or the transaction is unsuccessful, customers are advised to check with their bank or payment service provider.
            </p>
            <p className="text-muted mb-0" style={{ lineHeight: '1.7', fontSize: '0.94rem' }}>
              If the amount has been debited but the order confirmation has not been received, please contact our customer support team with the transaction details.
            </p>
          </div>
        </div>

        {/* 5. REFUND FOR FAILED TRANSACTIONS */}
        <div className="col-lg-4 col-md-12">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h5 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              5. REFUND FOR FAILED TRANSACTIONS
            </h5>
            <p className="text-muted mb-2" style={{ lineHeight: '1.7', fontSize: '0.94rem' }}>
              In case of an unsuccessful transaction where the amount has been debited, the refund will be processed according to the applicable payment gateway and banking procedures.
            </p>
            <p className="text-muted mb-2" style={{ lineHeight: '1.7', fontSize: '0.94rem' }}>
              The time taken for the amount to be credited back may vary depending on the bank or payment service provider.
            </p>
            <p className="text-muted mb-0 fw-semibold" style={{ fontSize: '0.92rem' }}>
              For order cancellations, returns and refunds, please refer to our <Link to={`${basePath}/refund-policy`} style={{ color: '#C2844E' }}>Refund & Cancellation Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* 6. PAYMENT SUPPORT Card */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm text-center mb-4 coconut-dark-card" style={{ backgroundColor: '#14271C', color: '#FDFBF7' }}>
        <h3 className="fw-bold display-6 mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          6. PAYMENT SUPPORT
        </h3>
        <p className="lead mx-auto mb-4" style={{ maxWidth: '750px', color: '#E8F0EA', lineHeight: '1.8', fontSize: '1.05rem' }}>
          For any payment-related queries, transaction issues or assistance, please contact us:
        </p>

        {/* Contact Info Box */}
        <div
          className="p-4 rounded-4 text-start mx-auto mb-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(194, 132, 78, 0.4)', maxWidth: '560px' }}
        >
          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Business Name:</strong> LA EMVITHA – AMIORA
          </p>
          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Email:</strong>{" "}
            <a href="mailto:business@amiora.in" className="fw-bold text-decoration-none" style={{ color: '#C2844E' }}>
              business@amiora.in
            </a>
          </p>
          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Phone / WhatsApp:</strong>{" "}
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="fw-bold text-decoration-none" style={{ color: '#25D366' }}>
              +91 8289988076
            </a>
          </p>
          <p className="mb-0" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Website:</strong>{" "}
            <a href="https://cocoamiora.com" target="_blank" rel="noopener noreferrer" className="fw-bold text-decoration-none" style={{ color: '#C2844E' }}>
              www.cocoamiora.com
            </a>
          </p>
        </div>

        <p className="mx-auto mb-4" style={{ maxWidth: '700px', color: '#D1DCD3', fontSize: '1.02rem', fontStyle: 'italic' }}>
          We are committed to making every shopping experience simple, transparent and secure.
        </p>

        {/* Brand Signoff */}
        <div className="pt-4 border-top border-secondary mx-auto" style={{ maxWidth: '600px', borderColor: 'rgba(194, 132, 78, 0.3) !important' }}>
          <h4 className="fw-bold mb-1" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            AMIORA – Crafted with Care, Loved Everywhere.
          </h4>
          <p className="fw-semibold mb-0" style={{ color: '#FDFBF7', letterSpacing: '1px' }}>
            Kerala to Global.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 5 – SHIPPING POLICY
   ========================================================================= */
function ShippingPage({ CONTACT }) {
  const timelines = [
    { region: "Metro Cities", time: "3–7 Business Days" },
    { region: "Other Cities & Towns", time: "5–10 Business Days" },
    { region: "Remote Areas", time: "7–15 Business Days" }
  ];

  return (
    <div className="coconut-page-container">
      {/* Hero Header */}
      <div className="text-center mb-5">
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
          Thank you for shopping with Amiora
        </div>
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          Shipping Policy
        </h1>
        <h4 className="fw-semibold mb-2 coconut-subtitle-gold" style={{ color: '#C2844E' }}>
          Thank you for shopping with Amiora.
        </h4>
        <p className="lead fw-semibold text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.05rem' }}>
          At Amiora, we strive to deliver your orders safely and on time across India.
        </p>
      </div>

      {/* Sections 1 & 2 */}
      <div className="row g-4 mb-4">
        {/* 1. ORDER PROCESSING */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              1. ORDER PROCESSING
            </h4>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-3">
              <li className="d-flex align-items-start gap-2">
                <span style={{ color: '#C2844E' }}>•</span>
                <span className="text-muted" style={{ lineHeight: '1.7' }}>
                  Orders are processed within 1-3 business days after successful payment confirmation.
                </span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <span style={{ color: '#C2844E' }}>•</span>
                <span className="text-muted" style={{ lineHeight: '1.7' }}>
                  Orders are not processed or shipped on Sundays and public holidays.
                </span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <span style={{ color: '#C2844E' }}>•</span>
                <span className="text-muted" style={{ lineHeight: '1.7' }}>
                  In case of high order volumes, shipments may be delayed by a few additional days.
                </span>
              </li>
            </ul>
            <div className="p-3 rounded-3" style={{ backgroundColor: '#FAF7F0', border: '1px solid #E8F0EA' }}>
              <p className="mb-0 text-muted" style={{ fontSize: '0.92rem' }}>
                During festive seasons, promotional events, or unforeseen circumstances, processing times may be extended.
              </p>
            </div>
          </div>
        </div>

        {/* 2. SHIPPING COVERAGE & 3. SHIPPING CHARGES */}
        <div className="col-lg-6 d-flex flex-column gap-4">
          <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              2. SHIPPING COVERAGE
            </h4>
            <p className="text-muted mb-0" style={{ lineHeight: '1.7' }}>
              We currently ship products across India.
            </p>
          </div>

          <div className="p-4 rounded-4 shadow-sm flex-grow-1" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              3. SHIPPING CHARGES
            </h4>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li className="d-flex align-items-start gap-2">
                <span style={{ color: '#C2844E' }}>•</span>
                <span className="text-muted" style={{ lineHeight: '1.7' }}>
                  Shipping charges, if applicable, will be displayed during checkout.
                </span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <span style={{ color: '#C2844E' }}>•</span>
                <span className="text-muted" style={{ lineHeight: '1.7' }}>
                  Free shipping may be offered on selected products or promotional campaigns.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. DELIVERY TIMELINE */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <h4 className="fw-bold mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          4. DELIVERY TIMELINE
        </h4>
        <p className="text-muted mb-3">Estimated delivery time:</p>

        <div className="row g-3 mb-3">
          {timelines.map((item, idx) => (
            <div className="col-md-4" key={idx}>
              <div className="p-3 rounded-4 text-center h-100" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8F0EA' }}>
                <h6 className="fw-bold mb-1" style={{ color: '#14271C' }}>{item.region}</h6>
                <div className="fw-bold" style={{ color: '#C2844E', fontSize: '1.1rem' }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-muted mb-1" style={{ fontSize: '0.94rem' }}>
          Delivery timelines are estimates and may vary due to courier delays, weather conditions, or unforeseen circumstances.
        </p>
        <p className="text-muted mb-0 fw-semibold fst-italic" style={{ fontSize: '0.92rem' }}>
          Delivery timelines are estimates only and are not guaranteed.
        </p>
      </div>

      {/* 5. ORDER TRACKING & 6. DELIVERY ISSUES */}
      <div className="row g-4 mb-4">
        {/* 5. ORDER TRACKING */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              5. ORDER TRACKING
            </h4>
            <p className="text-muted mb-3" style={{ lineHeight: '1.7' }}>
              Once your order is shipped, tracking details will be shared via email, SMS, or WhatsApp.
            </p>
            <div className="p-3 rounded-3" style={{ backgroundColor: '#FAF7F0', border: '1px solid #E8F0EA' }}>
              <p className="mb-0 text-muted" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                Customers are responsible for providing accurate shipping information. Amiora shall not be responsible for delays arising from incorrect address details.
              </p>
            </div>
          </div>
        </div>

        {/* 6. DELIVERY ISSUES */}
        <div className="col-lg-6">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
            <h4 className="fw-bold mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
              6. DELIVERY ISSUES
            </h4>
            <p className="text-muted mb-0" style={{ lineHeight: '1.8' }}>
              If your package appears damaged during delivery, please refuse acceptance and contact us immediately.
            </p>
          </div>
        </div>
      </div>

      {/* 7. CONTACT INFORMATION */}
      <div className="p-4 p-lg-5 rounded-4 shadow-sm text-center mb-4 coconut-dark-card" style={{ backgroundColor: '#14271C', color: '#FDFBF7' }}>
        <h3 className="fw-bold display-6 mb-3 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
          7. CONTACT INFORMATION
        </h3>
        <p className="lead mx-auto mb-4" style={{ maxWidth: '750px', color: '#E8F0EA', lineHeight: '1.8', fontSize: '1.05rem' }}>
          For shipping-related queries, please contact us through the above channels.
        </p>

        {/* Contact Info Box */}
        <div
          className="p-4 rounded-4 text-start mx-auto mb-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(194, 132, 78, 0.4)', maxWidth: '560px' }}
        >
          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Business Name:</strong> Amiora
          </p>
          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Email:</strong>{" "}
            <a href="mailto:laemvitha@gmail.com" className="fw-bold text-decoration-none" style={{ color: '#C2844E' }}>
              laemvitha@gmail.com
            </a>
          </p>
          <p className="mb-2" style={{ color: '#E8F0EA', fontSize: '1rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Phone:</strong>{" "}
            <a href="tel:+918289988076" className="fw-bold text-decoration-none" style={{ color: '#25D366' }}>
              +91 8289988076
            </a>
          </p>
          <p className="mb-0" style={{ color: '#E8F0EA', fontSize: '0.95rem' }}>
            <strong style={{ color: '#FFFFFF' }}>Customer Support Hours:</strong> Monday to Saturday, 10:00 AM to 6:00 PM IST.
          </p>
        </div>

        {/* Brand Signoff */}
        <div className="pt-4 border-top border-secondary mx-auto" style={{ maxWidth: '600px', borderColor: 'rgba(194, 132, 78, 0.3) !important' }}>
          <h4 className="fw-bold mb-1" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>
            AMIORA – Crafted with Care, Loved Everywhere.
          </h4>
          <p className="fw-semibold mb-0" style={{ color: '#FDFBF7', letterSpacing: '1px' }}>
            Kerala to Global.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 6 – TERMS OF SERVICE
   ========================================================================= */
function TermsPage({ CONTACT }) {
  const sections = [
    {
      num: "1",
      title: "ACCEPTANCE OF TERMS",
      text: "By using our website and purchasing products, you agree to these terms."
    },
    {
      num: "2",
      title: "PRODUCTS",
      text: "We make every effort to display product descriptions, images, and pricing accurately. However, minor variations may occur."
    },
    {
      num: "3",
      title: "PRICING",
      text: "All prices are displayed in Indian Rupees (INR) and are subject to change without prior notice."
    },
    {
      num: "4",
      title: "PAYMENTS",
      text: "We accept payments through secure payment gateways and authorized payment methods available on the website."
    },
    {
      num: "5",
      title: "ORDER ACCEPTANCE",
      text: "We reserve the right to cancel or refuse any order due to:\n• Product unavailability • Pricing errors • Suspected fraudulent activity • Violation of these terms\n\nWe reserve the right to limit quantities purchased per customer or household."
    },
    {
      num: "6",
      title: "INTELLECTUAL PROPERTY",
      text: "All website content including text, images, logos, graphics, and designs are the property of Amiora and may not be reproduced without written permission."
    },
    {
      num: "7",
      title: "USER CONDUCT",
      text: "Users shall not:\n• Violate any applicable laws. • Attempt unauthorized access to website systems. • Use the website for fraudulent activities."
    },
    {
      num: "8",
      title: "LIMITATION OF LIABILITY",
      text: "Amiora shall not be liable for indirect, incidental, or consequential damages arising from the use of our products or website."
    },
    {
      num: "9",
      title: "GOVERNING LAW",
      text: "These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in Ernakulam, Kerala."
    },
    {
      num: "10",
      title: "WEBSITE AVAILABILITY",
      text: "We do not guarantee uninterrupted access to the website and may suspend, modify, or discontinue any part of the website without prior notice."
    },
    {
      num: "11",
      title: "CONTACT INFORMATION",
      text: "Trade Name : LA EMVITHA\nEmail: laemvitha@gmail.com\nPhone: +91 8289988076"
    }
  ];

  return (
    <div className="coconut-page-container">
      <div className="text-center mb-5">
        <div className="text-uppercase fw-bold mb-2" style={{ color: '#C2844E', letterSpacing: '2px', fontSize: '0.84rem' }}>
          LEGAL AGREEMENT
        </div>
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>Terms of service</h1>
        <h5 className="fw-semibold mb-2" style={{ color: '#14271C', fontSize: '1.15rem' }}>Welcome to Amiora.</h5>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.02rem' }}>
          By accessing and using this website, you agree to comply with these Terms & Conditions.
        </p>
      </div>

      <div className="p-4 p-lg-5 rounded-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <div className="d-flex flex-column gap-4">
          {sections.map((sec, idx) => (
            <div key={idx} className="pb-3 border-bottom">
              <h5 className="fw-bold mb-2" style={{ color: '#14271C' }}>
                <span className="me-2" style={{ color: '#C2844E' }}>{sec.num}.</span>
                {sec.title}
              </h5>
              <p className="text-muted mb-0" style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {sec.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 7 – REFUND POLICY
   ========================================================================= */
function RefundPage({ CONTACT }) {
  const policies = [
    {
      num: "1",
      title: "ELIGIBILITY FOR RETURNS",
      text: "You may request a return within 7 days from the date of delivery if:\n• You received a damaged product. • You received an incorrect product. • The product is defective upon arrival."
    },
    {
      num: "2",
      title: "NON-RETURNABLE ITEMS",
      text: "Returns will not be accepted for:\n• Used products. • Products damaged due to misuse. • Customized or personalized products. • Products returned without original packaging."
    },
    {
      num: "3",
      title: "RETURN PROCESS",
      text: "To initiate a return:\n• Email us at: laemvitha@gmail.com\n• Call/WhatsApp: +91 8289988076\nPlease include: • Order Number • Product Photos • Reason for Return"
    },
    {
      num: "4",
      title: "REFUND PROCESS",
      text: "After inspection and approval of the returned item:\n• Refunds will be processed and Credited within 5-10 business days. • Refunds will be credited to the original payment method used during purchase.\n\nRefund processing times may vary depending on the payment provider or bank.\n• Return shipping costs shall be borne by the customer unless the return is due to a damaged, defective, or incorrect product delivered by Amiora."
    },
    {
      num: "5",
      title: "REPLACEMENT",
      text: "Where applicable and subject to stock availability, we may offer a replacement instead of a refund.\nAll the approved replacement products will be delivered within 7-8 business days"
    },
    {
      num: "6",
      title: "CANCELLATION POLICY",
      text: "Orders can be cancelled before shipment. Once shipped, cancellation requests may not be accepted.\n\nRefunds for cancelled orders will be processed within 5–10 business days."
    },
    {
      num: "7",
      title: "CONTACT US",
      text: "Email: laemvitha@gmail.com\nPhone: +91 8289988076"
    }
  ];

  return (
    <div className="coconut-page-container">
      <div className="text-center mb-5">
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>Refund policy</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.05rem' }}>
          At Amiora, customer satisfaction is our priority.
        </p>
      </div>

      <div className="p-4 p-lg-5 rounded-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <div className="d-flex flex-column gap-4">
          {policies.map((p, idx) => (
            <div key={idx} className="pb-3 border-bottom">
              <h5 className="fw-bold mb-2" style={{ color: '#14271C' }}>
                <span className="me-2" style={{ color: '#C2844E' }}>{p.num}.</span>
                {p.title}
              </h5>
              <p className="text-muted mb-0" style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE 8 – PRIVACY POLICY
   ========================================================================= */
function PrivacyPage({ CONTACT }) {
  const sections = [
    {
      num: "1",
      title: "INFORMATION WE COLLECT",
      text: "We may collect:\n• Name • Email Address • Phone Number • Shipping Address • Billing Address • Payment Information (processed securely through payment gateway providers)"
    },
    {
      num: "2",
      title: "HOW WE USE YOUR INFORMATION",
      text: "We use your information to:\n• Process orders • Deliver products • Provide customer support • Send order updates • Improve our services • Comply with legal obligations"
    },
    {
      num: "3",
      title: "PAYMENT SECURITY",
      text: "Payments are processed through secure third-party payment gateways. We do not store complete debit card, credit card, or banking details on our servers."
    },
    {
      num: "4",
      title: "INFORMATION SHARING",
      text: "We do not sell, rent, or trade your personal information.\nInformation may be shared only with:\n• Logistics partners • Payment gateway providers • Government authorities when legally required"
    },
    {
      num: "5",
      title: "COOKIES",
      text: "Our website may use cookies to enhance user experience and improve website performance."
    },
    {
      num: "6",
      title: "DATA SECURITY",
      text: "We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, or misuse."
    },
    {
      num: "7",
      title: "YOUR RIGHTS",
      text: "You may request:\n• Access to your data • Correction of inaccurate information • Deletion of personal information where legally permissible\n\nWithdrawal of consent for marketing communications\nRequest for information regarding data processing practices"
    },
    {
      num: "8",
      title: "THIRD-PARTY LINKS",
      text: "Our website may contain links to third-party websites. We are not responsible for their privacy practices.\n\nWe reserve the right to update this Privacy Policy at any time. Updates will be posted on this page."
    },
    {
      num: "9",
      title: "DATA RETENTION",
      text: "We retain personal information only for as long as necessary to fulfill the purposes outlined in this Policy, comply with legal obligations, resolve disputes, and enforce our agreements."
    },
    {
      num: "10",
      title: "CONTACT US",
      text: "Email: laemvitha@gmail.com\nPhone: +91 8289988076"
    }
  ];

  return (
    <div className="coconut-page-container">
      <div className="text-center mb-5">
        <h1 className="fw-bold display-5 mb-2 coconut-gold-heading" style={{ color: '#C2844E', fontFamily: 'Playfair Display, Georgia, serif' }}>Privacy policy</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.05rem' }}>
          Amiora values your privacy and is committed to protect your personal information.
        </p>
      </div>

      <div className="p-4 p-lg-5 rounded-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #E8F0EA' }}>
        <div className="d-flex flex-column gap-4">
          {sections.map((sec, idx) => (
            <div key={idx} className="pb-3 border-bottom">
              <h5 className="fw-bold mb-2" style={{ color: '#14271C' }}>
                <span className="me-2" style={{ color: '#C2844E' }}>{sec.num}.</span>
                {sec.title}
              </h5>
              <p className="text-muted mb-0" style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>{sec.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
