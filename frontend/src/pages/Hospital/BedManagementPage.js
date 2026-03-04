import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bedAPI, wardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

const statusColors = { available:'#16a34a', occupied:'#dc2626', maintenance:'#d97706', reserved:'#2563eb' };
const statusBg = { available:'#dcfce7', occupied:'#fef2f2', maintenance:'#fffbeb', reserved:'#eff6ff' };
const statusBorder = { available:'#bbf7d0', occupied:'#fecaca', maintenance:'#fde68a', reserved:'#bfdbfe' };
const statusIcon = { available:'✅', occupied:'🟥', maintenance:'🔧', reserved:'🔵' };

export default function BedManagementPage() {
  const { wardId } = useParams();
  const [beds, setBeds] = useState([]);
  const [ward, setWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const hospitalId = user?.hospital_id;

  const fetchBeds = () => {
    bedAPI.getAll(wardId)
      .then(r => setBeds(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBeds();
    if (hospitalId) {
      wardAPI.getAll(hospitalId).then(r => {
        const w = r.data.data.find(w => w.id === parseInt(wardId));
        setWard(w);
      }).catch(() => {});
    }
  }, [wardId]);

  useEffect(() => {
    if (!socket) return;
    const h = () => fetchBeds();
    socket.on('bed_count_update', h);
    return () => socket.off('bed_count_update', h);
  }, [socket]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !statusModal) return;
    setUpdating(true);
    try {
      await bedAPI.updateStatus(wardId, statusModal.id, { status: newStatus, notes });
      toast.success(`Bed ${statusModal.bed_number} → ${newStatus}`);
      setStatusModal(null); setNotes(''); setNewStatus('');
      fetchBeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const grouped = {
    available: beds.filter(b=>b.status==='available'),
    occupied: beds.filter(b=>b.status==='occupied'),
    maintenance: beds.filter(b=>b.status==='maintenance'),
    reserved: beds.filter(b=>b.status==='reserved'),
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate('/hospital/wards')} style={{ width:38, height:38, border:'1px solid #e2e8f0', borderRadius:9, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', fontFamily:'Poppins,sans-serif' }}>
              Bed Management — {ward?.ward_name || 'Ward'}
            </h1>
            <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>{beds.length} beds total · Click a bed to change status</p>
          </div>
        </div>
        <button onClick={fetchBeds} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, color:'#475569', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        {Object.entries(grouped).map(([status,list])=>(
          <div key={status} style={{ background:statusBg[status], border:`1px solid ${statusBorder[status]}`, borderRadius:13, padding:'14px 20px', minWidth:140 }}>
            <div style={{ fontSize:22, fontWeight:900, color:statusColors[status], fontFamily:'Poppins,sans-serif' }}>{list.length}</div>
            <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, textTransform:'capitalize' }}>{statusIcon[status]} {status}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div>
          {/* Legend */}
          <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
            {Object.entries(statusColors).map(([s,c])=>(
              <div key={s} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b' }}>
                <div style={{ width:12, height:12, borderRadius:3, background:c }} />
                <span style={{ textTransform:'capitalize', fontWeight:500 }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Bed grid */}
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
            <div className="bed-grid">
              {beds.map(bed => (
                <div key={bed.id} className={`bed-cell ${bed.status}`}
                  onClick={()=>{ setStatusModal(bed); setNewStatus(bed.status); setNotes(''); }}
                  title={bed.status==='occupied'?`Patient: ${bed.patient_name||'Unknown'}`:`Bed ${bed.bed_number}`}
                >
                  <div className="bed-number">{bed.bed_number}</div>
                  <div className="bed-status-label">{bed.status}</div>
                  {bed.status==='occupied' && bed.patient_name && (
                    <div style={{ fontSize:9, marginTop:2, opacity:.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {bed.patient_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status update modal */}
      {statusModal && (
        <div className="modal-overlay" onClick={()=>setStatusModal(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ maxWidth:420 }}>
            <h2 className="modal-title">Update Bed: {statusModal.bed_number}</h2>

            {statusModal.status === 'occupied' && statusModal.patient_name && (
              <div style={{ background:'#fef2f2', borderRadius:10, padding:'12px 14px', marginBottom:16, border:'1px solid #fecaca' }}>
                <div style={{ fontSize:13, color:'#dc2626', fontWeight:700 }}>Currently occupied by</div>
                <div style={{ fontSize:14, color:'#0f172a', fontWeight:600, marginTop:2 }}>{statusModal.patient_name}</div>
                {statusModal.patient_admitted_at && <div style={{ fontSize:11, color:'#94a3b8' }}>Since {new Date(statusModal.patient_admitted_at).toLocaleDateString()}</div>}
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:10 }}>Change Status To:</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {['available','occupied','maintenance','reserved'].map(s => (
                  <button key={s} type="button" onClick={()=>setNewStatus(s)} style={{ padding:'11px', border:`2px solid ${newStatus===s?statusColors[s]:'#e2e8f0'}`, borderRadius:10, background:newStatus===s?statusBg[s]:'#fff', color:newStatus===s?statusColors[s]:'#475569', fontWeight:700, fontSize:13, cursor:'pointer', textTransform:'capitalize', transition:'all .2s' }}>
                    {statusIcon[s]} {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:6 }}>Notes (optional)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Reason for status change..." rows={2} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', resize:'none' }} />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setStatusModal(null)} style={{ padding:'10px 22px', background:'#f1f5f9', border:'none', borderRadius:9, color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleStatusUpdate} disabled={updating||!newStatus} style={{ padding:'10px 24px', background:`linear-gradient(135deg,${statusColors[newStatus]||'#475569'},${statusColors[newStatus]||'#64748b'})`, border:'none', borderRadius:9, color:'#fff', fontWeight:700, cursor:updating?'not-allowed':'pointer', opacity:updating?.6:1 }}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
