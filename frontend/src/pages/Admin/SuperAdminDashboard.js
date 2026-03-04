import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiActivity, FiHome, FiUsers, FiMap } from 'react-icons/fi';

const COLORS = ['#dc2626','#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#ea580c'];

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getSuperAdmin().then(r=>setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const d = data || {};
  const o = d.overallStats || {};

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif' }}>Platform Overview</h1>
          <p style={{ color:'#64748b', fontSize:14, marginTop:2 }}>All cities · All hospitals · Live data</p>
        </div>
        <Link to="/admin/hospitals/add" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(124,58,237,.4)' }}>
          + Add Hospital
        </Link>
      </div>

      {/* Overall stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        {[
          { label:'Total Hospitals', val:o.total_hospitals||0, color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', icon:FiHome },
          { label:'Total ICU Beds', val:o.total_icu_beds||0, color:'#0f172a', bg:'#f8fafc', border:'#e2e8f0', icon:FiActivity },
          { label:'Available Beds', val:o.total_available||0, color:'#16a34a', bg:'#dcfce7', border:'#bbf7d0', icon:FiActivity },
          { label:'Occupied Beds', val:o.total_occupied||0, color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:FiUsers },
          { label:'Occupancy Rate', val:`${o.overall_occupancy||0}%`, color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:FiMap },
        ].map(({label,val,color,bg,border,icon:Icon})=>(
          <div key={label} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:16, padding:'20px 22px', boxShadow:'0 3px 12px rgba(0,0,0,.05)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
              <Icon size={16} color={color} />
            </div>
            <div style={{ fontSize:36, fontWeight:900, color, fontFamily:'Poppins,sans-serif' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:20, marginBottom:24 }}>
        {/* City bar chart */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:20 }}>🏙️ ICU Availability by City</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={d.cityStats||[]} margin={{ top:5,right:10,left:-20,bottom:0 }}>
              <XAxis dataKey="city" tick={{ fontSize:11, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius:10, border:'1px solid #e2e8f0', fontSize:12 }} />
              <Bar dataKey="available_beds" fill="#16a34a" name="Available" radius={[5,5,0,0]} />
              <Bar dataKey="total_beds" fill="#e2e8f0" name="Total" radius={[5,5,0,0]} />
              <Legend wrapperStyle={{ fontSize:12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ward type pie */}
        <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:10 }}>🏥 Ward Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={(d.wardTypeDistribution||[]).map(w=>({...w,name:w.ward_type.replace(/_/g,' ')}))} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={85} paddingAngle={3}>
                {(d.wardTypeDistribution||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius:10, border:'none', fontSize:12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* City table */}
      <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)', marginBottom:20 }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:16 }}>🌆 City-wise Summary</h3>
        <div className="table-wrap" style={{ borderRadius:12 }}>
          <table>
            <thead><tr><th>City</th><th>State</th><th>Hospitals</th><th>Total Beds</th><th>Available</th><th>Occupancy</th><th>Status</th></tr></thead>
            <tbody>
              {(d.cityStats||[]).map(c=>(
                <tr key={c.city}>
                  <td style={{ fontWeight:700, color:'#0f172a' }}>{c.city}</td>
                  <td style={{ color:'#64748b' }}>{c.state}</td>
                  <td><span style={{ background:'#f5f3ff', color:'#7c3aed', padding:'2px 8px', borderRadius:6, fontWeight:700, fontSize:12 }}>{c.hospitals}</span></td>
                  <td style={{ fontWeight:600, color:'#334155' }}>{c.total_beds}</td>
                  <td><span style={{ fontWeight:700, color:'#16a34a', fontSize:15 }}>{c.available_beds}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:999, overflow:'hidden', minWidth:60 }}>
                        <div style={{ height:'100%', width:`${c.occupancy||0}%`, background:c.occupancy>=90?'#dc2626':c.occupancy>=70?'#d97706':'#16a34a', borderRadius:999 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:c.occupancy>=90?'#dc2626':c.occupancy>=70?'#d97706':'#16a34a' }}>{c.occupancy}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:c.available_beds>0?'#dcfce7':'#fef2f2', color:c.available_beds>0?'#16a34a':'#dc2626' }}>
                      {c.available_beds>0?'Available':'Full'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top hospitals */}
      <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>🏆 Hospitals by Occupancy (Highest First)</h3>
          <Link to="/admin/hospitals" style={{ fontSize:12, color:'#7c3aed', fontWeight:600, textDecoration:'none' }}>View All →</Link>
        </div>
        <div className="table-wrap" style={{ borderRadius:12 }}>
          <table>
            <thead><tr><th>Rank</th><th>Hospital</th><th>City</th><th>Available</th><th>Occupancy</th></tr></thead>
            <tbody>
              {(d.topHospitals||[]).map((h,i)=>(
                <tr key={h.id}>
                  <td style={{ color:'#94a3b8', fontWeight:700 }}>#{i+1}</td>
                  <td style={{ fontWeight:700, color:'#0f172a' }}>{h.name}</td>
                  <td style={{ color:'#64748b' }}>{h.city}</td>
                  <td><span style={{ fontWeight:700, color:h.available_beds>0?'#16a34a':'#dc2626', fontSize:16, fontFamily:'Poppins,sans-serif' }}>{h.available_beds}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:80, height:6, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${h.occupancy||0}%`, background:h.occupancy>=90?'#dc2626':h.occupancy>=70?'#d97706':'#16a34a', borderRadius:999 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:h.occupancy>=90?'#dc2626':h.occupancy>=70?'#d97706':'#16a34a' }}>{h.occupancy||0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
