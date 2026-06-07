import React from 'react';
import { TagColor } from '../types';

interface BadgeProps {
  label: string;
  color: TagColor;
}

const BRUT_COLORS: Record<TagColor, string> = {
  [TagColor.RED]:     'bg-red-100 text-red-800 border-red-800',
  [TagColor.YELLOW]:  'bg-yellow-100 text-yellow-800 border-yellow-800',
  [TagColor.BROWN]:   'bg-orange-100 text-orange-800 border-orange-800',
  [TagColor.PINK]:    'bg-pink-100 text-pink-800 border-pink-800',
  [TagColor.GREEN]:   'bg-emerald-100 text-emerald-800 border-emerald-800',
  [TagColor.GRAY]:    'bg-slate-100 text-slate-700 border-slate-700',
  [TagColor.DEFAULT]: 'bg-slate-100 text-slate-700 border-slate-700',
  [TagColor.PURPLE]:  'bg-violet-100 text-violet-800 border-violet-800',
  [TagColor.ORANGE]:  'bg-orange-100 text-orange-800 border-orange-800',
  [TagColor.BLUE]:    'bg-blue-100 text-blue-800 border-blue-800',
};

export const Badge: React.FC<BadgeProps> = ({ label, color }) => {
  const colorClasses = BRUT_COLORS[color] || BRUT_COLORS[TagColor.DEFAULT];

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${colorClasses} hover:-translate-y-0.5 hover:shadow-brut`}>
      {label}
    </span>
  );
};
