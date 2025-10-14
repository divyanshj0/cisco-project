import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, deviceId, temperature, humidity } = await req.json();

    if (!token || !deviceId || temperature === undefined || humidity === undefined) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        deviceId: deviceId, 
        temperature: parseFloat(temperature), 
        humidity: parseFloat(humidity) 
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to send data' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Send data error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}