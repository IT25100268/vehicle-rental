import React, { useState } from 'react';
import { authApi, userApi } from '../api/index.jsx';
import './UserProfile.css';

/**
 * UserProfile — shows account details and allows profile + password management.
 *
 * Features:
 *   1. View/Edit profile info (name, mobile, address, NIC)
 *   2. Change Password — requires old password verification
 *      Validation: 6-12 chars, at least 1 letter + 1 number (matching SecurityUtil)
 *
 * CRUD: Update (own data only — User role)
 */
const UserProfile = ({ user, notify }) => {
  const [profile, setProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // 'info' | 'password'

  // Password change state
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  // ─── Validation ────────────────────────────────────────────────────────────

  const validatePassword = (pwd) => {
    if (!pwd) return 'Password is required.';
    if (pwd.length < 6) return 'Password must be at least 6 characters.';
    if (pwd.length > 12) return 'Password must not exceed 12 characters.';
    if (!/[a-zA-Z]/.test(pwd)) return 'Must contain at least one letter.';
    if (!/[0-9]/.test(pwd)) return 'Must contain at least one number.';
    return '';
  };

  const getPasswordStrength = (password) => {
    if (!password) return null;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const len = password.length;
    if (len < 6) return { label: 'Too Short', classPrefix: 'strength-short' };
    if (len >= 8 && hasLetter && hasDigit && hasSpecial) return { label: 'Strong', classPrefix: 'strength-strong' };
    if (len >= 6 && hasLetter && hasDigit) return { label: 'Good', classPrefix: 'strength-good' };
    return { label: 'Fair', classPrefix: 'strength-fair' };
  };

  // ─── Profile Update ────────────────────────────────────────────────────────

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await userApi.update(user.id || user.email, profile);
      // We should ideally update the global user state here too, but for now we follow the flow
      notify('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      notify('Failed to update profile.', 'error');
    }
  };

  // ─── Change Password ───────────────────────────────────────────────────────

  const handleChangePassword = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!pwdForm.old) newErrors.old = 'Current password is required.';

    const newPwdErr = validatePassword(pwdForm.new);
    if (newPwdErr) newErrors.new = newPwdErr;

    if (!pwdForm.confirm) {
      newErrors.confirm = 'Please confirm your new password.';
    } else if (pwdForm.new !== pwdForm.confirm) {
      newErrors.confirm = 'Passwords do not match.';
    }

    setPwdErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setPwdLoading(true);
    authApi.changePassword(user.id, pwdForm.old, pwdForm.new)
      .then(() => {
        setPwdForm({ old: '', new: '', confirm: '' });
        setPwdErrors({});
        notify('Password changed successfully!', 'success');
      })
      .catch(err => {
        const msg = err.response?.data || 'Error changing password.';
        notify(msg, 'error');
        setPwdErrors({ old: msg });
      })
      .finally(() => setPwdLoading(false));
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const fieldStyle = (hasError) => `user-profile-input ${hasError ? 'user-profile-input-error' : 'user-profile-input-normal'}`;

  const tabBtn = (id) => `user-profile-tab-btn ${activeSection === id ? 'user-profile-tab-active' : 'user-profile-tab-inactive'}`;

  const strength = getPasswordStrength(pwdForm.new);

  return (
    <div className="container animate-in user-profile-container page-with-navbar-spacing">
      <div className="user-profile-wrapper">

        {/* ── Profile Header ── */}
        <div className="glass user-profile-header">
          <div className="user-profile-avatar">
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="user-profile-name">{profile.name}</h2>
          <div className="user-profile-email">{profile.email}</div>
          <div className={`user-profile-role-badge ${profile.role === 'ADMIN' ? 'user-profile-role-admin' : 'user-profile-role-member'}`}>
            {profile.role === 'ADMIN' ? '🛡 Administrator' : '👤 Member'}
          </div>
          {profile.role !== 'ADMIN' && (
            <div className="user-profile-shortcuts" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                className="user-profile-reviews-shortcut"
                onClick={() => window.location.href = '/my-reviews'}
              >
                ⭐ View My Reviews
              </button>
              <button 
                className="user-profile-reviews-shortcut wallet-shortcut"
                onClick={() => window.location.href = '/wallet'}
              >
                💳 View My Wallet
              </button>
            </div>
          )}
        </div>

        {/* ── Tab Switcher ── */}
        <div className="user-profile-tabs">
          <button className={tabBtn('info')} onClick={() => setActiveSection('info')}>
            👤 Profile Info
          </button>
          <button className={tabBtn('password')} onClick={() => setActiveSection('password')}>
            🔒 Change Password
          </button>
        </div>

        {/* ── Profile Info Section ── */}
        {activeSection === 'info' && (
          <div className="glass user-profile-section">
            <div className="user-profile-section-header">
              <h3 className="user-profile-section-title">Account Details</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="user-profile-edit-btn"
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="user-profile-form">
                <div className="user-profile-form-row">
                  <div>
                    <label className="user-profile-label">Full Name</label>
                    <input
                      className={fieldStyle(false)} type="text"
                      value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Full Name" required
                    />
                  </div>
                  <div>
                    <label className="user-profile-label">Mobile Number</label>
                    <input
                      className={fieldStyle(false)} type="text"
                      value={profile.mobile || ''} onChange={e => setProfile({ ...profile, mobile: e.target.value })}
                      placeholder="e.g. 0771234567"
                    />
                  </div>
                </div>
                <div>
                  <label className="user-profile-label">Address</label>
                  <input
                    className={fieldStyle(false)} type="text"
                    value={profile.address || ''} onChange={e => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Your address"
                  />
                </div>
                <div>
                  <label className="user-profile-label">NIC Number</label>
                  <input
                    className={fieldStyle(false)} type="text"
                    value={profile.nic || ''} onChange={e => setProfile({ ...profile, nic: e.target.value })}
                    placeholder="e.g. 991234567V or 199912345678"
                  />
                </div>
                <div className="user-profile-form-actions">
                  <button type="submit" className="user-profile-save-btn">
                    ✅ Save Changes
                  </button>
                  <button type="button" onClick={() => { setIsEditing(false); setProfile(user); }} className="user-profile-cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="user-profile-info-list">
                {[
                  { label: 'Full Name', value: profile.name, icon: '👤' },
                  { label: 'Email Address', value: profile.email, icon: '📧' },
                  { label: 'Mobile Number', value: profile.mobile || 'Not set', icon: '📱' },
                  { label: 'Address', value: profile.address || 'Not set', icon: '📍' },
                  { label: 'NIC Number', value: profile.nic || 'Not set', icon: '🪪' },
                  { label: 'Account Role', value: profile.role, icon: '🛡' },
                ].map(item => (
                  <div key={item.label} className="user-profile-info-item">
                    <span className="user-profile-info-icon">{item.icon}</span>
                    <div>
                      <div className="user-profile-info-label">{item.label}</div>
                      <div className="user-profile-info-value">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Change Password Section ── */}
        {activeSection === 'password' && (
          <div className="glass user-profile-section">
            <h3 className="user-profile-section-title">🔒 Change Password</h3>
            <p className="user-profile-pwd-desc">
              Your current password is required to confirm changes.
            </p>

            {/* Password rules reminder */}
            <div className="user-profile-pwd-rules">
              <strong className="user-profile-pwd-rules-title">Password Rules:</strong>{' '}
              6 to 12 characters • At least 1 letter (a-z/A-Z) • At least 1 number (0-9)
            </div>

            <form onSubmit={handleChangePassword} className="user-profile-pwd-form">

              {/* Old Password */}
              <div>
                <label className="user-profile-label">Current Password</label>
                <input
                  id="profile-old-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={pwdForm.old}
                  onChange={e => { setPwdForm({ ...pwdForm, old: e.target.value }); if (pwdErrors.old) setPwdErrors({ ...pwdErrors, old: '' }); }}
                  className={fieldStyle(!!pwdErrors.old)}
                />
                {pwdErrors.old && <span className="user-profile-error-msg">⚠ {pwdErrors.old}</span>}
              </div>

              {/* New Password */}
              <div>
                <label className="user-profile-label">New Password</label>
                <input
                  id="profile-new-password"
                  type="password"
                  placeholder="6-12 characters, letters & numbers"
                  value={pwdForm.new}
                  onChange={e => { setPwdForm({ ...pwdForm, new: e.target.value }); if (pwdErrors.new) setPwdErrors({ ...pwdErrors, new: '' }); }}
                  className={fieldStyle(!!pwdErrors.new)}
                />
                {pwdErrors.new && <span className="user-profile-error-msg">⚠ {pwdErrors.new}</span>}
                {pwdForm.new && strength && !pwdErrors.new && (
                  <div className="user-profile-strength-container">
                    <div className="user-profile-strength-header">
                      <span>Strength</span>
                      <span className={`${strength.classPrefix}-color fw-bold`}>{strength.label}</span>
                    </div>
                    <div className="user-profile-strength-bar-bg">
                      <div className={`user-profile-strength-bar-fill ${strength.classPrefix}-bg`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="user-profile-label">Confirm New Password</label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={pwdForm.confirm}
                  onChange={e => { setPwdForm({ ...pwdForm, confirm: e.target.value }); if (pwdErrors.confirm) setPwdErrors({ ...pwdErrors, confirm: '' }); }}
                  className={fieldStyle(!!pwdErrors.confirm)}
                />
                {pwdErrors.confirm && <span className="user-profile-error-msg">⚠ {pwdErrors.confirm}</span>}
                {!pwdErrors.confirm && pwdForm.confirm && pwdForm.new === pwdForm.confirm && (
                  <span className="user-profile-pwd-success">✓ Passwords match</span>
                )}
              </div>

              <button
                type="submit"
                id="profile-change-pwd-btn"
                disabled={pwdLoading}
                className={`user-profile-change-pwd-btn ${pwdLoading ? 'user-profile-change-pwd-btn-loading' : 'user-profile-change-pwd-btn-normal'}`}
              >
                {pwdLoading ? '⏳ Updating...' : '🔐 Update Password'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfile;
