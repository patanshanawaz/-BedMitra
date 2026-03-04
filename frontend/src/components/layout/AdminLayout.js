import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { FiHome, FiList, FiPlusCircle, FiLogOut, FiMenu, FiX, FiWifi, FiWifiOff, FiUsers } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';

const navItems = [
  { to: '/admin/dashboard', icon: FiHome, label: 'Overview' },
  { to: '/admin/hospitals', icon: FiList, label: 'All Hospitals' },
  { to: '/admin/hospitals/add', icon: FiPlusCircle, label: 'Add Hospital' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={{ width: open ? 260 : 72, background: 'linear-gradient(180deg,#1e1b4b,#312e81)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, transition: 'width .3s', overflowX: 'hidden', boxShadow: '4px 0 20px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MdLocalHospital size={22} color="#fff" />
          </div>
          {open && <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'Poppins,sans-serif', whiteSpace: 'nowrap' }}>BedMitra</div>
            <div style={{ color: '#a5b4fc', fontSize: 11, whiteSpace: 'nowrap' }}>Super Admin</div>
          </div>}
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin/dashboard'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, textDecoration: 'none', transition: 'all .2s',
                background: isActive ? 'rgba(124,58,237,.25)' : 'transparent',
                borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.55)', fontWeight: isActive ? 600 : 400, fontSize: 14,
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {open && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {open && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 8, borderRadius: 8, background: connected ? 'rgba(22,163,74,.15)' : 'rgba(220,38,38,.15)' }}>
              {connected ? <FiWifi size={14} color="#4ade80" /> : <FiWifiOff size={14} color="#f87171" />}
              <span style={{ fontSize: 12, color: connected ? '#4ade80' : '#f87171', fontWeight: 600 }}>{connected ? 'Live' : 'Offline'}</span>
            </div>
          )}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', width: '100%', fontSize: 14 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,.2)'; e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}
          >
            <FiLogOut size={18} style={{ flexShrink: 0 }} />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: open ? 260 : 72, flex: 1, transition: 'margin-left .3s', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <button onClick={() => setOpen(v => !v)} style={{ width: 36, height: 36, border: '1px solid #e2e8f0', borderRadius: 8, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            {open ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '4px 12px', borderRadius: 999 }}>Super Admin</span>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
