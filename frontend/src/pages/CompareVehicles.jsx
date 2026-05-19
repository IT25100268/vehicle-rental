import React, { useEffect, useState } from 'react';
import * as discoveryService from '../services/discoveryService';
import './CompareVehicles.css';

const CompareVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = sessionStorage.getItem('compareVehicleIds');
        const ids = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(ids) || ids.length === 0) {
          if (!cancelled) setVehicles([]);
          return;
        }
        const list = await discoveryService.compareVehicles(ids);
        if (!cancelled) setVehicles(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setVehicles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="compare-page page-with-navbar-spacing animate-in"><div className="container loading">Loading comparison…</div></div>;
  }

  if (vehicles.length < 2) {
    return (
      <div className="compare-page page-with-navbar-spacing animate-in">
        <div className="container">
          <header className="compare-header">
            <span className="section-label">Comparison Tool</span>
            <h1>Compare Vehicles</h1>
            <p className="text-muted">Select at least two vehicles from search, then open Compare (session uses saved ids).</p>
          </header>
          <div className="glass compare-table" style={{ padding: '2rem' }}>
            <p>Tip: from vehicle search, add vehicles to compare and revisit this page in the same browser session.</p>
          </div>
        </div>
      </div>
    );
  }

  const [a, b] = vehicles;

  const specs = [
    { label: 'Type', v1: a.type, v2: b.type },
    { label: 'Year', v1: a.year, v2: b.year },
    { label: 'Fuel', v1: a.fuelType || '—', v2: b.fuelType || '—' },
    { label: 'Seats', v1: a.seatingCapacity || '—', v2: b.seatingCapacity || '—' },
    { label: 'Price / day (LKR)', v1: (a.pricePerDay ?? 0).toLocaleString(), v2: (b.pricePerDay ?? 0).toLocaleString() },
    { label: 'Price / hour (LKR)', v1: (a.pricePerHour ?? 0).toLocaleString(), v2: (b.pricePerHour ?? 0).toLocaleString() },
    { label: 'Location', v1: a.location || '—', v2: b.location || '—' },
    { label: 'Maintenance', v1: a.maintenanceStatus || 'OK', v2: b.maintenanceStatus || 'OK' },
  ];

  return (
    <div className="compare-page page-with-navbar-spacing animate-in">
      <div className="container">
        <header className="compare-header">
          <span className="section-label">Comparison Tool</span>
          <h1>Compare Your Favorites</h1>
          <p className="text-muted">Side-by-side view from live fleet data.</p>
        </header>

        <div className="compare-table glass">
          <div className="table-row header-row">
            <div className="spec-label-col">Features</div>
            <div className="vehicle-col">
              <div className="compare-card">
                <img src={a.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'} alt={`${a.make} ${a.model}`} />
                <h4>{a.make} {a.model}</h4>
              </div>
            </div>
            <div className="vehicle-col">
              <div className="compare-card">
                <img src={b.photos?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400'} alt={`${b.make} ${b.model}`} />
                <h4>{b.make} {b.model}</h4>
              </div>
            </div>
          </div>

          {specs.map((s, i) => (
            <div key={i} className="table-row">
              <div className="spec-label-col">{s.label}</div>
              <div className="vehicle-col">{s.v1}</div>
              <div className="vehicle-col">{s.v2}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompareVehicles;
