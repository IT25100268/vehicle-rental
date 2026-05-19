import React, { useState, useEffect } from 'react';
import './ActivityLogs.css';
import * as logService from '../services/logService';
import { getCurrentUser } from '../services/authService';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, []);

  const fetchLogs = async () => {
    try {
      if (!user?.id) {
        setLogs([]);
        return;
      }
      const data = await logService.getUserLogs(user.id);
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch (e) {
      return timeString;
    }
  };

  if (loading) return <div className="loading">Loading logs...</div>;

  return (
    <div className="activity-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="activity-header">
          <span className="section-label">Security</span>
          <h1>Activity Logs</h1>
          <p className="text-muted">Monitor your account activity for security purposes.</p>
        </header>

        <div className="logs-list glass">
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} className="log-item">
              <div className="log-icon">
                {(log.event || '').includes('Failed') ? '⚠️' : '✅'}
              </div>
              <div className="log-main">
                <div className="log-event">
                  <h4>{log.event}</h4>
                  <span className="log-time">{formatTime(log.time)}</span>
                </div>
                <div className="log-details">
                  <span>Device: {log.device}</span>
                  <span>•</span>
                  <span>Location: {log.location}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-logs">
              <p>No device activity is stored on the server. Bookings and support tickets are your primary account history.</p>
              <p className="text-muted">Optional entries can be recorded locally in this browser using the log service.</p>
            </div>
          )}
        </div>

        <div className="security-actions glass">
          <div className="action-text">
            <h3>Secure Your Account</h3>
            <p>If you see any suspicious activity, we recommend changing your password and signing out of all devices.</p>
          </div>
          <button className="btn-primary" onClick={() => alert('Feature coming soon!')}>Sign Out Everywhere</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;

