'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function ChangePasswordModal({ onClose }) {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('iot_token');

        if (!token) {
            toast.error('Session expired. Please log in again.');
            localStorage.clear();
            router.push('/login');
            return;
        }
        if (newPassword !== confirmPassword) {
            return toast.error('New passwords do not match!');
        }

        setLoading(true);
        try {
            const response = await fetch('/api/iot/changePassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    oldPassword: currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            toast.success('Password changed successfully! Please log in again.');
            localStorage.clear();
            router.push('/login');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // --- UPDATED VALIDATION LOGIC ---
    // New rule: No special characters allowed.
    const hasNoSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword);
    
    // Form is valid if the new password meets the policy and all fields are filled.
    const isValid = currentPassword.trim() !== '' && newPassword.trim() !== '' && newPassword === confirmPassword && hasNoSpecialChar;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-0 relative">
                <button onClick={onClose} className="absolute top-2 right-3 text-2xl z-10 text-gray-500 hover:text-black">&times;</button>
                <div className="flex">
                    {/* Left Section - Informational */}
                    <div className="w-2/5 bg-gray-800 p-6 text-white rounded-l-xl flex flex-col justify-center">
                        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                        <div className="text-sm space-y-1">
                            <h4 className="font-semibold mb-2">New password must contain:</h4>
                            {/* Updated UI Text */}
                            <ul className="space-y-1 text-gray-300">
                                <li className={clsx({ 'text-green-400': hasNoSpecialChar, 'text-red-400': !hasNoSpecialChar && newPassword })}>
                                    • No special characters
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Section - Form */}
                    <div className="w-3/5 p-6">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Current Password *"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:outline-blue-500"
                            />
                            <input
                                type="password"
                                placeholder="New Password *"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:outline-blue-500"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password *"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:outline-blue-500"
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <div className="text-red-500 text-sm">Passwords do not match</div>
                            )}
                            <div className="flex justify-end space-x-4 pt-6">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                                <button type="submit" className={`px-4 py-2 bg-blue-600 text-white rounded ${loading || !isValid ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading || !isValid}>
                                    {loading ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}