'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      const res = await fetch('/api/iot/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Registration successful! Please log in.');
      router.push('/login');

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-50">
      <h1 className="text-3xl font-bold text-blue-700 mt-4 text-center">Create a New Account</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-10 text-xl">
        <input name="email" type="email" placeholder="Email" required className="border px-2 py-4 text-xl rounded" />
        <input name="password" type="password" placeholder="Password" required className="border px-2 py-4 text-xl rounded" />
        
        <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 text-2xl rounded hover:bg-blue-700 disabled:bg-blue-400">
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div className='text-lg text-center mt-2'>
          <Link href="/login" className='hover:underline cursor-pointer text-blue-600'>
            Already have an account? Login
          </Link>
        </div>
      </form>
    </div>
  );
}