import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    // The modal sends 'oldPassword', so we use that key here.
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
        // FIX: The header must be 'Authorization', not 'X-Authorization'.
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Forward the specific error message from the backend
      return NextResponse.json({ error: data.error || 'Password change failed' }, { status: res.status });
    }

    return NextResponse.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}