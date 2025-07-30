import React, { useState, useEffect } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaRegSmileBeam,
  FaUnlockAlt,
  FaRocket,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import axios from '../api/axiosConfig.jsx'; // IMPORTANT: Import the configured axios instance

// ---- BUBBLES AND ANIMATION STYLES ----
const bubbles = [
  { left: '6%', top: '12%', size: 180, color: '#28305a' },
  { left: '78%', top: '7%', size: 140, color: '#23314b' },
  { left: '43%', top: '78%', size: 220, color: '#372f4c' },
  { left: '68%', top: '56%', size: 170, color: '#1b2943' },
  { left: '18%', top: '55%', size: 130, color: '#31305a' },
  { left: '60%', top: '33%', size: 120, color: '#3d375a' },
  { left: '23%', top: '32%', size: 85, color: '#27325a' }
];
const bubbleStyle = (i, offset) => ({
  position: 'absolute',
  borderRadius: '50%',
  opacity: 0.18 + 0.06 * (i % 5),
  filter: 'blur(2px)',
  animation: `bubbleMove${i % 3} 16s linear infinite alternate`,
  willChange: 'transform',
  transform: `translate(${offset.x}px,${offset.y}px)`
});
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
@keyframes pop-in {0%{ transform:translateY(60px) scale(0.8) rotate(-6deg); opacity:0;}60%{ transform:scale(1.05) rotate(3deg);}85%{ transform:scale(0.97) rotate(-1deg);}100%{transform:translateY(0) scale(1) rotate(0); opacity:1;}}
@keyframes rocket {0%{transform:translateY(90px) scale(0.8);}60%{transform:translateY(-10px) scale(1.1);}80%{transform:translateY(4px) scale(1);}100%{transform:translateY(0) scale(1);}}
@keyframes welcomePop {0%{opacity:0;transform:scale(0.85);}60%{opacity:1;transform:scale(1.13);}80%{transform:scale(0.97);}100%{opacity:1;transform:scale(1);}}
@keyframes bubbleMove0 {0%{transform:translateY(0);}100%{transform:translateY(-60px);}}
@keyframes bubbleMove1 {0%{transform:translateX(0);}100%{transform:translateX(60px);}}
@keyframes bubbleMove2 {0%{transform:translateY(0) translateX(0);}100%{transform:translateY(-30px) translateX(36px);}}
.input-focused {box-shadow: 0 0 0 3px #a5b4fc50, 0 1px 3px 0 rgba(0,0,0,0.07);border-color: #6366f1 !important;transition: box-shadow 0.22s cubic-bezier(.57,1.5,.53,1), border-color 0.22s;}
.theme-dark {
  background: #23284b !important;
  color: #f8fafc !important;
}
.theme-dark .form-control {
  background: #29315a !important;
  color: #fff !important;
  border-color: #6366f1 !important;
  font-weight: 500 !important;
  letter-spacing: 1px !important;
}
.theme-dark .form-control::placeholder {
  color: #d1d5db !important;
  opacity: 1 !important;
}
.theme-dark .form-select {
  background: #29315a !important;
  color: #fff !important;
  border-color: #6366f1 !important;
  font-weight: 500 !important;
  letter-spacing: 1px !important;
}
.theme-dark .form-select option {
  color: #fff !important;
  background: #29315a !important;
}
.theme-dark .card {
  background: #222646 !important;
  color: #f8fafc !important;
  border: 1.5px solid #6366f1 !important;
}
.theme-dark .form-label {color: #a5b4fc !important;}
.theme-dark .text-secondary {color: #a5b4fc !important;}
.theme-dark .btn-primary {background: linear-gradient(90deg, #6366f1 10%, #43e97b 90%) !important;}
.success-morph {background: #22c55e !important; border-radius: 999px !important; width: 56px !important; height: 56px !important; padding:0 !important; display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(.63,2,.53,1);}
@media (max-width: 600px) {.card {padding: 1rem !important;}}
`;
if (!document.getElementById('__register_dark_style')) {
  styleSheet.id = '__register_dark_style';
  document.head.appendChild(styleSheet);
}
const glassDarkStyle = {
  background: '#222646',
  borderRadius: '2rem',
  boxShadow: '0 12px 32px 0 rgba(60,60,120,0.18)',
  border: '1.5px solid #6366f1',
  animation: "pop-in 1.1s cubic-bezier(.57,1.5,.53,1) both"
};
// ---- PASSWORD UTILS ----
const passwordRequirements = [
  { req: "At least 8 characters", test: pwd => pwd.length >= 8 },
  { req: "At least one uppercase letter", test: pwd => /[A-Z]/.test(pwd) },
  { req: "At least one number", test: pwd => /[0-9]/.test(pwd) },
  { req: "At least one special character (!@#$%^&*)", test: pwd => /[!@#$%^&*]/.test(pwd) },
];
function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}
function useTyping(text, speed = 55) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let curr = 0;
    setTyped('');
    if (!text) return;
    const interval = setInterval(() => {
      setTyped(prev => prev + text[curr]);
      curr++;
      if (curr >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return typed;
}
// ---- MAIN COMPONENT ----
// Register component now accepts onAuthSuccess prop for navigation
const Register = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordReq, setShowPasswordReq] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [successMorph, setSuccessMorph] = useState(false);
  const [inputValid, setInputValid] = useState({ username: null, password: null });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  // Placeholder URLs for images and dynamic CSS injection
  const logoUrl = "./logo.jfif"; // Placeholder for logo.jfif
  useEffect(() => {
    // Dynamically inject Bootstrap CSS link
    const bootstrapLink = document.createElement('link');
    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
    bootstrapLink.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapLink);
    // Cleanup function to remove the link when the component unmounts
    return () => {
      document.head.removeChild(bootstrapLink);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount
  // ---- Parallax for bubbles ----
  useEffect(() => {
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);
  // ---- Login attempts/cooldown ----
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    const cooldown = localStorage.getItem('loginCooldownUntil');
    setLoginAttempts(attempts);
    if (cooldown) {
      const cooldownTime = parseInt(cooldown, 10);
      if (cooldownTime > Date.now()) {
        setCooldownUntil(cooldownTime);
      } else {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginCooldownUntil');
        setLoginAttempts(0);
        setCooldownUntil(null);
      }
    }
  }, []);
  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) {
        setCooldownUntil(null);
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginCooldownUntil');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);
  // ---- Password strength ----
  const passwordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    passwordRequirements.forEach(({ test }) => {
      if (test(pwd)) score++;
    });
    return score;
  };
  const clearUserFields = () => {
    setForm({ username: '', password: '' });
    setResetUsername('');
    setResetPassword('');
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "username") {
      setInputValid(v => ({ ...v, username: e.target.value.length >= 3 }));
    }
    if (e.target.name === "password") {
      setShowPasswordReq(true);
      setInputValid(v => ({ ...v, password: isStrongPassword(e.target.value) }));
    }
  };
  const confettiPop = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 1400);
  };
  // ---- Form Submission ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (isLogin && cooldownUntil && cooldownUntil > Date.now()) {
      setError(`Too many failed attempts. Please wait ${cooldownLeft} seconds before trying again.`);
      return;
    }
    setIsLoading(true);
    if (!form.username.trim()) {
      setError('Username is required.');
      setIsLoading(false);
      setInputValid(v => ({ ...v, username: false }));
      return;
    }
    if (!form.password) {
      setError('Password is required.');
      setIsLoading(false);
      setInputValid(v => ({ ...v, password: false }));
      return;
    }
    if (!isLogin && !isStrongPassword(form.password)) {
      setError('Choose a strong password.');
      setShowPasswordReq(true);
      setIsLoading(false);
      setInputValid(v => ({ ...v, password: false }));
      return;
    }
    try {
      const url = isLogin
        ? '/users/login'
        : '/users/register';
      const payload = isLogin
        ? { username: form.username, password: form.password }
        : {
            username: form.username,
            password: form.password,
            role: "STUDENT" // Explicitly send the role for new registrations
          };
      const response = await axios.post(url, payload);
      const data = response.data;
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginCooldownUntil');
      if (isLogin) {
        // Only call onAuthSuccess for successful logins
        if (onAuthSuccess) {
          onAuthSuccess(data); // Pass the full user data including token and hasPaidApplicationFee
        }
        setSuccess('Login successful!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1800);
        setShowWelcome(true);
        setShowRocket(true);
        confettiPop();
        setTimeout(() => setShowWelcome(false), 1700);
        setTimeout(() => setShowRocket(false), 1200);
      } else {
        // For successful registration, show success message and switch to login form
        setSuccess('Account created successfully! Please log in.');
        setShowToast(true);
        confettiPop();
        // Clear form fields after successful registration
        clearUserFields();
        setTimeout(() => {
          setIsLogin(true); // Switch to login view
          setSuccess(''); // Clear success message after switching
          setShowToast(false);
          setSuccessMorph(false);
        }, 2000); // Give user time to read success message
      }
      setSuccessMorph(true);
      setTimeout(() => setSuccessMorph(false), 1000); // Morph animation duration
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred. Please check your network connection.');
      setSuccessMorph(false); // Ensure morph resets on error
    }
    setIsLoading(false);
  };
  // ---- Forgot Password ----
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMsg('');
    if (!resetUsername.trim()) {
      setResetMsg('Please enter your username.');
      return;
    }
    setIsLoading(true);

    // FIX: Make an actual API call to the backend for password reset request
    try {
      const response = await axios.post('/users/reset-password-request', { username: resetUsername });
      setResetMsg('A password reset link has been sent to your email. Please check your inbox.');
      setShowReset('reset'); // Switch to the stage where user enters new password
    } catch (err) {
      console.error("Forgot password request error:", err);
      setResetMsg(err.response?.data?.message || err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg('');
    if (!resetPassword) {
      setResetMsg('Please enter your new password.');
      return;
    }
    if (!isStrongPassword(resetPassword)) {
      setResetMsg('Choose a strong password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/users/reset-password', { username: resetUsername, newPassword: resetPassword });
      const data = response.data;
      setResetMsg('Password reset successfully! You can now login.');
      setShowToast(true);
      confettiPop();
      setTimeout(() => {
        setShowReset(false);
        clearUserFields();
        setResetMsg('');
        setIsLogin(true);
        setShowToast(false);
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    }
    setIsLoading(false);
  };
  // ---- Floating label for inputs ----
  const floatingLabel = (label, icon, inputProps, isFocused, value, rightIcon = null, valid = null) => (
    <div className="mb-4 position-relative" style={{ minHeight: 58 }}>
      <span style={{
        position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
        color: '#6366f1', fontSize: 20, zIndex: 2
      }}>
        {icon}
      </span>
      <input
        {...inputProps}
        className={`form-control form-control-lg rounded-3 ps-5 pe-5 ${isFocused ? 'input-focused' : ''}`}
        style={{ background: '#29315a', marginTop: '8px', color: '#fff' }}
        onFocus={() => setFocusedField(label)}
        onBlur={() => setFocusedField(null)}
        spellCheck={false}
      />
      {rightIcon && (
        <span style={{
          position: 'absolute', right: valid === null ? 10 : 38, top: '50%', transform: 'translateY(-50%)',
          zIndex: 3
        }}>
          {rightIcon}
        </span>
      )}
      {valid !== null && (
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) scale(1.2)',
          zIndex: 4, transition: 'color 0.2s'
        }}>
          {valid ? <FaCheckCircle color="#22c55e" /> : <FaTimesCircle color="#ef4444" />}
        </span>
      )}
      <label
        className="form-label fs-5"
        style={{
          position: 'absolute',
          left: '48px',
          top: value || isFocused ? '-14px' : '14px',
          fontSize: value || isFocused ? '0.99em' : '1.15em',
          color: value || isFocused ? '#6366f1' : '#a5b4fc',
          background: value || isFocused ? '#222646' : 'transparent',
          zIndex: 2,
          padding: value || isFocused ? '0 5px' : '0',
          transition: 'all .2s cubic-bezier(.57,1.5,.53,1)'
        }}
      >
        {label}
      </label>
    </div>
  );
  // ---- Welcome Message ----
  const welcomeText = isLogin ? "WWelcome back! Please login to your account." : "Fill in your details to register.";
  const typedWelcome = useTyping(welcomeText, 25);
  return (
    <div className="theme-dark" style={{
      position: 'relative',
      minHeight: '100vh',
      minWidth: '100vw',
      zIndex: 1,
      overflow: 'hidden',
      background: '#23284b'
    }}>
      {/* Animated background bubbles */}
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: '#23284b'
      }} aria-hidden="true">
        <svg style={{position:'absolute', bottom:0, left:0, width:'100vw', height:'220px', zIndex:0}} viewBox="0 0 1440 320">
          <path fill="#28305a" fillOpacity="0.13"
            d="M0,192L80,202.7C160,213,320,235,480,229.3C640,224,800,192,960,186.7C1120,181,1280,203,1360,213.3L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
        {bubbles.map((b, i) => (
          <div
            key={i}
            style={{
              ...bubbleStyle(i, parallax),
              left: b.left,
              top: b.top,
              width: b.size,
              height: b.size,
              background: b.color
            }}
          />
        ))}
      </div>
      {/* Toast notification */}
      {showToast && (
        <div className="position-fixed top-0 end-0 m-4 toast show" style={{ zIndex: 9999, minWidth: 260 }}>
          <div className={`toast-header ${success ? 'bg-success' : 'bg-danger'} text-white`}>
            {success ? <FaCheckCircle className="me-2" /> : <FaTimesCircle className="me-2" />}
            <strong className="me-auto">{success ? 'Success' : 'Error'}</strong>
          </div>
          <div className="toast-body">
            {success || error || resetMsg || "Action completed!"}
          </div>
        </div>
      )}
      {/* Welcome animation */}
      {showWelcome && (
        <div className="position-fixed top-50 start-50 translate-middle d-flex flex-column align-items-center" style={{zIndex:9999, animation: 'welcomePop 1.2s'}}>
          <FaRegSmileBeam style={{fontSize: 72, color: "#06b6d4", animation: "pop-in 0.7s cubic-bezier(.57,1.5,.53,1) both"}} />
          <h2 className="fw-bold text-primary mt-2" style={{background: "linear-gradient(90deg,#6366f1,#38b9f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
            Welcome Back!
          </h2>
        </div>
      )}
      {/* Rocket animation for login */}
      {showRocket && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x" style={{zIndex:8888, pointerEvents:"none"}}>
          <FaRocket style={{fontSize: 46, color: "#38f9d7", animation: "rocket 1.1s cubic-bezier(.32,1.52,.53,1.04) both"}} />
        </div>
      )}
      {/* Main form card */}
      <div className="col-12 col-md-8 col-lg-5 d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh', zIndex: 2, position: 'relative' }}>
        <div className="card border-0 shadow-lg p-4 w-100" style={glassDarkStyle}>
          <div className="text-center mb-4">
            <img src={logoUrl} alt="Logo" style={{ height: '100px', borderRadius: '50%', boxShadow: '0 4px 16px #dbeafe' }} />
            <h2 className="mt-3 fw-bold" style={{
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #6366f1, #06b6d4, #43e97b, #fa8bff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Poppins, Arial, sans-serif'
            }}>
              {isLogin ? 'Login' : 'Create Account'}
            </h2>
            <p className="mb-0" style={{color: "#a5b4fc", fontWeight:500, letterSpacing:1, minHeight: 26}}>
              {typedWelcome}
            </p>
          </div>
          {isLogin && cooldownUntil && cooldownUntil > Date.now() && (
            <div className="mb-3 text-danger fw-bold text-center">
              Too many failed attempts. Please wait {cooldownLeft} seconds before trying again.
            </div>
          )}
          {!showReset ? (
            <form onSubmit={handleSubmit} autoComplete="off">
              {floatingLabel(
                "Username",
                <FaUser />,
                {
                  type: "text",
                  name: "username",
                  value: form.username,
                  onChange: handleChange,
                  autoComplete: "username",
                  placeholder: "",
                  disabled: isLoading || (isLogin && cooldownUntil && cooldownUntil > Date.now()),
                  onFocus: () => setFocusedField("Username"),
                  onBlur: () => setFocusedField(null)
                },
                focusedField === "Username",
                form.username,
                null,
                inputValid.username
              )}
              {floatingLabel(
                "Password",
                <FaLock />,
                {
                  type: showPassword ? "text" : "password",
                  name: "password",
                  value: form.password,
                  onChange: handleChange,
                  autoComplete: isLogin ? "current-password" : "new-password",
                  placeholder: "",
                  disabled: isLoading || (isLogin && cooldownUntil && cooldownUntil > Date.now()),
                  onFocus: () => { setShowPasswordReq(true); setFocusedField("Password"); },
                  onBlur: () => setFocusedField(null)
                },
                focusedField === "Password",
                form.password,
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  tabIndex={-1}
                  style={{ fontSize: 18, padding: 2 }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>,
                inputValid.password
              )}
              {!isLogin && showPasswordReq && (
                <div className="mt-2 mb-2">
                  <div className="progress mb-2" style={{ height: 8 }}>
                    <div
                      className={`progress-bar ${passwordStrength(form.password) === 4 ? 'bg-success' : passwordStrength(form.password) >= 2 ? 'bg-warning' : 'bg-danger'}`}
                      role="progressbar"
                      style={{ width: `${(passwordStrength(form.password) / 4) * 100}%` }}
                      aria-valuenow={passwordStrength(form.password)}
                      aria-valuemax="4"
                    />
                  </div>
                  <ul className="text-start small mb-0">
                    {passwordRequirements.map(({ req, test }, idx) => (
                      <li key={idx} style={{ color: test(form.password) ? 'green' : 'red' }}>
                        {test(form.password) ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isLogin && (
                <div className="mb-3 text-end">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => { setShowReset('request'); setResetUsername(''); setResetMsg(''); }}
                    disabled={isLoading || (isLogin && cooldownUntil && cooldownUntil > Date.now())}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {error && <div className="mb-3 text-danger fw-bold text-center">{error}</div>}
              {success && <div className="mb-3 text-success fw-bold text-center">{success}</div>}
              <div className="d-grid">
                <button
                  type="submit"
                  className={`btn px-4 py-2 fs-5 rounded-3 shadow-sm ${successMorph ? 'success-morph d-flex justify-content-center align-items-center' : ''}`}
                  style={{
                    background: successMorph ? undefined : 'linear-gradient(90deg, #6366f1 10%, #43e97b 90%)',
                    color: '#fff',
                    border: 'none',
                    position: 'relative',
                    transition: 'all .32s cubic-bezier(.63,2,.53,1)'
                  }}
                  disabled={isLoading || successMorph || (isLogin && cooldownUntil && cooldownUntil > Date.now())}
                >
                  {successMorph
                    ? <FaCheckCircle color="#fff" size={34} />
                    : isLoading
                    ? (<>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Please wait...
                      </>)
                    : (isLogin
                      ? <><FaUnlockAlt className="me-2" />Login</>
                      : <><FaCheckCircle className="me-2" />Create Account</>
                    )
                  }
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={showReset === 'request' ? handleForgotPassword : handleResetPassword}>
              {floatingLabel(
                "Username",
                <FaUser />,
                {
                  type: "text",
                  value: resetUsername,
                  onChange: e => setResetUsername(e.target.value),
                  autoComplete: "username",
                  placeholder: "",
                  disabled: showReset === 'reset' || isLoading,
                  onFocus: () => setFocusedField("ResetUsername"),
                  onBlur: () => setFocusedField(null)
                },
                focusedField === "ResetUsername",
                resetUsername
              )}
              {showReset === 'reset' && floatingLabel(
                "New Password",
                <FaLock />,
                {
                  type: showResetPassword ? "text" : "password",
                  value: resetPassword,
                  onChange: e => setResetPassword(e.target.value),
                  autoComplete: "new-password",
                  placeholder: "",
                  disabled: isLoading,
                  onFocus: () => setFocusedField("ResetPassword"),
                  onBlur: () => setFocusedField(null)
                },
                focusedField === "ResetPassword",
                resetPassword,
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  tabIndex={-1}
                  style={{ fontSize: 18, padding: 2 }}
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showResetPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              )}
              {showReset === 'reset' && (
                <div className="mt-2">
                  <div className="progress mb-2" style={{ height: 8 }}>
                    <div
                      className={`progress-bar ${passwordStrength(resetPassword) === 4 ? 'bg-success' : passwordStrength(resetPassword) >= 2 ? 'bg-warning' : 'bg-danger'}`}
                      role="progressbar"
                      style={{ width: `${(passwordStrength(resetPassword) / 4) * 100}%` }}
                      aria-valuenow={passwordStrength(resetPassword)}
                      aria-valuemax="4"
                    />
                  </div>
                  <ul className="text-start small mb-0">
                    {passwordRequirements.map(({ req, test }, idx) => (
                      <li key={idx} style={{ color: test(resetPassword) ? 'green' : 'red' }}>
                        {test(resetPassword) ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resetMsg && <div className={`mb-3 fw-bold text-center ${resetMsg.includes('success') ? 'text-success' : 'text-danger'}`}>{resetMsg}</div>}
              <div className="d-grid">
                <button
                  type="submit"
                  className="btn px-4 py-2 fs-5 rounded-3 shadow-sm"
                  style={{
                    background: 'linear-gradient(90deg, #43e97b, #38f9d7 70%)',
                    color: '#fff',
                    border: 'none'
                  }}
                  disabled={isLoading}
                  // FIX: Removed the onClick handler that was simulating the backend call
                  // The onSubmit handler on the form will now correctly call handleForgotPassword or handleResetPassword
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : showReset === 'request' ? 'Send Reset Link' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  className="btn btn-link mt-2"
                  disabled={isLoading}
                  onClick={() => {
                    setShowReset(false);
                    clearUserFields();
                    setResetMsg('');
                    setIsLogin(true);
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
          {!showReset && (
            <div className="mt-3 text-center">
              {isLogin ? (
                <span>
                  Don't have an account?{' '}
                  <button className="btn btn-link text-primary fw-bold text-decoration-none p-0" onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
                    Create Account
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button className="btn btn-link text-primary fw-bold text-decoration-none p-0" onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
                    Login
                  </button>
                </span>
              )}
            </div>
          )}
          <div className="mt-4 text-center text-secondary" style={{ fontSize: '0.95rem' }}>
            <span>
              Need help? <a href="mailto:support@veta.go.tz" className="text-primary">Contact Support</a>
            </span>
          </div>
          <div className="text-center mt-2" style={{opacity: 0.93, fontSize: 13}} aptitude="register-footer-text">
            <span className="text-muted">VETA | &copy; {new Date().getFullYear()} | All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;
