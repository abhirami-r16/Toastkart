import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Eye, LayoutTemplate, Link2 } from 'lucide-react';

export default function PortfolioBuilder() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState({
    slug: '',
    name: '',
    bio: '',
    template: 'minimal',
    socialLinks: [],
    projects: []
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('toastkart_portfolios');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.length > 0) {
          setPortfolio(parsed[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleChange = (e) => {
    setPortfolio({ ...portfolio, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!portfolio.slug) {
      alert("Please enter a unique slug for your portfolio URL.");
      return;
    }
    const currentData = JSON.parse(localStorage.getItem('toastkart_portfolios') || '[]');
    const existingIdx = currentData.findIndex(p => p.slug === portfolio.slug);
    
    if (existingIdx >= 0) {
      currentData[existingIdx] = portfolio;
    } else {
      currentData.push(portfolio);
    }
    
    localStorage.setItem('toastkart_portfolios', JSON.stringify(currentData));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addProject = () => {
    setPortfolio({
      ...portfolio,
      projects: [...portfolio.projects, { title: '', description: '', image: '', link: '' }]
    });
  };

  const updateProject = (idx, field, value) => {
    const newProjects = [...portfolio.projects];
    newProjects[idx][field] = value;
    setPortfolio({ ...portfolio, projects: newProjects });
  };

  const removeProject = (idx) => {
    const newProjects = [...portfolio.projects];
    newProjects.splice(idx, 1);
    setPortfolio({ ...portfolio, projects: newProjects });
  };

  const addSocial = () => {
    setPortfolio({
      ...portfolio,
      socialLinks: [...portfolio.socialLinks, { label: '', url: '' }]
    });
  };

  const updateSocial = (idx, field, value) => {
    const newLinks = [...portfolio.socialLinks];
    newLinks[idx][field] = value;
    setPortfolio({ ...portfolio, socialLinks: newLinks });
  };

  const removeSocial = (idx) => {
    const newLinks = [...portfolio.socialLinks];
    newLinks.splice(idx, 1);
    setPortfolio({ ...portfolio, socialLinks: newLinks });
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <header className="bg-white border-bottom py-3 sticky-top shadow-sm z-10">
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <LayoutTemplate className="text-primary" />
            <h1 className="h5 mb-0 fw-bold">Portfolio Builder</h1>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate(`/portfolio/${portfolio.slug || 'demo'}`)} disabled={!portfolio.slug}>
              <Eye size={16} /> Preview
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleSave}>
              <Save size={16} /> {saved ? 'Saved!' : 'Save Portfolio'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mt-5 max-w-4xl">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 fw-bold">Basic Information</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted fs-8 text-uppercase">URL Slug</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">toastkart.com/portfolio/</span>
                    <input type="text" className="form-control" name="slug" value={portfolio.slug} onChange={handleChange} placeholder="my-name" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted fs-8 text-uppercase">Your Name</label>
                  <input type="text" className="form-control form-control-lg" name="name" value={portfolio.name} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted fs-8 text-uppercase">Bio / Headline</label>
                  <textarea className="form-control" name="bio" rows="4" value={portfolio.bio} onChange={handleChange} placeholder="I am a creative professional specializing in..." />
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                <h5 className="mb-0 fw-bold">Projects</h5>
                <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addProject}>
                  <Plus size={14} /> Add Project
                </button>
              </div>
              <div className="card-body p-4">
                {portfolio.projects.map((proj, idx) => (
                  <div key={idx} className="border rounded p-3 mb-3 bg-light position-relative">
                    <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" onClick={() => removeProject(idx)}><Trash2 size={14} /></button>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fs-8 fw-semibold text-muted">Project Title</label>
                        <input type="text" className="form-control form-control-sm" value={proj.title} onChange={e => updateProject(idx, 'title', e.target.value)} />
                      </div>
                      <div className="col-12">
                        <label className="form-label fs-8 fw-semibold text-muted">Description</label>
                        <textarea className="form-control form-control-sm" rows="2" value={proj.description} onChange={e => updateProject(idx, 'description', e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fs-8 fw-semibold text-muted">Image URL</label>
                        <input type="text" className="form-control form-control-sm" value={proj.image} onChange={e => updateProject(idx, 'image', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fs-8 fw-semibold text-muted">External Link</label>
                        <input type="text" className="form-control form-control-sm" value={proj.link} onChange={e => updateProject(idx, 'link', e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                  </div>
                ))}
                {portfolio.projects.length === 0 && (
                  <div className="text-center py-4 text-muted border border-dashed rounded bg-light">
                    <p className="mb-0">No projects added. Click "Add Project" to start building your portfolio.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                <h5 className="mb-0 fw-bold">Social Links</h5>
                <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addSocial}>
                  <Plus size={14} /> Add Link
                </button>
              </div>
              <div className="card-body p-4">
                {portfolio.socialLinks.map((link, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input type="text" className="form-control form-control-sm" placeholder="Label (e.g. LinkedIn)" value={link.label} onChange={e => updateSocial(idx, 'label', e.target.value)} />
                    <input type="text" className="form-control form-control-sm" placeholder="URL" value={link.url} onChange={e => updateSocial(idx, 'url', e.target.value)} />
                    <button className="btn btn-sm btn-danger px-2" onClick={() => removeSocial(idx)}><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '90px' }}>
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 fw-bold">Design Theme</h5>
              </div>
              <div className="card-body p-4">
                <div className="d-grid gap-3">
                  <label className={`border rounded p-3 cursor-pointer ${portfolio.template === 'minimal' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <input type="radio" name="template" value="minimal" checked={portfolio.template === 'minimal'} onChange={handleChange} className="form-check-input mt-0" />
                      <span className="fw-bold">Minimal Clean</span>
                    </div>
                    <p className="fs-8 text-muted mb-0">A clean, white-space heavy design focusing on simple typography and large imagery.</p>
                  </label>

                  <label className={`border rounded p-3 cursor-pointer ${portfolio.template === 'creative' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <input type="radio" name="template" value="creative" checked={portfolio.template === 'creative'} onChange={handleChange} className="form-check-input mt-0" />
                      <span className="fw-bold">Creative Dark</span>
                    </div>
                    <p className="fs-8 text-muted mb-0">A bold, dark-mode design with dynamic grid layouts and distinct styling for creative professionals.</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
