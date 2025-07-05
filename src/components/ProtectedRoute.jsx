import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [canProceed, setCanProceed] = React.useState(null);

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      setCanProceed(false);
      return;
    }
    fetch(`http://localhost:8080/api/payments/user/${user.id}/latest`)
      .then(res => res.ok ? res.json() : null)
      .then(payment => setCanProceed(payment && payment.status === 'APPROVED'))
      .catch(() => setCanProceed(false));
  }, []);

  if (canProceed === null) return <div>Loading...</div>;
  if (!canProceed) return <Navigate to="/payment" replace />;
  return children;
};

export default ProtectedRoute;