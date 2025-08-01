import React, { useEffect, useState, useRef } from 'react';
import { CSVLink } from 'react-csv'; // Keep for reference if needed, but will be replaced in UI
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
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaSyncAlt,
  FaClipboard,
  FaCopy,
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

// Assume html2canvas and jspdf are loaded globally via script tags in public/index.html
// If you get errors like 'html2canvas is not defined' or 'jspdf is not defined',
// ensure these lines are in your public/index.html just before </body>:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>


// Static background color (matches your screenshot)
const staticDarkBg = {
  background: 'linear-gradient(135deg, #232B40 0%, #26334D 100%)',
  minHeight: '100vh',
  paddingBottom: '50px',
  transition: 'background 0.5s',
};

// Map backend status enum to Bootstrap badge colors
const statusColors = {
  SELECTED: 'success',
  PENDING: 'warning', // Assuming 'PENDING' is a distinct status for 'Under Review'
  REJECTED: 'danger',
  SUBMITTED: 'info', // Added 'SUBMITTED' status if it comes from backend
  'N/A': 'secondary', // For cases where status is not set
};

const BACKEND_BASE_URL = 'https://localhost:8082';

// Animated Button Component (reused from previous immersives)
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


const MinistryDashboard = () => {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('fullName'); // Default sort key, matching DTO
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showScroll, setShowScroll] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState({}); // State for selected course in dropdown
  const [allCourses, setAllCourses] = useState([]); // State for all available courses (for dropdowns)
  const [animRow, setAnimRow] = useState(null); // For row animation on status change
  const pdfContentRef = useRef(null); // Ref for the hidden content to be converted to PDF

  useEffect(() => {
    fetchApplicants();
    fetchAllCourses(); // Fetch all courses when component mounts
    window.addEventListener('scroll', handleScrollButton);
    return () => window.removeEventListener('scroll', handleScrollButton);
  }, []);

  // Toast utility
  const showToastNotify = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  // Generic fetchData function for reusability
  const fetchData = async (url, errorMessagePrefix, setStateCallback, setLoadingState = null) => {
    if (setLoadingState) setLoadingState(true);
    const token = localStorage.getItem('jwtToken');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-logout'));
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorBody = await res.text();
        throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorBody || res.statusText}`);
      }
      const data = await res.json();
      setApplicants(Array.isArray(data) ? data : []); // Always set applicants here
      setStateCallback(Array.isArray(data) ? data : []); // Use setStateCallback for other data
      showToastNotify(`${errorMessagePrefix} loaded successfully!`);
    } catch (error) {
      console.error(`Error ${errorMessagePrefix.toLowerCase()}:`, error);
      showToastNotify(`Failed to load ${errorMessagePrefix.toLowerCase()}: ${error.message}`);
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  const fetchApplicants = () => {
    fetchData(`${BACKEND_BASE_URL}/api/dashboard/applicants`, 'Applicants data', setApplicants, setLoading);
    setRefreshing(false); // Reset refreshing state after fetch attempt
  };

  const fetchAllCourses = () => {
    fetchData(`${BACKEND_BASE_URL}/api/courses`, 'Courses data', setAllCourses);
  };

  // Filter applicants by their applicationStatus (from backend DTO)
  const selectedApplicants = applicants.filter(a => a.applicationStatus === 'SELECTED');
  const pendingApplicants = applicants.filter(a => a.applicationStatus === 'PENDING' || a.applicationStatus === 'SUBMITTED');
  const rejectedApplicants = applicants.filter(a => a.applicationStatus === 'REJECTED');

  // Helper to get nested or alternative property values for sorting/filtering
  const getApplicantValue = (obj, key) => {
    switch (key) {
      case 'fullName': return obj.fullName || ''; // Matches DTO field
      case 'course': return obj.course || ''; // Matches DTO field (courseNameForDisplay from backend)
      case 'center': return obj.center || ''; // Matches DTO field (selectedCenter from backend)
      case 'username': return obj.username || ''; // Matches DTO field
      case 'status': return obj.applicationStatus || 'N/A'; // Matches DTO field
      case 'educationLevel': return obj.educationLevel || ''; // Added for PDF
      case 'createdAt': return obj.createdAt ? new Date(obj.createdAt).toLocaleDateString() : 'N/A'; // Added for PDF
      case 'registrationNumber': return obj.registrationNumber || ''; // Added for PDF
      default: return obj[key] || '';
    }
  };

  const filtered = applicants
    .filter(app => {
      const searchTermLower = search.toLowerCase();
      return (
        getApplicantValue(app, 'fullName').toLowerCase().includes(searchTermLower) ||
        getApplicantValue(app, 'course').toLowerCase().includes(searchTermLower) ||
        getApplicantValue(app, 'center').toLowerCase().includes(searchTermLower) ||
        getApplicantValue(app, 'username').toLowerCase().includes(searchTermLower)
      ) && (filterStatus === 'All' || getApplicantValue(app, 'status') === filterStatus);
    })
    .sort((a, b) => {
      // Handle date sorting if sortKey is 'createdAt'
      if (sortKey === 'createdAt') {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortAsc ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      // Default string sorting
      const aVal = String(getApplicantValue(a, sortKey)).toLowerCase();
      const bVal = String(getApplicantValue(b, sortKey)).toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  const csvHeaders = [
    { label: 'Full Name', key: 'fullName' }, // Use fullName
    { label: 'Course', key: 'course' },
    { label: 'Center', key: 'center' },
    { label: 'Status', key: 'applicationStatus' }, // Use applicationStatus
    { label: 'Username', key: 'username' },
    { label: 'Education Level', key: 'educationLevel' },
    { label: 'Submission Date', key: 'createdAt' },
    { label: 'Registration Number', key: 'registrationNumber' },
  ];

  // Robust mapping for selected applicants for CSV export (now for PDF)
  const selectedForPdf = applicants
    .filter(a => (a.applicationStatus || '').toUpperCase() === 'SELECTED')
    .map(a => ({
      fullName: getApplicantValue(a, 'fullName'),
      course: getApplicantValue(a, 'course'),
      center: getApplicantValue(a, 'center'),
      applicationStatus: getApplicantValue(a, 'status'),
      username: getApplicantValue(a, 'username'),
      educationLevel: getApplicantValue(a, 'educationLevel'),
      createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A',
      registrationNumber: getApplicantValue(a, 'registrationNumber'),
    }));

  // Copy all visible (filtered) to clipboard (retained for flexibility, though PDF is primary)
  const copyFilteredToClipboard = async () => {
    const rows = [
      csvHeaders.map(h => h.label).join(','),
      ...filtered.map(app =>
        [
          getApplicantValue(app, 'fullName'),
          getApplicantValue(app, 'course'),
          getApplicantValue(app, 'center'),
          getApplicantValue(app, 'status'),
          getApplicantValue(app, 'username'),
          getApplicantValue(app, 'educationLevel'),
          app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A',
          getApplicantValue(app, 'registrationNumber'),
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') // Ensure values are strings and handle quotes
      ),
    ].join('\n');
    // Use document.execCommand('copy') as navigator.clipboard.writeText() may not work due to iFrame restrictions.
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = rows;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    try {
      document.execCommand('copy');
      showToastNotify("Visible table copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToastNotify("Failed to copy to clipboard. Please try manually.");
    } finally {
      document.body.removeChild(tempTextArea);
    }
  };

  // Scroll-to-top button logic
  function handleScrollButton() {
    if (window.scrollY > 300) setShowScroll(true);
    else setShowScroll(false);
  }
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplicants(); // Re-use the existing fetchApplicants logic
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

  // Handlers for Select/Reject (integrated from ApplicationDetails.jsx)
  const handleSelectStudent = async (id, adminSelectedCenter) => {
    showToastNotify(''); // Clear previous messages
    const courseId = selectedCourse[id];
    if (!courseId) {
      showToastNotify('Please select a course before selecting the student.');
      return;
    }
    const token = localStorage.getItem('jwtToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/applications/${id}/select/${courseId}/${adminSelectedCenter}`,
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
      // Optimistically update the UI with the new status
      setApplicants(apps =>
        apps.map(app =>
          app.id === id
            ? { ...app, applicationStatus: 'SELECTED', adminSelectedCourseId: courseId, adminSelectedCenter: adminSelectedCenter }
            : app
        )
      );
      showToastNotify('Student selected successfully!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);
    } catch (err) {
      console.error("Error selecting student:", err);
      showToastNotify(`Error selecting student: ${err.message}`);
    }
  };

  const handleRejectStudent = async (id) => {
    showToastNotify(''); // Clear previous messages
    const token = localStorage.getItem('jwtToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/applications/${id}/reject`,
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
      // Optimistically update the UI with the new status
      setApplicants(apps =>
        apps.map(app =>
          app.id === id ? { ...app, applicationStatus: 'REJECTED' } : app
        )
      );
      showToastNotify('Student rejected successfully!');
      setAnimRow(id);
      setTimeout(() => setAnimRow(null), 1200);
    } catch (err) {
      console.error("Error rejecting student:", err);
      showToastNotify(`Error rejecting student: ${err.message}`);
    }
  };

  // NEW: Function to generate PDF report
  const handleDownloadPdf = async () => {
    if (!window.html2canvas || !window.jspdf.jsPDF) {
      showToastNotify("PDF generation libraries not loaded. Please ensure html2canvas and jspdf are included in your public/index.html.");
      console.error("PDF generation libraries (html2canvas, jspdf) are not available.");
      return;
    }

    showToastNotify("Generating PDF report...");
    const pdf = new window.jspdf.jsPDF('p', 'pt', 'a4'); // 'p' for portrait, 'pt' for points, 'a4' size
    const content = pdfContentRef.current; // Get the hidden div content

    if (!content) {
      showToastNotify("Error: PDF content not found.");
      console.error("PDF content ref is null.");
      return;
    }

    // Generate a random report ID
    const reportId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const generationDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Temporarily show the hidden content for html2canvas to render it correctly
    content.style.display = 'block';
    content.style.position = 'absolute';
    content.style.left = '-9999px'; // Move off-screen
    content.style.width = '794px'; // A4 width in px for html2canvas (approx 210mm at 96dpi)
    content.style.padding = '40px'; // Add some padding inside the hidden div for better rendering

    try {
      const canvas = await window.html2canvas(content, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // Important for images from external URLs
        logging: true, // Enable logging for debugging
        allowTaint: true, // Allow cross-origin images to be rendered (if server allows CORS)
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 595.28; // A4 width in pt (210mm)
      const pageHeight = 841.89; // A4 height in pt (297mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Selected_Applicants_Report_${reportId}.pdf`);
      showToastNotify("PDF report downloaded successfully!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      showToastNotify(`Failed to generate PDF: ${error.message}. Check console for details.`);
    } finally {
      // Hide the content again
      content.style.display = 'none';
      content.style.position = 'static';
      content.style.left = 'auto';
      content.style.width = 'auto';
      content.style.padding = '0';
    }
  };


  // Global style injection for the dashboard theme
  useEffect(() => {
    const styleId = "ministry-dashboard-style"; // Unique ID for this component's style
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

      /* PDF Specific Styles (hidden by default) */
      .pdf-content-area {
        font-family: Arial, sans-serif;
        color: #000; /* Ensure black text for PDF */
        background-color: #fff; /* Ensure white background for PDF */
        display: none; /* Hidden by default */
        padding: 20px;
        box-sizing: border-box;
      }
      .pdf-content-area h1, .pdf-content-area h2, .pdf-content-area h3 {
        color: #000;
      }
      .pdf-content-area .logo-container {
        text-align: center;
        margin-bottom: 20px;
      }
      .pdf-content-area .logo-container img {
        max-width: 150px; /* Adjust logo size */
        height: auto;
      }
      .pdf-content-area .report-header {
        text-align: center;
        margin-bottom: 30px;
      }
      .pdf-content-area .report-header h1 {
        font-size: 24px;
        margin-bottom: 5px;
      }
      .pdf-content-area .report-header p {
        font-size: 14px;
        margin-bottom: 5px;
      }
      .pdf-content-area .report-details {
        text-align: right;
        font-size: 12px;
        margin-bottom: 20px;
      }
      .pdf-content-area .pdf-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .pdf-content-area .pdf-table th,
      .pdf-content-area .pdf-table td {
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
        font-size: 10px; /* Smaller font for table content */
      }
      .pdf-content-area .pdf-table th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      `;
      document.head.appendChild(style);
    }
  }, []);


  return (
    <div style={staticDarkBg}>
      {/* Toast notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000} // Increased delay for toast messages
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
                {/* Use 'course' which holds the display name from backend */}
                <h3 className="display-6">{[...new Set(applicants.map(a => a.course))].length}</h3>
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
                {/* Replaced CSVLink and Copy with PDF Download Button */}
                <Button
                  variant="outline-info"
                  className="mt-2"
                  style={{ borderRadius: 50, fontWeight: 500, color: "#fff", borderColor: "#38bdf8" }}
                  onClick={handleDownloadPdf}
                >
                  <FaDownload /> Download PDF Report
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
                <option value="SELECTED">Selected</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUBMITTED">Submitted</option> {/* Added Submitted */}
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
                    onClick={() => { setSortKey('fullName'); setSortAsc(sk => !sk); }}
                    style={{ cursor: 'pointer' }}
                  >
                    Full Name {getSortIcon('fullName')}
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
                  <th className="text-center">Actions</th> {/* Align header with content */}
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
                    <tr key={app.id} className={animRow === app.id ? "modern-row-anim" : ""}> {/* Added animRow class */}
                      <td>{index + 1}</td>
                      <td>{getApplicantValue(app, 'fullName')}</td>
                      <td>{getApplicantValue(app, 'course')}</td>
                      <td>{getApplicantValue(app, 'center')}</td>
                      <td>
                        <Badge bg={statusColors[getApplicantValue(app, 'status')]}>{getApplicantValue(app, 'status')}</Badge>
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Username: {app.username}</Tooltip>}
                        >
                          <span>{app.username}</span>
                        </OverlayTrigger>
                      </td>
                      <td className="text-center"> {/* Center the action buttons */}
                        <select
                          className="form-select form-select-sm me-2" // Added me-2 for spacing
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
                            fontWeight: 500,
                            fontSize: '0.9rem', // Slightly smaller font for select
                            color: "#f7f8fa",
                            marginBottom: '0.5rem' // Space between select and buttons
                          }}
                        >
                          <option value="">--Select Course--</option>
                          {(app.preferredCourses || []).map(courseId => {
                            const course = allCourses.find(c => c.id === courseId);
                            return course ? (
                              <option key={course.id} value={course.id}>
                                {course.name}
                              </option>
                            ) : null;
                          })}
                        </select>
                        <AnimatedButton
                          className="btn-success btn-sm me-2"
                          onClick={() => handleSelectStudent(app.id, getApplicantValue(app, 'center'))} // Pass actual center
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
                          <span style={{ fontWeight: 700, letterSpacing: 1 }}>Select</span>
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
                          <span style={{ fontWeight: 700, letterSpacing: 1 }}>Reject</span>
                        </AnimatedButton>
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

        {/* NEW: Hidden content for PDF generation */}
        {/* This div will be rendered by html2canvas and then added to jsPDF */}
        <div ref={pdfContentRef} className="pdf-content-area">
          <div className="logo-container">
            {/* UPDATED: Using the local logo path provided by the user */}
            <img src="./logo.jfif" alt="Zanzibar Government Logo" />
          </div>
          <div className="report-header">
            <h1>Revolutionary Government of Zanzibar</h1>
            <h2>Ministry of Education and Vocational Training</h2>
            <p>Empowering decisions for a brighter future through informed applicant analysis.</p>
          </div>
          <div className="report-details">
            <p>Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p> {/* Randomly generated */}
            <p>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <h3>Selected Applicants Report</h3>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Course</th>
                <th>Center</th>
                <th>Status</th>
                <th>Username</th>
                {/* Education Level, Submission Date, Registration No. removed as requested */}
              </tr>
            </thead>
            <tbody>
              {selectedForPdf.length === 0 ? ( // Use selectedForPdf for the PDF table
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No selected applicants to display.</td> {/* Adjusted colSpan */}
                </tr>
              ) : (
                selectedForPdf.map((app, index) => ( // Use selectedForPdf for the PDF table
                  <tr key={app.id}>
                    <td>{index + 1}</td>
                    <td>{app.fullName}</td>
                    <td>{app.course}</td>
                    <td>{app.center}</td>
                    <td>{app.applicationStatus}</td>
                    <td>{app.username}</td>
                    {/* Education Level, Submission Date, Registration No. removed as requested */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MinistryDashboard;
