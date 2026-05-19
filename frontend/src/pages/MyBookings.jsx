import React, { useState, useEffect, useCallback } from 'react';
import { bookingApi, reviewApi } from '../api/index.jsx';
import CancellationModal from '../components/CancellationModal';
import ReviewModal from '../components/ReviewModal';
import EditBookingModal from '../components/EditBookingModal';
import './MyBookings.css'; // Ensure CSS is imported

const MyBookings = ({ user, notify }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, booking: null });

  // ── Review Modal State ──
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    booking: null,
    review: null
  });
  const [editModal, setEditModal] = useState({ isOpen: false, booking: null });

  const fetchBookings = useCallback(() => {
    setLoading(true);
    bookingApi.getByUser(user.id)
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); setBookings([]); })
      .finally(() => setLoading(false));

    reviewApi.getByUser(user.id)
      .then(data => setUserReviews(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching user reviews:', err));
  }, [user.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirmCancel = async (bookingId, reason) => {
    setLoading(true);
    try {
      await bookingApi.cancel(bookingId, reason);
      notify('Booking cancelled! Your refund has been initiated. ✅', 'success');
      fetchBookings();
    } catch (err) {
      console.error(err);
      notify('Error cancelling booking. Please try again.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isEligibleForReview = (booking) => {
    if (booking.status === 'CANCELLED') return false;
    const isCompleted = booking.status === 'COMPLETED';
    const isPastEnd = booking.endDate && new Date(booking.endDate) < new Date();
    return isCompleted || isPastEnd;
  };

  const reviewNoticeText = (booking) => {
    if (booking.status === 'CONFIRMED' || booking.status === 'ACTIVE') {
      return 'Review available after rental completion';
    }
    return null;
  };

  const getExistingReview = (vehicleId) =>
    userReviews.find(r => r.vehicleId === vehicleId);

  const handleOpenReview = (booking) => {
    const existing = getExistingReview(booking.vehicleId);
    setReviewModal({ isOpen: true, booking, review: existing || null });
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      if (reviewModal.review) {
        await reviewApi.update(reviewModal.review.id, {
          ...reviewModal.review,
          ...reviewData,
        });
        notify('Review updated successfully! ✅', 'success');
      } else {
        await reviewApi.create({
          userId: user.id,
          userName: user.name,
          vehicleId: reviewModal.booking.vehicleId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          photo: reviewData.photo || '',
        });
        notify('Thank you for your review! 🌟', 'success');
      }
      fetchBookings();
    } catch (err) {
      console.error(err);
      notify('Failed to submit review. Please try again.', 'error');
      throw err;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'status-confirmed';
      case 'CANCELLED': return 'status-cancelled';
      case 'COMPLETED': return 'status-completed';
      case 'ACTIVE': return 'status-active';
      case 'PENDING': return 'status-pending';
      default: return '';
    }
  };

  const isEligibleForEdit = (booking) => {
    if (booking.status !== 'CONFIRMED') return false;
    const now = new Date();
    const start = new Date(booking.startDate);
    return start > now;
  };

  const handleEditSubmit = async (editData) => {
    try {
      await bookingApi.edit(editModal.booking.id, editData);
      notify('Booking updated successfully! 📝', 'success');
      fetchBookings();
    } catch (err) {
      console.error(err);
      notify(err.response?.data || 'Failed to update booking.', 'error');
      throw err;
    }
  };

  const handlePayDifference = async (bookingId) => {
    setLoading(true);
    try {
      await bookingApi.payEdit(bookingId);
      notify('Additional payment successful! ✅', 'success');
      fetchBookings();
    } catch (err) {
      console.error(err);
      notify('Payment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mybookings-page-container animate-in">
      <div className="mybookings-header">
        <div className="header-top-row">
          <div>
            <h1 className="mybookings-title">My Bookings</h1>
            <p className="mybookings-subtitle">Manage your rentals and view booking history</p>
          </div>
          <button 
            className="btn-manage-reviews"
            onClick={() => window.location.href = '/my-reviews'}
          >
            ⭐ Manage My Reviews
          </button>
        </div>
      </div>

      <div className="mybookings-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching your bookings...</p>
          </div>
        ) : bookings?.length > 0 ? (
          <div className="bookings-grid">
            {bookings.map(b => {
              const existingReview = getExistingReview(b.vehicleId);
              const eligible = isEligibleForReview(b);
              const notice = reviewNoticeText(b);

              return (
                <div key={b.id} className="booking-card-premium">
                  {/* Left: Image */}
                  <div className="booking-image-section">
                    <img
                      src={b.vehiclePhoto || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'}
                      alt={b.vehicleName}
                      className="booking-img"
                    />
                    <div className={`status-badge-overlay ${getStatusClass(b.status)}`}>
                      {b.status}
                    </div>
                  </div>

                  {/* Middle: Details */}
                  <div className="booking-details-section">
                    <div className="booking-id-row">
                      <span className="booking-id-tag">ID: {b.id || 'N/A'}</span>
                    </div>
                    <h3 className="booking-vehicle-name">{b.vehicleName}</h3>
                    
                    <div className="booking-info-grid">
                      <div className="info-item">
                        <span className="info-label">Rental Period</span>
                        <span className="info-value">{b.startDate} to {b.endDate}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Total Amount</span>
                        <span className="info-value price-highlight">LKR {(b?.totalPrice ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Payment Method</span>
                        <span className="info-value">{b.paymentMethod || 'Card Payment'}</span>
                      </div>
                      {b.status === 'CANCELLED' && (
                        <>
                          <div className="info-item">
                            <span className="info-label">Cancelled Date</span>
                            <span className="info-value">{b.cancelledDate || 'N/A'}</span>
                          </div>
                          <div className="info-item full-width">
                            <span className="info-label">Cancellation Reason</span>
                            <p className="cancellation-reason-text">{b.cancellationReason || 'No reason provided'}</p>
                          </div>
                        </>
                      )}
                      {b.editStatus === 'PENDING_PAYMENT' && (
                        <div className="info-item full-width">
                          <div className="payment-warning-box">
                            <span className="info-label">⚠️ Action Required</span>
                            <p>Additional payment of <strong>LKR {b.additionalAmountDue?.toLocaleString()}</strong> is pending.</p>
                          </div>
                        </div>
                      )}
                      {b.rentalCreditAmount > 0 && (
                        <div className="info-item full-width">
                          <div className="credit-success-box">
                            <span className="info-label">✨ Rental Credit</span>
                            <p><strong>LKR {b.rentalCreditAmount?.toLocaleString()}</strong> added to your account from recent update.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="booking-actions-section">
                    <div className="action-buttons-group">
                      {(b.status === 'CONFIRMED' || b.status === 'ACTIVE') && (
                        <button
                          onClick={() => setCancelModal({ isOpen: true, booking: b })}
                          disabled={loading}
                          className="btn-cancel-primary"
                        >
                          Cancel Booking
                        </button>
                      )}

                      {b.status !== 'CANCELLED' && (
                        eligible ? (
                          <button
                            onClick={() => handleOpenReview(b)}
                            className="btn-review-primary"
                          >
                            {existingReview ? 'Edit Review' : 'Leave Review'}
                          </button>
                        ) : notice ? (
                          <div className="review-notice-box">
                            <i className="fas fa-info-circle"></i>
                              <span>{notice}</span>
                          </div>
                        ) : null
                      )}

                      {isEligibleForEdit(b) && b.editStatus !== 'PENDING_PAYMENT' && (
                        <button
                          onClick={() => setEditModal({ isOpen: true, booking: b })}
                          className="btn-edit-secondary"
                        >
                          Edit Dates
                        </button>
                      )}

                      {b.editStatus === 'PENDING_PAYMENT' && (
                        <button
                          onClick={() => handlePayDifference(b.id)}
                          className="btn-pay-difference"
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : `Pay LKR ${b.additionalAmountDue?.toLocaleString()}`}
                        </button>
                      )}

                      {b.status === 'CANCELLED' && (
                        <button className="btn-details-outline" onClick={() => notify('Cancellation processed successfully.', 'info')}>
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-bookings-state">
            <div className="empty-icon">📂</div>
            <h3>No Bookings Found</h3>
            <p>You haven't made any bookings yet. Start your journey with DriveElite!</p>
            <button
              onClick={() => (window.location.href = '/#fleet')}
              className="explore-btn"
            >
              Explore Vehicles
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        onSubmit={handleSubmitReview}
        reviewData={reviewModal.review}
        vehicleName={reviewModal.booking?.vehicleName}
      />

      <CancellationModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ ...cancelModal, isOpen: false })}
        onConfirm={handleConfirmCancel}
        booking={cancelModal.booking}
      />

      <EditBookingModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, booking: null })}
        onSubmit={handleEditSubmit}
        booking={editModal.booking}
        notify={notify}
      />
    </div>
  );
};

export default MyBookings;

