import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, name, location } = await req.json();

    if (!token || !name) {
      return NextResponse.json({ error: 'Token and device name are required.' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, location }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to create device' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create device error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}