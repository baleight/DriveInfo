// INSTRUCTIONS:
// 1. Paste this code into Code.gs (REPLACE ALL EXISTING CODE)
// 2. Run 'setupSheet' function once if you haven't already.
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
  
  // Set headers only if the sheet is empty
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
  // Lock increased to 2 minutes to handle large file assembly
  const lock = LockService.getScriptLock();
  lock.tryLock(120000); 
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName('Resources');
    if (!sheet) {
        sheet = doc.getSheets()[0];
    }
    
    // READ REQUEST (GET)
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

        if (!obj.id || obj.id === "") {
            obj.id = "row_" + (index + 2); 
        } else {
            obj.id = obj.id.toString(); 
        }

        if (!obj.type) {
            obj.type = 'note';
        } else {
            obj.type = obj.type.toString().toLowerCase().trim();
        }

        // Fix Manual Drive Links
        if (obj.coverimage && typeof obj.coverimage === 'string' && obj.coverimage.includes('drive.google.com')) {
            if (!obj.coverimage.includes('export=view')) {
                const idMatch = obj.coverimage.match(/([a-zA-Z0-9_-]{33,})/);
                if (idMatch && idMatch[1]) {
                     obj.coverimage = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                }
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

    // WRITE REQUEST (POST)
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create';
    const timestamp = new Date().toLocaleDateString('en-GB');

    // --- HANDLE CHUNK UPLOAD ---
    // Stores parts of the file in temporary text files in Drive
    if (action === 'upload_chunk') {
        const tempFileName = `temp_chunk_${data.uploadId}_${data.chunkIndex}`;
        // Store as text file to avoid blob overheads until final assembly
        DriveApp.createFile(tempFileName, data.chunkData, MimeType.PLAIN_TEXT);
        return responseJSON({ status: 'success', chunk: data.chunkIndex });
    }

    // --- CREATE ---
    if (action === 'create') {
        const id = Math.random().toString(36).substr(2, 9);
        
        // Handle Cover Image (Base64 -> Drive)
        const finalCoverImageUrl = processFile(data.coverImage, id + "_cover");
        // Handle Icon Image (Base64 -> Drive)
        const finalIconUrl = processFile(data.icon, id + "_icon");

        let resourceUrl = data.url ? data.url.trim() : '';

        // 1. STANDARD UPLOAD (Small files sent directly)
        if (data.fileData && data.fileData.length > 50) {
            resourceUrl = processFile(data.fileData, id + "_file");
        } 
        // 2. CHUNKED ASSEMBLY (Large files)
        else if (data.uploadId && data.totalChunks > 0) {
            try {
                // Reassemble base64 string from temp files
                let fullBase64 = "";
                for (let i = 0; i < data.totalChunks; i++) {
                    const tempFiles = DriveApp.getFilesByName(`temp_chunk_${data.uploadId}_${i}`);
                    if (tempFiles.hasNext()) {
                        const file = tempFiles.next();
                        fullBase64 += file.getBlob().getDataAsString();
                        file.setTrashed(true); // Clean up temp file
                    }
                }
                
                if (fullBase64.length > 0) {
                   resourceUrl = processFile(fullBase64, id + "_file");
                }
            } catch (err) {
                return responseJSON({ status: 'error', message: 'Assembly failed: ' + err.toString() });
            }
        }
        
        const row = [
          id,
          data.title || '',
          resourceUrl,
          data.description || '',
          data.year || '',
          data.dateAdded || timestamp,
          data.category || 'Generale',
          data.categoryColor || 'gray',
          (data.type || 'note').toLowerCase(),
          finalIconUrl || '',
          finalCoverImageUrl
        ];
        sheet.appendRow(row);
        
        return responseJSON({ status: 'success', data: { ...data, id, coverImage: finalCoverImageUrl, icon: finalIconUrl, url: resourceUrl } });
    }

    // --- DELETE ---
    if (action === 'delete') {
        const idToDelete = data.id;
        const rowIndex = findRowIndexById(sheet, idToDelete);
        
        if (rowIndex > 0) {
            sheet.deleteRow(rowIndex);
            return responseJSON({ status: 'success', id: idToDelete });
        } else {
            return responseJSON({ status: 'error', message: 'ID not found' });
        }
    }

    // --- EDIT ---
    if (action === 'edit') {
        const idToEdit = data.id;
        const rowIndex = findRowIndexById(sheet, idToEdit);
        
        if (rowIndex > 0) {
            const range = sheet.getRange(rowIndex, 1, 1, 11); // Assuming 11 columns
            const currentValues = range.getValues()[0];

            let finalCoverImageUrl = currentValues[10]; 
            if (data.coverImage && data.coverImage.startsWith('data:image')) {
                 finalCoverImageUrl = processFile(data.coverImage, idToEdit + "_cover");
            } else if (data.coverImage === '') {
                 finalCoverImageUrl = ''; 
            }

            let finalIconUrl = currentValues[9];
            if (data.icon && data.icon.startsWith('data:image')) {
                finalIconUrl = processFile(data.icon, idToEdit + "_icon");
            } else if (data.icon !== undefined) {
                finalIconUrl = data.icon;
            }

            let resourceUrl = currentValues[2]; 
            if (data.fileData && data.fileData.startsWith('data:')) {
                 resourceUrl = processFile(data.fileData, idToEdit + "_file");
            } else if (data.url) {
                resourceUrl = data.url.trim();
            }
            
            const updatedRow = [
                currentValues[0], 
                data.title,
                resourceUrl,
                data.description,
                data.year,
                currentValues[5], 
                data.category,
                data.categoryColor,
                (data.type || 'note').toLowerCase(),
                finalIconUrl,
                finalCoverImageUrl
            ];
            
            range.setValues([updatedRow]);
            return responseJSON({ status: 'success', data: { ...data, coverImage: finalCoverImageUrl, icon: finalIconUrl, url: resourceUrl } });
        } else {
             return responseJSON({ status: 'error', message: 'ID not found' });
        }
    }

  } catch (e) {
    return responseJSON({ status: 'error', message: e.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- HELPERS ---

function findRowIndexById(sheet, id) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            return i + 1; 
        }
    }
    return -1;
}

function processFile(base64String, fileNameSuffix) {
    if (!base64String || !base64String.startsWith('data:')) return base64String || '';
    try {
        const parts = base64String.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), mimeType, fileNameSuffix);
        const file = DriveApp.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch (e) {
        return '';
    }
}

function responseJSON(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}