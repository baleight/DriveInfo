const LEGACY_VIDEO_ICON_URL = 'https://www.notion.so/icons/play_pink.svg';

export const RESOURCE_ICONS = {
  document: 'https://www.notion.so/icons/document_blue.svg',
  book: 'https://www.notion.so/icons/book_purple.svg',
  code: 'https://www.notion.so/icons/code_red.svg',
  video: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#fdf2f8"/>
      <polygon points="10 8 16 12 10 16 10 8" fill="#ec4899" stroke="#ec4899"/>
    </svg>
  `)}`,
  web: 'https://www.notion.so/icons/globe_green.svg',
  folder: 'https://www.notion.so/icons/folder_orange.svg',
} as const;

export const normalizeResourceIcon = (icon?: string): string => {
  if (icon === LEGACY_VIDEO_ICON_URL) return RESOURCE_ICONS.video;
  return icon || '';
};
