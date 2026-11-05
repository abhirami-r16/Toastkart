import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{a as t,d as n,h as r,n as i,t as a}from"./index-CasP6qYL.js";import{t as o}from"./eye-off-CshN9Ita.js";import{t as s}from"./eye-BVk0ojdT.js";import{n as c}from"./AuthContext-BZXDnX0N.js";import{t as l}from"./useSEO-BKOSh2cD.js";import{t as u}from"./ToastKartLogo-R1F2Bv9f.js";var d=e(r(),1),f=i(),p=`
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
`;function m(){let{login:e,updatePassword:r,googleLogin:i}=c(),m=n(),[h,g]=(0,d.useState)(``),[_,v]=(0,d.useState)(``),[y,b]=(0,d.useState)(!1),[x,S]=(0,d.useState)(``),[C,w]=(0,d.useState)(!1),[T,E]=(0,d.useState)(``),[D,O]=(0,d.useState)(!1),[k,A]=(0,d.useState)(``),[j,M]=(0,d.useState)(!1),[N,P]=(0,d.useState)(!1),[F,I]=(0,d.useState)(null),[L,R]=(0,d.useState)(null),[z,B]=(0,d.useState)(!1);l({title:`Login into Toastkart`,description:`Access your centralized merchant dashboard`});let V=e=>{try{return JSON.parse(atob(e.split(`.`)[1]))}catch{return null}};return(0,f.jsxs)(`div`,{className:`goslot-login-bg`,children:[(0,f.jsx)(`style`,{dangerouslySetInnerHTML:{__html:p}}),(0,f.jsxs)(`nav`,{className:`goslot-nav container-xl mx-auto`,children:[(0,f.jsx)(`div`,{className:`d-flex align-items-center gap-2 cursor-pointer`,onClick:()=>m(`/`),children:(0,f.jsx)(u,{width:160})}),(0,f.jsxs)(`div`,{className:`goslot-nav-links`,children:[(0,f.jsx)(`a`,{href:`/`,className:`text-decoration-none text-dark`,children:`Home`}),(0,f.jsx)(`a`,{href:`/#features`,className:`text-decoration-none text-dark`,children:`Features`}),(0,f.jsx)(`a`,{href:`/portfolio`,className:`text-decoration-none text-dark`,children:`Portfolio`}),(0,f.jsx)(`a`,{href:`/#about`,className:`text-decoration-none text-dark`,children:`About`})]}),(0,f.jsx)(`button`,{onClick:()=>m(`/register`),className:`d-none d-sm-block goslot-btn-green`,style:{width:`auto`,padding:`0.5rem 1.5rem`},children:`Get Started`})]}),(0,f.jsx)(`div`,{className:`d-flex align-items-center justify-content-center px-3`,children:(0,f.jsxs)(`div`,{className:`goslot-login-card`,children:[(0,f.jsxs)(`div`,{className:`text-center mb-4 pb-2`,children:[(0,f.jsx)(`h1`,{className:`fw-bold text-dark mb-2 fs-3`,style:{letterSpacing:`-0.5px`},children:N?`Reset Password`:`Login into Toastkart`}),(0,f.jsx)(`p`,{className:`text-muted fs-6 mb-0`,children:N?`Enter your email and a new password`:`Access your centralized merchant dashboard`})]}),k&&(0,f.jsx)(`div`,{className:`alert alert-danger py-2 px-3 fs-7 mb-4 rounded-3 text-center`,children:k}),L?(0,f.jsxs)(`div`,{className:`text-center pt-2 pb-4`,children:[(0,f.jsx)(`h5`,{className:`mb-3 fw-bold`,children:`Continue with Google`}),(0,f.jsxs)(`div`,{className:`mb-4`,children:[(0,f.jsx)(`img`,{src:L.picture,alt:`Profile`,className:`rounded-circle mb-2`,style:{width:`60px`,height:`60px`},onError:e=>e.target.style.display=`none`}),(0,f.jsx)(`p`,{className:`mb-0 fw-semibold`,children:L.name}),(0,f.jsx)(`p`,{className:`text-muted fs-7 mb-0`,children:L.email})]}),(0,f.jsx)(`p`,{className:`fs-7 text-muted mb-4`,children:`This Google account will be used to sign in to Toastkart.`}),(0,f.jsx)(`button`,{type:`button`,className:`goslot-btn-green w-100 mb-3`,onClick:async()=>{if(F){M(!0),A(``);try{let e=await i(F);if(e.success){let t=e.user,n=!!(t?.subscription_bypass||t?.email&&t.email.toLowerCase().trim()===`emvithaofficial@gmail.com`),r=t?.role===`admin`||t?.email===`admin@gmail.com`;n||r||t?.has_active_subscription||t?.active_subscription||t?.activeSubscription,m(r?`/admin/dashboard`:`/owner/dashboard`)}else A(e.message||`Google login failed`)}catch(e){console.error(`Google login failed:`,e),A(`Google authentication failed. Please try again.`)}finally{M(!1)}}},disabled:j,children:j?`Continuing...`:`Continue`}),(0,f.jsx)(`button`,{type:`button`,className:`btn btn-link text-decoration-none text-muted p-0 fs-7`,onClick:()=>{R(null),I(null)},disabled:j,children:`Cancel`})]}):N?z?(0,f.jsxs)(`div`,{className:`text-center pt-2`,children:[(0,f.jsxs)(`div`,{className:`alert alert-success py-3 px-3 fs-6 mb-4 rounded-3 text-start`,children:[`Your password for `,(0,f.jsx)(`strong`,{children:h}),` has been updated successfully.`]}),(0,f.jsx)(`button`,{type:`button`,className:`goslot-btn-google mb-3`,onClick:()=>{P(!1),B(!1),g(``),S(``),E(``),A(``)},children:`Back to login`})]}):(0,f.jsxs)(`form`,{onSubmit:async e=>{if(e.preventDefault(),A(``),!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(h)){A(`Please enter a valid Gmail address ending with @gmail.com`);return}if(x!==T){A(`Passwords do not match.`);return}M(!0);let t=await r(h,x);M(!1),t.success?B(!0):A(t.message)},children:[(0,f.jsxs)(`div`,{className:`mb-3`,children:[(0,f.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,f.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:h,onChange:e=>g(e.target.value)})]}),(0,f.jsxs)(`div`,{className:`mb-3`,children:[(0,f.jsx)(`label`,{className:`goslot-label`,children:`NEW PASSWORD`}),(0,f.jsxs)(`div`,{className:`position-relative`,children:[(0,f.jsx)(`input`,{type:C?`text`:`password`,className:`goslot-input`,style:{paddingRight:`2.75rem`},required:!0,value:x,onChange:e=>S(e.target.value)}),(0,f.jsx)(`button`,{type:`button`,className:`position-absolute border-0 bg-transparent d-flex align-items-center justify-content-center`,style:{right:`12px`,top:`50%`,transform:`translateY(-50%)`,color:`#6b7280`,cursor:`pointer`,padding:0},onClick:()=>w(!C),tabIndex:-1,"aria-label":C?`Hide password`:`Show password`,children:C?(0,f.jsx)(o,{size:18}):(0,f.jsx)(s,{size:18})})]})]}),(0,f.jsxs)(`div`,{className:`mb-4`,children:[(0,f.jsx)(`label`,{className:`goslot-label`,children:`RE-ENTER PASSWORD`}),(0,f.jsxs)(`div`,{className:`position-relative`,children:[(0,f.jsx)(`input`,{type:D?`text`:`password`,className:`goslot-input`,style:{paddingRight:`2.75rem`},required:!0,value:T,onChange:e=>E(e.target.value)}),(0,f.jsx)(`button`,{type:`button`,className:`position-absolute border-0 bg-transparent d-flex align-items-center justify-content-center`,style:{right:`12px`,top:`50%`,transform:`translateY(-50%)`,color:`#6b7280`,cursor:`pointer`,padding:0},onClick:()=>O(!D),tabIndex:-1,"aria-label":D?`Hide password`:`Show password`,children:D?(0,f.jsx)(o,{size:18}):(0,f.jsx)(s,{size:18})})]})]}),(0,f.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-3`,disabled:j,children:j?`Updating...`:`Update Password`}),(0,f.jsx)(`div`,{className:`text-center`,children:(0,f.jsx)(`button`,{type:`button`,className:`btn btn-link text-decoration-none text-muted p-0`,onClick:()=>{P(!1),A(``)},children:`Cancel`})})]}):(0,f.jsxs)(`form`,{onSubmit:async t=>{if(t.preventDefault(),A(``),!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(h)){A(`Please enter a valid Gmail address ending with @gmail.com`);return}M(!0);let n=await e(h,_);if(n.success){let e=n.user,t=!!(e?.subscription_bypass||e?.email&&e.email.toLowerCase().trim()===`emvithaofficial@gmail.com`||h.toLowerCase().trim()===`emvithaofficial@gmail.com`),r=e?.role===`admin`||e?.email===`admin@gmail.com`||h.toLowerCase().trim()===`admin@gmail.com`;t||r||e?.has_active_subscription||e?.active_subscription||e?.activeSubscription,m(r?`/admin/dashboard`:`/owner/dashboard`)}else A(n.message||`Authentication failed. Please verify your credentials.`);M(!1)},children:[(0,f.jsxs)(`div`,{className:`mb-3`,children:[(0,f.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,f.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:h,onChange:e=>g(e.target.value)})]}),(0,f.jsxs)(`div`,{className:`mb-4`,children:[(0,f.jsx)(`label`,{className:`goslot-label`,children:`PASSWORD`}),(0,f.jsxs)(`div`,{className:`position-relative`,children:[(0,f.jsx)(`input`,{type:y?`text`:`password`,className:`goslot-input`,style:{paddingRight:`2.75rem`},required:!0,value:_,onChange:e=>v(e.target.value)}),(0,f.jsx)(`button`,{type:`button`,className:`position-absolute border-0 bg-transparent d-flex align-items-center justify-content-center`,style:{right:`12px`,top:`50%`,transform:`translateY(-50%)`,color:`#6b7280`,cursor:`pointer`,padding:0},onClick:()=>b(!y),tabIndex:-1,"aria-label":y?`Hide password`:`Show password`,children:y?(0,f.jsx)(o,{size:18}):(0,f.jsx)(s,{size:18})})]})]}),(0,f.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between mb-4`,children:[(0,f.jsxs)(`label`,{className:`d-flex align-items-center gap-2 cursor-pointer text-muted fs-7`,children:[(0,f.jsx)(`input`,{type:`checkbox`,className:`form-check-input mt-0`,style:{cursor:`pointer`,accentColor:`#FF5722`}}),(0,f.jsx)(`span`,{children:`Keep me logged in`})]}),(0,f.jsx)(`a`,{href:`#`,onClick:e=>{e.preventDefault(),P(!0)},className:`text-decoration-none fs-7 fw-semibold`,style:{color:`#FF5722`},children:`Forgot password?`})]}),(0,f.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-2`,disabled:j,children:j?`Logging in...`:`Log in to dashboard`}),(0,f.jsx)(`div`,{className:`goslot-divider`,children:`OR`}),(0,f.jsx)(`div`,{className:`d-flex justify-content-center`,children:(0,f.jsx)(a,{onSuccess:async e=>{if(!e?.credential){A(`Google authentication token was not received.`);return}let t=V(e.credential);t?(R(t),I(e.credential),A(``)):A(`Invalid Google token`)},onError:()=>{A(`Google Login Failed`),M(!1)},useOneTap:!1})}),(0,f.jsxs)(`div`,{className:`text-center mt-4 pt-3 border-top`,children:[(0,f.jsxs)(`span`,{className:`text-muted fs-7`,children:[`Don't have an account?`,` `]}),(0,f.jsx)(t,{to:`/register`,className:`text-decoration-none fw-bold`,style:{color:`#FF5722`},children:`Register here`})]})]})]})})]})}export{m as default};