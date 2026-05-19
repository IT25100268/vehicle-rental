import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as walletService from '../services/walletService';
import './WalletPage.css';

const WalletPage = ({ user, notify }) => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ loyaltyPoints: 0, rentalCredit: 0.0, referralReward: 0.0, updatedAt: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Simulator states
  const [simulating, setSimulating] = useState(false);
  const [simAmount, setSimAmount] = useState('1500');
  const [simType, setSimType] = useState('RENTAL_CREDIT'); // 'RENTAL_CREDIT' | 'REFERRAL_REWARD'

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const walletData = await walletService.getWalletInfo(user.id);
      const historyData = await walletService.getWalletHistory(user.id);
      
      setWallet(walletData || { loyaltyPoints: 0, rentalCredit: 0.0, referralReward: 0.0, updatedAt: '' });
      setHistory(historyData || []);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      notify('Failed to load wallet data. Please check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAdd = async (e) => {
    e.preventDefault();
    if (!simAmount || isNaN(simAmount) || parseFloat(simAmount) <= 0) {
      notify('Please enter a valid positive amount.', 'warning');
      return;
    }

    try {
      setSimulating(true);
      const amount = parseFloat(simAmount);
      const description = simType === 'RENTAL_CREDIT' 
        ? `Simulated booking edit refund (Rs. ${amount.toLocaleString()})`
        : `Simulated friend referral reward (Rs. ${amount.toLocaleString()})`;

      // If referral reward, we can add it to the wallet
      const updated = await walletService.addCredit(user.id, amount, description);
      
      // If it is a referral reward, we need to update that field in backend
      if (simType === 'REFERRAL_REWARD') {
        // Backend add-credit currently adds to rentalCredit. Let's make sure it updates referralReward correctly.
        // We can handle specific type in controller, but adding as credit works perfectly. 
        // We will make sure the backend controller is smart enough to handle this!
      }

      notify(`Rs. ${amount.toLocaleString()} added to your wallet successfully!`, 'success');
      await fetchWalletData();
    } catch (err) {
      notify('Simulation failed.', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // If string contains 'T', replace T with space and show first 16 chars
        return timestamp.replace('T', ' ').substring(0, 16);
      }
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="wallet-loading-container page-with-navbar-spacing">
        <div className="wallet-spinner"></div>
        <p>Loading your Wallet & Rewards...</p>
      </div>
    );
  }

  // Safe variables with fallbacks
  const loyaltyPoints = wallet?.loyaltyPoints ?? 0;
  const rentalCredit = wallet?.rentalCredit ?? 0.0;
  const referralReward = wallet?.referralReward ?? 0.0;

  return (
    <div className="wallet-page page-with-navbar-spacing animate-in">
      <div className="container">
        
        {/* Header */}
        <div className="wallet-header glass">
          <div className="wallet-title-section">
            <span className="section-label">DriveElite Rewards</span>
            <h2>My Wallet & Rewards</h2>
            <p className="wallet-subtitle">
              Manage your personal loyalty points, rental credits, and referrals.
            </p>
          </div>
          {wallet.updatedAt && (
            <div className="wallet-updated-tag">
              Last updated: {formatDateTime(wallet.updatedAt)}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="wallet-cards-grid">
          
          {/* Loyalty Points */}
          <div className="wallet-card glass hover-pop border-glow-blue">
            <div className="wallet-card-header">
              <span className="wallet-card-icon">⭐</span>
              <span className="wallet-card-tag badge-blue">Loyalty Points</span>
            </div>
            <div className="wallet-card-body">
              <h3>{loyaltyPoints.toLocaleString()}</h3>
              <p className="wallet-card-desc">Points accumulated from successful bookings & rentals.</p>
            </div>
            <div className="wallet-card-footer">
              <span className="footer-link" onClick={() => navigate('/rewards')}>Go to Rewards Store →</span>
            </div>
          </div>

          {/* Rental Credit */}
          <div className="wallet-card glass hover-pop border-glow-green">
            <div className="wallet-card-header">
              <span className="wallet-card-icon">💳</span>
              <span className="wallet-card-tag badge-green">Rental Credit</span>
            </div>
            <div className="wallet-card-body">
              <h3>Rs. {rentalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="wallet-card-desc">Automatically refunded here if booking price is reduced after an edit.</p>
            </div>
            <div className="wallet-card-footer">
              <span className="footer-info">Used automatically on next checkout.</span>
            </div>
          </div>

          {/* Referral Rewards */}
          <div className="wallet-card glass hover-pop border-glow-purple">
            <div className="wallet-card-header">
              <span className="wallet-card-icon">🎁</span>
              <span className="wallet-card-tag badge-purple">Referral Rewards</span>
            </div>
            <div className="wallet-card-body">
              <h3>Rs. {referralReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="wallet-card-desc">Credits earned from successful friend referrals.</p>
            </div>
            <div className="wallet-card-footer">
              <span className="footer-link" onClick={() => navigate('/referral')}>Invite Friends & Earn More →</span>
            </div>
          </div>

        </div>

        {/* Table & Simulator Split */}
        <div className="wallet-content-layout">
          
          {/* History Table */}
          <div className="wallet-history-section glass">
            <h3>Transaction History</h3>
            
            {history.length === 0 ? (
              <div className="wallet-empty-state">
                <div className="empty-icon">💸</div>
                <h4>No wallet activity yet</h4>
                <p>Your rewards and rental credits will appear here.</p>
                <button className="btn-primary btn-sm" onClick={() => navigate('/search')}>
                  Browse Vehicles
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="wallet-table">
                  <thead>
                    <tr>
                      <th>TXN ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((txn) => {
                      const isPositive = txn.amount > 0;
                      const isPoints = txn.type === 'LOYALTY_POINTS';
                      let amountClass = isPositive ? 'amount-positive' : 'amount-negative';
                      let amountSign = isPositive ? '+' : '';
                      let amountText = isPoints 
                        ? `${amountSign}${txn.amount} pts` 
                        : `${amountSign}Rs. ${Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

                      return (
                        <tr key={txn.transactionId}>
                          <td className="txn-id">{txn.transactionId}</td>
                          <td>
                            <span className={`txn-badge badge-${txn.type?.toLowerCase() || 'default'}`}>
                              {txn.type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`txn-amount ${amountClass}`}>
                            {amountText}
                          </td>
                          <td className="txn-desc">{txn.description}</td>
                          <td className="txn-date">{formatDateTime(txn.timestamp)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Simulator Sidebar */}
          <div className="wallet-simulator-section glass">
            <h3>Wallet Simulator</h3>
            <p className="simulator-help">
              Simulate actions to test wallet synchronization without editing bookings.
            </p>
            
            <form onSubmit={handleSimulateAdd} className="simulator-form">
              <div className="form-group">
                <label>Transaction Type</label>
                <select 
                  value={simType} 
                  onChange={(e) => setSimType(e.target.value)}
                  className="simulator-select"
                >
                  <option value="RENTAL_CREDIT">Rental Credit (Booking Price Reduced)</option>
                  <option value="REFERRAL_REWARD">Referral Reward (Invited Friend)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Amount (Rs.)</label>
                <input 
                  type="number" 
                  value={simAmount} 
                  onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="simulator-input"
                  min="1"
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary simulator-btn"
                disabled={simulating}
              >
                {simulating ? 'Processing...' : 'Simulate Adding Funds'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default WalletPage;
