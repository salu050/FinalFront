import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // No longer needed for internal navigation logic
// Removed: import logo from './logo.jfif'; // Assuming logo is handled globally or via placeholder
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCheckCircle, FaTimesCircle, FaRegSmileBeam, FaSpinner } from 'react-icons/fa';
import axios from '../api/axiosConfig.jsx'; // IMPORTANT: Use the configured axios instance

// Options for dropdowns
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

// ApplicationForm component now receives userDetails and onSubmitDetails from App.jsx
const ApplicationForm = ({ onSubmitDetails, submitted, userDetails }) => {
  // Initialize formData with userDetails if available, or empty strings
  const [formData, setFormData] = useState({
    fullName: userDetails?.fullName || '',
    dateOfBirth: userDetails?.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : '',
    gender: userDetails?.gender || '',
    nationality: userDetails?.nationality || '',
    idType: userDetails?.idType || '',
    idNumber: userDetails?.idNumber || '',
    contactPhone: userDetails?.contactPhone || '',
    contactEmail: userDetails?.contactEmail || userDetails?.username || '', // Use username as fallback for email
    educationLevel: userDetails?.educationLevel || '',
    previousSchool: userDetails?.previousSchool || '',
    selectedCenter: userDetails?.selectedCenter || '',
    // For course selections, assuming your backend expects an array of course IDs or names
    // Initialize with empty strings for up to 5 choices if not pre-filled
    course1: userDetails?.applicationDetails?.course1 || '',
    course2: userDetails?.applicationDetails?.course2 || '',
    course3: userDetails?.applicationDetails?.course3 || '',
    course4: userDetails?.applicationDetails?.course4 || '',
    course5: userDetails?.applicationDetails?.course5 || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // isSubmitted state now directly reflects the 'submitted' prop from App.jsx
  const [isSubmitted, setIsSubmitted] = useState(submitted);

  // Placeholder for logo URL
  const logoUrl = "https://placehold.co/90x90/6366f1/ffffff?text=FORM";

  // Dynamic CSS Injection for Bootstrap and Font Awesome
  useEffect(() => {
    const bootstrapLink = document.createElement('link');
    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
    bootstrapLink.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapLink);

    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.integrity = 'sha512-Fo3rlrZj/k7ujTnHg4CGR2D7kSs0V4LLanw2qksYuRlEzO+tcaEPQogQ0KaoIZ2kRGR0FxQ+Kx+G5FwJ0w2L0A==';
    fontAwesomeLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontAwesomeLink);

    return () => {
      document.head.removeChild(bootstrapLink);
      document.head.removeChild(fontAwesomeLink);
    };
  }, []);

  // Effect to load existing application data if userDetails has it
  // This runs when userDetails changes (e.g., on initial load or after profile update)
  useEffect(() => {
    if (userDetails && userDetails.applicationDetails) {
      // Assuming userDetails.applicationDetails contains the submitted form data
      setFormData(prevData => ({
        ...prevData,
        ...userDetails.applicationDetails,
        // Ensure dateOfBirth is formatted correctly for input type="date"
        dateOfBirth: userDetails.applicationDetails.dateOfBirth
          ? new Date(userDetails.applicationDetails.dateOfBirth).toISOString().split('T')[0]
          : '',
        // Also update course selections if they are part of applicationDetails
        course1: userDetails.applicationDetails.course1 || '',
        course2: userDetails.applicationDetails.course2 || '',
        course3: userDetails.applicationDetails.course3 || '',
        course4: userDetails.applicationDetails.course4 || '',
        course5: userDetails.applicationDetails.course5 || '',
      }));
      setIsSubmitted(true); // Set as submitted if data exists
    } else {
      setIsSubmitted(false); // Not submitted if no applicationDetails
    }
  }, [userDetails]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitted) return; // Prevent re-submission if already submitted

    setError('');
    setSuccess('');
    setLoading(true);

    // Basic validation
    const requiredFields = [
        'fullName', 'dateOfBirth', 'gender', 'nationality', 'idType',
        'idNumber', 'contactPhone', 'contactEmail', 'educationLevel',
        'previousSchool', 'selectedCenter'
    ];
    
    for (const field of requiredFields) {
        if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
            setError(`Please fill in the '${field.replace(/([A-Z])/g, ' $1').toLowerCase()}' field.`);
            setLoading(false);
            return;
        }
    }

    // Collect course selections
    const selectedCourses = [];
    for (let i = 1; i <= 5; i++) {
        const courseId = formData[`course${i}`];
        if (courseId) {
            // Assuming courseId is the actual ID, not just the name
            selectedCourses.push(Number(courseId)); // Convert to number if stored as ID
        }
    }

    if (selectedCourses.length === 0) {
        setError("Please select at least one preferred course.");
        setLoading(false);
        return;
    }

    try {
      // Construct the payload for the backend
      const applicationPayload = {
        ...formData,
        userId: userDetails?.id, // Include userId from userDetails prop
        preferredCourses: selectedCourses, // Send as an array of course IDs
        // Ensure dateOfBirth is sent in a format your backend expects (e.g., ISO string)
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      };

      // IMPORTANT: Use the configured axios instance for authenticated requests
      // The backend endpoint is /api/applications (POST)
      const response = await axios.post('/applications', applicationPayload);

      if (response.status === 200 || response.status === 201) {
        setSuccess('Application submitted successfully!');
        setIsSubmitted(true); // Mark as submitted
        
        // IMPORTANT: Update the userDetails in App.jsx with the new application data
        // This ensures the App's global state reflects the submission status.
        if (onSubmitDetails && userDetails) {
            onSubmitDetails({ ...userDetails, applicationDetails: response.data }); // Assuming response.data is the saved application
        }
      } else {
        setError('Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error('Application submission error:', err);
      // More specific error handling from backend response
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // The component will only render the form if it is reached (meaning payment is approved by App.jsx's guard)
  // No internal payment status check is needed here.
  return (
    <div className="container py-5">
      <div className="card shadow-lg border-0 rounded-3 p-4 p-md-5">
        <div className="text-center mb-4">
          <img src={logoUrl} alt="VETA Logo" style={{ height: '90px', borderRadius: '50%', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
          <h2 className="mt-3 fw-bold text-primary">Application Form</h2>
          <p className="text-muted">Fill in your details to apply for a course.</p>
        </div>

        {isSubmitted ? (
          <div className="text-center p-5">
            <FaRegSmileBeam className="text-success mb-3" style={{ fontSize: '4rem' }} />
            <h3 className="text-success">Application Submitted!</h3>
            <p className="lead text-muted">Your application has been received and is awaiting review.</p>
            <p className="text-muted small">You can view your application status on your dashboard.</p>
            {/* Optionally, add a button to go back to dashboard or profile */}
            {/* <button className="btn btn-primary mt-3" onClick={() => navigate('/dashboard')}>Go to Dashboard</button> */}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Personal Information */}
              <div className="col-12">
                <h5 className="mb-3 text-secondary">Personal Information</h5>
              </div>
              <div className="col-md-6">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="gender" className="form-label">Gender</label>
                <select
                  className="form-select"
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="nationality" className="form-label">Nationality</label>
                <select
                  className="form-select"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Nationality</option>
                  {nationalityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="idType" className="form-label">ID Type</label>
                <select
                  className="form-select"
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select ID Type</option>
                  {idOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="idNumber" className="form-label">ID Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Contact Information */}
              <div className="col-12 mt-4">
                <h5 className="mb-3 text-secondary">Contact Information</h5>
              </div>
              <div className="col-md-6">
                <label htmlFor="contactPhone" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="contactEmail" className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Educational Background */}
              <div className="col-12 mt-4">
                <h5 className="mb-3 text-secondary">Educational Background</h5>
              </div>
              <div className="col-md-6">
                <label htmlFor="educationLevel" className="form-label">Highest Education Level</label>
                <input
                  type="text"
                  className="form-control"
                  id="educationLevel"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  placeholder="e.g., Form Four, Diploma"
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="previousSchool" className="form-label">Previous School/Institution</label>
                <input
                  type="text"
                  className="form-control"
                  id="previousSchool"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Course and Center Preference */}
              <div className="col-12 mt-4">
                <h5 className="mb-3 text-secondary">Course & Center Preference</h5>
              </div>
              <div className="col-md-6">
                <label htmlFor="selectedCenter" className="form-label">Preferred VETA Center</label>
                <select
                  className="form-select"
                  id="selectedCenter"
                  name="selectedCenter"
                  value={formData.selectedCenter}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Center</option>
                  {centerOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              {/* Preferred Courses (up to 5 choices) */}
              <div className="col-12">
                <p className="text-muted small mb-2">Select up to 5 course choices in order of preference.</p>
              </div>
              {[1, 2, 3, 4, 5].map((num) => (
                <div className="col-md-6" key={`course-choice-${num}`}>
                  <label htmlFor={`course${num}`} className="form-label">{`Course Choice ${num}`}</label>
                  <select
                    className="form-select"
                    id={`course${num}`}
                    name={`course${num}`}
                    value={formData[`course${num}`]}
                    onChange={handleChange}
                    // Only make the first choice required, others are optional
                    required={num === 1}
                  >
                    <option value="">Select Course</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Error and Success Messages */}
              {error && (
                <div className="col-12 mt-4">
                  <div className="alert alert-danger text-center">
                    <FaTimesCircle className="me-2" /> {error}
                  </div>
                </div>
              )}
              
              {success && (
                <div className="col-12 mt-4">
                  <div className="alert alert-success text-center">
                    <FaCheckCircle className="me-2" /> {success}
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="col-12 text-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2"
                  disabled={loading || isSubmitted} // Disable if loading or already submitted
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
