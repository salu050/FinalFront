import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner, FaRegCopy, FaInfoCircle } from 'react-icons/fa';

const PAYMENT_AMOUNT = 10000; // Set your fee here

const Payment = () => {
    const [controlNumber, setControlNumber] = useState('');
    const [paid, setPaid] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [isApproved, setIsApproved] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const navigate = useNavigate();

    // Poll payment status
    useEffect(() => {
        const verifyPayment = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                setLoadingPayments(false);
                setError('User not found. Please login again.');
                return;
            }
            try {
                const response = await fetch(`http://localhost:8080/api/payments/user/${user.id}`);
                if (!response.ok) throw new Error("Payment verification failed");
                const payments = await response.json();
                const approvedPayment = payments.find(p => p.status === 'APPROVED');
                const pendingPayment = payments.find(p => p.status === 'PENDING');
                const rejectedPayment = payments.find(p => p.status === 'REJECTED');
                if (approvedPayment) {
                    setPaid(true);
                    setIsApproved(true);
                    setControlNumber(approvedPayment.controlNumber);
                    setPaymentStatus('APPROVED');
                } else if (pendingPayment) {
                    setPaid(true);
                    setIsApproved(false);
                    setControlNumber(pendingPayment.controlNumber);
                    setPaymentStatus('PENDING');
                } else if (rejectedPayment) {
                    setPaid(false);
                    setIsApproved(false);
                    setControlNumber('');
                    setPaymentStatus('REJECTED');
                } else {
                    setPaid(false);
                    setIsApproved(false);
                    setControlNumber('');
                    setPaymentStatus('');
                }
            } catch (error) {
                setError('Failed to verify payment status');
            } finally {
                setLoadingPayments(false);
            }
        };

        setLoadingPayments(true);
        verifyPayment();
        const interval = setInterval(verifyPayment, 5000);
        return () => clearInterval(interval);
    }, []);

    // Create payment request
    const handleConfirmPayment = async () => {
        setError('');
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) throw new Error("User not found");

            const paymentData = {
                user: { id: user.id },
                amount: PAYMENT_AMOUNT
            };
            
            const response = await fetch('http://localhost:8080/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            let data;
            try {
                data = await response.json();
            } catch {
                data = await response.text();
            }

            if (!response.ok) {
                let msg = typeof data === "string" ? data : (data?.message || 'Payment creation failed');
                throw new Error(msg);
            }
            setControlNumber(data.controlNumber);
            setPaid(true);
            setPaymentStatus('PENDING');
            setIsApproved(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => navigate("/application");
    const handleCopy = () => {
        if (controlNumber) {
            navigator.clipboard.writeText(controlNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 1300);
        }
    };

    const handleTryAgain = () => {
        setControlNumber('');
        setPaid(false);
        setPaymentStatus('');
        setIsApproved(false);
        setError('');
    };

    // Admin Approval Support by userId (for demo/testing purpose)
    // This can be used in your admin panel, but not intended for user UI.
    const handleAdminApproveByUser = async () => {
        setError('');
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) throw new Error("User not found");
            const response = await fetch(`http://localhost:8080/api/admin/approve-payment-by-user?userId=${user.id}`, {
                method: 'POST'
            });
            let data;
            try {
                data = await response.json();
            } catch {
                data = await response.text();
            }
            if (!response.ok) {
                let msg = typeof data === "string" ? data : (data?.message || 'Approval failed');
                throw new Error(msg);
            }
            setPaymentStatus(data.status);
            setIsApproved(data.status === 'APPROVED');
            setPaid(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-gradient-bg py-5 min-vh-100 d-flex align-items-center">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card modern-card border-0 p-4 shadow-lg">
                            {/* Header Section */}
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary gradient-text">
                                    Application Payment
                                </h2>
                                <p className="text-secondary">Pay to access the application form</p>
                            </div>
                            
                            {/* Payment Timeline */}
                            <div className="payment-timeline mb-4">
                                <div className={`timeline-step ${!paid ? 'active' : ''}`}>
                                    <div className="step-icon">1</div>
                                    <p>Generate Number</p>
                                </div>
                                <div className={`timeline-step ${paid && !isApproved ? 'active' : ''}`}>
                                    <div className="step-icon">2</div>
                                    <p>Admin Approval</p>
                                </div>
                                <div className={`timeline-step ${isApproved ? 'active' : ''}`}>
                                    <div className="step-icon">3</div>
                                    <p>Submit Application</p>
                                </div>
                            </div>
                            
                            {/* Control Number Display */}
                            <div className="control-number-display mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span>Control Number:</span>
                                    <button 
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setShowHelp(!showHelp)}
                                    >
                                        <FaInfoCircle className="me-1" /> Help
                                    </button>
                                </div>
                                
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-lg text-center fw-bold" 
                                        value={controlNumber || '------------'} 
                                        readOnly 
                                    />
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleCopy}
                                        disabled={!controlNumber}
                                    >
                                        <FaRegCopy /> {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                
                                <div className="mt-2 text-center text-muted">
                                    <small>Use this number to pay via mobile money or bank</small>
                                </div>
                            </div>
                            
                            {/* Payment Methods */}
                            <div className="payment-methods mb-4">
                                <h6>Payment Options:</h6>
                                <div className="d-flex flex-wrap gap-2 justify-content-center">
                                    {['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Bank Transfer'].map(method => (
                                        <div key={method} className="payment-method-badge">
                                            {method}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Status and Actions */}
                            {error && (
                                <div className="alert alert-danger text-center">
                                    {error}
                                </div>
                            )}
                            
                            {paymentStatus === 'REJECTED' && (
                                <div className="alert alert-warning text-center">
                                    Payment rejected. Please contact support.<br/>
                                    <button className="btn btn-link mt-2" onClick={handleTryAgain}>Try Again</button>
                                </div>
                            )}
                            
                            <div className="d-grid gap-2">
                                {loadingPayments ? (
                                    <div className="text-center py-3">
                                        <FaSpinner className="fa-spin me-2" />
                                        Checking payment status...
                                    </div>
                                ) : isApproved ? (
                                    <button
                                        className="btn btn-success btn-lg"
                                        onClick={handleContinue}
                                    >
                                        <FaCheckCircle className="me-2" />
                                        Continue to Application
                                    </button>
                                ) : paid ? (
                                    <button 
                                        className="btn btn-warning btn-lg" 
                                        disabled
                                    >
                                        <FaSpinner className="fa-spin me-2" />
                                        Waiting for Approval
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-lg gradient-btn"
                                        onClick={handleConfirmPayment}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <><FaSpinner className="fa-spin me-2" /> Processing...</>
                                        ) : (
                                            "Generate Payment Number"
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* For DEMO ONLY: Admin Approve (Remove in production) */}
                            {/* <div className="d-grid gap-2 mt-3">
                                <button className="btn btn-secondary" onClick={handleAdminApproveByUser}>
                                    Approve Payment (Demo Admin)
                                </button>
                            </div> */}
                            
                            {/* Help Tooltip */}
                            {showHelp && (
                                <div className="mt-3 alert alert-info">
                                    <strong>How to Pay:</strong>
                                    <ul className="mb-0 mt-2">
                                        <li>Copy the control number</li>
                                        <li>Use mobile money or banking app</li>
                                        <li>Admin will approve within 24 hours</li>
                                        <li>Return here to continue application</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .modern-gradient-bg {
                    background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
                }
                .modern-card {
                    border-radius: 20px;
                    overflow: hidden;
                }
                .gradient-text {
                    background: linear-gradient(90deg, #6366f1, #38bdf8, #43e97b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .gradient-btn {
                    background: linear-gradient(90deg, #6366f1, #38bdf8);
                    border: none;
                    transition: all 0.3s;
                }
                .gradient-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
                }
                .payment-timeline {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    margin: 30px 0;
                }
                .payment-timeline::before {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #dee2e6;
                    z-index: 1;
                }
                .timeline-step {
                    text-align: center;
                    z-index: 2;
                    flex: 1;
                }
                .timeline-step.active .step-icon {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                    transform: scale(1.1);
                }
                .step-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #dee2e6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 10px;
                    transition: all 0.3s;
                    font-weight: bold;
                }
                .payment-method-badge {
                    padding: 5px 15px;
                    border-radius: 20px;
                    background: white;
                    border: 1px solid #dee2e6;
                    font-size: 0.9rem;
                }
                .control-number-display input {
                    letter-spacing: 2px;
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};

export default Payment;