import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, deviceId, page } = await req.json();
     if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 404 });
    }

    const params = new URLSearchParams();
    params.append('page', page || 1);

    const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}/alerts?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch alerts');
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}