
// ISTRUZIONI:
// 1. Incolla questo codice in Code.gs.
// 2. Seleziona '_FORCE_AUTH' ed esegui. Accetta i permessi (anche se li hai già dati, potrebbe chiederne di nuovi per lo storage).
// 3. Fai il Deploy come "Me" e "Chiunque".

function _FORCE_AUTH() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  console.log("Sheet permission: OK");
  
  // FORCE Scope for Storage: Calling this ensures the OAuth scope is requested
  try {
    const used = DriveApp.getStorageUsed();
    console.log("Storage Scope OK. Current usage: " + used);
  } catch(e) {
    console.error("Storage Scope Check Failed: " + e);
  }

  const folders = DriveApp.getFoldersByName("Materiale_Informatica_Uploads"); // Force Drive Scope
  
  // Create temp file to ensure Write permissions
  const tempFile = DriveApp.createFile("temp_auth_check.txt", "Auth Check");
  tempFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  tempFile.setTrashed(true);
  console.log("Drive Write & Share permissions: OK");
}

function setupSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName('Resources');
  if (!sheet) {
    sheet = doc.insertSheet('Resources');
  }
  const headers = ['id', 'title', 'url', 'description', 'year', 'dateAdded', 'category', 'categoryColor', 'type', 'icon', 'coverImage'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function getStorageInfo() {
  // FIXED LIMIT: 15 GB (in bytes) - This is the standard free tier limit
  const LIMIT = 15 * 1024 * 1024 * 1024; 
  
  let used = 0;
  
  // Attempt 1: Get Global Drive Usage
  // This is the most accurate for quota limits (15GB is shared across Gmail/Photos/Drive)
  try {
    used = DriveApp.getStorageUsed();
  } catch (e) {
    console.log("Error fetching global storage: " + e.toString());
  }

  // Attempt 2: Fallback to Folder Calculation
  // If global usage returns 0 (suspicious if files exist) or failed, 
  // we manually calculate the size of the App's Upload Folder.
  // This ensures the user sees at least the size of the shared archive.
  if (!used || used === 0) {
    try {
      const folders = DriveApp.getFoldersByName("Materiale_Informatica_Uploads");
      if (folders.hasNext()) {
        const folder = folders.next();
        const files = folder.getFiles();
        while (files.hasNext()) {
          used += files.next().getSize();
        }
      }
    } catch(e) {
      console.log("Error calculating folder size: " + e.toString());
    }
  }

  return {
    used: used,
    limit: LIMIT
  };
}

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName('Resources');
    if (!sheet) sheet = doc.getSheets()[0];
    
    // READ (GET)
    if (!e.postData || !e.postData.contents) {
      const rows = sheet.getDataRange().getValues();
      let data = [];
      
      if (rows.length > 0) {
        const rawHeaders = rows.shift();
        const headers = rawHeaders.map(h => h.toString().toLowerCase().trim());
        data = rows.map((row, index) => {
          let obj = {};
          headers.forEach((header, colIndex) => { obj[header] = (row[colIndex] !== undefined) ? row[colIndex] : ""; });
          if (!obj.id) obj.id = "row_" + (index + 2); else obj.id = obj.id.toString();
          if (!obj.type) obj.type = 'note';
          
          // Legacy check for Drive links (frontend now handles this too, but good to keep)
          if (obj.coverimage && obj.coverimage.startsWith('http') && obj.coverimage.includes('drive.google.com') && !obj.coverimage.includes('export=view')) {
              const idMatch = obj.coverimage.match(/([a-zA-Z0-9_-]{33,})/);
              if (idMatch) obj.coverimage = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
          }
          
          return {
              id: obj.id, title: obj.title, url: obj.url, description: obj.description,
              year: obj.year, dateAdded: obj.dateadded, category: obj.category,
              categoryColor: obj.categorycolor || "gray", type: obj.type,
              icon: obj.icon, coverImage: obj.coverimage
          };
        }).filter(i => i.title);
      }
      
      return responseJSON({
        status: 'success',
        data: data,
        storage: getStorageInfo()
      });
    }

    // WRITE (POST)
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create';
    const uploadFolder = getOrCreateFolder("Materiale_Informatica_Uploads");

    // Chunk Upload
    if (action === 'upload_chunk') {
        try {
            uploadFolder.createFile(`temp_chunk_${data.uploadId}_${data.chunkIndex}`, data.chunkData, MimeType.PLAIN_TEXT);
            return responseJSON({ status: 'success', chunk: data.chunkIndex });
        } catch (err) { return responseJSON({ status: 'error', message: 'Chunk failed: ' + err.toString() }); }
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return responseJSON({ status: 'error', message: 'Busy' });

    try {
        if (action === 'create') {
            const id = Math.random().toString(36).substr(2, 9);
            const finalIcon = data.icon ? processFile(data.icon, id+"_icon.png", uploadFolder) : "";
            
            let finalCover = data.coverImage || "";
            if (finalCover.length > 49000) {
                 finalCover = processFile(finalCover, id+"_cover.jpg", uploadFolder);
            }
            
            let resUrl = data.url || '';
            if (data.fileData && data.fileData.length > 50) resUrl = processFile(data.fileData, id+"_file.pdf", uploadFolder);
            else if (data.uploadId) {
                 let full = "";
                 for(let i=0; i<data.totalChunks; i++) {
                     const f = uploadFolder.getFilesByName(`temp_chunk_${data.uploadId}_${i}`).next();
                     full += f.getBlob().getDataAsString();
                     f.setTrashed(true);
                 }
                 resUrl = processFile(full, id+"_file.pdf", uploadFolder);
            }

            sheet.appendRow([id, data.title, resUrl, data.description, data.year, new Date().toLocaleDateString('en-GB'), data.category, data.categoryColor, (data.type||'note'), finalIcon, finalCover]);
            return responseJSON({ 
                status: 'success', 
                data: { ...data, id, url: resUrl, coverImage: finalCover },
                storage: getStorageInfo() 
            });
        }
        
        if (action === 'delete') {
             const idx = findRowIndexById(sheet, data.id);
             if (idx > 0) { 
                 // Try to delete file from Drive if it's hosted there to free up space
                 const range = sheet.getRange(idx, 1, 1, 11);
                 const vals = range.getValues()[0];
                 const url = vals[2]; // url column
                 if (url && url.includes('drive.google.com')) {
                    try {
                        const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
                        if (idMatch) DriveApp.getFileById(idMatch[1]).setTrashed(true);
                    } catch(e) {}
                 }

                 sheet.deleteRow(idx); 
                 return responseJSON({ status: 'success', storage: getStorageInfo() }); 
             }
        }

        if (action === 'edit') {
             const idx = findRowIndexById(sheet, data.id);
             if (idx > 0) {
                 const range = sheet.getRange(idx, 1, 1, 11);
                 const vals = range.getValues()[0];
                 
                 let cov = data.coverImage;
                 if (cov === undefined) cov = vals[10];
                 else if (cov.length > 49000) cov = processFile(cov, data.id+"_cov.jpg", uploadFolder);

                 // Update Icon logic
                 let icon = data.icon;
                 if (icon === undefined) icon = vals[9];
                 else if (icon && icon.length > 1000 && icon.startsWith('data:')) {
                     icon = processFile(icon, data.id+"_icon.png", uploadFolder);
                 }
                 
                 range.setValues([[vals[0], data.title, data.url||vals[2], data.description, data.year, vals[5], data.category, data.categoryColor, data.type, icon, cov]]);
                 
                 return responseJSON({ 
                     status: 'success', 
                     data: {...data, coverImage: cov, icon: icon},
                     storage: getStorageInfo()
                 });
             }
        }

    } finally { lock.releaseLock(); }

  } catch (e) { return responseJSON({ status: 'error', message: e.toString() }); }
}

function getOrCreateFolder(name) {
  const f = DriveApp.getFoldersByName(name);
  return f.hasNext() ? f.next() : DriveApp.createFolder(name);
}

function processFile(base64, name, folder) {
    if(!base64 || !base64.startsWith('data:')) return base64||'';
    try {
        const blob = Utilities.newBlob(Utilities.base64Decode(base64.split(',')[1]), base64.split(';')[0].split(':')[1], name);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch(e) { return ''; }
}
function findRowIndexById(sheet, id) {
    const d = sheet.getDataRange().getValues();
    for(let i=1; i<d.length; i++) if(d[i][0] == id) return i+1;
    return -1;
}
function responseJSON(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
