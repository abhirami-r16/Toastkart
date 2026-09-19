import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{n as t,t as n}from"./jsx-runtime-DRF4vMFQ.js";import{t as r}from"./axios-CxvAivo9.js";import{n as i}from"./AuthContext-WiRgnGvq.js";import{d as a}from"./index-FM0W24Ae.js";import{t as o}from"./useSEO-BmENIZIe.js";import{t as s}from"./ToastKartLogo-h2EovWfc.js";var c=e(t(),1),l=n(),u={monthly:[{id:`basic`,name:`Basic`,price:499,features:[`Online Store`,`ToastKart Subdomain`,`Up to 50 Products`,`Order Management`,`Payment Integration`,`WhatsApp Integration`,`Email Support`]},{id:`growth`,name:`Growth`,price:999,features:[`Everything in Basic`,`Custom Domain`,`Up to 500 Products`,`Advanced Analytics`,`Priority Support`]},{id:`pro`,name:`Pro`,price:1999,features:[`Everything in Growth`,`Unlimited Products`,`Advanced Analytics`,`Priority Support`]}],yearly:[{id:`basic`,name:`Basic`,price:4999,features:[`Online Store`,`ToastKart Subdomain`,`Up to 50 Products`,`Order Management`,`Payment Integration`,`WhatsApp Integration`,`Email Support`]},{id:`growth`,name:`Growth`,price:9999,features:[`Everything in Basic`,`Custom Domain`,`Up to 500 Products`,`Advanced Analytics`,`Priority Support`]},{id:`pro`,name:`Pro`,price:19999,features:[`Everything in Growth`,`Unlimited Products`,`Advanced Analytics`,`Priority Support`]}]},d=`
  .plans-bg {
    background: #f8f9fa;
    min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    padding-bottom: 4rem;
  }
  .plans-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    margin-bottom: 3rem;
  }
  .billing-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }
  .toggle-btn {
    background: #e2e8f0;
    color: #475569;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .toggle-btn.active {
    background: #FF5722;
    color: white;
  }
  .savings-badge {
    background: #10b981;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-weight: bold;
    margin-left: 0.5rem;
  }
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  @media (min-width: 768px) {
    .plans-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .plan-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 2.5rem 2rem;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    border: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: transform 0.2s;
  }
  @media (max-width: 480px) {
    .plan-card {
      padding: 1.5rem 1rem;
    }
    .plan-price {
      font-size: 2rem !important;
    }
  }
  .plan-card:hover {
    transform: translateY(-5px);
    border: 2px solid #FF5722;
  }
  .plan-card:hover .plan-btn {
    background: #FF5722;
    color: white;
  }
  .plan-card:hover .plan-btn:hover {
    background: #E64A19;
  }
  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #FF5722;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 1rem;
    border-radius: 9999px;
    text-transform: uppercase;
  }
  .plan-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }
  .plan-price {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1a1a1a;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }
  .plan-price span {
    font-size: 1rem;
    font-weight: 500;
    color: #64748b;
  }
  .plan-features {
    margin: 2rem 0;
    flex-grow: 1;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    color: #475569;
  }
  .feature-icon {
    color: #10b981;
  }
  .plan-btn {
    width: 100%;
    padding: 1rem;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 1.1rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .plan-btn-primary {
    background: #FF5722;
    color: white;
  }
  .plan-btn-primary:hover {
    background: #E64A19;
  }
  .plan-btn-secondary {
    background: #f1f5f9;
    color: #1a1a1a;
  }
  .plan-btn-secondary:hover {
    background: #e2e8f0;
  }
  .loading-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
`;function f(){let[e,t]=(0,c.useState)(`monthly`),[n,f]=(0,c.useState)(!1),[p,m]=(0,c.useState)(!1),[h,g]=(0,c.useState)(``),{user:_,refreshUser:v}=i(),y=a();o({title:`Select a Plan - ToastKart`,description:`Choose a subscription plan for your store`}),(0,c.useEffect)(()=>{n||(_?(_.active_subscription||_.activeSubscription)&&y(`/owner/dashboard`,{replace:!0}):y(`/login`,{replace:!0}))},[_,n,y]),(0,c.useEffect)(()=>{if(window.Razorpay){m(!0);return}let e=document.createElement(`script`);return e.src=`https://checkout.razorpay.com/v1/checkout.js`,e.async=!0,e.onload=()=>{m(!0)},e.onerror=()=>{g(`Failed to load Razorpay SDK. Please check your network connection.`)},document.body.appendChild(e),()=>{}},[]);let b=async t=>{if(!p){g(`Razorpay is still loading. Please wait a moment and try again.`);return}f(!0),g(``);try{let n=await r.post(`/subscriptions/order`,{plan:t,billing_cycle:e});if(!n.data.success)throw Error(n.data.message||`Failed to create order`);let{order_id:i,amount:a,currency:o}=n.data,s={key:`rzp_live_Tdrd9TNusHdI9T`,amount:a,currency:o,name:`ToastKart`,description:`${t.charAt(0).toUpperCase()+t.slice(1)} Plan (${e})`,image:`https://www.toastkart.com/favicon.png`,order_id:i,handler:async function(e){try{f(!0);let t=await r.post(`/subscriptions/verify`,{razorpay_order_id:e.razorpay_order_id,razorpay_payment_id:e.razorpay_payment_id,razorpay_signature:e.razorpay_signature});t.data.success?(await v(),y(`/owner/dashboard`)):(g(t.data.message||`Payment verification failed.`),f(!1))}catch{g(`Error verifying payment. Please contact support if amount was deducted.`),f(!1)}},prefill:{name:_?.name||``,email:_?.email||``,..._?.phone?{contact:_.phone}:{}},theme:{color:`#FF5722`},modal:{ondismiss:function(){f(!1)}}},c=new window.Razorpay(s);c.on(`payment.failed`,function(e){g(e.error.description||`Payment failed.`),f(!1)}),c.open()}catch(e){g(e.response?.data?.message||e.message||`An error occurred while setting up the payment.`),f(!1)}},x=u[e];return(0,l.jsxs)(`div`,{className:`plans-bg`,children:[(0,l.jsx)(`style`,{dangerouslySetInnerHTML:{__html:d}}),n&&(0,l.jsx)(`div`,{className:`loading-overlay`,children:(0,l.jsx)(`div`,{className:`spinner-border text-primary`,style:{width:`3rem`,height:`3rem`}})}),(0,l.jsxs)(`nav`,{className:`plans-nav`,children:[(0,l.jsx)(`div`,{className:`d-flex align-items-center gap-2`,children:(0,l.jsx)(s,{width:140})}),(0,l.jsx)(`div`,{children:(0,l.jsx)(`button`,{className:`btn rounded-pill`,style:{backgroundColor:`#FF5722`,color:`white`,border:`none`,padding:`0.5rem 1.5rem`,fontWeight:`600`},onClick:async()=>{await r.post(`/logout`),window.location.href=`/login`},children:`Logout`})})]}),(0,l.jsxs)(`div`,{className:`container`,children:[(0,l.jsxs)(`div`,{className:`text-center mb-5`,children:[(0,l.jsx)(`h1`,{className:`fw-bold mb-3`,children:`Choose the right plan for your business`}),(0,l.jsx)(`p`,{className:`text-muted fs-5`,children:`Upgrade your ToastKart store and unlock powerful features.`})]}),h&&(0,l.jsx)(`div`,{className:`alert alert-danger text-center max-w-md mx-auto mb-4`,style:{maxWidth:`600px`,margin:`0 auto`},children:h}),(0,l.jsxs)(`div`,{className:`billing-toggle`,children:[(0,l.jsx)(`button`,{className:`toggle-btn ${e===`monthly`?`active`:``}`,onClick:()=>t(`monthly`),children:`Monthly`}),(0,l.jsx)(`button`,{className:`toggle-btn ${e===`yearly`?`active`:``}`,onClick:()=>t(`yearly`),children:`Yearly`})]}),(0,l.jsx)(`div`,{className:`plans-grid`,children:x.map(t=>(0,l.jsxs)(`div`,{className:`plan-card`,children:[(0,l.jsx)(`div`,{className:`plan-name`,children:t.name}),(0,l.jsxs)(`div`,{className:`plan-price`,children:[`₹`,t.price.toLocaleString(`en-IN`),(0,l.jsxs)(`span`,{children:[`/ `,e===`monthly`?`month`:`year`]})]}),(0,l.jsx)(`div`,{className:`plan-features`,children:t.features.map((e,t)=>(0,l.jsxs)(`div`,{className:`feature-item`,children:[(0,l.jsxs)(`svg`,{className:`feature-icon`,width:`20`,height:`20`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,l.jsx)(`path`,{d:`M22 11.08V12a10 10 0 1 1-5.93-9.14`}),(0,l.jsx)(`polyline`,{points:`22 4 12 14.01 9 11.01`})]}),e]},t))}),(0,l.jsx)(`button`,{className:`plan-btn plan-btn-secondary`,onClick:()=>b(t.id),disabled:n||!p,children:p?`Choose ${t.name}`:`Loading...`})]},t.id))})]})]})}export{f as default};