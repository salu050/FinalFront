// src/components/AdmissionLetter.jsx
import React from 'react';
import moment from 'moment'; // Import moment for date formatting

// Function to generate a random alphanumeric ID
const generateRandomId = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// You can add more complex styling here
const letterStyles = {
  fontFamily: 'Arial, sans-serif',
  padding: '40px',
  maxWidth: '800px',
  margin: '20px auto',
  border: '1px solid #ddd',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  backgroundColor: '#fff',
  lineHeight: '1.6',
};

const headerStyles = {
  textAlign: 'center',
  marginBottom: '30px',
  color: '#0056b3',
};

const salutationStyles = {
  marginBottom: '20px',
};

const paragraphStyles = {
  marginBottom: '15px',
};

const highlightStyles = {
  fontWeight: 'bold',
  color: '#0056b3',
};

const signatureStyles = {
  marginTop: '50px',
  borderTop: '1px solid #ccc',
  paddingTop: '10px',
  fontSize: '0.9em',
  color: '#555',
};

const footerStyles = {
  marginTop: '30px',
  textAlign: 'center',
  fontSize: '0.8em',
  color: '#777',
};

const AdmissionLetter = React.forwardRef(({ studentData }, ref) => {
  // Destructure with default values for safety
  const {
    fullName = "Valued Applicant",
    assignedCenter = "VETA Center", // Use adminSelectedCenter
    assignedCourseName = "Vocational Program", // Use adminSelectedCourseId name
    admissionStartDate = moment().format('LL'), // Default to current date if not provided
    admissionEndDate = moment().add(1, 'months').format('LL'), // Default to 1 month from now
    contactEmail = "admissions@veta.go.tz",
    contactPhone = "+255 123 456 789",
    letterId = generateRandomId(), // Generate random ID if not provided
  } = studentData || {}; // Ensure studentData is not null/undefined

  // Helper to get course name (copy from ApplicationStatus for consistency)
  const getCourseNameById = (courseId) => {
    const courses = [
      { id: 1, name: 'Welding and Fabrication' }, { id: 2, name: 'Electrical Installation' },
      { id: 3, name: 'Carpentry and Joinery' }, { id: 4, name: 'Plumbing' },
      { id: 5, name: 'Tailoring and Dressmaking' }, { id: 6, name: 'Automotive Mechanics' },
      { id: 7, name: 'ICT' }, { id: 8, name: 'Hotel Management' },
    ];
    return courses.find(c => c.id === courseId)?.name || `Course ID ${courseId}`;
  };

  return (
    <div ref={ref} style={letterStyles}>
      <h1 style={headerStyles}>Official Admission Letter</h1>
      <p style={{textAlign: 'right', fontSize: '0.85em', color: '#666'}}>
        Date: {moment().format('LL')} <br />
        Letter ID: <span style={highlightStyles}>{letterId}</span>
      </p>

      <p style={salutationStyles}>Dear <span style={highlightStyles}>{fullName}</span>,</p>

      <p style={paragraphStyles}>
        It is with immense pleasure and excitement that we officially welcome you to the Vocational Education and Training Authority (VETA)! Your dedication and potential truly shone through your application, and we are delighted to offer you admission to the prestigious{" "}
        <span style={highlightStyles}>{assignedCourseName}</span> program at our esteemed{" "}
        <span style={highlightStyles}>{assignedCenter}</span>.
      </p>

      <p style={paragraphStyles}>
        This is a pivotal moment in your journey, marking the beginning of a transformative experience. At VETA, we are committed to providing you with hands-on, industry-relevant skills and knowledge that will empower you to achieve your career aspirations and contribute significantly to the development of our nation.
      </p>

      <p style={paragraphStyles}>
        Your admission is confirmed, and we eagerly await your presence. The official admission period for your program is from{" "}
        <span style={highlightStyles}>{moment(admissionStartDate).format('LL')}</span> to{" "}
        <span style={highlightStyles}>{moment(admissionEndDate).format('LL')}</span>. Please ensure you complete all necessary registration procedures within this period to secure your place.
      </p>

      <p style={paragraphStyles}>
        This letter serves as your official proof of admission. Kindly keep it safe and be prepared to present it upon your first arrival at the VETA {assignedCenter} for registration and orientation. Further details regarding orientation schedules, necessary documents, and campus life will be communicated to you via your registered email address soon.
      </p>

      <p style={paragraphStyles}>
        Should you have any queries or require further clarification before your arrival, our admissions team is here to assist you. Please feel free to reach out to us at <span style={highlightStyles}>{contactEmail}</span> or <span style={highlightStyles}>{contactPhone}</span>.
      </p>

      <p style={paragraphStyles}>
        We are incredibly proud to have you join the VETA family and look forward to witnessing your growth and success. Prepare for an enriching and rewarding experience!
      </p>

      <div style={signatureStyles}>
        <p>Warmest regards,</p>
        <p>The Admissions Committee</p>
        <p>Vocational Education and Training Authority (VETA)</p>
        <p>{assignedCenter}</p>
      </div>

      <div style={footerStyles}>
        <p>This is an automatically generated admission letter. No signature is required.</p>
        <p>VETA - Empowering Skills for a Brighter Future</p>
      </div>
    </div>
  );
});

export default AdmissionLetter;