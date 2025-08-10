import React, { useState, useEffect } from 'react';
import logo from './logo.jfif';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const Profile = ({ userId, onUpdate }) => {
  // Use a state to hold the form data
  const [form, setForm] = useState(null);
  // States for loading, error messages, and success messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if userId is provided. If not, set an error message and stop.
    if (!userId) {
      setError('No user ID provided. Please submit your application first.');
      setLoading(false);
      return;
    }

    // Corrected fetch call: Use the /api/applications/user/{userId} endpoint
    // to get the application data associated with the logged-in user.
    const fetchProfile = async () => {
      try {
        const res = await fetch(`https://localhost:8082/api/applications/user/${userId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('No profile data found. Please submit your application first.');
          }
          throw new Error('Failed to fetch profile. Please try again later.');
        }

        const data = await res.json();
        setForm(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Handle changes to the form inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle the form submission for updating the profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Corrected fetch call for the PUT request: This uses the application's ID (form.id)
      // which was correctly retrieved from the initial fetch, to update the record.
      const response = await fetch(`https://localhost:8082/api/applications/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedForm = await response.json();
      onUpdate(updatedForm); // Update the parent component's state
      setSuccess('Profile updated successfully!'); // Set success message
      // No need to redirect immediately; a success message is better UX.
      // navigate('/dashboard', { state: { profileUpdated: true } });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <img src={logo} alt="Logo" style={{ height: '80px', borderRadius: '50%', boxShadow: '0 4px 16px #dbeafe' }} />
        <h2 className="mt-3 fw-bold text-primary">Your Profile</h2>
      </div>

      {/* Conditional rendering for error and success messages */}
      {error && (
        <div className="alert alert-danger text-center">{error}</div>
      )}
      {success && (
        <div className="alert alert-success text-center">{success}</div>
      )}

      {/* Show form only if there is data */}
      {form ? (
        <form onSubmit={handleUpdate} className="bg-white p-4 rounded shadow">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input type="text" name="fullname" className="form-control" value={form.fullname || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Gender</label>
              <input type="text" name="gender" className="form-control" value={form.gender || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dob" className="form-control" value={form.dob || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Place of Birth</label>
              <input type="text" name="birthplace" className="form-control" value={form.birthplace || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Nationality</label>
              <input type="text" name="nationality" className="form-control" value={form.nationality || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">ID Type</label>
              <input type="text" name="idType" className="form-control" value={form.idType || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">ID Number</label>
              <input type="text" name="idNumber" className="form-control" value={form.idNumber || ''} onChange={handleChange} />
            </div>
            <div className="col-12 mt-4">
              <h5 className="fw-bold text-secondary">Course Preferences</h5>
            </div>
            {Array.isArray(form.courses) && form.courses.length > 0 ? (
              form.courses.map((course, idx) => (
                <div className="col-md-6" key={idx}>
                  <label className="form-label">{`Choice ${idx + 1}`}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={typeof course === 'string' ? course : course.name || ''}
                    readOnly
                  />
                </div>
              ))
            ) : (
              <div className="col-12 text-muted">No courses selected.</div>
            )}
            <div className="col-md-6 mt-4">
              <label className="form-label">Training Type</label>
              <input type="text" name="trainingType" className="form-control" value={form.trainingType || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6 mt-4">
              <label className="form-label">Preferred Center</label>
              <input type="text" name="center" className="form-control" value={form.center || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </div>
        </form>
      ) : (
        <div className="container py-5">
          <div className="alert alert-warning text-center">
            No profile data found. Please submit your application first.
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
