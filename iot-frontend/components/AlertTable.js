'use client';
import { toast } from 'react-toastify';

export default function AlertsTable({ alerts, onMarkAsSeen }) {
  const handleMarkSeen = async (alertId) => {
    try {
      const token = localStorage.getItem('iot_token');
      const res = await fetch('/api/iot/markAlertSeen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, alertId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Alert marked as seen.');
      onMarkAsSeen(alertId);
    } catch (err) {
      toast.error(err.message);
    }
  };
  
  if (alerts.length === 0) {
    return <p className="text-center text-gray-500 py-4">No new alerts.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {alerts.map(alert => (
            <tr key={alert.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(alert.createdAt).toLocaleString()}</td>
              <td className="px-6 py-4">{alert.description}</td>
              <td className="px-6 py-4">
                <button onClick={() => handleMarkSeen(alert.id)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                  Mark as Seen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}