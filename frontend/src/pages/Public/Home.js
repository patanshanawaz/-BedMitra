import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';
import { MdLocalHospital, MdEmergency } from 'react-icons/md';
import { FiSearch, FiMapPin, FiClock, FiShield, FiArrowRight, FiPhone, FiActivity } from 'react-icons/fi';

export default function Home() {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [stats, setStats] = useState({ hospitals: 0, beds: 0, available: 0, cities: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    hospitalAPI.getCities().then(r => setCities(r.data.data)).catch(() => {});
    hospitalAPI.getAll({ limit: 1 }).then(r => {
      setStats(prev => ({ ...prev, hospitals: r.data.pagination?.total || 10 }));
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (search) params.set('search', search);
    navigate(`/hospitals?${params.toString()}`);
  };

  const features = [
    { icon: FiActivity, title: 'Real-Time Updates', desc: 'Bed counts update live as patients are admitted or discharged — no refresh needed.', color: '#dc2626', bg: '#fef2f2' },
    { icon: FiMapPin, title: 'Nearest Hospital', desc: 'Find the closest hospital with available ICU beds based on your location in the city.', color: '#2563eb', bg: '#eff6ff' },
    { icon: FiClock, title: 'Save Critical Time', desc: 'Know before you go. Skip hospitals with no availability and reach the right one fast.', color: '#16a34a', bg: '#dcfce7' },
    { icon: FiShield, title: 'Verified Data', desc: 'All hospitals are verified and bed counts are updated directly by hospital staff.', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const wardTypes = [
    { label: 'General ICU', icon: '🏥', color: '#dc2626' },
    { label: 'Cardiac ICU (CCU)', icon: '❤️', color: '#e11d48' },
    { label: 'Neonatal (NICU)', icon: '👶', color: '#16a34a' },
    { label: 'Pediatric (PICU)', icon: '🧒', color: '#2563eb' },
    { label: 'Trauma ICU', icon: '🚑', color: '#d97706' },
    { label: 'Surgical (SICU)', icon: '🔬', color: '#7c3aed' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#dc2626,#991b1b)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdLocalHospital size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', fontFamily: 'Poppins,sans-serif' }}>Bed<span style={{ color: '#dc2626' }}>Mitra</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/hospitals" style={{ color: '#475569', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, transition: 'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >Find Hospitals</Link>
          <Link to="/login" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 9, textDecoration: 'none', boxShadow: '0 4px 14px rgba(220,38,38,.35)' }}>
            Hospital Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)', padding: '100px 32px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(220,38,38,.12),transparent)', top: '-10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Emergency tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 999, padding: '6px 18px', marginBottom: 28 }}>
            <span className="pulse pulse-red" />
            <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>Life-saving real-time ICU bed availability</span>
          </div>

          <h1 style={{ fontSize: 58, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 20, fontFamily: 'Poppins,sans-serif' }}>
            Find ICU Beds.<br />
            <span style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Save Lives Instantly.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
            In a medical emergency, every second counts. Know exactly which hospital has ICU beds available before you rush — no more wasted time in traffic.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 18, padding: 8, display: 'flex', gap: 8, maxWidth: 680, margin: '0 auto 48px', flexWrap: 'wrap' }}>
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
              style={{ flex: '1', minWidth: 160, padding: '14px 16px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ color: '#333', background: '#fff' }}>All Cities</option>
              {cities.map(c => <option key={c.id} value={c.name} style={{ color: '#333', background: '#fff' }}>{c.name}, {c.state}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hospital name..."
              style={{ flex: '2', minWidth: 200, padding: '14px 16px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }} />
            <button type="submit" style={{ padding: '14px 28px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(220,38,38,.5)', whiteSpace: 'nowrap' }}>
              <FiSearch size={16} /> Find Beds Now
            </button>
          </form>

          {/* Quick stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {[['10+', 'Hospitals'], ['200+', 'ICU Beds Tracked'], ['4', 'Ward Types'], ['Real-time', 'Live Updates']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#dc2626', fontFamily: 'Poppins,sans-serif' }}>{val}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency banner */}
      <section style={{ background: 'linear-gradient(135deg,#dc2626,#9f1239)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MdEmergency size={28} color="#fff" />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Emergency? Check bed availability NOW</div>
              <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>Real-time updates — updated as patients are admitted & discharged</div>
            </div>
          </div>
          <Link to="/hospitals?availability=available" style={{ background: '#fff', color: '#dc2626', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontsize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(0,0,0,.2)' }}>
            <FiSearch size={16} /> Find Available Beds <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 32px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins,sans-serif', marginBottom: 12 }}>Why BedMitra?</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto' }}>Built for one purpose — helping you find the right hospital in the shortest time possible.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: '1px solid #f1f5f9', transition: 'all .25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.06)'; }}
              >
                <div style={{ width: 52, height: 52, background: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ICU Types */}
      <section style={{ padding: '80px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins,sans-serif', marginBottom: 10 }}>ICU Ward Types Tracked</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>We track availability across all major ICU specializations</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16 }}>
            {wardTypes.map(({ label, icon, color }) => (
              <div key={label} style={{ border: `2px solid ${color}22`, borderRadius: 14, padding: '20px 16px', textAlign: 'center', background: `${color}08`, transition: 'all .2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#fff', fontFamily: 'Poppins,sans-serif', marginBottom: 16 }}>Ready to save a life?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', marginBottom: 36 }}>In emergencies, real-time information is the difference between life and death. Don't guess — know.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/hospitals" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', padding: '16px 36px', borderRadius: 14, fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 30px rgba(220,38,38,.5)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiSearch size={18} /> Find ICU Beds Now
            </Link>
            <Link to="/login" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', padding: '16px 36px', borderRadius: 14, fontWeight: 700, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
              Hospital Login <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '24px 32px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>© 2026 BedMitra · Your Trusted Friend for Finding ICU Beds · Built by <a href="https://github.com/patanshanawaz" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>Patan Shanawaz</a></p>
      </footer>
    </div>
  );
}
