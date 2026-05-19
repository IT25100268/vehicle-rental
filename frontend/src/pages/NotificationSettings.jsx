import React from 'react';
import './NotificationSettings.css';

const NotificationSettings = ({ notify }) => {
  return (
    <div className="notifications-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="notifications-header">
          <span className="section-label">Preferences</span>
          <h1>Notification Settings</h1>
          <p className="text-muted">Choose how you want to stay updated with SmartRide.</p>
        </header>

        <div className="settings-container glass">
          <div className="settings-section">
            <h3>Email Notifications</h3>
            <div className="toggle-list">
              {[
                { title: 'Booking Confirmations', desc: 'Receive details of your successful bookings.' },
                { title: 'Reminders & Alerts', desc: 'Get notified before your rental starts or ends.' },
                { title: 'Promotions & Offers', desc: 'Stay updated with latest discounts and rewards.' },
              ].map((s, i) => (
                <div key={i} className="toggle-item">
                  <div className="toggle-text">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="divider"></div>

          <div className="settings-section">
            <h3>SMS Notifications</h3>
            <div className="toggle-list">
              {[
                { title: 'OTP & Verification', desc: 'Essential for secure login and account changes.' },
                { title: 'Driver Updates', desc: 'Get real-time updates about your driver arrival.' },
              ].map((s, i) => (
                <div key={i} className="toggle-item">
                  <div className="toggle-text">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked={i === 0} />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-footer">
            <button className="btn-primary" onClick={() => notify('Settings saved!', 'success')}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
