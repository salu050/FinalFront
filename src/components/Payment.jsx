import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig.jsx'; // Corrected: Import configured axios instance

const PAYMENT_AMOUNT = 10000; // Set your fee here

// Payment component now accepts navigation functions as props
const Payment = ({ onNavigateToApplication, onNavigateToDashboard, onNavigateToLogin, userDetails, setHasPaid, onAuthSuccess }) => {
    const [controlNumber, setControlNumber] = useState('');
    const [paid, setPaid] = useState(false); // True if payment initiated/approved
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // For payment generation button
    const [paymentStatus, setPaymentStatus] = useState(''); // PENDING, APPROVED, REJECTED
    const [isApproved, setIsApproved] = useState(false); // True if payment is APPROVED
    const [loadingPayments, setLoadingPayments] = useState(true); // For initial status check
    const [copied, setCopied] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // --- Dynamic CSS Injection for Bootstrap and Custom Styles ---
    useEffect(() => {
        // Inject Bootstrap CSS
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

        // Inject custom styles
        const id = "payment-modern-style";
        let style = document.getElementById(id);
        if (!style) {
            style = document.createElement("style");
            style.id = id;
            style.innerHTML = `
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
            `;
            document.head.appendChild(style);
        }

        // Cleanup function
        return () => {
            document.head.removeChild(bootstrapLink);
            document.head.removeChild(fontAwesomeLink); // Remove Font Awesome link too
            if (document.getElementById(id)) {
                document.head.removeChild(document.getElementById(id));
            }
        };
    }, []);

    // Poll payment status from the backend
    useEffect(() => {
        const verifyPayment = async () => {
            if (!userDetails || !userDetails.id) {
                setLoadingPayments(false);
                setError('User details missing. Please login again.');
                if (onNavigateToLogin) onNavigateToLogin();
                return;
            }

            try {
                // Call the /api/payments/me/status endpoint which returns a boolean
                const response = await axios.get(`/payments/me/status`); // Use configured axios
                
                const hasPaidApplicationFee = response.data; // Directly get the boolean

                if (hasPaidApplicationFee) {
                    setPaid(true);
                    setIsApproved(true);
                    setPaymentStatus('APPROVED');
                    // Update parent App.jsx's userDetails state
                    if (onAuthSuccess) {
                        onAuthSuccess({ ...userDetails, hasPaidApplicationFee: true });
                    }
                } else {
                    // If not approved, check for pending payments
                    const paymentsResponse = await axios.get(`/payments/user/${userDetails.id}`); // Use configured axios
                    const payments = paymentsResponse.data;
                    const pendingPayment = payments.find(p => p.status === 'PENDING');
                    const rejectedPayment = payments.find(p => p.status === 'REJECTED');

                    if (pendingPayment) {
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
                        // No approved, no pending, no rejected found. User needs to generate.
                        setPaid(false);
                        setIsApproved(false);
                        setControlNumber('');
                        setPaymentStatus('');
                    }
                    // Update parent App.jsx's userDetails state if it was false
                    if (onAuthSuccess && userDetails.hasPaidApplicationFee !== hasPaidApplicationFee) {
                        onAuthSuccess({ ...userDetails, hasPaidApplicationFee: hasPaidApplicationFee });
                    }
                }
            } catch (error) {
                console.error("Failed to verify payment status:", error);
                setError('Failed to verify payment status. Please try again.');
                setPaid(false);
                setIsApproved(false);
                setControlNumber('');
                setPaymentStatus('');
                // If there's an auth error, axiosConfig interceptor should handle redirect
            } finally {
                setLoadingPayments(false);
            }
        };

        // Initial fetch and then poll every 5 seconds
        verifyPayment();
        const interval = setInterval(verifyPayment, 5000);
        return () => clearInterval(interval); // Cleanup on unmount
    }, [userDetails, onNavigateToLogin, onAuthSuccess]); // Dependencies: userDetails, onNavigateToLogin, onAuthSuccess

    // Create payment request
    const handleConfirmPayment = async () => {
        setError('');
        setLoading(true);
        if (!userDetails || !userDetails.id) {
            setError("User not found or not authenticated. Please login again.");
            setLoading(false);
            if (onNavigateToLogin) onNavigateToLogin();
            return;
        }

        try {
            const paymentData = {
                userId: userDetails.id, // Backend expects userId directly
                amount: PAYMENT_AMOUNT,
                // controlNumber will be generated by backend
                // status will be set to PENDING by backend
            };
            
            const response = await axios.post('/payments', paymentData); // Use configured axios
            
            const data = response.data; // Axios response data is directly available

            setControlNumber(data.controlNumber);
            setPaid(true);
            setPaymentStatus('PENDING');
            setIsApproved(false);
            // After initiating payment, update parent state to reflect pending status
            if (onAuthSuccess) {
                onAuthSuccess({ ...userDetails, hasPaidApplicationFee: false }); // User has initiated, but not yet approved
            }
        } catch (err) {
            console.error("Payment creation error:", err);
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => onNavigateToApplication(); // Use prop for navigation
    
    const handleCopy = () => {
        if (controlNumber) {
            navigator.clipboard.writeText(controlNumber).then(() => { // Use navigator.clipboard
                setCopied(true);
                setTimeout(() => setCopied(false), 1300);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // Fallback for older browsers or environments where navigator.clipboard is not available
                const textArea = document.createElement("textarea");
                textArea.value = controlNumber;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1300);
                } catch (e) {
                    console.error('Fallback copy failed: ', e);
                }
                document.body.removeChild(textArea);
            });
        }
    };

    const handleTryAgain = () => {
        setControlNumber('');
        setPaid(false);
        setPaymentStatus('');
        setIsApproved(false);
        setError('');
        // Re-fetch status to ensure UI is consistent with backend
        setLoadingPayments(true);
        // This will trigger the useEffect to re-verify payment status
    };

    if (loadingPayments) {
        return (
            <div className="modern-gradient-bg py-5 min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3 text-secondary">Loading payment status...</p>
                </div>
            </div>
        );
    }

    if (error && error.includes('User details missing')) {
        return (
            <div className="modern-gradient-bg py-5 min-vh-100 d-flex align-items-center justify-content-center">
                <div className="alert alert-danger text-center">
                    {error}
                    <button className="btn btn-primary mt-3 d-block mx-auto" onClick={onNavigateToLogin}>Go to Login</button>
                </div>
            </div>
        );
    }

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
                                        <i className="fas fa-info-circle me-1"></i> Help {/* Font Awesome icon */}
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
                                        <i className="far fa-copy"></i> {copied ? 'Copied!' : 'Copy'} {/* Font Awesome icon */}
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
                                {isApproved ? (
                                    <button
                                        className="btn btn-success btn-lg"
                                        onClick={handleContinue}
                                    >
                                        <i className="fas fa-check-circle me-2"></i> {/* Font Awesome icon */}
                                        Continue to Application
                                    </button>
                                ) : paid ? ( // If paid is true but not approved (means pending)
                                    <button 
                                        className="btn btn-warning btn-lg" 
                                        disabled
                                    >
                                        <i className="fas fa-spinner fa-spin me-2"></i> {/* Font Awesome icon */}
                                        Waiting for Approval
                                    </button>
                                ) : ( // Not paid, not pending, not approved, not rejected
                                    <button
                                        className="btn btn-primary btn-lg gradient-btn"
                                        onClick={handleConfirmPayment}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i> Processing...
                                            </>
                                        ) : (
                                            "Generate Payment Number"
                                        )}
                                    </button>
                                )}
                            </div>
                            
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
        </div>
    );
};

export default Payment;
