'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { BiSolidHide, BiShow, BiLeftArrowAlt } from "react-icons/bi";
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      const res = await fetch('/api/iot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        toast.error(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('iot_token', data.token);
      localStorage.setItem('iot_user', email.split('@')[0]);

      router.push('/dashboard');

    } catch (err) {
      setLoading(false);
      toast.error(err.message || 'Login failed!');
    }
  };


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-50">
      <img src="/company_logo[1].png" alt="logo" className='h-24' />
      <h1 className="text-3xl font-bold text-blue-700 mt-4 text-center">Water Monitoring Dashboard Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-10 text-xl">
        <input name="email" type="email" placeholder="Email" required className="border px-2 py-4 text-xl rounded" />
        <div className="relative">
          <input name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            className="border px-2 py-4 text-xl rounded w-full"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-lg cursor-pointer text-blue-500"
          >
            {showPassword ? <BiSolidHide size={32} /> : <BiShow size={32} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 text-2xl rounded hover:bg-blue-700 disabled:bg-blue-400">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {/* Link to Register Page */}
      <div className='text-lg text-center mt-4'>
        Don't have an account?{' '}
        <Link href="/register" className='hover:underline cursor-pointer font-semibold text-blue-600'>
          Register here
        </Link>
      </div>
    </div>
  );
}