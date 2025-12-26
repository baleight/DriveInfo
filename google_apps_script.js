// INSTRUCTIONS:
// 1. Paste this code into Code.gs (REPLACE ALL EXISTING CODE)
// 2. Run 'setupSheet' function once.
// 3. Deploy as Web App (New Version): Execute as Me, Access: Anyone.

function setupSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName('Resources');
  if (!sheet) {
    sheet = doc.insertSheet('Resources');
  }
  
  const headers = [
    'id', 'title', 'url', 'description', 'year', 'dateAdded', 
    'category', 'categoryColor', 'type', 'icon', 'coverImage'
  ];
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Global catch to ensure we always return JSON
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName('Resources');
    if (!sheet) sheet = doc.getSheets()[0];
    
    // --- READ REQUEST (GET) ---
    if (!e.postData || !e.postData.contents) {
      const rows = sheet.getDataRange().getValues();
      if (rows.length === 0) return responseJSON([]);

      const rawHeaders = rows.shift();
      const headers = rawHeaders.map(h => h.toString().toLowerCase().trim());
      
      const result = rows.map((row, index) => {
        let obj = {};
        headers.forEach((header, colIndex) => {
             obj[header] = (row[colIndex] !== undefined) ? row[colIndex] : "";
        });

        if (!obj.id || obj.id === "") obj.id = "row_" + (index + 2); 
        else obj.id = obj.id.toString(); 

        if (!obj.type) obj.type = 'note';
        else obj.type = obj.type.toString().toLowerCase().trim();

        // Fix Drive Image Links
        if (obj.coverimage && typeof obj.coverimage === 'string' && obj.coverimage.includes('drive.google.com') && !obj.coverimage.includes('export=view')) {
            const idMatch = obj.coverimage.match(/([a-zA-Z0-9_-]{33,})/);
            if (idMatch && idMatch[1]) {
                 obj.coverimage = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
            }
        }
        
        return {
            id: obj.id,
            title: obj.title,
            url: obj.url, 
            description: obj.description,
            year: obj.year,
            dateAdded: obj.dateadded || obj.dateAdded || "", 
            category: obj.category,
            categoryColor: obj.categorycolor || obj.categoryColor || "gray",
            type: obj.type,
            icon: obj.icon,
            coverImage: obj.coverimage || obj.coverImage || ""
        };

      }).filter(item => item.title && item.title.toString().trim() !== "");
      
      return responseJSON(result);
    }

    // --- WRITE REQUEST (POST) ---
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create';
    const timestamp = new Date().toLocaleDateString('en-GB');
    
    // Ensure upload folder exists
    const uploadFolder = getOrCreateFolder("Materiale_Informatica_Uploads");

    // 1. CHUNK UPLOAD (NO LOCK NEEDED)
    if (action === 'upload_chunk') {
        try {
            const tempFileName = `temp_chunk_${data.uploadId}_${data.chunkIndex}`;
            uploadFolder.createFile(tempFileName, data.chunkData, MimeType.PLAIN_TEXT);
            return responseJSON({ status: 'success', chunk: data.chunkIndex });
        } catch (chunkError) {
             // Return specific JSON error for chunks
             return responseJSON({ status: 'error', message: 'Chunk save failed: ' + chunkError.toString() });
        }
    }

    // LOCK ONLY FOR SHEET OPERATIONS
    const lock = LockService.getScriptLock();
    const hasLock = lock.tryLock(30000); 

    if (!hasLock) {
        return responseJSON({ status: 'error', message: 'Server busy, please try again.' });
    }

    try {
        // 2. CREATE RESOURCE
        if (action === 'create') {
            const id = Math.random().toString(36).substr(2, 9);
            
            const finalIconUrl = data.icon ? processFile(data.icon, id + "_icon.png", uploadFolder) : "";

            let finalCoverImageUrl = "";
            if (data.coverImage) {
                if (data.coverImage.length < 50000) {
                    finalCoverImageUrl = data.coverImage;
                } else {
                    finalCoverImageUrl = processFile(data.coverImage, id + "_cover.jpg", uploadFolder);
                }
            }

            let resourceUrl = data.url ? data.url.trim() : '';

            // A. SMALL FILE DIRECT UPLOAD
            if (data.fileData && data.fileData.length > 50) {
                resourceUrl = processFile(data.fileData, id + "_" + data.title + ".pdf", uploadFolder);
            } 
            // B. LARGE FILE ASSEMBLY (From Chunks)
            else if (data.uploadId && data.totalChunks > 0) {
                try {
                    let fullBase64 = "";
                    for (let i = 0; i < data.totalChunks; i++) {
                        const files = uploadFolder.getFilesByName(`temp_chunk_${data.uploadId}_${i}`);
                        if (files.hasNext()) {
                            const file = files.next();
                            fullBase64 += file.getBlob().getDataAsString();
                            file.setTrashed(true); // Delete temp chunk
                        } else {
                            throw new Error(`Chunk ${i} missing`);
                        }
                    }
                    
                    if (fullBase64.length > 0) {
                        resourceUrl = processFile(fullBase64, id + "_" + data.title + ".pdf", uploadFolder);
                    }
                } catch (err) {
                    return responseJSON({ status: 'error', message: 'Assembly failed: ' + err.toString() });
                }
            }
            
            if (resourceUrl.length > 2000) {
                return responseJSON({ status: 'error', message: 'File creation failed (URL too long)' });
            }

            const row = [
            id, data.title || '', resourceUrl, data.description || '', data.year || '',
            data.dateAdded || timestamp, data.category || 'Generale', data.categoryColor || 'gray',
            (data.type || 'note').toLowerCase(), finalIconUrl, finalCoverImageUrl
            ];
            
            sheet.appendRow(row);
            
            return responseJSON({ 
                status: 'success', 
                data: { ...data, id, coverImage: finalCoverImageUrl, icon: finalIconUrl, url: resourceUrl } 
            });
        }

        // 3. DELETE RESOURCE
        if (action === 'delete') {
            const rowIndex = findRowIndexById(sheet, data.id);
            if (rowIndex > 0) {
                sheet.deleteRow(rowIndex);
                return responseJSON({ status: 'success', id: data.id });
            }
            return responseJSON({ status: 'error', message: 'ID not found' });
        }

        // 4. EDIT RESOURCE
        if (action === 'edit') {
            const rowIndex = findRowIndexById(sheet, data.id);
            if (rowIndex > 0) {
                const uploadFolder = getOrCreateFolder("Materiale_Informatica_Uploads");
                const range = sheet.getRange(rowIndex, 1, 1, 11);
                const currentValues = range.getValues()[0];

                let finalCoverImageUrl = currentValues[10]; 
                if (data.coverImage && data.coverImage.startsWith('data:image')) {
                    if (data.coverImage.length < 50000) {
                        finalCoverImageUrl = data.coverImage;
                    } else {
                        finalCoverImageUrl = processFile(data.coverImage, data.id + "_cover.jpg", uploadFolder);
                    }
                } else if (data.coverImage === '') { finalCoverImageUrl = ''; }

                let resourceUrl = currentValues[2]; 
                if (data.fileData && data.fileData.startsWith('data:')) {
                    resourceUrl = processFile(data.fileData, data.id + "_file.pdf", uploadFolder);
                } else if (data.url) { resourceUrl = data.url.trim(); }
                
                const updatedRow = [
                    currentValues[0], data.title, resourceUrl, data.description, data.year,
                    currentValues[5], data.category, data.categoryColor,
                    (data.type || 'note').toLowerCase(), currentValues[9], finalCoverImageUrl
                ];
                
                range.setValues([updatedRow]);
                return responseJSON({ 
                    status: 'success', 
                    data: { ...data, coverImage: finalCoverImageUrl, url: resourceUrl } 
                });
            }
            return responseJSON({ status: 'error', message: 'ID not found' });
        }

    } finally {
        lock.releaseLock();
    }

  } catch (e) {
    return responseJSON({ status: 'error', message: 'Global error: ' + e.toString() });
  }
}

// --- HELPERS ---
function findRowIndexById(sheet, id) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) return i + 1; 
    }
    return -1;
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function processFile(base64String, fileName, folder) {
    if (!base64String || !base64String.startsWith('data:')) return base64String || '';
    try {
        const parts = base64String.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), mimeType, fileName);
        
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch (e) {
        return '';
    }
}

function responseJSON(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}