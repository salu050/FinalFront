import React, { useState } from 'react';
import logo from './logo.jfif';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useLocation } from 'react-router-dom';

const Dashboard = () => {
  const [hasPaid, setHasPaid] = useState(false);
  const location = useLocation();
  const profileUpdated = location.state && location.state.profileUpdated;

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <img src={logo} alt="Logo" style={{ height: '90px', borderRadius: '50%', boxShadow: '0 4px 16px #dbeafe' }} />
        <h2 className="mt-3 fw-bold text-primary">Welcome to Your Dashboard!</h2>
        {profileUpdated ? (
          <div className="alert alert-success mt-3">
            Your profile has been updated! <br />
            <strong>Visit your account to see your application status.</strong>
          </div>
        ) : (
          <p className="lead text-secondary">What would you like to do next?</p>
        )}
      </div>

      <div className="row g-4 justify-content-center mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center">
              <img src={logo} alt="Profile" style={{ height: 60, width: 60, borderRadius: '50%', marginRight: 20 }} />
              <div>
                <h5 className="mb-1">Hello, <span className="text-primary">Student</span>!</h5>
                <p className="mb-0 text-muted">Status: <span className={hasPaid ? "text-success" : "text-danger"}>{hasPaid ? "Payment Complete" : "Payment Pending"}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Apply for a Course</h5>
              <p className="card-text">Fill out your application form for your preferred course.</p>
              <Link
                to={hasPaid ? "/application" : "#"}
                className={`btn btn-primary${!hasPaid ? " disabled" : ""}`}
                tabIndex={!hasPaid ? -1 : 0}
                aria-disabled={!hasPaid}
                title={!hasPaid ? "Please complete payment before applying." : ""}
              >
                Application Form
              </Link>
              {!hasPaid && (
                <div className="mt-2 text-danger small">
                  Please complete payment before filling the application form.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Make a Payment</h5>
              <p className="card-text">Pay your application or course fees securely.</p>
              <Link to="/payment" className="btn btn-success">Go to Payment</Link>
              {!hasPaid && (
                <div className="mt-2">
                  <button
                    className="btn btn-outline-info btn-sm"
                    onClick={() => setHasPaid(true)}
                  >
                    Simulate Payment (Demo)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Add more cards as needed */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Profile</h5>
              <p className="card-text">View or update your personal information.</p>
              <Link to="/profile" className="btn btn-secondary">View Profile</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-5">
        <p className="text-muted">Thank you for using ZVTCCS. If you need help, contact support.</p>
      </div>
    </div>
  );
};

export default Dashboard;