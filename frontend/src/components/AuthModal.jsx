import React, { useState, useRef } from 'react';
import Modal from './Modal.jsx';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, mode, onAuth, setMode }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setErrors({});
    setServerError(null);
    setIsLoading(false);
  };

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const validateEmail = (email) => {
    if (!email || email.trim() === '') return 'Email is required.';
    // Accept general valid email addresses (not restricted to gmail.com)
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password.length > 12) return 'Password must not exceed 12 characters.';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    return null;
  };

  const getPasswordStrength = (password) => {
    if (!password) return null;

    const len = password.length;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (len < 6) return { label: 'Too Short', classPrefix: 'strength-short' };
    if (len >= 8 && hasLetter && hasDigit && hasSpecial) {
      return { label: 'Strong', classPrefix: 'strength-strong' };
    }
    if (len >= 6 && hasLetter && hasDigit) {
      return { label: 'Good', classPrefix: 'strength-good' };
    }

    return { label: 'Fair', classPrefix: 'strength-fair' };
  };

  const validate = () => {
    const newErrors = {};

    if (mode === 'register' && !formData.name.trim()) {
      newErrors.name = 'Full Name is required.';
    }

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      // focus first invalid field
      if (errors.name && nameRef.current) {
        nameRef.current.focus();
      } else if (errors.email && emailRef.current) {
        emailRef.current.focus();
      } else if (errors.password && passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }

    setServerError(null);
    setIsLoading(true);

    try {
      await onAuth({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ...(mode === 'register' ? { type: 'Customer', role: 'USER' } : {}),
      });

      resetForm();
      onClose();
    } catch (err) {
      // Prefer server-provided message when available, with defensive fallback for string response bodies
      const serverMsg = err?.response?.data?.message 
        || (typeof err?.response?.data === 'string' ? err.response.data : null)
        || err?.message 
        || (typeof err === 'string' ? err : null);

      if (serverMsg && typeof serverMsg === 'string') {
        const lower = serverMsg.toLowerCase();
        if (lower.includes('email')) {
          setErrors(prev => ({ ...prev, email: serverMsg }));
        } else if (lower.includes('password')) {
          setErrors(prev => ({ ...prev, password: serverMsg }));
        } else {
          setServerError(serverMsg);
        }
      } else {
        setServerError('Login/Register failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeSwitch = () => {
    resetForm();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const strength = getPasswordStrength(formData.password);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'login' ? 'Sign in' : 'Create your account'}
    >
      <form
        onSubmit={handleSubmit}
        className="auth-form"
      >
        {serverError && (
          <div className="auth-server-error">
            ⚠ {serverError}
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label htmlFor="auth-name" className="auth-label">
              Full Name
            </label>
            <input
              type="text"
              id="auth-name"
              placeholder="e.g. Kamal Perera"
              value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setServerError(null);
                    setErrors(prev => ({ ...prev, name: null }));
                  }}
                  ref={nameRef}
              className={`auth-input ${errors.name ? 'has-error' : ''} ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            />
            {errors.name && <span className="auth-error-text">⚠ {errors.name}</span>}
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="auth-label">
            Email Address
          </label>
          <input
            type="email"
            id="auth-email"
            placeholder="yourname@gmail.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              setServerError(null);
              setErrors(prev => ({ ...prev, email: null }));
            }}
            ref={emailRef}
            className={`auth-input ${errors.email ? 'has-error' : ''} ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          />
          {errors.email && <span className="auth-error-text">⚠ {errors.email}</span>}
          {!errors.email && (
            <span className="auth-hint-text">
              We'll use this email for account communication
            </span>
          )}
        </div>

        <div>
          <label htmlFor="auth-password" className="auth-label">
            Password
          </label>
          <input
            type="password"
            id="auth-password"
            placeholder="6-12 characters, letters & numbers"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setServerError(null);
              setErrors(prev => ({ ...prev, password: null }));
            }}
            ref={passwordRef}
            className={`auth-input ${errors.password ? 'has-error' : ''} ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          />

          {errors.password && (
            <span className="auth-error-text">⚠ {errors.password}</span>
          )}

          {mode === 'register' && formData.password && strength && !errors.password && (
            <div className="auth-strength-container">
              <div className="auth-strength-header">
                <span>Password Strength</span>
                <span className={`${strength.classPrefix}-color fw-bold`}>
                  {strength.label}
                </span>
              </div>

              <div className="auth-strength-bar-bg">
                <div
                  className={`auth-strength-bar-fill ${strength.classPrefix}-bg`}
                />
              </div>
            </div>
          )}

          {mode === 'register' && !errors.password && (
            <span className="auth-hint-text">
              6-12 characters • At least 1 letter and 1 number
            </span>
          )}
        </div>

        {mode === 'login' && (
          <div className="auth-forgot-password-container">
            <a
              href="/forgot-password"
              className="auth-forgot-password-link"
            >
              Forgot Password?
            </a>
          </div>
        )}

        <button
          type="submit"
          id="auth-submit-btn"
          disabled={isLoading}
          className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
        >
          {isLoading
            ? mode === 'login'
              ? 'Signing in...'
              : 'Creating account...'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </button>

        <p className="auth-footer-text">
          {mode === 'login'
            ? 'New to SmartRide SL?'
            : 'Already have an account?'}{' '}
          <span
            onClick={handleModeSwitch}
            className="auth-footer-link"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </span>
        </p>
      </form>
    </Modal>
  );
};

export default AuthModal;