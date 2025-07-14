import React, { useState, useEffect } from 'react';
// Removed: import { Link, useLocation } from 'react-router-dom'; // No longer using react-router-dom directly
import axios from '../api/axiosConfig.jsx'; // Corrected: Import configured axios instance

const getAvatar = (username) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;

const Dashboard = ({ onNavigateToPayment, onNavigateToApplication, onNavigateToProfile, onNavigateToLogin, profileUpdated, userDetails }) => {
  // Placeholder URLs for images as local file imports might not resolve in all environments
  const logoUrl = "https://placehold.co/90x90/6366f1/ffffff?text=LOGO";
  // Use userDetails for dynamic profile image
  const profileImageUrl = userDetails ? getAvatar(userDetails.username) : "https://placehold.co/60x60/6366f1/ffffff?text=P";

  // hasPaid status is now derived directly from userDetails prop
  const hasPaid = userDetails?.hasPaidApplicationFee;
  const username = userDetails?.username || 'Student'; // Default to 'Student' if username is not available

  // --- Dynamic CSS Injection for Bootstrap and Font Awesome ---
  useEffect(() => {
    // Dynamically inject Bootstrap CSS link
    const bootstrapLink = document.createElement('link');
    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
    bootstrapLink.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapLink);

    // Inject Font Awesome CSS for icons
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.integrity = 'sha512-Fo3rlrZj/k7ujTnHg4CGR2D7kSs0V4LLanw2qksYuRlEzO+tcaEPQogQ0KaoIZ2kRGR0FxQ+Kx+G5FwJ0w2L0A==';
    fontAwesomeLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontAwesomeLink);

    // Cleanup function to remove the links when the component unmounts
    return () => {
      document.head.removeChild(bootstrapLink);
      document.head.removeChild(fontAwesomeLink);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // If userDetails is null, it means the user is not logged in or data is not loaded yet.
  // App.jsx's RequireAuth will handle redirection to login, so we can assume userDetails is present here.
  if (!userDetails) {
    // This case should ideally be handled by RequireAuth in App.jsx,
    // but as a fallback or during initial load, we might show a minimal loading/redirect message.
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-secondary">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <img src={logoUrl} alt="Logo" style={{ height: '90px', borderRadius: '50%', boxShadow: '0 4px 16px #dbeafe' }} />
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
              <img src={profileImageUrl} alt="Profile" style={{ height: 60, width: 60, borderRadius: '50%', marginRight: 20 }} />
              <div>
                <h5 className="mb-1">Hello, <span className="text-primary">{username}</span>!</h5>
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
              <button
                onClick={hasPaid ? onNavigateToApplication : undefined} // Call prop function
                className={`btn btn-primary${!hasPaid ? " disabled" : ""}`}
                disabled={!hasPaid} // Use disabled prop directly
                title={!hasPaid ? "Please complete payment before applying." : ""}
              >
                Application Form
              </button>
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
              <button onClick={onNavigateToPayment} className="btn btn-success">Go to Payment</button> {/* Call prop function */}
            </div>
          </div>
        </div>
        {/* Add more cards as needed */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Profile</h5>
              <p className="card-text">View or update your personal information.</p>
              <button onClick={onNavigateToProfile} className="btn btn-secondary">View Profile</button> {/* Call prop function */}
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
