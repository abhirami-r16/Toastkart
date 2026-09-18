import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{n as t,t as n}from"./jsx-runtime-DRF4vMFQ.js";import{n as r}from"./AuthContext-B3Oybw7L.js";import{p as i,s as a}from"./index-C89sDL0A.js";import{t as o}from"./useSEO-BmENIZIe.js";import{t as s}from"./ToastKartLogo-h2EovWfc.js";var c=e(t(),1),l=n(),u=`
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
`;function d(){let{login:e,updatePassword:t}=r(),n=i(),[d,f]=(0,c.useState)(``),[p,m]=(0,c.useState)(``),[h,g]=(0,c.useState)(``),[_,v]=(0,c.useState)(``),[y,b]=(0,c.useState)(``),[x,S]=(0,c.useState)(!1),[C,w]=(0,c.useState)(!1),[T,E]=(0,c.useState)(!1);return o({title:`Log in to GoSlot Store`,description:`Access your centralized merchant dashboard`}),(0,l.jsxs)(`div`,{className:`goslot-login-bg`,children:[(0,l.jsx)(`style`,{dangerouslySetInnerHTML:{__html:u}}),(0,l.jsxs)(`nav`,{className:`goslot-nav container-xl mx-auto`,children:[(0,l.jsx)(`div`,{className:`d-flex align-items-center gap-2 cursor-pointer`,onClick:()=>n(`/`),children:(0,l.jsx)(s,{width:160})}),(0,l.jsxs)(`div`,{className:`goslot-nav-links`,children:[(0,l.jsx)(`a`,{href:`/`,className:`text-decoration-none text-dark`,children:`Home`}),(0,l.jsx)(`a`,{href:`/#features`,className:`text-decoration-none text-dark`,children:`Features`}),(0,l.jsx)(`a`,{href:`/portfolio`,className:`text-decoration-none text-dark`,children:`Portfolio`}),(0,l.jsx)(`a`,{href:`/#about`,className:`text-decoration-none text-dark`,children:`About`})]}),(0,l.jsx)(`button`,{onClick:()=>n(`/register`),className:`d-none d-sm-block goslot-btn-green`,style:{width:`auto`,padding:`0.5rem 1.5rem`},children:`Get Started`})]}),(0,l.jsx)(`div`,{className:`d-flex align-items-center justify-content-center px-3`,children:(0,l.jsxs)(`div`,{className:`goslot-login-card`,children:[(0,l.jsxs)(`div`,{className:`text-center mb-4 pb-2`,children:[(0,l.jsx)(`h1`,{className:`fw-bold text-dark mb-2 fs-3`,style:{letterSpacing:`-0.5px`},children:C?`Reset Password`:`Log in to ToastKart`}),(0,l.jsx)(`p`,{className:`text-muted fs-6 mb-0`,children:C?`Enter your email and a new password`:`Access your centralized merchant dashboard`})]}),y&&(0,l.jsx)(`div`,{className:`alert alert-danger py-2 px-3 fs-7 mb-4 rounded-3 text-center`,children:y}),C?T?(0,l.jsxs)(`div`,{className:`text-center pt-2`,children:[(0,l.jsxs)(`div`,{className:`alert alert-success py-3 px-3 fs-6 mb-4 rounded-3 text-start`,children:[`Your password for `,(0,l.jsx)(`strong`,{children:d}),` has been updated successfully.`]}),(0,l.jsx)(`button`,{type:`button`,className:`goslot-btn-google mb-3`,onClick:()=>{w(!1),E(!1),f(``),g(``),v(``),b(``)},children:`Back to login`})]}):(0,l.jsxs)(`form`,{onSubmit:async e=>{if(e.preventDefault(),b(``),h!==_){b(`Passwords do not match.`);return}S(!0);let n=await t(d,h);S(!1),n.success?E(!0):b(n.message)},children:[(0,l.jsxs)(`div`,{className:`mb-3`,children:[(0,l.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,l.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:d,onChange:e=>f(e.target.value)})]}),(0,l.jsxs)(`div`,{className:`mb-3`,children:[(0,l.jsx)(`label`,{className:`goslot-label`,children:`NEW PASSWORD`}),(0,l.jsx)(`input`,{type:`password`,className:`goslot-input`,required:!0,value:h,onChange:e=>g(e.target.value)})]}),(0,l.jsxs)(`div`,{className:`mb-4`,children:[(0,l.jsx)(`label`,{className:`goslot-label`,children:`RE-ENTER PASSWORD`}),(0,l.jsx)(`input`,{type:`password`,className:`goslot-input`,required:!0,value:_,onChange:e=>v(e.target.value)})]}),(0,l.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-3`,disabled:x,children:x?`Updating...`:`Update Password`}),(0,l.jsx)(`div`,{className:`text-center`,children:(0,l.jsx)(`button`,{type:`button`,className:`btn btn-link text-decoration-none text-muted p-0`,onClick:()=>{w(!1),b(``)},children:`Cancel`})})]}):(0,l.jsxs)(`form`,{onSubmit:async t=>{t.preventDefault(),b(``),S(!0);let r=await e(d,p);if(r.success){let e=`owner`;(d===`admin@gmail.com`&&p===`admin`||r.user?.role===`admin`)&&(e=`admin`),n(e===`admin`?`/admin/dashboard`:`/owner/dashboard`)}else b(r.message||`Authentication failed. Please verify your credentials.`);S(!1)},children:[(0,l.jsxs)(`div`,{className:`mb-3`,children:[(0,l.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,l.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:d,onChange:e=>f(e.target.value)})]}),(0,l.jsxs)(`div`,{className:`mb-4`,children:[(0,l.jsx)(`label`,{className:`goslot-label`,children:`PASSWORD`}),(0,l.jsx)(`input`,{type:`password`,className:`goslot-input`,required:!0,value:p,onChange:e=>m(e.target.value)})]}),(0,l.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between mb-4`,children:[(0,l.jsxs)(`label`,{className:`d-flex align-items-center gap-2 cursor-pointer text-muted fs-7`,children:[(0,l.jsx)(`input`,{type:`checkbox`,className:`form-check-input mt-0`,style:{cursor:`pointer`,accentColor:`#FF5722`}}),(0,l.jsx)(`span`,{children:`Keep me logged in`})]}),(0,l.jsx)(`a`,{href:`#`,onClick:e=>{e.preventDefault(),w(!0)},className:`text-decoration-none fs-7 fw-semibold`,style:{color:`#FF5722`},children:`Forgot password?`})]}),(0,l.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-2`,disabled:x,children:x?`Logging in...`:`Log in to dashboard`}),(0,l.jsx)(`div`,{className:`goslot-divider`,children:`OR`}),(0,l.jsxs)(`button`,{type:`button`,className:`goslot-btn-google`,children:[(0,l.jsxs)(`svg`,{viewBox:`0 0 24 24`,width:`18`,height:`18`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,l.jsx)(`path`,{d:`M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z`,fill:`#4285F4`}),(0,l.jsx)(`path`,{d:`M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z`,fill:`#34A853`}),(0,l.jsx)(`path`,{d:`M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z`,fill:`#FBBC05`}),(0,l.jsx)(`path`,{d:`M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z`,fill:`#EA4335`})]}),`Continue with Google`]}),(0,l.jsxs)(`div`,{className:`text-center mt-4 pt-3 border-top`,children:[(0,l.jsx)(`span`,{className:`text-muted fs-7`,children:`Don't have an account? `}),(0,l.jsx)(a,{to:`/register`,className:`text-decoration-none fw-bold`,style:{color:`#FF5722`},children:`Register here`})]})]})]})})]})}export{d as default};