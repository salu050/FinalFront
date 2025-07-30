import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/axiosConfig.jsx'; // Import the configured axios instance
import { FaCheckCircle, FaTimesCircle, FaRegSmileBeam, FaSpinner, FaInfoCircle, FaClipboard, FaChartLine, FaBell, FaUpload, FaCalendarAlt, FaTimes, FaDownload } from 'react-icons/fa'; // Added FaDownload icon
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Recharts imports

// For LLM integration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=";
const API_KEY = "AIzaSyDSmIJbi6mu-ycXsn7qJam8BhhPN7rx_3o"; // Canvas will inject the API key at runtime

// Helper function for exponential backoff
const exponentialBackoffFetch = async (url, options, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && response.status === 429 && retries > 0) { // Too Many Requests
      console.warn(`Rate limit hit, retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      return exponentialBackoffFetch(url, options, retries - 1, delay * 2);
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0 && (error.message.includes('Failed to fetch') || error.message.includes('Network Error'))) {
      console.warn(`Network error, retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      return exponentialBackoffFetch(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

const ApplicationStatus = ({ userDetails, onSubmitDetails = () => {} }) => {
  const [applicationDetails, setApplicationDetails] = useState(userDetails?.applicationDetails || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showChart, setShowChart] = useState(true); // Default to showing chart for modern feel
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const chatBodyRef = useRef(null); // Ref for chat scroll

  // Sample data for the chart (hypothetical, replace with real data if available)
  const chartData = [
    { name: 'Jan', Submitted: 400, Reviewed: 240, Selected: 200, Rejected: 50 },
    { name: 'Feb', Submitted: 300, Reviewed: 139, Selected: 180, Rejected: 30 },
    { name: 'Mar', Submitted: 200, Reviewed: 980, Selected: 250, Rejected: 20 },
    { name: 'Apr', Submitted: 278, Reviewed: 390, Selected: 290, Rejected: 40 },
    { name: 'May', Submitted: 189, Reviewed: 480, Selected: 190, Rejected: 10 },
    { name: 'Jun', Submitted: 239, Reviewed: 380, Selected: 240, Rejected: 25 },
    { name: 'Jul', Submitted: 349, Reviewed: 430, Selected: 300, Rejected: 35 },
  ];

  // Dynamic CSS Injection for Bootstrap and custom styles
  useEffect(() => {
    const bootstrapLink = document.createElement('link');
    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
    bootstrapLink.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapLink);

    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
    fontAwesomeLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontAwesomeLink);

    const id = "application-status-style";
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        body {
          background-color: #f0f2f5; /* Light gray background */
          font-family: 'Poppins', sans-serif;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .status-container {
          background: linear-gradient(135deg, #eef5ff 0%, #dceaff 100%);
          min-height: 100vh;
          padding: 40px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .container-fluid {
          max-width: 1200px; /* Wider container */
          padding: 0 20px;
        }
        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;
          color: #333;
        }
        .dashboard-header h1 {
          font-size: 2.8rem;
          font-weight: 700;
          color: #2c3e50;
          position: relative;
          display: inline-block;
          margin-bottom: 10px;
        }
        .dashboard-header h1::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -5px;
          transform: translateX(-50%);
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          border-radius: 2px;
        }
        .dashboard-header p {
          font-size: 1.1rem;
          color: #555;
        }
        .card {
          background-color: #ffffff;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); /* Softer, deeper shadow */
          margin-bottom: 30px;
          transition: all 0.3s ease-in-out;
          border: none; /* Remove default bootstrap border */
          overflow: hidden;
          animation: fadeIn 0.8s ease-out forwards; /* Fade in cards */
          opacity: 0;
        }
        .card:nth-child(1) { animation-delay: 0.1s; }
        .card:nth-child(2) { animation-delay: 0.2s; }
        .card:nth-child(3) { animation-delay: 0.3s; }
        /* ... add more delays if needed for other cards */
        .card-header {
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          color: white;
          padding: 20px 25px;
          font-size: 1.6rem;
          font-weight: 600;
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .card-body {
          padding: 25px;
        }
        .status-overview {
          display: flex;
          justify-content: space-around;
          padding: 20px 0;
          background-color: #fbfdff;
          border-bottom: 1px solid #e9f0f8;
        }
        .status-item {
          text-align: center;
          color: #6c757d;
          font-size: 0.95rem;
          font-weight: 500;
          position: relative;
          padding: 0 10px;
          flex: 1; /* Distribute space evenly */
        }
        .status-item .icon {
          font-size: 2.8rem; /* Larger icons */
          margin-bottom: 12px;
          color: #dbe4ee; /* Lighter default icon color */
          transition: color 0.4s ease-in-out, transform 0.3s ease;
        }
        .status-item.active .icon {
          color: #6366f1; /* Active color */
          transform: scale(1.1); /* Pop animation for active icon */
        }
        .status-item .label {
          color: #8892a0;
          transition: color 0.4s ease-in-out;
        }
        .status-item.active .label {
          color: #333;
          font-weight: 600;
        }
        /* Timeline / Progress Bar */
        .timeline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          margin-bottom: 40px;
          position: relative;
          padding: 0 20px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #e0e7ff;
          transform: translateY(-50%);
          z-index: 0;
        }
        .timeline-progress {
          position: absolute;
          top: 50%;
          left: 0;
          height: 4px;
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          transform: translateY(-50%);
          z-index: 1;
          width: 0; /* Animated width */
          transition: width 1s ease-out;
        }
        .timeline-item {
          text-align: center;
          position: relative;
          z-index: 2;
          flex: 1;
        }
        .timeline-dot {
          width: 20px;
          height: 20px;
          background-color: #e0e7ff;
          border: 3px solid #e0e7ff;
          border-radius: 50%;
          margin: 0 auto 10px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          transition: all 0.5s ease;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .timeline-item.completed .timeline-dot {
          background-color: #4caf50;
          border-color: #4caf50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
        }
        .timeline-item.active .timeline-dot {
          background-color: #6366f1;
          border-color: #6366f1;
          box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.4);
          transform: scale(1.2);
        }
        .timeline-label {
          font-size: 0.9rem;
          color: #777;
          font-weight: 500;
        }
        /* Alert Box */
        .alert-modern {
          padding: 20px 25px;
          border-radius: 10px;
          margin-bottom: 30px;
          display: flex;
          align-items: flex-start;
          font-size: 1.05rem;
          line-height: 1.6;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }
        .alert-modern.info {
          background-color: #e3f2fd;
          border-left: 5px solid #2196f3;
          color: #0d47a1;
        }
        .alert-modern.success {
          background-color: #e8f5e9;
          border-left: 5px solid #4caf50;
          color: #1b5e20;
        }
        .alert-modern.warning {
          background-color: #fff3e0;
          border-left: 5px solid #ff9800;
          color: #e65100;
        }
        .alert-modern.danger {
          background-color: #ffebee;
          border-left: 5px solid #f44336;
          color: #b71c1c;
        }
        .alert-modern .icon {
          font-size: 1.8rem;
          margin-right: 15px;
          align-self: center;
        }
        .alert-modern p {
          margin-bottom: 0;
        }
        .detail-item {
          padding: 12px 0;
          border-bottom: 1px dashed #e0e7ff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #495057;
          font-size: 0.95rem;
          transition: background-color 0.2s ease;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .detail-item strong {
          color: #343a40;
          font-weight: 500;
          flex-basis: 40%;
        }
        .detail-item span {
          text-align: right;
          flex-basis: 58%;
          color: #666;
        }
        .chart-container {
          height: 350px; /* Fixed height for chart */
          width: 100%;
          margin-top: 20px;
          background-color: #fbfdff;
          border-radius: 10px;
          padding: 15px;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.03);
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
          animation-delay: 0.4s;
        }
        .chart-container .recharts-surface {
          outline: none; /* Remove focus outline */
        }
        .btn-toggle-details, .btn-toggle-chart {
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s ease-in-out;
        }
        .btn-toggle-details:hover, .btn-toggle-chart:hover {
          transform: scale(1.1);
        }
        .btn-toggle-details i, .btn-toggle-chart i {
          margin-left: 8px;
        }
        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .action-buttons .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .action-buttons .btn-primary {
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          border: none;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
        }
        .action-buttons .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }
        .action-buttons .btn-outline-secondary {
          border-color: #ced4da;
          color: #6c757d;
        }
        .action-buttons .btn-outline-secondary:hover {
          background-color: #f8f9fa;
          color: #495057;
        }
        .chat-widget {
          position: fixed;
          bottom: 25px;
          right: 25px;
          width: 380px; /* Slightly wider */
          height: 500px; /* Slightly taller */
          background-color: #fff;
          border-radius: 20px; /* More rounded */
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25); /* Deeper shadow */
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
          transform: scale(0.9); /* More pronounced initial scale */
          opacity: 0;
          animation: scaleInFadeIn 0.4s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Springy animation */
        }
        .chat-widget .chat-header {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          padding: 18px 25px;
          font-size: 1.3rem;
        }
        .chat-widget .chat-header button {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        .chat-widget .chat-header button:hover {
          opacity: 1;
        }
        .chat-body {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: #fcfdff; /* Lighter chat background */
          border-bottom: 1px solid #f0f2f5;
          display: flex;
          flex-direction: column;
          gap: 10px; /* Space between messages */
        }
        .chat-message {
          max-width: 85%; /* Slightly wider messages */
          padding: 12px 18px; /* More padding */
          border-radius: 20px; /* More rounded */
          word-wrap: break-word;
          font-size: 0.95rem;
          line-height: 1.5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* Subtle message shadow */
          animation: messagePop 0.3s forwards ease-out;
        }
        .chat-message.user {
          align-self: flex-end;
          background-color: #e0eaff; /* User message color */
          color: #333;
          border-bottom-right-radius: 8px; /* Less rounded on one corner */
        }
        .chat-message.model {
          align-self: flex-start;
          background-color: #f5f8fb; /* Model message color */
          color: #333;
          border-bottom-left-radius: 8px;
        }
        .chat-message.loading {
          font-style: italic;
          color: #777;
        }
        .chat-input-area {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          display: flex;
          align-items: center;
          background-color: #fff;
        }
        .chat-input-area input {
          flex-grow: 1;
          border: 1px solid #e0e7ff;
          border-radius: 25px; /* More rounded input */
          padding: 10px 18px;
          margin-right: 10px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }
        .chat-input-area input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }
        .chat-input-area button {
          border-radius: 25px;
          padding: 10px 20px;
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          border: none;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
          transition: transform 0.2s ease;
        }
        .chat-input-area button:hover {
          transform: translateY(-1px);
        }
        .chat-toggle-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 65px; /* Slightly larger */
          height: 65px;
          font-size: 2rem; /* Larger icon */
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          cursor: pointer;
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .chat-toggle-btn:hover {
          transform: scale(1.1) rotate(5deg); /* More dynamic hover */
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .copy-message {
          bottom: 110px; /* Above the larger chat toggle button */
          right: 30px;
          background-color: rgba(0, 0, 0, 0.8);
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 0.9rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        /* Keyframe Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleInFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes messagePop {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Responsive adjustments */
        @media (max-width: 992px) {
          .dashboard-header h1 {
            font-size: 2.2rem;
          }
          .status-overview {
            flex-wrap: wrap;
          }
          .status-item {
            flex-basis: 50%;
            margin-bottom: 20px;
          }
          .timeline {
            flex-wrap: wrap;
            justify-content: center;
          }
          .timeline-item {
            flex-basis: 50%;
            margin-bottom: 20px;
          }
          .timeline::before, .timeline-progress {
            display: none; /* Hide line for smaller screens */
          }
        }
        @media (max-width: 768px) {
          .status-container {
            padding: 20px 0;
          }
          .container-fluid {
            padding: 0 15px;
          }
          .dashboard-header h1 {
            font-size: 1.8rem;
          }
          .dashboard-header p {
            font-size: 1rem;
          }
          .card-header {
            font-size: 1.3rem;
            padding: 15px 20px;
          }
          .card-body {
            padding: 20px;
          }
          .status-item .icon {
            font-size: 2.2rem;
          }
          .alert-modern {
            font-size: 0.95rem;
            padding: 15px 20px;
          }
          .alert-modern .icon {
            font-size: 1.5rem;
            margin-right: 10px;
          }
          .detail-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-item strong, .detail-item span {
            text-align: left;
            width: 100%;
            flex-basis: auto;
          }
          .action-buttons {
            flex-direction: column;
            gap: 10px;
          }
          .chat-widget {
            width: 95%;
            height: 80vh;
            bottom: 15px;
            right: 2.5%;
            left: 2.5%;
            border-radius: 15px;
          }
          .chat-toggle-btn {
            width: 55px;
            height: 55px;
            font-size: 1.6rem;
            bottom: 15px;
            right: 15px;
          }
          .copy-message {
            bottom: 85px;
            right: 15px;
          }
          .chat-input-area input {
            padding: 8px 15px;
          }
          .chat-input-area button {
            padding: 8px 15px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const head = document.head;
      if (bootstrapLink.parentNode === head) head.removeChild(bootstrapLink);
      if (fontAwesomeLink.parentNode === head) head.removeChild(fontAwesomeLink);
      const existingStyle = document.getElementById(id);
      if (existingStyle && existingStyle.parentNode === head) head.removeChild(existingStyle);
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory, showChat]); // Only scroll when chatHistory updates or chat is shown/hidden

  // Memoized function to fetch application details
  const fetchApplicationDetails = useCallback(async () => {
    if (!userDetails || !userDetails.id) {
      if (isLoading) setIsLoading(false);
      setError('User details not available. Please log in.');
      return;
    }

    if (applicationDetails === null && !error) {
      setIsLoading(true);
    }
    setError('');
    try {
      const response = await axios.get(`/applications/user/${userDetails.id}`);
      const data = response.data;

      setApplicationDetails(prevData => {
        if (JSON.stringify(prevData) === JSON.stringify(data)) {
          return prevData;
        }
        return data;
      });

      if (onSubmitDetails && typeof onSubmitDetails === 'function' && JSON.stringify(userDetails.applicationDetails) !== JSON.stringify(data)) {
        onSubmitDetails({ ...userDetails, applicationDetails: data });
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
      if (err.response && err.response.status === 404) {
        setError('You have not submitted an application form yet.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load application status.');
      }
      setApplicationDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [userDetails?.id, onSubmitDetails, applicationDetails, error]);

  // Effect to fetch initial data and set up polling
  useEffect(() => {
    fetchApplicationDetails();
    const intervalId = setInterval(fetchApplicationDetails, 10000);
    return () => clearInterval(intervalId);
  }, [fetchApplicationDetails]);

  // Function to send message to LLM
  const sendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    let initialChatPrompt = [];
    if (chatHistory.length === 0) {
      let context = `You are a helpful and friendly assistant for VETA (Vocational Education and Training Authority) application status.
        The user's full name is ${userDetails?.fullName || userDetails?.username || 'Applicant'}. `;

      if (applicationDetails) {
        context += `Their application ID is ${applicationDetails.id || 'N/A'},
          current status is ${applicationDetails.applicationStatus || 'N/A'}.
          They preferred center ${applicationDetails.selectedCenter || 'N/A'}.
          If their application is SELECTED, their assigned center is ${applicationDetails.adminSelectedCenter || 'N/A'}
          and assigned course ID is ${applicationDetails.adminSelectedCourseId || 'N/A'}.
          Their submitted date was ${applicationDetails.createdAt ? new Date(applicationDetails.createdAt).toLocaleString() : 'N/A'}.
          Their last update was ${applicationDetails.updatedAt ? new Date(applicationDetails.updatedAt).toLocaleString() : 'N/A'}.
        `;
      } else {
        context += `They have not submitted an application yet. If they ask about their application, inform them they need to apply first.`;
      }

      // Add chart data to context if user asks about trends or specific chart data
      const chartDataString = JSON.stringify(chartData.map(d => ({
        month: d.name,
        submitted: d.Submitted,
        reviewed: d.Reviewed,
        selected: d.Selected,
        rejected: d.Rejected
      })));
      context += `\n\nHere is a list of historical application data by month: ${chartDataString}.
        Use this data to answer questions about application trends, numbers, or performance.
        For example, if asked about "submitted applications in March", refer to this data.`;
      context += `\n\nAnswer questions related to their application status, general VETA procedures, or analyze the provided application trend data.
        Keep answers concise, professional, and helpful. If you don't have enough information to answer a question, politely say so.`;
      initialChatPrompt.push({ role: "user", parts: [{ text: context }] });
      initialChatPrompt.push({ role: "model", parts: [{ text: `Hello ${userDetails?.fullName || userDetails?.username || 'Applicant'}! I'm your VETA Application Assistant. How can I help you today? Feel free to ask about your application status or even about the application trends shown in the chart!` }] });
    }

    const newUserMessage = { role: "user", parts: [{ text: chatInput }] };
    const updatedChatHistory = [...initialChatPrompt, ...chatHistory, newUserMessage];
    setChatHistory(updatedChatHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const payload = { contents: updatedChatHistory };
      const response = await exponentialBackoffFetch(GEMINI_API_URL + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const modelResponseText = result.candidates[0].content.parts[0].text;
        setChatHistory(prev => [...prev, { role: "model", parts: [{ text: modelResponseText }] }]);
      } else {
        setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "Sorry, I couldn't get a response. Please try again." }] }]);
        console.error("Unexpected LLM response structure:", result);
      }
    } catch (err) {
      console.error("Error calling LLM:", err);
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "There was an error communicating with the AI. Please try again later." }] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyDetails = () => {
    if (!applicationDetails) return;

    const detailsText = `
      Application ID: ${applicationDetails.id || 'N/A'}
      Full Name: ${applicationDetails.fullName || 'N/A'}
      Preferred Center: ${applicationDetails.selectedCenter || 'N/A'}
      Admin Selected Center: ${applicationDetails.adminSelectedCenter || 'N/A'}
      Admin Selected Course ID: ${applicationDetails.adminSelectedCourseId || 'N/A'}
      Application Status: ${applicationDetails.applicationStatus || 'N/A'}
      Submitted on: ${applicationDetails.createdAt ? new Date(applicationDetails.createdAt).toLocaleString() : 'N/A'}
      Last Updated: ${applicationDetails.updatedAt ? new Date(applicationDetails.updatedAt).toLocaleString() : 'N/A'}
    `;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(detailsText.trim()).then(() => {
        setCopyMessage('Details copied!');
        setTimeout(() => setCopyMessage(''), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        setCopyMessage('Failed to copy details. Try manually.');
        setTimeout(() => setCopyMessage(''), 3000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = detailsText.trim();
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyMessage('Details copied (fallback)!');
        setTimeout(() => setCopyMessage(''), 2000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
        setCopyMessage('Failed to copy details. Try manually.');
        setTimeout(() => setCopyMessage(''), 3000);
      }
      document.body.removeChild(textArea);
    }
  };

  // New function to handle admission letter download
  const handleDownloadAdmission = () => {
    if (!applicationDetails || applicationDetails.applicationStatus !== 'SELECTED') {
      alert('Admission letter is only available for selected applicants.');
      return;
    }

    // Generate a random reference number
    const generateReferenceNumber = () => {
      const prefix = 'VETA-ADM-';
      const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 random alphanumeric characters
      const timestamp = Date.now().toString().substring(7); // Last few digits of timestamp
      return `${prefix}${randomPart}-${timestamp}`;
    };

    const referenceNumber = generateReferenceNumber();

    // --- Start of hypothetical admission letter generation/download logic ---
    // In a real application, you would likely:
    // 1. Make an API call to your backend to generate and serve the PDF.
    //    Example: axios.get(`/admissions/download/${applicationDetails.id}`, { responseType: 'blob' })
    //             .then(response => {
    //                 const url = window.URL.createObjectURL(new Blob([response.data]));
    //                 const link = document.createElement('a');
    //                 link.href = url;
    //                 link.setAttribute('download', `VETA_Admission_Letter_${applicationDetails.id}.pdf`);
    //                 document.body.appendChild(link);
    //                 link.click();
    //                 link.remove();
    //             }).catch(error => {
    //                 console.error('Error downloading admission letter:', error);
    //                 alert('Failed to download admission letter. Please try again.');
    //             });
    // 2. Or, if you want to generate on the client-side, use a library like jsPDF.
    //    Example (using jsPDF, install via `npm install jspdf`):
    //    import jsPDF from 'jspdf';
    //    const doc = new jsPDF();
    //    doc.text(`VETA Admission Letter`, 10, 10);
    //    doc.text(`Applicant Name: ${applicationDetails.fullName}`, 10, 20);
    //    doc.text(`Assigned Center: ${applicationDetails.adminSelectedCenter}`, 10, 30);
    //    doc.text(`Assigned Course: ${([
    //                  { id: 1, name: 'Welding and Fabrication' }, { id: 2, name: 'Electrical Installation' },
    //                  { id: 3, name: 'Carpentry and Joinery' }, { id: 4, name: 'Plumbing' },
    //                  { id: 5, name: 'Tailoring and Dressmaking' }, { id: 6, name: 'Automotive Mechanics' },
    //                  { id: 7, name: 'ICT' }, { id: 8, name: 'Hotel Management' },
    //                ]).find(c => c.id === applicationDetails.adminSelectedCourseId)?.name || `Course ${applicationDetails.adminSelectedCourseId}`}`, 10, 40);
    //    doc.save(`VETA_Admission_Letter_${applicationDetails.id}.pdf`);
    // --- End of hypothetical admission letter generation/download logic ---

    // For demonstration, let's simulate the download by opening a new window
    // with a "mock" admission letter content.
    const admissionContent = `
      <html>
      <head>
          <title>VETA Admission Letter - ${applicationDetails.fullName}</title>
          <style>
              body { font-family: 'Arial', sans-serif; margin: 40px; line-height: 1.6; color: #333; }
              h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
              h2 { color: #34495e; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
              p { margin-bottom: 10px; }
              .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .details-table td { padding: 8px; border: 1px solid #ddd; }
              .details-table td:first-child { font-weight: bold; width: 30%; background-color: #f9f9f9; }
              .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #777; }
              .reference-number { text-align: right; font-size: 0.9em; color: #555; margin-bottom: 10px; }
          </style>
      </head>
      <body>
          <h1>VETA Admission Letter</h1>
          <div class="reference-number">Reference Number: <strong>${referenceNumber}</strong></div>
          <p>Dear ${applicationDetails.fullName},</p>
          <p>We are delighted to inform you that your application for admission to Vocational Education and Training Authority (VETA) has been successful!</p>

          <h2>Your Admission Details:</h2>
          <table class="details-table">
              <tr>
                  <td>Application ID:</td>
                  <td>${applicationDetails.id || 'N/A'}</td>
              </tr>
              <tr>
                  <td>Full Name:</td>
                  <td>${applicationDetails.fullName || 'N/A'}</td>
              </tr>
              <tr>
                  <td>Assigned Center:</td>
                  <td>${applicationDetails.adminSelectedCenter || 'N/A'}</td>
              </tr>
              <tr>
                  <td>Assigned Course:</td>
                  <td>${
                    ([
                      { id: 1, name: 'Welding and Fabrication' }, { id: 2, name: 'Electrical Installation' },
                      { id: 3, name: 'Carpentry and Joinery' }, { id: 4, name: 'Plumbing' },
                      { id: 5, name: 'Tailoring and Dressmaking' }, { id: 6, name: 'Automotive Mechanics' },
                      { id: 7, name: 'ICT' }, { id: 8, name: 'Hotel Management' },
                    ]).find(c => c.id === applicationDetails.adminSelectedCourseId)?.name || `Course ${applicationDetails.adminSelectedCourseId}`
                  }</td>
              </tr>
              <tr>
                  <td>Admission Date:</td>
                  <td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
          </table>

          <p style="margin-top: 30px;">
              Please be prepared to report to your assigned center on the specified enrollment date (to be communicated separately via email) with all necessary documents.
              We look forward to welcoming you to VETA and supporting you in achieving your career aspirations.
          </p>
          <p>For any queries, please do not hesitate to contact the admissions office.</p>

          <div class="footer">
              <p>Sincerely,</p>
              <p>The Admissions Team</p>
              <p>Vocational Education and Training Authority (VETA)</p>
          </div>
      </body>
      </html>
    `;

    const newWindow = window.open();
    newWindow.document.write(admissionContent);
    newWindow.document.close(); // Close the document to ensure all content is loaded
    newWindow.print(); // Optional: trigger print dialog
  };


  if (isLoading) {
    return (
      <div className="status-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <FaSpinner className="fa-spin fa-3x text-primary" />
          <p className="mt-3 text-secondary">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container d-flex align-items-center justify-content-center">
        <div className="alert alert-danger text-center alert-modern danger">
          <FaTimesCircle className="icon" />
          <div>
            <p className="mb-1"><strong>Error:</strong> {error}</p>
            {error === 'You have not submitted an application form yet.' && (
              <p className="mb-0">Please navigate to the Application Form section to apply and start your journey with VETA!</p>
            )}
            {error !== 'You have not submitted an application form yet.' && (
              <p className="mb-0">A problem occurred while loading your status. Please ensure you are logged in correctly or contact our support for assistance.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = applicationDetails?.applicationStatus || 'NOT_SUBMITTED';

  const statusIcons = [
    { label: 'Submitted', icon: 'fas fa-file-alt', status: 'SUBMITTED', tooltip: 'Your application has been received.' },
    { label: 'Under Review', icon: 'fas fa-hourglass-half', status: 'UNDER_REVIEW', tooltip: 'Our team is currently evaluating your application.' },
    { label: 'Selected', icon: 'fas fa-graduation-cap', status: 'SELECTED', tooltip: 'Congratulations! You have been selected.' },
    { label: 'Rejected', icon: 'fas fa-exclamation-circle', status: 'REJECTED', tooltip: 'Your application was not successful at this time.' },
  ];

  // Map application status to timeline steps
  const timelineSteps = [
    { id: 1, label: 'Application Submitted', status: 'SUBMITTED' },
    { id: 2, label: 'Documents Verified', status: 'DOCS_VERIFIED' }, // Hypothetical step
    { id: 3, label: 'Interview Scheduled', status: 'INTERVIEW_SCHEDULED' }, // Hypothetical step
    { id: 4, label: 'Final Review', status: 'UNDER_REVIEW' }, // Maps to 'UNDER_REVIEW'
    { id: 5, label: 'Decision Made', status: ['SELECTED', 'REJECTED'] }, // Final decision
  ];

  const currentTimelineIndex = timelineSteps.findIndex(step => {
    if (Array.isArray(step.status)) {
      return step.status.includes(currentStatus);
    }
    return step.status === currentStatus;
  });

  const getTimelineProgressWidth = () => {
    if (currentTimelineIndex === -1) return '0%';
    const progress = (currentTimelineIndex / (timelineSteps.length - 1)) * 100;
    return `${progress}%`;
  };

  const getAlertMessage = () => {
    switch (currentStatus) {
      case 'SELECTED':
        return {
          type: 'success',
          icon: <FaCheckCircle className="icon" />,
          title: 'Congratulations!',
          message: `Your dedication has paid off! Welcome to a new and exciting chapter of learning and growth at the prestigious ${applicationDetails?.adminSelectedCenter || 'your assigned center'}! This is where your dreams will take flight, where innovation thrives, and where your future truly begins. Please check your email for further instructions regarding enrollment and orientation. Your path to excellence starts now!`
,
          action: { label: 'View Enrollment Guide', icon: <FaInfoCircle />, link: '#' } // Placeholder
        };
      case 'SUBMITTED':
        return {
          type: 'info',
          icon: <FaInfoCircle className="icon" />,
          title: 'Application Received!',
          message: 'Your application has been successfully submitted and is now awaiting initial review. We will notify you once your documents have been verified.',
          action: { label: 'Upload Missing Documents', icon: <FaUpload />, link: '#' } // Placeholder
        };
      case 'UNDER_REVIEW':
        return {
          type: 'warning',
          icon: <FaInfoCircle className="icon" />,
          title: 'Under Review',
          message: 'Your application is currently being thoroughly reviewed by our admissions committee. We appreciate your patience as we carefully assess all submissions.',
          action: { label: 'Check Interview Status', icon: <FaCalendarAlt />, link: '#' } // Placeholder
        };
      case 'REJECTED':
        return {
          type: 'danger',
          icon: <FaTimesCircle className="icon" />,
          title: 'Application Unsuccessful',
          message: 'We regret to inform you that your application was not successful at this time. Please contact our admissions office for feedback or consider reapplying next cycle.',
          action: { label: 'Contact Admissions', icon: <FaBell />, link: '#' } // Placeholder
        };
      default:
        return {
          type: 'info',
          icon: <FaInfoCircle className="icon" />,
          title: 'No Application Found',
          message: 'It appears you have not submitted an application yet. Please proceed to the Application Form section to begin your application process.',
        };
    }
  };

  const alertContent = getAlertMessage();

  return (
    <div className="status-container">
      <div className="container-fluid">
        <header className="dashboard-header">
          <h1>Welcome, {userDetails?.fullName || userDetails?.username || 'Applicant'}!</h1>
          <p>Your journey with VETA starts here. Track your application status and explore trends.</p>
        </header>

        {/* Alert/Notification Card */}
        <div className={`card alert-modern ${alertContent.type}`}>
          {alertContent.icon}
          <div>
            <p className="mb-2"><strong>{alertContent.title}</strong></p>
            <p className="mb-0">{alertContent.message}</p>
            {alertContent.action && (
              <div className="mt-3">
                <button className="btn btn-sm btn-outline-secondary">
                  {alertContent.action.icon} {alertContent.action.label}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Application Status & Timeline */}
        <div className="card">
          <div className="card-header">
            Application Progress
          </div>
          <div className="card-body">
            <div className="status-overview">
              {statusIcons.map((item, index) => (
                <div key={item.status} className={`status-item ${currentStatus === item.status ? 'active' : ''}`}>
                  <i className={item.icon + ' icon'} title={item.tooltip}></i>
                  <div className="label">{item.label}</div>
                </div>
              ))}
            </div>

            <h6 className="text-center mt-4 mb-3 text-muted">Your Application Journey</h6>
            <div className="timeline">
              <div className="timeline-progress" style={{ width: getTimelineProgressWidth() }}></div>
              {timelineSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`timeline-item
                    ${index <= currentTimelineIndex ? 'completed' : ''}
                    ${index === currentTimelineIndex ? 'active' : ''}
                  `}
                >
                  <div className="timeline-dot">
                    {index < currentTimelineIndex && <FaCheckCircle />}
                    {index === currentTimelineIndex && <FaRegSmileBeam />}
                  </div>
                  <div className="timeline-label">{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Application Details Section */}
        {applicationDetails && (
          <div className="card">
            <div className="card-header">
              Detailed Information
              <button className="btn-toggle-details" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? 'Hide' : 'Show'} Details <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'}`}></i>
              </button>
            </div>
            {showDetails && (
              <div className="card-body">
                <ul className="list-unstyled">
                  <li className="detail-item"><strong>Application ID:</strong> <span>{applicationDetails.id || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Full Name:</strong> <span>{applicationDetails.fullName || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Date of Birth:</strong> <span>{applicationDetails.dateOfBirth ? new Date(applicationDetails.dateOfBirth).toLocaleDateString() : 'N/A'}</span></li>
                  <li className="detail-item"><strong>Gender:</strong> <span>{applicationDetails.gender || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Nationality:</strong> <span>{applicationDetails.nationality || 'N/A'}</span></li>
                  <li className="detail-item"><strong>ID Type:</strong> <span>{applicationDetails.idType || 'N/A'}</span></li>
                  <li className="detail-item"><strong>ID Number:</strong> <span>{applicationDetails.idNumber || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Contact Phone:</strong> <span>{applicationDetails.contactPhone || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Contact Email:</strong> <span>{applicationDetails.contactEmail || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Education Level:</strong> <span>{applicationDetails.educationLevel || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Previous School:</strong> <span>{applicationDetails.previousSchool || 'N/A'}</span></li>
                  <li className="detail-item"><strong>Preferred VETA Center:</strong> <span>{applicationDetails.selectedCenter || 'N/A'}</span></li>
                  {applicationDetails.preferredCourses && applicationDetails.preferredCourses.length > 0 && (
                    <li className="detail-item"><strong>Preferred Courses:</strong> <span>{applicationDetails.preferredCourses.map(courseId => {
                      const course = ([
                        { id: 1, name: 'Welding and Fabrication' }, { id: 2, name: 'Electrical Installation' },
                        { id: 3, name: 'Carpentry and Joinery' }, { id: 4, name: 'Plumbing' },
                        { id: 5, name: 'Tailoring and Dressmaking' }, { id: 6, name: 'Automotive Mechanics' },
                        { id: 7, name: 'ICT' }, { id: 8, name: 'Hotel Management' },
                      ]).find(c => c.id === courseId);
                      return course ? course.name : `Course ${courseId}`;
                    }).join(', ')}</span></li>
                  )}
                  {applicationDetails.adminSelectedCenter && (
                    <li className="detail-item"><strong>Assigned Center:</strong> <span>{applicationDetails.adminSelectedCenter}</span></li>
                  )}
                  {applicationDetails.adminSelectedCourseId && (
                    <li className="detail-item"><strong>Assigned Course:</strong> <span>{
                      ([
                        { id: 1, name: 'Welding and Fabrication' }, { id: 2, name: 'Electrical Installation' },
                        { id: 3, name: 'Carpentry and Joinery' }, { id: 4, name: 'Plumbing' },
                        { id: 5, name: 'Tailoring and Dressmaking' }, { id: 6, name: 'Automotive Mechanics' },
                        { id: 7, name: 'ICT' }, { id: 8, name: 'Hotel Management' },
                      ]).find(c => c.id === applicationDetails.adminSelectedCourseId)?.name || `Course ${applicationDetails.adminSelectedCourseId}`
                    }</span></li>
                  )}
                  <li className="detail-item"><strong>Submitted on:</strong> <span>{applicationDetails.createdAt ? new Date(applicationDetails.createdAt).toLocaleString() : 'N/A'}</span></li>
                  <li className="detail-item"><strong>Last Updated:</strong> <span>{applicationDetails.updatedAt ? new Date(applicationDetails.updatedAt).toLocaleString() : 'N/A'}</span></li>
                  <li className="detail-item"><strong>Current Status Code:</strong> <span>{applicationDetails.applicationStatus || 'N/A'}</span></li>
                </ul>
                <div className="action-buttons">
                  {/* Conditional Download Button */}
                  {applicationDetails.applicationStatus === 'SELECTED' && (
                    <button className="btn btn-primary" onClick={handleDownloadAdmission}>
                      <FaDownload className="me-1" /> Download Admission Letter
                    </button>
                  )}
                  <button className="btn btn-outline-secondary" onClick={handleCopyDetails}>
                    <FaClipboard className="me-1" /> Copy All Details
                  </button>
                  {/* Add more context-specific actions here, e.g., if status is REJECTED, "Appeal Decision" */}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Trends Chart Section */}
        <div className="card">
          <div className="card-header">
            Application Trends Overview <FaChartLine className="ms-2" />
            <button className="btn-toggle-chart" onClick={() => setShowChart(!showChart)}>
              {showChart ? 'Hide' : 'Show'} Chart <i className={`fas fa-chevron-${showChart ? 'up' : 'down'}`}></i>
            </button>
          </div>
          {showChart && (
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9f0f8" />
                    <XAxis dataKey="name" stroke="#666" padding={{ left: 30, right: 30 }} />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e7ff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      itemStyle={{ color: '#555' }}
                      formatter={(value) => new Intl.NumberFormat('en').format(value)}
                      cursor={{ stroke: '#99aaff', strokeWidth: 1 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Line type="monotone" dataKey="Submitted" stroke="#8884d8" activeDot={{ r: 6 }} strokeWidth={2} name="Total Submitted" />
                    <Line type="monotone" dataKey="Reviewed" stroke="#82ca9d" activeDot={{ r: 6 }} strokeWidth={2} name="Under Review" />
                    <Line type="monotone" dataKey="Selected" stroke="#28a745" activeDot={{ r: 6 }} strokeWidth={2} name="Selected" />
                    <Line type="monotone" dataKey="Rejected" stroke="#dc3545" activeDot={{ r: 6 }} strokeWidth={2} name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-muted text-center mt-3">
                <small><FaInfoCircle className="me-1" /> This chart shows the hypothetical volume of applications at different stages over recent months.
                Data is illustrative and for trend visualization purposes.</small>
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Chat Toggle Button */}
      <button className="chat-toggle-btn" onClick={() => setShowChat(!showChat)} aria-label="Toggle Chat Widget">
        <FaRegSmileBeam />
      </button>

      {/* Copy Message Popup */}
      {copyMessage && (
        <div className="position-fixed copy-message text-white">
          {copyMessage}
        </div>
      )}

      {/* Chat Widget */}
      {showChat && (
        <div className="chat-widget">
          <div className="card-header chat-header">
            VETA Assistant
            <button onClick={() => setShowChat(false)} aria-label="Close Chat">
              <FaTimes />
            </button>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            {chatHistory.map((msg, index) => (
              // Only render user/model messages, not initial prompt
              msg.role !== 'user' || index === chatHistory.length -1 || chatHistory[index-1]?.role === 'model' ? ( 
                  <div key={index} className={`chat-message ${msg.role} ${isChatLoading && index === chatHistory.length - 1 ? 'loading' : ''}`}>
                      {msg.parts[0].text}
                  </div>
              ) : null
            ))}
            {isChatLoading && (
              <div className="chat-message model loading">
                <FaSpinner className="fa-spin me-2" /> Typing...
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') sendMessage(); }}
              disabled={isChatLoading}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={isChatLoading}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationStatus;