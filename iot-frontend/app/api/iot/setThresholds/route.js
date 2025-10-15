import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, deviceId, thresholds } = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}/thresholds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(thresholds),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}