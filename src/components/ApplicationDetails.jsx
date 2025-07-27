import React, { useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import {
  Table,
  InputGroup,
  FormControl,
  Button,
  Card,
  Row,
  Col,
  Spinner,
  Badge,
  ProgressBar,
  Alert,
} from 'react-bootstrap';
import {
  FaDownload,
  FaChartBar,
  FaUser,
  FaSort,
  FaFilter,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaClipboard,
  FaCopy,
  FaCheckCircle, // For Selected status icon in summary
  FaHourglassHalf, // For Pending status icon in summary
  FaTimesCircle, // For Rejected status icon in summary
  FaDatabase, // For Total Applications icon in summary
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

// Modern status badge component
const StatusBadge = ({ status }) => {
  if (status === 'SELECTED')
    return <span className="badge rounded-pill bg-gradient-success px-3 py-2 fs-6" style={{ background: "linear-gradient(90deg,#43e97b,#38f9d7 90%)", color: "#fff" }}>Selected</span>;
  if (status === 'REJECTED')
    return <span className="badge rounded-pill bg-gradient-danger px-3 py-2 fs-6" style={{ background: "linear-gradient(90deg,#f43f5e,#fb7185 90%)", color: "#fff" }}>Rejected</span>;
  return <span className="badge rounded-pill bg-gradient-warning px-3 py-2 fs-6" style={{ background: "linear-gradient(90deg,#fbbf24,#f472b6 90%)", color: "#333" }}>Under Review</span>;
};

// Animated Select/Reject Button
const AnimatedActionButton = ({ children, className, ...props }) => (
  <button
    className={`btn shadow-sm fw-semibold ${className}`}
    style={{
      transition: "transform 0.17s cubic-bezier(.57,1.5,.53,1), box-shadow 0.2s",
      willChange: "transform",
      letterSpacing: 1,
      minWidth: '70px'
    }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    {...props}
  >
    {children}
  </button>
);

const BACKEND_BASE_URL = 'http://localhost:8082';

function ApplicationDetails() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('fullname');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [animRow, setAnimRow] = useState(null); // For row highlight animation

  const [selectedCoursePerApplication, setSelectedCoursePerApplication] = useState({});

  useEffect(() => {
    fetchApplications();
    window.addEventListener('scroll', handleScrollButton);
    return () => window.removeEventListener('scroll', handleScrollButton);
  }, []);

  // Removed showToastNotify function as Toast components are removed

  const fetchApplications = () => {
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/applications`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const initialSelectedCourses = {};
        data.forEach(app => {
            if (app.selectedCourseId) {
                initialSelectedCourses[app.id] = app.selectedCourseId;
            }
        });
        setApplications(data);
        setSelectedCoursePerApplication(initialSelectedCourses);
        setLoading(false);
        // Removed showToastNotify call here
      })
      .catch((error) => {
        console.error("Error fetching applications:", error);
        setLoading(false);
        // Removed showToastNotify call here
      });
  };

  const handleSelectStudent = async (id) => {
    const courseId = selectedCoursePerApplication[id];
    if (!courseId) {
      // You might want to use a simple console.log or a basic alert substitute if needed
      console.log('Please select a course before selecting the student.');
      // alert('Please select a course before selecting the student.'); // Avoid alert in production
      return;
    }
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/applications/${id}/select/${courseId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      if (!response.ok) throw new Error('Failed to select student');
      
      setApplications(prevApps =>
        prevApps.map(app =>
          app.id === id
            ? { ...app, applicationStatus: 'SELECTED', selectedCourseId: courseId }
            : app
        )
      );
      console.log('Student selected successfully!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);
    } catch (err) {
      console.error('Error selecting student:', err.message);
      // alert(`Error: ${err.message}`); // Avoid alert in production
    }
  };

  const handleRejectStudent = async (id) => {
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/applications/${id}/reject`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) throw new Error('Failed to reject student');
      
      setApplications(prevApps =>
        prevApps.map(app =>
          app.id === id ? { ...app, applicationStatus: 'REJECTED' } : app
        )
      );
      console.log('Student rejected!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);
    } catch (err) {
      console.error('Error rejecting student:', err.message);
      // alert(`Error: ${err.message}`); // Avoid alert in production
    }
  };

  const filteredApplications = applications
    .filter(app =>
      (
        (app.fullname || app.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.course || app.courseName || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.center || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.username || '').toLowerCase().includes(search.toLowerCase())
      )
      && (filterStatus === 'All' || app.applicationStatus === filterStatus)
    )
    .sort((a, b) => {
      const aVal = (a[sortKey] || a[sortKey.charAt(0).toUpperCase() + sortKey.slice(1)] || '').toLowerCase();
      const bVal = (b[sortKey] || b[sortKey].charAt(0).toUpperCase() + b[sortKey].slice(1) || '').toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  const csvHeaders = [
    { label: 'ID', key: 'id' },
    { label: 'Full Name', key: 'fullname' },
    { label: 'Username', key: 'username' },
    { label: 'Center', key: 'center' },
    { label: 'Selected Course ID', key: 'selectedCourseId' },
    { label: 'Application Status', key: 'applicationStatus' },
  ];

  const dataForCsv = filteredApplications.map(app => ({
    id: app.id,
    fullname: app.fullname || app.fullName || '',
    username: app.username || '',
    center: app.center || '',
    selectedCourseId: app.selectedCourseId || '',
    applicationStatus: app.applicationStatus || '',
  }));

  const copyFilteredToClipboard = async () => {
    const rows = [
      csvHeaders.map(h => h.label).join(','),
      ...filteredApplications.map(app =>
        [
          app.id,
          app.fullname || app.fullName || '',
          app.username || '',
          app.center || '',
          app.selectedCourseId || '',
          app.applicationStatus || '',
        ].map(v => `"${(v + '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(rows);
      console.log("Visible table copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  function handleScrollButton() {
    if (window.scrollY > 300) setShowScroll(true);
    else setShowScroll(false);
  }
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
    setRefreshing(false);
  };

  const glassStyle = {
    background: 'rgba(30, 34, 56, 0.96)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.10)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    transition: 'background 0.5s, color 0.5s'
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return <FaSort />;
    return sortAsc ? <FaArrowUp color="#2196F3" /> : <FaArrowDown color="#e53935" />;
  };

  const totalApplications = applications.length;
  const selectedCount = applications.filter(app => app.applicationStatus === 'SELECTED').length;
  const pendingCount = applications.filter(app => app.applicationStatus === 'PENDING' || app.applicationStatus === 'UNDER_REVIEW').length;
  const rejectedCount = applications.filter(app => app.applicationStatus === 'REJECTED').length;

  useEffect(() => {
    const styleId = "appdetails-modern-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
      .modern-table th, .modern-table td {
        vertical-align: middle !important;
        padding: 12px 10px; /* Slightly more padding for table cells */
      }
      .modern-table th {
        border-bottom: 2.5px solid #6366f1 !important;
        background: linear-gradient(90deg,#6366f1,#38bdf8 110%);
        color: #fff !important;
        font-size: 1rem;
        letter-spacing: 1px;
        white-space: nowrap; /* Prevent headers from wrapping */
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
        box-shadow: 0 2px 16px rgba(20,30,48,0.8); /* Stronger shadow on hover */
        transform: translateY(-2px); /* Slight lift on hover */
      }
      .bg-gradient-success { background: linear-gradient(90deg,#43e97b,#38f9d7 90%) !important; }
      .bg-gradient-danger { background: linear-gradient(90deg,#f43f5e,#fb7185 90%) !important; }
      .bg-gradient-warning { background: linear-gradient(90deg,#fbbf24,#f472b6 90%) !important; }
      .modern-select:focus {
        box-shadow: 0 0 0 0.17rem #6366f180;
        border-color: #6366f1;
      }
      .appdetails-bg-dark { /* Renamed for clarity - this is the main background class */
        background: linear-gradient(135deg,#1A202C,#2D3748 80%) !important; /* Darker, more consistent background */
        color: #f7f8fa !important;
        min-height: 100vh; /* Ensure it covers full viewport height */
        padding-bottom: 50px;
      }
      .appdetails-bg-dark .card,
      .appdetails-bg-dark .modern-table th,
      .appdetails-bg-dark .modern-table td {
        background: transparent !important;
        color: #f7f8fa !important;
      }
      .appdetails-bg-dark .form-select,
      .appdetails-bg-dark .form-control {
        background: #2D3748 !important; /* Deeper input background */
        color: #f7f8fa !important;
        border-color: #4A5568 !important; /* Softer border color */
      }
      .appdetails-bg-dark .alert {
        background: #2D3748 !important;
        color: #A0AEC0 !important;
        border-color: #4A5568 !important;
      }
      .appdetails-bg-dark .btn-outline-info {
        color: #38bdf8 !important;
        border-color: #38bdf8 !important;
      }
      .appdetails-bg-dark .btn-outline-secondary {
        color: #cbd5e0 !important;
        border-color: #cbd5e0 !important;
      }
      .appdetails-bg-dark .btn-outline-primary {
        color: #6366f1 !important;
        border-color: #6366f1 !important;
      }

      /* Card hover animation */
      .summary-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .summary-card:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4), 0 0 30px rgba(100,200,255,0.5); /* Enhanced shadow on hover */
      }

      /* Heading gradient animation */
      .animated-heading {
        animation: gradient-flow 8s ease infinite alternate;
        background-size: 200% auto;
      }
      @keyframes gradient-flow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* Placeholder for modern form control text color */
      .form-control::placeholder {
        color: #a0aec0 !important; /* Lighter placeholder text */
        opacity: 0.8;
      }
      .form-control, .form-select {
        color: #f7f8fa !important; /* Ensure input text is light */
      }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const subtitle = "Streamline student selection, manage applications, and gain insights into enrollment trends with precision and ease.";

  return (
    <div className="appdetails-bg-dark">
      {/* Scroll to top button */}
      {showScroll && (
        <Button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            borderRadius: '50%',
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(60,60,120,0.4)',
            background: '#2196F3',
            color: '#fff',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FaArrowUp />
        </Button>
      )}

      <div className="container py-5">
        <Row className="mb-4">
          <Col>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h1
                className="fw-bold animated-heading"
                style={{
                  background: "linear-gradient(90deg, #6366f1, #43e97b, #fa8bff 80%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "Poppins, Arial, sans-serif",
                  letterSpacing: 2,
                  fontSize: "2.7rem",
                  textShadow: "0 8px 32px rgba(35,43,64,0.17), 0 1px 5px #1e293b",
                  textAlign: "center"
                }}
              >
                <FaUser className="me-2" style={{ color: "#4f8cff" }} />
                Student Application Management
              </h1>
              <h5 style={{
                color: "#a5b4fc",
                fontWeight: 400,
                textAlign: "center",
                maxWidth: 780,
                margin: "0.5rem auto 0 auto",
                letterSpacing: 1,
                fontStyle: "italic"
              }}>
                {subtitle}
              </h5>
            </div>
          </Col>
        </Row>

        {/* Summary Cards Section */}
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card style={glassStyle} className="text-center shadow-sm summary-card">
              <Card.Body>
                <Card.Title><FaDatabase /><span className="ms-1">Total Applications</span></Card.Title>
                <h3 className="display-6">{totalApplications}</h3>
                <small className="text-info">Overall count</small>
                <ProgressBar now={100} variant="info" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={glassStyle} className="text-center shadow-sm summary-card">
              <Card.Body>
                <Card.Title><FaCheckCircle /><span className="ms-1">Selected</span></Card.Title>
                <h3 className="display-6">{selectedCount}</h3>
                <small className="text-success">Students selected</small>
                <ProgressBar now={(selectedCount / (totalApplications || 1)) * 100} variant="success" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={glassStyle} className="text-center shadow-sm summary-card">
              <Card.Body>
                <Card.Title><FaHourglassHalf /><span className="ms-1">Pending</span></Card.Title>
                <h3 className="display-6">{pendingCount}</h3>
                <small className="text-warning">Under review</small>
                <ProgressBar now={(pendingCount / (totalApplications || 1)) * 100} variant="warning" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={glassStyle} className="text-center shadow-sm summary-card">
              <Card.Body>
                <Card.Title><FaTimesCircle /><span className="ms-1">Rejected</span></Card.Title>
                <h3 className="display-6">{rejectedCount}</h3>
                <small className="text-danger">Applications rejected</small>
                <ProgressBar now={(rejectedCount / (totalApplications || 1)) * 100} variant="danger" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search, Filter, Refresh, Download Controls */}
        <Row className="mb-3 g-2">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text style={glassStyle}><FaSearch /></InputGroup.Text>
              <FormControl
                placeholder="Search by name, course, center, or username"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={glassStyle}
                className="border-primary"
              />
              <Button variant="outline-primary" onClick={handleRefresh} disabled={refreshing} style={glassStyle}>
                <FaSyncAlt className={refreshing ? "fa-spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </InputGroup>
          </Col>
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text style={glassStyle}><FaFilter /></InputGroup.Text>
              <FormControl
                as="select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={glassStyle}
                className="border-primary"
              >
                <option value="All">All Status</option>
                <option value="SELECTED">Selected</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="REJECTED">Rejected</option>
              </FormControl>
            </InputGroup>
          </Col>
          <Col md={4} className="d-flex justify-content-end align-items-center">
            <CSVLink
              data={dataForCsv}
              headers={csvHeaders}
              filename={"applicant-management-report.csv"}
              className="btn btn-outline-info me-2"
              style={{ borderRadius: 50, fontWeight: 500, color: "#38bdf8", borderColor: "#38bdf8", background: 'rgba(56, 189, 248, 0.1)' }}
            >
              <FaDownload /> Download CSV
            </CSVLink>
            <Button
              variant="outline-secondary"
              onClick={copyFilteredToClipboard}
              title="Copy visible table to clipboard"
              style={{ borderRadius: 50, fontWeight: 500, color: "#cbd5e0", borderColor: "#cbd5e0", background: 'rgba(203, 213, 224, 0.1)' }}
            >
              <FaClipboard /> Copy Table
            </Button>
          </Col>
        </Row>

        {/* Applications Table */}
        <Card style={glassStyle} className="mb-4 shadow">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                <p className="mt-3 text-white">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-5">
                <Alert variant="info" className="mb-0" style={{ ...glassStyle, background: 'rgba(45, 55, 72, 0.8) !important', color: '#a0aec0 !important' }}>
                  No applications found matching your criteria.
                </Alert>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                <Table
                  striped
                  bordered
                  hover
                  responsive
                  variant="dark"
                  className="mb-0 modern-table"
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    fontSize: 17,
                    letterSpacing: 0.1,
                    boxShadow: '0 4px 32px 0 rgba(31, 38, 135, 0.04)'
                  }}
                >
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th
                        onClick={() => { setSortKey('fullname'); setSortAsc(sk => !sk); }}
                        style={{ cursor: 'pointer' }}
                      >
                        Full Name {getSortIcon('fullname')}
                      </th>
                      <th
                        onClick={() => { setSortKey('center'); setSortAsc(sk => !sk); }}
                        style={{ cursor: 'pointer' }}
                      >
                        Center {getSortIcon('center')}
                      </th>
                      <th
                        onClick={() => { setSortKey('courses'); setSortAsc(sk => !sk); }}
                        style={{ cursor: 'pointer' }}
                      >
                        Courses {getSortIcon('courses')}
                      </th>
                      <th
                        onClick={() => { setSortKey('applicationStatus'); setSortAsc(sk => !sk); }}
                        style={{ cursor: 'pointer' }}
                      >
                        Application Status {getSortIcon('applicationStatus')}
                      </th>
                      <th>Username</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map(app => (
                      <tr key={app.id} className={animRow === app.id ? "modern-row-anim" : ""}>
                        <td>{app.id}</td>
                        <td className="fw-semibold" style={{ letterSpacing: 1 }}>{app.fullname || app.fullName}</td>
                        <td style={{ fontWeight: 500 }}>{app.center}</td>
                        <td>
                          <select
                            className="form-select form-select-sm modern-select"
                            value={selectedCoursePerApplication[app.id] || ''}
                            onChange={e =>
                              setSelectedCoursePerApplication({
                                ...selectedCoursePerApplication,
                                [app.id]: e.target.value,
                              })
                            }
                            disabled={app.applicationStatus === 'SELECTED' || app.applicationStatus === 'REJECTED'}
                            style={{
                              background: "#1a2236",
                              borderRadius: "0.7rem",
                              border: '1.2px solid #6366f1',
                              fontWeight: 500,
                              fontSize: '0.9rem',
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
                          {app.selectedCourseId && app.applicationStatus === 'SELECTED' && (
                            <div className="mt-1" style={{ fontSize: '0.85rem', color: '#bbf7d0' }}>
                              Selected: {app.courses.find(c => c.id === app.selectedCourseId)?.name || 'N/A'}
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={app.applicationStatus} />
                        </td>
                        <td>
                          <span>{app.username}</span>
                        </td>
                        <td className="text-center">
                          <AnimatedActionButton
                            className="btn-success btn-sm me-2"
                            onClick={() => handleSelectStudent(app.id)}
                            disabled={
                              app.applicationStatus === 'SELECTED' ||
                              app.applicationStatus === 'REJECTED' ||
                              !selectedCoursePerApplication[app.id]
                            }
                            style={{
                              background: "linear-gradient(90deg,#43e97b,#38f9d7 90%)",
                              border: "none",
                              color: "#fff"
                            }}
                          >
                            <span style={{ fontWeight: 700, letterSpacing: 1 }}>Select</span>
                          </AnimatedActionButton>
                          <AnimatedActionButton
                            className="btn-danger btn-sm"
                            onClick={() => handleRejectStudent(app.id)}
                            disabled={app.applicationStatus === 'REJECTED' || app.applicationStatus === 'SELECTED'}
                            style={{
                              background: "linear-gradient(90deg,#f43f5e,#fb7185 90%)",
                              border: "none",
                              color: "#fff"
                            }}
                          >
                            <span style={{ fontWeight: 700, letterSpacing: 1 }}>Reject</span>
                          </AnimatedActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default ApplicationDetails;