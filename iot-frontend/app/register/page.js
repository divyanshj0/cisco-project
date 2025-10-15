'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { BiSolidHide, BiShow } from "react-icons/bi";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (/\s/.test(password)) {
      toast.warning('Password should not contain any spaces.');
      return;
    }

    try {
      const res = await fetch('/api/iot/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.status === 409){
        toast.error('This email already registered!');
        setLoading(false);
        return;
      }
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