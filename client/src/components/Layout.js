import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h2>✈️ Airport System</h2>
          </div>
          <div className="navbar-menu">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link to="/clients" className={`nav-link ${isActive('/clients') || location.pathname.startsWith('/clients/') ? 'active' : ''}`}>
              Clients
            </Link>
            <Link to="/tickets" className={`nav-link ${isActive('/tickets') || location.pathname.startsWith('/tickets/') ? 'active' : ''}`}>
              Tickets
            </Link>
          </div>
          <div className="navbar-user">
            <span className="user-name">{user?.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
