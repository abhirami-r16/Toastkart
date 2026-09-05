import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function TemplateMinimal({ portfolio }) {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#333333', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header className="container py-5 border-bottom">
        <div className="py-5 max-w-3xl">
          <h1 className="display-4 fw-bolder mb-3" style={{ letterSpacing: '-1px' }}>
            {portfolio.name || 'Your Name'}
          </h1>
          <p className="fs-4 text-muted mb-4" style={{ lineHeight: 1.6 }}>
            {portfolio.bio || 'I am a creative professional. Here is a brief description of who I am and what I do.'}
          </p>
          {portfolio.socialLinks && portfolio.socialLinks.length > 0 && (
            <div className="d-flex gap-3">
              {portfolio.socialLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-decoration-none text-dark fw-bold border-bottom border-dark pb-1">
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>
      
      <main className="container py-5">
        <h2 className="fs-3 fw-bold mb-5">Selected Works</h2>
        <div className="row g-5">
          {(portfolio.projects || []).map((project, idx) => (
            <div key={idx} className="col-12 col-md-6">
              <div className="card border-0 h-100">
                <div className="rounded-3 overflow-hidden bg-light mb-3" style={{ aspectRatio: '16/9' }}>
                  {project.image ? (
                    <img src={project.image} alt={project.title} className="w-100 h-100 object-fit-cover" style={{ transition: 'transform 0.4s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">Project Image</div>
                  )}
                </div>
                <h3 className="fs-5 fw-bold mb-2">{project.title || 'Project Title'}</h3>
                <p className="text-muted mb-3">{project.description || 'A brief description of this project and your role in it.'}</p>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noreferrer" className="text-decoration-none text-dark fw-semibold d-inline-flex align-items-center gap-1">
                    View Project <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {(!portfolio.projects || portfolio.projects.length === 0) && (
            <div className="col-12 py-5 text-center text-muted">
              <p>No projects added yet.</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="container py-4 mt-5 text-center text-muted fs-8">
        &copy; {new Date().getFullYear()} {portfolio.name}. Built with ToastKart Portfolios.
      </footer>
    </div>
  );
}
