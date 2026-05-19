import React from 'react';
import './VehicleCard.css';

const TYPE_ICON = {
  Car: '🚗',
  Bike: '🏍️',
  Van: '🚐',
  ThreeWheeler: '🛺',
};



const VehicleCard = ({ vehicle, isBooked, onBook, onDetails, isWishlisted, onToggleWishlist }) => {
  const avgRating = vehicle?.averageRating || 0;
  const count = vehicle?.reviewCount || 0;

  const typeIcon  = TYPE_ICON[vehicle.type]  || '🚗';
  
  const isMaintenance = vehicle.vehicleStatus === 'UNDER_MAINTENANCE';
  const isUnavailable = vehicle.vehicleStatus === 'UNAVAILABLE';
  const isAvailable = vehicle.vehicleStatus === 'AVAILABLE';
  const displayStatus = isBooked ? 'RENTED' : vehicle.vehicleStatus;

  const getStatusClass = () => {
    if (isBooked) return 'booked';
    if (isMaintenance) return 'maintenance';
    if (isUnavailable) return 'unavailable';
    return 'available';
  };

  const getStatusLabel = () => {
    if (isBooked) return '● Rented';
    if (isMaintenance) return '● Maintenance';
    if (isUnavailable) return '● Unavailable';
    return '● Available';
  };

  return (
    <div
      className={`hover-pop animate-in vehicle-card ${getStatusClass()} ${!isAvailable && !isBooked ? 'dimmed' : ''}`}
      onClick={onDetails}
    >
      {/* Image section */}
      <div className="vehicle-image-container">
        <img
          src={vehicle.photos?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="vehicle-image"
        />

        {/* Dark bottom gradient on image */}
        <div className="vehicle-image-gradient" />

        {/* Wishlist Button */}
        <button
          type="button"
          className={`wishlist-heart-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(vehicle.id);
          }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>

        {/* Status badge */}
        <div className={`vehicle-status-badge status-${getStatusClass()}`}>
          {getStatusLabel()}
        </div>

        {/* Type badge */}
        <div className={`vehicle-type-badge vehicle-type-badge-${vehicle.type}`}>
          {typeIcon} {vehicle.type}
        </div>

        {/* Maintenance Date Overlay */}
        {isMaintenance && vehicle.maintenanceEndDate && (
          <div className="maintenance-date-badge">
            Back on: {vehicle.maintenanceEndDate}
          </div>
        )}

        {/* Rating */}
        <div className="vehicle-rating-badge">
          <span className="vehicle-rating-star">★</span> {avgRating > 0 ? avgRating.toFixed(1) : 'New'} 
          {count > 0 && <span className="vehicle-count-small"> ({count})</span>}
        </div>
      </div>

      {/* Info section */}
      <div className="vehicle-info-container">
        <div className="vehicle-header-row">
          <div>
            <h3 className="vehicle-title">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="vehicle-subtitle">
              {vehicle.year} &nbsp;·&nbsp; 📍 {vehicle.location}
            </p>
          </div>
          <div className="vehicle-price-container">
            <div className="vehicle-price">
              LKR {(vehicle.pricePerDay || 0).toLocaleString()}
            </div>
            <div className="vehicle-price-unit">/day</div>
          </div>
        </div>

        {/* Maintenance Reason Snippet */}
        {isMaintenance && vehicle.maintenanceReason && (
          <div className="maintenance-reason-snippet">
            🔧 {vehicle.maintenanceReason}
          </div>
        )}

        {/* Action buttons */}
        <div className="vehicle-actions-grid">
          <button
            onClick={(e) => { e.stopPropagation(); onDetails(); }}
            className="vehicle-details-btn"
          >
            Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); isAvailable && !isBooked && onBook(); }}
            disabled={!isAvailable || isBooked}
            className={`vehicle-rent-btn ${!isAvailable ? 'disabled-btn' : 'pulse available'}`}
          >
            {!isAvailable ? (isBooked ? 'Rented' : 'Unavailable') : 'Rent Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
