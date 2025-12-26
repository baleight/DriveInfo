import { ResourceItem, ResourceCategory, TagColor } from './types';

// TODO: Incolla qui l'URL della tua Web App di Google Apps Script (Nuovo Account)
export const GOOGLE_APPS_SCRIPT_URL = `https://script.google.com/macros/s/AKfycbwsZsv0qCfWGRD1whLgqssiFjXUTmj_7NobsvCYboOheCCzknuX-IHK7WEoQimWNImy/exec`; 

export const INITIAL_RESOURCES: ResourceItem[] = [];

export const CATEGORY_COLORS: Record<TagColor, string> = {
  [TagColor.RED]: 'bg-red-100 text-red-800',
  [TagColor.YELLOW]: 'bg-yellow-100 text-yellow-800',
  [TagColor.BROWN]: 'bg-orange-100 text-orange-800', // Approximation for brown
  [TagColor.PINK]: 'bg-pink-100 text-pink-800',
  [TagColor.GREEN]: 'bg-green-100 text-green-800',
  [TagColor.GRAY]: 'bg-gray-200 text-gray-700',
  [TagColor.DEFAULT]: 'bg-gray-100 text-gray-700',
  [TagColor.PURPLE]: 'bg-purple-100 text-purple-800',
  [TagColor.ORANGE]: 'bg-orange-100 text-orange-800',
  [TagColor.BLUE]: 'bg-blue-100 text-blue-800',
};