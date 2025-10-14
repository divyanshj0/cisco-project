'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

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
        // NEW: Check if old and new passwords are the same
        if (currentPassword === newPassword) {
            return toast.error("New password cannot be the same as the old password.");
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

    // Simplified validation, just checking for non-empty fields and matching passwords
    const isValid = currentPassword.trim() !== '' && newPassword.trim() !== '' && newPassword === confirmPassword;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-2 right-3 text-2xl z-10 text-gray-500 hover:text-black">&times;</button>
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
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
                     {currentPassword && newPassword && currentPassword === newPassword && (
                        <div className="text-red-500 text-sm">New password cannot be the same as the old one.</div>
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
    );
}