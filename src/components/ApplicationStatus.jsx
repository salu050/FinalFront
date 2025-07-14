import React, { useEffect, useState } from "react";

function ApplicationStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get user from localStorage
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }
  // Support both 'id' and 'userId'
  const userId = user?.id || user?.userId;

  useEffect(() => {
    if (!userId) {
      setError("You must be logged in to view your application status.");
      setLoading(false);
      return;
    }
    fetch(`http://localhost:8080/api/applications/user/${userId}/status`)
      .then((res) => {
        if (res.status === 404) throw new Error("No application found for this user.");
        if (!res.ok) throw new Error("Failed to fetch status.");
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ color: "red", padding: "2rem", textAlign: "center" }}>{error}</div>;
  if (!status)
    return <div style={{ padding: "2rem", textAlign: "center" }}>No application status available.</div>;

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", padding: 20, border: "1px solid #eee", borderRadius: 8 }}>
      <h2 style={{ textAlign: "center" }}>Application Status</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold", padding: "8px" }}>Status:</td>
            <td style={{ padding: "8px" }}>{status.application_status || "N/A"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: "8px" }}>Center:</td>
            <td style={{ padding: "8px" }}>{status.center || "N/A"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: "8px" }}>Selected Course:</td>
            <td style={{ padding: "8px" }}>{status.selected_course_name || "N/A"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: "8px" }}>Submission Date:</td>
            <td style={{ padding: "8px" }}>{status.submission_date || "N/A"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: "8px" }}>Last Updated:</td>
            <td style={{ padding: "8px" }}>{status.last_updated || "N/A"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ApplicationStatus;