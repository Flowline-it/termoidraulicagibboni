import React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  orange: 'bg-orange-100 text-orange-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-700',
  navy: 'bg-sky-950/10 text-sky-950',
  gray: 'bg-stone-200/80 text-stone-600',
};

const StatusBadge = ({ label, tone = 'gray', className }) => (
  <span
    className={cn(
      'inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider',
      TONES[tone] || TONES.gray,
      className,
    )}
  >
    {label}
  </span>
);

export default StatusBadge;
export { StatusBadge };
