import { NextResponse } from 'next/server';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  const { token, deviceId } = await req.json();
   if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 404 });
    }
     if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

  const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: errorText }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
