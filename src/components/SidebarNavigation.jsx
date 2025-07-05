import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaWpforms,
  FaMoneyCheckAlt,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaLock,
  FaRegSun,
  FaRegMoon,
  FaCheckCircle
} from 'react-icons/fa';
import logo from './logo.jfif';
import 'bootstrap/dist/css/bootstrap.min.css';

// Modern gradient and glassmorphism styles
const sidebarStyle = {
  width: 90,
  minWidth: 90,
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
  background: 'linear-gradient(160deg, #6366f1 0%, #06b6d4 100%)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  borderRight: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(8px)',
};

const iconBoxStyle = (active) => ({
  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
  borderRadius: 16,
  padding: 10,
  marginBottom: 8,
  transition: 'background 0.2s',
  boxShadow: active ? '0 2px 8px #dbeafe' : 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const SidebarNavigation = ({ hasPaid, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Change password modal state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changeMsg, setChangeMsg] = useState('');

  // Toggle dark mode (for demo, you can expand this)
  const handleToggleTheme = () => {
    setDarkMode((d) => !d);
    document.body.style.background = darkMode
      ? 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)'
      : 'linear-gradient(135deg, #18181b 0%, #0f172a 100%)';
  };

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg('');
    try {
      const response = await fetch('http://localhost:8080/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }
      setChangeMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setChangeMsg(err.message);
    }
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user && user.role === 'ADMIN';

  // Navigation items
  const navItems = [
    {
      to: '/dashboard',
      icon: <FaTachometerAlt size={28} />,
      label: 'Dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      to: hasPaid ? '/application' : '#',
      icon: <FaWpforms size={28} />,
      label: 'Application',
      active: location.pathname === '/application',
      disabled: !hasPaid,
      tooltip: !hasPaid ? "Please complete payment before applying." : "Application Form"
    },
    !isAdmin && {
      to: '/payment',
      icon: <FaMoneyCheckAlt size={28} />,
      label: 'Payment',
      active: location.pathname === '/payment'
    },
    !isAdmin && {
      to: '/profile',
      icon: <FaUser size={28} />,
      label: 'Profile',
      active: location.pathname === '/profile'
    },
    {
      to: '/status',
      icon: <FaCheckCircle size={28} />,
      label: 'Application Status',
      active: location.pathname === '/status'
    }
  ].filter(Boolean);

  return (
    <nav style={sidebarStyle} className="text-white vh-100 p-3 d-flex flex-column align-items-center justify-content-between">
      <div>
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Logo"
            style={{
              height: 56,
              borderRadius: '50%',
              boxShadow: '0 2px 8px #fff',
              border: '2px solid #fff',
              marginBottom: 10
            }}
          />
        </div>
        <ul className="nav flex-column align-items-center" style={{ width: '100%' }}>
          {navItems.map((item, idx) => (
            <li key={idx} style={{ width: '100%' }}>
              <Link
                to={item.to}
                className={`nav-link text-white d-flex flex-column align-items-center`}
                style={{
                  ...iconBoxStyle(item.active),
                  opacity: item.disabled ? 0.5 : 1,
                  pointerEvents: item.disabled ? 'none' : 'auto'
                }}
                tabIndex={item.disabled ? -1 : 0}
                aria-disabled={item.disabled}
                title={item.tooltip || item.label}
              >
                {item.icon}
                <span className="small mt-1" style={{ fontSize: 11 }}>{item.label}</span>
              </Link>
            </li>
          ))}
          <li style={{ width: '100%' }}>
            <button
              className="nav-link text-white bg-transparent border-0 d-flex flex-column align-items-center"
              style={iconBoxStyle(false)}
              title="Settings"
              onClick={() => setShowSettings(true)}
            >
              <FaCog size={28} />
              <span className="small mt-1" style={{ fontSize: 11 }}>Settings</span>
            </button>
          </li>
        </ul>
      </div>
      <div className="d-flex flex-column align-items-center gap-3">
        <button
          className="nav-link text-white bg-transparent border-0 d-flex flex-column align-items-center"
          style={iconBoxStyle(false)}
          title={darkMode ? "Light Mode" : "Dark Mode"}
          onClick={handleToggleTheme}
        >
          {darkMode ? <FaRegSun size={26} /> : <FaRegMoon size={26} />}
          <span className="small mt-1" style={{ fontSize: 11 }}>{darkMode ? "Light" : "Dark"}</span>
        </button>
        <button
          className="nav-link text-white bg-transparent border-0 d-flex flex-column align-items-center"
          style={iconBoxStyle(false)}
          title="Sign Out"
          onClick={handleSignOut}
        >
          <FaSignOutAlt size={28} />
          <span className="small mt-1" style={{ fontSize: 11 }}>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default SidebarNavigation;