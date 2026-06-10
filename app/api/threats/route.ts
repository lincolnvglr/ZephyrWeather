import { NextRequest, NextResponse } from 'next/server';
import { MOCK_THREATS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '36.1627');
  const lng = parseFloat(searchParams.get('lng') || '-86.7816');

  // Filter threats within 50km and attach distance
  const threats = MOCK_THREATS.map((t) => ({
    ...t,
    distance: haversine(lat, lng, t.location.lat, t.location.lng),
  })).filter((t) => t.distance < 50);

  return NextResponse.json({ threats });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
