import React, { useState } from 'react';
import './Hero.css';

const Hero = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [pickUpDate, setPickUpDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    if (pickUpDate && returnDate) {
      const pDate = new Date(pickUpDate);
      const rDate = new Date(returnDate);
      if (rDate <= pDate) {
        setError('Return date must be later than pickup date.');
        return;
      }
    }
    if (!location) {
      setError('Please enter a location.');
      return;
    }
    onSearch(location);
    const results = document.getElementById('fleet');
    if (results) results.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hero-container">
      <div className="hero-bg-image" />
      <div className="hero-bg-gradient" />
      <div className="hero-bg-radial" />

      <div className="container hero-content">
        <div className="animate-in delay-1 hero-badge-container">
          <span className="badge badge-blue">🚗 Sri Lanka's #1 Vehicle Rental Platform</span>
        </div>

        <h1 className="slide-up delay-2 hero-title">
          Find & Book Your{' '}
          <span className="hero-title-accent">
            Perfect Ride
          </span>
        </h1>

        <p className="slide-up delay-3 hero-subtitle">
          Cars, bikes, vans & three-wheelers across Colombo, Kandy, Galle and beyond.
          Simple booking. Transparent pricing. Trusted drivers.
        </p>

        <div className="glass slide-up delay-4 hero-search-box">
          <div className="hero-search-grid">
            <div>
              <label className="hero-label">📍 Location</label>
              <input
                type="text"
                placeholder="Colombo, Kandy, Galle..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="hero-input"
              />
            </div>

            <div>
              <label className="hero-label">📅 Pick Up</label>
              <input
                type="date"
                value={pickUpDate}
                onChange={(e) => setPickUpDate(e.target.value)}
                className="hero-input"
              />
            </div>

            <div>
              <label className="hero-label">📅 Return</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="hero-input"
              />
            </div>

            <button
              onClick={handleSearch}
              className="btn-primary pulse hero-search-btn"
            >
              🔍 Search Vehicles
            </button>
          </div>

          {error && (
            <div className="hero-error scale-in">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="slide-up delay-5 hero-chips-container">
          {['✅ Free cancellation', '🛡️ Insured vehicles', '📞 24/7 support', '💳 Flexible payments'].map((chip) => (
            <span key={chip} className="hero-chip">
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-bottom-fade" />
    </div>
  );
};

export default Hero;
