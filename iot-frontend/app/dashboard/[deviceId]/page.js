'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiPlus, FiSend, FiArrowLeft } from 'react-icons/fi';
import GraphConfigModal from '@/components/GraphConfigModal';
import DeviceGraph from '@/components/DeviceGraph';
import SendDataModal from '@/components/SendDataModal';
import Header from '@/components/Header'; // Import the new Header

export default function DevicePage({ params }) {
  const router = useRouter();
  const [device, setDevice] = useState(null);
  const [latestReadings, setLatestReadings] = useState({temp: { value: null, ts: null }, humid: { value: null, ts: null },});
  const [graphs, setGraphs] = useState([]);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [deviceId,setdeviceId]=useState(null);

  const fetchLatestReadings = async (currentToken) => {
    const deviceId=localStorage.getItem('deviceId');
    try {
      const res = await fetch(`/api/iot/getReadings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, deviceId: deviceId, limit: 1 }),
      });

      if (!res.ok) throw new Error('Failed to fetch latest readings');
      
      const data = await res.json();
      if (data.readings && data.readings.length > 0) {
        const latest = data.readings[0];
        setLatestReadings({
          temp: { value: latest.temperature, ts: latest.createdAt },
          humid: { value: latest.humidity, ts: latest.createdAt },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load latest readings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('iot_token');
    const userName = localStorage.getItem('iot_user');
    const deviceId = localStorage.getItem('deviceId');

    if (!storedToken) {
      router.push('/login');
      return;
    }
    if (!deviceId) {
      router.push('/dashboard');
      return;
    }
    setToken(storedToken);
    setdeviceId(deviceId);
    setName(userName || 'User');

    const devices = JSON.parse(localStorage.getItem('iot_devices') || '[]');
    const currentDevice = devices.find(d => d.id.toString() === deviceId);

    if (currentDevice) {
      setDevice(currentDevice);
      fetchLatestReadings(storedToken); // Initial fetch
    } else {
      toast.error("Device not found.");
      router.push('/dashboard');
    }
  }, [deviceId, router]);
  
  const addGraph = (config) => {
    setGraphs(prev => [...prev, { ...config, id: Date.now() }]);
  };

  const removeGraph = (graphId) => {
    setGraphs(prev => prev.filter(g => g.id !== graphId));
  }

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('en-GB');
  };

  if (loading || !device) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
        <Header name={name} /> {/* Use the Header component */}

        <main className="p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    {/* Back Button */}
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4"
                    >
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">{device.name}</h1>
                    <p className="text-gray-500">{device.location}</p>
                </div>

                {/* Current Readings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Current Temperature</h2>
                    <p className="text-4xl font-bold text-blue-600">
                    {latestReadings.temp?.value !== null ? `${latestReadings.temp?.value}°C` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Last updated: {formatTimestamp(latestReadings.temp?.ts)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Current Humidity</h2>
                    <p className="text-4xl font-bold text-green-600">
                    {latestReadings.humid?.value !== null ? `${latestReadings.humid?.value}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Last updated: {formatTimestamp(latestReadings.humid?.ts)}</p>
                </div>
                </div>

                {/* Graphs Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Graphical View</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowDataModal(true)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            <FiSend /> Send Data
                        </button>
                        <button
                            onClick={() => setShowGraphModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <FiPlus /> Add Graph
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    {graphs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No graphs configured. Add one to get started!</p>
                    ) : (
                    graphs.map(graph => (
                        <DeviceGraph key={graph.id} config={graph} token={token} deviceId={deviceId} onRemove={() => removeGraph(graph.id)} />
                    ))
                    )}
                </div>
                </div>
            </div>

            {showGraphModal && (
                <GraphConfigModal
                onClose={() => setShowGraphModal(false)}
                onSave={addGraph}
                />
            )}
            {showDataModal && (
                <SendDataModal
                    deviceId={device.id}
                    onClose={(shouldRefresh) => {
                        setShowDataModal(false);
                        if (shouldRefresh) {
                            fetchLatestReadings(token);
                        }
                    }}
                />
            )}
        </main>
    </div>
  );
}