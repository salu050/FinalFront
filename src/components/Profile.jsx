import React from 'react';
import logo from './logo.jfif';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom'; // <-- Add this import

const Profile = ({ userId, onUpdate }) => {
  const [form, setForm] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const navigate = useNavigate(); // <-- Add this line

  React.useEffect(() => {
    if (!userId) {
      setError('No user ID provided. Please submit your application first.');
      setLoading(false);
      return;
    }
    // Fetch profile data by user/application ID
    fetch(`http://localhost:8080/api/applications/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => {
        setForm(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load profile. Please try again later.');
        setLoading(false);
      });
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/api/applications/${form.id}`, {
        method: 'PUT', // or 'POST' if your backend uses POST for updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      onUpdate(form);
      // alert('Profile updated!');
      navigate('/dashboard', { state: { profileUpdated: true } }); // <-- Redirect to dashboard
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning text-center">
          No profile data found. Please submit your application first.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <img src={logo} alt="Logo" style={{ height: '80px', borderRadius: '50%', boxShadow: '0 4px 16px #dbeafe' }} />
        <h2 className="mt-3 fw-bold text-primary">Your Profile</h2>
      </div>
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
    </div>
  );
};

export default Profile;