import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to register' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}