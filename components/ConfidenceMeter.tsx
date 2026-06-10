'use client';

interface Props {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceMeter({ confidence, size = 'md' }: Props) {
  const color =
    confidence >= 80
      ? '#EF4444'
      : confidence >= 60
      ? '#F97316'
      : confidence >= 40
      ? '#EAB308'
      : '#6B7280';

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-800 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500`}
          style={{ width: `${confidence}%`, backgroundColor: color }}
        />
      </div>
      <span className={`${textSizes[size]} font-bold tabular-nums`} style={{ color }}>
        {confidence}%
      </span>
    </div>
  );
}
