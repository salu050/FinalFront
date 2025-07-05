import React, { useEffect, useState } from 'react';

// Modern status badge component
const StatusBadge = ({ status }) => {
  if (status === 'SELECTED')
    return <span className="badge rounded-pill bg-gradient-success px-3 py-2 fs-6" style={{ background: "linear-gradient(90deg,#43e97b,#38f9d7 90%)", color: "#fff" }}>Selected</span>;
  if (status === 'REJECTED')
    return <span className="badge rounded-pill bg-gradient-danger px-3 py-2 fs-6" style={{ background: "linear-gradient(90deg,#f43f5e,#fb7185 90%)", color: "#fff" }}>Rejected</span>;
  return <span className="badge rounded-pill bg-gradient-warning px-3 py-2 fs-6" style={{ background: "linear-gradient(90deg,#fbbf24,#f472b6 90%)", color: "#333" }}>Under Review</span>;
};

// Animated Select Button
const AnimatedButton = ({ children, className, ...props }) => (
  <button
    className={`btn shadow-sm fw-semibold ${className}`}
    style={{
      transition: "transform 0.17s cubic-bezier(.57,1.5,.53,1), box-shadow 0.2s",
      willChange: "transform",
      letterSpacing: 1,
    }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    {...props}
  >
    {children}
  </button>
);

function ApplicationDetails() {
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [selectedCourse, setSelectedCourse] = useState({}); // Track selected course per application
  const [animRow, setAnimRow] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/applications')
      .then(res => res.json())
      .then(data => {
        setApplications(data);
        setLoadingApplications(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingApplications(false);
      });
  }, []);

  const handleSelectStudent = async (id) => {
    setActionMsg('');
    const courseId = selectedCourse[id];
    if (!courseId) {
      setActionMsg('Please select a course before selecting the student.');
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8080/api/applications/${id}/select/${courseId}`,
        {
          method: 'POST', // Changed to POST
          headers: { 'Content-Type': 'application/json' }
        }
      );
      if (!response.ok) throw new Error('Failed to select student');
      setApplications(apps =>
        apps.map(app =>
          app.id === id
            ? { ...app, applicationStatus: 'SELECTED', selectedCourseId: courseId }
            : app
        )
      );
      setActionMsg('Student selected!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);
    } catch (err) {
      setActionMsg(err.message);
    }
  };

  const handleRejectStudent = async (id) => {
    setActionMsg('');
    try {
      const response = await fetch(
        `http://localhost:8080/api/applications/${id}/reject`,
        {
          method: 'POST', // Changed to POST
        }
      );
      if (!response.ok) throw new Error('Failed to reject student');
      setApplications(apps =>
        apps.map(app =>
          app.id === id ? { ...app, applicationStatus: 'REJECTED' } : app
        )
      );
      setActionMsg('Student rejected!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);
    } catch (err) {
      setActionMsg(err.message);
    }
  };

  // Add global style for modern and animated UI and dark background
  useEffect(() => {
    const styleId = "appdetails-modern-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
      .modern-table th, .modern-table td {
        vertical-align: middle !important;
      }
      .modern-table th {
        border-bottom: 2.5px solid #6366f1 !important;
        background: linear-gradient(90deg,#6366f1,#38bdf8 110%);
        color: #fff !important;
        font-size: 1rem;
        letter-spacing: 1px;
      }
      .modern-table tr {
        transition: background 0.22s, box-shadow 0.22s;
      }
      .modern-row-anim {
        animation: rowPopAnim 0.9s cubic-bezier(.57,1.5,.53,1) both;
      }
      @keyframes rowPopAnim {
        0% { background: #d1fae5; transform: scale(0.97);}
        50% {background: #bef264;}
        100% { background: transparent; transform: scale(1);}
      }
      .modern-table tbody tr:hover {
        background: #273352 !important;
        box-shadow: 0 2px 16px #141e30cc;
      }
      .bg-gradient-success { background: linear-gradient(90deg,#43e97b,#38f9d7 90%) !important; }
      .bg-gradient-danger { background: linear-gradient(90deg,#f43f5e,#fb7185 90%) !important; }
      .bg-gradient-warning { background: linear-gradient(90deg,#fbbf24,#f472b6 90%) !important; }
      .modern-select:focus {
        box-shadow: 0 0 0 0.17rem #6366f180;
        border-color: #6366f1;
      }
      .appdetails-bg-ministry {
        background: linear-gradient(135deg,#141e30,#243b55 80%) !important;
        color: #f7f8fa !important;
      }
      .appdetails-bg-ministry .card,
      .appdetails-bg-ministry .modern-table th,
      .appdetails-bg-ministry .modern-table td {
        background: transparent !important;
        color: #f7f8fa !important;
      }
      .appdetails-bg-ministry .modern-table tbody tr:hover {
        background: #232f45 !important;
      }
      .appdetails-bg-ministry .form-select,
      .appdetails-bg-ministry .form-control {
        background: #1a2236 !important;
        color: #f7f8fa !important;
        border-color: #6366f1 !important;
      }
      .appdetails-bg-ministry .alert {
        background: #232946 !important;
        color: #a5b4fc !important;
        border-color: #6366f1 !important;
      }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="card shadow-lg p-4 appdetails-bg-ministry" style={{
      borderRadius: "1.5rem",
      background: 'linear-gradient(135deg,#141e30,#243b55 80%)',
      color: '#f7f8fa',
      boxShadow: "0 8px 32px #6366f133"
    }}>
      <h4 className="mb-3 fw-bold" style={{
        background: "linear-gradient(90deg, #6366f1, #43e97b, #fa8bff 80%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontFamily: "Poppins, Arial, sans-serif",
        letterSpacing: 1
      }}>
        Student Applications
      </h4>
      {loadingApplications ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary mb-2" />
          <div>Loading applications...</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Center</th>
                <th>Courses</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">No applications found.</td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className={animRow === app.id ? "modern-row-anim" : ""}>
                    <td>{app.id}</td>
                    <td className="fw-semibold" style={{letterSpacing:1}}>{app.fullname}</td>
                    <td style={{fontWeight:500}}>{app.center}</td>
                    <td>
                      <select
                        className="form-select form-select-sm modern-select"
                        value={selectedCourse[app.id] || ''}
                        onChange={e =>
                          setSelectedCourse({
                            ...selectedCourse,
                            [app.id]: e.target.value,
                          })
                        }
                        disabled={app.applicationStatus === 'SELECTED' || app.applicationStatus === 'REJECTED'}
                        style={{
                          background: "#1a2236",
                          borderRadius: "0.7rem",
                          border: '1.2px solid #6366f1',
                          fontWeight:500,
                          fontSize:'1rem',
                          color: "#f7f8fa"
                        }}
                      >
                        <option value="">--Select Course--</option>
                        {(app.courses || []).map(course => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <StatusBadge status={app.applicationStatus} />
                    </td>
                    <td className="text-center">
                      <AnimatedButton
                        className="btn-success btn-sm me-2"
                        onClick={() => handleSelectStudent(app.id)}
                        disabled={
                          app.applicationStatus === 'SELECTED' ||
                          app.applicationStatus === 'REJECTED' ||
                          !selectedCourse[app.id]
                        }
                        style={{
                          background: "linear-gradient(90deg,#43e97b,#38f9d7 90%)",
                          border: "none",
                          color: "#fff"
                        }}
                      >
                        <span style={{fontWeight:700, letterSpacing:1}}>Select</span>
                      </AnimatedButton>
                      <AnimatedButton
                        className="btn-danger btn-sm"
                        onClick={() => handleRejectStudent(app.id)}
                        disabled={app.applicationStatus === 'REJECTED' || app.applicationStatus === 'SELECTED'}
                        style={{
                          background: "linear-gradient(90deg,#f43f5e,#fb7185 90%)",
                          border: "none",
                          color: "#fff"
                        }}
                      >
                        <span style={{fontWeight:700, letterSpacing:1}}>Reject</span>
                      </AnimatedButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {actionMsg && (
        <div className="alert alert-info mt-3 text-center animated fadeInDown" style={{
          background: "#232946",
          border: "1.5px solid #6366f1",
          color: "#a5b4fc",
          borderRadius: "1rem",
          fontWeight: 500,
          letterSpacing: 1
        }}>{actionMsg}</div>
      )}
    </div>
  );
}

export default ApplicationDetails;