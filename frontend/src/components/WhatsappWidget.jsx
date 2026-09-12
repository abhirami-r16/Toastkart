import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function WhatsappWidget() {
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const location = useLocation();
  
  const isStorefront = location.pathname.startsWith('/storefront') || location.pathname.startsWith('/store/');
  if (isStorefront) return null;

  const whatsappNumber = "919526706406";
  const defaultMessage = "I am interested to develop an online store";

  const handleWhatsappSend = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, '_blank');
    setShowWhatsappModal(false);
  };

  return (
    <>
      <style>{`
        .whatsapp-float {
          position: fixed;
          bottom: 40px;
          left: 40px;
          width: 60px;
          height: 60px;
          background-color: #25d366;
          color: #FFF;
          border-radius: 50px;
          text-align: center;
          box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .whatsapp-float:hover {
          transform: scale(1.1);
          box-shadow: 2px 2px 15px rgba(0,0,0,0.3);
        }
        .whatsapp-modal {
          position: fixed;
          bottom: 110px;
          left: 40px;
          width: 340px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 9999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 767px) {
          .whatsapp-float {
            bottom: 20px;
            left: 20px;
          }
          .whatsapp-modal {
            bottom: 90px;
            left: 20px;
            width: calc(100vw - 40px);
          }
        }
      `}</style>

      {/* WHATSAPP FLOAT */}
      <div className="whatsapp-float" onClick={() => setShowWhatsappModal(!showWhatsappModal)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </div>

      {showWhatsappModal && (
        <div className="whatsapp-modal text-start text-decoration-none">
          <div className="d-flex align-items-center justify-content-between p-3" style={{ background: '#075E54', color: '#fff' }}>
            <div className="fw-bold fs-6" style={{ margin: 0 }}>WhatsApp</div>
            <X size={20} className="cursor-pointer" onClick={() => setShowWhatsappModal(false)} />
          </div>
          <div className="p-3" style={{ 
            background: '#efeae2 url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
            minHeight: '380px', 
            position: 'relative',
            margin: 0
          }}>
            <div className="position-absolute d-flex gap-2 align-items-center" style={{ bottom: '20px', left: '20px', right: '20px' }}>
              <div className="bg-white rounded-pill py-2 px-3 flex-grow-1 shadow-sm fs-7 text-dark fw-medium" style={{ margin: 0 }}>
                {defaultMessage}
              </div>
              <button 
                onClick={handleWhatsappSend} 
                className="btn rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm border-0 cursor-pointer" 
                style={{ width: '42px', height: '42px', background: '#075E54', color: '#fff', flexShrink: 0 }}
              >
                <Send size={18} style={{ marginLeft: '-2px', marginTop: '2px' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
