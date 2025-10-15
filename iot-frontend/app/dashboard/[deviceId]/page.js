'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Cpu, Plus, Send, LayoutDashboard, ChevronRight, ThermometerSun, Droplets } from 'lucide-react';
import GraphConfigModal from '@/components/GraphConfigModal';
import DeviceGraph from '@/components/DeviceGraph';
import SendDataModal from '@/components/SendDataModal';
import Header from '@/components/Header';
import StatsTable from '@/components/StatsTable'; // Import the new component

export default function DevicePage({ params }) {
  const router = useRouter();
  const [device, setDevice] = useState(null);
  const [latestReadings, setLatestReadings] = useState({ temp: { value: null, ts: null }, humid: { value: null, ts: null } });
  const [graphs, setGraphs] = useState([]);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [deviceId, setdeviceId] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const fetchLatestReadings = async (currentToken) => {
    const deviceId = localStorage.getItem('deviceId');
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

  // fetch statistics
  const fetchStats = async (currentToken) => {
    setStatsLoading(true);
    let startDate, endDate;
    const now = new Date();
    endDate = now.toISOString();

    if (timeRange === '24h') {
      startDate = new Date(now.setDate(now.getDate() - 1)).toISOString();
    } else if (timeRange === '7d') {
      startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
    } else if (timeRange === '30d') {
      startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    } else if (timeRange === 'custom' && customRange.start && customRange.end) {
      startDate = new Date(customRange.start).toISOString();
      endDate = new Date(customRange.end).toISOString();
    } else {
      startDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString();
    }

    try {
      const res = await fetch('/api/iot/getStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, deviceId, startDate, endDate }),
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      toast.error('Could not load statistics.');
      console.error(err);
    } finally {
      setStatsLoading(false);
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
  }, [router]);

  useEffect(() => {
    if (token && deviceId) {
      fetchStats(token);
    }
  }, [token, deviceId, timeRange, customRange]);

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
      <Header name={name} />
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8'>
            <div className="flex items-center gap-2 text-gray-500 ">
              <div className='text-blue-400 hover:text-blue-700 p-2 rounded-full transition-colors bg-blue-100'>
                <LayoutDashboard size={24} />
              </div>
              <button onClick={() => router.push('/dashboard')} className="text-2xl font-semibold hover:cursor-pointer hover:text-gray-700">Dashboard</button>
              <ChevronRight size={20} className='hover:text-gray-800' />
              <div className='text-blue-400 hover:text-blue-700 p-2 rounded-full transition-colors bg-blue-100'>
                <Cpu size={24} />
              </div>
              <h1 className="text-2xl font-semibold  text-gray-800">{device.name} Devices</h1>
            </div>
            <div className='flex justify-end'>
              <button
                onClick={() => setShowDataModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Send /> Send Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className='flex items-center gap-2 text-lg font-semibold'>
                <h2 className=" text-gray-700 mb-2">Current Temperature</h2>
                <ThermometerSun className='w-6 h-6 text-amber-300' />
              </div>
              <p className="text-4xl font-bold text-blue-600">
                {latestReadings.temp?.value !== null ? `${latestReadings.temp?.value}°C` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Last updated: {formatTimestamp(latestReadings.temp?.ts)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className='flex items-center gap-2 text-lg font-semibold'>
                <h2 className=" text-gray-700 mb-2">Current Humidity</h2>
                <Droplets className='w-6 h-6 text-blue-300' />
              </div>
              <p className="text-4xl font-bold text-green-600">
                {latestReadings.humid?.value !== null ? `${latestReadings.humid?.value}%` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Last updated: {formatTimestamp(latestReadings.humid?.ts)}</p>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Statistics</h2>
              <div className="flex items-center gap-2">
                <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                {timeRange === 'custom' && (
                  <div className="flex gap-2 items-center">
                    <input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))} className="p-1 border rounded text-sm" />
                    <input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))} className="p-1 border rounded text-sm" />
                  </div>
                )}
              </div>
            </div>
            <StatsTable stats={stats} loading={statsLoading} />
          </div>


          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Graphical View</h2>
              <button
                onClick={() => setShowGraphModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus /> Add Graph
              </button>

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
                fetchStats(token); // also refresh stats
              }
            }}
          />
        )}
      </main>
    </div>
  );
}