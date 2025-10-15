'use client';
import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function UpdateDeviceModal({ device, onClose, onDeviceUpdated }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (device) {
      setName(device.name);
      setLocation(device.location);
    }
  }, [device]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      return toast.error('Device name is required.');
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('iot_token');
      const res = await fetch('/api/iot/updateDevice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId: device.id, name, location }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update device');
      }

      toast.success(`Device "${name}" updated successfully!`);
      onDeviceUpdated(data); // Pass updated device data back
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Update Device</h2>
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
          <button onClick={handleUpdate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300">
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}