import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, wardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiUsers, FiActivity, FiUserPlus, FiUserCheck, FiClock, FiAlertCircle, FiBell, FiGrid } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import toast from 'react-hot-toast';

const wardColors = { General_ICU:'#dc2626', CCU:'#e11d48', NICU:'#16a34a', PICU:'#2563eb', SICU:'#7c3aed', MICU:'#0891b2', Burn_ICU:'#ea580c', Trauma_ICU:'#d97706' };
const COLORS = ['#dc2626','#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#ea580c','#475569'];

function StatCard({ icon: Icon, label, value, color, bg, border, sub, trend }) {
  return (
    <div style={{ background: bg||'#fff', border:`1.5px solid ${border||'#e2e8f0'}`, borderRadius:16, padding:'22px 24px', boxShadow:'0 4px 20px rgba(0,0,0,.06)', position:'relative', overflow:'hidden', transition:'all .2s' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,.1)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.06)'; }}
    >
      <div style={{ position:'absolute', right:-10, top:-10, width:80, height:80, borderRadius:'50%', background:`${color}12`, pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:38, fontWeight:900, color, fontFamily:'Poppins,sans-serif', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>{sub}</div>}
        </div>
        <div style={{ width:46, height:46, background:`${color}15`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickUpdate, setQuickUpdate] = useState({ wardId:'', available:'', occupied:'', maintenance:'' });
  const [wards, setWards] = useState([]);
  const [updatingBed, setUpdatingBed] = useState(false);
  const { user } = useAuth();
  const { socket, joinHospital } = useSocket();

  const hospitalId = user?.hospital_id;

  const fetch = useCallback(() => {
    dashboardAPI.getHospital(hospitalId)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hospitalId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (hospitalId) {
      joinHospital(hospitalId);
      wardAPI.getAll(hospitalId).then(r => setWards(r.data.data)).catch(()=>{});
    }
  }, [hospitalId]);

  useEffect(() => {
    if (!socket) return;
    const h = () => { fetch(); };
    socket.on('bed_count_update', h);
    socket.on('patient_admitted', h);
    socket.on('patient_discharged', h);
    return () => { socket.off('bed_count_update', h); socket.off('patient_admitted', h); socket.off('patient_discharged', h); };
  }, [socket, fetch]);

  const handleQuickUpdate = async (e) => {
    e.preventDefault();
    if (!quickUpdate.wardId) { toast.error('Select a ward'); return; }
    setUpdatingBed(true);
    try {
      await wardAPI.updateBedCount(hospitalId, quickUpdate.wardId, {
        available_beds: parseInt(quickUpdate.available)||0,
        occupied_beds: parseInt(quickUpdate.occupied)||0,
        under_maintenance: parseInt(quickUpdate.maintenance)||0,
      });
      toast.success('Bed count updated — live!');
      fetch();
      setQuickUpdate({ wardId:'', available:'', occupied:'', maintenance:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdatingBed(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const d = data || {};
  const pieData = d.wardStats?.map(w => ({ name: w.ward_type.replace(/_/g,' '), value: w.total_beds, available: w.available_beds })) || [];

  const actionColors = { admitted: '#16a34a', discharged: '#2563eb', maintenance_start: '#d97706', released: '#7c3aed', transferred: '#0891b2' };

  return (
    <div style={{ padding:28 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:10 }}>
            <MdLocalHospital size={28} color="#dc2626" />
            ICU Dashboard
          </h1>
          <p style={{ color:'#64748b', fontSize:14, marginTop:2 }}>{user?.hospital_name} · Live overview</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/hospital/patients/admit" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(220,38,38,.35)' }}>
            <FiUserPlus size={16} /> Admit Patient
          </Link>
          <button onClick={fetch} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, color:'#475569', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            <FiActivity size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        <StatCard icon={FiGrid} label="Total ICU Beds" value={d.summary?.total_icu_beds||0} color="#0f172a" border="#e2e8f0" sub={`${d.summary?.occupancy_rate||0}% occupied`} />
        <StatCard icon={FiActivity} label="Available Beds" value={d.summary?.total_available||0} color="#16a34a" bg="#f0fdf4" border="#bbf7d0" sub="Ready for admission" />
        <StatCard icon={FiUsers} label="Occupied Beds" value={d.summary?.total_occupied||0} color="#dc2626" bg="#fef2f2" border="#fecaca" sub="Active patients" />
        <StatCard icon={FiUserPlus} label="Today Admitted" value={d.todayAdmissions||0} color="#2563eb" bg="#eff6ff" border="#bfdbfe" sub="New admissions today" />
        <StatCard icon={FiUserCheck} label="Today Discharged" value={d.todayDischarges||0} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" sub="Discharged today" />
        <StatCard icon={FiAlertCircle} label="Maintenance" value={d.summary?.total_maintenance||0} color="#d97706" bg="#fffbeb" border="#fde68a" sub="Beds under maintenance" />
      </div>

      {/* Quick bed update + notifications row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Quick update */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:4 }}>⚡ Quick Bed Count Update</h3>
          <p style={{ fontSize:12, color:'#94a3b8', marginBottom:18 }}>Update counts instantly — reflects live to public.</p>
          <form onSubmit={handleQuickUpdate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <select value={quickUpdate.wardId} onChange={e=>setQuickUpdate(p=>({...p,wardId:e.target.value}))} className="form-input form-select" style={{ borderRadius:10 }}>
              <option value="">Select Ward...</option>
              {wards.map(w=><option key={w.id} value={w.id}>{w.ward_name} (Currently: {w.available_beds} avail)</option>)}
            </select>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'#16a34a', display:'block', marginBottom:4 }}>Available</label>
                <input type="number" min="0" value={quickUpdate.available} onChange={e=>setQuickUpdate(p=>({...p,available:e.target.value}))} className="form-input" style={{ borderColor:'#bbf7d0' }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'#dc2626', display:'block', marginBottom:4 }}>Occupied</label>
                <input type="number" min="0" value={quickUpdate.occupied} onChange={e=>setQuickUpdate(p=>({...p,occupied:e.target.value}))} className="form-input" style={{ borderColor:'#fecaca' }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'#d97706', display:'block', marginBottom:4 }}>Maintenance</label>
                <input type="number" min="0" value={quickUpdate.maintenance} onChange={e=>setQuickUpdate(p=>({...p,maintenance:e.target.value}))} className="form-input" style={{ borderColor:'#fde68a' }} />
              </div>
            </div>
            <button type="submit" disabled={updatingBed} style={{ padding:'11px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, cursor:updatingBed?'not-allowed':'pointer', opacity:updatingBed?.7:1, boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
              {updatingBed ? 'Updating...' : '🔄 Update Live Count'}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <FiBell size={17} color="#d97706" /> Recent Notifications
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(d.notifications||[]).length === 0 ? (
              <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:'20px 0' }}>No notifications</div>
            ) : (d.notifications||[]).map(n => (
              <div key={n.id} style={{ display:'flex', gap:10, padding:'10px 12px', background: n.type==='critical'?'#fef2f2':n.type==='warning'?'#fffbeb':'#f8fafc', borderRadius:10, border:`1px solid ${n.type==='critical'?'#fecaca':n.type==='warning'?'#fde68a':'#e2e8f0'}` }}>
                <FiBell size={13} color={n.type==='critical'?'#dc2626':n.type==='warning'?'#d97706':'#94a3b8'} style={{ marginTop:2 }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#334155' }}>{n.title}</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, marginBottom:24 }}>
        {/* Bar chart */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:20 }}>📊 Weekly Admissions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.weeklyAdmissions||[]} margin={{ top:5, right:10, left:-20, bottom:0 }}>
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius:10, border:'1px solid #e2e8f0', fontSize:13 }} />
              <Bar dataKey="admissions" fill="#dc2626" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:10 }}>🏥 Ward Distribution</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                {pieData.map((entry,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius:10, border:'1px solid #e2e8f0', fontSize:12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ward status table + recent activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, marginBottom:24 }}>
        {/* Ward table */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>🏥 Ward Status</h3>
            <Link to="/hospital/wards" style={{ fontSize:12, color:'#dc2626', fontWeight:600, textDecoration:'none' }}>Manage Wards →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(d.wardStats||[]).map(ward => {
              const pct = ward.total_beds ? Math.round((ward.occupied_beds/ward.total_beds)*100) : 0;
              const color = wardColors[ward.ward_type]||'#475569';
              const avail = parseInt(ward.available_beds);
              return (
                <div key={ward.ward_type} style={{ padding:'12px 14px', background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
                      <span style={{ fontSize:13, fontWeight:600, color:'#334155' }}>{ward.ward_name}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#16a34a' }}>{ward.available_beds} avail</span>
                      <span style={{ fontSize:12, color:'#94a3b8' }}>{ward.occupied_beds}/{ward.total_beds}</span>
                    </div>
                  </div>
                  <div style={{ height:5, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:pct>=90?'#dc2626':pct>=70?'#d97706':'#16a34a', borderRadius:999, transition:'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:16 }}>🕒 Recent Activity</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(d.recentActivity||[]).length===0 ? (
              <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:'20px 0' }}>No recent activity</div>
            ) : (d.recentActivity||[]).map((a,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:actionColors[a.action]||'#94a3b8', marginTop:5, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#334155' }}>
                    <span style={{ fontWeight:700, color:actionColors[a.action]||'#475569', textTransform:'capitalize' }}>{a.action.replace(/_/g,' ')}</span>
                    {a.patient_name && ` — ${a.patient_name}`}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{a.ward_name} · Bed {a.bed_number} · {new Date(a.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Patients */}
      {(d.admittedPatients||[]).length > 0 && (
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>👤 Currently Admitted ({d.currentPatients||0})</h3>
            <Link to="/hospital/patients" style={{ fontSize:12, color:'#dc2626', fontWeight:600, textDecoration:'none' }}>View All →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Age/Gender</th><th>Ward</th><th>Bed</th><th>Diagnosis</th><th>Admitted</th><th>Type</th></tr></thead>
              <tbody>
                {(d.admittedPatients||[]).slice(0,8).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight:600, color:'#0f172a' }}>{p.name}</td>
                    <td style={{ color:'#64748b' }}>{p.age}y {p.gender}</td>
                    <td><span style={{ background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:600 }}>{p.ward_type?.replace(/_/g,' ')}</span></td>
                    <td style={{ fontWeight:700, color:'#2563eb', fontFamily:'monospace', fontSize:13 }}>{p.bed_number||'—'}</td>
                    <td style={{ color:'#64748b', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.diagnosis||'—'}</td>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>{new Date(p.admitted_at).toLocaleDateString()}</td>
                    <td><span style={{ background:p.admission_type==='emergency'?'#fef2f2':'#eff6ff', color:p.admission_type==='emergency'?'#dc2626':'#2563eb', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, textTransform:'capitalize' }}>{p.admission_type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
