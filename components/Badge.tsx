import React from 'react';
import { TagColor } from '../types';

interface BadgeProps {
  label: string;
  color: TagColor;
}

// Updated color palette for a more modern, less "default" look
const MODERN_COLORS: Record<TagColor, string> = {
  [TagColor.RED]: 'bg-red-50 text-red-600 border-red-100',
  [TagColor.YELLOW]: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  [TagColor.BROWN]: 'bg-orange-50 text-orange-700 border-orange-100',
  [TagColor.PINK]: 'bg-pink-50 text-pink-600 border-pink-100',
  [TagColor.GREEN]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  [TagColor.GRAY]: 'bg-slate-100 text-slate-600 border-slate-200',
  [TagColor.DEFAULT]: 'bg-slate-50 text-slate-600 border-slate-200',
  [TagColor.PURPLE]: 'bg-violet-50 text-violet-600 border-violet-100',
  [TagColor.ORANGE]: 'bg-orange-50 text-orange-600 border-orange-100',
  [TagColor.BLUE]: 'bg-blue-50 text-blue-600 border-blue-100',
};

export const Badge: React.FC<BadgeProps> = ({ label, color }) => {
  const colorClasses = MODERN_COLORS[color] || MODERN_COLORS[TagColor.DEFAULT];
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {label}
    </span>
  );
};