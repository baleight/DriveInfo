import { INITIAL_RESOURCES, GOOGLE_APPS_SCRIPT_URL } from '../constants';
import { ResourceItem } from '../types';

// In-memory fallback if API is not configured
let inMemoryDb: ResourceItem[] = [...INITIAL_RESOURCES];

export const getResources = async (): Promise<ResourceItem[]> => {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("GOOGLE_APPS_SCRIPT_URL is not set in constants.ts. Using mock data.");
    return new Promise((resolve) => setTimeout(() => resolve([...inMemoryDb]), 300));
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
        console.log(`Successfully fetched ${data.length} resources.`);
        return data;
    } else {
        console.log("Fetched data is empty or not an array. Using initial resources.");
        return [...INITIAL_RESOURCES]; // Show default if sheet is empty
    }
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return [...inMemoryDb];
  }
};

export const addResource = async (resource: Omit<ResourceItem, 'id'>): Promise<ResourceItem> => {
  const tempId = Math.random().toString(36).substr(2, 9);
  const newResourceLocal = { ...resource, id: tempId };
  inMemoryDb = [newResourceLocal, ...inMemoryDb];

  if (!GOOGLE_APPS_SCRIPT_URL) return newResourceLocal;

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
    return newResourceLocal;
  }
};

export const updateResource = async (resource: ResourceItem): Promise<ResourceItem> => {
  // Update local memory
  inMemoryDb = inMemoryDb.map(r => r.id === resource.id ? resource : r);

  if (!GOOGLE_APPS_SCRIPT_URL) return resource;

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
    return resource;
  }
};

export const deleteResource = async (id: string): Promise<boolean> => {
  inMemoryDb = inMemoryDb.filter(r => r.id !== id);

  if (!GOOGLE_APPS_SCRIPT_URL) return true;

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
    return false;
  }
};