import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';
import { FiSearch, FiPlus, FiEdit2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

export default function HospitalManagementPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');

  const fetch = () => {
    const params = {};
    if (city) params.city = city;
    if (search) params.search = search;
    params.limit = 100;
    hospitalAPI.getAll(params).then(r=>setHospitals(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(() => { fetch(); hospitalAPI.getCities().then(r=>setCities(r.data.data)).catch(()=>{}); }, []);
  useEffect(() => { fetch(); }, [city, search]);

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif' }}>Hospital Management</h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>{hospitals.length} hospitals registered</p>
        </div>
        <Link to="/admin/hospitals/add" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(124,58,237,.35)' }}>
          <FiPlus size={15} /> Add Hospital
        </Link>
      </div>

      <div style={{ background:'#fff', borderRadius:13, padding:'14px 18px', display:'flex', gap:12, marginBottom:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,.05)', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'2', minWidth:200 }}>
          <FiSearch size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospitals..." style={{ width:'100%', padding:'9px 14px 9px 32px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none' }} />
        </div>
        <select value={city} onChange={e=>setCity(e.target.value)} style={{ padding:'9px 14px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', background:'#fff', cursor:'pointer' }}>
          <option value="">All Cities</option>
          {cities.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Hospital Name</th><th>City</th><th>Type</th><th>ICU Beds</th><th>Available</th><th>Occupancy</th><th>Verified</th><th>Actions</th></tr></thead>
            <tbody>
              {hospitals.map((h,i)=>(
                <tr key={h.hospital_id}>
                  <td style={{ color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:6 }}>
                      {h.name}
                      {h.is_verified && <MdVerified size={14} color="#60a5fa" />}
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{h.address?.substring(0,40)}</div>
                  </td>
                  <td style={{ color:'#64748b' }}>{h.city}</td>
                  <td><span style={{ background:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{h.type}</span></td>
                  <td style={{ fontWeight:700, color:'#334155' }}>{h.total_icu_beds||0}</td>
                  <td><span style={{ fontWeight:900, fontSize:16, color:parseInt(h.total_available_beds||0)>0?'#16a34a':'#dc2626', fontFamily:'Poppins,sans-serif' }}>{h.total_available_beds||0}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:5, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${h.occupancy_percent||0}%`, background:h.occupancy_percent>=90?'#dc2626':h.occupancy_percent>=70?'#d97706':'#16a34a', borderRadius:999 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>{h.occupancy_percent||0}%</span>
                    </div>
                  </td>
                  <td>
                    {h.is_verified
                      ? <span style={{ color:'#16a34a', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}><FiCheckCircle size={13} /> Verified</span>
                      : <span style={{ color:'#d97706', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}><FiXCircle size={13} /> Pending</span>}
                  </td>
                  <td>
                    <Link to={`/admin/hospitals/${h.hospital_id}/dashboard`} style={{ padding:'6px 12px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
                      View Dashboard
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
