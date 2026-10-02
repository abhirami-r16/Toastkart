import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{h as t,i as n,n as r,u as i}from"./index-DcS3vN9J.js";import{n as a}from"./user-CKL97tmt.js";import{t as o}from"./shopping-cart-CBVhCYXM.js";import{t as s}from"./imageUtils-COgAE6LO.js";import{n as c}from"./StorefrontCartContext-CN5-gKth.js";var l=e(t(),1),u=r();function d({storeData:e,products:t,categories:r,config:d}){let{addToCart:f,toggleWishlist:p,isInWishlist:m}=c();i();let[h,g]=(0,l.useState)(0);(0,l.useEffect)(()=>{},[d?.style?.heroImages]);let _=(()=>{let e=window.location.pathname;return e.startsWith(`/store/`)?`/store/${e.split(`/`)[2]}`:`/storefront`})(),v=(0,l.useMemo)(()=>({"--ai-primary":d?.colors?.primary||`#1c2226`,"--ai-secondary":d?.colors?.secondary||`#f1f2f4`,"--ai-accent":d?.colors?.accent||`#FF5722`,"--ai-bg":d?.colors?.background||`#ffffff`,"--ai-surface":d?.colors?.surface||`#ffffff`,"--ai-text":d?.colors?.text||`#202223`,"--ai-muted":d?.colors?.mutedText||`#6c757d`,"--ai-btn-bg":d?.colors?.buttonBackground||d?.colors?.primary||`#1c2226`,"--ai-btn-text":d?.colors?.buttonText||`#ffffff`,"--ai-border":d?.colors?.border||`#e9ecef`,"--ai-hover":d?.colors?.hover||d?.colors?.secondary||`#e63a61`,"--ai-heading-font":d?.typography?.headingFont||`Inter, sans-serif`,"--ai-body-font":d?.typography?.bodyFont||`Inter, sans-serif`,"--ai-border-radius":d?.style?.borderRadius||`12px`,fontFamily:`var(--ai-body-font)`,backgroundColor:`var(--ai-bg)`,color:`var(--ai-text)`}),[d]);if(!d)return(0,u.jsx)(`div`,{className:`p-5 text-center`,children:`Invalid Store Configuration`});let y=(i,c)=>{switch(i.type){case`hero`:let l=d?.style?.heroImages&&Array.isArray(d.style.heroImages)&&d.style.heroImages.length>0?d.style.heroImages:d?.style?.heroImage?[d.style.heroImage]:[];return(0,u.jsxs)(`div`,{className:`d-flex align-items-center justify-content-center text-center p-5 mb-5 position-relative overflow-hidden`,style:{minHeight:`60vh`,color:`var(--ai-bg)`,borderBottomLeftRadius:`var(--ai-border-radius)`,borderBottomRightRadius:`var(--ai-border-radius)`},children:[l.length>0?l.map((e,t)=>(0,u.jsx)(`div`,{className:`position-absolute w-100 h-100 top-0 start-0`,style:{backgroundImage:`url(${e})`,backgroundSize:`cover`,backgroundPosition:`center`,opacity:+(t===h),transition:`opacity 1.5s ease-in-out`,zIndex:0}},t)):(0,u.jsx)(`div`,{className:`position-absolute w-100 h-100 top-0 start-0`,style:{background:`linear-gradient(135deg, var(--ai-primary) 0%, var(--ai-secondary) 100%)`,zIndex:0}}),(0,u.jsx)(`div`,{className:`position-absolute w-100 h-100 top-0 start-0`,style:{background:`rgba(0, 0, 0, 0.4)`,zIndex:1}}),(0,u.jsxs)(`div`,{className:`ai-hero-text-container`,style:{position:`relative`,maxWidth:800,zIndex:100},children:[(0,u.jsx)(`style`,{children:`
                .storefront-app-root .ai-hero-text-container h1,
                .storefront-app-root .ai-hero-text-container p,
                .storefront-app-root .ai-hero-text-container span {
                  color: #ffffff !important;
                }
              `}),(0,u.jsx)(`h1`,{className:`display-3 fw-bold mb-4`,style:{textShadow:`0 2px 10px rgba(0,0,0,0.8)`},children:i.title||e.name}),(0,u.jsx)(`p`,{className:`lead mb-4`,style:{textShadow:`0 1px 5px rgba(0,0,0,0.8)`},children:i.subtitle||e.description}),(0,u.jsxs)(`div`,{className:`d-flex gap-3 justify-content-center mt-4`,children:[(0,u.jsx)(`a`,{href:`#shop`,className:`btn btn-lg fw-bold px-5 py-3 shadow`,style:{background:`var(--ai-accent)`,color:`#ffffff`,borderRadius:`var(--ai-border-radius)`,border:`none`},children:i.cta||`Shop Now`}),(0,u.jsx)(`a`,{href:`#shop`,className:`btn btn-lg fw-bold px-5 py-3 shadow`,style:{background:`transparent`,color:`#ffffff`,borderRadius:`var(--ai-border-radius)`,border:`2px solid #ffffff`},children:`Explore Collection`})]})]})]},c);case`categories`:return null;case`featured_products`:{let e=e=>(0,u.jsx)(`div`,{className:`col-12 col-md-4 col-lg-3`,children:(0,u.jsxs)(`div`,{className:`card h-100 border-0`,style:{cssText:d?.style?.cardStyle||``,borderRadius:`var(--ai-border-radius)`,overflow:`hidden`},children:[(0,u.jsx)(n,{to:{pathname:`${_}/product/${e.id}`,search:window.location.search},className:`text-decoration-none`,children:(0,u.jsx)(`div`,{className:`position-relative`,style:{paddingBottom:`100%`,background:`#f8f9fa`},children:(0,u.jsx)(`img`,{src:s(e.image,e.name),alt:e.name,className:`position-absolute w-100 h-100`,style:{objectFit:`cover`,top:0,left:0}})})}),(0,u.jsx)(`button`,{className:`btn position-absolute top-0 end-0 m-2 rounded-circle shadow-sm bg-white`,style:{width:`35px`,height:`35px`,padding:`0`,display:`flex`,alignItems:`center`,justifyContent:`center`,color:m(e.id)?`#ff4757`:`#ced4da`,zIndex:10},onClick:t=>{t.preventDefault(),t.stopPropagation(),p(e)},children:(0,u.jsx)(a,{size:18,fill:m(e.id)?`#ff4757`:`none`})}),(0,u.jsxs)(`div`,{className:`card-body p-4 d-flex flex-column`,style:{background:`var(--ai-bg)`},children:[(0,u.jsx)(n,{to:{pathname:`${_}/product/${e.id}`,search:window.location.search},className:`text-decoration-none`,children:(0,u.jsx)(`h5`,{className:`card-title text-truncate fw-bold mb-2`,style:{color:`var(--ai-text)`},children:e.name})}),e.size&&(0,u.jsxs)(`div`,{className:`mb-2 text-muted`,style:{fontSize:`0.85rem`},children:[(0,u.jsx)(`span`,{className:`fw-bold`,children:`Size:`}),` `,e.size]}),(0,u.jsxs)(`div`,{className:`d-flex align-items-center mb-3 mt-auto`,children:[(0,u.jsxs)(`span`,{className:`fw-bold fs-5 me-2`,style:{color:`var(--ai-text)`},children:[`₹`,e.price]}),e.compare_price&&(0,u.jsxs)(`span`,{className:`text-muted text-decoration-line-through`,style:{fontSize:`0.9rem`},children:[`₹`,e.compare_price]})]}),(0,u.jsxs)(`button`,{onClick:()=>f(e,1),className:`btn mt-auto w-100 fw-bold d-flex align-items-center justify-content-center gap-2`,style:{background:`var(--ai-primary)`,color:`var(--ai-bg)`,borderRadius:`var(--ai-border-radius)`},children:[(0,u.jsx)(o,{size:18}),` Add to Cart`]})]})]})},e.id),l=[];t.forEach(e=>{let t=e.category&&typeof e.category==`object`?e.category.name||`Uncategorized`:e.category||`Uncategorized`;l.some(e=>String(e).toLowerCase()===String(t).toLowerCase())||l.push(t)});let h=[];r&&r.length>0&&r.forEach(e=>{h.push({id:e.id,name:e.name,slug:e.slug||String(e.name||``).toLowerCase().replace(/[^a-z0-9]/g,``)})}),l.forEach(e=>{h.some(t=>String(t.name||``).toLowerCase()===String(e).toLowerCase()||String(t.id)===String(e))||h.push({id:e,name:e,slug:String(e).toLowerCase().replace(/[^a-z0-9]/g,``)})});let g=h.filter(e=>t.some(t=>{let n=String((t.category&&typeof t.category==`object`?t.category.name:t.category)||`Uncategorized`).toLowerCase();return n===String(e.id).toLowerCase()||n===String(e.name||``).toLowerCase()||n===String(e.slug||``).toLowerCase()}));return g.length>0?(0,u.jsx)(`div`,{style:{backgroundColor:`#ffffff`,width:`100%`,padding:`60px 0`},children:(0,u.jsx)(`div`,{className:`container mb-5 pb-5`,children:g.map((n,r)=>{let i=t.filter(e=>{let t=String((e.category&&typeof e.category==`object`?e.category.name:e.category)||`Uncategorized`).toLowerCase();return t===String(n.id).toLowerCase()||t===String(n.name||``).toLowerCase()||t===String(n.slug||``).toLowerCase()});return i.length===0?null:(0,u.jsxs)(`div`,{id:n.slug,className:`mb-5 pt-4`,style:{scrollMarginTop:`100px`},children:[(0,u.jsx)(`h2`,{className:`text-start mb-4 fw-bold text-uppercase`,style:{fontFamily:`var(--ai-heading-font)`,color:`#1a1a1a`,letterSpacing:`1px`},children:n.name}),(0,u.jsx)(`div`,{className:`row g-4`,children:i.map(e)})]},n.id||n.name)})})},c):(0,u.jsx)(`div`,{style:{backgroundColor:`#ffffff`,width:`100%`,padding:`60px 0`},children:(0,u.jsxs)(`div`,{id:`shop`,className:`container mb-5 pb-5`,style:{scrollMarginTop:`100px`},children:[(0,u.jsx)(`h2`,{className:`text-start mb-4 fw-bold text-uppercase`,style:{fontFamily:`var(--ai-heading-font)`,color:`#1a1a1a`,letterSpacing:`1px`},children:i.title||`Featured Products`}),(0,u.jsx)(`div`,{className:`row g-4`,children:t.slice(0,8).map(e)})]})},c)}default:return null}};return(0,u.jsxs)(`div`,{style:v,className:`min-vh-100`,children:[(0,u.jsx)(`style`,{children:`
        body, .storefront-body, .storefront-main-content {
          background-color: var(--ai-bg) !important;
          color: var(--ai-text) !important;
        }
        .storefront-header, .hexashop-header, .eflyer-header {
          background-color: var(--ai-surface) !important;
          color: var(--ai-text) !important;
          border-bottom: none !important;
        }
        .storefront-footer {
          background-color: #1e3a8a !important; /* Premium dark blue */
          color: #ffffff !important;
          border-top: none !important;
        }
        .storefront-footer h4, .storefront-footer p {
          color: #ffffff !important;
          opacity: 0.9;
        }
        .hexashop-nav-item, .storefront-nav-item, .hexashop-icon-btn, .storefront-icon-btn {
          color: var(--ai-text) !important;
        }
        .hexashop-nav-item:hover, .storefront-nav-item:hover, .hexashop-icon-btn:hover {
          color: var(--ai-primary) !important;
        }
        .card, .storefront-product-card {
          background-color: var(--ai-surface) !important;
          border: 1px solid var(--ai-border) !important;
        }
        .card-body {
          background-color: var(--ai-surface) !important;
        }
        .btn-ai, .add-to-cart-btn {
          background-color: var(--ai-btn-bg) !important;
          color: var(--ai-btn-text) !important;
          border-color: var(--ai-btn-bg) !important;
        }
        .btn-ai:hover, .add-to-cart-btn:hover {
          background-color: var(--ai-hover) !important;
          border-color: var(--ai-hover) !important;
        }
        .text-muted {
          color: var(--ai-muted) !important;
        }
      `}),d.sections&&d.sections.map((e,t)=>y(e,t))]})}export{d as default};