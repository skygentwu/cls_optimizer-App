import { Skeleton } from 'antd-mobile';

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: 8, margin: '12px' }}>
      <Skeleton.Title animated />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton.Paragraph key={i} lineCount={1} animated style={{ marginTop: 12 }} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={1} animated style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
