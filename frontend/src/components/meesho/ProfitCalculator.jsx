import React, { useState } from 'react';
import { Calculator, ArrowRight, Percent, CheckCircle2, TrendingUp } from 'lucide-react';

export default function ProfitCalculator() {
  const [sourcePrice, setSourcePrice] = useState(350);
  const [sellingPrice, setSellingPrice] = useState(799);
  const [shippingFee, setShippingFee] = useState(45);
  const [platformFeePct, setPlatformFeePct] = useState(2);
  const [gatewayFeePct, setGatewayFeePct] = useState(2);
  const [monthlyUnits, setMonthlyUnits] = useState(100);

  const parsedSource = parseFloat(sourcePrice) || 0;
  const parsedSelling = parseFloat(sellingPrice) || 0;
  const parsedShipping = parseFloat(shippingFee) || 0;

  const platformFee = (parsedSelling * (parseFloat(platformFeePct) || 0)) / 100;
  const gatewayFee = (parsedSelling * (parseFloat(gatewayFeePct) || 0)) / 100;

  const grossMargin = Math.max(0, parsedSelling - parsedSource);
  const netProfitPerUnit = Math.max(0, parsedSelling - parsedSource - parsedShipping - platformFee - gatewayFee);
  const netMarginPct = parsedSelling > 0 ? ((netProfitPerUnit / parsedSelling) * 100).toFixed(1) : 0;
  const projectedMonthlyProfit = netProfitPerUnit * (parseInt(monthlyUnits, 10) || 0);

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="card-header bg-white border-bottom p-4">
        <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
          <Calculator size={20} className="text-success" /> Profit & Margin Calculator
        </h5>
        <p className="text-secondary fs-8 mb-0">
          Simulate real unit economics, payment gateway costs, shipping, and expected monthly income.
        </p>
      </div>

      <div className="card-body p-4">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-7">
            <div className="row g-3">
              <div className="col-6">
                <label className="fw-bold mb-1 text-dark fs-8">Supplier Price (Meesho) ₹</label>
                <input
                  type="number"
                  className="form-control fs-7"
                  value={sourcePrice}
                  onChange={(e) => setSourcePrice(e.target.value)}
                />
              </div>

              <div className="col-6">
                <label className="fw-bold mb-1 text-dark fs-8">Customer Selling Price ₹</label>
                <input
                  type="number"
                  className="form-control fs-7 fw-bold text-primary"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>

              <div className="col-4">
                <label className="fw-bold mb-1 text-dark fs-8">Shipping (₹)</label>
                <input
                  type="number"
                  className="form-control fs-8"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                />
              </div>

              <div className="col-4">
                <label className="fw-bold mb-1 text-dark fs-8">Platform Fee (%)</label>
                <input
                  type="number"
                  className="form-control fs-8"
                  value={platformFeePct}
                  onChange={(e) => setPlatformFeePct(e.target.value)}
                />
              </div>

              <div className="col-4">
                <label className="fw-bold mb-1 text-dark fs-8">PG Fee (%)</label>
                <input
                  type="number"
                  className="form-control fs-8"
                  value={gatewayFeePct}
                  onChange={(e) => setGatewayFeePct(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="fw-bold mb-1 text-dark fs-8">Projected Monthly Sales Units</label>
                <input
                  type="range"
                  className="form-range"
                  min="10"
                  max="1000"
                  step="10"
                  value={monthlyUnits}
                  onChange={(e) => setMonthlyUnits(e.target.value)}
                />
                <div className="d-flex justify-content-between fs-9 text-muted">
                  <span>10 orders/mo</span>
                  <span className="fw-bold text-dark">{monthlyUnits} orders/mo</span>
                  <span>1,000 orders/mo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="p-4 rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fs-8 text-light text-uppercase tracking-wider">Unit Economics</span>
                <span className="badge bg-success text-white fs-8">{netMarginPct}% Net Margin</span>
              </div>

              <div className="d-flex justify-content-between fs-8 text-light mb-1">
                <span>Gross Margin:</span>
                <strong className="text-white">₹{grossMargin.toFixed(2)}</strong>
              </div>

              <div className="d-flex justify-content-between fs-8 text-light mb-1">
                <span>Shipping & Gateways:</span>
                <span className="text-danger">-₹{(parsedShipping + platformFee + gatewayFee).toFixed(2)}</span>
              </div>

              <hr className="border-secondary my-3" />

              <div className="d-flex justify-content-between align-items-baseline mb-3">
                <span className="fs-7 text-light">Net Profit Per Order:</span>
                <h4 className="fw-bold mb-0 text-success">₹{netProfitPerUnit.toFixed(2)}</h4>
              </div>

              <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="fs-8 text-light mb-1 d-flex align-items-center gap-1">
                  <TrendingUp size={14} className="text-warning" /> Projected Monthly Profit ({monthlyUnits} units):
                </div>
                <div className="fs-4 fw-bold text-warning">₹{projectedMonthlyProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
