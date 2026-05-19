import React from 'react';
import './SafetyGuidelines.css';

const SafetyGuidelines = () => {
  const guidelines = [
    { title: 'Pre-Ride Check', desc: 'Always inspect tires, lights, and brakes before starting your journey.', icon: '🔍' },
    { title: 'Wear Helmets', desc: 'Safety first! Helmets are mandatory for all bike and three-wheeler rentals.', icon: '🪖' },
    { title: 'Speed Limits', desc: 'Adhere to local speed limits. Colombo city limit is usually 40km/h.', icon: '🏎️' },
    { title: 'No Drunk Driving', desc: 'Zero tolerance for driving under the influence. Your safety is our priority.', icon: '🚫' },
  ];

  return (
    <div className="safety-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="safety-header">
          <span className="section-label">Safety First</span>
          <h1>Your Safety is Our Priority</h1>
          <p className="text-muted">Follow these essential guidelines for a secure and pleasant rental experience in Sri Lanka.</p>
        </header>

        <div className="guidelines-grid">
          {guidelines.map((g, i) => (
            <div key={i} className="safety-card glass hover-pop">
              <div className="safety-icon">{g.icon}</div>
              <h3>{g.title}</h3>
              <p>{g.desc}</p>
            </div>
          ))}
        </div>

        <div className="emergency-contact glass">
          <div className="emergency-info">
            <h3>Emergency Assistance</h3>
            <p>In case of any accidents or breakdowns, call our 24/7 hotline immediately.</p>
          </div>
          <div className="emergency-numbers">
            <div className="num-item">
              <span className="label">SmartRide Support</span>
              <span className="value">+94 77 123 4567</span>
            </div>
            <div className="num-item">
              <span className="label">Police Emergency</span>
              <span className="value">119</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyGuidelines;
