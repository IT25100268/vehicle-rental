import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleApi } from '../api/index.jsx';
import './VehicleSearch.css';

const VehicleSearch = ({ notify, wishlistIds = [], onToggleWishlist }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: [0, 50000],
    fuel: 'all',
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState(() => {
    try {
      const raw = sessionStorage.getItem('compareVehicleIds');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await vehicleApi.getAvailable();
        if (!cancelled) setVehicles(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setVehicles([]);
        notify?.('Could not load vehicles. Is the backend running?', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const persistCompare = (ids) => {
    setCompareIds(ids);
    sessionStorage.setItem('compareVehicleIds', JSON.stringify(ids));
  };

  const toggleCompare = (id) => {
    const wasSelected = compareIds.includes(id);
    const next = wasSelected ? compareIds.filter((x) => x !== id) : [...compareIds, id];
    persistCompare(next);
    notify?.(wasSelected ? 'Removed from compare' : 'Added to compare', 'info');
  };

  const filtered = vehicles.filter((v) => {
    if (filters.type !== 'all' && v.type !== filters.type) return false;
    const day = v.pricePerDay || 0;
    if (day < filters.priceRange[0] || day > filters.priceRange[1]) return false;
    if (filters.fuel !== 'all' && (v.fuelType || '') !== filters.fuel) return false;
    return true;
  });

  if (loading) {
    return <div className="vehicle-search-page page-with-navbar-spacing animate-in"><div className="container loading">Loading fleet…</div></div>;
  }

  return (
    <div className="vehicle-search-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="search-header">
          <span className="section-label">Explore Fleet</span>
          <h1>Find Your Perfect Ride</h1>
          <p className="text-muted">Live data from the rental API — filters apply client-side.</p>
        </header>

        <div className="search-layout">
          <aside className="filters-sidebar glass">
            <h3>Filters</h3>
            <div className="filter-group">
              <label>Vehicle Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="glass-input"
              >
                <option value="all">All Types</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Van">Van</option>
                <option value="ThreeWheeler">ThreeWheeler</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Max price / day (LKR)</label>
              <input
                type="range"
                min="0"
                max="50000"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters({ ...filters, priceRange: [0, Number(e.target.value)] })
                }
                className="range-slider"
              />
              <div className="range-values">
                <span>0</span>
                <span>{filters.priceRange[1].toLocaleString()}+</span>
              </div>
            </div>

            <div className="filter-group">
              <label>Fuel Type</label>
              <select
                className="glass-input"
                value={filters.fuel}
                onChange={(e) => setFilters({ ...filters, fuel: e.target.value })}
              >
                <option value="all">All</option>
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary w-full" onClick={() => notify?.('Filters applied.', 'success')}>
              Apply Filters
            </button>

            <button
              type="button"
              className="btn-primary w-full"
              style={{ marginTop: 8 }}
              disabled={compareIds.length < 2}
              onClick={() => navigate('/compare')}
            >
              Open compare ({compareIds.length})
            </button>
          </aside>

          <main className="search-results">
            <div className="results-toolbar glass">
              <span>Showing {filtered.length} vehicles</span>
            </div>

            <div className="vehicles-grid">
              {filtered.map((v) => (
                <div key={v.id} className="vehicle-card-v2 glass hover-pop">
                  <div className="v2-card-image">
                    <img src={v.photos?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'} alt={`${v.make} ${v.model}`} />
                    <span className="v2-badge">{v.type}</span>
                    <button
                      type="button"
                      className={`wishlist-heart-btn ${wishlistIds.includes(v.id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist?.(v.id);
                      }}
                      title={wishlistIds.includes(v.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      style={{ bottom: '1rem', left: '1rem' }}
                    >
                      {wishlistIds.includes(v.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="v2-card-content">
                    <h4>
                      {v.make} {v.model}
                    </h4>
                    <div className="v2-stats">
                      <span>{v.fuelType || '—'}</span>
                      <span>•</span>
                      <span>{v.location || '—'}</span>
                    </div>
                    <div className="v2-footer">
                      <div className="v2-price">
                        <span className="price-val">LKR {(v.pricePerDay ?? 0).toLocaleString()}</span>
                        <span className="price-unit">/day</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => navigate('/vehicle-details', { state: { vehicle: v } })}
                        >
                          Details
                        </button>
                        <button type="button" className="btn-primary btn-sm" onClick={() => toggleCompare(v.id)}>
                          {compareIds.includes(v.id) ? 'Compare ✓' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default VehicleSearch;
