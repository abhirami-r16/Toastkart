import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';

export default function TemplateCreative({ portfolio }) {
  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <header className="container py-5">
        <div className="row align-items-center py-5 min-vh-50">
          <div className="col-12 col-lg-8">
            <div className="d-inline-block px-3 py-1 rounded-pill mb-4" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              HELLO, WORLD
            </div>
            <h1 className="display-3 fw-bolder mb-4 text-white" style={{ letterSpacing: '-2px', lineHeight: 1.1 }}>
              I'm <span style={{ color: '#38bdf8' }}>{portfolio.name || 'Your Name'}</span>. <br />
            </h1>
            <p className="fs-4 mb-5" style={{ color: '#94a3b8', maxWidth: '600px', lineHeight: 1.6 }}>
              {portfolio.bio || 'I build digital experiences. Check out my latest work below.'}
            </p>
            
            {portfolio.socialLinks && portfolio.socialLinks.length > 0 && (
              <div className="d-flex flex-wrap gap-3">
                {portfolio.socialLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="btn btn-outline-light rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                    {link.label} <ArrowRight size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="py-5" style={{ backgroundColor: '#020617' }}>
        <div className="container">
          <h2 className="fs-2 fw-bold text-white mb-5 d-flex align-items-center gap-3">
            <span style={{ width: '40px', height: '2px', backgroundColor: '#38bdf8', display: 'inline-block' }}></span>
            Featured Projects
          </h2>
          
          <div className="row g-4">
            {(portfolio.projects || []).map((project, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border-0 bg-transparent group" style={{ cursor: 'pointer' }}>
                  <div className="rounded-4 overflow-hidden mb-4 position-relative" style={{ aspectRatio: '4/5', backgroundColor: '#1e293b' }}>
                    {project.image ? (
                      <img src={project.image} alt={project.title} className="w-100 h-100 object-fit-cover" style={{ transition: 'transform 0.5s ease', opacity: 0.9 }} onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.opacity = 1; }} onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = 0.9; }} />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ color: '#475569' }}>Project Cover</div>
                    )}
                    <div className="position-absolute bottom-0 start-0 w-100 p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                      <h3 className="fs-4 fw-bold text-white mb-1">{project.title || 'Project Title'}</h3>
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noreferrer" className="text-info text-decoration-none fs-7 fw-semibold">
                          View Case Study →
                        </a>
                      )}
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8' }}>{project.description || 'Project overview and details.'}</p>
                </div>
              </div>
            ))}
            {(!portfolio.projects || portfolio.projects.length === 0) && (
              <div className="col-12 py-5 text-center" style={{ color: '#475569' }}>
                <p>No projects added yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
