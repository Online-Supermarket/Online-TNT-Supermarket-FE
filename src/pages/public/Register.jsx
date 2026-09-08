import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import Logo from '../../components/Logo';
import {useAuth} from '../../context/AuthContext';

export default function Register(){
  const {register}=useAuth();
  const nav=useNavigate();
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(e){
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const d = Object.fromEntries(formData);
    
    console.log('Form data collected:', d);

    if(d.password!==d.confirm){
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.email || '',
        phone: d.phone || '',
        password: d.password || '',
        confirm: d.confirm || '',
        address: d.address || '',
        city: d.city || '',
      });
      nav('/');
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Response data:', err?.response?.data);

      const status = err?.response?.status;
      const payload = err?.response?.data ?? {};

      let message = 'Unable to create account. Please try again.';

      if (status === 409) {
        message = 'An account with this email already exists. Please use a different email.';
      } else if (typeof payload === 'string' && payload.trim()) {
        message = payload;
      } else if (payload?.message) {
        message = payload.message;
      } else if (payload?.title) {
        message = payload.title;
      } else if (payload?.detail) {
        message = payload.detail;
      } else if (payload?.errors) {
        if (Array.isArray(payload.errors)) {
          message = payload.errors[0] || message;
        } else if (typeof payload.errors === 'object') {
          const errors = Object.values(payload.errors).flat();
          message = errors[0] || message;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-page register-page"><div className="auth-visual"><Logo light/><div><span className="eyebrow">Join the neighborhood</span><h1>Your freshest shop<br/>starts here.</h1><p>Create your customer account in less than a minute.</p></div><small>Simple. Fresh. Delivered.</small></div><div className="auth-panel"><div className="auth-form wide"><h2>Create your account</h2><p>Already shopping with us? <Link to="/login">Sign in</Link></p><form onSubmit={submit}><div className="form-row"><label>First name<input name="firstName" required/></label><label>Last name<input name="lastName" required/></label></div><div className="form-row"><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone" required/></label></div><div className="form-row"><label>Password<input name="password" type="password" minLength="8" required/></label><label>Confirm password<input name="confirm" type="password" required/></label></div><label>Address<input name="address" required/></label><label>City<input name="city" required/></label>{error&&<div className="error">{error}</div>}<label className="check"><input type="checkbox" required/> I agree to the Terms and Privacy Policy</label><button className="btn btn-primary btn-large full" disabled={loading}>{loading ? 'Creating account...' : 'Create customer account'}</button></form><Link className="back-home" to="/">← Back to supermarket</Link></div></div></div>}
