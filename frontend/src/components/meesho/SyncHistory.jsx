import React from 'react';
import { History, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export default function SyncHistory({ logs }) {
  const getBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="badge bg-success text-white py-1 px-2 fs-9">Success</span>;
      case 'warning':
        return <span className="badge bg-warning text-dark py-1 px-2 fs-9">Warning</span>;
      case 'failed':
        return <span className="badge bg-danger text-white py-1 px-2 fs-9">Failed</span>;
      default:
        return <span className="badge bg-info text-dark py-1 px-2 fs-9">Info</span>;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="card-header bg-white border-bottom p-4">
        <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
          <History size={20} className="text-secondary" /> Synchronization & Audit Logs
        </h5>
        <p className="text-secondary fs-8 mb-0">
          Real-time activity logs for catalog imports, price fluctuations, order placements, and tracking updates.
        </p>
      </div>

      <div className="card-body p-0 table-responsive">
        {logs.length === 0 ? (
          <div className="text-center py-4 text-muted fs-8">
            No synchronization events recorded yet.
          </div>
        ) : (
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary fs-9 text-uppercase">
              <tr>
                <th className="ps-4">Timestamp</th>
                <th>Action Type</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="ps-4 fs-9 text-muted" style={{ width: 180 }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="fs-9 fw-semibold text-dark text-capitalize">
                    {log.action_type?.replace('_', ' ')}
                  </td>
                  <td>{getBadge(log.status)}</td>
                  <td className="fs-8 text-secondary">
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
