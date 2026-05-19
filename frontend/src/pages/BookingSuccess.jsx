import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';
import { reviewApi } from '../api/index.jsx';
import './BookingSuccess.css';

const BookingSuccess = ({ user, notify }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Determine if the rental end date has already passed
  const isRentalCompleted = booking?.endDate
    ? new Date(booking.endDate) < new Date()
    : false;

  useEffect(() => {
    if (user && booking?.vehicleId) {
      setLoadingReview(true);
      reviewApi.getByUser(user.id)
        .then(reviews => {
          const found = reviews.find(r => r.vehicleId === booking.vehicleId);
          setExistingReview(found || null);
        })
        .catch(err => console.error('Error checking existing review:', err))
        .finally(() => setLoadingReview(false));
    }
  }, [user, booking?.vehicleId]);

  const handleSubmitReview = async (reviewData) => {
    if (!user) {
      notify('You must be logged in to leave a review.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (existingReview) {
        await reviewApi.update(existingReview.id, {
          ...existingReview,
          ...reviewData
        });
        notify('Review updated successfully! ✅', 'success');
      } else {
        await reviewApi.create({
          userId: user.id,
          userName: user.name,
          vehicleId: booking.vehicleId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          photo: reviewData.photo || '',
        });
        notify('Thank you for your review! 🌟', 'success');
      }
      setReviewModalOpen(false);
      // Refresh existing review state
      const updatedReviews = await reviewApi.getByUser(user.id);
      const found = updatedReviews.find(r => r.vehicleId === booking.vehicleId);
      setExistingReview(found || null);
    } catch (err) {
      console.error('Review submit error:', err);
      notify('Failed to submit review. Please try again.', 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Fallback – someone navigated here directly without a booking in state
  if (!booking) {
    return (
      <div className="success-page page-with-navbar-spacing">
        <div className="container">
          <div className="success-card glass">
            <h2>No Booking Found</h2>
            <p>It seems you've reached this page without an active booking session.</p>
            <button className="btn-primary" onClick={() => navigate('/bookings')}>
              Go to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page page-with-navbar-spacing animate-in">
      <div className="container">
        <div className="success-card glass">
          <div className="success-icon">✨</div>
          <h1>Booking Confirmed!</h1>
          <p className="success-subtitle">
            Your adventure starts here. We've sent the details to your email.
          </p>

          <div className="booking-summary glass">
            <div className="summary-item">
              <span className="label">Booking ID</span>
              <span className="value">#{booking?.id?.substring(0, 8) || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Vehicle</span>
              <span className="value">{booking?.vehicleName || 'Vehicle'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Rental Period</span>
              <span className="value">
                {booking?.startDate} to {booking?.endDate}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Total Paid</span>
              <span className="value">
                LKR {(booking?.totalPrice ?? 0).toLocaleString()}
              </span>
            </div>
            {booking?.payment?.method && (
              <div className="summary-item">
                <span className="label">Payment Method</span>
                <span className="value">{booking.payment.method}</span>
              </div>
            )}
          </div>

          <div className="next-steps">
            <h3>Next Steps</h3>
            <ul className="steps-list">
              <li>Arrive at the pickup point 15 mins early.</li>
              <li>Have your valid driving license ready.</li>
              <li>Complete the digital inspection in our app.</li>
            </ul>
          </div>

          {/* ── Review Notice / CTA ── */}
          <div className={`review-notice glass ${isRentalCompleted ? 'review-notice--ready' : ''}`}>
            <span className="review-notice-icon">⭐</span>
            <div className="review-notice-body">
              {existingReview ? (
                <>
                  <strong>Review Submitted</strong>
                  <p>You have already reviewed <em>{booking?.vehicleName || 'this vehicle'}</em>. You can edit your review below.</p>
                </>
              ) : isRentalCompleted ? (
                <>
                  <strong>How was your experience?</strong>
                  <p>Your rental has ended – share your feedback for{' '}
                    <em>{booking?.vehicleName || 'this vehicle'}</em>!</p>
                </>
              ) : (
                <>
                  <strong>Review available after rental completion</strong>
                  <p>After your trip ends, you can rate <em>{booking?.vehicleName || 'this vehicle'}</em>{' '}
                    from <strong>My Bookings</strong>.</p>
                </>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={() => navigate('/bookings')}>
              Manage Bookings
            </button>
            <button className="btn-ghost" onClick={() => navigate('/invoices')}>
              View Invoice History
            </button>
            {existingReview ? (
              <button
                className="btn-review-cta"
                onClick={() => setReviewModalOpen(true)}
                disabled={submitting || loadingReview}
              >
                ✏️ Edit Review
              </button>
            ) : isRentalCompleted ? (
              <button
                className="btn-review-cta"
                onClick={() => setReviewModalOpen(true)}
                disabled={submitting || loadingReview}
              >
                ⭐ Leave Review
              </button>
            ) : (
              <button
                className="btn-review-cta btn-review-cta--pending"
                onClick={() => navigate('/bookings')}
                title="You can leave a review after the rental period ends"
              >
                ⭐ Leave Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Review Modal ── */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        reviewData={existingReview}
        vehicleName={booking?.vehicleName}
      />
    </div>
  );
};

export default BookingSuccess;
