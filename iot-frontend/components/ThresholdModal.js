'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ThresholdModal({ device, onClose, onThresholdsSet }) {
  const [thresholds, setThresholds] = useState({
    tempMin: '', tempMax: '', humidityMin: '', humidityMax: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (device && device.thresholds) {
      setThresholds({
        tempMin: device.thresholds.tempMin ?? '',
        tempMax: device.thresholds.tempMax ?? '',
        humidityMin: device.thresholds.humidityMin ?? '',
        humidityMax: device.thresholds.humidityMax ?? '',
      });
    }
  }, [device]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setThresholds(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('iot_token');
      const res = await fetch('/api/iot/setThresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId: device.id, thresholds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Thresholds saved successfully!');
      onThresholdsSet(data);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Set Alert Thresholds</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Temperature (°C)</label>
            <input type="number" name="tempMin" value={thresholds.tempMin} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Temperature (°C)</label>
            <input type="number" name="tempMax" value={thresholds.tempMax} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Humidity (%)</label>
            <input type="number" name="humidityMin" value={thresholds.humidityMin} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Humidity (%)</label>
            <input type="number" name="humidityMax" value={thresholds.humidityMax} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., 70" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}