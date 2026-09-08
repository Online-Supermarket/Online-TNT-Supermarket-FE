import {Eye,EyeOff,LockKeyhole,Mail} from 'lucide-react';
import {useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import Logo from '../../components/Logo';
import {useAuth} from '../../context/AuthContext';

const ROLE_HOME = {
  ADMIN:    '/admin/dashboard',
  MANAGER:  '/admin/dashboard',
  STAFF:    '/staff/dashboard',
  SELLER:   '/seller/dashboard',
  DELIVERY: '/delivery/dashboard',
};

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const {login}=useAuth();
  const nav=useNavigate();
  const location=useLocation();

  async function submit(e){
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user=await login(email,password);
      const role = String(user?.role || '').toUpperCase();
      const dest = ROLE_HOME[role] || location.state?.from?.pathname || '/';
      nav(dest,{replace:true});
    } catch (err) {
      const message =
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Unable to sign in. Please check your email and password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-page"><div className="auth-visual"><Logo light/><div><span className="eyebrow">Welcome back</span><h1>Good food is<br/>waiting for you.</h1><p>Sign in and pick up right where you left off.</p></div><small>Freshness, one click away.</small></div><div className="auth-panel"><div className="auth-form"><h2>Sign in to TNT</h2><p>New to TNT? <Link to="/register">Create a free account</Link></p><form onSubmit={submit}><label>Email address<div className="input-icon"><Mail/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" required/></div></label><label>Password<div className="input-icon"><LockKeyhole/><input value={password} onChange={e=>setPassword(e.target.value)} type={showPw?'text':'password'} placeholder="Password" autoComplete="current-password" required/><button type="button" className="pw-toggle" aria-label="Toggle password visibility" onClick={()=>setShowPw(s=>!s)}>{showPw?<EyeOff/>:<Eye/>}</button></div></label><div className="form-options"><label><input type="checkbox"/> Remember me</label><a href="#">Forgot password?</a></div>{error&&<div className="error">{error}</div>}<button className="btn btn-primary btn-large full" disabled={loading}>{loading?'Signing in...':'Sign in'}</button></form><Link className="back-home" to="/">← Back to supermarket</Link></div></div></div>
}
