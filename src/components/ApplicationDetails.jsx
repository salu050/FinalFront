import React, { useEffect, useState, useCallback } from 'react';
// Importing Font Awesome icons for the new summary cards
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faHourglassHalf, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

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

// New Summary Card Component for the dashboard statistics
const SummaryCard = ({ title, count, icon, cardBgColor }) => (
  <div className="summary-card card text-white border-0 shadow-lg" style={{
    background: cardBgColor,
    borderRadius: "1rem",
    minWidth: "220px",
    flex: "1",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
      e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.4)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
    }}
  >
    <div className="card-body p-4 d-flex align-items-center justify-content-between">
      <div>
        <h5 className="card-title text-white mb-2" style={{ fontWeight: 600, letterSpacing: 1 }}>{title}</h5>
        <h2 className="card-text fw-bold" style={{ fontSize: "2.5rem", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{count}</h2>
      </div>
      <div className="icon-circle d-flex align-items-center justify-content-center" style={{
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: "50%",
        width: "60px",
        height: "60px",
        fontSize: "1.8rem",
        color: "#fff"
      }}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </div>
);

function ApplicationDetails() {
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [selectedCourse, setSelectedCourse] = useState({});
  const [animRow, setAnimRow] = useState(null);
  const [allCourses, setAllCourses] = useState([]);

  // Filter and Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Updated state for summary cards to reflect application stats
  const [summary, setSummary] = useState({
    totalApplicants: 0,
    underReview: 0,
    selected: 0,
    rejected: 0,
  });

  // Helper function for fetching with improved error messages, now including auth token
  const fetchData = useCallback(async (url, errorMessagePrefix, setStateCallback, setLoading = null) => {
    if (setLoading) setLoading(true);
    const token = localStorage.getItem('jwtToken');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-logout'));
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorDetail = response.statusText ? `Status: ${response.status} - ${response.statusText}` : 'Unknown error';
        throw new Error(`${errorMessagePrefix}: ${errorDetail}`);
      }
      const data = await response.json();
      // Keep this existing log to inspect the raw fetched data
      console.log(`Fetched data from ${url}:`, data);

      // --- NEW DEBUGGING STEP: Check for duplicate IDs in the fetched data ---
      if (url.includes('/api/dashboard/applicants')) {
        const ids = data.map(item => item.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
          console.error("CRITICAL ERROR: Duplicate application IDs found in fetched data:", duplicateIds, "Full data:", data);
        }
      }
      // --- END NEW DEBUGGING STEP ---

      setStateCallback(data);
    } catch (err) {
      console.error(err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setActionMsg(`Error: Cannot connect to backend. Please ensure your Spring Boot server is running on ${url.split('/')[2]}.`);
      } else {
        setActionMsg(err.message);
      }
    } finally {
      if (setLoading) setLoading(false);
    }
  }, []);

  // Effect to fetch all applications
  const fetchApplications = useCallback(() => {
    fetchData('http://localhost:8082/api/dashboard/applicants', 'Failed to fetch applicants for dashboard', setApplications, setLoadingApplications);
  }, [fetchData]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Effect to fetch all courses for dropdown options
  useEffect(() => {
    fetchData('http://localhost:8082/api/courses', 'Failed to fetch courses', setAllCourses);
  }, [fetchData]);

  // Effect to calculate summary counts whenever applications change
  useEffect(() => {
    const totalApplicants = applications.length;
    // CRITICAL FIX: Changed app.application_status to app.status here
    const underReview = applications.filter(app => app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW').length;
    // CRITICAL FIX: Changed app.application_status to app.status here
    const selected = applications.filter(app => app.status === 'SELECTED').length;
    // CRITICAL FIX: Changed app.application_status to app.status here
    const rejected = applications.filter(app => app.status === 'REJECTED').length;

    setSummary({ totalApplicants, underReview, selected, rejected });
  }, [applications]);

  const handleSelectStudent = async (id, adminSelectedCenter) => {
    setActionMsg('');
    const courseId = selectedCourse[id];
    if (!courseId) {
      setActionMsg('Please select a course before selecting the student.');
      return;
    }
    const token = localStorage.getItem('jwtToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `http://localhost:8082/api/applications/${id}/select/${courseId}/${adminSelectedCenter}`,
        {
          method: 'POST',
          headers: headers
        }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-logout'));
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorText = await response.text();
        throw new Error(`Failed to select student: ${errorText}`);
      }
      // Update local state for immediate feedback
      setApplications(apps =>
        apps.map(app =>
          // CRITICAL FIX: Changed application_status to status here
          app.id === id ? { ...app, status: 'SELECTED', adminSelectedCourseId: courseId, adminSelectedCenter: adminSelectedCenter } : app
        )
      );
      setActionMsg('Student selected!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);

      // IMPORTANT: Re-fetch all applications after successful action to ensure consistency with backend
      fetchApplications();

    } catch (err) {
      console.error("Error selecting student:", err);
      setActionMsg(err.message);
    }
  };

  const handleRejectStudent = async (id) => {
    setActionMsg('');
    const token = localStorage.getItem('jwtToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `http://localhost:8082/api/applications/${id}/reject`,
        {
          method: 'POST',
          headers: headers
        }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-logout'));
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorText = await response.text();
        throw new Error(`Failed to reject student: ${errorText}`);
      }
      // Update local state for immediate feedback
      setApplications(apps =>
        apps.map(app =>
          // CRITICAL FIX: Changed application_status to status here
          app.id === id ? { ...app, status: 'REJECTED' } : app
        )
      );
      setActionMsg('Student rejected!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);

      // IMPORTANT: Re-fetch all applications after successful action to ensure consistency with backend
      fetchApplications();

    } catch (err) {
      console.error("Error rejecting student:", err);
      setActionMsg(err.message);
    }
  };

  // Filtered and sorted applications based on state
  const filteredAndSortedApplications = applications
    .filter(app => {
      // Search filter
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = (
        (app.fullname && app.fullname.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (app.center && app.center.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (app.educationLevel && app.educationLevel.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (app.id && app.id.toString().includes(lowerCaseSearchTerm)) ||
        (app.registrationNumber && app.registrationNumber.toLowerCase().includes(lowerCaseSearchTerm))
      );

      // Status filter
      let matchesStatus = false;
      if (filterStatus === 'All') {
        matchesStatus = true;
      } else if (filterStatus === 'SUBMITTED') {
        // CRITICAL FIX: Changed app.application_status to app.status here
        matchesStatus = app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW';
      } else {
        // CRITICAL FIX: Changed app.application_status to app.status here
        matchesStatus = (app.status && app.status.toUpperCase() === filterStatus.toUpperCase());
      }
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by date (assuming 'createdAt' is available on the DTO)
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      if (sortBy === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else { // 'oldest'
        return dateA.getTime() - dateB.getTime();
      }
    });

  // Add global style for modern and animated UI and dark background
  useEffect(() => {
    const styleId = "appdetails-modern-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
      /* General Table and Badge Styles */
      .modern-table th, .modern-table td {
        vertical-align: middle !important;
      }
      .modern-table th {
        border-bottom: 2.5px solid #6366f1 !important;
        background: linear-gradient(90deg,#6366f1,#38bdf8 110%);
        color: #fff !important;
        font-size: 1rem;
        letter-spacing: 1px;
        padding: 1rem 0.75rem; /* Increased padding for headers */
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
      .modern-select:focus, .modern-input:focus {
        box-shadow: 0 0 0 0.17rem #6366f180 !important;
        border-color: #6366f1 !important;
      }

      /* Main background and text color for the entire component */
      .appdetails-bg-ministry {
        background: linear-gradient(135deg,#141e30,#243b55 80%) !important;
        color: #f7f8fa !important;
      }
      /* Ensure inner cards, table headers/cells inherit text color, and have transparent backgrounds */
      .appdetails-bg-ministry .card,
      .appdetails-bg-ministry .modern-table th,
      .appdetails-bg-ministry .modern-table td {
        background: transparent !important;
        color: #f7f8fa !important;
      }
      /* Hover effect for table rows in dark theme */
      .appdetails-bg-ministry .modern-table tbody tr:hover {
        background: #232f45 !important;
      }
      /* Styling for form controls (select, input) in dark theme */
      .appdetails-bg-ministry .form-select,
      .appdetails-bg-ministry .form-control {
        background: #1a2236 !important;
        color: #f7f8fa !important;
        border-color: #6366f1 !important; /* Accent border color */
        padding: 0.6rem 1rem; /* Adjust padding for better look */
      }
      .appdetails-bg-ministry .form-select option {
        background: #1a2236; /* Background for dropdown options */
        color: #f7f8fa;
      }
      /* Styling for alert messages */
      .appdetails-bg-ministry .alert {
        background: #232946 !important;
        border: 1.5px solid #6366f1;
        color: #a5b4fc !important;
        border-radius: 1rem;
        font-weight: 500;
        letter-spacing: 1px;
      }
      /* Border radius for filter/search controls */
      .filter-control-group .form-control,
      .filter-control-group .form-select {
        border-radius: 0.7rem;
      }

      /* Responsive adjustments for summary cards */
      @media (max-width: 768px) {
        .summary-card {
          min-width: 100%; /* Full width on small screens */
          margin-bottom: 1rem;
        }
      }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="card shadow-lg p-4 appdetails-bg-ministry" style={{
      borderRadius: "1.5rem",
      background: '#1a2236', // Main card background
      color: '#f7f8fa',
      boxShadow: "0 8px 32px rgba(99,102,241,0.2)" // Stronger shadow for the main card
    }}>
      <div className="text-center mb-5">
        <h4 className="mb-2 fw-bold" style={{
          fontSize: "2.5rem",
          letterSpacing: 2,
          color: "#fff" // White color for the heading to match the image
        }}>
          Admin Dashboard
        </h4>
        <p className="mb-4 fw-light text-center" style={{ fontSize: "1rem", maxWidth: "600px", margin: "auto", color: "#a5b4fc" }}>
          Welcome to your <span className="fw-bold" style={{ color: "#fff" }}>powerful</span> & <span className="fw-bold" style={{ color: "#fff" }}>modern</span> administration panel. Manage application details, to select only qualified applicants, and reject those unqualified applicants to join in various programs based on their choice!
        </p>
      </div>

      {/* NEW: Summary Cards section - Centered using justify-content-center */}
      <div className="d-flex flex-wrap justify-content-center align-items-stretch gap-3 mb-5">
        <SummaryCard
          title="Total Applicants"
          count={summary.totalApplicants}
          icon={faUsers} // Icon for total applicants
          cardBgColor="linear-gradient(45deg, #6366f1, #8b5cf6)" // Purple-blue gradient for Total
        />
        <SummaryCard
          title="Selected"
          count={summary.selected}
          icon={faCheckCircle} // Icon for selected
          cardBgColor="linear-gradient(45deg, #22c55e, #34d399)" // Green gradient for Selected
        />
        <SummaryCard
          title="Under Review"
          count={summary.underReview}
          icon={faHourglassHalf} // Icon for under review
          cardBgColor="linear-gradient(45deg, #f97316, #facc15)" // Orange-yellow gradient for Under Review
        />
        <SummaryCard
          title="Rejected"
          count={summary.rejected}
          icon={faTimesCircle} // Icon for rejected
          cardBgColor="linear-gradient(45deg, #ef4444, #f87171)" // Red gradient for Rejected
        />
      </div>

      {/* Filter and Search Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3 filter-control-group">
        <input
          type="text"
          className="form-control modern-input flex-grow-1"
          placeholder="Search by ID, Name, Education, Center, or Reg. Number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '500px' }}
        />
        <select
          className="form-select modern-select flex-grow-0"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="All">All Status</option>
          <option value="SUBMITTED">Under Review</option>
          <option value="SELECTED">Selected</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          className="form-select modern-select flex-grow-0"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ maxWidth: '180px' }}
        >
          <option value="newest">Sort by Newest</option>
          <option value="oldest">Sort by Oldest</option>
        </select>
      </div>

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
                <th>Education Level</th>
                <th>Center</th>
                <th>Preferred Course</th>
                <th>Registration Number</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedApplications.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">No applications found matching your criteria.</td>
                </tr>
              ) : (
                filteredAndSortedApplications.map(app => (
                  <tr key={app.id} className={animRow === app.id ? "modern-row-anim" : ""}>
                    <td>{app.id}</td>
                    <td className="fw-semibold" style={{ letterSpacing: 1 }}>{app.fullname}</td>
                    <td style={{ fontWeight: 500 }}>{app.educationLevel}</td>
                    <td style={{ fontWeight: 500 }}>{app.center}</td>
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
                        // CRITICAL FIX: Changed app.application_status to app.status here
                        disabled={app.status === 'SELECTED' || app.status === 'REJECTED'}
                        style={{
                          background: "#1a2236",
                          borderRadius: "0.7rem",
                          border: '1.2px solid #6366f1',
                          fontWeight: 500,
                          fontSize: '1rem',
                          color: "#f7f8fa"
                        }}
                      >
                        <option value="">--Select Course--</option>
                        {/* Filter out duplicate course IDs before mapping to options */}
                        {Array.from(new Set(app.preferredCourses || [])).map(courseId => {
                          const course = allCourses.find(c => c.id === courseId);
                          return course ? (
                            <option key={`${app.id}-${course.id}`} value={course.id}>
                              {course.name}
                            </option>
                          ) : null;
                        })}
                      </select>
                    </td>
                    {/* Display registrationNumber */}
                    <td style={{ fontWeight: 500 }}>{app.registrationNumber || 'N/A'}</td>
                    {/* Display Submission Date */}
                    <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {/* CRITICAL FIX: Changed app.application_status to app.status here */}
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="text-center">
                      <AnimatedButton
                        className="btn-success btn-sm me-2"
                        onClick={() => handleSelectStudent(app.id, app.center)}
                        // CRITICAL FIX: Changed app.application_status to app.status here
                        disabled={
                          app.status === 'SELECTED' ||
                          app.status === 'REJECTED' ||
                          !selectedCourse[app.id]
                        }
                        style={{
                          background: "linear-gradient(90deg,#43e97b,#38f9d7 90%)",
                          border: "none",
                          color: "#fff"
                        }}
                      >
                        <span style={{ fontWeight: 700, letterSpacing: 1 }}>Select</span>
                      </AnimatedButton>
                      <AnimatedButton
                        className="btn-danger btn-sm"
                        onClick={() => handleRejectStudent(app.id)}
                        // CRITICAL FIX: Changed app.application_status to app.status here
                        disabled={app.status === 'REJECTED' || app.status === 'SELECTED'}
                        style={{
                          background: "linear-gradient(90deg,#f43f5e,#fb7185 90%)",
                          border: "none",
                          color: "#fff"
                        }}
                      >
                        <span style={{ fontWeight: 700, letterSpacing: 1 }}>Reject</span>
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
        }}>
          {actionMsg}
        </div>
      )}
    </div>
  );
}

export default ApplicationDetails;
