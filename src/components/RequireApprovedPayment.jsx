import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

// Checks approval using new backend endpoint!
export default function RequireApprovedPayment({ children }) {
  const [checking, setChecking] = useState(true);
  const [canApply, setCanApply] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setCanApply(false);
      setChecking(false);
      return;
    }
    fetch(`http://localhost:8080/api/users/${user.id}/can-apply`)
      .then(res => res.ok ? res.json() : { canApply: false })
      .then(data => {
        setCanApply(data.canApply);
        setChecking(false);
      })
      .catch(() => {
        setCanApply(false);
        setChecking(false);
      });
  }, []);

  if (checking) return <div className="p-5 text-center">Checking payment approval...</div>;
  if (!canApply) return <Navigate to="/payment" replace />;
  return children;
}