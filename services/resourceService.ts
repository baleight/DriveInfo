
import { INITIAL_RESOURCES, GOOGLE_APPS_SCRIPT_URL } from '../constants';
import { ResourceItem, StorageInfo, ApiResponse } from '../types';

// In-memory fallback if API is not configured
let inMemoryDb: ResourceItem[] = [...INITIAL_RESOURCES];
const FIXED_LIMIT_BYTES = 15 * 1024 * 1024 * 1024; // 15GB

const checkApiConfigured = () => {
    if (!GOOGLE_APPS_SCRIPT_URL) {
        alert("⚠️ ERRORE CONFIGURAZIONE ⚠️\n\nL'URL dello script Google non è stato inserito nel file 'constants.ts'.\n\nI dati non verranno salvati sul foglio Excel.");
        return false;
    }
    return true;
};

// Helper: Pause execution for a given time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Upload a single chunk with Retry Logic
const uploadChunkWithRetry = async (uploadId: string, chunkIndex: number, chunkData: string, retries = 3): Promise<any> => {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            // Use standard text/plain to avoid complex CORS preflights
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ 
                action: 'upload_chunk', 
                uploadId, 
                chunkIndex, 
                chunkData 
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const res = await response.json();
        if (res.status !== 'success') throw new Error(res.message || 'Unknown error');
        return res;

    } catch (err: any) {
        const errStr = (err.message || err.toString()).toLowerCase().replace(/\s+/g, ' '); // Normalize spaces
        
        // Detect Permission Error or unrecoverable Network Error
        if (errStr.includes("autorizzazione") || errStr.includes("driveapp") || errStr.includes("permission")) {
             throw err; 
        }

        if (retries > 0) {
            console.warn(`Chunk ${chunkIndex} failed. Retrying in 2s... (${retries} attempts left)`);
            await delay(2000); // Increased wait time for retries
            return uploadChunkWithRetry(uploadId, chunkIndex, chunkData, retries - 1);
        } else {
            throw err; 
        }
    }
};

// Modified to return object with data AND storage info
export const getResources = async (): Promise<ApiResponse> => {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("GOOGLE_APPS_SCRIPT_URL is not set. Using mock data.");
    return new Promise((resolve) => setTimeout(() => resolve({ resources: [...inMemoryDb], storage: { used: 0, limit: FIXED_LIMIT_BYTES } }), 300));
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    
    // Default fallback storage if API misses it
    const defaultStorage = { used: 0, limit: FIXED_LIMIT_BYTES };

    // Handle new format { status: 'success', data: [], storage: {} }
    if (json.status === 'success') {
        return {
            resources: json.data || [],
            storage: json.storage || defaultStorage
        };
    } 
    // Fallback for legacy format (direct array)
    else if (Array.isArray(json)) {
        return { resources: json, storage: defaultStorage };
    }
    
    return { resources: [...INITIAL_RESOURCES], storage: defaultStorage };

  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return { resources: [...inMemoryDb], storage: { used: 0, limit: FIXED_LIMIT_BYTES } };
  }
};

export const addResource = async (
    resource: Omit<ResourceItem, 'id'> & { fileData?: string }, 
    onProgress?: (percentage: number) => void
): Promise<{ item: ResourceItem, storage?: StorageInfo }> => {
  const tempId = Math.random().toString(36).substr(2, 9);
  
  // Optimistic UI update
  const newResourceLocal = { ...resource, id: tempId };
  inMemoryDb = [newResourceLocal as ResourceItem, ...inMemoryDb];

  if (!checkApiConfigured()) return { item: newResourceLocal as ResourceItem };

  try {
    // CHUNKING LOGIC FOR FILES
    if (resource.fileData && resource.fileData.length > 100 * 1024) {
        // INCREASED CHUNK SIZE to 2MB to reduce request count and avoid "NetworkError" on large files
        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
        const totalSize = resource.fileData.length;
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const uploadId = `${tempId}_${Date.now()}`; 

        console.log(`Starting chunked upload: ${totalChunks} chunks (Size: ${totalSize})`);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunk = resource.fileData.substring(start, end);
            
            await uploadChunkWithRetry(uploadId, i, chunk);
            
            // Increased delay to allow server to breathe and avoid browser socket exhaustion
            await delay(600); 
            
            const progress = Math.round(((i + 1) / totalChunks) * 100);
            if (onProgress) onProgress(progress);
        }

        // Finalize
        const resourceWithoutFile = { ...resource, fileData: '' }; 
        const finalizeResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ 
                action: 'create', 
                ...resourceWithoutFile, 
                uploadId: uploadId, 
                totalChunks: totalChunks
            }),
        });

        const result = await finalizeResponse.json();
        if (result.status === 'success') {
            const serverItem = result.data as ResourceItem;
            inMemoryDb = inMemoryDb.map(item => item.id === tempId ? serverItem : item);
            return { item: serverItem, storage: result.storage };
        } else {
             throw new Error(result.message || 'Unknown error');
        }

    } else {
        // STANDARD UPLOAD
        if (onProgress) onProgress(10); 
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: 'create', ...newResourceLocal }),
        });
        if (onProgress) onProgress(100);
        const result = await response.json();
        
        if (result.status === 'success') {
             return { item: result.data, storage: result.storage };
        } else {
             throw new Error(result.message);
        }
    }

  } catch (error: any) {
    console.error("Add failed:", error);
    const errorStr = (error.message || error.toString()).toLowerCase();
    
    if (errorStr.includes("autorizzazione") || errorStr.includes("driveapp")) {
        alert("Errore Permessi Google Drive. Esegui _FORCE_AUTH nello script.");
    } else if (errorStr.includes("networkerror") || errorStr.includes("failed to fetch")) {
        alert("Errore di rete durante il caricamento. La connessione potrebbe essere instabile o il file troppo grande per la velocità attuale. Riprova.");
    } else {
        alert(`Errore caricamento: ${error.message || error}.`);
    }
    
    inMemoryDb = inMemoryDb.filter(i => i.id !== tempId);
    throw error;
  }
};

export const updateResource = async (resource: ResourceItem): Promise<{ item: ResourceItem, storage?: StorageInfo }> => {
  inMemoryDb = inMemoryDb.map(r => r.id === resource.id ? resource : r);
  if (!checkApiConfigured()) return { item: resource };

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'edit', ...resource }),
    });
    const result = await response.json();
    return result.status === 'success' ? { item: result.data, storage: result.storage } : { item: resource };
  } catch (error) {
    console.error("Update failed:", error);
    return { item: resource };
  }
};

export const deleteResource = async (id: string): Promise<{ success: boolean, storage?: StorageInfo }> => {
  inMemoryDb = inMemoryDb.filter(r => r.id !== id);
  if (!checkApiConfigured()) return { success: true };

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const result = await response.json();
    return { success: result.status === 'success', storage: result.storage };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false };
  }
};
