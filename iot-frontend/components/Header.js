'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { FaKey } from 'react-icons/fa6';
import ChangePasswordModal from './changePasswordModal';

export default function Header({ name }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <>
      <header className="bg-gray-800 px-6 py-2 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          {/* Left Section: Logo and Title */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white text-lg font-medium">IoT Sensor Dashboard</h1>
              <p className="text-gray-400 text-sm">Real-time monitoring & control</p>
            </div>
          </div>

          {/* Right Section: Welcome message and Menu */}
          <div className="flex items-center gap-6">
            <span className="text-white text-md hidden sm:block">Welcome back, {name}</span>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(prev => !prev)}
                className="text-white p-2 rounded-md hover:bg-gray-700 transition"
              >
                <FiMenu size={24} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(true);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaKey className="text-blue-600"/> Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showChangePasswordModal && (
        <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />
      )}
    </>
  );
}