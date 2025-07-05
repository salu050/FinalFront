import React from 'react';

function PaymentsTable({ payments, loadingPayments, handleApprovePayment, handleRejectPayment }) {
  return (
    <div className="card shadow-sm p-4 mb-5">
      <h4 className="mb-3">Payments & Status</h4>
      {loadingPayments ? (
        <div className="text-center py-4">Loading payments...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Payment ID</th>
                <th>User ID</th>
                <th>Username</th>
                <th>Control Number</th>
                <th>Status</th>
                <th>Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">No payments found.</td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.user?.id || '-'}</td>
                    <td>
                      <span className="fw-semibold">{payment.user?.username || '-'}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary fs-6">{payment.controlNumber || '-'}</span>
                    </td>
                    <td>
                      {payment.status === 'APPROVED'
                        ? <span className="badge bg-success">Approved</span>
                        : payment.status === 'REJECTED'
                          ? <span className="badge bg-danger">Rejected</span>
                          : <span className="badge bg-warning text-dark">Pending</span>
                      }
                    </td>
                    <td>
                      <span className="fw-bold">{typeof payment.amount === 'number' ? payment.amount.toLocaleString() : '-'}</span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={payment.status === 'APPROVED'}
                          aria-label={`Approve payment ${payment.id}`}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={payment.status === 'REJECTED'}
                          aria-label={`Reject payment ${payment.id}`}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PaymentsTable;