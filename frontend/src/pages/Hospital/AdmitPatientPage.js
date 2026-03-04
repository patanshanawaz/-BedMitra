import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, wardAPI, bedAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUserPlus, FiArrowLeft } from 'react-icons/fi';

const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const admissionTypes = ['emergency','planned','transfer'];

export default function AdmitPatientPage() {
  const [form, setForm] = useState({ name:'', age:'', gender:'male', blood_group:'', contact_number:'', emergency_contact:'', address:'', diagnosis:'', admission_type:'emergency', ward_id:'', bed_id:'', notes:'' });
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const hospitalId = user?.hospital_id;

  useEffect(() => {
    if (hospitalId) wardAPI.getAll(hospitalId).then(r=>setWards(r.data.data.filter(w=>w.is_active))).catch(()=>{});
  }, [hospitalId]);

  useEffect(() => {
    if (form.ward_id) {
      bedAPI.getAvailable(form.ward_id).then(r=>setBeds(r.data.data)).catch(()=>setBeds([]));
    } else setBeds([]);
  }, [form.ward_id]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.ward_id) { toast.error('Name and Ward are required'); return; }
    setLoading(true);
    try {
      await patientAPI.admit(hospitalId, { ...form, hospital_id: hospitalId, age: parseInt(form.age)||undefined });
      toast.success(`Patient ${form.name} admitted successfully!`);
      navigate('/hospital/patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admission failed');
    } finally { setLoading(false); }
  };

  const fieldStyle = { padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', width:'100%', background:'#fff', color:'#334155', transition:'border-color .2s' };
  const labelStyle = { fontSize:13, fontWeight:600, color:'#475569', marginBottom:6, display:'block' };
  const groupStyle = { display:'flex', flexDirection:'column', gap:0 };
  const sectionStyle = { background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)', marginBottom:20 };

  return (
    <div style={{ padding:28, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button onClick={()=>navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#f1f5f9', border:'none', borderRadius:9, color:'#475569', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          <FiArrowLeft size={15} /> Back
        </button>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:10 }}>
            <FiUserPlus color="#dc2626" size={24} /> Admit New Patient
          </h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>Fill patient details and assign ICU ward/bed</p>
        </div>
      </div>

      {/* Emergency type banner */}
      {form.admission_type === 'emergency' && (
        <div style={{ background:'linear-gradient(135deg,#fef2f2,#fee2e2)', border:'2px solid #fecaca', borderRadius:12, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>🚨</span>
          <div>
            <div style={{ fontWeight:700, color:'#dc2626', fontSize:15 }}>Emergency Admission</div>
            <div style={{ fontSize:13, color:'#9f1239' }}>Priority admission — bed will be marked occupied immediately upon submission.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Admission type */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>📋 Admission Type</h2>
          <div style={{ display:'flex', gap:10 }}>
            {admissionTypes.map(t => (
              <button type="button" key={t} onClick={()=>set('admission_type',t)} style={{ flex:1, padding:'12px', borderRadius:10, border:`2px solid ${form.admission_type===t?'#dc2626':'#e2e8f0'}`, background:form.admission_type===t?'#fef2f2':'#fff', color:form.admission_type===t?'#dc2626':'#475569', fontWeight:700, fontSize:14, cursor:'pointer', textTransform:'capitalize', transition:'all .2s' }}>
                {t==='emergency'?'🚨':t==='planned'?'📅':'🔄'} {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Patient Info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>👤 Patient Information</h2>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>
            <div style={groupStyle}><label style={labelStyle}>Full Name *</label><input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Patient full name" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            <div style={groupStyle}><label style={labelStyle}>Age</label><input type="number" min="0" max="120" value={form.age} onChange={e=>set('age',e.target.value)} placeholder="Years" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            <div style={groupStyle}><label style={labelStyle}>Gender</label>
              <select value={form.gender} onChange={e=>set('gender',e.target.value)} style={fieldStyle}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            <div style={groupStyle}><label style={labelStyle}>Blood Group</label>
              <select value={form.blood_group} onChange={e=>set('blood_group',e.target.value)} style={fieldStyle}>
                <option value="">Unknown</option>{bloodGroups.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={groupStyle}><label style={labelStyle}>Contact Number</label><input value={form.contact_number} onChange={e=>set('contact_number',e.target.value)} placeholder="Patient / relative phone" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            <div style={groupStyle}><label style={labelStyle}>Emergency Contact</label><input value={form.emergency_contact} onChange={e=>set('emergency_contact',e.target.value)} placeholder="Emergency phone" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
          </div>
          <div style={{ marginTop:14 }}>
            <label style={labelStyle}>Address</label>
            <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Patient address" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
          </div>
        </div>

        {/* Medical */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>🩺 Medical Details</h2>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Diagnosis / Condition</label>
            <textarea value={form.diagnosis} onChange={e=>set('diagnosis',e.target.value)} placeholder="Describe the medical condition or diagnosis..." rows={3} style={{ ...fieldStyle, resize:'vertical' }} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
          </div>
          <div>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any additional clinical notes..." rows={2} style={{ ...fieldStyle, resize:'vertical' }} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
          </div>
        </div>

        {/* Ward & Bed */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>🏥 Ward & Bed Assignment</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={groupStyle}>
              <label style={labelStyle}>ICU Ward *</label>
              <select required value={form.ward_id} onChange={e=>set('ward_id',e.target.value)} style={fieldStyle}>
                <option value="">Select Ward...</option>
                {wards.map(w=><option key={w.id} value={w.id} disabled={w.available_beds===0}>{w.ward_name} ({w.available_beds} available)</option>)}
              </select>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Specific Bed (Optional)</label>
              <select value={form.bed_id} onChange={e=>set('bed_id',e.target.value)} style={fieldStyle} disabled={!form.ward_id}>
                <option value="">Auto-assign</option>
                {beds.map(b=><option key={b.id} value={b.id}>{b.bed_number}</option>)}
              </select>
            </div>
          </div>
          {form.ward_id && beds.length === 0 && (
            <div style={{ marginTop:10, padding:'10px 14px', background:'#fef2f2', borderRadius:10, border:'1px solid #fecaca', color:'#dc2626', fontSize:13, fontWeight:600 }}>
              ⚠️ No available beds in this ward. Please select another ward.
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button type="button" onClick={()=>navigate(-1)} style={{ padding:'13px 28px', background:'#f1f5f9', border:'none', borderRadius:11, color:'#475569', fontSize:15, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding:'13px 36px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:11, color:'#fff', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?.6:1, boxShadow:'0 6px 20px rgba(220,38,38,.4)', display:'flex', alignItems:'center', gap:8 }}>
            <FiUserPlus size={17} /> {loading ? 'Admitting...' : 'Admit Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
