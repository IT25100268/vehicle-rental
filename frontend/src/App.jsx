import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import AuthModal from './components/AuthModal.jsx';
import HomePage from './pages/HomePage.jsx';
import UserProfile from './pages/UserProfile.jsx';
import MyBookings from './pages/MyBookings.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SupportPage from './pages/SupportPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
// Member 1 Pages
import VehicleSearch from './pages/VehicleSearch.jsx';
import VehicleDetails from './pages/VehicleDetails.jsx';
import CompareVehicles from './pages/CompareVehicles.jsx';
// Member 2 Pages
import RewardsDashboard from './pages/RewardsDashboard.jsx';
import ReferralPage from './pages/ReferralPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
// Member 3 Pages
import BookingSuccess from './pages/BookingSuccess.jsx';
import InvoiceHistory from './pages/InvoiceHistory.jsx';
import LiveTracking from './pages/LiveTracking.jsx';
// Member 4 Pages
import SafetyGuidelines from './pages/SafetyGuidelines.jsx';
import InsuranceDetails from './pages/InsuranceDetails.jsx';
import BlogPage from './pages/BlogPage.jsx';
// Member 5 Pages
import ReviewsPage from './pages/ReviewsPage.jsx';
import CommunityForum from './pages/CommunityForum.jsx';
import FaqCenter from './pages/FaqCenter.jsx';
// Member 6 Pages
import ActivityLogs from './pages/ActivityLogs.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import AccountPrivacy from './pages/AccountPrivacy.jsx';
import PlatformFeedback from './pages/PlatformFeedback.jsx';
import MyReviews from './pages/MyReviews.jsx';
import WalletPage from './pages/WalletPage.jsx';
import Toast from './components/Toast.jsx';
import axios from 'axios';
import authApi from './api/authApi.js';
import * as discoveryService from './services/discoveryService.js';
import './App.css';

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Clean up old mock users (those with numeric IDs or missing role)
      if (!parsed.id || !parsed.role || (typeof parsed.id === 'number')) {
        localStorage.removeItem('user');
        localStorage.removeItem('mockUsers'); // Clear any legacy mock users too
        return null;
      }
      return parsed;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [toast, setToast] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    if (user?.id) {
      discoveryService.getWishlist(user.id)
        .then(items => {
          setWishlistIds(Array.isArray(items) ? items.map(item => item.id) : []);
        })
        .catch(err => console.error("Error loading wishlist IDs:", err));
    } else {
      setWishlistIds([]);
    }
  }, [user]);

  const handleToggleWishlist = async (vehicleId) => {
    if (!user) {
      notify('Please login to add vehicles to your wishlist.', 'info');
      setAuthMode('login');
      setShowAuth(true);
      return;
    }
    if (user.role === 'ADMIN') {
      notify('Administrators cannot wishlist vehicles.', 'warning');
      return;
    }
    const isCurrentlyWishlisted = wishlistIds.includes(vehicleId);
    // Optimistic UI update
    setWishlistIds(prev =>
      isCurrentlyWishlisted
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );

    try {
      const updatedIds = await discoveryService.toggleWishlist(user.id, vehicleId);
      setWishlistIds(Array.isArray(updatedIds) ? updatedIds : []);
      notify(isCurrentlyWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
    } catch (error) {
      // Revert optimistic update
      setWishlistIds(prev =>
        isCurrentlyWishlisted
          ? [...prev, vehicleId]
          : prev.filter(id => id !== vehicleId)
      );
      notify('Failed to update wishlist', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const notify = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleLogin = (userData) => {
    return authApi.login(userData.email, userData.password)
      .then(res => {
        setUser(res.data);
        setShowAuth(false);
        notify('Welcome back, ' + res.data.name + '!', 'success');
        return res.data;
      })
      .catch(err => {
        const fromBody = err.response?.data?.message
          ?? (typeof err.response?.data === 'string' ? err.response.data : null);
        const errorMsg = fromBody
          ?? (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Start the backend on port 8080 and use npm run dev (Vite proxy), or set VITE_API_URL.' : null)
          ?? err.message
          ?? 'Login failed. Please check your credentials.';
        notify(errorMsg, 'error');
        throw err;
      });
  };

  const handleRegister = (userData) => {
    return authApi.register(userData)
      .then(res => {
        setUser(res.data);
        setShowAuth(false);
        notify('Registration successful! Welcome to SmartRide SL.', 'success');
        return res.data;
      })
      .catch(err => {
        const fromBody = err.response?.data?.message
          ?? (typeof err.response?.data === 'string' ? err.response.data : null);
        const errorMsg = fromBody
          ?? (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Start the backend on port 8080 and use npm run dev (Vite proxy), or set VITE_API_URL.' : null)
          ?? err.message
          ?? 'Registration failed. Please try again.';
        notify(errorMsg, 'error');
        throw err;
      });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    notify('Logged out successfully.', 'info');
  };

  const handleBookingClick = (vehicle, navigate) => {
    if (!user) {
      setAuthMode('login');
      setShowAuth(true);
      notify('Please login to book a vehicle.', 'info');
      return;
    }
    setSelectedVehicle(vehicle);
    navigate('/checkout');
  };

  return (
    <Router>
      <AppContent
        user={user}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleLogout={handleLogout}
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        authMode={authMode}
        setMode={setAuthMode}
        selectedVehicle={selectedVehicle}
        handleBookingClick={handleBookingClick}
        toast={toast}
        setToast={setToast}
        notify={notify}
        wishlistIds={wishlistIds}
        handleToggleWishlist={handleToggleWishlist}
      />
    </Router>
  );
};

const AppContent = ({
  user, handleLogin, handleRegister, handleLogout,
  showAuth, setShowAuth, authMode, setAuthMode,
  selectedVehicle, handleBookingClick,
  toast, setToast, notify,
  wishlistIds, handleToggleWishlist
}) => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onLogin={() => { setAuthMode('login'); setShowAuth(true); }}
        onRegister={() => { setAuthMode('register'); setShowAuth(true); }}
        onLogout={() => { handleLogout(); navigate('/'); }}
        notify={notify}
      />

      <Routes>
        {/* Public routes — accessible by all */}
        <Route path="/" element={<HomePage user={user} notify={notify} handleBookingClick={(v) => handleBookingClick(v, navigate)} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />} />
        <Route path="/support" element={<SupportPage user={user} notify={notify} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage notify={notify} />} />
        <Route path="/reset-password" element={<ResetPasswordPage notify={notify} />} />
        <Route path="/feedback" element={<PlatformFeedback user={user} notify={notify} />} />

        {/* Member 1: Discovery & Comparison */}
        <Route path="/search" element={<VehicleSearch notify={notify} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />} />
        <Route path="/vehicle-details" element={<VehicleDetails user={user} notify={notify} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />} />
        <Route path="/compare" element={<CompareVehicles />} />

        {/* Member 4: Info & Education (Public) */}
        <Route path="/safety" element={<SafetyGuidelines />} />
        <Route path="/insurance" element={<InsuranceDetails />} />
        <Route path="/blog" element={<BlogPage />} />

        {/* Member 5: Community & Help (Public) */}
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/forum" element={<CommunityForum />} />
        <Route path="/faq" element={<FaqCenter />} />

        {/* Protected routes — registered users only */}
        <Route path="/profile"  element={user ? <UserProfile user={user} notify={notify} /> : <Navigate to="/" />} />
        <Route path="/bookings" element={user ? <MyBookings user={user} notify={notify} /> : <Navigate to="/" />} />
        <Route path="/checkout" element={user ? <CheckoutPage user={user} vehicle={selectedVehicle} notify={notify} /> : <Navigate to="/" />} />
        <Route path="/my-reviews" element={user ? <MyReviews user={user} notify={notify} /> : <Navigate to="/" />} />

        {/* Member 2: Loyalty & Rewards (Protected) */}
        <Route path="/rewards" element={user ? <RewardsDashboard /> : <Navigate to="/" />} />
        <Route path="/referral" element={user ? <ReferralPage notify={notify} /> : <Navigate to="/" />} />
        <Route path="/wishlist" element={user ? <WishlistPage notify={notify} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} /> : <Navigate to="/" />} />
        <Route path="/wallet" element={user ? <WalletPage user={user} notify={notify} /> : <Navigate to="/" />} />

        {/* Member 3: Booking Logistics (Protected) */}
        <Route path="/booking-success" element={user ? <BookingSuccess user={user} notify={notify} /> : <Navigate to="/" />} />
        <Route path="/invoices" element={user ? <InvoiceHistory /> : <Navigate to="/" />} />
        <Route path="/tracking" element={user ? <LiveTracking /> : <Navigate to="/" />} />

        {/* Member 6: Security & Settings (Protected) */}
        <Route path="/activity" element={user ? <ActivityLogs /> : <Navigate to="/" />} />
        <Route path="/notifications" element={user ? <NotificationSettings notify={notify} /> : <Navigate to="/" />} />
        <Route path="/privacy" element={user ? <AccountPrivacy /> : <Navigate to="/" />} />

        {/* Admin-only route */}
        <Route 
          path="/admin" 
          element={user?.role === 'ADMIN' ? <AdminDashboard notify={notify} /> : <Navigate to="/" />} 
        />
      </Routes>


      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onAuth={authMode === 'login' ? handleLogin : handleRegister}
        setMode={setAuthMode}
      />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <div className="app-footer-grid">

            {/* Brand */}
            <div>
              <h2 className="app-footer-brand-title">
                SmartRide SL
              </h2>
              <p className="app-footer-brand-desc">
                Sri Lanka's vehicle rental platform for bikes, cars, three wheelers, and vans — available when you need it.
              </p>
              <p className="app-footer-brand-areas">
                Service areas: Colombo • Kandy • Galle • Jaffna
              </p>
            </div>

            {/* Discovery */}
            <div>
              <h4 className="app-footer-col-title">Discovery</h4>
              {[
                { label: 'Advanced Search', href: '/search' },
                { label: 'Vehicle Comparison', href: '/compare' },
                { label: 'Travel Blog', href: '/blog' },
                { label: 'Wishlist', href: '/wishlist' },
              ].map(link => (
                <a key={link.label} href={link.href} className="app-footer-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Resources */}
            <div>
              <h4 className="app-footer-col-title">Resources</h4>
              {[
                { label: 'Safety Guidelines', href: '/safety' },
                { label: 'Insurance Details', href: '/insurance' },
                { label: 'FAQ Center', href: '/faq' },
                { label: 'Community Forum', href: '/forum' },
              ].map(link => (
                <a key={link.label} href={link.href} className="app-footer-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Community & Reviews */}
            <div>
              <h4 className="app-footer-col-title">Community</h4>
              {[
                { label: 'User Reviews', href: '/reviews' },
                { label: 'Refer a Friend', href: '/referral' },
                { label: 'Loyalty Rewards', href: '/rewards' },
                { label: 'Live Tracking', href: '/tracking' },
              ].map(link => (
                <a key={link.label} href={link.href} className="app-footer-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Account & Security */}
            <div>
              <h4 className="app-footer-col-title">Account</h4>
              {[
                { label: 'Invoices', href: '/invoices' },
                { label: 'Activity Logs', href: '/activity' },
                { label: 'Notifications', href: '/notifications' },
                { label: 'Privacy Settings', href: '/privacy' },
              ].map(link => (
                <a key={link.label} href={link.href} className="app-footer-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Contact & Social */}
            <div>
              <h4 className="app-footer-col-title">Contact Us</h4>
              <div className="app-footer-contact-info">
                <div>Phone: +94 77 123 4567</div>
                <div>Email: support@smartride.lk</div>
                <div>Hours: Mon–Sat, 8:00 AM – 8:00 PM</div>
              </div>

              {/* Social Links */}
              <div className="app-footer-social-container">
                {[
                  { icon: 'f', label: 'Facebook', href: 'https://facebook.com/smartrideSL', color: '#1877f2' },
                  { icon: 'ig', label: 'Instagram', href: 'https://instagram.com/smartrideSL', color: '#e1306c' },
                  { icon: 'in', label: 'LinkedIn', href: 'https://linkedin.com/company/smartrideSL', color: '#0a66c2' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className="app-footer-social-link"
                    onMouseOver={e => { e.currentTarget.style.background = s.color + '22'; e.currentTarget.style.borderColor = s.color; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="app-footer-bottom-bar">
            <p className="app-footer-copyright">
              © 2024 SmartRide Sri Lanka. All rights reserved. | Group 02 — OOP Project
            </p>
            <p className="app-footer-credit">
              Built with React + Spring Boot
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

