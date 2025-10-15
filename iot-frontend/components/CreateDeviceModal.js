'use client';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function CreateDeviceModal({ onClose, onDeviceCreated }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      return toast.error('Device name is required.');
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('iot_token');
      const res = await fetch('/api/iot/createDevice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, location }),
      });
       if (res.status === 404) {
        toast.error('Session expired. Please log in again.');
        localStorage.clear();
        router.push('/login');
        return;
      }
       if (res.status === 409) {
        toast.error('Device with same name already exist');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create device');
      }

      toast.success(`Device "${name}" created successfully!`);
      onDeviceCreated(data); // Pass new device data back to the dashboard
      onClose();
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
          <h2 className="text-xl font-bold">Create New Device</h2>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Device Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Living Room Sensor"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Floor"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300">
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}