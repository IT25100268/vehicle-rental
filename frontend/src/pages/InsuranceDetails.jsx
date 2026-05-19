import React from 'react';
import './InsuranceDetails.css';

const InsuranceDetails = () => {
  return (
    <div className="insurance-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="insurance-header">
          <span className="section-label">Protection</span>
          <h1>Insurance & Coverage</h1>
          <p className="text-muted">Drive with peace of mind. Choose the plan that fits your needs.</p>
        </header>

        <div className="plans-grid">
          <div className="plan-card glass">
            <div className="plan-header">
              <h3>Basic Protection</h3>
              <div className="plan-price">Included</div>
            </div>
            <ul className="plan-features">
              <li>Third-Party Liability</li>
              <li>Standard Roadside Assist</li>
              <li>LKR 50,000 Deductible</li>
            </ul>
            <button className="btn-ghost w-full">Current Plan</button>
          </div>

          <div className="plan-card glass featured">
            <div className="plan-header">
              <span className="popular-badge">Most Popular</span>
              <h3>Premium Cover</h3>
              <div className="plan-price">LKR 500<span>/day</span></div>
            </div>
            <ul className="plan-features">
              <li>Collision Damage Waiver</li>
              <li>Theft Protection</li>
              <li>LKR 10,000 Deductible</li>
              <li>24/7 Priority Assist</li>
            </ul>
            <button className="btn-primary w-full">Upgrade Now</button>
          </div>

          <div className="plan-card glass">
            <div className="plan-header">
              <h3>Total Freedom</h3>
              <div className="plan-price">LKR 1,200<span>/day</span></div>
            </div>
            <ul className="plan-features">
              <li>Full Damage Waiver</li>
              <li>Zero Deductible</li>
              <li>Personal Accident Cover</li>
              <li>Tire & Glass Protection</li>
            </ul>
            <button className="btn-ghost w-full">Select Plan</button>
          </div>
        </div>

        <div className="faq-mini glass">
          <h3>Common Questions</h3>
          <div className="q-item">
            <h4>What is a deductible?</h4>
            <p>The maximum amount you'll have to pay in case of damage before insurance kicks in.</p>
          </div>
          <div className="q-item">
            <h4>Does it cover theft?</h4>
            <p>Premium and Total Freedom plans include full theft protection.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceDetails;
