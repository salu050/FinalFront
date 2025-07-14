import React, { useState, useEffect } from 'react';
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
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const iconBoxStyle = (active) => ({
  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
  borderRadius: 16,
  padding: 10,
  marginBottom: 8,
  transition: 'background 0.2s, box-shadow 0.2s',
  boxShadow: active ? '0 2px 8px #dbeafe' : 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
});

const SidebarNavigation = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Payment and user logic
  const [paymentStatus, setPaymentStatus] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role === 'ADMIN') {
      setPaymentStatus('');
      setCheckingPayment(false);
      return;
    }
    setCheckingPayment(true);
    fetch(`http://localhost:8080/api/payments/user/${user.id}`)
      .then(res => res.ok ? res.json() : [])
      .then((data) => {
        if (!Array.isArray(data) || !data.length) {
          setPaymentStatus('NONE');
          setCheckingPayment(false);
          return;
        }
        const latest = data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setPaymentStatus(latest.status);
        setCheckingPayment(false);
      })
      .catch(() => {
        setPaymentStatus('NONE');
        setCheckingPayment(false);
      });
  }, []);

  // Toggle dark mode
  const handleToggleTheme = () => {
    setDarkMode((d) => !d);
    document.body.style.background = darkMode
      ? 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)'
      : 'linear-gradient(135deg, #18181b 0%, #0f172a 100%)';
  };

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user && user.role === 'ADMIN';

  // Application access nav logic
  let applicationNav = null;
  if (!isAdmin) {
    if (checkingPayment) {
      applicationNav = {
        to: "#",
        icon: <FaWpforms size={28} />,
        label: 'Application',
        active: location.pathname.startsWith('/application'),
        disabled: true,
        tooltip: "Checking payment status..."
      };
    } else if (paymentStatus === 'APPROVED') {
      applicationNav = {
        to: '/application',
        icon: <FaWpforms size={28} />,
        label: 'Application',
        active: location.pathname.startsWith('/application'),
        disabled: false,
        tooltip: "Start or update your application"
      };
    } else if (paymentStatus === 'PENDING') {
      applicationNav = {
        to: '#',
        icon: <FaWpforms size={28} />,
        label: 'Application',
        active: location.pathname.startsWith('/application'),
        disabled: true,
        tooltip: "Your payment is pending admin approval"
      };
    } else if (paymentStatus === 'REJECTED') {
      applicationNav = {
        to: '#',
        icon: <FaWpforms size={28} />,
        label: 'Application',
        active: location.pathname.startsWith('/application'),
        disabled: true,
        tooltip: "Your payment was rejected. Please make a new payment"
      };
    } else {
      applicationNav = {
        to: '#',
        icon: <FaWpforms size={28} />,
        label: 'Application',
        active: location.pathname.startsWith('/application'),
        disabled: true,
        tooltip: "Please complete payment before applying"
      };
    }
  }

  const navItems = [
    {
      to: '/dashboard',
      icon: <FaTachometerAlt size={28} />,
      label: 'Dashboard',
      active: location.pathname === '/dashboard'
    },
    applicationNav,
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
    <nav style={sidebarStyle} className="sidebar-nav">
      <div>
        <div className="text-center mb-4 mt-2">
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
              {item.disabled ? (
                <span
                  className={`nav-link text-white d-flex flex-column align-items-center`}
                  style={{
                    ...iconBoxStyle(item.active),
                    opacity: 0.5,
                    pointerEvents: 'none'
                  }}
                  tabIndex={-1}
                  aria-disabled={true}
                  title={item.tooltip || item.label}
                >
                  {item.icon}
                  <span className="small mt-1" style={{ fontSize: 11 }}>{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.to}
                  className={`nav-link text-white d-flex flex-column align-items-center`}
                  style={iconBoxStyle(item.active)}
                  tabIndex={0}
                  title={item.tooltip || item.label}
                >
                  {item.icon}
                  <span className="small mt-1" style={{ fontSize: 11 }}>{item.label}</span>
                </Link>
              )}
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
      <div className="d-flex flex-column align-items-center gap-3 mb-3">
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
      {/* Optionally add a settings modal or drawer here */}
    </nav>
  );
};

export default SidebarNavigation;