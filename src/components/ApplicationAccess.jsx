import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationForm from './ApplicationForm';
import RequireApprovedPayment from './RequireApprovedPayment';
import { FaCheckCircle, FaLock, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const ApplicationAccess = () => {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [controlNumber, setControlNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setErrorMsg('You must login to continue.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:8080/api/payments/user/${user.id}`)
      .then(res => res.ok ? res.json() : [])
      .then((data) => {
        if (!Array.isArray(data) || !data.length) {
          setPaymentStatus('NONE');
          setLoading(false);
          return;
        }
        const latest = data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setPaymentStatus(latest.status);
        setControlNumber(latest.controlNumber);
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg('Could not verify payment. Try again.');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <FaSpinner className="fa-spin text-primary me-2" size={32} />
        <span>Checking payment status...</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <RequireApprovedPayment>
        <ApplicationForm />
      </RequireApprovedPayment>
    );
  }

  let button;
  if (paymentStatus === 'APPROVED') {
    button = (
      <button
        className="btn btn-success btn-lg px-5 py-3 fw-bold"
        onClick={() => setShowForm(true)}
        style={{ fontSize: '1.25em', borderRadius: '1.3rem', letterSpacing: 1, boxShadow: '0 2px 16px #43e97b55' }}
      >
        <FaCheckCircle className="me-2" /> Start Application
      </button>
    );
  } else if (paymentStatus === 'PENDING') {
    button = (
      <button
        className="btn btn-secondary btn-lg px-5 py-3 fw-bold"
        disabled
        style={{ fontSize: '1.15em', borderRadius: '1.3rem', opacity: 0.85 }}
      >
        <FaLock className="me-2" /> Payment pending admin approval
      </button>
    );
  } else if (paymentStatus === 'REJECTED') {
    button = (
      <button
        className="btn btn-danger btn-lg px-5 py-3 fw-bold"
        disabled
        style={{ fontSize: '1.15em', borderRadius: '1.3rem', opacity: 0.85 }}
      >
        <FaExclamationCircle className="me-2" /> Payment rejected. Please make a new payment.
      </button>
    );
  } else {
    button = (
      <button
        className="btn btn-warning btn-lg px-5 py-3 fw-bold"
        disabled
        style={{ fontSize: '1.15em', borderRadius: '1.3rem', opacity: 0.85 }}
      >
        <FaLock className="me-2" /> No payment found. Please pay first.
      </button>
    );
  }

  return (
    <div className="modern-bg d-flex align-items-center justify-content-center py-5" style={{ minHeight: '80vh' }}>
      <div className="modern-glass col-12 col-md-7 p-5 my-4 modern-card-shadow text-center">
        <h2 className="modern-title mb-3">Application Portal</h2>
        <div className="mb-4" style={{fontWeight: 500, fontSize: '1.1em', color: '#6366f1', letterSpacing: 1}}>
          {!errorMsg && (
            <>
              {paymentStatus === 'APPROVED' && "Your payment is approved! You may now proceed to fill your application form."}
              {paymentStatus === 'PENDING' && "Your payment is pending admin approval. Please wait for approval."}
              {paymentStatus === 'REJECTED' && "Your payment was rejected. Please make a new payment to continue."}
              {paymentStatus === 'NONE' && "You need to make a payment and get approval to access the application form."}
              {errorMsg && <span className="text-danger">{errorMsg}</span>}
            </>
          )}
        </div>
        {controlNumber && (
          <div className="mb-3">
            <span className="badge bg-primary fs-5">Control Number: {controlNumber}</span>
          </div>
        )}
        {button}
        <div className="text-center modern-footer mt-4">
          VETA | &copy; {new Date().getFullYear()} | All rights reserved
        </div>
      </div>
    </div>
  );
};

export default ApplicationAccess;