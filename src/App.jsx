import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import SidebarNavigation from './components/SidebarNavigation';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import Payment from './components/Payment';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard'; // Existing Admin Dashboard
import MinistryDashboard from './components/MinistryDashboard';
import ApplicationStatus from './components/ApplicationStatus';
import Register from './components/Register';
import axios from './api/axiosConfig.jsx'; // Import the configured axios instance

// --- UPDATED IMPORTS FOR THE ROUTES ---
// For 'View Payments' route, we will use AdminDashboard
// For 'Applicant Details' route, we will use ApplicationDetails
import ApplicationDetails from './components/ApplicationDetails'; // Existing Application Details
// Removed: import Settings from './components/Settings';
// --- END UPDATED IMPORTS ---

// Helper to check payment status using axios
async function userHasApprovedPayment(userId) {
  if (!userId) return false;
  try {
    // Call the /api/payments/me/status endpoint directly for the current user's approval status
    const response = await axios.get(`/payments/me/status`);
    return response.data; // This endpoint directly returns true/false
  } catch (error) {
    console.error("Error checking payment status:", error);
    // Axios interceptor handles 401/403 redirection. For other errors, assume not approved.
    return false;
  }
}

// NEW: Secure route for application form: only allow if application NOT submitted
function RequireApplicationNotSubmitted({ children, userDetails, loadingUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for global user loading to complete
    if (loadingUser) {
      return;
    }

    // If user is not logged in after loading, redirect to login
    if (!userDetails) {
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }

    // If user is not a STUDENT, redirect them to their respective dashboard
    if (userDetails.role !== 'STUDENT') {
      if (userDetails.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (userDetails.role === 'MINISTRY') {
        navigate('/ministry', { replace: true });
      } else {
        navigate('/dashboard', { replace: true }); // Fallback for unexpected roles
      }
      return;
    }

    // If applicationDetails exist AND its status is not 'PENDING' or 'SUBMITTED'
    // (meaning it's been reviewed/processed), redirect to status page.
    // This allows students to re-submit if their application was rejected or if they need to edit
    // while it's still 'SUBMITTED' or 'PENDING'.
    // Adjust this logic if you want strict one-time submission regardless of status.
    if (userDetails.applicationDetails &&
        (userDetails.applicationDetails.applicationStatus === 'SELECTED' ||
         userDetails.applicationDetails.applicationStatus === 'REJECTED' ||
         userDetails.applicationDetails.applicationStatus === 'UNDER_REVIEW')) {
      console.log("Application already processed/submitted. Redirecting to status page.");
      navigate('/status', { state: { from: location }, replace: true }); // Redirect to status page
    }
  }, [userDetails, loadingUser, location, navigate]);

  if (loadingUser) {
    return <div className="p-5 text-center">Loading user data...</div>;
  }

  // If user is a student and application is NOT submitted (or is in SUBMITTED/PENDING state), render children
  return children;
}


// Secure route for application: only allow if payment is approved
function RequireApprovedPayment({ children, userDetails, hasPaid, onAuthSuccess, loadingUser }) {
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState(true); // New state for payment status loading
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function checkPaymentAndUser() {
      // 1. Wait for global user loading to complete
      if (loadingUser) {
        return;
      }

      // 2. If user is not logged in after loading, redirect to login
      if (!userDetails) {
        if (mounted) navigate('/login', { state: { from: location }, replace: true });
        return;
      }

      // 3. If user is not a STUDENT, redirect them to their respective dashboard
      if (userDetails.role !== 'STUDENT') {
        if (mounted) {
          if (userDetails.role === 'ADMIN') {
            navigate('/admin', { replace: true });
          } else if (userDetails.role === 'MINISTRY') {
            navigate('/ministry', { replace: true });
          } else {
            navigate('/dashboard', { replace: true }); // Fallback for unexpected roles
          }
        }
        return;
      }

      // 4. If hasPaid is already true (from localStorage or previous update), we are good
      if (hasPaid) {
        if (mounted) setIsLoadingPaymentStatus(false);
        return;
      }

      // 5. Only if user is a STUDENT and hasPaid is false, check payment status from backend
      // This call is intentionally made after all other checks to ensure user is authenticated.
      const approved = await userHasApprovedPayment(userDetails.id);
      if (mounted) {
        // Update parent state with the latest payment status
        if (onAuthSuccess) {
          onAuthSuccess({ ...userDetails, hasPaidApplicationFee: approved });
        }
        setIsLoadingPaymentStatus(false);
      }
    }
    checkPaymentAndUser();
  }, [userDetails, hasPaid, onAuthSuccess, loadingUser, location, navigate]); // Add loadingUser to dependencies

  // Show loading state if App is loading user or if this component is checking payment status
  if (loadingUser || isLoadingPaymentStatus) {
    return <div className="p-5 text-center">Loading user data and payment status...</div>;
  }

  // If user is a student but hasn't paid, redirect to payment page
  if (userDetails && userDetails.role === 'STUDENT' && !hasPaid) {
    return <Navigate to="/payment" state={{ from: location }} replace />;
  }

  // If all checks pass, render children
  return children;
}

// Helper to conditionally render sidebar based on route
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide sidebar on login/register page
  const hideSidebar = location.pathname === '/login' || location.pathname === '/register';

  // State to track if user details are being loaded from localStorage initially
  const [loadingUser, setLoadingUser] = useState(true);

  // Initialize userDetails and hasPaid from localStorage on component mount
  const [userDetails, setUserDetails] = useState(null);
  const [hasPaid, setHasPaid] = useState(false);

  // --- IMPORTANT: Initial user data load from localStorage ---
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
      setUserDetails(null); // Ensure userDetails is null if localStorage is corrupt
      setHasPaid(false);
    } finally {
      // Crucial: Set loadingUser to false ONLY after localStorage check is complete
      setLoadingUser(false);
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
    console.log("handleAuthSuccess called with user:", user);
    setUserDetails(user);
    setHasPaid(user.hasPaidApplicationFee || false); // Ensure hasPaid is set
    localStorage.setItem('user', JSON.stringify(user)); // Ensure localStorage is updated immediately
    localStorage.setItem('jwtToken', user.token); // Assuming 'user' object contains 'token'

    // Determine redirect path based on role and application status
    if (user.role === 'ADMIN') {
      navigate("/admin", { replace: true });
    } else if (user.role === 'MINISTRY') {
      navigate("/ministry", { replace: true });
    } else if (user.role === 'STUDENT') {
      // If student has submitted application and it's not just pending/submitted, go to status page
      // This logic should match RequireApplicationNotSubmitted
      if (user.applicationDetails &&
          (user.applicationDetails.applicationStatus === 'SELECTED' ||
           user.applicationDetails.applicationStatus === 'REJECTED' ||
           user.applicationDetails.applicationStatus === 'UNDER_REVIEW')) {
        navigate("/status", { replace: true });
      } else {
        // Otherwise, go to dashboard (which might lead to payment/application form)
        navigate("/dashboard", { replace: true });
      }
    } else {
      navigate("/login", { replace: true }); // Default redirect for unknown roles
    }
  };

  // Centralized sign-out logic
  const handleSignOut = () => {
    console.log("Performing handleSignOut...");
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setUserDetails(null);
    setHasPaid(false);
    navigate("/login", { replace: true }); // Navigate to login after sign out
  };

  // Listen for the custom 'auth-logout' event from axios interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log("Auth logout event received. Performing clean sign out.");
      handleSignOut(); // Call the existing sign out logic
    };

    window.addEventListener('auth-logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

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
      {/* Updated: Pass userDetails to SidebarNavigation */}
      {!hideSidebar && <SidebarNavigation userDetails={userDetails} onSignOut={handleSignOut} />}
      <div style={!hideSidebar ? { marginLeft: 90 } : {}}>
        <Routes>
          {/* Register component handles both login and registration */}
          <Route path="/login" element={<Register onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />

          {/* Protected Routes */}
          {/* RequireAuth ensures user is logged in and has correct role before rendering children */}
          <Route path="/dashboard" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['STUDENT', 'ADMIN', 'MINISTRY']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <Dashboard userDetails={userDetails} onNavigateToPayment={() => navigate('/payment')} onNavigateToApplication={() => navigate('/application')} onNavigateToProfile={() => navigate('/profile')} />
            </RequireAuth>
          } />
          <Route
            path="/application"
            element={
              // Apply both payment approval and application not submitted guards
              <RequireApprovedPayment userDetails={userDetails} hasPaid={hasPaid} onAuthSuccess={handleAuthSuccess} loadingUser={loadingUser}>
                <RequireApplicationNotSubmitted userDetails={userDetails} loadingUser={loadingUser}>
                  <ApplicationForm onSubmitDetails={handleAuthSuccess} submitted={!!userDetails?.applicationDetails} userDetails={userDetails} />
                </RequireApplicationNotSubmitted>
              </RequireApprovedPayment>
            }
          />
          <Route path="/profile" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['STUDENT']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <Profile userDetails={userDetails} onUpdate={handleAuthSuccess} />
            </RequireAuth>
          } />
          <Route path="/payment" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['STUDENT']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <Payment onNavigateToApplication={() => navigate('/application')} onNavigateToDashboard={() => navigate('/dashboard')} onNavigateToLogin={handleSignOut} userDetails={userDetails} setHasPaid={setHasPaid} onAuthSuccess={handleAuthSuccess} />
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
            <RequireAuth userDetails={userDetails} allowedRoles={['STUDENT', 'ADMIN', 'MINISTRY']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              {/* FIX: Pass onSubmitDetails prop to ApplicationStatus */}
              <ApplicationStatus userDetails={userDetails} onSubmitDetails={handleAuthSuccess} />
            </RequireAuth>
          } />

          {/* --- NEW ROUTES FOR ADMIN/MINISTRY/ALL USERS --- */}
          {/* Admin specific: View Payments (now using AdminDashboard as per your request) */}
          <Route path="/payments" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['ADMIN']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              <AdminDashboard onNavigateToLogin={handleSignOut} /> {/* Using AdminDashboard here */}
            </RequireAuth>
          } />
          {/* Admin/Ministry specific: Applicant Details - Conditionally render based on role */}
          <Route path="/applicants" element={
            <RequireAuth userDetails={userDetails} allowedRoles={['ADMIN', 'MINISTRY']} onNavigateToLogin={handleSignOut} loadingUser={loadingUser}>
              {userDetails?.role === 'MINISTRY' ? (
                // For Ministry, show MinistryDashboard when they click 'Applicant Details'
                <MinistryDashboard onNavigateToLogin={handleSignOut} />
              ) : (
                // For Admin, show ApplicationDetails when they click 'Applicant Details'
                <ApplicationDetails onSubmitDetails={handleAuthSuccess} submitted={!!userDetails?.applicationDetails} userDetails={userDetails} />
              )}
            </RequireAuth>
          } />
          {/* Removed Route for Settings */}
          {/* --- END NEW ROUTES --- */}

          {/* Default redirect to dashboard if user is logged in, otherwise to login */}
          <Route path="/" element={
            loadingUser ? (
              <div className="p-5 text-center">Loading application...</div>
            ) : userDetails ? (
              // NEW: If student has submitted and status is not PENDING/SUBMITTED, go to status page
              userDetails.role === 'STUDENT' && userDetails.applicationDetails && userDetails.applicationDetails.applicationStatus && (
                userDetails.applicationDetails.applicationStatus === 'SELECTED' ||
                userDetails.applicationDetails.applicationStatus === 'REJECTED' ||
                userDetails.applicationDetails.applicationStatus === 'UNDER_REVIEW'
              ) ? (
                <Navigate to="/status" replace />
              ) : (
                userDetails.role === 'ADMIN' ? <Navigate to="/admin" replace /> :
                userDetails.role === 'MINISTRY' ? <Navigate to="/ministry" replace /> :
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          {/* Fallback for any unmatched routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

// Authentication guard component
function RequireAuth({ children, userDetails, allowedRoles, onNavigateToLogin, loadingUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (loadingUser) {
    return <div className="p-5 text-center">Loading authentication...</div>;
  }

  if (!userDetails) {
    // If no user details, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine the effective allowed roles for this route
  // Default to an empty array if not provided, ensuring explicit role check
  const effectiveAllowedRoles = allowedRoles || [];

  // Check if user's role is allowed for this specific route
  if (effectiveAllowedRoles.length > 0 && !effectiveAllowedRoles.includes(userDetails.role)) {
    console.warn(`Access denied for role '${userDetails.role}' on path '${location.pathname}'. Redirecting.`);
    // If role not allowed, redirect to user's appropriate dashboard
    if (userDetails.role === 'ADMIN') {
      return <Navigate to="/admin" state={{ from: location }} replace />;
    } else if (userDetails.role === 'MINISTRY') {
      return <Navigate to="/ministry" state={{ from: location }} replace />;
    } else if (userDetails.role === 'STUDENT') {
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    } else {
      // Fallback for unexpected roles, or if a user tries to access a page
      // not explicitly defined for their role, send them to login.
      // This case should be rare if all roles are handled above.
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
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
