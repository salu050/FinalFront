import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import SidebarNavigation from './components/SidebarNavigation';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import Payment from './components/Payment';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import MinistryDashboard from './components/MinistryDashboard';
import ApplicationStatus from './components/ApplicationStatus';
import Register from './components/Register'; // Updated import

// Helper to check payment status
async function userHasApprovedPayment(userId) {
  try {
    const res = await fetch(`http://localhost:8080/api/payments/user/${userId}`);
    if (!res.ok) return false;
    const data = await res.json();
    if (!Array.isArray(data)) return false;
    // Find latest APPROVED payment
    const approved = data
      .filter(p => p.status === 'APPROVED')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    return !!approved;
  } catch {
    return false;
  }
}

// Secure route for application: only allow if payment is approved
function RequireApprovedPayment({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  React.useEffect(() => {
    let mounted = true;
    async function check() {
      if (!user) {
        setCanProceed(false);
        setIsLoading(false);
        return;
      }
      const ok = await userHasApprovedPayment(user.id);
      if (mounted) {
        setCanProceed(ok);
        setIsLoading(false);
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return <Navigate to="/login" />;
  if (isLoading) return <div className="p-5 text-center">Checking payment status...</div>;
  if (!canProceed) return <Navigate to="/payment" />;

  return children;
}

// Helper to conditionally render sidebar based on route
function AppContent() {
  const location = useLocation();
  // Hide sidebar on login/register page
  const hideSidebar = location.pathname === '/login' || location.pathname === '/register';

  const [userDetails, setUserDetails] = useState(null);
  const [hasPaid, setHasPaid] = useState(false);

  const handleSignOut = () => {
    setUserDetails(null);
    setHasPaid(false);
  };

  return (
    <>
      {!hideSidebar && <SidebarNavigation hasPaid={hasPaid} onSignOut={handleSignOut} />}
      <div style={!hideSidebar ? { marginLeft: 90 } : {}}>
        <Routes>
          <Route path="/login" element={<Register />} /> 
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/application"
            element={
              <RequireApprovedPayment>
                <ApplicationForm onSubmitDetails={setUserDetails} submitted={!!userDetails} />
              </RequireApprovedPayment>
            }
          />
          <Route path="/profile" element={<Profile userId={userDetails?.id} onUpdate={setUserDetails} />} />
          <Route path="/payment" element={<Payment setHasPaid={setHasPaid} />} />
          <Route path="/admin" element={
            <RequireAuth allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RequireAuth>
          } />
          <Route path="/ministry" element={
            <RequireAuth allowedRoles={['MINISTRY']}>
              <MinistryDashboard />
            </RequireAuth>
          } />
          <Route path="/status" element={<ApplicationStatus />} />
          {/* Redirect login path to Register */}
          <Route path="/login" element={<Register />} />
          {/* Add additional routes as needed. */}
          {/* For example, default route rendering Home */}
        </Routes>
      </div>
    </>
  );
}

function RequireAuth({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
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