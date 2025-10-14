'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiChevronRight, FiCpu, FiPlus } from 'react-icons/fi';
import CreateDeviceModal from '@/components/CreateDeviceModal';
import Header from '@/components/Header'; // Import the new Header

export default function Dashboard() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDevices = async () => {
    const storedToken = localStorage.getItem('iot_token');
    if (!storedToken) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/iot/getdevices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedToken }),
      });

      if (!res.ok) throw new Error('Failed to fetch devices');

      const data = await res.json();
      setDevices(data.devices || []);
      localStorage.setItem('iot_devices', JSON.stringify(data.devices || []));
    } catch (err) {
      console.error(err);
      toast.error("Could not load devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userName = localStorage.getItem('iot_user');
    setName(userName || 'User');
    fetchDevices();
  }, [router]);

  return (
    <>
      <main className="min-h-screen bg-gray-100">
        <Header name={name} /> {/* Use the Header component */}

        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Devices</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus /> Add Device
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : devices.length === 0 ? (
              <p className="text-gray-500 text-center bg-white p-8 rounded-lg shadow-md">You have no devices yet. Click "Add Device" to get started!</p>
            ) : (
              <div className="space-y-4">
                {devices.map(device => (
                  <div
                    key={device.id}
                    onClick={() => {localStorage.setItem('deviceId',device.id);router.push(`/dashboard/${device.id}`)}}
                    className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:shadow-lg hover:bg-gray-50 transition hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      <FiCpu className="text-2xl text-blue-600" />
                      <div>
                        <p className="font-semibold text-lg text-gray-800">{device.name}</p>
                        <p className="text-sm text-gray-500">{device.location}</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {showCreateModal && (
        <CreateDeviceModal 
          onClose={() => setShowCreateModal(false)}
          onDeviceCreated={(newDevice) => {
            setDevices(prev => [...prev, newDevice]);
            const updatedDevices = [...devices, newDevice];
            localStorage.setItem('iot_devices', JSON.stringify(updatedDevices));
          }}
        />
      )}
    </>
  );
}