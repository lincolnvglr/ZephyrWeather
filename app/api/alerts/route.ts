import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ALERTS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const radiusMiles = parseFloat(searchParams.get('radius') || '10');

  const alerts = MOCK_ALERTS
    .filter((a) => a.distance <= radiusMiles)
    .sort((a, b) => {
      const severityOrder: Record<string, number> = {
        immediate_danger: 0, verified: 1, developing: 2, observation: 3,
      };
      const diff = (severityOrder[a.status] ?? 4) - (severityOrder[b.status] ?? 4);
      return diff !== 0 ? diff : a.distance - b.distance;
    });

  return NextResponse.json({ alerts });
}
