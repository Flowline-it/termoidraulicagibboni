import React from 'react';
import { cn } from '@/lib/utils';

export const inputCls =
  'w-full h-10 px-3 rounded-md border border-input bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition disabled:opacity-50';

export function Field({ label, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SelectInput({ value, onChange, options, placeholder, className, disabled }) {
  return (
    <select
      className={cn(inputCls, className)}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder != null && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const optsFrom = (map) =>
  Object.entries(map).map(([value, label]) => ({ value, label }));

export function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 border border-dashed border-border px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LoadingRows({ label = 'Caricamento…' }) {
  return (
    <div className="flex items-center gap-3 px-2 py-10 text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}
