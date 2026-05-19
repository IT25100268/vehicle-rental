import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/index.jsx';
import notificationService from '../services/notificationService';
import './CheckoutPage.css';

/**
 * CheckoutPage — secure booking checkout with hourly and daily rental modes.
 *
 * Features:
 *   - Toggle between HOURLY and DAILY rental mode
 *   - Real-time price calculation per vehicle type (LKR)
 *   - Sri Lanka pricing:
 *       Bike:         LKR 350/hr  | LKR 2,500/day
 *       ThreeWheeler: LKR 500/hr  | LKR 3,500/day
 *       Car:          LKR 900/hr  | LKR 5,500/day
 *       Van:          LKR 1,400/hr| LKR 9,000/day
 *   - 10% cancellation policy notice
 *   - NIC + phone validation for Sri Lanka
 *   - Payment info form
 *
 * Access: Registered users only (redirected if no vehicle selected)
 */

const PRICING = {
  Bike:         { hourly: 350,  daily: 2500  },
  ThreeWheeler: { hourly: 500,  daily: 3500  },
  Car:          { hourly: 900,  daily: 5500  },
  Van:          { hourly: 1400, daily: 9000  },
};

const getPricing = (type) => PRICING[type] || PRICING['Car'];

const CheckoutPage = ({ user, vehicle, notify }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rentalMode, setRentalMode] = useState('DAILY'); // 'DAILY' | 'HOURLY'

  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' | 'COD'

  // Date & time state
  const todayStr = new Date().toISOString().split('T')[0];
  const [dates, setDates] = useState(() => ({
    start: todayStr,
    end: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  }));
  const [hours, setHours] = useState(4); // default 4 hours for hourly mode

  // Customer details state
  const [formData, setFormData] = useState({
    phoneNumber: user?.mobile || '',
    nic: user?.nic || '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!vehicle) navigate('/');
  }, [vehicle, navigate]);

  if (!vehicle || !user) return null;

  const pricing = getPricing(vehicle.type);

  // ─── Price Calculation ────────────────────────────────────────────────────
  const calculateDays = () => {
    const d1 = new Date(dates.start);
    const d2 = new Date(dates.end);
    const diff = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const bookingDays  = rentalMode === 'DAILY' ? calculateDays() : 0;
  const baseAmt      = rentalMode === 'DAILY' ? pricing.daily * bookingDays : pricing.hourly * hours;
  const deliveryFee  = formData.address ? 500 : 0; // LKR 500 delivery within city
  const finalTotal   = baseAmt + deliveryFee;
  const cancelFee    = Math.round(finalTotal * 0.1);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};

    // Sri Lankan phone number: starts 07x or +947x
    if (!/^(?:\+94|0)7[0-9]{8}$/.test(formData.phoneNumber))
      e.phoneNumber = 'Invalid Sri Lankan phone number (e.g. 0771234567).';

    // Sri Lankan NIC: 9 digits + V/X   OR  12 digits
    if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(formData.nic))
      e.nic = 'Invalid NIC — enter 9 digits + V/X or 12 digits.';

    if (paymentMethod === 'ONLINE') {
      // Card: 16 digits
      const cleanCard = formData.cardNumber.replace(/\s/g, '');
      if (!/^[0-9]{16}$/.test(cleanCard)) e.cardNumber = 'Card must be 16 digits.';

      // Expiry: MM/YY
      if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.expiryDate))
        e.expiryDate = 'Use MM/YY format.';

      // CVV: 3 digits
      if (!/^[0-9]{3}$/.test(formData.cvv)) e.cvv = '3-digit CVV required.';
    }

    // Date validation (daily mode only)
    if (rentalMode === 'DAILY' && new Date(dates.end) <= new Date(dates.start))
      e.dates = 'Return date must be after pick-up date.';

    setErrors(e);
    if (Object.keys(e).length > 0) notify('Please correct the form errors.', 'error');
    return Object.keys(e).length === 0;
  };

  const confirmBooking = () => {
    if (!validateForm()) return;
    setLoading(true);

    const bookingData = {
      userId:       user.id,
      userName:     user.name,
      userEmail:    user.email,
      vehicleId:    vehicle.id,
      vehicleName:  `${vehicle.make} ${vehicle.model}`,
      vehiclePhoto: vehicle.photos?.[0] || '',
      vehicleType:  vehicle.type,
      rentalMode,
      bookingDays:  rentalMode === 'DAILY'  ? bookingDays : 0,
      bookingHours: rentalMode === 'HOURLY' ? hours       : 0,
      totalPrice:   finalTotal,
      startDate:    dates.start,
      endDate:      rentalMode === 'DAILY' ? dates.end : dates.start,
      paymentMethod,
      paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
      status:       'CONFIRMED'
    };

    bookingApi.create(bookingData)
      .then(async (savedBooking) => {
        notify(`Booking confirmed! Drive safe! 🚗`, 'success');
        try {
          await Promise.all([
            notificationService.createNotification({
              type: 'booking_confirmed',
              title: 'Booking Confirmed!',
              message: `Your booking for ${vehicle.make} ${vehicle.model} has been confirmed successfully.`,
              userId: user.id,
            }),
            notificationService.createNotification({
              type: 'payment',
              title: 'Payment Status Updated',
              message: paymentMethod === 'ONLINE'
                ? `Payment of LKR ${finalTotal.toLocaleString()} for your booking was successful.`
                : `Your payment of LKR ${finalTotal.toLocaleString()} is pending (Pay at Pickup).`,
              userId: user.id,
            }),
          ]);
        } catch {
          /* optional */
        }
        navigate('/booking-success', { state: { booking: savedBooking } });
      })
      .catch(err => notify(err.response?.data?.message || 'Booking failed. Please try again.', 'error'))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'cardNumber') {
      val = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ─── Shared Styles ────────────────────────────────────────────────────────
  const fieldStyle = (err) => `checkout-input ${err ? 'checkout-input-error' : 'checkout-input-normal'}`;

  const isDateInvalid = rentalMode === 'DAILY' && new Date(dates.end) <= new Date(dates.start);

  return (
    <div className="container animate-in checkout-container page-with-navbar-spacing">
      <div className="checkout-grid">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LEFT COLUMN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div>
          <h1 className="checkout-header">🔐 Secure Checkout</h1>
          <p className="checkout-subtitle">
            Complete your booking for <strong className="checkout-vehicle-name">{vehicle.make} {vehicle.model}</strong>
          </p>

          <div className="glass checkout-form-container">

            {/* ── Step 1: Rental Mode + Period ── */}
            <section>
              <h3 className="checkout-section-title">
                <span className="checkout-step-badge">1</span> Rental Period
              </h3>

              {/* Mode Selector */}
              <div className="checkout-mode-container">
                {['DAILY', 'HOURLY'].map(mode => (
                  <button key={mode} onClick={() => setRentalMode(mode)}
                    className={`checkout-mode-btn ${rentalMode === mode ? 'checkout-mode-btn-active' : 'checkout-mode-btn-inactive'}`}>
                    {mode === 'DAILY' ? '📅 Daily' : '⏱ Hourly'}
                    <div className={`checkout-mode-desc ${rentalMode === mode ? 'checkout-mode-desc-active' : 'checkout-mode-desc-inactive'}`}>
                      {mode === 'DAILY' ? `LKR ${pricing.daily.toLocaleString()}/day` : `LKR ${pricing.hourly.toLocaleString()}/hr`}
                    </div>
                  </button>
                ))}
              </div>

              {/* Daily: date pickers */}
              {rentalMode === 'DAILY' ? (
                <div>
                  <div className="checkout-date-row">
                    <div>
                      <label className="checkout-label">Pick-up Date</label>
                      <input type="date" min={todayStr} value={dates.start}
                        onChange={e => setDates({ ...dates, start: e.target.value })}
                        className={fieldStyle(false)} />
                    </div>
                    <div>
                      <label className="checkout-label">Return Date</label>
                      <input type="date" min={dates.start} value={dates.end}
                        onChange={e => setDates({ ...dates, end: e.target.value })}
                        className={fieldStyle(isDateInvalid)} />
                    </div>
                  </div>
                  {isDateInvalid && <span className="checkout-error-msg">⚠ Return date must be after pick-up date.</span>}
                  {!isDateInvalid && <div className="checkout-duration-hint">Duration: {bookingDays} day{bookingDays !== 1 ? 's' : ''}</div>}
                </div>
              ) : (
                /* Hourly: date + hour picker */
                <div>
                  <div className="checkout-date-row">
                    <div>
                      <label className="checkout-label">Rental Date</label>
                      <input type="date" min={todayStr} value={dates.start}
                        onChange={e => setDates({ ...dates, start: e.target.value })}
                        className={fieldStyle(false)} />
                    </div>
                    <div>
                      <label className="checkout-label">Number of Hours</label>
                      <select value={hours} onChange={e => setHours(parseInt(e.target.value))} className={fieldStyle(false)}>
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24].map(h => (
                          <option key={h} value={h} className="checkout-hourly-option">
                            {h} hour{h !== 1 ? 's' : ''} — LKR {(pricing.hourly * h).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ── Step 2: Personal Details ── */}
            <section>
              <h3 className="checkout-section-title">
                <span className="checkout-step-badge">2</span> Personal Details
              </h3>
              <div className="checkout-personal-details">
                <div className="checkout-date-row">
                  <div>
                    <label className="checkout-label">Phone Number</label>
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange}
                      placeholder="0771234567" className={fieldStyle(errors.phoneNumber)} />
                    {errors.phoneNumber && <span className="checkout-error-msg">⚠ {errors.phoneNumber}</span>}
                  </div>
                  <div>
                    <label className="checkout-label">NIC Number</label>
                    <input name="nic" value={formData.nic} onChange={handleInputChange}
                      placeholder="991234567V or 199912345678" className={fieldStyle(errors.nic)} />
                    {errors.nic && <span className="checkout-error-msg">⚠ {errors.nic}</span>}
                  </div>
                </div>
                <div>
                  <label className="checkout-label">Delivery Address (Optional — LKR 500)</label>
                  <input name="address" value={formData.address} onChange={handleInputChange}
                    placeholder="Enter address for vehicle delivery (within city)" className={fieldStyle(false)} />
                </div>
              </div>
            </section>

            {/* ── Step 3: Payment ── */}
            <section>
              <h3 className="checkout-section-title">
                <span className="checkout-step-badge">3</span> Payment Method
              </h3>
              
              <div className="checkout-mode-container">
                <button 
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`checkout-mode-btn ${paymentMethod === 'ONLINE' ? 'checkout-mode-btn-active' : 'checkout-mode-btn-inactive'}`}
                >
                  💳 Online Card
                  <div className={`checkout-mode-desc ${paymentMethod === 'ONLINE' ? 'checkout-mode-desc-active' : 'checkout-mode-desc-inactive'}`}>
                    Secure Payment
                  </div>
                </button>
                <button 
                  onClick={() => setPaymentMethod('COD')}
                  className={`checkout-mode-btn ${paymentMethod === 'COD' ? 'checkout-mode-btn-active' : 'checkout-mode-btn-inactive'}`}
                >
                  💵 Pay at Pickup
                  <div className={`checkout-mode-desc ${paymentMethod === 'COD' ? 'checkout-mode-desc-active' : 'checkout-mode-desc-inactive'}`}>
                    Cash on Delivery
                  </div>
                </button>
              </div>

              {paymentMethod === 'ONLINE' ? (
                <div className="checkout-personal-details animate-in">
                  <div>
                    <label className="checkout-label">Card Number</label>
                    <input name="cardNumber" value={formData.cardNumber} onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456" maxLength={19} className={fieldStyle(errors.cardNumber)} />
                    {errors.cardNumber && <span className="checkout-error-msg">⚠ {errors.cardNumber}</span>}
                  </div>
                  <div className="checkout-date-row">
                    <div>
                      <label className="checkout-label">Expiry Date</label>
                      <input name="expiryDate" value={formData.expiryDate} onChange={handleInputChange}
                        placeholder="MM/YY" maxLength={5} className={fieldStyle(errors.expiryDate)} />
                      {errors.expiryDate && <span className="checkout-error-msg">⚠ {errors.expiryDate}</span>}
                    </div>
                    <div>
                      <label className="checkout-label">CVV</label>
                      <input name="cvv" type="password" value={formData.cvv} onChange={handleInputChange}
                        placeholder="•••" maxLength={3} className={fieldStyle(errors.cvv)} />
                      {errors.cvv && <span className="checkout-error-msg">⚠ {errors.cvv}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="checkout-cod-info animate-in">
                  <div className="checkout-cod-icon">📍</div>
                  <p>Payment will be collected when receiving the vehicle.</p>
                </div>
              )}
            </section>

            {/* ── Cancellation Policy Notice ── */}
            <div className="checkout-cancellation">
              <strong className="checkout-cancellation-title">⚠ Cancellation Policy:</strong>{' '}
              A <strong>10% cancellation fee (LKR {cancelFee.toLocaleString()})</strong> applies if this booking is cancelled after confirmation. Net refund: LKR {(finalTotal - cancelFee).toLocaleString()}.
            </div>

            {/* ── Confirm Button ── */}
            <button
              id="checkout-confirm-btn"
              onClick={confirmBooking}
              disabled={loading || isDateInvalid}
              className={`checkout-confirm-btn ${loading || isDateInvalid ? 'checkout-confirm-btn-loading' : 'checkout-confirm-btn-normal'}`}
            >
              {loading 
                ? '⏳ Processing...' 
                : isDateInvalid 
                  ? '⚠ Fix Rental Dates' 
                  : paymentMethod === 'ONLINE' 
                    ? `✅ Pay LKR ${finalTotal.toLocaleString()} & Confirm` 
                    : `✅ Confirm Booking (LKR ${finalTotal.toLocaleString()})`
              }
            </button>
            <div className="checkout-secure-footer">
              🔒 Secured checkout — your payment info is encrypted.
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RIGHT SIDEBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside className="checkout-sidebar">
          <div className="glass checkout-sidebar-glass">
            <img
              src={vehicle.photos?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'}
              alt={vehicle.make}
              className="checkout-sidebar-image"
            />
            <div className="checkout-sidebar-content">
              <h2 className="checkout-sidebar-title">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="checkout-sidebar-subtitle">
                {vehicle.type} • 📍 {vehicle.location} • {vehicle.year}
              </p>

              {/* Pricing breakdown */}
              <div className="checkout-pricing-list">

                {rentalMode === 'DAILY' ? (
                  <>
                    <div className="checkout-pricing-row">
                      <span className="checkout-pricing-label">Daily Rate</span>
                      <span>LKR {pricing.daily.toLocaleString()}</span>
                    </div>
                    <div className="checkout-pricing-row">
                      <span className="checkout-pricing-label">Duration</span>
                      <span>{bookingDays} day{bookingDays !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="checkout-pricing-row">
                      <span className="checkout-pricing-label">Subtotal</span>
                      <span>LKR {(pricing.daily * bookingDays).toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="checkout-pricing-row">
                      <span className="checkout-pricing-label">Hourly Rate</span>
                      <span>LKR {pricing.hourly.toLocaleString()}/hr</span>
                    </div>
                    <div className="checkout-pricing-row">
                      <span className="checkout-pricing-label">Duration</span>
                      <span>{hours} hour{hours !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="checkout-pricing-row">
                      <span className="checkout-pricing-label">Subtotal</span>
                      <span>LKR {(pricing.hourly * hours).toLocaleString()}</span>
                    </div>
                  </>
                )}

                {formData.address && (
                  <div className="checkout-delivery-row">
                    <span>🚚 Delivery Fee</span>
                    <span>LKR 500</span>
                  </div>
                )}

                <div className="checkout-divider" />

                <div className="checkout-total-row">
                  <span>Total</span>
                  <span key={finalTotal} className="checkout-total-value price-updated">LKR {finalTotal.toLocaleString()}</span>
                </div>

                <div className="checkout-cancel-fee-row">
                  <span>Cancellation fee (10%)</span>
                  <span>LKR {cancelFee.toLocaleString()}</span>
                </div>
              </div>

              {/* Rate comparison box */}
              <div className="checkout-comparison-box">
                <div className="checkout-comparison-title">Available Rates</div>
                <div className="checkout-comparison-row">
                  <span>⏱ Hourly</span>
                  <span className={`checkout-comparison-value ${rentalMode === 'HOURLY' ? 'checkout-comparison-value-active' : 'checkout-comparison-value-inactive'}`}>LKR {pricing.hourly.toLocaleString()}/hr</span>
                </div>
                <div className="checkout-comparison-row checkout-comparison-row-margin">
                  <span>📅 Daily</span>
                  <span className={`checkout-comparison-value ${rentalMode === 'DAILY' ? 'checkout-comparison-value-active' : 'checkout-comparison-value-inactive'}`}>LKR {pricing.daily.toLocaleString()}/day</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default CheckoutPage;
