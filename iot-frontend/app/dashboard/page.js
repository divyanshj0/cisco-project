'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Cpu, Trash2, Plus, LayoutDashboard, ChevronRight, Search } from 'lucide-react';
import CreateDeviceModal from '@/components/CreateDeviceModal';
import Header from '@/components/Header';
import DeletePopup from '@/components/deletepopup';

export default function Dashboard() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDevice, setIsDeleteDevice] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('');
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
      if (res.status === 400) {
        toast.error('session expired');
        localStorage.clear();
        router.push('/login');
        return;
      }
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

  const handleDeletedevice = async (deviceId) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('iot_token');
      const res = await fetch('/api/iot/deleteDevice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete device');
        setDeleting(false);
        setIsDeleteDevice(false);
        return;
      }

      toast.success('Device deleted successfully');
      // Refresh the device list to reflect the deletion
      setDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleteDevice(false);
      setSelectedDeviceId(null);
      setDeleting(false); // End loading state
    }
  };
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <main className="min-h-screen bg-gray-100">
        <Header name={name} /> {/* Use the Header component */}

        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-gray-500 mb-8">
              <div className='text-blue-400 hover:text-blue-700 p-2 rounded-full transition-colors bg-blue-100'>
                <LayoutDashboard size={24} />
              </div>
              <button onClick={() => router.push('/dashboard')} className="text-2xl font-semibold hover:cursor-pointer hover:text-gray-700">Dashboard</button>
              <ChevronRight size={20} className='hover:text-gray-800' />
            </div>
            <div className="flex flex-col md:justify-between md:items-center mb-6 md:flex-row">
              <h2 className="text-2xl font-bold text-gray-800">Your Devices</h2>
              <div className='flex gap-5 '>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus /> Add Device
                </button>
                <div className="relative flex items-center gap-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by device name or location..."
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : filteredDevices.length === 0 ? (
              <p className="text-gray-500 text-center bg-white p-8 rounded-lg shadow-md">You have no devices yet. Click "Add Device" to get started!</p>
            ) : (
              <div className="space-y-4">
                {filteredDevices.map(device => (
                  <div
                    key={device.id}
                    className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center  hover:shadow-lg hover:bg-gray-50 transition hover:scale-105"
                  >
                    <div className="flex items-center gap-4 cursor-pointer"
                      onClick={() => { localStorage.setItem('deviceId', device.id); router.push(`/dashboard/${device.id}`) }}
                    >
                      <Cpu className="text-2xl text-blue-600" />
                      <div>
                        <p className="font-semibold text-lg text-gray-800 hover:underline">{device.name}</p>
                        <p className="text-sm text-gray-500">{device.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedDeviceId(device.id); setIsDeleteDevice(true); }}
                      className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
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

      {isDeleteDevice && (
        <DeletePopup
          onConfirm={() => handleDeletedevice(selectedDeviceId)}
          onCancel={() => { setIsDeleteDevice(false); setSelectedDeviceId(null); }}
          deleting={deleting}
        />
      )}
    </>
  );
}