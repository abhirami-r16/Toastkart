import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSEO from '../hooks/useSEO';
import { Eye, EyeOff } from 'lucide-react';
import ToastKartLogo from '../components/ToastKartLogo';

const goslotRegisterStyles = `
  .goslot-login-bg {
    background: #ffffff;
    min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .goslot-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
  }
  .goslot-nav-links {
    display: none;
  }
  @media (min-width: 768px) {
    .goslot-nav-links {
      display: flex;
      gap: 2rem;
      font-weight: 500;
      color: #1a1a1a;
    }
  }
  .goslot-login-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 3rem;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08);
    border: 1px solid #f0f0f0;
    margin: 2rem auto;
  }
  .goslot-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .goslot-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    color: #1a1a1a;
    transition: all 0.2s;
    background: #ffffff;
  }
  .goslot-input:focus {
    outline: none;
    border-color: #FF5722;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.15);
  }
  .goslot-input::placeholder {
    color: #999;
  }
  .goslot-btn-green {
    width: 100%;
    background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%);
    color: white;
    font-weight: 600;
    padding: 0.875rem;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3);
  }
  .goslot-btn-green:hover {
    background: linear-gradient(135deg, #E64A19 0%, #FF5722 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
  }
  .goslot-btn-google {
    width: 100%;
    background: #ffffff;
    color: #1a1a1a;
    font-weight: 600;
    padding: 0.875rem;
    border-radius: 9999px;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .goslot-btn-google:hover {
    background: #f9f9f9;
    border-color: #ccc;
  }
  .goslot-divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #999;
    font-size: 0.75rem;
    font-weight: 600;
    margin: 1.5rem 0;
  }
  .goslot-divider::before, .goslot-divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e0e0e0;
  }
  .goslot-divider::before {
    margin-right: 1em;
  }
  .goslot-divider::after {
    margin-left: 1em;
  }
  
  /* Overrides for white login theme */
  .goslot-login-bg h1, .goslot-login-bg h2, .goslot-login-bg h3, .goslot-login-bg h4 {
    color: #1a1a1a !important;
  }
  .goslot-login-bg p, .goslot-login-bg span, .goslot-login-bg div, .goslot-login-bg label, .goslot-login-bg a {
    color: #1a1a1a !important;
  }
  .goslot-login-bg .text-muted, .goslot-login-bg p.text-muted {
    color: #777777 !important;
  }
  .goslot-login-bg .text-dark {
    color: #1a1a1a !important;
  }
  .goslot-login-bg .border-top {
    border-color: #e0e0e0 !important;
  }
  
  /* Strength bar styles for register page */
  .strength-bar-container {
    height: 4px;
    width: 100%;
    background: #e5e7eb;
    border-radius: 4px;
    margin-top: 0.5rem;
    overflow: hidden;
  }
  .strength-bar-fill {
    height: 100%;
    transition: all 0.3s ease;
  }

  /* Mobile Responsiveness */
  @media (max-width: 575px) {
    .goslot-login-card {
      padding: 2rem 1.5rem;
      margin: 1rem auto;
      border-radius: 16px;
    }
    .goslot-nav {
      padding: 1rem;
    }
    .goslot-login-bg h1 {
      font-size: 1.5rem !important;
    }
    .goslot-input {
      padding: 0.75rem 1rem;
    }
    .goslot-btn-green, .goslot-btn-google {
      padding: 0.75rem;
    }
  }
`;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useSEO({ title: 'Create Account - ToastKart', description: 'Join the ToastKart Ecosystem' });

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 25, label: 'Weak', color: '#ef4444' };
    if (score === 3) return { score: 55, label: 'Moderate', color: '#f59e0b' };
    if (score === 4) return { score: 80, label: 'Strong', color: '#10b981' };
    return { score: 100, label: 'Exceptional', color: '#FF5722' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(name, email, password, 'owner');
    if (res.success) {
      setSuccess('Successfully registered! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(res.message || 'Registration failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="goslot-login-bg">
      <style dangerouslySetInnerHTML={{ __html: goslotRegisterStyles }} />
      
      {/* Top Navigation */}
      <nav className="goslot-nav container-xl mx-auto">
        <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <ToastKartLogo width={160} />
        </div>
        
        <div className="goslot-nav-links">
          <a href="/" className="text-decoration-none text-dark">Home</a>
          <a href="/#features" className="text-decoration-none text-dark">Features</a>
          <a href="/#about" className="text-decoration-none text-dark">About</a>
        </div>
        
        <button onClick={() => navigate('/login')} className="d-none d-sm-block goslot-btn-green" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
          Login
        </button>
      </nav>

      <div className="d-flex align-items-center justify-content-center px-3">
        <div className="goslot-login-card">
          <div className="text-center mb-4 pb-2">
            <h1 className="fw-bold text-dark mb-2 fs-3" style={{ letterSpacing: '-0.5px' }}>Create Your Account</h1>
            <p className="text-muted fs-6 mb-0">Join the ToastKart Ecosystem</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 fs-7 mb-4 rounded-3 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success py-2 px-3 fs-7 mb-4 rounded-3 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Role selector removed as per requirements */}

            <div className="mb-3">
              <label className="goslot-label">FULL NAME</label>
              <input
                type="text"
                className="goslot-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="mb-3">
              <label className="goslot-label">EMAIL ADDRESS</label>
              <input
                type="email"
                className="goslot-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <label className="goslot-label mb-0">PASSWORD</label>
                {password && (
                  <span className="fs-8 fw-bold" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="position-relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="goslot-input"
                  style={{ paddingRight: '2.75rem' }}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="position-absolute border-0 bg-transparent"
                  style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {password && (
                <div className="strength-bar-container">
                  <div 
                    className="strength-bar-fill"
                    style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="goslot-btn-green mb-2"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
            
            <div className="goslot-divider">OR</div>
            
            <button type="button" className="goslot-btn-google">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="text-center mt-4 pt-3 border-top">
              <span className="text-muted fs-7">Already have an account? </span>
              <NavLink to="/login" className="text-decoration-none fw-bold" style={{ color: '#FF5722' }}>
                Sign In Here
              </NavLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}