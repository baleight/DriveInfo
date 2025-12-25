import { ResourceItem, ResourceCategory, TagColor } from './types';

// TODO: Paste your Google Apps Script Web App URL here after deployment
export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSQKfV7uCS_0CmWiEQFiQ1ksfbWWnSsFYQSFm3qOQ2TagH84dOyHYJxxkNbcA-xoez/exec'; 

export const INITIAL_RESOURCES: ResourceItem[] = [
  // --- NOTES ---
  {
    id: '1',
    title: 'Uni.Steffo - Archivio appunti di Stefano Pigozzi',
    url: 'https://uni.steffo.eu/',
    year: '19-23',
    category: ResourceCategory.GENERAL,
    categoryColor: TagColor.RED,
    type: 'note',
    icon: 'https://www.notion.so/icons/star_yellow.svg'
  },
  {
    id: '2',
    title: 'Appunti Calcolo Numerico',
    url: '#',
    year: '22/23',
    category: ResourceCategory.CALCULUS,
    categoryColor: TagColor.YELLOW,
    type: 'note',
    icon: 'https://www.notion.so/icons/calendar-month_blue.svg'
  },
  {
    id: '3',
    title: 'Linguaggi e Compilatori',
    url: 'https://theelandor.github.io/compilatori/',
    year: '23/24',
    category: ResourceCategory.LANGUAGES,
    categoryColor: TagColor.BROWN,
    type: 'note',
    icon: 'https://www.notion.so/icons/groups_blue.svg'
  },
  {
    id: '4',
    title: 'Appunti Fisica Singh',
    url: 'https://singh-app.pages.dev/',
    year: '23/24',
    category: ResourceCategory.PHYSICS,
    categoryColor: TagColor.PINK,
    type: 'note',
    icon: 'https://www.notion.so/icons/document_red.svg'
  },
  {
    id: '5',
    title: 'Progetto del software',
    url: '#',
    year: '19/20 Missiroli',
    category: ResourceCategory.SOFTWARE_ENG,
    categoryColor: TagColor.GREEN,
    type: 'note',
    icon: 'https://www.notion.so/icons/document_red.svg'
  },
  
  // --- BOOKS ---
  {
    id: 'b1',
    title: '120 Esercizi di Ricerca Operativa',
    description: 'Mauro dell’Amico',
    url: '#',
    dateAdded: '24/12/2025',
    category: ResourceCategory.OPERATIONS,
    categoryColor: TagColor.PURPLE,
    type: 'book',
    icon: 'https://www.notion.so/icons/book_gray.svg',
    coverImage: 'https://picsum.photos/20/30?random=1'
  },
  {
    id: 'b2',
    title: 'Compilatori. Principi, tecniche e strumenti.',
    description: 'Alfred V. Aho, Monica S. Lam, Ravi Sethi',
    url: '#',
    dateAdded: '24/12/2025',
    category: ResourceCategory.LANGUAGES,
    categoryColor: TagColor.PINK,
    type: 'book',
    icon: 'https://www.notion.so/icons/book_gray.svg',
    coverImage: 'https://picsum.photos/20/30?random=2'
  },
  {
    id: 'b3',
    title: 'Computer Organization and Design ARM Edition',
    description: '',
    url: '#',
    dateAdded: '24/12/2025',
    category: ResourceCategory.ARCHITECTURE,
    categoryColor: TagColor.YELLOW,
    type: 'book',
    icon: 'https://www.notion.so/icons/book_gray.svg',
    coverImage: 'https://picsum.photos/20/30?random=3'
  }
];

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