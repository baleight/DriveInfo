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

// Helper: Pause execution for a given time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Upload a single chunk with Retry Logic
const uploadChunkWithRetry = async (uploadId: string, chunkIndex: number, chunkData: string, retries = 3): Promise<any> => {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
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

    } catch (err) {
        if (retries > 0) {
            console.warn(`Chunk ${chunkIndex} failed. Retrying in 1.5s... (${retries} attempts left)`);
            await delay(1500); // Wait 1.5s before retrying
            return uploadChunkWithRetry(uploadId, chunkIndex, chunkData, retries - 1);
        } else {
            throw err; // Out of retries, fail for real
        }
    }
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

export const addResource = async (
    resource: Omit<ResourceItem, 'id'> & { fileData?: string }, 
    onProgress?: (percentage: number) => void
): Promise<ResourceItem> => {
  const tempId = Math.random().toString(36).substr(2, 9);
  
  // Optimistic UI update
  const newResourceLocal = { ...resource, id: tempId };
  inMemoryDb = [newResourceLocal as ResourceItem, ...inMemoryDb];

  if (!checkApiConfigured()) return newResourceLocal as ResourceItem;

  try {
    // CHUNKING LOGIC FOR FILES
    // Threshold set low to ensure stability
    if (resource.fileData && resource.fileData.length > 100 * 1024) {
        // 256KB chunks are extremely safe for GAS.
        const CHUNK_SIZE = 256 * 1024; 
        const totalSize = resource.fileData.length;
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const uploadId = `${tempId}_${Date.now()}`; 

        console.log(`Starting chunked upload: ${totalChunks} chunks for ${totalSize} bytes`);

        // Upload chunks sequentially
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunk = resource.fileData.substring(start, end);
            
            // Upload with retry mechanism
            await uploadChunkWithRetry(uploadId, i, chunk);
            
            // Throttle: Add a small delay between chunks to prevent "Too Many Requests" from Google
            await delay(300);
            
            // Calculate and report progress
            const progress = Math.round(((i + 1) / totalChunks) * 100);
            if (onProgress) onProgress(progress);
            
            console.log(`Uploaded chunk ${i + 1}/${totalChunks} (${progress}%)`);
        }

        // Finalize creation
        const resourceWithoutFile = { ...resource, fileData: '' }; 
        
        // Final call needs retry logic too, just in case
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
            return serverItem;
        } else {
             throw new Error(result.message || 'Unknown error');
        }

    } else {
        // STANDARD UPLOAD (Very small files only)
        if (onProgress) onProgress(10); 
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: 'create', ...newResourceLocal }),
        });
        if (onProgress) onProgress(100);
        const result = await response.json();
        
        if (result.status === 'success') {
             return result.data;
        } else {
             throw new Error(result.message);
        }
    }

  } catch (error) {
    console.error("Add failed:", error);
    alert(`Errore durante il caricamento: ${error}. Riprova, magari con un file più piccolo o controlla la connessione.`);
    // Remove the optimistic item if it failed
    inMemoryDb = inMemoryDb.filter(i => i.id !== tempId);
    throw error;
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