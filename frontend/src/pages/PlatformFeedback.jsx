import React, { useState, useEffect } from 'react';
import feedbackApi from '../api/feedbackApi';
import './PlatformFeedback.css';

const CATEGORIES = [
  'Software Experience',
  'Booking Process',
  'Payment Process',
  'Customer Support',
  'Vehicle Service',
  'Other'
];

const PlatformFeedback = ({ user, notify }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    category: 'Software Experience',
    comment: ''
  });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await feedbackApi.getAll();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      notify('Please login to submit feedback', 'error');
      return;
    }

    if (!formData.comment.trim()) {
      notify('Please provide a comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        category: formData.category,
        rating: formData.rating,
        comment: formData.comment
      };
      await feedbackApi.create(payload);
      notify('Thank you for your feedback!', 'success');
      setFormData({ rating: 5, category: 'Software Experience', comment: '' });
      fetchFeedbacks();
    } catch (error) {
      notify(error.response?.data || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, setRating, interactive = true }) => {
    return (
      <div className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`feedback-star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="container animate-in feedback-page-container page-with-navbar-spacing">
      <div className="feedback-layout">
        {/* Left: Feedback Form */}
        <div className="glass feedback-form-panel">
          <div className="feedback-header">
            <h1 className="feedback-title">Share Your Feedback</h1>
            <p className="feedback-subtitle">
              Help us improve your DriveElite experience. Tell us what you think about our platform and services.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-form-group">
              <label className="feedback-label">Overall Rating</label>
              <StarRating 
                rating={formData.rating} 
                setRating={(r) => setFormData({ ...formData, rating: r })} 
              />
            </div>

            <div className="feedback-form-group">
              <label className="feedback-label">Category</label>
              <select
                className="feedback-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="feedback-form-group">
              <label className="feedback-label">Your Experience</label>
              <textarea
                className="feedback-textarea"
                placeholder="Tell us more about your experience..."
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                required
                rows="5"
              />
            </div>

            {user && (
              <div className="feedback-user-info">
                <div className="feedback-info-item">
                  <span className="feedback-info-label">Posting as:</span>
                  <span className="feedback-info-value">{user.name}</span>
                </div>
                <div className="feedback-info-item">
                  <span className="feedback-info-label">Email:</span>
                  <span className="feedback-info-value">{user.email}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary feedback-submit-btn"
              disabled={submitting || !user}
            >
              {submitting ? 'Submitting...' : (user ? 'Submit Feedback' : 'Login to Provide Feedback')}
            </button>
          </form>
        </div>

        {/* Right: Feedback List */}
        <div className="feedback-list-panel">
          <div className="feedback-list-header">
            <h2 className="feedback-list-title">Community Feedback</h2>
            <span className="feedback-count-badge">{feedbacks.length} Reviews</span>
          </div>

          <div className="feedback-scroll-area">
            {loading ? (
              <div className="feedback-loading">Loading feedback...</div>
            ) : feedbacks.length > 0 ? (
              feedbacks.map((f) => (
                <div key={f.id} className="glass feedback-card">
                  <div className="feedback-card-header">
                    <div>
                      <div className="feedback-card-name">{f.userName}</div>
                      <div className="feedback-card-category">{f.category}</div>
                    </div>
                    <StarRating rating={f.rating} interactive={false} />
                  </div>
                  <p className="feedback-card-comment">"{f.comment}"</p>
                  <div className="feedback-card-date">
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="feedback-empty">No feedback yet. Be the first to share!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformFeedback;
