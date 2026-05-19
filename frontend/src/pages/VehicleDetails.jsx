import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { vehicleApi, reviewApi } from '../api/index.jsx';
import './VehicleDetails.css';

const VehicleDetails = ({ user, notify, wishlistIds = [], onToggleWishlist }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(location.state?.vehicle || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!vehicle);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Fetch vehicle if not passed via state
  useEffect(() => {
    if (!vehicle) {
      const queryParams = new URLSearchParams(location.search);
      const id = queryParams.get('id');
      if (id) {
        setLoading(true);
        vehicleApi.getById(id)
          .then(data => setVehicle(data))
          .catch(err => {
            console.error(err);
            notify?.('Vehicle not found', 'error');
            navigate('/search');
          })
          .finally(() => setLoading(false));
      } else {
        notify?.('Please select a vehicle from the fleet', 'info');
        navigate('/search');
      }
    }
  }, [vehicle, location.search, navigate, notify]);

  // Fetch reviews and keep local vehicle stats in sync
  const fetchReviews = useCallback(() => {
    if (!vehicle?.id) return;
    setReviewsLoading(true);
    reviewApi.getByVehicle(vehicle.id)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setReviews(list);

        // Recalculate average rating & count locally so UI updates immediately
        if (list.length > 0) {
          const avg = list.reduce((sum, r) => sum + (r.rating || 0), 0) / list.length;
          setVehicle(prev => prev
            ? { ...prev, reviewCount: list.length, averageRating: Math.round(avg * 10) / 10 }
            : prev
          );
        } else {
          setVehicle(prev => prev
            ? { ...prev, reviewCount: 0, averageRating: 0 }
            : prev
          );
        }
      })
      .catch(err => console.error('Error fetching reviews:', err))
      .finally(() => setReviewsLoading(false));
  }, [vehicle?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading || !vehicle) {
    return (
      <div className="vehicle-details-page page-with-navbar-spacing">
        <div className="container">⏳ Loading vehicle details...</div>
      </div>
    );
  }

  const handleBookNow = () => navigate('/checkout', { state: { vehicle } });

  const renderStars = (rating) =>
    '★'.repeat(Math.floor(rating || 0)) + '☆'.repeat(5 - Math.floor(rating || 0));

  return (
    <div className="vehicle-details-page page-with-navbar-spacing animate-in">
      <div className="container">
        <div className="details-grid">
          {/* ── Gallery ── */}
          <div className="gallery-section">
            <div className="main-image glass">
              <img
                src={
                  vehicle.photos?.[0] ||
                  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'
                }
                alt={`${vehicle.make} ${vehicle.model}`}
              />
            </div>
            <div className="thumbnail-grid">
              {(vehicle.photos || []).map((img, i) => (
                <div key={i} className="thumb glass">
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Info ── */}
          <div className="info-section">
            <div className="info-header">
              <span className="badge badge-blue">{vehicle.type}</span>
              <span className={`badge ${vehicle.available ? 'badge-green' : 'badge-red'}`}>
                {vehicle.available ? 'Available' : 'Currently Rented'}
              </span>
            </div>

            <h1 className="vehicle-title">{vehicle.make} {vehicle.model}</h1>

            <div className="rating-info">
              <span className="stars">{renderStars(vehicle.averageRating)}</span>
              <span className="avg-val">{(vehicle.averageRating || 0).toFixed(1)}</span>
              <span className="review-count">({vehicle.reviewCount || 0} reviews)</span>
            </div>

            <p className="description">
              {vehicle.description || 'No description available for this vehicle.'}
            </p>

            <div className="specs-grid">
              <div className="spec-card glass">
                <span className="spec-label">Year</span>
                <span className="spec-value">{vehicle.year}</span>
              </div>
              <div className="spec-card glass">
                <span className="spec-label">Fuel</span>
                <span className="spec-value">{vehicle.fuelType || 'N/A'}</span>
              </div>
              <div className="spec-card glass">
                <span className="spec-label">Capacity</span>
                <span className="spec-value">{vehicle.seatingCapacity || 'N/A'} Persons</span>
              </div>
              <div className="spec-card glass">
                <span className="spec-label">Location</span>
                <span className="spec-value">{vehicle.location || 'Colombo'}</span>
              </div>
            </div>

            <div className="features-list">
              <h3>Vehicle Specifications</h3>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="check">✓</span> {vehicle.color || 'Standard'} Color
                </div>
                <div className="feature-item">
                  <span className="check">✓</span> Premium Condition
                </div>
                {vehicle.vin && (
                  <div className="feature-item">
                    <span className="check">✓</span> Verified VIN: {vehicle.vin}
                  </div>
                )}
              </div>
            </div>

             <div className="booking-sticky glass">
              <div className="price-tag">
                <div className="price-item">
                  <span className="amount">LKR {(vehicle.pricePerDay ?? 0).toLocaleString()}</span>
                  <span className="per">/day</span>
                </div>
                <div className="price-divider"></div>
                <div className="price-item">
                  <span className="amount">LKR {(vehicle.pricePerHour ?? 0).toLocaleString()}</span>
                  <span className="per">/hour</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '280px' }}>
                <button
                  className="btn-primary"
                  onClick={handleBookNow}
                  disabled={!vehicle.available}
                  style={{ width: '100%' }}
                >
                  {vehicle.available ? 'Book Now' : 'Not Available'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleWishlist?.(vehicle.id)}
                  className={`btn-ghost ${wishlistIds.includes(vehicle.id) ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderColor: wishlistIds.includes(vehicle.id) ? '#ef4444' : '',
                    color: wishlistIds.includes(vehicle.id) ? '#ef4444' : '',
                    background: wishlistIds.includes(vehicle.id) ? 'rgba(239, 68, 68, 0.08)' : ''
                  }}
                >
                  {wishlistIds.includes(vehicle.id) ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews Section ── */}
        <section className="reviews-section glass">
          <div className="reviews-header">
            <h2>Customer Reviews</h2>
            <div className="reviews-stats">
              <div className="big-rating">
                {(vehicle.averageRating || 0).toFixed(1)}
              </div>
              <div className="stats-right">
                <div className="stars">{renderStars(vehicle.averageRating)}</div>
                <div>Based on {vehicle.reviewCount || 0} reviews</div>
              </div>
            </div>
          </div>

          <div className="reviews-list-container">
            {reviewsLoading ? (
              <div className="loading-reviews">⏳ Loading reviews...</div>
            ) : reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map(r => (
                  <div key={r.id} className="review-item glass">
                    <div className="review-user-info">
                      <div className="user-avatar">
                        {r.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="user-name">{r.userName || 'Anonymous'}</div>
                        <div className="review-date">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="review-rating">{renderStars(r.rating)}</div>
                    </div>
                    <p className="review-comment">{r.comment}</p>
                    {r.photo && (
                      <div className="review-photo">
                        <img src={r.photo} alt="Review" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reviews">
                <p>
                  No reviews yet for this vehicle. Be the first to review it after your rental!
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default VehicleDetails;
