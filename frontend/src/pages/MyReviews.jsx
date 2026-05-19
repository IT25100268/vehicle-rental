import React, { useState, useEffect, useCallback } from 'react';
import { reviewApi, vehicleApi } from '../api/index.jsx';
import ReviewModal from '../components/ReviewModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './MyReviews.css';

const MyReviews = ({ user, notify }) => {
  const [reviews, setReviews] = useState([]);
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, review: null, vehicleName: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reviewId: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsData, vehiclesData] = await Promise.all([
        reviewApi.getByUser(user.id),
        vehicleApi.getAll()
      ]);

      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
      const vehicleMap = {};
      if (Array.isArray(vehiclesData)) {
        vehiclesData.forEach(v => {
          vehicleMap[v.id] = v;
        });
      }
      setVehicles(vehicleMap);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      notify('Failed to load your reviews.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (review) => {
    const vehicle = vehicles[review.vehicleId];
    setReviewModal({
      isOpen: true,
      review: review,
      vehicleName: vehicle ? vehicle.name : 'Unknown Vehicle'
    });
  };

  const handleDeleteClick = (reviewId) => {
    setDeleteModal({ isOpen: true, reviewId });
  };

  const handleConfirmDelete = async () => {
    try {
      await reviewApi.delete(deleteModal.reviewId);
      notify('Review deleted successfully! ✅', 'success');
      setReviews(prev => prev.filter(r => r.id !== deleteModal.reviewId));
      setDeleteModal({ isOpen: false, reviewId: null });
    } catch (err) {
      console.error('Error deleting review:', err);
      notify('Failed to delete review. Please try again.', 'error');
    }
  };

  const handleSubmitReview = async (updatedData) => {
    try {
      await reviewApi.update(reviewModal.review.id, {
        ...reviewModal.review,
        ...updatedData
      });
      notify('Review updated successfully! ✅', 'success');
      fetchData(); // Refresh to get updated stats and list
    } catch (err) {
      console.error('Error updating review:', err);
      notify('Failed to update review.', 'error');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="my-reviews-page page-with-navbar-spacing">
        <div className="container loading-container">
          <div className="spinner"></div>
          <p>Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reviews-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="my-reviews-header">
          <div className="header-content">
            <span className="section-label">My Contributions</span>
            <h1>My Vehicle Reviews</h1>
            <p>You have shared {reviews.length} review{reviews.length !== 1 ? 's' : ''} with the community.</p>
          </div>
        </header>

        {reviews.length > 0 ? (
          <div className="my-reviews-grid">
            {reviews.map(review => {
              const vehicle = vehicles[review.vehicleId];
              return (
                <div key={review.id} className="my-review-card glass">
                  <div className="my-review-vehicle-info">
                    <div className="vehicle-img-wrapper">
                      <img 
                        src={vehicle?.photo || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'} 
                        alt={vehicle?.name || 'Vehicle'} 
                        className="vehicle-mini-img"
                      />
                    </div>
                    <div className="vehicle-text">
                      <h3>{vehicle?.name || 'Unknown Vehicle'}</h3>
                      <span className="review-date">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="my-review-content">
                    <div className="my-review-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                    <p className="my-review-comment">"{review.comment}"</p>
                    {review.photo && (
                      <div className="my-review-photo">
                        <img src={review.photo} alt="Review" />
                      </div>
                    )}
                  </div>

                  <div className="my-review-actions">
                    <button 
                      className="btn-edit" 
                      onClick={() => handleEdit(review)}
                    >
                      <span className="icon">✏️</span> Edit
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(review.id)}
                    >
                      <span className="icon">🗑️</span> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-reviews glass">
            <div className="empty-icon">⭐</div>
            <h3>You have not submitted any vehicle reviews yet.</h3>
            <p>Your reviews help others choose the right vehicle for their journey!</p>
            <button 
              className="btn-primary" 
              onClick={() => window.location.href = '/bookings'}
            >
              Go to My Bookings
            </button>
          </div>
        )}
      </div>

      <ReviewModal 
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        onSubmit={handleSubmitReview}
        reviewData={reviewModal.review}
        vehicleName={reviewModal.vehicleName}
      />

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, reviewId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Review?"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default MyReviews;
