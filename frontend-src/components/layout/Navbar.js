import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { connected } = useSocket();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">🏥</div>
            <div className="logo-text">
              Bed<span>Mitra</span>
            </div>
          </Link>

          <div className="navbar-nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/hospitals" className={`nav-link ${isActive('/hospitals') ? 'active' : ''}`}>
              Find Hospital
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === 'super_admin' ? (
                  <Link to="/admin/dashboard" className={`nav-link ${location.pathname.includes('/admin') ? 'active' : ''}`}>
                    Admin Panel
                  </Link>
                ) : (
                  <Link to={`/hospital/${user?.hospital_id}/dashboard`} className="nav-link">
                    Dashboard
                  </Link>
                )}
                <div className="nav-live-badge">
                  <div className={`live-dot ${connected ? '' : 'offline'}`}></div>
                  {connected ? 'LIVE' : 'OFFLINE'}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  style={{ marginLeft: '8px' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className={`nav-live-badge ${connected ? '' : 'disconnected'}`}>
                  <div className={`live-dot ${connected ? '' : 'offline'}`}></div>
                  {connected ? 'LIVE Updates' : 'Connecting...'}
                </div>
                <Link to="/login" className="btn btn-primary btn-sm" style={{ marginLeft: '8px' }}>
                  Hospital Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
