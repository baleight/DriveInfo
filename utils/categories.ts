export const splitCategories = (category?: string): string[] => {
  return (category || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

export const joinCategories = (categories: string[]): string => {
  const seen = new Set<string>();

  return categories
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => {
      const key = item.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
};
