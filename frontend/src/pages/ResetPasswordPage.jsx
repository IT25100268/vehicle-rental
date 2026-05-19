import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/index.jsx';
import './ResetPasswordPage.css';

/**
 * ResetPasswordPage — allows users to set a new password using a reset token.
 *
 * The reset token is passed via URL query parameter: /reset-password?token=<uuid>
 *
 * Validation Rules:
 *   - New password: 6-12 characters, at least 1 letter AND 1 number
 *   - Confirm password must match new password
 *
 * Route: /reset-password?token=<uuid>
 */
const ResetPasswordPage = ({ notify }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      notify('Invalid reset link. Please request a new one.', 'error');
      navigate('/forgot-password');
    }
  }, [token, navigate, notify]);

  const validatePassword = (pwd) => {
    if (!pwd) return 'Password is required.';
    if (pwd.length < 6) return 'Password must be at least 6 characters.';
    if (pwd.length > 12) return 'Password must not exceed 12 characters.';
    if (!/[a-zA-Z]/.test(pwd)) return 'Password must contain at least one letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
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

  const validate = () => {
    const newErrors = {};
    const pwdError = validatePassword(formData.newPassword);
    if (pwdError) newErrors.newPassword = pwdError;
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.resetPassword(token, formData.newPassword);
      setSuccess(true);
      notify('Password reset successfully! Please login.', 'success');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const msg = err.response?.data || 'Failed to reset password.';
      notify(msg, 'error');
      setErrors({ newPassword: msg });
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.newPassword);

  const fieldStyle = (hasError) => `${hasError ? 'reset-input-error' : 'reset-input-normal'}`;

  return (
    <div className="container reset-container page-with-navbar-spacing">
      <div className="reset-glass">
        <div className="reset-header">
          <div className="reset-icon">🔑</div>
          <h1 className="reset-title">
            Reset Password
          </h1>
          <p className="reset-subtitle">
            Choose a strong new password for your account.
          </p>
        </div>

        {success ? (
          <div className="reset-success-container">
            <div className="reset-success-icon">✅</div>
            <p className="reset-success-title">Password Reset!</p>
            <p className="reset-success-subtitle">
              Redirecting to home page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">

            {/* ── Password Rules hint ── */}
            <div className="reset-rules-container">
              <strong className="reset-rules-title">Password Rules:</strong>
              <ul className="reset-rules-list">
                <li>6 to 12 characters long</li>
                <li>At least one letter (a-z or A-Z)</li>
                <li>At least one number (0-9)</li>
              </ul>
            </div>

            {/* ── New Password ── */}
            <div>
              <label className="reset-label">
                New Password
              </label>
              <input
                id="reset-new-password"
                type="password"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => { setFormData({ ...formData, newPassword: e.target.value }); if (errors.newPassword) setErrors({ ...errors, newPassword: '' }); }}
                className={`reset-input ${fieldStyle(errors.newPassword)}`}
              />
              {errors.newPassword && <span className="reset-error-msg">⚠ {errors.newPassword}</span>}
              {formData.newPassword && strength && !errors.newPassword && (
                <div className="reset-strength-container">
                  <div className="reset-strength-header">
                    <span>Strength</span>
                    <span className={`${strength.classPrefix}-color fw-bold`}>{strength.label}</span>
                  </div>
                  <div className="reset-strength-bar-bg">
                    <div className={`reset-strength-bar-fill ${strength.classPrefix}-bg`} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Confirm Password ── */}
            <div>
              <label className="reset-label">
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                className={`reset-input ${fieldStyle(errors.confirmPassword)}`}
              />
              {errors.confirmPassword && <span className="reset-error-msg">⚠ {errors.confirmPassword}</span>}
              {!errors.confirmPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <span className="reset-success-msg">✓ Passwords match</span>
              )}
            </div>

            <button
              type="submit"
              id="reset-submit-btn"
              disabled={loading}
              className={`reset-btn ${loading ? 'reset-btn-loading' : 'reset-btn-normal'}`}
            >
              {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
