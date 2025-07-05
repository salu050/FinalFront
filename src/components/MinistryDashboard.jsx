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
  OverlayTrigger,
  Tooltip,
  Dropdown,
  Modal,
  Toast,
  ToastContainer,
  Alert,
} from 'react-bootstrap';
import {
  FaDownload,
  FaChartBar,
  FaUser,
  FaSort,
  FaFilter,
  FaMoon,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaSyncAlt,
  FaClipboard,
  FaCopy,
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

// Static background color (matches your screenshot)
const staticDarkBg = {
  background: 'linear-gradient(135deg, #232B40 0%, #26334D 100%)',
  minHeight: '100vh',
  paddingBottom: '50px',
  transition: 'background 0.5s',
};

const statusColors = {
  Selected: 'success',
  Pending: 'warning',
  Rejected: 'danger',
};

const BACKEND_BASE_URL = 'http://localhost:8080';

const MinistryDashboard = () => {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('fullname');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    fetchApplicants();
    window.addEventListener('scroll', handleScrollButton);
    return () => window.removeEventListener('scroll', handleScrollButton);
  }, []);

  // Toast utility
  const showToastNotify = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  const fetchApplicants = () => {
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/dashboard/applicants`)
      .then(res => res.json())
      .then(data => {
        setApplicants(data);
        setLoading(false);
        showToastNotify("Applicants data loaded successfully!");
      })
      .catch(() => setLoading(false));
  };

  const selectedApplicants = applicants.filter(a => a.status === 'Selected');
  const pendingApplicants = applicants.filter(a => a.status === 'Pending');
  const rejectedApplicants = applicants.filter(a => a.status === 'Rejected');

  const filtered = applicants
    .filter(app =>
      (
        (app.fullname || app.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.course || app.courseName || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.center || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.username || '').toLowerCase().includes(search.toLowerCase())
      )
      && (filterStatus === 'All' || app.status === filterStatus)
    )
    .sort((a, b) => {
      const aVal = (a[sortKey] || a[sortKey.charAt(0).toUpperCase() + sortKey.slice(1)] || '').toLowerCase();
      const bVal = (b[sortKey] || b[sortKey.charAt(0).toUpperCase() + sortKey.slice(1)] || '').toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  const csvHeaders = [
    { label: 'Full Name', key: 'fullname' },
    { label: 'Username', key: 'username' },
    { label: 'Course', key: 'course' },
    { label: 'Center', key: 'center' },
    { label: 'Status', key: 'status' },
  ];

  // Robust mapping for selected applicants for CSV export
  const selectedForCsv = applicants
    .filter(a => (a.status || '').toLowerCase() === 'selected')
    .map(a => ({
      fullname: a.fullname || a.fullName || '',
      username: a.username || '',
      course: a.course || a.courseName || '',
      center: a.center || '',
      status: a.status || '',
    }));

  // Copy all visible (filtered) to clipboard
  const copyFilteredToClipboard = async () => {
    const rows = [
      csvHeaders.map(h => h.label).join(','),
      ...filtered.map(app =>
        [
          app.fullname || app.fullName || '',
          app.username || '',
          app.course || app.courseName || '',
          app.center || '',
          app.status || '',
        ].map(v => `"${v.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
    await navigator.clipboard.writeText(rows);
    showToastNotify("Visible table copied to clipboard!");
  };

  // Scroll-to-top button logic
  function handleScrollButton() {
    if (window.scrollY > 300) setShowScroll(true);
    else setShowScroll(false);
  }
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleRefresh = () => {
    setRefreshing(true);
    fetch(`${BACKEND_BASE_URL}/api/dashboard/applicants`)
      .then(res => res.json())
      .then(data => {
        setApplicants(data);
        setRefreshing(false);
        showToastNotify("Applicants data refreshed!");
      })
      .catch(() => setRefreshing(false));
  };

  // Glass style for all cards and modals
  const glassStyle = {
    background: 'rgba(30, 34, 56, 0.96)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.10)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    transition: 'background 0.5s, color 0.5s'
  };

  // Modern sort icon
  const getSortIcon = (key) => {
    if (sortKey !== key) return <FaSort />;
    return sortAsc ? <FaArrowUp color="#2196F3" /> : <FaArrowDown color="#e53935" />;
  };

  // Professional heading subtitle
  const subtitle = "Empowering Decisions. Shaping Futures. Unlock the ministry's insight into applicant trends, selection analytics, and center performance — all in one elegant dashboard.";

  return (
    <div style={staticDarkBg}>
      {/* Toast notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={1800}
          autohide
          bg="dark"
        >
          <Toast.Header closeButton={false}>
            <FaBell className="me-2" />
            <strong className="me-auto">Dashboard</strong>
            <small>Now</small>
          </Toast.Header>
          <Toast.Body>
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>

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
            boxShadow: '0 4px 12px rgba(60,60,120,0.2)',
            background: '#2196F3',
            color: '#fff',
            width: 48,
            height: 48
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
                className="fw-bold"
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  textAlign: "center",
                  letterSpacing: 2,
                  fontSize: "2.7rem",
                  textShadow: "0 8px 32px rgba(35,43,64,0.17), 0 1px 5px #1e293b"
                }}
              >
                <FaUser className="me-2" style={{ color: "#4f8cff" }} />
                Ministry Applicants Dashboard
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

        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card style={glassStyle} className="text-center mb-3 shadow-sm">
              <Card.Body>
                <Card.Title><FaUser /> <span className="ms-1">Applicants</span></Card.Title>
                <h3 className="display-6">{applicants.length}</h3>
                <small className="text-info">Total registered</small>
                <ProgressBar now={100} variant="primary" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={glassStyle} className="text-center mb-3 shadow-sm">
              <Card.Body>
                <Card.Title><FaChartBar /> <span className="ms-1">Courses</span></Card.Title>
                <h3 className="display-6">{[...new Set(applicants.map(a => a.course || a.courseName))].length}</h3>
                <small className="text-success">Unique courses</small>
                <ProgressBar now={100} variant="success" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={glassStyle} className="text-center mb-3 shadow-sm">
              <Card.Body>
                <Card.Title><FaChartBar /> <span className="ms-1">Centers</span></Card.Title>
                <h3 className="display-6">{[...new Set(applicants.map(a => a.center))].length}</h3>
                <small className="text-warning">Unique centers</small>
                <ProgressBar now={100} variant="warning" style={{ height: "0.4rem", marginTop: 8 }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card style={glassStyle} className="text-center mb-3 shadow-sm">
              <Card.Body>
                <Card.Title>
                  Download <FaDownload />
                </Card.Title>
                <CSVLink
                  data={selectedForCsv}
                  headers={csvHeaders}
                  filename={"selected-applicants-report.csv"}
                  className="btn btn-outline-info mt-2"
                  style={{ borderRadius: 50, fontWeight: 500, color: "#fff", borderColor: "#38bdf8" }}
                >
                  Selected as CSV
                </CSVLink>
                <Button
                  variant="outline-secondary"
                  className="mt-2 ms-2"
                  style={{ borderRadius: 50, fontWeight: 500, color: "#fff", borderColor: "#94a3b8" }}
                  onClick={copyFilteredToClipboard}
                  title="Copy visible table to clipboard"
                >
                  <FaClipboard /> Copy Visible
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-3 g-2">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <FormControl
                placeholder="Search by name, course, center, or username"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={glassStyle}
              />
              <Button variant="outline-secondary" onClick={handleRefresh} disabled={refreshing} style={{ color: "#fff", borderColor: "#94a3b8" }}>
                <FaSyncAlt className={refreshing ? "fa-spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </InputGroup>
          </Col>
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text><FaFilter /></InputGroup.Text>
              <FormControl
                as="select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={glassStyle}
              >
                <option value="All">All Status</option>
                <option value="Selected">Selected</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </FormControl>
            </InputGroup>
          </Col>
          <Col md={2} className="d-flex align-items-center justify-content-center">
            <Button variant="outline-primary" onClick={() => setShowStats(true)} style={{ width: '100%' }}>
              <FaChartBar /> Statistics
            </Button>
          </Col>
        </Row>

        <Card style={glassStyle} className="mb-4 shadow">
          <Card.Body>
            <Table
              striped
              bordered
              hover
              responsive
              variant={"dark"}
              className="mb-0 table-modern"
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
                  <th>#</th>
                  <th
                    onClick={() => { setSortKey('fullname'); setSortAsc(sk => !sk); }}
                    style={{ cursor: 'pointer' }}
                  >
                    Full Name {getSortIcon('fullname')}
                  </th>
                  <th
                    onClick={() => { setSortKey('course'); setSortAsc(sk => !sk); }}
                    style={{ cursor: 'pointer' }}
                  >
                    Course {getSortIcon('course')}
                  </th>
                  <th
                    onClick={() => { setSortKey('center'); setSortAsc(sk => !sk); }}
                    style={{ cursor: 'pointer' }}
                  >
                    Center {getSortIcon('center')}
                  </th>
                  <th
                    onClick={() => { setSortKey('status'); setSortAsc(sk => !sk); }}
                    style={{ cursor: 'pointer' }}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th>Username</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      <Spinner animation="border" variant="primary" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      <Alert variant="info" className="mb-0">No applicants found.</Alert>
                    </td>
                  </tr>
                ) : (
                  filtered.map((app, index) => (
                    <tr key={app.id}>
                      <td>{index + 1}</td>
                      <td>{app.fullname || app.fullName}</td>
                      <td>{app.course || app.courseName}</td>
                      <td>{app.center}</td>
                      <td>
                        <Badge bg={statusColors[app.status]}>{app.status}</Badge>
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Username: {app.username}</Tooltip>}
                        >
                          <span>{app.username}</span>
                        </OverlayTrigger>
                      </td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm" id={`dropdown-${app.id}`}>
                            Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              as={CSVLink}
                              data={[{
                                fullname: app.fullname || app.fullName || "",
                                username: app.username || "",
                                course: app.course || app.courseName || "",
                                center: app.center || "",
                                status: app.status || "",
                              }]}
                              headers={csvHeaders}
                              filename={`${(app.fullname || app.fullName || 'applicant').replace(' ', '_').toLowerCase()}_report.csv`}
                            >
                              <FaDownload /> Download Row
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={async () => {
                                await navigator.clipboard.writeText(
                                  [
                                    csvHeaders.map(h => h.label).join(','),
                                    [
                                      app.fullname || app.fullName || '',
                                      app.username || '',
                                      app.course || app.courseName || '',
                                      app.center || '',
                                      app.status || '',
                                    ].map(v => `"${v.replace(/"/g, '""')}"`).join(',')
                                  ].join('\n')
                                );
                                showToastNotify("Applicant copied to clipboard!");
                              }}
                            >
                              <FaCopy /> Copy Row
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Modal for statistics */}
        <Modal show={showStats} onHide={() => setShowStats(false)} centered>
          <Modal.Header closeButton style={glassStyle}>
            <Modal.Title>
              <FaChartBar /> Applicants Statistics
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={glassStyle}>
            <h5>
              <Badge bg="primary" className="mb-2">Total Applicants: {applicants.length}</Badge>
              <ProgressBar now={100} variant="primary" className="mb-3" />
            </h5>
            <h5>
              <Badge bg="success" className="mb-2">Selected: {selectedApplicants.length} ({Math.round((selectedApplicants.length/(applicants.length||1))*100)}%)</Badge>
              <ProgressBar now={Math.round((selectedApplicants.length/(applicants.length||1))*100)} variant="success" className="mb-3" />
            </h5>
            <h5>
              <Badge bg="warning" text="dark" className="mb-2">Pending: {pendingApplicants.length} ({Math.round((pendingApplicants.length/(applicants.length||1))*100)}%)</Badge>
              <ProgressBar now={Math.round((pendingApplicants.length/(applicants.length||1))*100)} variant="warning" className="mb-3" />
            </h5>
            <h5>
              <Badge bg="danger" className="mb-2">Rejected: {rejectedApplicants.length} ({Math.round((rejectedApplicants.length/(applicants.length||1))*100)}%)</Badge>
              <ProgressBar now={Math.round((rejectedApplicants.length/(applicants.length||1))*100)} variant="danger" className="mb-3" />
            </h5>
          </Modal.Body>
          <Modal.Footer style={glassStyle}>
            <Button variant="secondary" onClick={() => setShowStats(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default MinistryDashboard;