import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './logo.jfif';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCheckCircle, FaTimesCircle, FaRegSmileBeam, FaSpinner } from 'react-icons/fa';

// Options
const nationalityOptions = ["Tanzanian", "Kenyan", "Ugandan", "Rwandan", "Burundian"];
const centerOptions = [
  "VETA Mkokotoni", "VETA Wete", "VETA Chake Chake", "VETA Makunduchi",
  "VETA Zanzibar Town", "VETA Kibondeni", "VETA Kivunge", "VETA Mwanakwerekwe", "VETA Mkoani"
];
const idOptions = ["NIDA", "Zanzibar ID", "Passport"];
const courseOptions = [
  { id: 1, name: 'Welding and Fabrication' },
  { id: 2, name: 'Electrical Installation' },
  { id: 3, name: 'Carpentry and Joinery' },
  { id: 4, name: 'Plumbing' },
  { id: 5, name: 'Tailoring and Dressmaking' },
  { id: 6, name: 'Automotive Mechanics' },
  { id: 7, name: 'ICT' },
  { id: 8, name: 'Hotel Management' },
];

const ApplicationForm = ({ onSubmitDetails, submitted }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    gender: "",
    dob: "",
    birthplace: "",
    nationality: "",
    idType: "",
    idNumber: "",
    trainingType: "",
    center: "",
    courses: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const navigate = useNavigate();

  // Debug state
  const [debugInfo, setDebugInfo] = useState({});

  // Check payment status
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      console.log("[APPLICATION] Verifying payment status...");
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:8080/api/payments/user/${user.id}`);
        if (!response.ok) {
          throw new Error(`Payment check failed: ${response.status}`);
        }

        const payments = await response.json();
        
        // Check for approved payment
        const hasApprovedPayment = payments.some(p => p.status === 'APPROVED');
        
        setDebugInfo({
          userExists: true,
          paymentsCount: payments.length,
          hasApprovedPayment,
          payments: payments.map(p => ({ id: p.id, status: p.status }))
        });
        
        if (hasApprovedPayment) {
          setPaymentStatus('approved');
        } else {
          setPaymentStatus('not-approved');
        }
      } catch (error) {
        console.error("[APPLICATION] Payment verification error:", error);
        setPaymentStatus('error');
      }
    };

    verifyPaymentStatus();
  }, [navigate]);

  // Render based on payment status
  if (paymentStatus === 'checking') {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <FaSpinner className="fa-spin text-primary mb-3" size={48} />
        <h4>Verifying Payment Status</h4>
        <p>Please wait while we confirm your payment approval</p>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger col-10 col-md-6 text-center">
          <h4>Payment Verification Failed</h4>
          <p>Could not verify your payment status.</p>
          <p>Please try again later or contact support.</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'not-approved') {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <div className="alert alert-warning col-10 col-md-6 text-center">
          <h4>Payment Not Approved</h4>
          <p>You need an approved payment to access this form.</p>
          <p>Please complete your payment first.</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={() => navigate('/payment')}
          >
            Go to Payment
          </button>
        </div>
        
        {/* Debug information - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-light rounded col-10 col-md-6">
            <h6>Debug Information:</h6>
            <pre className="mb-0">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;

    // Basic validation
    const requiredFields = [
      'fullname', 'gender', 'dob', 'birthplace', 
      'nationality', 'idType', 'idNumber', 'trainingType', 'center'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }
    
    // Validate course selections
    const courses = [1, 2, 3, 4, 5]
      .map(num => formData[`course${num}`])
      .filter(Boolean);
      
    if (courses.length === 0) {
      setError("Please select at least one course");
      return;
    }

    const payload = { 
      ...formData,
      courses: courses.map(id => ({ id: Number(id) }))
    };

    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      const savedApp = await response.json();
      setSuccess('Application submitted successfully!');
      if (onSubmitDetails) onSubmitDetails(savedApp);
      
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <div className="card shadow col-12 col-lg-8 p-4">
        <div className="text-center mb-4">
          <img 
            src={logo} 
            alt="Logo" 
            className="rounded-circle shadow"
            style={{ height: '85px', width: '85px' }} 
          />
          <h2 className="mt-3 text-primary fw-bold">
            Student Application Form
          </h2>
          <p className="text-secondary">
            Begin your journey with VETA
          </p>
        </div>
        
        {submitted ? (
          <div className="alert alert-success text-center">
            <FaRegSmileBeam size={32} className="me-2 mb-1" />
            You have already submitted your application.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-3">
            <div className="row g-3">
              <div className="col-12">
                <h5 className="text-primary border-bottom pb-2">Personal Information</h5>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  className="form-control"
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Gender</label>
                <select 
                  name="gender" 
                  className="form-select" 
                  value={formData.gender} 
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  name="dob" 
                  className="form-control" 
                  value={formData.dob} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Place of Birth</label>
                <input 
                  type="text" 
                  name="birthplace" 
                  className="form-control" 
                  value={formData.birthplace} 
                  onChange={handleChange} 
                  placeholder="e.g. Zanzibar" 
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Nationality</label>
                <select 
                  name="nationality" 
                  className="form-select" 
                  value={formData.nationality} 
                  onChange={handleChange}
                >
                  <option value="">Select Nationality</option>
                  {nationalityOptions.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-12 mt-4">
                <h5 className="text-primary border-bottom pb-2">Identification</h5>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">ID Type</label>
                <select 
                  name="idType" 
                  className="form-select" 
                  value={formData.idType} 
                  onChange={handleChange}
                >
                  <option value="">Select ID Type</option>
                  {idOptions.map(opt => (<option key={opt}>{opt}</option>))}
                </select>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">ID Number</label>
                <input 
                  type="text" 
                  name="idNumber" 
                  className="form-control" 
                  value={formData.idNumber} 
                  onChange={handleChange} 
                  placeholder="Enter your ID number" 
                />
              </div>
              
              <div className="col-12 mt-4">
                <h5 className="text-primary border-bottom pb-2">Course Preferences</h5>
                <p className="text-muted">
                  Select up to 5 choices in order of preference
                </p>
              </div>
              
              {[1, 2, 3, 4, 5].map((num) => (
                <div className="col-md-6" key={num}>
                  <label className="form-label">{`Choice ${num}`}</label>
                  <select
                    name={`course${num}`}
                    className="form-select"
                    value={formData[`course${num}`]}
                    onChange={handleChange}
                  >
                    <option value="">Select Course</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              ))}
              
              <div className="col-12 mt-4">
                <h5 className="text-primary border-bottom pb-2">Training Details</h5>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Training Type</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="trainingType"
                      value="Long-term"
                      checked={formData.trainingType === 'Long-term'}
                      onChange={handleChange}
                      id="long-term"
                    />
                    <label className="form-check-label" htmlFor="long-term">Long-term</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="trainingType"
                      value="Short-term"
                      checked={formData.trainingType === 'Short-term'}
                      onChange={handleChange}
                      id="short-term"
                    />
                    <label className="form-check-label" htmlFor="short-term">Short-term</label>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Preferred Center</label>
                <select 
                  name="center" 
                  className="form-select" 
                  value={formData.center} 
                  onChange={handleChange}
                >
                  <option value="">Select Center</option>
                  {centerOptions.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              {error && (
                <div className="col-12">
                  <div className="alert alert-danger text-center">
                    <FaTimesCircle className="me-2" /> {error}
                  </div>
                </div>
              )}
              
              {success && (
                <div className="col-12">
                  <div className="alert alert-success text-center">
                    <FaCheckCircle className="me-2" /> {success}
                  </div>
                </div>
              )}
              
              <div className="col-12 text-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2"
                  disabled={submitted || loading}
                >
                  {loading ? (
                    <span>
                      <FaSpinner className="fa-spin me-2" />
                      Submitting...
                    </span>
                  ) : "Submit Application"}
                </button>
              </div>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4">
          <p className="text-muted small">
            Need help? <a href="mailto:support@veta.go.tz">Contact Support</a>
          </p>
          <p className="text-muted small">
            VETA | &copy; {new Date().getFullYear()} | All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;