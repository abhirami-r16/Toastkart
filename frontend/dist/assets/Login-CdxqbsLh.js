import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{a as t,d as n,h as r,n as i,t as a}from"./index-DcS3vN9J.js";import{n as o}from"./AuthContext-DVBioEeF.js";import{t as s}from"./useSEO-D14k8Hr8.js";import{t as c}from"./ToastKartLogo-CCkMvL7n.js";var l=e(r(),1),u=i(),d=`
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

  .goslot-divider::before,
  .goslot-divider::after {
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
  .goslot-login-bg h1,
  .goslot-login-bg h2,
  .goslot-login-bg h3,
  .goslot-login-bg h4 {
    color: #1a1a1a !important;
  }

  .goslot-login-bg p,
  .goslot-login-bg span,
  .goslot-login-bg div,
  .goslot-login-bg label,
  .goslot-login-bg a {
    color: #1a1a1a !important;
  }

  .goslot-login-bg .text-muted,
  .goslot-login-bg p.text-muted {
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

    .goslot-btn-green,
    .goslot-btn-google {
      padding: 0.75rem;
    }
  }
`;function f(){let{login:e,updatePassword:r,googleLogin:i}=o(),f=n(),[p,m]=(0,l.useState)(``),[h,g]=(0,l.useState)(``),[_,v]=(0,l.useState)(``),[y,b]=(0,l.useState)(``),[x,S]=(0,l.useState)(``),[C,w]=(0,l.useState)(!1),[T,E]=(0,l.useState)(!1),[D,O]=(0,l.useState)(null),[k,A]=(0,l.useState)(null),[j,M]=(0,l.useState)(!1);s({title:`Log in to GoSlot Store`,description:`Access your centralized merchant dashboard`});let N=e=>{try{return JSON.parse(atob(e.split(`.`)[1]))}catch{return null}};return(0,u.jsxs)(`div`,{className:`goslot-login-bg`,children:[(0,u.jsx)(`style`,{dangerouslySetInnerHTML:{__html:d}}),(0,u.jsxs)(`nav`,{className:`goslot-nav container-xl mx-auto`,children:[(0,u.jsx)(`div`,{className:`d-flex align-items-center gap-2 cursor-pointer`,onClick:()=>f(`/`),children:(0,u.jsx)(c,{width:160})}),(0,u.jsxs)(`div`,{className:`goslot-nav-links`,children:[(0,u.jsx)(`a`,{href:`/`,className:`text-decoration-none text-dark`,children:`Home`}),(0,u.jsx)(`a`,{href:`/#features`,className:`text-decoration-none text-dark`,children:`Features`}),(0,u.jsx)(`a`,{href:`/portfolio`,className:`text-decoration-none text-dark`,children:`Portfolio`}),(0,u.jsx)(`a`,{href:`/#about`,className:`text-decoration-none text-dark`,children:`About`})]}),(0,u.jsx)(`button`,{onClick:()=>f(`/register`),className:`d-none d-sm-block goslot-btn-green`,style:{width:`auto`,padding:`0.5rem 1.5rem`},children:`Get Started`})]}),(0,u.jsx)(`div`,{className:`d-flex align-items-center justify-content-center px-3`,children:(0,u.jsxs)(`div`,{className:`goslot-login-card`,children:[(0,u.jsxs)(`div`,{className:`text-center mb-4 pb-2`,children:[(0,u.jsx)(`h1`,{className:`fw-bold text-dark mb-2 fs-3`,style:{letterSpacing:`-0.5px`},children:T?`Reset Password`:`Log in to ToastKart`}),(0,u.jsx)(`p`,{className:`text-muted fs-6 mb-0`,children:T?`Enter your email and a new password`:`Access your centralized merchant dashboard`})]}),x&&(0,u.jsx)(`div`,{className:`alert alert-danger py-2 px-3 fs-7 mb-4 rounded-3 text-center`,children:x}),k?(0,u.jsxs)(`div`,{className:`text-center pt-2 pb-4`,children:[(0,u.jsx)(`h5`,{className:`mb-3 fw-bold`,children:`Continue with Google`}),(0,u.jsxs)(`div`,{className:`mb-4`,children:[(0,u.jsx)(`img`,{src:k.picture,alt:`Profile`,className:`rounded-circle mb-2`,style:{width:`60px`,height:`60px`},onError:e=>e.target.style.display=`none`}),(0,u.jsx)(`p`,{className:`mb-0 fw-semibold`,children:k.name}),(0,u.jsx)(`p`,{className:`text-muted fs-7 mb-0`,children:k.email})]}),(0,u.jsx)(`p`,{className:`fs-7 text-muted mb-4`,children:`This Google account will be used to sign in to Toastkart.`}),(0,u.jsx)(`button`,{type:`button`,className:`goslot-btn-green w-100 mb-3`,onClick:async()=>{if(D){w(!0),S(``);try{let e=await i(D);e.success?f(`/owner/dashboard`):S(e.message||`Google login failed`)}catch(e){console.error(`Google login failed:`,e),S(`Google authentication failed. Please try again.`)}finally{w(!1)}}},disabled:C,children:C?`Continuing...`:`Continue`}),(0,u.jsx)(`button`,{type:`button`,className:`btn btn-link text-decoration-none text-muted p-0 fs-7`,onClick:()=>{A(null),O(null)},disabled:C,children:`Cancel`})]}):T?j?(0,u.jsxs)(`div`,{className:`text-center pt-2`,children:[(0,u.jsxs)(`div`,{className:`alert alert-success py-3 px-3 fs-6 mb-4 rounded-3 text-start`,children:[`Your password for `,(0,u.jsx)(`strong`,{children:p}),` has been updated successfully.`]}),(0,u.jsx)(`button`,{type:`button`,className:`goslot-btn-google mb-3`,onClick:()=>{E(!1),M(!1),m(``),v(``),b(``),S(``)},children:`Back to login`})]}):(0,u.jsxs)(`form`,{onSubmit:async e=>{if(e.preventDefault(),S(``),!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(p)){S(`Please enter a valid Gmail address ending with @gmail.com`);return}if(_!==y){S(`Passwords do not match.`);return}w(!0);let t=await r(p,_);w(!1),t.success?M(!0):S(t.message)},children:[(0,u.jsxs)(`div`,{className:`mb-3`,children:[(0,u.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,u.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:p,onChange:e=>m(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`mb-3`,children:[(0,u.jsx)(`label`,{className:`goslot-label`,children:`NEW PASSWORD`}),(0,u.jsx)(`input`,{type:`password`,className:`goslot-input`,required:!0,value:_,onChange:e=>v(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`mb-4`,children:[(0,u.jsx)(`label`,{className:`goslot-label`,children:`RE-ENTER PASSWORD`}),(0,u.jsx)(`input`,{type:`password`,className:`goslot-input`,required:!0,value:y,onChange:e=>b(e.target.value)})]}),(0,u.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-3`,disabled:C,children:C?`Updating...`:`Update Password`}),(0,u.jsx)(`div`,{className:`text-center`,children:(0,u.jsx)(`button`,{type:`button`,className:`btn btn-link text-decoration-none text-muted p-0`,onClick:()=>{E(!1),S(``)},children:`Cancel`})})]}):(0,u.jsxs)(`form`,{onSubmit:async t=>{if(t.preventDefault(),S(``),!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(p)){S(`Please enter a valid Gmail address ending with @gmail.com`);return}w(!0);let n=await e(p,h);if(n.success){let e=`owner`;(p===`admin@gmail.com`&&h===`admin`||n.user?.role===`admin`)&&(e=`admin`),f(e===`admin`?`/admin/dashboard`:`/plans`)}else S(n.message||`Authentication failed. Please verify your credentials.`);w(!1)},children:[(0,u.jsxs)(`div`,{className:`mb-3`,children:[(0,u.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,u.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:p,onChange:e=>m(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`mb-4`,children:[(0,u.jsx)(`label`,{className:`goslot-label`,children:`PASSWORD`}),(0,u.jsx)(`input`,{type:`password`,className:`goslot-input`,required:!0,value:h,onChange:e=>g(e.target.value)})]}),(0,u.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between mb-4`,children:[(0,u.jsxs)(`label`,{className:`d-flex align-items-center gap-2 cursor-pointer text-muted fs-7`,children:[(0,u.jsx)(`input`,{type:`checkbox`,className:`form-check-input mt-0`,style:{cursor:`pointer`,accentColor:`#FF5722`}}),(0,u.jsx)(`span`,{children:`Keep me logged in`})]}),(0,u.jsx)(`a`,{href:`#`,onClick:e=>{e.preventDefault(),E(!0)},className:`text-decoration-none fs-7 fw-semibold`,style:{color:`#FF5722`},children:`Forgot password?`})]}),(0,u.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-2`,disabled:C,children:C?`Logging in...`:`Log in to dashboard`}),(0,u.jsx)(`div`,{className:`goslot-divider`,children:`OR`}),(0,u.jsx)(`div`,{className:`d-flex justify-content-center`,children:(0,u.jsx)(a,{onSuccess:async e=>{if(!e?.credential){S(`Google authentication token was not received.`);return}let t=N(e.credential);t?(A(t),O(e.credential),S(``)):S(`Invalid Google token`)},onError:()=>{S(`Google Login Failed`),w(!1)},useOneTap:!1})}),(0,u.jsxs)(`div`,{className:`text-center mt-4 pt-3 border-top`,children:[(0,u.jsxs)(`span`,{className:`text-muted fs-7`,children:[`Don't have an account?`,` `]}),(0,u.jsx)(t,{to:`/register`,className:`text-decoration-none fw-bold`,style:{color:`#FF5722`},children:`Register here`})]})]})]})})]})}export{f as default};