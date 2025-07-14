import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'; // Import useNavigate
import SidebarNavigation from './components/SidebarNavigation';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import Payment from './components/Payment';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import MinistryDashboard from './components/MinistryDashboard';
import ApplicationStatus from './components/ApplicationStatus';
import Register from './components/Register';
import axios from './api/axiosConfig.jsx'; // Import the configured axios instance

// Helper to check payment status using axios
async function userHasApprovedPayment(userId) {
  if (!userId) return false;
  try {
    const response = await axios.get(`/payments/user/${userId}`);
    const data = response.data; // Axios puts response data in .data

    if (!Array.isArray(data)) return false;
    // Find latest APPROVED payment
    const approved = data
      .filter(p => p.status === 'APPROVED')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    return !!approved;
  } catch (error) {
    console.error("Error checking payment status:", error);
    // If there's an error (e.g., 401, 403), axiosConfig will handle redirection
    return false;
  }
}

// Secure route for application: only allow if payment is approved
function RequireApprovedPayment({ children, userDetails, hasPaid, onAuthSuccess, loadingUser }) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    async function checkPayment() {
      // Wait for user details to be loaded from localStorage first
      if (loadingUser) {
        return;
      }

      if (!userDetails || userDetails.role !== 'STUDENT') {
        if (mounted) setIsLoading(false);
        return;
      }
      // If hasPaid is already true from localStorage or previous login, no need to re-check
      if (hasPaid) {
        if (mounted) setIsLoading(false);
        return;
      }

      const ok = await userHasApprovedPayment(userDetails.id);
      if (mounted) {
        onAuthSuccess({ ...userDetails, hasPaidApplicationFee: ok }); // Update parent state
        setIsLoading(false);
      }
    }
    checkPayment();
    return () => {
      mounted = false;
    };
  }, [userDetails, hasPaid, onAuthSuccess, loadingUser]); // Re-run if userDetails, hasPaid, or loadingUser changes

  if (loadingUser || isLoading) {
    return <div className="p-5 text-center">Loading user data...</div>;
  }

  // Redirect if not logged in or not a student
  if (!userDetails) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (userDetails.role !== 'STUDENT') {
    return <Navigate to="/dashboard" state={{ from: location }} replace />; // Redirect non-students
  }

  // Redirect if student but hasn't paid
  if (!hasPaid) {
    return <Navigate to="/payment" state={{ from: location }} replace />;
  }

  return children;
}

// Helper to conditionally render sidebar based on route
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate hook
  // Hide sidebar on login/register page
  const hideSidebar = location.pathname === '/login' || location.pathname === '/register';

  // State to track if user details are being loaded from localStorage initially
  const [loadingUser, setLoadingUser] = useState(true);

  // Initialize userDetails and hasPaid from localStorage on component mount
  const [userDetails, setUserDetails] = useState(null);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserDetails(parsedUser);
        setHasPaid(parsedUser.hasPaidApplicationFee || false);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      // If parsing fails, clear localStorage to prevent infinite loops with bad data
      localStorage.removeItem('user');
      localStorage.removeItem('jwtToken');
    } finally {
      setLoadingUser(false); // User details loading is complete
    }
  }, []); // Run only once on mount

  // Effect to update hasPaid if userDetails changes (e.g., after payment success)
  useEffect(() => {
    if (userDetails && userDetails.hasPaidApplicationFee !== undefined) {
      setHasPaid(userDetails.hasPaidApplicationFee);
    }
  }, [userDetails]);

  // Callback for successful authentication (login or registration)
  const handleAuthSuccess = (user) => {
    setUserDetails(user);
    setHasPaid(user.hasPaidApplicationFee);
    localStorage.setItem('user', JSON.stringify(user)); // Ensure localStorage is updated immediately

    // Determine redirect path based on role and payment status using navigate()
    if (user.role === 'ADMIN') {
      navigate("/admin", { replace: true });
    } else if (user.role === 'MINISTRY') {
      navigate("/ministry", { replace: true });
    } else if (user.role === 'STUDENT') {
      if (user.hasPaidApplicationFee) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/payment", { replace: true });
      }
    } else {
      navigate("/dashboard", { replace: true }); // Default redirect
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setUserDetails(null);
    setHasPaid(false);
    navigate("/login", { replace: true }); // Navigate to login after sign out
  };

  // Dynamic CSS Injection for Bootstrap Icons
  useEffect(() => {
    const bootstrapIconsLink = document.createElement('link');
    bootstrapIconsLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    bootstrapIconsLink.rel = 'stylesheet';
    document.head.appendChild(bootstrapIconsLink);

    return () => {
      document.head.removeChild(bootstrapIconsLink);
    };
  }, []);

  return (
    <>
      {!hideSidebar && <SidebarNavigation hasPaid={hasPaid} onSignOut={handleSignOut} userRole={userDetails?.role} />}
      <div style={!hideSidebar ? { marginLeft: 90 } : {}}>
        <Routes>
          {/* Register component handles both login and registration */}
          <Route path="/login" element={<Register onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <RequireAuth userDetails={userDetails} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <Dashboard userDetails={userDetails} />
            </RequireAuth>
          } />
          <Route
            path="/application"
            element={
              <RequireApprovedPayment userDetails={userDetails} hasPaid={hasPaid} onAuthSuccess={handleAuthSuccess} loadingUser={loadingUser}>
                <ApplicationForm onSubmitDetails={setUserDetails} submitted={!!userDetails?.applicationDetails} />
              </RequireApprovedPayment>
            }
          />
          <Route path="/profile" element={
            <RequireAuth userDetails={userDetails} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <Profile userId={userDetails?.id} onUpdate={setUserDetails} />
            </RequireAuth>
          } />
          <Route path="/payment" element={
            <RequireAuth userDetails={userDetails} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <Payment userDetails={userDetails} setHasPaid={setHasPaid} onAuthSuccess={handleAuthSuccess} />
            </RequireAuth>
          } />
          <Route path="/admin" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['ADMIN']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <AdminDashboard onNavigateToLogin={handleSignOut} />
            </RequireAuth>
          } />
          <Route path="/ministry" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['MINISTRY']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <MinistryDashboard onNavigateToLogin={handleSignOut} />
            </RequireAuth>
          } />
          <Route path="/status" element={
            <RequireAuth userDetails={userDetails} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <ApplicationStatus />
            </RequireAuth>
          } />

          {/* Default redirect to login if no path matches or user is not logged in */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

// Authentication guard component
function RequireAuth({ children, userDetails, allowedRoles, onNavigateToLogin, loadingUser }) {
  const location = useLocation();

  if (loadingUser) {
    return <div className="p-5 text-center">Loading authentication...</div>;
  }

  if (!userDetails) {
    // If no user details, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles && !allowedRoles.includes(userDetails.role)) {
    // If role not allowed, redirect to a default dashboard or unauthorized page
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
