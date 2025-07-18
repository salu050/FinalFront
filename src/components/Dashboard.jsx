import React, { useState, useEffect } from 'react';

const getAvatar = (username) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;

const Dashboard = ({ onNavigateToPayment, onNavigateToApplication, onNavigateToProfile, profileUpdated, userDetails }) => {
  const profileImageUrl = userDetails ? getAvatar(userDetails.username) : "https://placehold.co/100x100/6366f1/ffffff?text=P";
  const hasPaid = userDetails?.hasPaidApplicationFee;
  const username = userDetails?.username || 'Student';
  const hasSubmittedApplication = !!userDetails?.applicationDetails;

  const announcements = [
    { id: 1, text: "Welcome to the new academic year! Classes begin on Sept 1st, 2025.", date: "2025-08-15" },
    { id: 2, text: "Application deadline for Fall 2026 extended to July 31st, 2025.", date: "2025-07-20" },
    { id: 3, text: "Financial aid application window is now open. Apply by August 10th, 2025.", date: "2025-07-10" },
    { id: 4, text: "Orientation for new students will be held on August 25th, 2025. Don't miss it!", date: "2025-07-05" },
  ];

  const availableCourses = [
    { id: 1, name: 'Welding and Fabrication', description: 'Master the art and science of joining metals using various welding techniques. This course prepares you for high-demand roles in construction, manufacturing, and repair industries.' },
    { id: 2, name: 'Electrical Installation', description: 'Learn to design, install, and maintain electrical systems in residential, commercial, and industrial settings. Gain practical skills essential for a career as a certified electrician.' },
    { id: 3, name: 'Carpentry and Joinery', description: 'Develop expertise in woodworking, from basic hand tools to advanced machinery. Construct and repair building frameworks, furniture, and other wooden structures with precision and skill.' },
    { id: 4, name: 'Plumbing', description: 'Acquire the knowledge and practical skills for installing, repairing, and maintaining piping systems for water, gas, and sanitation. Essential for healthy and functional living and working environments.' },
    { id: 5, name: 'Tailoring and Dressmaking', description: 'Unleash your creativity and learn the techniques of garment construction, pattern making, and fashion design. From basic alterations to creating custom apparel, this course covers it all.' },
    { id: 6, name: 'Automotive Mechanics', description: 'Get hands-on training in diagnosing, repairing, and maintaining various types of vehicles. This course covers engine systems, brakes, transmission, and modern automotive technology.' },
    { id: 7, name: 'ICT', description: 'Dive into the world of Information and Communication Technology. Learn about computer hardware, software, networking, and digital literacy crucial for any modern profession.' },
    { id: 8, name: 'Hotel Management', description: 'Prepare for a dynamic career in the hospitality industry. This program covers front office operations, food and beverage management, housekeeping, and customer service excellence.' },
  ];

  // Training Centers with descriptions and addresses
  const trainingCenters = [
    { name: "VETA Mkokotoni", description: "Located on the northern coast of Unguja, offering marine and fishing-related vocational courses.", address: "Mkokotoni, North Unguja" },
    { name: "VETA Wete", description: "Situated in Pemba, this center focuses on agricultural and technical skills vital for the island's economy.", address: "Wete, North Pemba" },
    { name: "VETA Chake Chake", description: "A key training hub in central Pemba, specializing in carpentry, masonry, and basic engineering trades.", address: "Chake Chake, Central Pemba" },
    { name: "VETA Makunduchi", description: "Found in the southern part of Unguja, known for its programs in hospitality and traditional crafts.", address: "Makunduchi, South Unguja" },
    { name: "VETA Zanzibar Town", description: "The largest center, located in the heart of Zanzibar City, providing diverse courses from ICT to business management.", address: "Stone Town, Zanzibar City" },
    { name: "VETA Kibondeni", description: "A specialized center offering advanced courses in electrical and mechanical engineering trades.", address: "Kibondeni, Urban West Unguja" },
    { name: "VETA Kivunge", description: "Situated in a rural setting, this center emphasizes practical skills for rural development and entrepreneurship.", address: "Kivunge, North Unguja" },
    { name: "VETA Mwanakwerekwe", description: "Focuses on modern vocational skills including computer applications, tailoring, and automotive repair.", address: "Mwanakwerekwe, Urban West Unguja" },
    { name: "VETA Mkoani", description: "Located in Pemba, providing training in various technical and vocational fields to support regional growth.", address: "Mkoani, South Pemba" }
  ];

  const upcomingEvents = [
    { id: 1, title: "Mid-term Exams Begin", date: "2025-10-20", time: "9:00 AM", location: "Online" },
    { id: 2, title: "Course Registration for Spring 2026", date: "2025-11-01", time: "All Day", location: "Student Portal" },
    { id: 3, title: "Winter Break Starts", date: "2025-12-15", time: "5:00 PM", location: "Campus Wide" },
    { id: 4, title: "Career Fair", date: "2025-09-05", time: "10:00 AM", location: "Main Campus Hall" },
    { id: 5, title: "Guest Lecture: Entrepreneurship", date: "2025-08-28", time: "2:00 PM", location: "Auditorium A" },
  ];

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // State for tab navigation

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeCustomAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

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

    const googleFontLink = document.createElement('link');
    googleFontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    googleFontLink.rel = 'stylesheet';
    document.head.appendChild(googleFontLink);

    const id = "dashboard-modern-style";
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        body {
          background-color: #f0f2f5;
          font-family: 'Inter', sans-serif;
          color: #333;
        }
        .dashboard-header {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          padding: 40px 0;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .dashboard-header .avatar {
          border: 4px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.1);
        }
        .welcome-text {
          font-size: 2.5rem;
          font-weight: 700;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
          margin-bottom: 10px;
        }
        .dashboard-container {
          padding-bottom: 50px; /* Add padding to the bottom */
        }
        .dashboard-card-section {
          margin-top: -60px;
        }
        .card {
          border-radius: 15px;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          background-color: #ffffff;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
          border: none;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .card-title {
          color: #333;
          font-weight: 600;
          margin-bottom: 15px;
          font-size: 1.3rem;
        }
        .card-text {
          color: #666;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .btn {
          border-radius: 8px;
          font-weight: 500;
          padding: 10px 20px;
          transition: all 0.2s ease-in-out;
          font-size: 1rem;
        }
        .btn-primary {
          background-color: #6366f1;
          border-color: #6366f1;
        }
        .btn-primary:hover {
          background-color: #5b5ee1;
          border-color: #5b5ee1;
          transform: translateY(-1px);
        }
        .btn-success {
          background-color: #10b981;
          border-color: #10b981;
        }
        .btn-success:hover {
          background-color: #0e9f6e;
          border-color: #0e9f6e;
          transform: translateY(-1px);
        }
        .btn-info {
          background-color: #0ea5e9;
          border-color: #0ea5e9;
          color: white;
        }
        .btn-info:hover {
          background-color: #0284c7;
          border-color: #0284c7;
          transform: translateY(-1px);
        }
        .btn-warning {
          background-color: #f59e0b;
          border-color: #f59e0b;
          color: white;
        }
        .btn-warning:hover {
          background-color: #d97706;
          border-color: #d97706;
          transform: translateY(-1px);
        }
        .btn-danger {
          background-color: #ef4444;
          border-color: #ef4444;
        }
        .btn-danger:hover {
          background-color: #dc2626;
          border-color: #dc2626;
          transform: translateY(-1px);
        }
        .btn-dark {
          background-color: #1f2937;
          border-color: #1f2937;
        }
        .btn-dark:hover {
          background-color: #111827;
          border-color: #111827;
          transform: translateY(-1px);
        }
        .alert-info-custom {
          background-color: #e0f2fe;
          color: #0288d1;
          border: 1px solid #90caf9;
          border-radius: 10px;
          padding: 15px;
          font-size: 0.95rem;
        }
        .alert-warning-custom {
          background-color: #fff3e0;
          color: #f57c00;
          border: 1px solid #ffb74d;
          border-radius: 10px;
          padding: 15px;
          font-size: 0.95rem;
        }
        .alert-success-custom {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          border-radius: 10px;
          padding: 15px;
          font-size: 0.95rem;
        }
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
        .custom-modal-content {
          background-color: #fff;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          max-width: 450px;
          width: 90%;
          text-align: center;
          transform: translateY(-20px);
          opacity: 0;
          animation: modal-fade-in 0.3s forwards;
        }
        @keyframes modal-fade-in {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .custom-modal-content h3 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 20px;
        }
        .custom-modal-content p {
          font-size: 1.1rem;
          color: #555;
          margin-bottom: 30px;
        }
        .custom-modal-content .btn {
          padding: 12px 30px;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .section-header {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 30px;
          border-left: 6px solid #6366f1;
          padding-left: 20px;
          text-align: left;
          position: relative;
          display: flex;
          align-items: center;
        }
        .section-header i {
          margin-right: 15px;
          color: #6366f1;
          font-size: 1.8rem;
        }
        .section-header::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -10px;
          width: 80px;
          height: 4px;
          background-color: #a855f7;
          border-radius: 2px;
        }
        .list-group-item {
          border: none;
          margin-bottom: 10px;
          border-radius: 10px;
          background-color: #fefefe;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: all 0.2s ease-in-out;
        }
        .list-group-item:hover {
          background-color: #e9efff;
          transform: translateX(5px);
        }
        .list-group-item p {
          margin-bottom: 5px;
          font-weight: 500;
        }
        .list-group-item small {
          color: #888;
        }
        .course-item, .event-item, .resource-item {
          background-color: #f8f9fa;
          border-left: 5px solid #6366f1;
          transition: all 0.2s ease-in-out;
          border-radius: 8px;
        }
        .course-item:hover, .event-item:hover, .resource-item:hover {
          border-left-color: #a855f7;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        .nav-pills .nav-link {
          border-radius: 10px;
          padding: 12px 25px;
          font-weight: 600;
          color: #6366f1;
          transition: all 0.3s ease;
          background-color: #eef2ff;
          margin-right: 10px;
        }
        .nav-pills .nav-link.active {
          background: linear-gradient(45deg, #6366f1 0%, #a855f7 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .nav-pills .nav-link:not(.active):hover {
            background-color: #d1d5db;
            color: #4b5563;
        }
        .tab-content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        }
        .feature-card {
            background: linear-gradient(to right, #fdfdff, #f0f2f5);
            border: 1px solid #e0e7ff;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
            cursor: pointer; /* Add cursor pointer for interactive cards */
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border-color: #a855f7;
        }
        .feature-card .icon {
            font-size: 3rem;
            color: #6366f1;
            margin-bottom: 15px;
        }
        .feature-card h5 {
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
        }
        .feature-card p {
            color: #555;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        .center-list-item {
            background-color: #eef2ff;
            border-left: 4px solid #6366f1;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            font-weight: 500;
            color: #1f2937;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .center-list-item:hover {
            background-color: #e0e7ff;
            border-left-color: #a855f7;
        }
        .center-list-item button {
            margin-left: 10px;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      document.head.removeChild(bootstrapLink);
      document.head.removeChild(fontAwesomeLink);
      document.head.removeChild(googleFontLink);
      if (document.getElementById(id)) {
        document.head.removeChild(document.getElementById(id));
      }
    };
  }, []);

  useEffect(() => {
    if (profileUpdated) {
      showCustomAlert("Profile updated successfully!");
    }
  }, [profileUpdated]);

  return (
    <div className="dashboard-container">
      {showAlert && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <h3 className="mb-3"><i className="fas fa-bell me-2"></i>Notification</h3>
            <p className="mb-4">{alertMessage}</p>
            <button
              onClick={closeCustomAlert}
              className="btn btn-primary"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-header text-center position-relative">
        <div className="container">
          <img src={profileImageUrl} alt="Profile" className="avatar rounded-circle mb-3" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
          <h1 className="welcome-text">Welcome, {username}!</h1>
          <p className="lead" style={{ fontSize: '1.2rem', opacity: 0.9 }}>Student Dashboard for ZVTCCS.</p>
          {userDetails?.role === 'STUDENT' && !hasPaid && (
            <div className="alert alert-info-custom mt-4 mx-auto" style={{ maxWidth: '450px' }}>
              <i className="fas fa-exclamation-circle me-2"></i>
              Payment for application fee is pending. Please complete it to proceed.
            </div>
          )}
          {userDetails?.role === 'STUDENT' && hasPaid && !hasSubmittedApplication && (
            <div className="alert alert-warning-custom mt-4 mx-auto" style={{ maxWidth: '450px' }}>
              <i className="fas fa-info-circle me-2"></i>
              Your payment is approved! You can now fill out your application form.
            </div>
          )}
          {userDetails?.role === 'STUDENT' && hasSubmittedApplication && (
            <div className="alert alert-success-custom mt-4 mx-auto" style={{ maxWidth: '450px' }}>
              <i className="fas fa-check-circle me-2"></i>
              Your application has been submitted successfully!
            </div>
          )}
        </div>
      </div>

      <div className="container dashboard-card-section">
        {/* Tab Navigation */}
        <ul className="nav nav-pills mb-4 justify-content-center" id="pills-tab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              type="button"
              role="tab"
            >
              <i className="fas fa-home me-2"></i>Overview
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
              type="button"
              role="tab"
            >
              <i className="fas fa-book-reader me-2"></i>Courses & Centers
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
              type="button"
              role="tab"
            >
              <i className="fas fa-bell me-2"></i>Announcements & Events
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content" id="pills-tabContent">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-pane fade show active" role="tabpanel">
              <div className="row g-4 mb-5">
                <div className="col-md-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body text-center d-flex flex-column justify-content-between">
                      <div>
                        <h5 className="card-title"><i className="fas fa-file-alt me-2 text-primary"></i>Application Form</h5>
                        <p className="card-text">Start or continue your application for admission.</p>
                      </div>
                      <div>
                        <button
                          onClick={onNavigateToApplication}
                          className="btn btn-primary w-100"
                          disabled={!hasPaid || hasSubmittedApplication}
                        >
                          {hasSubmittedApplication ? 'Application Submitted' : 'Fill Application Form'}
                        </button>
                        {!hasPaid && (
                          <div className="mt-2 text-danger small">
                            Complete payment to proceed.
                          </div>
                        )}
                        {hasSubmittedApplication && (
                          <div className="mt-2 text-success small">
                            Your application is submitted.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body text-center d-flex flex-column justify-content-between">
                      <div>
                        <h5 className="card-title"><i className="fas fa-credit-card me-2 text-success"></i>Make a Payment</h5>
                        <p className="card-text">Pay your application or course fees securely.</p>
                      </div>
                      <button
                        onClick={onNavigateToPayment}
                        className="btn btn-success w-100"
                        disabled={hasPaid && hasSubmittedApplication}
                      >
                        Go to Payment
                      </button>
                      {hasPaid && hasSubmittedApplication && (
                          <div className="mt-2 text-success small">
                            Payment completed and application submitted.
                          </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body text-center d-flex flex-column justify-content-between">
                      <div>
                        <h5 className="card-title"><i className="fas fa-user-circle me-2 text-info"></i>My Profile</h5>
                        <p className="card-text">View or update your personal information.</p>
                      </div>
                      <button onClick={onNavigateToProfile} className="btn btn-info w-100">View Profile</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Features Section */}
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="feature-card" onClick={() => setActiveTab('courses')}>
                    <div className="icon"><i className="fas fa-book-open"></i></div>
                    <h5>Course Explorer</h5>
                    <p>Dive deep into our vocational programs and find your passion.</p>
                    {/* Removed button, card is now clickable */}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="feature-card" onClick={() => setActiveTab('notifications')}>
                    <div className="icon"><i className="fas fa-calendar-check"></i></div>
                    <h5>Academic Calendar</h5>
                    <p>Stay updated on key dates, holidays, and deadlines.</p>
                    {/* Removed button, card is now clickable */}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="feature-card" onClick={() => showCustomAlert("Access learning materials, tutorials, and success guides to boost your studies!")}>
                    <div className="icon"><i className="fas fa-laptop-code"></i></div>
                    <h5>Learning Resources</h5>
                    <p>Access study materials, tutorials, and academic tools.</p>
                    {/* Removed button, card is now clickable */}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="feature-card" onClick={() => showCustomAlert("Got questions? Find quick answers in our FAQ, or reach out to our dedicated support team!")}>
                    <div className="icon"><i className="fas fa-headset"></i></div>
                    <h5>Student Support</h5>
                    <p>Get quick answers, contact help, or browse FAQs.</p>
                    {/* Removed button, card is now clickable */}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="feature-card" onClick={() => showCustomAlert("Discover career opportunities and get guidance for your future after graduation!")}>
                    <div className="icon"><i className="fas fa-briefcase"></i></div>
                    <h5>Career Services</h5>
                    <p>Explore job opportunities and career development tips.</p>
                    {/* Removed button, card is now clickable */}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="feature-card" onClick={() => showCustomAlert("Connect with fellow students, join study groups, and participate in campus activities!")}>
                    <div className="icon"><i className="fas fa-users"></i></div>
                    <h5>Community Hub</h5>
                    <p>Engage with peers and explore student clubs and events.</p>
                    {/* Removed button, card is now clickable */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses & Centers Tab */}
          {activeTab === 'courses' && (
            <div className="tab-pane fade show active" role="tabpanel">
              <section className="mb-5">
                <h2 className="section-header"><i className="fas fa-graduation-cap"></i>Available Courses</h2>
                <div className="row g-3">
                  {availableCourses.length > 0 ? (
                    availableCourses.map((course) => (
                      <div key={course.id} className="col-md-6 col-lg-4">
                        <div className="card shadow-sm course-item h-100">
                          <div className="card-body">
                            <h5 className="card-title text-primary"><i className="fas fa-certificate me-2"></i>{course.name}</h5>
                            <p className="card-text">{course.description.substring(0, 70)}...</p>
                            <button
                              onClick={() => showCustomAlert(`${course.name}: ${course.description}`)}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Learn More
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-4">No courses available at this time.</p>
                  )}
                </div>
              </section>

              <section className="mt-5">
                <h2 className="section-header"><i className="fas fa-map-marker-alt"></i>Training Centers</h2>
                <div className="row g-3">
                  {trainingCenters.length > 0 ? (
                    trainingCenters.map((center, index) => (
                      <div key={index} className="col-md-6 col-lg-4">
                        <div className="center-list-item shadow-sm">
                          <div>
                            <i className="fas fa-building me-2 text-purple"></i>{center.name}
                          </div>
                          <button
                            onClick={() => showCustomAlert(`${center.name}: ${center.description}\nAddress: ${center.address}`)}
                            className="btn btn-sm btn-outline-info"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-4">No training centers listed at the moment.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Announcements & Events Tab */}
          {activeTab === 'notifications' && (
            <div className="tab-pane fade show active" role="tabpanel">
              <section className="mb-5">
                <h2 className="section-header"><i className="fas fa-bullhorn"></i>Latest Announcements</h2>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  {announcements.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {announcements.map((announcement) => (
                        <li key={announcement.id} className="list-group-item d-flex align-items-start py-3">
                          <i className="fas fa-bell me-3 mt-1 text-primary"></i>
                          <div>
                            <p className="mb-1 fw-bold">{announcement.text}</p>
                            <small className="text-muted">
                              <i className="fas fa-calendar-alt me-1"></i>
                              {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center py-4">No new announcements at the moment.</p>
                  )}
                </div>
              </section>

              <section className="mt-5">
                <h2 className="section-header"><i className="fas fa-calendar-check"></i>Upcoming Events</h2>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  {upcomingEvents.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {upcomingEvents.map((event) => (
                        <li key={event.id} className="list-group-item d-flex align-items-start py-3">
                          <i className="fas fa-clock me-3 mt-1 text-warning"></i>
                          <div>
                            <h5 className="mb-1 fw-bold">{event.title}</h5>
                            <small className="text-muted">
                              <i className="fas fa-calendar-day me-1"></i>
                              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              <span className="mx-2">•</span>
                              <i className="fas fa-clock me-1"></i>{event.time}
                              <span className="mx-2">•</span>
                              <i className="fas fa-map-marker-alt me-1"></i>{event.location}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center py-4">No upcoming events scheduled.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-5 py-4 border-top">
        <p className="text-muted">Thank you for using ZVTCCS. If you need help, contact support.</p>
      </div>
    </div>
  );
};

export default Dashboard;