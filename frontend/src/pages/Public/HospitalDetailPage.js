import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { MdLocalHospital, MdVerified } from 'react-icons/md';
import { FiPhone, FiMapPin, FiMail, FiGlobe, FiArrowLeft, FiRefreshCw, FiActivity } from 'react-icons/fi';

const wardColors = { General_ICU:'#dc2626', CCU:'#e11d48', NICU:'#16a34a', PICU:'#2563eb', SICU:'#7c3aed', MICU:'#0891b2', Burn_ICU:'#ea580c', Trauma_ICU:'#d97706' };
const wardIcons = { General_ICU:'🏥', CCU:'❤️', NICU:'👶', PICU:'🧒', SICU:'🔬', MICU:'💊', Burn_ICU:'🔥', Trauma_ICU:'🚑' };

function WardCard({ ward }) {
  const pct = ward.total_beds > 0 ? Math.round((ward.occupied_beds/ward.total_beds)*100) : 0;
  const color = wardColors[ward.ward_type] || '#475569';
  const avail = parseInt(ward.available_beds||0);
  const statusColor = avail===0?'#dc2626':avail<=2?'#d97706':'#16a34a';
  const statusLabel = avail===0?'FULL':avail<=2?'CRITICAL':'OPEN';

  return (
    <div style={{ background:'#fff', borderRadius:16, padding:20, border:`1px solid ${color}22`, boxShadow:'0 4px 16px rgba(0,0,0,.06)', position:'relative', overflow:'hidden', transition:'all .25s' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,.12)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.06)'; }}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:color }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:20 }}>{wardIcons[ward.ward_type]||'🏥'}</span>
            <span style={{ fontSize:13, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.06em' }}>{ward.ward_type.replace(/_/g,' ')}</span>
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'#0f172a' }}>{ward.ward_name}</div>
        </div>
        <div style={{ padding:'4px 12px', borderRadius:999, background:avail===0?'#fef2f2':avail<=2?'#fffbeb':'#dcfce7', color:statusColor, fontSize:11, fontWeight:800, letterSpacing:'.08em', border:`1px solid ${avail===0?'#fecaca':avail<=2?'#fde68a':'#bbf7d0'}` }}>
          {statusLabel}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
        {[{label:'Available',val:ward.available_beds,c:'#16a34a'},{label:'Occupied',val:ward.occupied_beds,c:'#dc2626'},{label:'Maintenance',val:ward.under_maintenance,c:'#d97706'}].map(({label,val,c})=>(
          <div key={label} style={{ textAlign:'center', background:'#f8fafc', borderRadius:10, padding:'10px 6px' }}>
            <div style={{ fontSize:22, fontWeight:900, color:c, fontFamily:'Poppins,sans-serif' }}>{val}</div>
            <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>{label}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ fontSize:11, color:'#94a3b8' }}>Bed Utilization</span>
          <span style={{ fontSize:12, fontWeight:700, color }}>{pct}%</span>
        </div>
        <div style={{ height:7, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:999, transition:'width .6s ease' }} />
        </div>
      </div>

      {ward.cost_per_day > 0 && (
        <div style={{ marginTop:12, fontSize:12, color:'#64748b', background:'#f8fafc', padding:'6px 10px', borderRadius:8 }}>
          💰 ₹{ward.cost_per_day.toLocaleString()}/day
        </div>
      )}
      {ward.features && (
        <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:4 }}>
          {ward.features.split(',').slice(0,3).map(f => (
            <span key={f} style={{ background:`${color}15`, color, fontSize:10, padding:'2px 8px', borderRadius:999, fontWeight:600 }}>{f.trim()}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HospitalDetailPage() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket, joinHospital } = useSocket();

  const fetchHospital = () => {
    setLoading(true);
    hospitalAPI.getById(id)
      .then(r => setHospital(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHospital(); }, [id]);
  useEffect(() => { if (hospital) joinHospital(hospital.id); }, [hospital]);
  useEffect(() => {
    if (!socket) return;
    const h = () => fetchHospital();
    socket.on('bed_count_update', h);
    return () => socket.off('bed_count_update', h);
  }, [socket]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!hospital) return <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>Hospital not found.</div>;

  const totalAvail = hospital.wards?.reduce((s,w)=>s+parseInt(w.available_beds||0),0)||0;
  const totalOcc = hospital.wards?.reduce((s,w)=>s+parseInt(w.occupied_beds||0),0)||0;
  const totalICU = hospital.wards?.reduce((s,w)=>s+parseInt(w.total_beds||0),0)||0;

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'28px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <Link to="/hospitals" style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,.6)', fontSize:14, textDecoration:'none', transition:'color .2s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.6)'}>
              <FiArrowLeft size={15} /> Back to hospitals
            </Link>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', fontFamily:'Poppins,sans-serif' }}>{hospital.name}</h1>
                {hospital.is_verified && <MdVerified size={24} color="#60a5fa" />}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,.6)', fontSize:14, marginBottom:6 }}>
                <FiMapPin size={14} /> {hospital.address}, {hospital.city}
              </div>
              {hospital.accreditation && (
                <div style={{ fontSize:12, color:'#fbbf24', background:'rgba(251,191,36,.1)', display:'inline-block', padding:'3px 10px', borderRadius:999, border:'1px solid rgba(251,191,36,.2)' }}>
                  {hospital.accreditation}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <a href={`tel:${hospital.emergency_phone}`} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 6px 20px rgba(220,38,38,.4)' }}>
                <FiPhone size={16} /> Call Emergency: {hospital.emergency_phone}
              </a>
              <button onClick={fetchHospital} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 18px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:12, color:'#fff', fontSize:14, cursor:'pointer' }}>
                <FiRefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 32px' }}>
        {/* Live status summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
          {[
            {label:'Available ICU Beds', val:totalAvail, color:'#16a34a', bg:'#dcfce7', border:'#bbf7d0', icon:'✅'},
            {label:'Occupied ICU Beds', val:totalOcc, color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:'🚨'},
            {label:'Total ICU Capacity', val:totalICU, color:'#475569', bg:'#f8fafc', border:'#e2e8f0', icon:'🏥'},
            {label:'Occupancy Rate', val:`${totalICU>0?Math.round((totalOcc/totalICU)*100):0}%`, color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:'📊'},
          ].map(({label,val,color,bg,border,icon}) => (
            <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500, marginBottom:6 }}>{icon} {label}</div>
              <div style={{ fontSize:34, fontWeight:900, color, fontFamily:'Poppins,sans-serif' }}>{val}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                <span className={`pulse ${typeof val==='number'&&val>0?'pulse-green':'pulse-red'}`} />
                <span style={{ fontSize:11, color:'#94a3b8' }}>Live</span>
              </div>
            </div>
          ))}
        </div>

        {/* Ward breakdown */}
        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:20, fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:8 }}>
            <FiActivity size={20} color="#dc2626" /> ICU Ward Breakdown
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {hospital.wards?.map(ward => <WardCard key={ward.id} ward={ward} />)}
          </div>
        </div>

        {/* Hospital info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:'#0f172a' }}>Contact Information</h3>
            {[
              { icon:FiPhone, label:'Main Phone', val:hospital.phone },
              { icon:FiPhone, label:'Emergency', val:hospital.emergency_phone, color:'#dc2626' },
              { icon:FiMail, label:'Email', val:hospital.email },
              { icon:FiMapPin, label:'Address', val:`${hospital.address}, ${hospital.city}, ${hospital.state}` },
            ].filter(i=>i.val).map(({ icon:Icon, label, val, color }) => (
              <div key={label} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                <Icon size={16} color={color||'#64748b'} style={{ marginTop:2, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>{label}</div>
                  <div style={{ fontSize:14, color:color||'#334155', fontWeight:color?700:400 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:'#0f172a' }}>About the Hospital</h3>
            <p style={{ fontSize:14, color:'#64748b', lineHeight:1.7 }}>{hospital.description || 'No description available.'}</p>
            <div style={{ marginTop:16, display:'flex', gap:10, flexWrap:'wrap' }}>
              <span style={{ background:'#f1f5f9', color:'#475569', padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{hospital.type} Hospital</span>
              {hospital.accreditation?.split(',').map(a => (
                <span key={a} style={{ background:'#fef9c3', color:'#92400e', padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:600 }}>{a.trim()}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
