import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaEyeSlash } from 'react-icons/fa';
import { registerUser } from '../services/authService';
import Navbar from '../components/Navbar';
import '../styles/Register.css';

const Register = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    district: '',
    password: '',
    confirmPassword: '',
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Feedback State
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validation Logic
  const validate = () => {
    const newErrors = {};

    if (!formData.fullName || formData.fullName.length < 3) {
      newErrors.fullName = 'Full name must contain at least 3 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Allows Sri Lankan formats like 0771234567 or +94771234567
    const phoneRegex = /^(?:0|\+94)[0-9]{9}$/;
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Sri Lankan phone number (e.g. 0771234567 or +94771234567).';
    }

    if (!formData.address) {
      newErrors.address = 'Address is required.';
    }

    if (!formData.city) {
      newErrors.city = 'City is required.';
    }

    if (!formData.district) {
      newErrors.district = 'District is required.';
    }

    // Password must be >= 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        password: formData.password,
      });

      setSuccessMessage('Account created successfully. Please log in.');
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        city: '',
        district: '',
        password: '',
        confirmPassword: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        // We can pass the email via route state to prefill login form
        navigate('/login', { state: { email: formData.email } });
      }, 2000);
      
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="register-page">
        <div className="register-container">
        
        <div className="register-header">
          <Link to="/" className="register-logo">
            <FaShoppingCart className="logo-icon" />
            <span style={{ lineHeight: '1.1', fontSize: '1.6rem' }}>TNT<br />Supermarket</span>
          </Link>
          <h2>Create Your Account</h2>
          <p>Register to shop and track your orders</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Silva"
                className={errors.fullName ? 'input-error' : ''}
              />
            </div>
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={errors.email ? 'input-error' : ''}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0771234567"
                className={errors.phoneNumber ? 'input-error' : ''}
              />
            </div>
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="address">Address <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street"
                className={errors.address ? 'input-error' : ''}
              />
            </div>
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          {/* City */}
          <div className="form-group">
            <label htmlFor="city">City <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Colombo"
                className={errors.city ? 'input-error' : ''}
              />
            </div>
            {errors.city && <span className="error-message">{errors.city}</span>}
          </div>

          {/* District */}
          <div className="form-group">
            <label htmlFor="district">District <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Colombo"
                className={errors.district ? 'input-error' : ''}
              />
            </div>
            {errors.district && <span className="error-message">{errors.district}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password@123"
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="required-asterisk">*</span></label>
            <div className="input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading || successMessage !== ''}>
            {loading ? (
              <>
                <span className="spinner"></span> Creating...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">Login</Link>
          </p>
        </div>

      </div>
    </div>
    </>
  );
};

export default Register;
