import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, oldPassword, newPassword } = await req.json();
    if (!token || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Password change failed' }, { status: res.status });
    }

    return NextResponse.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}