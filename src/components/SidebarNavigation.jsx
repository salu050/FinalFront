// src/components/SidebarNavigation.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaWpforms,
  FaMoneyCheckAlt,
  FaUser,
  FaCog, // Re-included for Settings icon
  FaSignOutAlt,
  FaRegSun,
  FaRegMoon,
  FaCheckCircle,
  FaUsers, // For Applicant Details
  FaDollarSign // For View Payments
} from 'react-icons/fa';
import logo from './logo.jfif'; // Assuming your logo is here
import 'bootstrap/dist/css/bootstrap.min.css'; // Make sure Bootstrap CSS is imported if you're using its classes

const sidebarStyle = {
  width: 90,
  minWidth: 90,
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
  background: 'linear-gradient(160deg, #6366f1 0%, #06b6d4 100%)',
  boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.45)', // Stronger, deeper shadow for the sidebar itself
  borderRight: '1px solid rgba(255,255,255,0.15)', // Slightly more defined border
  backdropFilter: 'blur(10px)', // Stronger blur for "glassmorphism" effect
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  overflowY: 'auto', // Allow scrolling if content overflows
  paddingTop: '15px', // More top padding
  paddingBottom: '15px', // More bottom padding
};

const iconBoxStyle = (active) => ({
  background: active ? 'rgba(255,255,255,0.25)' : 'transparent', // Slightly more opaque active background
  borderRadius: 16,
  padding: '12px 10px',
  marginBottom: 12,
  transition: 'background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, color 0.3s ease',
  boxShadow: active ? '0 4px 15px rgba(255,255,255,0.25), 0 0 20px rgba(100,200,255,0.6)' : 'none', // Stronger active shadow with more glow
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  width: 'calc(100% - 16px)',
  margin: '0 8px',
  textDecoration: 'none',
  color: 'white',
  fontWeight: active ? '600' : 'normal',
  transform: active ? 'scale(1.03)' : 'scale(1)', // Slight scale for active
  overflow: 'hidden', // Essential for shine effect
});

const SidebarNavigation = ({ userDetails, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  const userRole = userDetails?.role;
  const hasPaid = userDetails?.hasPaidApplicationFee; 

  const handleToggleTheme = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      document.body.style.background = newMode
        ? 'linear-gradient(135deg, #18181b 0%, #0f172a 100%)'
        : 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)';
      return newMode;
    });
  };

  const handleSignOutClick = () => {
    if (onSignOut) onSignOut();
  };

  const getNavItemsForRole = (role, currentPath, paidStatus) => {
    let roleSpecificItems = [];

    switch (role) {
      case 'ADMIN':
        roleSpecificItems = [
          {
            to: '/payments',
            icon: <FaDollarSign size={28} />,
            label: 'Payments',
            active: currentPath.startsWith('/payments'),
          },
          {
            to: '/applicants',
            icon: <FaUsers size={28} />,
            label: 'Applicants',
            active: currentPath.startsWith('/applicants'),
          },
        ];
        break;
      case 'MINISTRY':
        roleSpecificItems = [
          {
            to: '/applicants',
            icon: <FaUsers size={28} />,
            label: 'Applicants',
            active: currentPath.startsWith('/applicants'),
          },
        ];
        break;
      case 'STUDENT':
        roleSpecificItems = [
          {
            to: '/dashboard',
            icon: <FaTachometerAlt size={28} />,
            label: 'Dashboard',
            active: currentPath === '/dashboard',
          },
          {
            to: paidStatus ? '/application' : '#',
            icon: <FaWpforms size={28} />,
            label: 'Application',
            active: currentPath.startsWith('/application'),
            disabled: !paidStatus,
            tooltip: paidStatus ? "Start or update your application" : "Please complete payment before applying"
          },
          {
            to: '/payment',
            icon: <FaMoneyCheckAlt size={28} />,
            label: 'Payment',
            active: currentPath === '/payment',
          },
          {
            to: '/profile',
            icon: <FaUser size={28} />,
            label: 'Profile',
            active: currentPath === '/profile',
          },
          {
            to: '/status',
            icon: <FaCheckCircle size={28} />,
            label: 'Status',
            active: currentPath === '/status',
          },
          {
            to: '/settings',
            icon: <FaCog size={28} />,
            label: 'Settings',
            active: currentPath.startsWith('/settings')
          }
        ];
        break;
      default:
        roleSpecificItems = [];
    }
    return roleSpecificItems.filter(Boolean);
  };

  const navItems = getNavItemsForRole(userRole, location.pathname, hasPaid);

  return (
    <nav style={sidebarStyle} className="sidebar-nav">
      {/* Logo Section */}
      <div className="text-center my-3">
        <img
          src={logo}
          alt="Logo"
          style={{
            height: 56,
            borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(255,255,255,0.6)', // More pronounced shadow for logo
            border: '2px solid #fff',
          }}
        />
      </div>
      {/* Main Navigation Links */}
      <ul className="nav flex-column align-items-center flex-grow-1" style={{ width: '100%', padding: '10px 0' }}>
        {navItems.map((item, idx) => (
          <li key={idx} className="sidebar-nav-item" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {item.disabled ? (
              <span
                className={`nav-link text-white d-flex flex-column align-items-center`}
                style={{
                  ...iconBoxStyle(item.active),
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
                tabIndex={-1}
                aria-disabled={true}
                title={item.tooltip || item.label}
              >
                {item.icon}
                <span className="small mt-1" style={{ fontSize: 11 }}>{item.label}</span>
              </span>
            ) : (
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link text-white d-flex flex-column align-items-center ${isActive ? 'active' : ''}`
                }
                style={iconBoxStyle(item.active)}
                tabIndex={0}
                title={item.tooltip || item.label}
              >
                {item.icon}
                <span className="small mt-1" style={{ fontSize: 11 }}>{item.label}</span>
                {/* Active Indicator Bar */}
                {item.active && <div className="active-indicator"></div>}
              </NavLink>
            )}
          </li>
        ))}
      </ul>

      {/* Bottom Navigation (Dark Mode & Sign Out) - Always present */}
      <div className="d-flex flex-column align-items-center gap-3 my-3" style={{ width: '100%' }}>
        {/* Dark Mode Toggle */}
        <button
          className="nav-link text-white bg-transparent border-0 d-flex flex-column align-items-center"
          style={{...iconBoxStyle(false), width: 'auto'}}
          title={darkMode ? "Light Mode" : "Dark Mode"}
          onClick={handleToggleTheme}
        >
          {darkMode ? <FaRegSun size={26} /> : <FaRegMoon size={26} />}
          <span className="small mt-1" style={{ fontSize: 11 }}>{darkMode ? "Light" : "Dark"}</span>
        </button>

        {/* Sign Out Button */}
        <button
          className="nav-link text-white bg-transparent border-0 d-flex flex-column align-items-center"
          style={{...iconBoxStyle(false), width: 'auto'}}
          title="Sign Out"
          onClick={handleSignOutClick}
        >
          <FaSignOutAlt size={28} />
          <span className="small mt-1" style={{ fontSize: 11 }}>Sign Out</span>
        </button>
      </div>
      {/* Modern CSS Animations for hover effects and active indicator */}
      <style jsx>{`
        /* Keyframe for subtle icon pulse */
        @keyframes iconPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* Keyframe for gradient shine effect */
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .sidebar-nav .nav-link {
          position: relative;
          overflow: hidden; /* Hide overflow for shine effect */
          z-index: 1; /* Ensure content is above shine pseudo-element */
        }

        /* Gradient shine effect on hover */
        .sidebar-nav .nav-link:not(.active)::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: translateX(0);
          transition: transform 0.6s ease-out;
          z-index: -1; /* Behind the content */
        }

        .sidebar-nav .nav-link:not(.active):hover::before {
          transform: translateX(100%);
        }

        /* Hover effect: subtle lift and stronger shadow */
        .sidebar-nav .nav-link:not(.active):hover {
          background: rgba(255,255,255,0.1); /* Lighter hover background */
          transform: translateY(-3px) scale(1.03); /* More pronounced lift and scale */
          box-shadow: 0 6px 20px rgba(255,255,255,0.3), 0 0 25px rgba(100,200,255,0.4); /* Enhanced shadow with more subtle glow */
          color: #e0f2ff; /* Slightly brighter text on hover */
        }

        /* Icon pulse on hover */
        .sidebar-nav .nav-link:hover > svg {
          animation: iconPulse 0.5s ease-in-out;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.7)); /* Stronger glow for icons */
        }

        /* Active link styling - stronger visual emphasis */
        .sidebar-nav .nav-link.active {
          background: rgba(255,255,255,0.3); /* More prominent background */
          box-shadow: 0 6px 25px rgba(255,255,255,0.4), 0 0 30px rgba(100,200,255,0.7); /* Stronger glow for active */
          border: 1px solid rgba(255,255,255,0.5); /* Slight border for depth */
          transform: scale(1.06); /* More pronounced scale for active */
          position: relative; /* Needed for active indicator positioning */
        }
        
        /* Active Indicator Bar */
        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 6px; /* Width of the bar */
          height: 60%; /* Height of the bar */
          background: linear-gradient(to bottom, #8aff8a, #2196F3); /* Vibrant gradient */
          border-radius: 3px;
          animation: slideIn 0.3s ease-out forwards;
          box-shadow: 0 0 10px rgba(138, 255, 138, 0.7); /* Glow for the indicator */
        }

        @keyframes slideIn {
          from { transform: translateY(-50%) translateX(-100%); opacity: 0; }
          to { transform: translateY(-50%) translateX(0); opacity: 1; }
        }

        /* Text shadow for labels on hover/active */
        .sidebar-nav .nav-link:hover > span,
        .sidebar-nav .nav-link.active > span {
          text-shadow: 0 0 5px rgba(255,255,255,0.9); /* Stronger text shadow */
        }

        /* Remove default button focus outline for cleaner look */
        .sidebar-nav button:focus,
        .sidebar-nav .nav-link:focus {
            outline: none !important;
            box-shadow: 0 0 0 4px rgba(100, 200, 255, 0.6) !important; /* Custom, more prominent focus ring */
        }

        /* Improve scrollbar aesthetics (Webkit browsers) */
        .sidebar-nav::-webkit-scrollbar {
          width: 8px; /* Slightly wider scrollbar */
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.08); /* Slightly more visible track */
          border-radius: 10px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3); /* Slightly more visible thumb */
          border-radius: 10px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5); /* More visible on hover */
        }
      `}</style>
    </nav>
  );
};

export default SidebarNavigation;
