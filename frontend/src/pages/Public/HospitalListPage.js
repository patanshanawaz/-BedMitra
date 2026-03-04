import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { MdLocalHospital } from 'react-icons/md';
import { FiSearch, FiMapPin, FiPhone, FiRefreshCw, FiFilter, FiAlertCircle, FiCheckCircle, FiArrowRight, FiChevronDown } from 'react-icons/fi';

const wardColors = { General_ICU:'#dc2626', CCU:'#e11d48', NICU:'#16a34a', PICU:'#2563eb', SICU:'#7c3aed', MICU:'#0891b2', Burn_ICU:'#ea580c', Trauma_ICU:'#d97706' };
const typeLabels = { government:'Government', private:'Private', trust:'Trust/NGO', clinic:'Clinic' };

function OccupancyBar({ pct }) {
  const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#16a34a';
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>Occupancy</span>
        <span style={{ fontSize:12, fontWeight:700, color }}>{pct || 0}%</span>
      </div>
      <div style={{ height:6, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min(pct||0,100)}%`, background: pct>=90?'linear-gradient(90deg,#dc2626,#b91c1c)':pct>=70?'linear-gradient(90deg,#d97706,#b45309)':'linear-gradient(90deg,#16a34a,#15803d)', borderRadius:999, transition:'width .5s ease' }} />
      </div>
    </div>
  );
}

function HospitalCard({ h }) {
  const avail = parseInt(h.total_available_beds||0);
  const total = parseInt(h.total_icu_beds||0);
  const occ = parseFloat(h.occupancy_percent||0);
  const statusColor = avail===0?'#dc2626':avail<=3?'#d97706':'#16a34a';
  const statusBg = avail===0?'#fef2f2':avail<=3?'#fffbeb':'#dcfce7';
  const statusBorder = avail===0?'#fecaca':avail<=3?'#fde68a':'#bbf7d0';
  const statusLabel = avail===0?'Full':avail<=3?'Almost Full':'Available';

  return (
    <div style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.07)', border:'1px solid #f1f5f9', transition:'all .25s' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,.12)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.07)'; }}
    >
      {/* Top stripe */}
      <div style={{ height:5, background: avail===0?'linear-gradient(90deg,#dc2626,#9f1239)':avail<=3?'linear-gradient(90deg,#d97706,#b45309)':'linear-gradient(90deg,#16a34a,#15803d)' }} />

      <div style={{ padding:'22px 22px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div style={{ flex:1, marginRight:12 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:4, lineHeight:1.3 }}>{h.name}</h3>
            <div style={{ display:'flex', alignItems:'center', gap:5, color:'#64748b', fontSize:12 }}>
              <FiMapPin size={12} />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>{h.address}</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <span style={{ background:statusBg, border:`1px solid ${statusBorder}`, color:statusColor, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>
              {statusLabel}
            </span>
            <span style={{ color:'#94a3b8', fontSize:11, background:'#f8fafc', padding:'2px 8px', borderRadius:6, border:'1px solid #e2e8f0' }}>{typeLabels[h.type]||h.type}</span>
          </div>
        </div>

        {/* Big availability number */}
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', marginBottom:14 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, fontWeight:900, color:statusColor, lineHeight:1, fontFamily:'Poppins,sans-serif' }}>{avail}</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500, marginTop:2 }}>Available</div>
          </div>
          <div style={{ width:1, height:44, background:'#e2e8f0' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, fontWeight:900, color:'#dc2626', lineHeight:1, fontFamily:'Poppins,sans-serif' }}>{h.total_occupied_beds||0}</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500, marginTop:2 }}>Occupied</div>
          </div>
          <div style={{ width:1, height:44, background:'#e2e8f0' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, fontWeight:900, color:'#475569', lineHeight:1, fontFamily:'Poppins,sans-serif' }}>{total}</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500, marginTop:2 }}>Total ICU</div>
          </div>
        </div>

        <OccupancyBar pct={occ} />

        {/* Contact & action */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16 }}>
          <a href={`tel:${h.emergency_phone}`} style={{ display:'flex', alignItems:'center', gap:6, color:'#dc2626', fontSize:13, fontWeight:700, textDecoration:'none', background:'#fef2f2', padding:'7px 12px', borderRadius:8, border:'1px solid #fecaca' }}>
            <FiPhone size={13} /> {h.emergency_phone}
          </a>
          <Link to={`/hospitals/${h.hospital_id}`} style={{ display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'8px 16px', borderRadius:9 }}>
            View Details <FiArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HospitalListPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search')||'');
  const [city, setCity] = useState(searchParams.get('city')||'');
  const [type, setType] = useState('');
  const [availability, setAvailability] = useState(searchParams.get('availability')||'');
  const [total, setTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { socket } = useSocket();

  const fetchHospitals = useCallback(() => {
    setLoading(true);
    const params = {};
    if (city) params.city = city;
    if (search) params.search = search;
    if (type) params.type = type;
    if (availability) params.availability = availability;
    params.limit = 50;
    hospitalAPI.getAll(params)
      .then(r => { setHospitals(r.data.data); setTotal(r.data.pagination?.total||0); setLastUpdated(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, search, type, availability]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);
  useEffect(() => { hospitalAPI.getCities().then(r => setCities(r.data.data)).catch(()=>{}); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => { fetchHospitals(); };
    socket.on('bed_count_update', handler);
    return () => socket.off('bed_count_update', handler);
  }, [socket, fetchHospitals]);

  const available = hospitals.filter(h=>parseInt(h.total_available_beds||0)>0).length;

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
      {/* Top bar */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'24px 32px 32px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
              <div style={{ width:34, height:34, background:'linear-gradient(135deg,#dc2626,#991b1b)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}><MdLocalHospital size={18} color="#fff" /></div>
              <span style={{ fontWeight:800, fontSize:16, color:'#fff', fontFamily:'Poppins,sans-serif' }}>ICU<span style={{ color:'#dc2626' }}>Tracker</span></span>
            </Link>
          </div>

          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:30, fontWeight:900, color:'#fff', fontFamily:'Poppins,sans-serif', marginBottom:6 }}>Hospital ICU Availability</h1>
              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ color:'rgba(255,255,255,.7)', fontSize:14 }}><span style={{ color:'#4ade80', fontWeight:700 }}>{available}</span> hospitals with beds available</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,.5)', fontSize:12 }}>
                  <span className="pulse pulse-green" />
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <button onClick={fetchHospitals} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:10, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:'2', minWidth:200 }}>
              <FiSearch size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.4)' }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchHospitals()} placeholder="Search hospitals..."
                style={{ width:'100%', padding:'11px 14px 11px 36px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, color:'#fff', fontSize:14, outline:'none' }} />
            </div>
            <select value={city} onChange={e=>setCity(e.target.value)} style={{ flex:'1', minWidth:150, padding:'11px 14px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', cursor:'pointer' }}>
              <option value="" style={{ color:'#333', background:'#fff' }}>All Cities</option>
              {cities.map(c=><option key={c.id} value={c.name} style={{ color:'#333', background:'#fff' }}>{c.name}</option>)}
            </select>
            <select value={type} onChange={e=>setType(e.target.value)} style={{ flex:'1', minWidth:130, padding:'11px 14px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', cursor:'pointer' }}>
              <option value="" style={{ color:'#333', background:'#fff' }}>All Types</option>
              <option value="government" style={{ color:'#333', background:'#fff' }}>Government</option>
              <option value="private" style={{ color:'#333', background:'#fff' }}>Private</option>
              <option value="trust" style={{ color:'#333', background:'#fff' }}>Trust</option>
            </select>
            <select value={availability} onChange={e=>setAvailability(e.target.value)} style={{ flex:'1', minWidth:140, padding:'11px 14px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', cursor:'pointer' }}>
              <option value="" style={{ color:'#333', background:'#fff' }}>All Availability</option>
              <option value="available" style={{ color:'#333', background:'#fff' }}>Has Available Beds</option>
              <option value="full" style={{ color:'#333', background:'#fff' }}>Fully Occupied</option>
            </select>
            <button onClick={fetchHospitals} style={{ padding:'11px 24px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,.4)', whiteSpace:'nowrap' }}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 32px' }}>
        {/* Summary row */}
        <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
          {[{ label:'Total Found', val:hospitals.length, color:'#0f172a', bg:'#fff' },
            { label:'Available Beds', val:hospitals.reduce((s,h)=>s+parseInt(h.total_available_beds||0),0), color:'#16a34a', bg:'#dcfce7' },
            { label:'Occupied Beds', val:hospitals.reduce((s,h)=>s+parseInt(h.total_occupied_beds||0),0), color:'#dc2626', bg:'#fef2f2' },
            { label:'Hospitals Available', val:available, color:'#2563eb', bg:'#eff6ff' }
          ].map(({label,val,color,bg}) => (
            <div key={label} style={{ background:bg, borderRadius:12, padding:'12px 20px', border:'1px solid', borderColor:bg==='#fff'?'#e2e8f0':bg, boxShadow:'0 2px 8px rgba(0,0,0,.05)', minWidth:140 }}>
              <div style={{ fontSize:26, fontWeight:900, color, fontFamily:'Poppins,sans-serif' }}>{val}</div>
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:250, flexDirection:'column', gap:16 }}>
            <div className="spinner" />
            <p style={{ color:'#64748b', fontSize:14 }}>Loading hospitals...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <FiAlertCircle size={48} color="#cbd5e1" style={{ marginBottom:16 }} />
            <h3 style={{ color:'#64748b', fontSize:18, fontWeight:600 }}>No hospitals found</h3>
            <p style={{ color:'#94a3b8', marginTop:8 }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:20 }}>
            {hospitals.map(h => <HospitalCard key={h.hospital_id} h={h} />)}
          </div>
        )}
      </div>
    </div>
  );
}
