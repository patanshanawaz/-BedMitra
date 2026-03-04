import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI, wardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUserPlus, FiSearch, FiUserCheck, FiAlertCircle } from 'react-icons/fi';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status:'admitted', ward_id:'' });
  const [wards, setWards] = useState([]);
  const [dischargeModal, setDischargeModal] = useState(null);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [discharging, setDischarging] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const hospitalId = user?.hospital_id;

  const fetchPatients = useCallback(() => {
    setLoading(true);
    patientAPI.getAll(hospitalId, { status: filter.status, ward_id: filter.ward_id, limit:100 })
      .then(r => setPatients(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hospitalId, filter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { if (hospitalId) wardAPI.getAll(hospitalId).then(r=>setWards(r.data.data)).catch(()=>{}); }, [hospitalId]);

  const handleDischarge = async () => {
    setDischarging(true);
    try {
      await patientAPI.discharge(hospitalId, dischargeModal.id, { discharge_notes: dischargeNotes, status:'discharged' });
      toast.success(`${dischargeModal.name} discharged successfully`);
      setDischargeModal(null); setDischargeNotes('');
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discharge failed');
    } finally { setDischarging(false); }
  };

  const filtered = patients.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.diagnosis?.toLowerCase().includes(search.toLowerCase()));

  const admTypeColor = { emergency:{bg:'#fef2f2',color:'#dc2626'}, planned:{bg:'#eff6ff',color:'#2563eb'}, transfer:{bg:'#f5f3ff',color:'#7c3aed'} };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif' }}>Patient Management</h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>{filtered.length} patients {filter.status}</p>
        </div>
        <Link to="/hospital/patients/admit" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
          <FiUserPlus size={15} /> Admit Patient
        </Link>
      </div>

      {/* Filters */}
      <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', display:'flex', gap:12, marginBottom:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,.05)', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'2', minWidth:200 }}>
          <FiSearch size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients..." style={{ width:'100%', padding:'9px 14px 9px 32px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['admitted','discharged','all'].map(s => (
            <button key={s} onClick={()=>setFilter(p=>({...p,status:s==='all'?'':s}))} style={{ padding:'8px 14px', borderRadius:8, border:'none', background:filter.status===(s==='all'?'':s)?'#0f172a':'#f1f5f9', color:filter.status===(s==='all'?'':s)?'#fff':'#475569', fontWeight:600, fontSize:13, cursor:'pointer', textTransform:'capitalize', transition:'all .2s' }}>
              {s}
            </button>
          ))}
        </div>
        <select value={filter.ward_id} onChange={e=>setFilter(p=>({...p,ward_id:e.target.value}))} style={{ padding:'9px 14px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', background:'#fff', cursor:'pointer' }}>
          <option value="">All Wards</option>
          {wards.map(w=><option key={w.id} value={w.id}>{w.ward_name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <FiAlertCircle size={48} color="#cbd5e1" style={{ marginBottom:16 }} />
          <p style={{ color:'#94a3b8', fontSize:16 }}>No patients found</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Patient Name</th><th>Age/Gender</th><th>Blood</th><th>Ward</th><th>Bed</th><th>Diagnosis</th><th>Admitted</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p,i) => (
                <tr key={p.id}>
                  <td style={{ color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight:700, color:'#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{p.contact_number}</div>
                  </td>
                  <td style={{ color:'#64748b' }}>{p.age||'?'}y · {p.gender}</td>
                  <td><span style={{ background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:700 }}>{p.blood_group||'?'}</span></td>
                  <td><span style={{ fontSize:12, fontWeight:600, color:'#7c3aed', background:'#f5f3ff', padding:'2px 8px', borderRadius:6 }}>{p.ward_type?.replace(/_/g,' ')}</span></td>
                  <td><span style={{ fontFamily:'monospace', fontWeight:700, color:'#2563eb', fontSize:13 }}>{p.bed_number||'—'}</span></td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#64748b', fontSize:13 }}>{p.diagnosis||'—'}</td>
                  <td style={{ color:'#94a3b8', fontSize:12 }}>{new Date(p.admitted_at).toLocaleDateString()}</td>
                  <td><span style={{ background:admTypeColor[p.admission_type]?.bg||'#f1f5f9', color:admTypeColor[p.admission_type]?.color||'#64748b', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, textTransform:'capitalize' }}>{p.admission_type}</span></td>
                  <td><span style={{ background:p.status==='admitted'?'#dcfce7':'#f1f5f9', color:p.status==='admitted'?'#16a34a':'#64748b', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{p.status}</span></td>
                  <td>
                    {p.status === 'admitted' && (
                      <button onClick={()=>{ setDischargeModal(p); setDischargeNotes(''); }} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}>
                        <FiUserCheck size={12} /> Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discharge Modal */}
      {dischargeModal && (
        <div className="modal-overlay" onClick={()=>setDischargeModal(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <h2 className="modal-title">Discharge Patient</h2>
            <div style={{ background:'#eff6ff', borderRadius:12, padding:'14px 16px', marginBottom:20, border:'1px solid #bfdbfe' }}>
              <div style={{ fontWeight:700, color:'#0f172a', fontSize:16 }}>{dischargeModal.name}</div>
              <div style={{ color:'#64748b', fontSize:13 }}>{dischargeModal.age}y · {dischargeModal.gender} · {dischargeModal.ward_name} · Bed {dischargeModal.bed_number}</div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:8 }}>Discharge Notes (optional)</label>
              <textarea value={dischargeNotes} onChange={e=>setDischargeNotes(e.target.value)} placeholder="Reason for discharge, follow-up instructions..." rows={3} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical' }} onFocus={e=>e.target.style.borderColor='#2563eb'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>setDischargeModal(null)} style={{ padding:'11px 24px', background:'#f1f5f9', border:'none', borderRadius:10, color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleDischarge} disabled={discharging} style={{ padding:'11px 28px', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:discharging?'not-allowed':'pointer', opacity:discharging?.6:1, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(37,99,235,.35)' }}>
                <FiUserCheck size={15} /> {discharging ? 'Discharging...' : 'Confirm Discharge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
