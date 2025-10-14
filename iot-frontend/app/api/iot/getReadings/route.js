import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, deviceId, limit} = await req.json();

    if (!token || !deviceId) {
      return NextResponse.json({ error: 'Missing token or deviceId' }, { status: 400 });
    }

    const params = new URLSearchParams();
    if(limit) params.append('limit', limit);

    const res = await fetch(`${BACKEND_URL}/api/readings/${deviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to fetch readings: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Fetch readings error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}