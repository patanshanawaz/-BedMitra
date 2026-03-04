//addhospitalpage
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';

export default function AddHospitalPage() {
  const [form, setForm] = useState({ name:'', registration_number:'', address:'', city_id:'', pincode:'', phone:'', emergency_phone:'', email:'', website:'', latitude:'', longitude:'', type:'private', accreditation:'', total_beds:'', description:'' });
  const [adminForm, setAdminForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdHospitalId, setCreatedHospitalId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { hospitalAPI.getCities().then(r=>setCities(r.data.data)).catch(()=>{}); }, []);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const handleCreateHospital = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await hospitalAPI.create(form);
      setCreatedHospitalId(res.data.hospitalId);
      toast.success('Hospital created! Now add admin user.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create hospital');
    } finally { setLoading(false); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register({ ...adminForm, role:'hospital_admin', hospital_id: createdHospitalId });
      toast.success('Hospital and admin created successfully!');
      navigate('/admin/hospitals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally { setLoading(false); }
  };

  const fieldStyle = { padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', width:'100%', background:'#fff', color:'#334155', transition:'border-color .2s' };
  const labelStyle = { fontSize:13, fontWeight:600, color:'#475569', marginBottom:6, display:'block' };
  const sectionStyle = { background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)', marginBottom:20 };

  return (
    <div style={{ padding:28, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button onClick={()=>navigate('/admin/hospitals')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#f1f5f9', border:'none', borderRadius:9, color:'#475569', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          <FiArrowLeft size={15} /> Back
        </button>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:10 }}>
            <MdLocalHospital color="#7c3aed" size={26} /> Add New Hospital
          </h1>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', gap:0, marginBottom:28 }}>
        {['Hospital Details','Admin Account'].map((s,i)=>(
          <div key={s} style={{ flex:1, textAlign:'center', padding:'12px', background:step===i+1?'linear-gradient(135deg,#7c3aed,#4f46e5)':step>i+1?'#dcfce7':'#f8fafc', borderRadius:i===0?'12px 0 0 12px':'0 12px 12px 0', border:`1px solid ${step===i+1?'transparent':step>i+1?'#bbf7d0':'#e2e8f0'}` }}>
            <div style={{ fontWeight:700, fontSize:14, color:step===i+1?'#fff':step>i+1?'#16a34a':'#94a3b8' }}>{step>i+1?'✅ ':''}{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleCreateHospital}>
          <div style={sectionStyle}>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>🏥 Basic Information</h2>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>Hospital Name *</label><input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Apollo Hospitals" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>Registration No. *</label><input required value={form.registration_number} onChange={e=>set('registration_number',e.target.value)} placeholder="REG-2024-001" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={labelStyle}>Address *</label><input required value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Full address" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <div><label style={labelStyle}>City *</label>
                <select required value={form.city_id} onChange={e=>set('city_id',e.target.value)} style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}>
                  <option value="">Select City</option>
                  {cities.map(c=><option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Pincode</label><input value={form.pincode} onChange={e=>set('pincode',e.target.value)} placeholder="500001" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)} style={fieldStyle}>
                  <option value="private">Private</option><option value="government">Government</option><option value="trust">Trust</option><option value="clinic">Clinic</option>
                </select>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>📞 Contact Information</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>Main Phone *</label><input required value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="040-12345678" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>Emergency Phone *</label><input required value={form.emergency_phone} onChange={e=>set('emergency_phone',e.target.value)} placeholder="040-12345679" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="info@hospital.com" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>Website</label><input value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://hospital.com" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>📋 Additional Details</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>Total Beds</label><input type="number" value={form.total_beds} onChange={e=>set('total_beds',e.target.value)} placeholder="500" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>Accreditation</label><input value={form.accreditation} onChange={e=>set('accreditation',e.target.value)} placeholder="NABH, JCI" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>GPS Latitude</label><input type="number" step="any" value={form.latitude} onChange={e=>set('latitude',e.target.value)} placeholder="17.3850" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            </div>
            <div><label style={labelStyle}>Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Brief hospital description..." rows={3} style={{ ...fieldStyle, resize:'vertical' }} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button type="submit" disabled={loading} style={{ padding:'13px 36px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?.6:1, boxShadow:'0 6px 20px rgba(124,58,237,.4)' }}>
              {loading ? 'Creating...' : 'Create Hospital → Next'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleCreateAdmin}>
          <div style={sectionStyle}>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:6 }}>👨‍⚕️ Hospital Admin Account</h2>
            <p style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Create the primary admin account for this hospital. They'll use these credentials to login and manage ICU beds.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>Admin Full Name *</label><input required value={adminForm.name} onChange={e=>setAdminForm(p=>({...p,name:e.target.value}))} placeholder="Dr. Admin Name" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
              <div><label style={labelStyle}>Phone</label><input value={adminForm.phone} onChange={e=>setAdminForm(p=>({...p,phone:e.target.value}))} placeholder="+91 xxxxxxxxxx" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={labelStyle}>Email Address *</label><input required type="email" value={adminForm.email} onChange={e=>setAdminForm(p=>({...p,email:e.target.value}))} placeholder="admin@hospital.com" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
            <div><label style={labelStyle}>Password *</label><input required type="password" value={adminForm.password} onChange={e=>setAdminForm(p=>({...p,password:e.target.value}))} placeholder="Min 8 characters" style={fieldStyle} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} /></div>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" onClick={()=>navigate('/admin/hospitals')} style={{ padding:'13px 24px', background:'#f1f5f9', border:'none', borderRadius:12, color:'#475569', fontSize:14, fontWeight:600, cursor:'pointer' }}>Skip for Now</button>
            <button type="submit" disabled={loading} style={{ padding:'13px 36px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?.6:1, boxShadow:'0 6px 20px rgba(124,58,237,.4)' }}>
              {loading ? 'Creating...' : '✅ Complete Setup'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
