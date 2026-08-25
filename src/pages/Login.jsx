import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaEyeSlash, FaFacebook, FaGoogle } from 'react-icons/fa';
import { loginUser } from '../services/authService';
import '../styles/Register.css'; // Reusing form styles
import '../styles/Login.css';
import Navbar from '../components/Navbar';

const Login = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Feedback State
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Validation Logic
  const validate = () => {
    const newErrors = {};

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Mobile number is required.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
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

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });

      // Assuming login is successful and token is returned
      // navigate('/') based on role, etc.
      // For now, redirect to Home
      navigate('/');
      
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-page">
        <div className="login-container">
        
        <div className="login-header">
          <Link to="/" className="login-logo">
            <FaShoppingCart className="logo-icon" />
            <span style={{ lineHeight: '1.1', fontSize: '1.6rem' }}>TNT<br />Supermarket</span>
          </Link>
          <h2>Welcome Back</h2>
          <p>Login to your account to continue</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form className="login-form register-form" onSubmit={handleSubmit} noValidate>
          
          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Mobile Number <span className="required-asterisk">*</span></label>
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
                placeholder="Enter your password"
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
            <div className="forgot-password">
              <Link to="/forgot-password">Lost your password?</Link>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="social-login-section">
          <p className="social-login-text">Use a social account for faster login or easy registration.</p>
          <div className="social-buttons">
            <button className="social-btn facebook-btn" type="button">
              <FaFacebook className="social-icon" /> Log in with Facebook
            </button>
            <button className="social-btn google-btn" type="button">
              <FaGoogle className="social-icon" /> Log in with Google
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">Sign up</Link>
          </p>
        </div>

      </div>
    </div>
    </>
  );
};

export default Login;
