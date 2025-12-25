import { INITIAL_RESOURCES, GOOGLE_APPS_SCRIPT_URL } from '../constants';
import { ResourceItem } from '../types';

// In-memory fallback if API is not configured
let inMemoryDb: ResourceItem[] = [...INITIAL_RESOURCES];

export const getResources = async (): Promise<ResourceItem[]> => {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("GOOGLE_APPS_SCRIPT_URL is not set. Using mock data.");
    return new Promise((resolve) => setTimeout(() => resolve([...inMemoryDb]), 300));
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'GET',
        redirect: 'follow'
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    // If sheet is empty (just headers), it might return empty array. 
    // Merge with initial resources if you want them to always exist, 
    // or just return data. returning data + initial for demo:
    if (Array.isArray(data) && data.length > 0) {
        return data;
    } else {
        return [...INITIAL_RESOURCES];
    }

  } catch (error) {
    console.error("Failed to fetch from Google Sheet:", error);
    // Fallback to mock data on error so the app still works visually
    return [...inMemoryDb];
  }
};

export const addResource = async (resource: Omit<ResourceItem, 'id'>): Promise<ResourceItem> => {
  const newResourceLocal = {
    ...resource,
    id: Math.random().toString(36).substr(2, 9),
  };

  // Optimistic update for fallback
  inMemoryDb = [newResourceLocal, ...inMemoryDb];

  if (!GOOGLE_APPS_SCRIPT_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(newResourceLocal), 500));
  }

  try {
    // Send to Google Sheet
    // Note: We use text/plain to avoid CORS preflight options request issues with GAS sometimes
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(newResourceLocal),
    });

    const result = await response.json();
    
    if (result.status === 'success') {
        return result.data;
    } else {
        throw new Error(result.message);
    }

  } catch (error) {
    console.error("Failed to save to Google Sheet:", error);
    // Return local version so UI still updates even if backend fails (optimistic)
    return newResourceLocal;
  }
};