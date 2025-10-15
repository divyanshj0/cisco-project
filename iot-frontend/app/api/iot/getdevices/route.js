import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, page } = await req.json();

    const params = new URLSearchParams();
    params.append('page', page || 1);
    params.append('limit', 10);

    const devicesRes = await fetch(`${BACKEND_URL}/api/devices?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!devicesRes.ok) {
      const text = await devicesRes.text();
      return NextResponse.json({ error: 'Failed to fetch devices: ' + text }, { status: devicesRes.status });
    }

    const data = await devicesRes.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}