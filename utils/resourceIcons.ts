const makeSvgDataUri = (svg: string): string => {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const RESOURCE_ICONS = {
  document: makeSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z" fill="#eff6ff"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>'),
  book: makeSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v14H8a3 3 0 0 1-3-3z" fill="#f5f3ff"/><path d="M8 4v17"/><path d="M10 8h5"/></svg>'),
  code: makeSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fef2f2"/><path d="m9 9-3 3 3 3M15 9l3 3-3 3"/></svg>'),
  video: makeSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#fdf2f8"/><polygon points="10 8 16 12 10 16 10 8" fill="#ec4899" stroke="#ec4899"/></svg>'),
  web: makeSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="#f0fdf4"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'),
  folder: makeSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff7ed"/><path d="M3 7v11"/></svg>'),
} as const;

const LEGACY_ICON_MAP: Record<string, string> = {
  'https://www.notion.so/icons/document_blue.svg': RESOURCE_ICONS.document,
  'https://www.notion.so/icons/book_purple.svg': RESOURCE_ICONS.book,
  'https://www.notion.so/icons/code_red.svg': RESOURCE_ICONS.code,
  'https://www.notion.so/icons/play_pink.svg': RESOURCE_ICONS.video,
  'https://www.notion.so/icons/globe_green.svg': RESOURCE_ICONS.web,
  'https://www.notion.so/icons/folder_orange.svg': RESOURCE_ICONS.folder,
};

export const normalizeResourceIcon = (icon?: string): string => {
  const normalizedIcon = (icon || '').trim();
  return LEGACY_ICON_MAP[normalizedIcon] || normalizedIcon;
};
