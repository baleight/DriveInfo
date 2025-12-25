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
    
    // Logic: If the database (Sheet) has data, show ONLY that data (Single Source of Truth).
    // If the database is completely empty, show the Mock/Initial data so the site isn't blank.
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

  // Optimistic update for fallback/UI speed
  inMemoryDb = [newResourceLocal, ...inMemoryDb];

  if (!GOOGLE_APPS_SCRIPT_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(newResourceLocal), 500));
  }

  try {
    // CRITICAL FIX: Use 'text/plain;charset=utf-8' for the Content-Type.
    // This prevents the browser from sending a CORS preflight (OPTIONS) request,
    // which Google Apps Script web apps usually reject or fail to handle correctly.
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
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
    // Even if backend fails, return the local version so the user doesn't lose their input in the UI
    return newResourceLocal;
  }
};