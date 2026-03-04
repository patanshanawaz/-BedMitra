import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MdLocalHospital } from 'react-icons/md';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'super_admin' ? '/admin/dashboard' : '/hospital/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Background circles */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(220,38,38,.15),transparent)', top: '10%', right: '15%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,.1),transparent)', bottom: '15%', left: '10%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, zIndex: 1 }}>
        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '44px 40px', boxShadow: '0 40px 80px rgba(0,0,0,.5)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#dc2626,#991b1b)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(220,38,38,.4)' }}>
              <MdLocalHospital size={34} color="#fff" />
            </div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, fontFamily: 'Poppins,sans-serif', marginBottom: 6 }}>BedMitra</h1>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14 }}>Hospital Staff Portal — Sign in to continue</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <FiAlertCircle color="#f87171" size={16} />
              <span style={{ color: '#fca5a5', fontSize: 14 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.35)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="doctor@hospital.com"
                  style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(220,38,38,.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
              </div>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.35)' }} />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter your password"
                  style={{ width: '100%', padding: '12px 44px 12px 40px', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(220,38,38,.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
                <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 4 }}>
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(220,38,38,.5)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', boxShadow: '0 6px 20px rgba(220,38,38,.4)', letterSpacing: '.02em', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', background: 'rgba(255,255,255,.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, textAlign: 'center' }}>
              Super Admin: <strong style={{ color: '#dc2626' }}>admin@bedmitra.com</strong><br />
              Password: <strong style={{ color: '#dc2626' }}>Admin@123456</strong>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, textDecoration: 'none' }}>
              ← Back to public portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
