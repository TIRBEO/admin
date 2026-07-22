'use client';

export function OnlineDot({ active }: { active: boolean }) {
  return (
    <span
      style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        display: 'inline-block',
        background: active ? '#22c55e' : '#3a3a44',
        boxShadow: active ? '0 0 6px rgba(34,197,94,0.4)' : 'none',
      }}
    />
  );
}
