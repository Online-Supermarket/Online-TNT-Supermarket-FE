import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const extractErrorMessage = (err) => {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    if (status === 409) {
      return 'An account with this email already exists. Please sign in or use a different email.';
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim();
    }

    if (payload && typeof payload === 'object') {
      // 1. Extract specific validation errors from ASP.NET / FluentValidation
      if (payload.errors) {
        if (Array.isArray(payload.errors) && payload.errors.length > 0) {
          return payload.errors.filter(Boolean).join(' ');
        }
        if (typeof payload.errors === 'object') {
          const errorList = Object.values(payload.errors).flat().filter(Boolean);
          if (errorList.length > 0) {
            return errorList.join(' ');
          }
        }
      }

      // 2. Extract problem details detail
      if (payload.detail && typeof payload.detail === 'string' && payload.detail.trim()) {
        return payload.detail.trim();
      }

      // 3. Extract custom message
      if (payload.message && typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message.trim();
      }

      // 4. Extract title if not generic validation message
      if (
        payload.title &&
        typeof payload.title === 'string' &&
        payload.title.trim() &&
        !payload.title.toLowerCase().includes('validation error')
      ) {
        return payload.title.trim();
      }
    }

    return 'Unable to create account. Please ensure all fields are filled out correctly.';
  };

  async function submit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const d = Object.fromEntries(formData);

    const firstName = (d.firstName || '').trim();
    const lastName = (d.lastName || '').trim();
    const email = (d.email || '').trim();
    const phone = (d.phone || '').trim();
    const password = d.password || '';
    const confirm = d.confirm || '';
    const address = (d.address || '').trim();
    const city = (d.city || '').trim();

    if (!firstName || !lastName) {
      setError('First and last name are required.');
      return;
    }

    if (!email) {
      setError('Email address is required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&* etc.).');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
      setError('Phone number format is invalid (must be 7–20 digits).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        firstName,
        lastName,
        email,
        phone,
        password,
        confirm,
        address,
        city,
      });
      nav('/');
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-visual">
        <Logo light />
        <div>
          <span className="eyebrow">Join the neighborhood</span>
          <h1>
            Your freshest shop
            <br />
            starts here.
          </h1>
          <p>Create your customer account in less than a minute.</p>
        </div>
        <small>Simple. Fresh. Delivered.</small>
      </div>
      <div className="auth-panel">
        <div className="auth-form wide">
          <h2>Create your account</h2>
          <p>
            Already shopping with us? <Link to="/login">Sign in</Link>
          </p>
          <form onSubmit={submit}>
            <div className="form-row">
              <label>
                First name
                <input name="firstName" placeholder="John" required />
              </label>
              <label>
                Last name
                <input name="lastName" placeholder="Doe" required />
              </label>
            </div>
            <div className="form-row">
              <label>
                Email
                <input name="email" type="email" placeholder="john.doe@example.com" required />
              </label>
              <label>
                Phone
                <input name="phone" placeholder="+1 234 567 8900" required />
              </label>
            </div>
            <div className="form-row">
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  placeholder="At least 8 chars"
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  minLength="8"
                  placeholder="Repeat password"
                  required
                />
              </label>
            </div>
            <small
              style={{
                display: 'block',
                color: 'var(--muted)',
                fontSize: '0.73rem',
                marginTop: '-10px',
                marginBottom: '16px',
                lineHeight: '1.4',
              }}
            >
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character (e.g. Test@1234).
            </small>
            <label>
              Address
              <input name="address" placeholder="123 Main St" required />
            </label>
            <label>
              City
              <input name="city" placeholder="Colombo" required />
            </label>

            {error && <div className="error">{error}</div>}

            <label className="check">
              <input type="checkbox" required /> I agree to the Terms and Privacy Policy
            </label>
            <button className="btn btn-primary btn-large full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create customer account'}
            </button>
          </form>
          <Link className="back-home" to="/">
            ← Back to supermarket
          </Link>
        </div>
      </div>
    </div>
  );
}
