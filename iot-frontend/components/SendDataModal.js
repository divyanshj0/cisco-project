'use client';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function SendDataModal({ deviceId, onClose }) {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (temperature === '' || humidity === '') {
      return toast.error('Both temperature and humidity are required.');
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('iot_token');
      const res = await fetch('/api/iot/sendData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId, temperature, humidity }),
      });
       if (res.status === 404) {
        toast.error('Session expired. Please log in again.');
        localStorage.clear();
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send data');
      }

      toast.success(`Data sent successfully!`);
      onClose(true); // Pass true to signal a refresh is needed
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Send Data Manually</h2>
          <button onClick={() => onClose(false)}><FiX /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Temperature (°C)*</label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g., 23.5"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Humidity (%)*</label>
            <input
              type="number"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              placeholder="e.g., 45.2"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={() => onClose(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSend} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300">
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}