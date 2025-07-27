import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig'; // Removed .jsx extension

// Avatar utility: use initials from username/email
const getAvatar = (username) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;

// AdminDashboard component now accepts a navigation prop
function AdminDashboard({ onNavigateToLogin }) { // Added onNavigateToLogin prop
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Placeholder for logo image
  const logoUrl = "https://placehold.co/90x90/6366f1/ffffff?text=ADMIN";

  // Metrics (derived from filtered payments)
  const totalPayments = payments.length;
  const totalApproved = payments.filter(p => p.status === "APPROVED").length;
  const totalPending = payments.filter(p => p.status === "PENDING").length;
  const totalRejected = payments.filter(p => p.status === "REJECTED").length;

  // --- Dynamic CSS Injection for Bootstrap and Custom Styles ---
  useEffect(() => {
    // Inject Bootstrap CSS
    const bootstrapLink = document.createElement('link');
    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
    bootstrapLink.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapLink);

    // Inject Bootstrap Icons CSS (for bi-person-circle, bi-credit-card, etc.)
    const bootstrapIconsLink = document.createElement('link');
    bootstrapIconsLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    bootstrapIconsLink.rel = 'stylesheet';
    document.head.appendChild(bootstrapIconsLink);

    // Inject custom styles
    const id = "admin-dashboard-modern-style";
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        .dashboard-card {
          border-left: 6px solid #6366f1;
          border-radius: 16px;
          box-shadow: 0 4px 24px 0 rgba(80,80,150,0.07);
        }
        .dashboard-table th, .dashboard-table td {
          vertical-align: middle !important;
        }
        .dashboard-table th {
          background: linear-gradient(90deg, #232946 80%, #243b55 100%);
          color: #fff !important;
          font-weight: 700;
        }
        .dashboard-table tr:hover {
          background: #1a233a !important;
        }
        .avatar-img {
          width: 32px; height: 32px; object-fit: cover; border-radius: 50%;
          border: 2px solid #232946; background: #fff; box-shadow: 0 2px 8px #6366f122;
        }
        .dashboard-metric-card {
          border-radius: 16px !important;
          min-width: 120px;
        }
        .dashboard-dark {
          background: linear-gradient(135deg, #141e30 0%, #243b55 100%) !important;
          color: #f7f8fa !important;
        }
        .dashboard-dark .dashboard-card,
        .dashboard-dark .card {
          background: #232946 !important;
          color: #f7f8fa !important;
        }
        .dashboard-dark .dashboard-table th {
          background: #232946 !important;
          color: #fff !important;
        }
        .dashboard-dark .dashboard-table tr:hover {
          background: #1a233a !important;
        }
        .dashboard-dark .form-control,
        .dashboard-dark .form-select {
          background: #191932 !important;
          color: #fff !important;
          border-color: #6366f1 !important;
          font-weight: 500 !important;
          letter-spacing: 1px !important;
        }
        .dashboard-dark .form-control::placeholder {
          color: #d1d5db !important;
          opacity: 1 !important;
        }
        .dashboard-dark .table-light {
          background: #181f32 !important;
        }
        .dashboard-dark .alert-info {
          background-color: #232946 !important;
          color: #a5b4fc !important;
          border-color: #6366f1 !important;
        }
        .dashboard-dark .alert-danger {
          background-color: #4b1c3c !important;
          color: #fff !important;
        }
        .dashboard-headline, .dashboard-headline h1, .dashboard-headline h4, .dashboard-headline h2 {
          color: #fff !important;
          background: none !important;
          text-shadow: 0 2px 16px #1118, 0 2px 8px #0006;
        }
        .dashboard-metric-card .card-title,
        .dashboard-metric-card .card-body > div,
        .dashboard-metric-card .card-body > span,
        .dashboard-metric-card .card-body > i {
          color: #fff !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Cleanup function
    return () => {
      document.head.removeChild(bootstrapLink);
      document.head.removeChild(bootstrapIconsLink); // Clean up Bootstrap Icons
      if (document.getElementById(id)) {
        document.head.removeChild(document.getElementById(id));
      }
    };
  }, []);

  // --- Fetch Payments from Backend ---
  useEffect(() => {
    const fetchPayments = async () => {
      setLoadingPayments(true);
      setError(null);

      try {
        const response = await axios.get('/payments');
        setPayments(response.data);
      } catch (err) {
        console.error("Error fetching payments:", err);
        // --- START: Enhanced Error Logging ---
        let errorMessage = 'An unexpected error occurred.';
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `Server Error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`;
          console.error("Server Response Data:", err.response.data);
          console.error("Server Response Status:", err.response.status);
          console.error("Server Response Headers:", err.response.headers);

          // If 401 or 403, redirect to login
          if (err.response.status === 401 || err.response.status === 403) {
            console.warn("Authentication/Authorization error. Redirecting to login.");
            if (onNavigateToLogin) {
              onNavigateToLogin();
            }
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'Network Error: No response received from server.';
          console.error("No response received:", err.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = `Request Setup Error: ${err.message}`;
        }
        setError(errorMessage);
        // --- END: Enhanced Error Logging ---
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [onNavigateToLogin]); // Dependency on onNavigateToLogin prop

  // --- Approve/Reject Payment Actions ---
  const handlePaymentAction = async (paymentId, action) => {
    setActionMsg('');
    setError(null); // Clear previous errors

    try {
      let endpoint = '';
      if (action === 'approve') {
        endpoint = `/admin/approve-payment?paymentId=${paymentId}`;
      } else {
        endpoint = `/admin/reject-payment?paymentId=${paymentId}`;
      }

      const response = await axios.post(endpoint); // Use axios instance

      const updatedPayment = response.data; // Axios puts response data in .data
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentId ? { ...payment, status: updatedPayment.status } : payment
        )
      );
      setActionMsg(`Payment ${action}d successfully!`);
    } catch (err) {
      console.error(`Error ${action}ing payment:`, err);
      // --- START: Enhanced Error Logging for Actions ---
      let errorMessage = `Failed to ${action} payment.`;
      if (err.response) {
        errorMessage = `Server Error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`;
        console.error("Server Response Data (Action):", err.response.data);
        console.error("Server Response Status (Action):", err.response.status);

        if (err.response.status === 401 || err.response.status === 403) {
          console.warn("Authentication/Authorization error for action. Redirecting to login.");
          if (onNavigateToLogin) {
            onNavigateToLogin();
          }
        }
      } else if (err.request) {
        errorMessage = 'Network Error: No response received for action.';
      } else {
        errorMessage = `Request Setup Error (Action): ${err.message}`;
      }
      setActionMsg(errorMessage); // Display error message in actionMsg state
      // --- END: Enhanced Error Logging for Actions ---
    }
  };

  const handleApprovePayment = (paymentId) => handlePaymentAction(paymentId, 'approve');
  const handleRejectPayment = (paymentId) => handlePaymentAction(paymentId, 'reject');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge bg-success px-2">Approved</span>;
      case 'REJECTED':
        return <span className="badge bg-danger px-2">Rejected</span>;
      default:
        return <span className="badge bg-warning text-dark px-2">Pending</span>;
    }
  };

  // Filtering, searching, and sorting
  const filteredPayments = payments
    .filter((p) =>
      (filterStatus === 'ALL' || p.status === filterStatus) &&
      (
        // Assuming p.user?.username and p.controlNumber exist
        // If p.user is not available from backend, this will need adjustment
        [
          p.user?.username, // Check if user object and username exist
          p.id, // Search by payment ID
          p.controlNumber
        ].join(' ').toLowerCase().includes(search.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        const dA = new Date(a.createdAt), dB = new Date(b.createdAt);
        return sortDir === 'desc' ? dB - dA : dA - dB;
      } else if (sortBy === 'status') {
        const sA = a.status || '', sB = b.status || '';
        return sortDir === 'desc' ? sB.localeCompare(sA) : sA.localeCompare(sB);
      } else if (sortBy === 'username') {
        const nA = a.user?.username || '', nB = b.user?.username || ''; // Check for user object
        return sortDir === 'desc' ? nB.localeCompare(nA) : nA.localeCompare(nB);
      }
      return 0;
    });

  const headingStyles = {
    fontSize: '2.6rem',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: 2,
    textShadow: '0 2px 16px #1118, 0 2px 8px #0006',
    marginBottom: 0,
  };

  const subheadingStyles = {
    color: '#a5b4fc',
    fontWeight: 500,
    fontSize: '1.15rem',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 16,
    textShadow: '0 2px 8px #0006',
  };

  const metricCard = (bg, title, value, icon) => (
    <div className="col-6 col-md-2 mb-3">
      <div className={`card text-white ${bg} text-center shadow-sm dashboard-metric-card`}>
        <div className="card-body py-3">
          <div className="card-title" style={{fontSize: 16, opacity: 0.9, fontWeight: 500, color: "#fff"}}>{title}</div>
          <div style={{fontSize: 28, fontWeight: 800, color: "#fff"}}>{value}</div>
          {icon ? <div style={{fontSize: 24, color: "#fff"}}>{icon}</div> : null}
        </div>
      </div>
    </div>
  );

  const darkClass = "dashboard-dark";

  return (
    <div className={`container py-5 ${darkClass}`} style={{ background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', minHeight: '100vh' }}>
      {/* Topbar with avatar/profile only */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div></div>
        <div>
          <span className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style={{width: 36, height: 36}}>
            {/* Using a simple icon or placeholder for user avatar */}
            <i className="bi bi-person-circle" style={{fontSize: 24}}></i>
          </span>
        </div>
      </div>

      <div className="text-center mb-4 dashboard-headline">
        <h1 style={headingStyles}>Admin Dashboard</h1>
        <div style={subheadingStyles}>
          Welcome to your <span style={{color:'#06b6d4'}}>powerful</span> &amp; <span style={{color:'#4f46e5'}}>modern</span> administration panel.<br/>
          <span className="fw-bold" style={{color:'#a5b4fc'}}>Manage payments, track user activity, and streamline your workflow with ease!</span>
        </div>
        <hr style={{borderTop: '2px solid #4f46e5', width: 90, margin: '0 auto 12px auto'}}/>
      </div>

      {/* Metrics Row */}
      <div className="row justify-content-center mb-4">
        {metricCard("bg-primary", "Total Payments", totalPayments, <i className="bi bi-credit-card"></i>)}
        {metricCard("bg-success", "Approved", totalApproved, <i className="bi bi-check2-circle"></i>)}
        {metricCard("bg-warning", "Pending", totalPending, <i className="bi bi-hourglass-split"></i>)}
        {metricCard("bg-danger", "Rejected", totalRejected, <i className="bi bi-x-circle"></i>)}
      </div>

      {/* Message bar */}
      {actionMsg && (
        <div className="alert alert-info mt-3 text-center">{actionMsg}</div>
      )}
      {error && (
        <div className="alert alert-danger mb-4">
          Error loading payments: {error}
          {error.includes("Unauthorized") || error.includes("Forbidden") ? (
            <button className="btn btn-sm btn-light ms-3" onClick={onNavigateToLogin}>Login</button>
          ) : null}
        </div>
      )}

      {/* Card */}
      <div className="card shadow-sm p-4 mb-5 dashboard-card">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2 dashboard-headline">
          <h4 className="mb-0 fw-semibold" style={{ letterSpacing: 1, color: "#fff", textShadow: '0 2px 8px #000a' }}>Payments & Status Overview</h4>
          <div className="d-flex gap-2">
            <input
              type="text"
              placeholder="Search user, ID, control number"
              className="form-control"
              style={{
                minWidth: 200,
                color: "#fff",
                background: "#191932",
                borderColor: "#6366f1",
                fontWeight: 500,
                letterSpacing: 1
              }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                color: "#fff",
                background: "#191932",
                borderColor: "#6366f1",
                fontWeight: 500,
                letterSpacing: 1
              }}
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </select>
            <select
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                color: "#fff",
                background: "#191932",
                borderColor: "#6366f1",
                fontWeight: 500,
                letterSpacing: 1
              }}
            >
              <option value="createdAt">Sort by Date</option>
              <option value="username">Sort by Username</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              className="btn btn-outline-primary"
              onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              title="Toggle sort order"
            >
              <i className={`bi bi-sort-${sortDir === 'desc' ? 'down' : 'up'}`}></i>
            </button>
          </div>
        </div>
        <hr />
        {loadingPayments ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading payments...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-borderless align-middle dashboard-table">
              <thead className="table-light">
                <tr>
                  <th>Payment ID</th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Control Number</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <span className="text-muted">No payments found.</span>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="align-middle">
                      <td className="fw-bold">{payment.id}</td>
                      {/* User column: Only avatar now */}
                      <td>
                        <img
                          src={getAvatar(payment.user?.username)} // Assumes payment.user.username exists
                          alt={payment.user?.username || 'User'}
                          className="avatar-img"
                          title={payment.user?.username || 'User'}
                        />
                      </td>
                      {/* Username/email column */}
                      <td>
                        <span className="fw-semibold">{payment.user?.username || '-'}</span> {/* Assumes payment.user.username exists */}
                      </td>
                      <td>
                        <span className="badge bg-primary fs-6">
                          {payment.controlNumber}
                        </span>
                      </td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>
                        <span className="fw-bold">
                          {typeof payment.amount === 'number' ? payment.amount.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td>
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprovePayment(payment.id)}
                            disabled={payment.status === 'APPROVED'}
                            title="Approve Payment"
                          >
                            <i className="bi bi-check-circle me-1"></i> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectPayment(payment.id)}
                            disabled={payment.status === 'REJECTED'}
                            title="Reject Payment"
                          >
                            <i className="bi bi-x-circle me-1"></i> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applications Table - Assuming ApplicationDetails is a separate component */}
      {/* You might need to pass data or props to ApplicationDetails if it also needs backend data */}
      {/* <div className="card shadow-sm p-4 mb-5 dashboard-card">
        <ApplicationDetails />
      </div> */}

      <footer className="text-center text-secondary mt-4 pb-2 small">
        <span>
          Admin Portal &copy; {new Date().getFullYear()} | VETA | Modern UI Demo
        </span>
      </footer>
    </div>
  );
}

export default AdminDashboard;