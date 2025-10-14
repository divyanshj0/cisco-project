import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; 

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    
    // FIX: Removed the extra '/api' from the path
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password:password }),
    })
    
    // Check if the response is JSON before parsing
    const contentType = loginRes.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          return NextResponse.json(loginData, {status:loginRes.status});
        }
        return NextResponse.json({ token: loginData.token });
    } else {
        // If it's not JSON, it's likely an error page
        const errorText = await loginRes.text();
        console.error("Non-JSON response from backend:", errorText);
        return NextResponse.json({ error: 'Received an invalid response from the server.' }, { status: 500 });
    }

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}