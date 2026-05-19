import React, { useState, useEffect } from 'react';
import './FaqCenter.css';
import * as eduService from '../services/eduService';

const FaqCenter = () => {
  const [activeId, setActiveId] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await eduService.getFaqs();
        setFaqs(data);
      } catch (error) {
        console.error('Failed to fetch FAQs');
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  if (loading) return <div className="loading">Loading help center...</div>;

  return (
    <div className="faq-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="faq-header">
          <span className="section-label">Help Center</span>
          <h1>Frequently Asked Questions</h1>
          <p className="text-muted">Everything you need to know about renting with SmartRide.</p>
        </header>

        <div className="faq-container">
          <div className="faq-categories">
            {['General', 'Payments', 'Vehicle Usage', 'Insurance'].map(cat => (
              <button key={cat} className={`cat-btn glass ${cat === 'General' ? 'active' : ''}`}>{cat}</button>
            ))}
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item glass ${activeId === index ? 'open' : ''}`} onClick={() => setActiveId(activeId === index ? null : index)}>
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  <span className="toggle-icon">{activeId === index ? '-' : '+'}</span>
                </div>
                {activeId === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="still-need-help glass">
          <h3>Still need help?</h3>
          <p>If you can't find the answer you're looking for, our support team is here to help.</p>
          <button className="btn-primary" onClick={() => window.location.href='/support'}>Contact Support</button>
        </div>
      </div>
    </div>
  );
};

export default FaqCenter;

