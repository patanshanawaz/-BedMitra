import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiGrid, FiEdit2 } from 'react-icons/fi';
import { MdBedroomParent } from 'react-icons/md';

const wardTypes = ['General_ICU','CCU','NICU','PICU','SICU','MICU','Burn_ICU','Trauma_ICU'];
const wardColors = { General_ICU:'#dc2626', CCU:'#e11d48', NICU:'#16a34a', PICU:'#2563eb', SICU:'#7c3aed', MICU:'#0891b2', Burn_ICU:'#ea580c', Trauma_ICU:'#d97706' };
const wardIcons = { General_ICU:'🏥', CCU:'❤️', NICU:'👶', PICU:'🧒', SICU:'🔬', MICU:'💊', Burn_ICU:'🔥', Trauma_ICU:'🚑' };

export default function WardManagementPage() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ward_type:'General_ICU', ward_name:'', total_beds:10, cost_per_day:'', features:'' });
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const hospitalId = user?.hospital_id;

  const fetch = () => { wardAPI.getAll(hospitalId).then(r=>setWards(r.data.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(() => { if (hospitalId) fetch(); }, [hospitalId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await wardAPI.create(hospitalId, form);
      toast.success(`${form.ward_name} ward created with ${form.total_beds} beds!`);
      setShowAdd(false); fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ward');
    } finally { setAdding(false); }
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:10 }}>
            <FiGrid color="#dc2626" size={24} /> Ward Management
          </h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>{wards.length} wards configured</p>
        </div>
        {user.role !== 'hospital_staff' && (
          <button onClick={()=>setShowAdd(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
            <FiPlus size={15} /> Add New Ward
          </button>
        )}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:18 }}>
          {wards.map(ward => {
            const pct = ward.total_beds ? Math.round((ward.occupied_beds/ward.total_beds)*100) : 0;
            const color = wardColors[ward.ward_type]||'#475569';
            return (
              <div key={ward.id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)', transition:'all .25s' }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,.1)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.06)'; }}
              >
                <div style={{ height:5, background:color }} />
                <div style={{ padding:'20px 20px 18px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:42, height:42, background:`${color}15`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                        {wardIcons[ward.ward_type]||'🏥'}
                      </div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{ward.ward_name}</div>
                        <div style={{ fontSize:11, color, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{ward.ward_type.replace(/_/g,' ')}</div>
                      </div>
                    </div>
                    <span style={{ background:ward.is_active?'#dcfce7':'#f1f5f9', color:ward.is_active?'#16a34a':'#94a3b8', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                      {ward.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                    {[{l:'Available',v:ward.available_beds,c:'#16a34a'},{l:'Occupied',v:ward.occupied_beds,c:'#dc2626'},{l:'Total',v:ward.total_beds,c:'#475569'}].map(({l,v,c})=>(
                      <div key={l} style={{ textAlign:'center', background:'#f8fafc', borderRadius:10, padding:'10px 6px' }}>
                        <div style={{ fontSize:24, fontWeight:900, color:c, fontFamily:'Poppins,sans-serif' }}>{v}</div>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, color:'#94a3b8' }}>Utilization</span>
                      <span style={{ fontSize:12, fontWeight:700, color }}>{pct}%</span>
                    </div>
                    <div style={{ height:6, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:999, transition:'width .5s' }} />
                    </div>
                  </div>

                  {ward.cost_per_day > 0 && <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>₹{ward.cost_per_day.toLocaleString()}/day</div>}

                  <div style={{ display:'flex', gap:8 }}>
                    <Link to={`/hospital/wards/${ward.id}/beds`} style={{ flex:1, padding:'9px', background:'linear-gradient(135deg,#0f172a,#1e293b)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'none', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      <MdBedroomParent size={14} /> Manage Beds
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Ward Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <h2 className="modal-title">Add New ICU Ward</h2>
            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label className="form-label">Ward Type</label>
                  <select value={form.ward_type} onChange={e=>setForm(p=>({...p,ward_type:e.target.value}))} className="form-input form-select" style={{ marginTop:6 }}>
                    {wardTypes.map(t=><option key={t} value={t}>{wardIcons[t]} {t.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Total Beds</label>
                  <input type="number" min="1" required value={form.total_beds} onChange={e=>setForm(p=>({...p,total_beds:parseInt(e.target.value)||1}))} className="form-input" style={{ marginTop:6 }} />
                </div>
              </div>
              <div>
                <label className="form-label">Ward Name</label>
                <input required value={form.ward_name} onChange={e=>setForm(p=>({...p,ward_name:e.target.value}))} placeholder="e.g. Apollo General ICU" className="form-input" style={{ marginTop:6 }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label className="form-label">Cost per Day (₹)</label>
                  <input type="number" value={form.cost_per_day} onChange={e=>setForm(p=>({...p,cost_per_day:e.target.value}))} placeholder="0" className="form-input" style={{ marginTop:6 }} />
                </div>
                <div>
                  <label className="form-label">Features (comma-separated)</label>
                  <input value={form.features} onChange={e=>setForm(p=>({...p,features:e.target.value}))} placeholder="Ventilator,Monitor" className="form-input" style={{ marginTop:6 }} />
                </div>
              </div>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                💡 {form.total_beds} beds will be automatically created for this ward.
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{ padding:'11px 24px', background:'#f1f5f9', border:'none', borderRadius:10, color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={adding} style={{ padding:'11px 28px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:adding?'not-allowed':'pointer', opacity:adding?.6:1, boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}>
                  {adding ? 'Creating...' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
