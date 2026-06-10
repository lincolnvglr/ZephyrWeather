import { NextRequest, NextResponse } from 'next/server';
import { ThreatType } from '@/types';

interface ReportBody {
  type: ThreatType;
  lat: number;
  lng: number;
  userId: string;
}

// In-memory store for demo (replace with DB in production)
const reports: Array<ReportBody & { id: string; timestamp: string; confidence: number }> = [];

export async function POST(req: NextRequest) {
  try {
    const body: ReportBody = await req.json();

    if (!body.type || body.lat === undefined || body.lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Compute initial confidence based on report clustering
    const nearby = reports.filter(
      (r) =>
        r.type === body.type &&
        Math.abs(r.lat - body.lat) < 0.05 &&
        Math.abs(r.lng - body.lng) < 0.05 &&
        Date.now() - new Date(r.timestamp).getTime() < 30 * 60 * 1000
    );

    const baseConfidence = 40 + Math.min(nearby.length * 12, 50);
    const confidence = Math.min(baseConfidence + Math.floor(Math.random() * 10), 99);

    const report = {
      ...body,
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      confidence,
    };

    reports.push(report);

    return NextResponse.json({ success: true, report });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radiusDeg = 0.1; // ~10km

  const nearby = reports.filter(
    (r) =>
      Math.abs(r.lat - lat) < radiusDeg &&
      Math.abs(r.lng - lng) < radiusDeg &&
      Date.now() - new Date(r.timestamp).getTime() < 60 * 60 * 1000
  );

  return NextResponse.json({ reports: nearby });
}
