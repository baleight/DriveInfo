export const splitCategories = (category?: string): string[] => {
  return (category || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

export const joinCategories = (categories: string[]): string => {
  return Array.from(new Set(categories.map(item => item.trim()).filter(Boolean))).join(', ');
};
