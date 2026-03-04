import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalsAPI } from '../api/api';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

const WARD_LABELS = {
  General_ICU: 'General ICU', NICU: 'NICU', CCU: 'CCU',
  PICU: 'PICU', SICU: 'SICU', MICU: 'MICU',
  Burn_ICU: 'Burn ICU', Trauma_ICU: 'Trauma ICU'
};

const getAvailabilityBadge = (available, total) => {
  if (!total) return { cls: 'unknown', label: 'Unknown', dot: '⚪' };
  const pct = (available / total) * 100;
  if (available === 0) return { cls: 'full', label: 'No Beds', dot: '🔴' };
  if (pct <= 15) return { cls: 'critical', label: `${available} Bed${available > 1 ? 's' : ''}`, dot: '🔴' };
  if (pct <= 40) return { cls: 'low', label: `${available} Available`, dot: '🟡' };
  return { cls: 'available', label: `${available} Available`, dot: '🟢' };
};

const getOccupancyClass = (pct) => {
  if (pct >= 90) return 'occ-90';
  if (pct >= 75) return 'occ-75';
  if (pct >= 50) return 'occ-50';
  return 'occ-0';
};

const HospitalCard = ({ hospital, onClick }) => {
  const badge = getAvailabilityBadge(hospital.total_available_beds, hospital.total_icu_beds);
  const occ = parseFloat(hospital.occupancy_percent) || 0;

  return (
    <div className="hospital-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={`hospital-card-header ${hospital.type}`}>
        <div className="hospital-type-tag">{hospital.type}</div>
        <div className="hospital-card-name">{hospital.name}</div>
        <div className="hospital-card-address">
          📍 {hospital.address?.substring(0, 55)}{hospital.address?.length > 55 ? '...' : ''}
        </div>
        {hospital.is_verified && (
          <div style={{ marginTop: '8px', fontSize: '0.75rem', opacity: 0.8 }}>✅ NABH Verified</div>
        )}
      </div>

      <div className="hospital-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className={`availability-badge ${badge.cls}`}>
            {badge.dot} {badge.label}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
            {hospital.total_icu_beds} Total ICU Beds
          </span>
        </div>

        <div className="occupancy-bar-wrapper">
          <div className="occupancy-label">
            <span>Occupancy</span>
            <span style={{ fontWeight: 700 }}>{occ}%</span>
          </div>
          <div className="occupancy-bar">
            <div
              className={`occupancy-fill ${getOccupancyClass(occ)}`}
              style={{ width: `${Math.min(occ, 100)}%` }}
            ></div>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--gray-600)' }}>
          <div>📞 Emergency: <strong>{hospital.emergency_phone}</strong></div>
        </div>
      </div>

      <div className="hospital-card-footer">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
            Updated: {hospital.last_updated ? new Date(hospital.last_updated).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
        <button className="btn btn-primary btn-sm">View Details →</button>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [cities, setCities] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [cityStats, setCityStats] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const { lastUpdate } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    hospitalsAPI.getCities()
      .then(data => {
        setCities(data.data || []);
        if (data.data?.length > 0) {
          const hyd = data.data.find(c => c.name.toLowerCase().includes('hyderabad'));
          if (hyd) handleCitySelect(hyd);
        }
      })
      .catch(() => toast.error('Failed to load cities'));
    // eslint-disable-next-line
  }, []);

  // Refresh when socket update comes in
  useEffect(() => {
    if (lastUpdate && selectedCityId) {
      loadHospitals(selectedCityId);
    }
    // eslint-disable-next-line
  }, [lastUpdate]);

  const handleCitySelect = async (city) => {
    setSelectedCity(city.name);
    setSelectedCityId(city.id);
    setStatsLoading(true);
    loadHospitals(city.id);
    try {
      const statsData = await hospitalsAPI.getCityStats(city.id);
      setCityStats(statsData.data);
    } catch { /* ignore */ }
    setStatsLoading(false);
  };

  const loadHospitals = useCallback(async (cityId) => {
    setLoading(true);
    try {
      const params = { city: cityId, limit: 50 };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (filter === 'available') params.availability = 'available';
      if (searchText) params.search = searchText;
      const data = await hospitalsAPI.getAll(params);
      setHospitals(data.data || []);
    } catch { toast.error('Failed to load hospitals'); }
    setLoading(false);
  }, [filter, typeFilter, searchText]);

  const handleSearch = () => {
    if (selectedCityId) loadHospitals(selectedCityId);
    else toast.error('Please select a city first');
  };

  const filteredHospitals = hospitals.filter(h => {
    if (filter === 'available') return h.total_available_beds > 0;
    if (filter === 'critical') return parseInt(h.occupancy_percent) >= 90;
    if (filter === 'full') return h.total_available_beds === 0;
    return true;
  }).filter(h => {
    if (typeFilter === 'all') return true;
    return h.type === typeFilter;
  });

  const totalAvail = hospitals.reduce((s, h) => s + (h.total_available_beds || 0), 0);
  const totalICU = hospitals.reduce((s, h) => s + (h.total_icu_beds || 0), 0);
  const criticalCount = hospitals.filter(h => parseInt(h.occupancy_percent) >= 90).length;

  return (
    <div className="page-enter">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Background particles */}
        <div className="hero-particles">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="hero-particle"
              style={{
                width: `${Math.random() * 20 + 5}px`,
                height: `${Math.random() * 20 + 5}px`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 10}s`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>🚨</span>
              <span>Real-Time ICU Bed Availability by BedMitra</span>
              <span style={{ background: 'rgba(46,204,113,0.3)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem' }}>LIVE</span>
            </div>

            <h1 className="hero-title">
              Find <span>Available ICU Beds</span> in Seconds
            </h1>

            <p className="hero-subtitle">
              In emergencies, every minute counts. Get live ICU bed availability
              across all major hospitals in metropolitan cities — <strong style={{ color: 'white' }}>Hyderabad, Bengaluru,
              Mumbai, Chennai</strong> and more. Zero traffic. Maximum survival chance.
            </p>

            {/* Search Card */}
            <div className="hero-search-card">
              <div className="hero-search-title">
                🔍 Find Nearest Hospital with Available ICU Beds
              </div>

              <div className="hero-search-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select City</label>
                  <select
                    className="form-select"
                    value={selectedCityId}
                    onChange={(e) => {
                      const city = cities.find(c => c.id === parseInt(e.target.value));
                      if (city) handleCitySelect(city);
                    }}
                  >
                    <option value="">-- Choose City --</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Search Hospital</label>
                  <input
                    className="form-input"
                    placeholder="Hospital name or area..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSearch}
                  disabled={loading}
                  style={{ paddingTop: '13px', paddingBottom: '13px', marginTop: '4px' }}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Searching...</>
                  ) : '🔍 Search'}
                </button>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="hero-stat-number">{hospitals.length || '10+'}</span>
                <span className="hero-stat-label">Hospitals Tracked</span>
              </div>
              <div className="hero-stat-item" style={{ borderColor: totalAvail > 0 ? 'rgba(46,204,113,0.4)' : 'rgba(231,76,60,0.4)' }}>
                <span className="hero-stat-number" style={{ color: totalAvail > 0 ? '#6ee7b7' : '#fca5a5' }}>
                  {totalAvail}
                </span>
                <span className="hero-stat-label">ICU Beds Available</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">{totalICU}</span>
                <span className="hero-stat-label">Total ICU Capacity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      {selectedCityId && (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>

          {/* City Overview */}
          {cityStats && !statsLoading && (
            <div className="city-overview">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div className="section-title">
                  📍 {selectedCity} <span>ICU Status</span>
                </div>
                <div className="nav-live-badge">
                  <div className="live-dot"></div>
                  Real-Time Data
                </div>
              </div>
              <div className="grid-4">
                <div className="stat-card info">
                  <div className="stat-icon info">🏥</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Hospitals</div>
                    <div className="stat-value">{cityStats.total_hospitals}</div>
                    <div className="stat-sub">Active and tracked</div>
                  </div>
                </div>
                <div className="stat-card available">
                  <div className="stat-icon available">🛏️</div>
                  <div className="stat-content">
                    <div className="stat-label">Available ICU Beds</div>
                    <div className="stat-value" style={{ color: 'var(--success-dark)' }}>{cityStats.available_beds}</div>
                    <div className="stat-sub">Ready for admission</div>
                  </div>
                </div>
                <div className="stat-card occupied">
                  <div className="stat-icon occupied">🔴</div>
                  <div className="stat-content">
                    <div className="stat-label">Occupied Beds</div>
                    <div className="stat-value">{cityStats.occupied_beds}</div>
                    <div className="stat-sub">Currently in use</div>
                  </div>
                </div>
                <div className={`stat-card ${cityStats.city_occupancy_percent >= 75 ? 'critical' : 'warning'}`}>
                  <div className={`stat-icon ${cityStats.city_occupancy_percent >= 75 ? 'critical' : 'warning'}`}>📊</div>
                  <div className="stat-content">
                    <div className="stat-label">City Occupancy</div>
                    <div className="stat-value">{cityStats.city_occupancy_percent}%</div>
                    <div className="stat-sub">of total ICU capacity</div>
                  </div>
                </div>
              </div>

              {criticalCount > 0 && (
                <div className="alert alert-error" style={{ marginTop: '16px' }}>
                  <span className="alert-icon">⚠️</span>
                  <span><strong>{criticalCount} hospital{criticalCount > 1 ? 's are' : ' is'} critically full</strong> (90%+ occupancy). Consider alternate hospitals.</span>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="filter-bar">
            <span className="filter-label">Availability:</span>
            <div className="filter-chips">
              {['all', 'available', 'low', 'critical', 'full'].map(f => (
                <button
                  key={f}
                  className={`filter-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'available' ? '🟢 Available' : f === 'low' ? '🟡 Low' : f === 'critical' ? '🔴 Critical' : '⛔ Full'}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="filter-label">Type:</span>
            </div>
            <div className="filter-chips">
              {['all', 'government', 'private', 'trust'].map(t => (
                <button
                  key={t}
                  className={`filter-chip ${typeFilter === t ? 'active' : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              Showing {filteredHospitals.length} hospitals
            </span>
          </div>

          {/* Hospital Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} className="skeleton"></div>
              ))}
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--gray-500)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏥</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', color: 'var(--gray-700)' }}>
                No hospitals found
              </h3>
              <p>Try changing your filters or selecting a different city.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredHospitals.map(hospital => (
                <HospitalCard
                  key={hospital.hospital_id}
                  hospital={hospital}
                  onClick={() => navigate(`/hospitals/${hospital.hospital_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Section */}
      {!selectedCityId && (
        <div style={{ background: 'white', padding: '80px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gray-900)', fontFamily: 'Poppins, sans-serif' }}>
                Why <span style={{ color: 'var(--primary)' }}>ICUTrack?</span>
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem', marginTop: '12px', maxWidth: '500px', margin: '12px auto 0' }}>
                Built for emergencies. Designed for speed. Trusted by patients.
              </p>
            </div>
            <div className="grid-3">
              {[
                { icon: '⚡', title: 'Real-Time Updates', desc: 'Bed availability updates instantly when a patient is admitted or discharged. No delay, no guessing.' },
                { icon: '🗺️', title: 'City-Wide Coverage', desc: 'Track every major hospital across metropolitan cities. Government, private, trust — all in one place.' },
                { icon: '📱', title: 'Works on Any Device', desc: 'Fully responsive. Use it on your phone while rushing to the hospital. Every second matters.' },
                { icon: '🔍', title: 'Search & Filter', desc: 'Filter by ICU type (NICU, CCU, Trauma), hospital type, and availability. Find the right bed fast.' },
                { icon: '🚨', title: 'Emergency Ready', desc: 'Critical alerts for hospitals at 90%+ capacity. Know before you go — save the drive, save a life.' },
                { icon: '🏥', title: 'Hospital Dashboard', desc: 'Hospital staff can update bed availability in real-time from a dedicated admin portal.' },
              ].map((feature, i) => (
                <div key={i} className="card" style={{ padding: '28px', textAlign: 'center', cursor: 'default' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{feature.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '10px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', lineHeight: '1.6' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: 'var(--gray-900)', color: 'rgba(255,255,255,0.6)',
        padding: '32px 0', textAlign: 'center', fontSize: '0.88rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🏥</span>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>ICUTrack</span>
              <span>— Saving Lives, One Bed at a Time</span>
            </div>
            <div>© 2024 ICUTrack. Final Year B.Tech Project. For Emergency Medical Use.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
