import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, deviceId, limit, startDate, endDate, sortBy, order } = await req.json();

    if (!token || !deviceId) {
      return NextResponse.json({ error: 'Missing token or deviceId' }, { status: 400 });
    }

    // Build query params dynamically
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);

    const url = `${BACKEND_URL}/api/readings/${deviceId}?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
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
