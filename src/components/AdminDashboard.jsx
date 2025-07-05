import React, { useEffect, useState } from 'react';
import ApplicationDetails from './ApplicationDetails';

// Avatar utility: use initials from username/email
const getAvatar = (username) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;

function AdminDashboard() {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Metrics
  const totalPayments = payments.length;
  const totalApproved = payments.filter(p => p.status === "APPROVED").length;
  const totalPending = payments.filter(p => p.status === "PENDING").length;
  const totalRejected = payments.filter(p => p.status === "REJECTED").length;

  useEffect(() => {
    const id = "admin-dashboard-modern-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
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
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoadingPayments(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8080/api/payments');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPayments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, []);

  // Approve/Reject payment by paymentId and update with server response
  const handlePaymentAction = async (paymentId, action) => {
    setActionMsg('');
    try {
      let endpoint = '';
      let fetchOptions = { method: 'POST' };
      if (action === 'approve') {
        endpoint = `http://localhost:8080/api/admin/approve-payment?paymentId=${paymentId}`;
      } else {
        endpoint = `http://localhost:8080/api/admin/reject-payment?paymentId=${paymentId}`;
      }
      const response = await fetch(endpoint, fetchOptions);
      if (!response.ok) {
        let text = await response.text();
        throw new Error(text || `Failed to ${action} payment`);
      }
      const updatedPayment = await response.json();
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentId ? { ...payment, status: updatedPayment.status } : payment
        )
      );
      setActionMsg(`Payment ${action}d successfully!`);
    } catch (err) {
      setActionMsg(err.message);
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
        [
          p.user?.username,
          p.user?.id,
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
        const nA = a.user?.username || '', nB = b.user?.username || '';
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
                          src={getAvatar(payment.user?.username)}
                          alt={payment.user?.username}
                          className="avatar-img"
                          title={payment.user?.username}
                        />
                      </td>
                      {/* Username/email column */}
                      <td>
                        <span className="fw-semibold">{payment.user?.username || '-'}</span>
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

      {/* Applications Table */}
      <div className="card shadow-sm p-4 mb-5 dashboard-card">
        <ApplicationDetails />
      </div>

      <footer className="text-center text-secondary mt-4 pb-2 small">
        <span>
          Admin Portal &copy; {new Date().getFullYear()} | VETA | Modern UI Demo
        </span>
      </footer>
    </div>
  );
}

export default AdminDashboard;