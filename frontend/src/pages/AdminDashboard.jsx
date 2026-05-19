import React, { useState, useEffect } from 'react';
import { adminApi, bookingApi, authApi, supportApi, feedbackApi, vehicleApi, userApi } from '../api/index.jsx';

import * as bookingService from '../services/bookingService';

import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal.jsx';
import notificationService from '../services/notificationService';
import './AdminDashboard.css';

/**
 * AdminDashboard — full platform control panel for ADMIN role.
 *
 * Tabs:
 *   1. Overview   — stats cards (Users, Vehicles, Bookings, Reviews)
 *   2. Vehicles   — CRUD for fleet (Add/Edit/Delete)
 *   3. Users      — View all users, Create Admin accounts
 *   4. Bookings   — View all bookings, update status lifecycle
 *   5. Messages   — Support ticket thread view & reply
 *   6. Reviews    — View all user reviews
 *
 * Vehicle Types: Bike | ThreeWheeler | Car | Van
 * Default pricing auto-filled per type (LKR):
 *   Bike: 350/hr | 2500/day   ThreeWheeler: 500/hr | 3500/day
 *   Car:  900/hr | 5500/day   Van: 1400/hr | 9000/day
 */

const PRICING_DEFAULTS = {
  Bike:         { hourly: 350,  daily: 2500 },
  ThreeWheeler: { hourly: 500,  daily: 3500 },
  Car:          { hourly: 900,  daily: 5500 },
  Van:          { hourly: 1400, daily: 9000 },
};

const VEHICLE_TYPES = ['Bike', 'ThreeWheeler', 'Car', 'Van'];

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const AdminDashboard = ({ notify }) => {
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalVehicles: 0, 
    totalBookings: 0, 
    totalReviews: 0,
    totalRevenue: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  });
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [reviews, setReviews] = useState([]);
  const [platformFeedback, setPlatformFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // ── Confirmation Modal State ──
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: '', 
    onConfirm: () => {},
    variant: 'danger'
  });

  const showConfirm = (title, message, confirmText, onConfirm, variant = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, confirmText, onConfirm, variant });
  };

  // ── Add Vehicle form ──
  const [newVehicle, setNewVehicle] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    pricePerDay: 5500, pricePerHour: 900,
    type: 'Car', location: 'Colombo', photos: [''], description: '', color: '', fuelType: 'Petrol',
    vehicleStatus: 'AVAILABLE'
  });

  // ── Add Admin form ──
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [adminFormErrors, setAdminFormErrors] = useState({});

  // ── Announcement form ──
  const [announcement, setAnnouncement] = useState({ title: '', message: '', role: 'USER', type: 'ADMIN_MESSAGE' });

  // ── Maintenance form ──
  const [maintenanceModal, setMaintenanceModal] = useState({ isOpen: false, vehicle: null, reason: '', endDate: '' });

  // ── Edit Vehicle ──
  const [editVehicle, setEditVehicle] = useState(null);

  // ── Edit User ──
  const [editUser, setEditUser] = useState(null);
  // ── View User Details ──
  const [viewUser, setViewUser] = useState(null);
  // ── Error Modal (Restricted action) ──
  const [errorModal, setErrorModal] = useState({ isOpen: false, headline: '', body: '', cta: 'Close' });

  const showErrorModal = (headline, body, cta = 'Close') => {
    setErrorModal({ isOpen: true, headline, body, cta });
  };

  const handleOpenEditUser = (u) => {
    setEditUser({
      ...u,
      address: u.address || { street: '', city: '', district: '', province: '', postalCode: '', country: 'Sri Lanka' }
    });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editUser) return;
    userApi.update(editUser.id, editUser)
      .then(() => {
        notify('Account updated successfully!', 'success');
        setEditUser(null);
        fetchUsers();
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.message || 'Error updating account.';
        if (errorMsg.includes("credentials") || errorMsg.includes("Restricted")) {
          showErrorModal('Permission Restricted', 'Sensitive admin credentials cannot be modified.', 'Go Back');
        } else {
          notify(errorMsg, 'error');
        }
      });
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'ADMIN') {
      showErrorModal(
        'Action Restricted',
        'Admin accounts cannot be deleted for security reasons.',
        'Close'
      );
      return;
    }
    
    showConfirm(
      'Delete Customer Account?',
      `Are you sure you want to permanently delete customer ${user.name}? This action cannot be undone.`,
      'Delete Account',
      () => {
        adminApi.deleteUser(user.id)
          .then(() => { notify('Customer account deleted.', 'success'); fetchUsers(); fetchStats(); })
          .catch((err) => {
            const msg = err.response?.data?.message || err.message || '';
            if (msg.includes("deleted") || msg.includes("restricted")) {
              showErrorModal('Action Restricted', 'Admin accounts cannot be deleted for security reasons.', 'Close');
            } else {
              notify('Error deleting customer account.', 'error');
            }
          });
      }
    );
  };

  // ── On type change auto-fill pricing ──
  const handleTypeChange = (type, setter, current) => {
    const p = PRICING_DEFAULTS[type] || PRICING_DEFAULTS['Car'];
    setter({ ...current, type, pricePerDay: p.daily, pricePerHour: p.hourly });
  };

  // ── Fetch Functions ──
  const fetchStats    = () => adminApi.getStats().then(r => setStats(r.data)).catch(() => {});
  const fetchVehicles = () => adminApi.getVehicles().then(setVehicles).catch(() => {});
  const fetchUsers    = () => adminApi.getUsers().then(setUsers).catch(() => {});
  const fetchBookings = () => bookingApi.getAll().then(setBookings).catch(() => {});
  const fetchMessages = () => adminApi.getSupportTickets().then(setMessages).catch(() => {});
  const fetchReviews  = () => adminApi.getReviews().then(setReviews).catch(() => {});
  const fetchPlatformFeedback = () => feedbackApi.getAll().then(setPlatformFeedback).catch(() => {});
  useEffect(() => {
    fetchStats();
    fetchVehicles();
    fetchUsers();
    fetchBookings();
    fetchMessages();
    fetchReviews();
    fetchPlatformFeedback();
  }, []);

  // ── Vehicle CRUD ──
  const handleDeleteVehicle = (id) => {
    showConfirm(
      'Delete Vehicle?',
      'This vehicle will be permanently removed from the fleet. This action cannot be undone.',
      'Delete Vehicle',
      () => {
        adminApi.deleteVehicle(id)
          .then(() => { notify('Vehicle removed.', 'success'); fetchVehicles(); fetchStats(); })
          .catch(() => notify('Error deleting vehicle.', 'error'));
      }
    );
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    adminApi.createVehicle({ ...newVehicle, vehicleCategory: newVehicle.type })
      .then(async () => {
        notify('Vehicle added to fleet!', 'success');
        
        const defaults = PRICING_DEFAULTS['Car'];
        setNewVehicle({ 
          make: '', model: '', year: new Date().getFullYear(), 
          pricePerDay: defaults.daily, pricePerHour: defaults.hourly, 
          type: 'Car', location: 'Colombo', photos: [''], 
          description: '', color: '', fuelType: 'Petrol',
          vehicleStatus: 'AVAILABLE'
        });
        fetchVehicles(); fetchStats();
      })
      .catch(() => notify('Error adding vehicle.', 'error'));
  };

  const handleUpdateVehicle = (e) => {
    e.preventDefault();
    adminApi.updateVehicle(editVehicle.id, { ...editVehicle, vehicleCategory: editVehicle.type })
      .then(() => { notify('Vehicle updated!', 'success'); setEditVehicle(null); fetchVehicles(); })
      .catch(() => notify('Error updating vehicle.', 'error'));
  };

  const handleMaintenanceUpdate = (e) => {
    e.preventDefault();
    const { vehicle, reason, endDate } = maintenanceModal;
    vehicleApi.updateMaintenance(vehicle.id, { maintenanceReason: reason, maintenanceEndDate: endDate })
      .then(() => {
        notify('Vehicle put under maintenance.', 'success');
        setMaintenanceModal({ isOpen: false, vehicle: null, reason: '', endDate: '' });
        fetchVehicles();
      })
      .catch(() => notify('Failed to update maintenance.', 'error'));
  };

  const handleSetAvailable = (id) => {
    vehicleApi.updateStatus(id, 'AVAILABLE')
      .then(() => {
        notify('Vehicle is now available!', 'success');
        fetchVehicles();
      })
      .catch(() => notify('Failed to set availability.', 'error'));
  };

  // ── Booking Status Update ──
  const handleStatusUpdate = (bookingId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      showConfirm(
        'Cancel Booking?',
        'Are you sure you want to cancel this rental? A 10% cancellation fee may be deducted.',
        'Cancel Booking',
        () => {
          bookingApi.cancel(bookingId, 'Cancelled by Admin')
            .then(() => { 
              notify('Booking cancelled.', 'success'); 
              fetchBookings(); 
              fetchStats(); 
            })
            .catch(() => notify('Error cancelling booking.', 'error'));
        }
      );
      return;
    }
    
    bookingService.updateBookingStatus(bookingId, newStatus)
      .then(() => { 
        notify(`Booking status updated to ${newStatus}.`, 'success'); 
        fetchBookings(); 
        fetchStats(); 
      })
      .catch(() => notify('Error updating booking status.', 'error'));
  };

  // ── Add Admin ──
  const validateAdminForm = () => {
    const errors = {};
    if (!newAdmin.name.trim()) errors.name = 'Name is required.';
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(newAdmin.email)) errors.email = 'Must be a valid @gmail.com email.';
    if (!newAdmin.password || newAdmin.password.length < 6 || newAdmin.password.length > 12 || !/[a-zA-Z]/.test(newAdmin.password) || !/[0-9]/.test(newAdmin.password)) {
      errors.password = 'Password: 6-12 chars, at least 1 letter + 1 number.';
    }
    setAdminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!validateAdminForm()) return;
    
    authApi.register({ ...newAdmin, type: 'Admin', role: 'ADMIN' })
      .then(() => {
        notify('Admin account created successfully!', 'success');
        setNewAdmin({ name: '', email: '', password: '' });
        setAdminFormErrors({});
        fetchUsers();
      })
      .catch(() => notify('Error creating admin account.', 'error'));
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!adminReply.trim() || !selectedTicket) return;
    
    try {
      const ticket = await supportApi.adminReply(selectedTicket.id, adminReply);
      setSelectedTicket(ticket);
      setAdminReply('');
      notify('Reply sent successfully.', 'success');
      fetchMessages();
    } catch (err) {
      notify('Failed to send reply.', 'error');
    }
  };
  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!announcement.title.trim() || !announcement.message.trim()) return;

    notificationService.sendBroadcast(announcement)
      .then(() => {
        notify('Announcement broadcast successfully!', 'success');
        setAnnouncement({ title: '', message: '', role: 'USER', type: 'ADMIN_MESSAGE' });
      })
      .catch(() => notify('Failed to broadcast announcement.', 'error'));
  };


  // ── Shared Input Style ──
  const inp = (err) => `admin-input ${err ? 'admin-input-error' : 'admin-input-normal'}`;

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'vehicles', label: '🚗 Vehicles' },
    { id: 'users',    label: '👥 Users' },
    { id: 'bookings', label: '📋 Bookings' },
    { id: 'messages', label: '💬 Support' },
    { id: 'reviews',  label: '⭐ Reviews' },
    { id: 'platformFeedback', label: '💬 Platform Feedback' },
    { id: 'announcements', label: '📢 Notify' },
  ];

  return (
    <>
      <div className="container admin-container page-with-navbar-spacing">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Smart Vehicle Rental Platform — Management Console</p>
          </div>
          <div className="admin-mode-badge-wrapper">
            <span className="admin-mode-badge">🛡 ADMIN MODE</span>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); if (t.id !== 'messages') setSelectedTicket(null); }}
              className={`admin-tab-btn ${activeTab === t.id ? 'admin-tab-active' : 'admin-tab-inactive'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════ OVERVIEW ═══════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="admin-overview-container">
            <div className="admin-stats-grid">
              {[
                { label: 'Total Bookings', value: stats.totalBookings, icon: '📋', tab: 'bookings', color: 'blue' },
                { label: 'Total Revenue', value: `LKR ${stats.totalRevenue?.toLocaleString()}`, icon: '💰', tab: 'bookings', color: 'green' },
                { label: 'Active Bookings', value: stats.activeBookings, icon: '🚗', tab: 'bookings', color: 'indigo' },
                { label: 'Completed Bookings', value: stats.completedBookings, icon: '✅', tab: 'bookings', color: 'emerald' },
                { label: 'Cancelled Bookings', value: stats.cancelledBookings, icon: '❌', tab: 'bookings', color: 'rose' },
              ].map(card => (
                <div key={card.label} className={`glass admin-stat-card admin-stat-${card.color}`} onClick={() => setActiveTab(card.tab)}>
                  <div className="admin-stat-icon">{card.icon}</div>
                  <div className="admin-stat-value">{card.value}</div>
                  <div className="admin-stat-label">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Quick pricing reference */}
            <div className="glass admin-pricing-reference">
              <h3 className="admin-pricing-title">💰 Sri Lanka Pricing Reference (LKR)</h3>
              <div className="admin-pricing-grid">
                {Object.entries(PRICING_DEFAULTS).map(([type, p]) => (
                  <div key={type} className="admin-pricing-card">
                    <div className="admin-pricing-type">{type}</div>
                    <div className="admin-pricing-info">Per Hour: <span className="admin-pricing-value">LKR {p.hourly.toLocaleString()}</span></div>
                    <div className="admin-pricing-info admin-pricing-info-mt">Per Day: <span className="admin-pricing-value">LKR {p.daily.toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════ VEHICLES ═══════════════════════════ */}
        {activeTab === 'vehicles' && (
          <div className="admin-split-grid">

            {/* Add Vehicle Form */}
            <div className="glass admin-form-panel">
              <h3 className="admin-form-title">➕ Add New Vehicle</h3>
              <form onSubmit={handleAddVehicle} className="admin-form">
                <div className="admin-form-row">
                  <div><label className="admin-label">Make</label><input placeholder="e.g. Honda" value={newVehicle.make} onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })} className={inp(false)} required /></div>
                  <div><label className="admin-label">Model</label><input placeholder="e.g. CB150" value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} className={inp(false)} required /></div>
                </div>
                <div className="admin-form-row">
                  <div><label className="admin-label">Year</label><input type="number" value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })} className={inp(false)} required /></div>
                  <div>
                    <label className="admin-label">Vehicle Type</label>
                    <select value={newVehicle.type} onChange={e => handleTypeChange(e.target.value, setNewVehicle, newVehicle)} className={inp(false)}>
                      {VEHICLE_TYPES.map(t => <option key={t} value={t} className="admin-select-option">{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div>
                    <label className="admin-label">Price/Day (LKR)</label>
                    <input type="number" value={newVehicle.pricePerDay} onChange={e => setNewVehicle({ ...newVehicle, pricePerDay: parseInt(e.target.value) })} className={inp(false)} required />
                    <span className="admin-form-hint">Default: LKR {PRICING_DEFAULTS[newVehicle.type]?.daily.toLocaleString()}</span>
                  </div>
                  <div>
                    <label className="admin-label">Price/Hour (LKR)</label>
                    <input type="number" value={newVehicle.pricePerHour} onChange={e => setNewVehicle({ ...newVehicle, pricePerHour: parseInt(e.target.value) })} className={inp(false)} required />
                    <span className="admin-form-hint">Default: LKR {PRICING_DEFAULTS[newVehicle.type]?.hourly}</span>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div><label className="admin-label">Location</label><input placeholder="e.g. Colombo" value={newVehicle.location} onChange={e => setNewVehicle({ ...newVehicle, location: e.target.value })} className={inp(false)} required /></div>
                  <div>
                    <label className="admin-label">Fuel Type</label>
                    <select value={newVehicle.fuelType} onChange={e => setNewVehicle({ ...newVehicle, fuelType: e.target.value })} className={inp(false)}>
                      {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(f => <option key={f} className="admin-select-option">{f}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="admin-label">Color</label><input placeholder="e.g. Midnight Black" value={newVehicle.color} onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })} className={inp(false)} /></div>
                <div><label className="admin-label">Image URL or Upload</label>
                  <input placeholder="Paste image URL..." value={newVehicle.photos[0] && !newVehicle.photos[0].startsWith('data:') ? newVehicle.photos[0] : ''} onChange={e => setNewVehicle({ ...newVehicle, photos: [e.target.value] })} className={inp(false)} />
                  <div className="admin-or-divider">— OR —</div>
                  <div className="admin-image-upload">
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewVehicle({ ...newVehicle, photos: [r.result] }); r.readAsDataURL(f); } }} className="admin-file-input" />
                    {newVehicle.photos[0] ? <img src={newVehicle.photos[0]} alt="preview" className="admin-preview-img" /> : <span className="admin-upload-text">📸 Click to upload</span>}
                  </div>
                </div>
                <button type="submit" className="admin-submit-btn">
                  ➕ Add to Fleet
                </button>
              </form>
            </div>

            {/* Vehicle Table */}
            <div className="glass admin-table-panel">
              <h3 className="admin-table-title">🚗 Fleet ({vehicles.length} vehicles)</h3>
              <table className="admin-table">
                <thead>
                  <tr className="admin-tr">
                    {['Image', 'Vehicle', 'Status', 'Location', 'Actions'].map(h => (
                      <th key={h} className="admin-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} className="admin-tr">
                      <td className="admin-td">
                        <img src={v.photos?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=200'} alt={v.make}
                          className="admin-vehicle-img" />
                      </td>
                      <td className="admin-td"><div className="admin-vehicle-name">{v.make} {v.model}</div><div className="admin-vehicle-year">{v.year}</div><div className="admin-price-text">LKR {(v.pricePerDay || 0).toLocaleString()}/day</div></td>
                      <td className="admin-td">
                        <span className={`admin-badge admin-status-badge admin-status-${v.vehicleStatus?.toLowerCase()}`}>
                          {v.vehicleStatus || 'AVAILABLE'}
                        </span>
                        {v.vehicleStatus === 'UNDER_MAINTENANCE' && v.maintenanceEndDate && (
                          <div className="admin-date-text" style={{ fontSize: '0.7rem', marginTop: '4px' }}>Until: {v.maintenanceEndDate}</div>
                        )}
                      </td>
                      <td className="admin-td admin-location-text">📍 {v.location}</td>
                      <td className="admin-td">
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button onClick={() => setEditVehicle({ ...v, photos: v.photos || [''] })} className="admin-action-btn admin-edit-btn">Edit</button>
                          {v.vehicleStatus === 'UNDER_MAINTENANCE' ? (
                            <button onClick={() => handleSetAvailable(v.id)} className="admin-action-btn admin-status-confirm">Complete</button>
                          ) : (
                            <button onClick={() => setMaintenanceModal({ isOpen: true, vehicle: v, reason: '', endDate: '' })} className="admin-action-btn" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Fix</button>
                          )}
                          <button onClick={() => handleDeleteVehicle(v.id)} className="admin-action-btn admin-delete-btn">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vehicles.length === 0 && <div className="admin-empty-state">No vehicles in the fleet yet.</div>}
            </div>
          </div>
        )}

        {/* ═══════════════════════════ USERS ═══════════════════════════ */}
        {activeTab === 'users' && (
          <div className="admin-split-grid admin-users-grid" style={{ gridTemplateColumns: '1fr' }}>
            
            {/* Create Admin Form */}
            <div className="glass admin-form-panel" style={{ marginBottom: '2rem' }}>
              <h3 className="admin-form-title">🛡 Create Admin Account</h3>
              <form onSubmit={handleAddAdmin} className="admin-form admin-form-inline" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}><label className="admin-label">Full Name</label><input placeholder="Admin Name" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} className={inp(adminFormErrors.name)} />
                  {adminFormErrors.name && <span className="admin-error-text">⚠ {adminFormErrors.name}</span>}</div>
                <div style={{ flex: 1, minWidth: '200px' }}><label className="admin-label">Email (@gmail.com)</label><input type="email" placeholder="admin@gmail.com" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} className={inp(adminFormErrors.email)} />
                  {adminFormErrors.email && <span className="admin-error-text">⚠ {adminFormErrors.email}</span>}</div>
                <div style={{ flex: 1, minWidth: '200px' }}><label className="admin-label">Password</label><input type="password" placeholder="6-12 chars, letter+number" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} className={inp(adminFormErrors.password)} />
                  {adminFormErrors.password && <span className="admin-error-text">⚠ {adminFormErrors.password}</span>}</div>
                <button type="submit" className="admin-submit-btn" style={{ height: '46px', marginTop: '16px', minWidth: '150px' }}>
                  🛡 Create Admin
                </button>
              </form>
            </div>

            {/* Customers Section */}
            <div className="glass admin-table-panel" style={{ marginBottom: '2rem' }}>
              <div className="admin-table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="admin-table-title" style={{ margin: 0 }}>👤 Customer Accounts</h3>
                <span className="admin-count-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {users.filter(u => u.role !== 'ADMIN').length} Customers
                </span>
              </div>
              <div className="admin-table-responsive" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr className="admin-tr">
                      {['Name', 'Email', 'Mobile', 'Loyalty Points', 'Status', 'Registered', 'Actions'].map(h => (
                        <th key={h} className="admin-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role !== 'ADMIN').map(u => (
                      <tr key={u.id} className="admin-tr">
                        <td className="admin-td-lg">
                          <div className="admin-user-name" style={{ fontWeight: '600' }}>{u.name}</div>
                          {u.nic && <div className="admin-user-nic" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIC: {u.nic}</div>}
                        </td>
                        <td className="admin-td-lg admin-user-email">{u.email}</td>
                        <td className="admin-td-lg">{u.mobile || '—'}</td>
                        <td className="admin-td-lg">
                          <span style={{ color: '#eab308', fontWeight: 'bold' }}>⭐ {u.loyaltyPoints ?? 0}</span>
                        </td>
                        <td className="admin-td-lg">
                          <span className={`admin-badge admin-status-badge admin-status-${(u.accountStatus || 'ACTIVE').toLowerCase()}`}>
                            {u.accountStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="admin-td-lg admin-date-text">{u.registeredAt ? u.registeredAt.split('T')[0] : '—'}</td>
                        <td className="admin-td-lg">
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setViewUser(u)} className="admin-action-btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>View Details</button>
                            <button onClick={() => handleOpenEditUser(u)} className="admin-action-btn admin-edit-btn">Edit</button>
                            <button onClick={() => handleDeleteUser(u)} className="admin-action-btn admin-delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.filter(u => u.role !== 'ADMIN').length === 0 && <div className="admin-empty-state">No customer accounts registered.</div>}
            </div>

            {/* Admins Section */}
            <div className="glass admin-table-panel">
              <div className="admin-table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="admin-table-title" style={{ margin: 0 }}>🛡 Admin Accounts</h3>
                <span className="admin-count-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {users.filter(u => u.role === 'ADMIN').length} Admins
                </span>
              </div>
              <div className="admin-table-responsive" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr className="admin-tr">
                      {['Name', 'Email', 'Department', 'Admin Level', 'Status', 'Registered', 'Actions'].map(h => (
                        <th key={h} className="admin-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'ADMIN').map(u => (
                      <tr key={u.id} className="admin-tr">
                        <td className="admin-td-lg">
                          <div className="admin-user-name" style={{ fontWeight: '600' }}>{u.name}</div>
                          {u.mobile && <div className="admin-user-mobile" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.mobile}</div>}
                        </td>
                        <td className="admin-td-lg admin-user-email">{u.email}</td>
                        <td className="admin-td-lg">{u.department || '—'}</td>
                        <td className="admin-td-lg">
                          <span className="admin-role-badge admin-role-admin" style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                            {u.adminLevel || 'ADMIN'}
                          </span>
                        </td>
                        <td className="admin-td-lg">
                          <span className={`admin-badge admin-status-badge admin-status-${(u.accountStatus || 'ACTIVE').toLowerCase()}`}>
                            {u.accountStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="admin-td-lg admin-date-text">{u.registeredAt ? u.registeredAt.split('T')[0] : '—'}</td>
                        <td className="admin-td-lg">
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleOpenEditUser(u)} className="admin-action-btn admin-edit-btn">Edit Profile</button>
                            <button 
                              onClick={() => {
                                const newStatus = u.accountStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
                                const verb = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
                                showConfirm(
                                  `${newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Admin Account?`,
                                  `Are you sure you want to ${verb} the admin account for ${u.name}?`,
                                  newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate',
                                  () => {
                                    userApi.update(u.id, { ...u, accountStatus: newStatus })
                                      .then(() => { notify(`Admin account ${newStatus.toLowerCase()}d successfully.`, 'success'); fetchUsers(); })
                                      .catch((err) => notify(err.response?.data?.message || err.message || 'Error updating status.', 'error'));
                                  },
                                  newStatus === 'ACTIVE' ? 'confirm' : 'danger'
                                );
                              }} 
                              className="admin-action-btn"
                              style={{ 
                                background: u.accountStatus === 'DEACTIVATED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                color: u.accountStatus === 'DEACTIVATED' ? '#10b981' : '#ef4444', 
                                border: u.accountStatus === 'DEACTIVATED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' 
                              }}
                            >
                              {u.accountStatus === 'DEACTIVATED' ? 'Activate' : 'Deactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════ BOOKINGS ═══════════════════════════ */}
        {activeTab === 'bookings' && (
          <div className="glass admin-table-panel">
            <h3 className="admin-table-title">📋 All Bookings ({bookings.length})</h3>
            <table className="admin-table">
              <thead>
                <tr className="admin-tr">
                  {['User', 'Vehicle', 'Dates', 'Total (LKR)', 'Status', 'Actions'].map(h => (
                    <th key={h} className="admin-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="admin-tr">
                    <td className="admin-td-lg"><div className="admin-booking-user">{b.userName}</div><div className="admin-booking-email">{b.userEmail}</div></td>
                    <td className="admin-td-lg admin-booking-vehicle">{b.vehicleName}<br /><span className="admin-booking-vtype">{b.vehicleType}</span></td>
                    <td className="admin-td-lg admin-booking-dates">{b.startDate}<br />→ {b.endDate}</td>
                    <td className="admin-td-lg admin-booking-price">
                      {(b.totalPrice || 0).toLocaleString()}
                      {b.cancellationFee > 0 && <div className="admin-booking-fee">Fee: {b.cancellationFee.toLocaleString()}</div>}
                    </td>
                    <td className="admin-td-lg">
                      <span className={`admin-badge admin-status-badge admin-status-${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="admin-td-lg">
                      {b.status === 'PENDING' && <button onClick={() => handleStatusUpdate(b.id, 'CONFIRMED')} className="admin-status-btn admin-status-confirm">Confirm</button>}
                      {b.status === 'CONFIRMED' && <button onClick={() => handleStatusUpdate(b.id, 'ACTIVE')} className="admin-status-btn admin-status-activate">Activate</button>}
                      {b.status === 'ACTIVE' && <button onClick={() => handleStatusUpdate(b.id, 'COMPLETED')} className="admin-status-btn admin-status-complete">Complete</button>}
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && <button onClick={() => handleStatusUpdate(b.id, 'CANCELLED')} className="admin-status-btn admin-status-cancel">Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <div className="admin-empty-state">No bookings yet.</div>}

            {/* ── Cancelled Bookings Section ── */}
            <div className="admin-cancelled-section" style={{ marginTop: '3rem' }}>
              <div className="admin-table-header-row">
                <h3 className="admin-table-title" style={{ color: '#ef4444' }}>🚫 Cancelled Bookings</h3>
                <span className="admin-count-badge">{bookings.filter(b => b.status === 'CANCELLED').length} total</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr className="admin-tr">
                    {['Customer', 'Vehicle', 'Dates', 'Cancelled On', 'Reason', 'Fee/Refund'].map(h => (
                      <th key={h} className="admin-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.status === 'CANCELLED').map(b => (
                    <tr key={b.id} className="admin-tr">
                      <td className="admin-td-lg">
                        <div className="admin-booking-user">{b.userName}</div>
                        <div className="admin-booking-email">{b.userEmail}</div>
                      </td>
                      <td className="admin-td-lg admin-booking-vehicle">
                        {b.vehicleName}<br />
                        <span className="admin-booking-vtype">{b.vehicleType}</span>
                      </td>
                      <td className="admin-td-lg admin-booking-dates">
                        {b.startDate}<br />→ {b.endDate}
                      </td>
                      <td className="admin-td-lg admin-date-text">
                        {b.cancelledAt ? b.cancelledAt.split('T')[0] : '—'}
                      </td>
                      <td className="admin-td-lg">
                        <div className="admin-cancel-reason-text" title={b.cancellationReason}>
                          {b.cancellationReason || 'Not specified'}
                        </div>
                      </td>
                      <td className="admin-td-lg">
                        <div className="admin-fee-text">Fee: LKR {b.cancellationFee?.toLocaleString()}</div>
                        <div className="admin-refund-text" style={{ color: '#22c55e', fontWeight: 'bold' }}>
                          Refund: LKR {((b.totalPrice || 0) - (b.cancellationFee || 0)).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.filter(b => b.status === 'CANCELLED').length === 0 && (
                <div className="admin-empty-state">No cancelled bookings yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════ SUPPORT MESSAGES ═══════════════════════════ */}
        {activeTab === 'messages' && (
          <div className="admin-support-grid">
            <div className="glass admin-ticket-list">
              <h3 className="admin-ticket-list-title">💬 Support Tickets ({messages.length})</h3>
              {messages.length > 0 ? messages.map(m => (
                <div key={m.id} onClick={() => setSelectedTicket(m)}
                  className={`admin-ticket-item ${selectedTicket?.id === m.id ? 'admin-ticket-active' : 'admin-ticket-inactive'}`}>
                  <div className="admin-ticket-user">{m.userName}</div>
                  <div className={`admin-ticket-email ${selectedTicket?.id === m.id ? 'admin-ticket-email-active' : 'admin-ticket-email-inactive'}`}>{m.userEmail}</div>
                  <div className="admin-ticket-subject">{m.subject}</div>
                  <div className="admin-ticket-status-wrapper">
                    <span className={`admin-ticket-status ${m.status === 'RESOLVED' ? 'admin-ticket-resolved' : 'admin-ticket-pending'}`}>{m.status}</span>
                  </div>
                </div>
              )) : <div className="admin-date-text">No support tickets.</div>}
            </div>

            <div className="glass admin-chat-panel">
              {selectedTicket ? (
                <>
                  <div className="admin-chat-header">
                    <h3 className="admin-chat-title">{selectedTicket.subject}</h3>
                    <div className="admin-chat-subtitle">From: {selectedTicket.userName} ({selectedTicket.userEmail})</div>
                  </div>
                  <div className="admin-chat-messages">
                    {(selectedTicket.messages || []).map((chat, idx) => {
                      const sender = chat.senderId ?? chat.sender ?? 'USER';
                      const body = chat.content ?? chat.text ?? '';
                      return (
                      <div key={idx} className={`admin-chat-bubble ${sender === 'ADMIN' ? 'admin-chat-bubble-admin' : 'admin-chat-bubble-user'}`}>
                        <div className="admin-chat-text">{body}</div>
                        <div className="admin-chat-time">{chat.timestamp?.split('T')[0]}</div>
                      </div>
                    );})}
                  </div>
                  <form onSubmit={handleSendReply} className="admin-reply-form">
                    <input placeholder="Type a reply..." value={adminReply} onChange={e => setAdminReply(e.target.value)}
                      className="admin-reply-input" />
                    <button type="submit" className="admin-reply-btn">Reply</button>
                  </form>
                </>
              ) : (
                <div className="admin-chat-empty">
                  <span className="admin-chat-empty-icon">💬</span>
                  <span>Select a conversation</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════ REVIEWS ═══════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="glass admin-reviews-panel">
            <h3 className="admin-reviews-title">⭐ All Reviews ({reviews.length})</h3>
            <div className="admin-reviews-list">
              {reviews.map(r => (
                <div key={r.id} className="glass admin-review-card">
                  <div className="admin-review-header">
                    <div><strong>{r.userName || r.userEmail}</strong><div className="admin-review-email">{r.userEmail}</div></div>
                    <span className="admin-review-rating">{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p className="admin-review-comment">{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && <div className="admin-empty-state">No reviews yet.</div>}
            </div>
          </div>
        )}
        {/* ═══════════════════════════ PLATFORM FEEDBACK ═══════════════════════════ */}
        {activeTab === 'platformFeedback' && (
          <div className="glass admin-reviews-panel">
            <h3 className="admin-reviews-title">💬 Platform Feedback ({platformFeedback.length})</h3>
            <div className="admin-reviews-list">
              {platformFeedback.map(f => (
                <div key={f.id} className="glass admin-review-card">
                  <div className="admin-review-header">
                    <div>
                      <strong>{f.userName}</strong>
                      <div className="admin-review-email">{f.userEmail}</div>
                      <div className="admin-review-category" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>{f.category}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span className="admin-review-rating">{'⭐'.repeat(f.rating)}</span>
                      <button 
                        onClick={() => {
                          showConfirm(
                            'Delete Feedback?',
                            'Are you sure you want to remove this feedback?',
                            'Delete',
                            () => {
                              feedbackApi.delete(f.id)
                                .then(() => { notify('Feedback removed.', 'success'); fetchPlatformFeedback(); })
                                .catch(() => notify('Error deleting feedback.', 'error'));
                            }
                          );
                        }}
                        className="admin-action-btn admin-delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="admin-review-comment">{f.comment}</p>
                  <div className="admin-date-text" style={{ textAlign: 'right', fontSize: '0.75rem' }}>{f.createdAt?.split('T')[0]}</div>
                </div>
              ))}
              {platformFeedback.length === 0 && <div className="admin-empty-state">No platform feedback yet.</div>}
            </div>
          </div>
        )}
        {/* ═══════════════════════════ ANNOUNCEMENTS ═══════════════════════════ */}
        {activeTab === 'announcements' && (
          <div className="admin-split-grid">
            <div className="glass admin-form-panel">
              <h3 className="admin-form-title">📢 Send System Announcement</h3>
              <p className="admin-form-hint" style={{ marginBottom: '1rem' }}>This will send a persistent notification to all users with the selected role.</p>
              <form onSubmit={handleSendAnnouncement} className="admin-form">
                <div>
                  <label className="admin-label">Announcement Title</label>
                  <input 
                    placeholder="e.g. Weekend Discount!" 
                    value={announcement.title} 
                    onChange={e => setAnnouncement({ ...announcement, title: e.target.value })} 
                    className={inp(false)} 
                    required 
                  />
                </div>
                <div>
                  <label className="admin-label">Message</label>
                  <textarea 
                    placeholder="Type your message here..." 
                    value={announcement.message} 
                    onChange={e => setAnnouncement({ ...announcement, message: e.target.value })} 
                    className={inp(false)} 
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    required 
                  />
                </div>
                <div className="admin-form-row">
                  <div>
                    <label className="admin-label">Target Role</label>
                    <select 
                      value={announcement.role} 
                      onChange={e => setAnnouncement({ ...announcement, role: e.target.value })} 
                      className={inp(false)}
                    >
                      <option value="USER" className="admin-select-option">All Customers</option>
                      <option value="ADMIN" className="admin-select-option">All Admins</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Category</label>
                    <select 
                      value={announcement.type} 
                      onChange={e => setAnnouncement({ ...announcement, type: e.target.value })} 
                      className={inp(false)}
                    >
                      <option value="DISCOUNT_ALERT" className="admin-select-option">Discount/Promo</option>
                      <option value="ADMIN_MESSAGE" className="admin-select-option">System News</option>
                      <option value="VEHICLE_AVAILABLE" className="admin-select-option">Availability Alert</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="admin-submit-btn" style={{ background: 'var(--primary)' }}>
                  🚀 Broadcast Now
                </button>
              </form>
            </div>

            <div className="glass admin-info-panel" style={{ padding: '2rem' }}>
              <h3 className="admin-info-title">💡 Notification Best Practices</h3>
              <ul className="admin-info-list" style={{ marginTop: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <li>Keep titles short and punchy.</li>
                <li>Use categories to show correct icons to users.</li>
                <li>Broadcasts are persistent and will be seen by users when they log in.</li>
                <li>Use <strong>Discount/Promo</strong> for marketing alerts.</li>
                <li>Use <strong>System News</strong> for maintenance or platform updates.</li>
              </ul>
              <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '3rem', opacity: 0.2 }}>
                🔔
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Maintenance Modal ── */}
      <Modal
        isOpen={maintenanceModal.isOpen}
        onClose={() => setMaintenanceModal({ ...maintenanceModal, isOpen: false })}
        title="🔧 Schedule Maintenance"
      >
        <form onSubmit={handleMaintenanceUpdate} className="admin-form">
          <p className="admin-form-hint" style={{ marginBottom: '1rem' }}>
            Putting <strong>{maintenanceModal.vehicle?.make} {maintenanceModal.vehicle?.model}</strong> under maintenance will block all new bookings.
          </p>
          <div>
            <label className="admin-label">Maintenance Reason</label>
            <input 
              placeholder="e.g. Annual Engine Service, Brake Check" 
              value={maintenanceModal.reason} 
              onChange={e => setMaintenanceModal({ ...maintenanceModal, reason: e.target.value })} 
              className="admin-input admin-input-normal"
              required 
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label className="admin-label">Expected Completion Date</label>
            <input 
              type="date"
              value={maintenanceModal.endDate} 
              onChange={e => setMaintenanceModal({ ...maintenanceModal, endDate: e.target.value })} 
              className="admin-input admin-input-normal"
              min={new Date().toISOString().split('T')[0]}
              required 
            />
          </div>
          <div className="admin-modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => setMaintenanceModal({ ...maintenanceModal, isOpen: false })} className="admin-modal-cancel" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>Cancel</button>
            <button type="submit" className="admin-modal-save" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f59e0b', border: 'none', color: 'white', fontWeight: 'bold' }}>🔧 Start Maintenance</button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Vehicle Modal ── */}
      <Modal 
        isOpen={!!editVehicle} 
        onClose={() => setEditVehicle(null)} 
        title="✏️ Edit Vehicle"
      >
        <form onSubmit={handleUpdateVehicle} className="admin-form">
          <div className="admin-form-row">
            <div><label className="admin-label">Make</label><input value={editVehicle?.make || ''} onChange={e => setEditVehicle({ ...editVehicle, make: e.target.value })} className={inp(false)} required /></div>
            <div><label className="admin-label">Model</label><input value={editVehicle?.model || ''} onChange={e => setEditVehicle({ ...editVehicle, model: e.target.value })} className={inp(false)} required /></div>
          </div>
          <div className="admin-form-row">
            <div><label className="admin-label">Year</label><input type="number" value={editVehicle?.year || ''} onChange={e => setEditVehicle({ ...editVehicle, year: parseInt(e.target.value) })} className={inp(false)} required /></div>
            <div>
              <label className="admin-label">Vehicle Type</label>
              <select value={editVehicle?.type || 'Car'} onChange={e => handleTypeChange(e.target.value, setEditVehicle, editVehicle)} className={inp(false)}>
                {VEHICLE_TYPES.map(t => <option key={t} value={t} className="admin-select-option">{t}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div><label className="admin-label">Price/Day (LKR)</label><input type="number" value={editVehicle?.pricePerDay || ''} onChange={e => setEditVehicle({ ...editVehicle, pricePerDay: parseInt(e.target.value) })} className={inp(false)} required /></div>
            <div><label className="admin-label">Price/Hour (LKR)</label><input type="number" value={editVehicle?.pricePerHour || ''} onChange={e => setEditVehicle({ ...editVehicle, pricePerHour: parseInt(e.target.value) })} className={inp(false)} /></div>
          </div>
          <div className="admin-form-row">
            <div><label className="admin-label">Location</label><input value={editVehicle?.location || ''} onChange={e => setEditVehicle({ ...editVehicle, location: e.target.value })} className={inp(false)} required /></div>
            <div><label className="admin-label">Color</label><input value={editVehicle?.color || ''} onChange={e => setEditVehicle({ ...editVehicle, color: e.target.value })} className={inp(false)} /></div>
          </div>
          <div><label className="admin-label">Image URL</label>
            <input placeholder="Image URL..." value={editVehicle?.photos?.[0] && !editVehicle.photos[0].startsWith('data:') ? editVehicle.photos[0] : ''} onChange={e => setEditVehicle({ ...editVehicle, photos: [e.target.value] })} className={inp(false)} />
            <div className="admin-image-upload admin-image-upload-mt">
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setEditVehicle({ ...editVehicle, photos: [r.result] }); r.readAsDataURL(f); } }} className="admin-file-input" />
              {editVehicle?.photos?.[0] ? <img src={editVehicle.photos[0]} alt="preview" className="admin-preview-img" /> : <span className="admin-upload-text">📸 Upload new image</span>}
            </div>
          </div>
          <div className="admin-modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => setEditVehicle(null)} className="admin-modal-cancel" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="admin-modal-save" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>💾 Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* ── View User Details Modal ── */}
      <Modal
        isOpen={!!viewUser}
        onClose={() => setViewUser(null)}
        title="👤 Customer Account Details"
      >
        {viewUser && (
          <div className="admin-view-user-details" style={{ color: 'white', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <div style={{ fontSize: '3rem' }}>👤</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{viewUser.name}</h3>
                <span className="admin-role-badge admin-role-user" style={{ fontSize: '0.75rem' }}>CUSTOMER</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</label>
                <div style={{ fontWeight: '500' }}>{viewUser.email}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mobile Number</label>
                <div style={{ fontWeight: '500' }}>{viewUser.mobile || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>NIC Number</label>
                <div style={{ fontWeight: '500' }}>{viewUser.nic || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>License Number</label>
                <div style={{ fontWeight: '500' }}>{viewUser.driverLicenseNumber || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loyalty Points</label>
                <div style={{ fontWeight: 'bold', color: '#eab308' }}>⭐ {viewUser.loyaltyPoints ?? 0} Points</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Referral Code</label>
                <div style={{ fontWeight: '500', color: 'var(--primary)' }}>{viewUser.referralCode || '—'} ({viewUser.referralCount ?? 0} referrals)</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered At</label>
                <div style={{ fontWeight: '500' }}>{viewUser.registeredAt ? viewUser.registeredAt.replace('T', ' ').split('.')[0] : '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Status</label>
                <span className={`admin-badge admin-status-badge admin-status-${(viewUser.accountStatus || 'ACTIVE').toLowerCase()}`}>
                  {viewUser.accountStatus || 'ACTIVE'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>📍 Address Information</label>
              {viewUser.address ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>{viewUser.address.street || 'No street specified'}</div>
                  <div>{viewUser.address.city || 'No city'}, {viewUser.address.district || 'No district'}</div>
                  <div>{viewUser.address.province || 'No province'}, {viewUser.address.postalCode || 'No postal code'}</div>
                  <div>{viewUser.address.country || 'Sri Lanka'}</div>
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No address registered.</div>
              )}
            </div>

            <div className="admin-modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" onClick={() => setViewUser(null)} className="admin-modal-cancel" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit User Modal ── */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={editUser?.role === 'ADMIN' ? '🛡 Edit Admin Profile' : '👤 Edit Customer Account'}
      >
        {editUser && (
          <form onSubmit={handleUpdateUser} className="admin-form">
            <div className="admin-form-row">
              <div>
                <label className="admin-label">Full Name</label>
                <input 
                  value={editUser.name || ''} 
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })} 
                  className={inp(false)} 
                  required 
                />
              </div>
              <div>
                <label className="admin-label">Email Address</label>
                <input 
                  type="email"
                  value={editUser.email || ''} 
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })} 
                  className={inp(false)} 
                  required 
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div>
                <label className="admin-label">Mobile Number</label>
                <input 
                  value={editUser.mobile || ''} 
                  onChange={e => setEditUser({ ...editUser, mobile: e.target.value })} 
                  className={inp(false)} 
                />
              </div>
              <div>
                <label className="admin-label">NIC Number</label>
                <input 
                  value={editUser.nic || ''} 
                  onChange={e => setEditUser({ ...editUser, nic: e.target.value })} 
                  className={inp(false)} 
                />
              </div>
            </div>

            {editUser.role === 'ADMIN' ? (
              // Admin Specific Fields
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Department</label>
                  <input 
                    value={editUser.department || ''} 
                    onChange={e => setEditUser({ ...editUser, department: e.target.value })} 
                    className={inp(false)} 
                  />
                </div>
                <div>
                  <label className="admin-label">Admin Level</label>
                  <input 
                    value={editUser.adminLevel || ''} 
                    onChange={e => setEditUser({ ...editUser, adminLevel: e.target.value })} 
                    className={inp(false)} 
                  />
                </div>
              </div>
            ) : (
              // Customer Specific Fields
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">License Number</label>
                  <input 
                    value={editUser.driverLicenseNumber || ''} 
                    onChange={e => setEditUser({ ...editUser, driverLicenseNumber: e.target.value })} 
                    className={inp(false)} 
                  />
                </div>
                <div>
                  <label className="admin-label">Loyalty Points</label>
                  <input 
                    type="number"
                    value={editUser.loyaltyPoints ?? 0} 
                    onChange={e => setEditUser({ ...editUser, loyaltyPoints: parseInt(e.target.value) || 0 })} 
                    className={inp(false)} 
                  />
                </div>
              </div>
            )}

            <div className="admin-form-row">
              <div>
                <label className="admin-label">Account Status</label>
                <select 
                  value={editUser.accountStatus || 'ACTIVE'} 
                  onChange={e => setEditUser({ ...editUser, accountStatus: e.target.value })} 
                  className={inp(false)}
                >
                  <option value="ACTIVE" className="admin-select-option">ACTIVE</option>
                  <option value="DEACTIVATED" className="admin-select-option">DEACTIVATED</option>
                </select>
              </div>
              {editUser.role === 'ADMIN' && (
                <div>
                  <label className="admin-label">Clearance Level (Read-Only)</label>
                  <input 
                    type="number" 
                    value={editUser.clearanceLevel || 1} 
                    className={inp(false)} 
                    disabled 
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                </div>
              )}
            </div>

            {/* Address fields */}
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <label className="admin-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>📍 Address Details</label>
              
              <div className="admin-form-row" style={{ marginTop: '8px' }}>
                <div>
                  <label className="admin-label">Street</label>
                  <input 
                    value={editUser.address?.street || ''} 
                    onChange={e => setEditUser({ 
                      ...editUser, 
                      address: { ...editUser.address, street: e.target.value } 
                    })} 
                    className={inp(false)} 
                  />
                </div>
                <div>
                  <label className="admin-label">City</label>
                  <input 
                    value={editUser.address?.city || ''} 
                    onChange={e => setEditUser({ 
                      ...editUser, 
                      address: { ...editUser.address, city: e.target.value } 
                    })} 
                    className={inp(false)} 
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div>
                  <label className="admin-label">District</label>
                  <input 
                    value={editUser.address?.district || ''} 
                    onChange={e => setEditUser({ 
                      ...editUser, 
                      address: { ...editUser.address, district: e.target.value } 
                    })} 
                    className={inp(false)} 
                  />
                </div>
                <div>
                  <label className="admin-label">Province</label>
                  <input 
                    value={editUser.address?.province || ''} 
                    onChange={e => setEditUser({ 
                      ...editUser, 
                      address: { ...editUser.address, province: e.target.value } 
                    })} 
                    className={inp(false)} 
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Postal Code</label>
                  <input 
                    value={editUser.address?.postalCode || ''} 
                    onChange={e => setEditUser({ 
                      ...editUser, 
                      address: { ...editUser.address, postalCode: e.target.value } 
                    })} 
                    className={inp(false)} 
                  />
                </div>
                <div>
                  <label className="admin-label">Country</label>
                  <input 
                    value={editUser.address?.country || 'Sri Lanka'} 
                    onChange={e => setEditUser({ 
                      ...editUser, 
                      address: { ...editUser.address, country: e.target.value } 
                    })} 
                    className={inp(false)} 
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setEditUser(null)} className="admin-modal-cancel" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="admin-modal-save" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>💾 Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Error Modal (Restricted action) ── */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.headline}
      >
        <div style={{ color: 'white', textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '1.4rem', color: '#ef4444', margin: '0 0 12px 0' }}>{errorModal.headline}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
            {errorModal.body}
          </p>
          <button 
            type="button" 
            onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
            className="admin-submit-btn" 
            style={{ width: '100%', background: '#ef4444', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}
          >
            {errorModal.cta}
          </button>
        </div>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
};

export default AdminDashboard;
