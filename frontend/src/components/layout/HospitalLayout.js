import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  FiHome, FiUsers, FiGrid, FiSettings, FiLogOut, FiMenu, FiX,
  FiActivity, FiAlertCircle, FiWifi, FiWifiOff, FiUserPlus
} from 'react-icons/fi';
import { MdLocalHospital, MdBedroomParent } from 'react-icons/md';

const navItems = [
  { to: '/hospital/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/hospital/patients', icon: FiUsers, label: 'Patients' },
  { to: '/hospital/patients/admit', icon: FiUserPlus, label: 'Admit Patient' },
  { to: '/hospital/wards', icon: FiGrid, label: 'Ward Management' },
  { to: '/hospital/staff', icon: FiSettings, label: 'Staff & Settings' },
];

export default function HospitalLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="page-layout" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 260 : 72,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        boxShadow: '4px 0 20px rgba(0,0,0,.15)',
        overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#dc2626,#991b1b)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MdLocalHospital size={22} color="#fff" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'Poppins,sans-serif', whiteSpace: 'nowrap' }}>BedMitra</div>
              <div style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>Hospital Portal</div>
            </div>
          )}
        </div>

        {/* Hospital info */}
        {sidebarOpen && user && (
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,.06)', margin: '0 12px 8px', background: 'rgba(255,255,255,.04)', borderRadius: 10, marginTop: 16 }}>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Logged in as</div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.hospital_name || 'System Admin'}</div>
          </div>
        )}

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/hospital/dashboard'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                borderRadius: 10, textDecoration: 'none', transition: 'all .2s',
                background: isActive ? 'linear-gradient(135deg,rgba(220,38,38,.25),rgba(220,38,38,.1))' : 'transparent',
                borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.55)',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {/* Connection status */}
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 8, borderRadius: 8, background: connected ? 'rgba(22,163,74,.15)' : 'rgba(220,38,38,.15)' }}>
              {connected ? <FiWifi size={14} color="#16a34a" /> : <FiWifiOff size={14} color="#dc2626" />}
              <span style={{ fontSize: 12, color: connected ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {connected ? 'Live Updates ON' : 'Reconnecting...'}
              </span>
            </div>
          )}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', width: '100%', fontSize: 14, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.15)'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}
          >
            <FiLogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: sidebarOpen ? 260 : 72, flex: 1, transition: 'margin-left .3s ease', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ width: 36, height: 36, border: '1px solid #e2e8f0', borderRadius: 8, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: connected ? '#dcfce7' : '#fef2f2', border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}` }}>
              <span className={`pulse ${connected ? 'pulse-green' : 'pulse-red'}`} />
              <span style={{ fontSize: 12, fontWeight: 600, color: connected ? '#16a34a' : '#dc2626' }}>
                {connected ? 'Real-time Active' : 'Disconnected'}
              </span>
            </div>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#dc2626,#9f1239)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page outlet */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
