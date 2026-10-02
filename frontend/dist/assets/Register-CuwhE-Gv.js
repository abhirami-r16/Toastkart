import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{a as t,d as n,h as r,n as i,t as a}from"./index-DcS3vN9J.js";import{t as o}from"./createLucideIcon-BA7Y2vks.js";import{t as s}from"./eye-DlGBYEsn.js";import{n as c}from"./AuthContext-DVBioEeF.js";import{t as l}from"./useSEO-D14k8Hr8.js";import{t as u}from"./ToastKartLogo-CCkMvL7n.js";var d=o(`eye-off`,[[`path`,{d:`M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49`,key:`ct8e1f`}],[`path`,{d:`M14.084 14.158a3 3 0 0 1-4.242-4.242`,key:`151rxh`}],[`path`,{d:`M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143`,key:`13bj9a`}],[`path`,{d:`m2 2 20 20`,key:`1ooewy`}]]),f=e(r(),1),p=i(),m=`
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
`;function h(){let{register:e,googleLogin:r}=c(),i=n(),[o,h]=(0,f.useState)(``),[g,_]=(0,f.useState)(``),[v,y]=(0,f.useState)(``),[b,x]=(0,f.useState)(``),[S,C]=(0,f.useState)(!1),[w,T]=(0,f.useState)(``),[E,D]=(0,f.useState)(``),[O,k]=(0,f.useState)(!1),[A,j]=(0,f.useState)(null),[M,N]=(0,f.useState)(null),P=e=>{try{return JSON.parse(atob(e.split(`.`)[1]))}catch{return null}},F=async e=>{if(!e?.credential){T(`Google authentication token was not received.`);return}let t=P(e.credential);t?(N(t),j(e.credential),T(``)):T(`Invalid Google token`)},I=()=>{T(`Google Registration Failed`)},L=async()=>{if(A){k(!0),T(``);try{let e=await r(A);e.success?i(`/owner/dashboard`):T(e.message||`Google registration failed`)}catch(e){console.error(`Google registration failed:`,e),T(`Google authentication failed. Please try again.`)}finally{k(!1)}}};l({title:`Create Account - ToastKart`,description:`Join the ToastKart Ecosystem`});let R=(e=>{if(!e)return{score:0,label:``,color:`transparent`};let t=0;return e.length>=6&&(t+=1),e.length>=10&&(t+=1),/[A-Z]/.test(e)&&(t+=1),/[0-9]/.test(e)&&(t+=1),/[^A-Za-z0-9]/.test(e)&&(t+=1),t<=2?{score:25,label:`Weak`,color:`#ef4444`}:t===3?{score:55,label:`Moderate`,color:`#f59e0b`}:t===4?{score:80,label:`Strong`,color:`#10b981`}:{score:100,label:`Exceptional`,color:`#FF5722`}})(b);return(0,p.jsxs)(`div`,{className:`goslot-login-bg`,children:[(0,p.jsx)(`style`,{dangerouslySetInnerHTML:{__html:m}}),(0,p.jsxs)(`nav`,{className:`goslot-nav container-xl mx-auto`,children:[(0,p.jsx)(`div`,{className:`d-flex align-items-center gap-2 cursor-pointer`,onClick:()=>i(`/`),children:(0,p.jsx)(u,{width:160})}),(0,p.jsxs)(`div`,{className:`goslot-nav-links`,children:[(0,p.jsx)(`a`,{href:`/`,className:`text-decoration-none text-dark`,children:`Home`}),(0,p.jsx)(`a`,{href:`/#features`,className:`text-decoration-none text-dark`,children:`Features`}),(0,p.jsx)(`a`,{href:`/portfolio`,className:`text-decoration-none text-dark`,children:`Portfolio`}),(0,p.jsx)(`a`,{href:`/#about`,className:`text-decoration-none text-dark`,children:`About`})]}),(0,p.jsx)(`button`,{onClick:()=>i(`/login`),className:`d-none d-sm-block goslot-btn-green`,style:{width:`auto`,padding:`0.5rem 1.5rem`},children:`Login`})]}),(0,p.jsx)(`div`,{className:`d-flex align-items-center justify-content-center px-3`,children:(0,p.jsxs)(`div`,{className:`goslot-login-card`,children:[(0,p.jsxs)(`div`,{className:`text-center mb-4 pb-2`,children:[(0,p.jsx)(`h1`,{className:`fw-bold text-dark mb-2 fs-3`,style:{letterSpacing:`-0.5px`},children:`Create Your Account`}),(0,p.jsx)(`p`,{className:`text-muted fs-6 mb-0`,children:`Join the ToastKart Ecosystem`})]}),w&&(0,p.jsx)(`div`,{className:`alert alert-danger py-2 px-3 fs-7 mb-4 rounded-3 text-center`,children:w}),E&&(0,p.jsx)(`div`,{className:`alert alert-success py-2 px-3 fs-7 mb-4 rounded-3 text-center`,children:E}),M?(0,p.jsxs)(`div`,{className:`text-center pt-2 pb-4`,children:[(0,p.jsx)(`h5`,{className:`mb-3 fw-bold`,children:`Continue with Google`}),(0,p.jsxs)(`div`,{className:`mb-4`,children:[(0,p.jsx)(`img`,{src:M.picture,alt:`Profile`,className:`rounded-circle mb-2`,style:{width:`60px`,height:`60px`},onError:e=>e.target.style.display=`none`}),(0,p.jsx)(`p`,{className:`mb-0 fw-semibold`,children:M.name}),(0,p.jsx)(`p`,{className:`text-muted fs-7 mb-0`,children:M.email})]}),(0,p.jsx)(`p`,{className:`fs-7 text-muted mb-4`,children:`This Google account will be used to sign in to Toastkart.`}),(0,p.jsx)(`button`,{type:`button`,className:`goslot-btn-green w-100 mb-3`,onClick:L,disabled:O,children:O?`Continuing...`:`Continue`}),(0,p.jsx)(`button`,{type:`button`,className:`btn btn-link text-decoration-none text-muted p-0 fs-7`,onClick:()=>{N(null),j(null)},disabled:O,children:`Cancel`})]}):(0,p.jsxs)(`form`,{onSubmit:async t=>{if(t.preventDefault(),T(``),!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(g)){T(`Please enter a valid Gmail address ending with @gmail.com`);return}k(!0);let n=await e(o,g,v,b,`owner`);n.success?(D(`Registration successful! A confirmation email has been sent to your registered email address.`),setTimeout(()=>{i(`/login`)},2e3)):T(n.message||`Registration failed. Please check your credentials.`),k(!1)},children:[(0,p.jsxs)(`div`,{className:`mb-3`,children:[(0,p.jsx)(`label`,{className:`goslot-label`,children:`FULL NAME`}),(0,p.jsx)(`input`,{type:`text`,className:`goslot-input`,required:!0,value:o,onChange:e=>h(e.target.value),placeholder:`John Doe`})]}),(0,p.jsxs)(`div`,{className:`mb-3`,children:[(0,p.jsx)(`label`,{className:`goslot-label`,children:`EMAIL ADDRESS`}),(0,p.jsx)(`input`,{type:`email`,className:`goslot-input`,required:!0,value:g,onChange:e=>_(e.target.value),placeholder:`admin@example.com`})]}),(0,p.jsxs)(`div`,{className:`mb-3`,children:[(0,p.jsx)(`label`,{className:`goslot-label`,children:`PHONE NUMBER`}),(0,p.jsx)(`input`,{type:`tel`,className:`goslot-input`,required:!0,value:v,onChange:e=>y(e.target.value),placeholder:`10-digit phone number`,pattern:`[0-9]{10}`,maxLength:`10`})]}),(0,p.jsxs)(`div`,{className:`mb-4`,children:[(0,p.jsxs)(`div`,{className:`d-flex justify-content-between align-items-center`,children:[(0,p.jsx)(`label`,{className:`goslot-label mb-0`,children:`PASSWORD`}),b&&(0,p.jsx)(`span`,{className:`fs-8 fw-bold`,style:{color:R.color},children:R.label})]}),(0,p.jsxs)(`div`,{className:`position-relative mt-2`,children:[(0,p.jsx)(`input`,{type:S?`text`:`password`,className:`goslot-input`,style:{paddingRight:`2.75rem`},required:!0,value:b,onChange:e=>x(e.target.value),placeholder:`••••••••`}),(0,p.jsx)(`button`,{type:`button`,className:`position-absolute border-0 bg-transparent`,style:{right:`10px`,top:`50%`,transform:`translateY(-50%)`,color:`#6b7280`},onClick:()=>C(!S),tabIndex:-1,children:S?(0,p.jsx)(d,{size:18}):(0,p.jsx)(s,{size:18})})]}),b&&(0,p.jsx)(`div`,{className:`strength-bar-container`,children:(0,p.jsx)(`div`,{className:`strength-bar-fill`,style:{width:`${R.score}%`,backgroundColor:R.color}})})]}),(0,p.jsx)(`button`,{type:`submit`,className:`goslot-btn-green mb-2`,disabled:O,children:O?`Creating Account...`:`Register`}),(0,p.jsx)(`div`,{className:`goslot-divider`,children:`OR`}),(0,p.jsx)(`div`,{className:`d-flex justify-content-center`,children:(0,p.jsx)(a,{onSuccess:F,onError:I,useOneTap:!1})}),(0,p.jsxs)(`div`,{className:`text-center mt-4 pt-3 border-top`,children:[(0,p.jsx)(`span`,{className:`text-muted fs-7`,children:`Already have an account? `}),(0,p.jsx)(t,{to:`/login`,className:`text-decoration-none fw-bold`,style:{color:`#FF5722`},children:`Sign In Here`})]})]})]})})]})}export{h as default};