'use client';

import { ReportStatus, STATUS_META } from '@/types';

export function ThreatBadge({ status }: { status: ReportStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: meta.color, backgroundColor: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} animate-pulse`} />
      {meta.label}
    </span>
  );
}
