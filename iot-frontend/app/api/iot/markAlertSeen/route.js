import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req) {
  try {
    const { token, alertId } = await req.json();
     if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 404 });
    }
    const res = await fetch(`${BACKEND_URL}/api/alerts/${alertId}/seen`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}