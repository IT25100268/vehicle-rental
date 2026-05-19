import React from 'react';
import './ReviewsPage.css';

const ReviewsPage = () => {
  const reviews = [
    { id: 1, user: 'Amila S.', rating: 5, date: 'May 12, 2024', comment: 'Excellent service! The car was in perfect condition and the pickup process was seamless.', vehicle: 'Toyota Corolla' },
    { id: 2, user: 'Priya R.', rating: 4, date: 'May 08, 2024', comment: 'Very convenient. A bit of a wait at the counter, but the vehicle was great.', vehicle: 'Honda Vezel' },
    { id: 3, user: 'Kasun T.', rating: 5, date: 'May 01, 2024', comment: 'Best bike rental in Colombo. Highly recommended for travelers.', vehicle: 'Yamaha FZ' },
  ];

  return (
    <div className="reviews-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="reviews-header">
          <span className="section-label">User Feedback</span>
          <h1>What Our Community Says</h1>
          <div className="overall-rating glass">
            <div className="rating-score">
              <h2>4.8</h2>
              <span className="stars">★★★★★</span>
              <p>Based on 2,500+ reviews</p>
            </div>
            <div className="rating-bars">
              {[5,4,3,2,1].map(s => (
                <div key={s} className="bar-item">
                  <span>{s}★</span>
                  <div className="bar"><div className="fill" style={{ width: `${s*15+20}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="reviews-grid">
          {reviews.map(rev => (
            <div key={rev.id} className="review-card glass">
              <div className="review-user">
                <div className="user-avatar">{rev.user[0]}</div>
                <div className="user-meta">
                  <h4>{rev.user}</h4>
                  <span>{rev.date}</span>
                </div>
                <div className="rev-stars">{'★'.repeat(rev.rating)}</div>
              </div>
              <p className="review-comment">"{rev.comment}"</p>
              <div className="review-footer">
                <span className="rented-label">Rented:</span>
                <span className="rented-vehicle">{rev.vehicle}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="write-review glass">
          <h3>Share Your Experience</h3>
          <p>Had a recent trip with us? We'd love to hear your feedback!</p>
          <button className="btn-primary">Write a Review</button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
