import React, { useState, useEffect } from 'react';
import './InvoiceHistory.css';
import * as logisticsService from '../services/logisticsService';
import { getCurrentUser } from '../services/authService';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await logisticsService.getInvoices(user.id);
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = invoices?.reduce((sum, inv) => sum + (inv?.totalPrice || 0), 0) || 0;

  if (loading) return <div className="loading">Loading invoices...</div>;

  return (
    <div className="invoice-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="invoice-header">
          <span className="section-label">Finance</span>
          <h1>Invoice History</h1>
          <p className="text-muted">Manage and download your rental receipts.</p>
        </header>

        <div className="invoice-table-container glass">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.length > 0 ? invoices.map(inv => (
                <tr key={inv?.id || Math.random()}>
                  <td className="inv-id">#{inv?.id?.substring(0, 8) || 'N/A'}</td>
                  <td>{inv?.startDate ? new Date(inv.startDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{inv?.vehicleName || 'Unknown Vehicle'}</td>
                  <td className="inv-amount">LKR {(inv?.totalPrice ?? 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${(inv?.status || 'UNKNOWN').toLowerCase()}`}>
                      {inv?.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-ghost btn-sm" onClick={() => alert('Downloading invoice PDF...')}>Download PDF</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary-cards">
          <div className="summary-card glass">
            <h4>Total Spent</h4>
            <p>LKR {totalSpent.toLocaleString()}</p>
          </div>
          <div className="summary-card glass">
            <h4>Invoices</h4>
            <p>{invoices.length} Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistory;

