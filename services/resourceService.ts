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

// Helper to upload a single chunk
const uploadChunk = async (uploadId: string, chunkIndex: number, chunkData: string) => {
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
    const res = await response.json();
    if (res.status !== 'success') throw new Error(`Chunk ${chunkIndex} upload failed`);
    return res;
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

export const addResource = async (resource: Omit<ResourceItem, 'id'> & { fileData?: string }): Promise<ResourceItem> => {
  const tempId = Math.random().toString(36).substr(2, 9);
  const newResourceLocal = { ...resource, id: tempId };

  // Update local DB instantly for UI responsiveness (Optimistic UI)
  inMemoryDb = [newResourceLocal as ResourceItem, ...inMemoryDb];

  if (!checkApiConfigured()) return newResourceLocal as ResourceItem;

  try {
    // CHUNKING LOGIC FOR LARGE FILES
    // If fileData exists and is larger than ~2MB, use chunking to bypass GAS limits
    if (resource.fileData && resource.fileData.length > 2 * 1024 * 1024) {
        const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
        const totalSize = resource.fileData.length;
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const uploadId = `${tempId}_${Date.now()}`; // Unique upload session ID

        console.log(`Starting chunked upload: ${totalChunks} chunks for ${totalSize} bytes`);

        // Upload chunks sequentially
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunk = resource.fileData.substring(start, end);
            
            await uploadChunk(uploadId, i, chunk);
            console.log(`Uploaded chunk ${i + 1}/${totalChunks}`);
        }

        // Finalize creation pointing to the chunks
        const resourceWithoutFile = { ...resource, fileData: '' }; // Don't send fileData again
        
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ 
                action: 'create', 
                ...resourceWithoutFile, 
                uploadId: uploadId, // Backend will use this to reassemble
                totalChunks: totalChunks
            }),
        });
        const result = await response.json();
        return result.status === 'success' ? result.data : (newResourceLocal as ResourceItem);

    } else {
        // STANDARD UPLOAD (Small files)
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: 'create', ...newResourceLocal }),
        });
        const result = await response.json();
        return result.status === 'success' ? result.data : (newResourceLocal as ResourceItem);
    }

  } catch (error) {
    console.error("Add failed:", error);
    alert("Errore di connessione con Google Sheet. Riprova.");
    return newResourceLocal as ResourceItem;
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