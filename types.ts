export enum ResourceCategory {
  GENERAL = 'Generale',
  CALCULUS = 'Calcolo numerico',
  LANGUAGES = 'Linguaggi C/C++ Python',
  PHYSICS = 'Fisica',
  SOFTWARE_ENG = 'Ingegneria del Software',
  NETWORKS = 'Reti',
  INFO_MGMT = 'Gestioni Informazioni',
  OPERATIONS = 'Ricerca operativa OLI',
  ARCHITECTURE = 'Architettura dei calcolatori'
}

export enum TagColor {
  RED = 'red',
  YELLOW = 'yellow',
  BROWN = 'brown',
  PINK = 'pink',
  GREEN = 'green',
  GRAY = 'gray',
  DEFAULT = 'default',
  PURPLE = 'purple',
  ORANGE = 'orange',
  BLUE = 'blue'
}

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  description?: string; // Author for books, simple desc for notes
  year?: string;
  dateAdded?: string;
  category: string; // Changed from ResourceCategory to string to allow custom inputs
  categoryColor: TagColor;
  type: 'note' | 'book';
  icon?: string; // URL or emoji
  coverImage?: string; // For books
}