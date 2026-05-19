import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, onSubmit, reviewData, vehicleName }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reviewData) {
      setRating(reviewData.rating || 0);
      setComment(reviewData.comment || '');
      setPhoto(reviewData.photo || '');
    } else {
      setRating(0);
      setComment('');
      setPhoto('');
    }
  }, [reviewData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ rating, comment, photo });
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="review-modal-overlay" onClick={onClose}>
      <div 
        className="review-modal-content glass animate-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="review-modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        
        <h2 className="review-modal-title">
          {reviewData ? 'Edit Your Review' : `Review ${vehicleName || 'Vehicle'}`}
        </h2>
        <p className="review-modal-subtitle">Share your experience with other renters!</p>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="rating-stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hover || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                ★
              </button>
            ))}
            <span className="rating-text">
              {rating > 0 ? `${rating} / 5 Stars` : 'Select Rating'}
            </span>
          </div>

          <div className="form-group">
            <label>Your Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this vehicle?"
              required
              rows="4"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Photo URL (Optional)</label>
            <input
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="review-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : reviewData ? 'Update Review' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReviewModal;
