import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { bookingApi } from '../api/index.jsx';
import './EditBookingModal.css';

const EditBookingModal = ({ isOpen, onClose, onSubmit, booking, notify }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalMode, setRentalMode] = useState('DAILY');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (booking) {
      setStartDate(booking.startDate || '');
      setEndDate(booking.endDate || '');
      setRentalMode(booking.rentalMode || 'DAILY');
      setPreview({
        oldPrice: booking.totalPrice,
        newPrice: booking.totalPrice,
        difference: 0
      });
    }
  }, [booking, isOpen]);

  // Recalculate price when dates or mode change
  useEffect(() => {
    if (isOpen && booking && startDate && endDate) {
      const calculate = async () => {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          if (end <= start) return;

          const diffMs = end - start;
          const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          const mockBooking = {
            ...booking,
            startDate,
            endDate,
            rentalMode,
            bookingDays: diffDays,
            bookingHours: diffHrs
          };

          const result = await bookingApi.calculatePrice(mockBooking);
          const diff = result.totalPrice - booking.totalPrice;
          setPreview({
            oldPrice: booking.totalPrice,
            newPrice: result.totalPrice,
            difference: diff,
            bookingDays: diffDays,
            bookingHours: diffHrs
          });
        } catch (err) {
          console.error('Price calculation failed', err);
        }
      };
      calculate();
    }
  }, [startDate, endDate, rentalMode, isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(endDate) <= new Date(startDate)) {
      notify('End date must be after start date.', 'error');
      return;
    }

    setLoading(true);
    try {
      const editData = {
        startDate,
        endDate,
        rentalMode,
        bookingDays: preview.bookingDays,
        bookingHours: preview.bookingHours
      };
      await onSubmit(editData);
      onClose();
    } catch (error) {
      console.error('Failed to update booking:', error);
      notify(error.response?.data || 'Failed to update booking.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="edit-booking-modal-overlay" onClick={onClose}>
      <div 
        className="edit-booking-modal-content glass animate-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="edit-booking-modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        
        <h2 className="edit-booking-modal-title">Edit Booking</h2>
        <p className="edit-booking-modal-subtitle">
          Update your rental dates for <strong>{booking.vehicleName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="edit-booking-form">
          <div className="form-row">
            <div className="form-group">
              <label>Rental Mode</label>
              <select 
                value={rentalMode} 
                onChange={(e) => setRentalMode(e.target.value)}
                className="edit-input"
              >
                <option value="DAILY">Daily Rental</option>
                <option value="HOURLY">Hourly Rental</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="edit-input"
              />
            </div>
            <div className="form-group">
              <label>End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="edit-input"
              />
            </div>
          </div>

          {preview && (
            <div className="price-preview-card glass">
              <div className="preview-row">
                <span>Original Price:</span>
                <span>LKR {preview.oldPrice.toLocaleString()}</span>
              </div>
              <div className="preview-row">
                <span>New Price:</span>
                <span className="text-accent">LKR {preview.newPrice.toLocaleString()}</span>
              </div>
              <div className="preview-divider"></div>
              <div className="preview-row total">
                <span>Difference:</span>
                <span className={preview.difference >= 0 ? 'text-warning' : 'text-success'}>
                  {preview.difference >= 0 ? '+' : ''}LKR {preview.difference.toLocaleString()}
                </span>
              </div>
              
              <div className="price-message">
                {preview.difference > 0 && (
                  <p className="msg-warning">
                    ⚠️ Additional payment of <strong>LKR {preview.difference.toLocaleString()}</strong> will be required.
                  </p>
                )}
                {preview.difference < 0 && (
                  <p className="msg-success">
                    ✨ Rental credit of <strong>LKR {Math.abs(preview.difference).toLocaleString()}</strong> will be added to your account.
                  </p>
                )}
                {preview.difference === 0 && (
                  <p className="msg-info">Price remains the same.</p>
                )}
              </div>
            </div>
          )}

          <div className="edit-booking-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || (preview?.difference === 0 && startDate === booking.startDate && endDate === booking.endDate)}>
              {loading ? 'Updating...' : 'Confirm Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditBookingModal;
