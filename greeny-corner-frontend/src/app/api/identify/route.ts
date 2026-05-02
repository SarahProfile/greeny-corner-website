import { NextRequest, NextResponse } from 'next/server';

const AI_API = 'http://37.60.236.44:3002';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${AI_API}/identify`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: 'Could not reach AI model' } },
      { status: 502 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${AI_API}/identify/health`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'AI model unreachable' } },
      { status: 502 }
    );
  }
}
