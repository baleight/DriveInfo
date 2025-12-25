import React from 'react';
import { TagColor } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface BadgeProps {
  label: string;
  color: TagColor;
}

export const Badge: React.FC<BadgeProps> = ({ label, color }) => {
  const colorClasses = CATEGORY_COLORS[color] || CATEGORY_COLORS[TagColor.DEFAULT];
  
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-sm font-normal whitespace-nowrap ${colorClasses}`}>
      {label}
    </span>
  );
};
