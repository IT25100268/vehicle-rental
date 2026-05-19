import React, { useState } from 'react';
import Modal from './Modal';
import './CancellationModal.css';

const CANCELLATION_REASONS = [
  'Changed plans',
  'Found another vehicle',
  'Price issue',
  'Booking mistake',
  'Vehicle issue',
  'Other'
];

const CancellationModal = ({ isOpen, onClose, onConfirm, booking }) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? otherReason : reason;
    setLoading(true);
    try {
      await onConfirm(booking.id, finalReason);
      onClose();
    } catch (error) {
      console.error('Cancellation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancellationFee = (booking.totalPrice || 0) * 0.1;
  const refundAmount = Math.max(0, (booking.totalPrice || 0) - cancellationFee);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking">
      <div className="cancellation-modal-body animate-in">
        <div className="cancellation-summary glass">
          <div className="summary-row">
            <span className="label">Vehicle:</span>
            <span className="value">{booking.vehicleName}</span>
          </div>
          <div className="summary-row">
            <span className="label">Dates:</span>
            <span className="value">{booking.startDate} – {booking.endDate}</span>
          </div>
          <div className="summary-row highlight-row">
            <span className="label">Total Paid:</span>
            <span className="value">LKR {(booking.totalPrice || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="cancellation-fee-box">
          <div className="fee-item warning">
            <span>Cancellation Fee (10%):</span>
            <span>- LKR {cancellationFee.toLocaleString()}</span>
          </div>
          <div className="fee-item success">
            <span>Estimated Refund:</span>
            <span>LKR {refundAmount.toLocaleString()}</span>
          </div>
          <p className="fee-disclaimer">
            * Refunds are processed within 3-5 business days to your original payment method.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cancellation-form">
          <div className="form-group">
            <label>Reason for Cancellation (Optional)</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="cancellation-select"
            >
              <option value="">Select a reason</option>
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div className="form-group animate-in">
              <label>Please specify</label>
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Tell us more about why you are cancelling..."
                className="cancellation-textarea"
                rows="3"
              ></textarea>
            </div>
          )}

          <div className="cancellation-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Keep Booking
            </button>
            <button 
              type="submit" 
              className="btn-danger"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CancellationModal;
