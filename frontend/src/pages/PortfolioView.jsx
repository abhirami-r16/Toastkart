import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TemplateMinimal from '../components/portfolios/TemplateMinimal';
import TemplateCreative from '../components/portfolios/TemplateCreative';
import { Briefcase } from 'lucide-react';

export default function PortfolioView() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem('toastkart_portfolios');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const found = parsed.find(p => p.slug === slug);
        if (found) {
          setPortfolio(found);
        }
      } catch (e) {
        console.error("Failed to parse portfolios:", e);
      }
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center">Loading...</div>;
  }

  if (!portfolio) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <Briefcase size={48} className="text-muted mb-4" />
        <h1 className="fs-3 fw-bold text-dark mb-2">Portfolio Not Found</h1>
        <p className="text-muted mb-4">We couldn't find a portfolio at this URL.</p>
        <Link to="/portfolio-builder" className="btn btn-primary px-4 py-2 rounded-pill">Create a Portfolio</Link>
      </div>
    );
  }

  if (portfolio.template === 'creative') {
    return <TemplateCreative portfolio={portfolio} />;
  }

  return <TemplateMinimal portfolio={portfolio} />;
}
