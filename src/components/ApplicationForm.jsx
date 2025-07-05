import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './logo.jfif';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCheckCircle, FaTimesCircle, FaRegSmileBeam, FaSpinner } from 'react-icons/fa';

// Options
const nationalityOptions = [
  "Tanzanian", "Kenyan", "Ugandan", "Rwandan", "Burundian"
];
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
const initialForm = {
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
};

const animatedGradient = "linear-gradient(120deg,#6366f1,#38bdf8 60%,#43e97b 100%)";

const ApplicationForm = ({ onSubmitDetails, submitted }) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // One-time modern style
  useEffect(() => {
    const id = "modern-form-enhanced-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        .modern-bg { background: linear-gradient(120deg,#e0e7ff,#f0fdfa 100%) !important; min-height: 100vh; }
        .modern-glass { background: rgba(255,255,255,0.96); border-radius: 2.3rem; box-shadow: 0 8px 32px 0 #6366f133; border: 1.5px solid #e0e7ff; animation: pop-in .7s cubic-bezier(.57,1.5,.53,1) both; }
        @keyframes pop-in { 0%{ transform:scale(0.96) translateY(24px); opacity:0;} 70%{ transform:scale(1.03) translateY(-8px);} 100%{transform:scale(1) translateY(0); opacity:1;} }
        .modern-title { font-size: 2.3em; font-weight: 900; background: ${animatedGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 2px; }
        .modern-section { font-weight: 700; font-size: 1.1em; color: #6366f1; margin-top: 1.7rem; text-transform: uppercase; letter-spacing: 1px; }
        .modern-label { font-weight: 500; }
        .modern-input:focus, .modern-select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 2.3px #6366f180; background: #f4f8ff; }
        .modern-btn { background: ${animatedGradient}; color: #fff !important; font-weight: 700; letter-spacing: 1px; border: none; border-radius: 1.1rem; padding: .65em 2.6em; box-shadow: 0 2px 24px #6366f144; transition: transform .16s, box-shadow .23s; }
        .modern-btn:active { transform: scale(.97);}
        .modern-success, .modern-error { border-radius: 1rem; font-weight: 600; padding: 12px 0; }
        .modern-success { background: #e0ffd8; color: #065f46; border: 1.5px solid #43e97b; }
        .modern-error { background: #fef2f2; color: #b91c1c; border: 1.5px solid #ef4444; }
        .modern-radio .form-check-input:checked { background-color: #6366f1; border-color: #6366f1; }
        .modern-radio .form-check-input { width: 22px; height: 22px; }
        .modern-select, .modern-input { border-radius: 10px !important; border: 1.3px solid #e0e7ff; background: #f7fafc; }
        .modern-card-shadow { box-shadow: 0 2px 32px 0 #e0e7ff66; }
        .modern-footer { font-size: 13px; color: #a0aec0; }
        @media (max-width: 600px) { .modern-glass { padding: 0.7rem !important;} .modern-title { font-size: 1.1em;} }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Payment status verification
  useEffect(() => {
    const verifyPayment = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setPaymentVerified(false);
        setPaymentStatusMsg('You must login to continue.');
        setCheckingPayment(false);
        navigate('/login');
        return;
      }
      try {
        // Use /latest endpoint for robust logic
        const response = await fetch(`http://localhost:8080/api/payments/user/${user.id}/latest`);
        if (!response.ok) {
          setPaymentVerified(false);
          setPaymentStatusMsg('You must make a payment and have it approved first.');
          setCheckingPayment(false);
          setTimeout(() => {
            navigate('/payment', { state: { message: 'You must make a payment first.' } });
          }, 2000);
          return;
        }
        const payment = await response.json();
        if (payment.status !== 'APPROVED') {
          let msg = 'You need an approved payment to access this form.';
          if (payment.status === 'REJECTED') msg = 'Your payment was rejected. Please make a new payment.';
          if (payment.status === 'PENDING') msg = 'Your payment is pending admin approval. Please wait.';
          setPaymentVerified(false);
          setPaymentStatusMsg(msg);
          setCheckingPayment(false);
          setTimeout(() => {
            navigate('/payment', { state: { message: msg } });
          }, 2000);
        } else {
          setPaymentVerified(true);
          setPaymentStatusMsg('');
        }
      } catch (error) {
        setPaymentVerified(false);
        setPaymentStatusMsg('Error verifying payment status.');
        setCheckingPayment(false);
        setTimeout(() => {
          navigate('/payment', { state: { message: 'Error verifying payment status.' } });
        }, 2000);
      } finally {
        setCheckingPayment(false);
      }
    };

    verifyPayment();
    // eslint-disable-next-line
  }, [navigate]);

  // If coming from /payment with message, show it
  useEffect(() => {
    if (location.state && location.state.message) {
      setPaymentStatusMsg(location.state.message);
    }
  }, [location.state]);

  // Loading state while checking payment
  if (checkingPayment) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <FaSpinner className="fa-spin text-primary me-2" size={32} />
        <span>Verifying payment status...</span>
      </div>
    );
  }

  // Block access if payment not verified
  if (!paymentVerified) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="alert alert-danger text-center mb-3">
          <FaTimesCircle className="me-2" />
          {paymentStatusMsg || "Payment verification failed. Redirecting..."}
        </div>
        <div>
          <button className="btn modern-btn" onClick={() => navigate('/payment')}>
            Go to Payment Page
          </button>
        </div>
      </div>
    );
  }

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;

    // Validation
    if (!formData.fullname.trim()) return setError('Full name is required.');
    if (!formData.gender) return setError('Please select gender.');
    if (!formData.dob) return setError('Date of birth is required.');
    if (!formData.birthplace.trim()) return setError('Place of birth is required.');
    if (!formData.nationality) return setError('Please select nationality.');
    if (!formData.idType) return setError('Please select ID type.');
    if (!formData.idNumber.trim()) return setError('ID number is required.');
    if (!formData.trainingType) return setError('Please select training type.');
    if (!formData.center) return setError('Please select a center.');

    const courses = [1, 2, 3, 4, 5]
      .map(num => formData[`course${num}`])
      .filter(Boolean)
      .map(id => ({ id: Number(id) }));

    const payload = { ...formData, courses };

    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit application');
      }

      const savedApp = await response.json();
      setSuccess('Application submitted successfully!');
      if (onSubmitDetails) onSubmitDetails(savedApp);
      setFormData(initialForm);
      setTimeout(() => {
        setSuccess('');
        navigate('/profile');
      }, 1400);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modern-bg d-flex align-items-center justify-content-center py-5">
      <div className="modern-glass modern-card-shadow col-12 col-md-9 col-lg-7 p-4 my-4">
        <div className="text-center mb-4">
          <img src={logo} alt="Logo" style={{ height: '85px', borderRadius: "50%", boxShadow: "0 4px 16px #dbeafe" }} />
          <div className="modern-title mt-3">
            Student Application Form
          </div>
          <p className="text-secondary mt-2 mb-0" style={{fontWeight:500, letterSpacing:1.1}}>Begin your journey with VETA - Apply for your preferred training today!</p>
        </div>
        {submitted ? (
          <div className="modern-success text-center">
            <FaRegSmileBeam size={32} className="me-2 mb-1" />
            You have already submitted your application.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-2">
            <div className="row g-3">
              {/* Section: Personal Info */}
              <div className="col-12 mt-2">
                <div className="modern-section">Personal Information</div>
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  className="form-control modern-input"
                  value={formData.fullname}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">Gender</label>
                <select name="gender" className="form-select modern-select" value={formData.gender} onChange={handleChange}>
                  <option value="">--Select Gender--</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">Date of Birth</label>
                <input type="date" name="dob" className="form-control modern-input" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">Place of Birth</label>
                <input type="text" name="birthplace" className="form-control modern-input" value={formData.birthplace} onChange={handleChange} placeholder="e.g. Zanzibar" />
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">Nationality</label>
                <select name="nationality" className="form-select modern-select" value={formData.nationality} onChange={handleChange}>
                  <option value="">--Select--</option>
                  {nationalityOptions.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Section: ID */}
              <div className="col-12">
                <div className="modern-section">Identification</div>
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">ID Type</label>
                <select name="idType" className="form-select modern-select" value={formData.idType} onChange={handleChange}>
                  <option value="">--Select--</option>
                  {idOptions.map(opt => (<option key={opt}>{opt}</option>))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label modern-label">ID Number</label>
                <input type="text" name="idNumber" className="form-control modern-input" value={formData.idNumber} onChange={handleChange} placeholder="Enter your ID number" />
              </div>
              {/* Section: Courses */}
              <div className="col-12">
                <div className="modern-section">Course Preferences</div>
                <p className="text-muted mb-2" style={{ fontSize: "0.98em" }}>
                  Select up to 5 choices in order of preference
                </p>
              </div>
              {[1, 2, 3, 4, 5].map((num) => (
                <div className="col-md-6" key={num}>
                  <label className="form-label modern-label">{`Choice ${num}`}</label>
                  <select
                    name={`course${num}`}
                    className="form-select modern-select"
                    value={formData[`course${num}`]}
                    onChange={handleChange}
                  >
                    <option value="">--Select Course--</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              ))}
              {/* Section: Training Type & Center */}
              <div className="col-12">
                <div className="modern-section">Training and Center</div>
              </div>
              <div className="col-md-6 modern-radio">
                <label className="form-label modern-label">Training Type</label>
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
                <label className="form-label modern-label">Preferred Center</label>
                <select name="center" className="form-select modern-select" value={formData.center} onChange={handleChange}>
                  <option value="">--Select--</option>
                  {centerOptions.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Error + Success + Submit */}
              {error && (
                <div className="col-12 text-center modern-error mb-2 d-flex align-items-center justify-content-center">
                  <FaTimesCircle size={20} className="me-2" /> {error}
                </div>
              )}
              {success && (
                <div className="col-12 text-center modern-success mb-2 d-flex align-items-center justify-content-center">
                  <FaCheckCircle size={20} className="me-2" /> {success}
                </div>
              )}
              <div className="col-12 text-center mt-3">
                <button
                  type="submit"
                  className="btn modern-btn px-4 py-2"
                  disabled={submitted || loading}
                  style={{fontSize:'1.1em'}}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </span>
                  ) : "Submit Application"}
                </button>
              </div>
            </div>
          </form>
        )}
        <div className="text-center text-secondary mt-3" style={{ fontSize: '0.97em' }}>
          Need help? <a href="mailto:support@veta.go.tz" className="text-primary fw-bold">Contact Support</a>
        </div>
        <div className="text-center modern-footer mt-1">
          VETA | &copy; {new Date().getFullYear()} | All rights reserved
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;