import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiUsers, FiToggleLeft, FiToggleRight, FiShield } from 'react-icons/fi';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'hospital_staff' });
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();

  const fetch = () => { authAPI.getStaff().then(r=>setStaff(r.data.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await authAPI.register({ ...form, hospital_id: user.hospital_id });
      toast.success(`${form.name} added as ${form.role}!`);
      setShowAdd(false); setForm({ name:'', email:'', password:'', phone:'', role:'hospital_staff' }); fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally { setAdding(false); }
  };

  const roleColors = { hospital_admin:{bg:'#fef2f2',color:'#dc2626'}, hospital_staff:{bg:'#eff6ff',color:'#2563eb'}, super_admin:{bg:'#f5f3ff',color:'#7c3aed'} };
  const roleIcons = { hospital_admin:'👨‍⚕️', hospital_staff:'👩‍⚕️', super_admin:'🛡️' };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:10 }}>
            <FiUsers color="#dc2626" size={24} /> Staff Management
          </h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>{staff.length} staff members</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
          <FiPlus size={15} /> Add Staff
        </button>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Hospital</th><th>Last Login</th><th>Status</th></tr></thead>
            <tbody>
              {staff.map(s=>(
                <tr key={s.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, background:'linear-gradient(135deg,#dc2626,#9f1239)', borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>{s.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight:600, color:'#0f172a' }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color:'#64748b' }}>{s.email}</td>
                  <td style={{ color:'#64748b' }}>{s.phone||'—'}</td>
                  <td><span style={{ background:roleColors[s.role]?.bg||'#f1f5f9', color:roleColors[s.role]?.color||'#64748b', padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:700, textTransform:'capitalize' }}>{roleIcons[s.role]} {s.role.replace(/_/g,' ')}</span></td>
                  <td style={{ fontSize:13, color:'#64748b' }}>{s.hospital_name||'—'}</td>
                  <td style={{ fontSize:12, color:'#94a3b8' }}>{s.last_login ? new Date(s.last_login).toLocaleString() : 'Never'}</td>
                  <td><span style={{ background:s.is_active?'#dcfce7':'#fef2f2', color:s.is_active?'#16a34a':'#dc2626', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>{s.is_active?'ACTIVE':'INACTIVE'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <h2 className="modal-title">Add New Staff Member</h2>
            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label className="form-label">Full Name</label><input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Dr. Name" className="form-input" style={{ marginTop:6 }} /></div>
                <div><label className="form-label">Phone</label><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 xxxxxxxxxx" className="form-input" style={{ marginTop:6 }} /></div>
              </div>
              <div><label className="form-label">Email Address</label><input required type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="staff@hospital.com" className="form-input" style={{ marginTop:6 }} /></div>
              <div><label className="form-label">Password</label><input required type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Min 8 characters" className="form-input" style={{ marginTop:6 }} /></div>
              <div>
                <label className="form-label">Role</label>
                <div style={{ display:'flex', gap:10, marginTop:6 }}>
                  {[['hospital_staff','Staff (Limited)'],['hospital_admin','Admin (Full Access)']].map(([val,label])=>(
                    <button type="button" key={val} onClick={()=>setForm(p=>({...p,role:val}))} style={{ flex:1, padding:'11px', border:`2px solid ${form.role===val?'#dc2626':'#e2e8f0'}`, borderRadius:10, background:form.role===val?'#fef2f2':'#fff', color:form.role===val?'#dc2626':'#475569', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      {val==='hospital_admin'?'👨‍⚕️':'👩‍⚕️'} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{ padding:'11px 24px', background:'#f1f5f9', border:'none', borderRadius:10, color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={adding} style={{ padding:'11px 28px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:adding?'not-allowed':'pointer', opacity:adding?.6:1, boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
                  {adding ? 'Adding...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
