import { INITIAL_RESOURCES, GOOGLE_APPS_SCRIPT_URL } from '../constants';
import { ResourceItem } from '../types';

// In-memory fallback if API is not configured
let inMemoryDb: ResourceItem[] = [...INITIAL_RESOURCES];

const checkApiConfigured = () => {
    if (!GOOGLE_APPS_SCRIPT_URL) {
        alert("⚠️ ERRORE CONFIGURAZIONE ⚠️\n\nL'URL dello script Google non è stato inserito nel file 'constants.ts'.\n\nI dati non verranno salvati sul foglio Excel.");
        return false;
    }
    return true;
};

export const getResources = async (): Promise<ResourceItem[]> => {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("GOOGLE_APPS_SCRIPT_URL is not set. Using mock data.");
    return new Promise((resolve) => setTimeout(() => resolve([...inMemoryDb]), 300));
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
        return data;
    } else {
        return [...INITIAL_RESOURCES];
    }
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return [...inMemoryDb];
  }
};

export const addResource = async (resource: Omit<ResourceItem, 'id'>): Promise<ResourceItem> => {
  const tempId = Math.random().toString(36).substr(2, 9);
  const newResourceLocal = { ...resource, id: tempId };

  // Update local DB instantly for UI responsiveness
  inMemoryDb = [newResourceLocal, ...inMemoryDb];

  if (!checkApiConfigured()) return newResourceLocal;

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'create', ...newResourceLocal }),
    });
    const result = await response.json();
    return result.status === 'success' ? result.data : newResourceLocal;
  } catch (error) {
    console.error("Add failed:", error);
    alert("Errore di connessione con Google Sheet. Riprova.");
    return newResourceLocal;
  }
};

export const updateResource = async (resource: ResourceItem): Promise<ResourceItem> => {
  inMemoryDb = inMemoryDb.map(r => r.id === resource.id ? resource : r);

  if (!checkApiConfigured()) return resource;

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'edit', ...resource }),
    });
    const result = await response.json();
    return result.status === 'success' ? result.data : resource;
  } catch (error) {
    console.error("Update failed:", error);
    alert("Errore durante l'aggiornamento.");
    return resource;
  }
};

export const deleteResource = async (id: string): Promise<boolean> => {
  inMemoryDb = inMemoryDb.filter(r => r.id !== id);

  if (!checkApiConfigured()) return true;

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Errore durante l'eliminazione.");
    return false;
  }
};