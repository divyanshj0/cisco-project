'use client';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';

export default function GraphConfigModal({ onClose, onSave }) {
  const [graphType, setGraphType] = useState('line');
  const [telemetryKey, setTelemetryKey] = useState('temperature');

  const handleSave = () => {
    onSave({ type: graphType, key: telemetryKey });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Graph</h2>
          <button onClick={onClose}><FiX /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Telemetry Key</label>
            <select
              value={telemetryKey}
              onChange={(e) => setTelemetryKey(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Graph Type</label>
            <select
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
        </div>
      </div>
    </div>
  );
}