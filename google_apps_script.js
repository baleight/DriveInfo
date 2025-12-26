
// !!! IMPORTANTE !!!
// DOPO AVER INCOLLATO QUESTO CODICE:
// 1. Clicca sull'icona "Salva" (Floppy disk).
// 2. Clicca su "Esegui" -> "_FORCE_AUTH" e dai i permessi se richiesto.
// 3. Clicca su "Pubblica" (o "Deploy") -> "Nuovo deployment".
// 4. Seleziona tipo: "Applicazione web".
// 5. Descrizione: "Fix Storage Zero".
// 6. Esegui come: "Utente che accede all'app web" (o "Me").
// 7. Chi ha accesso: "Chiunque" (Anyone).
// 8. Clicca "Pubblica" (Deploy).

function _FORCE_AUTH() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  console.log("Sheet permission: OK");
  
  // FORCE Scope for Storage
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
  const LIMIT = 15 * 1024 * 1024 * 1024; // 15 GB
  let globalUsed = 0;
  let appFolderUsed = 0;

  // 1. Calculate Specific App Folder Usage (Manual Count)
  // We do this ALWAYS now, to ensure we have a fallback baseline immediately after upload
  try {
    const folders = DriveApp.getFoldersByName("Materiale_Informatica_Uploads");
    if (folders.hasNext()) {
      const folder = folders.next();
      const files = folder.getFiles();
      while (files.hasNext()) {
        const f = files.next();
        if (!f.isTrashed()) {
           appFolderUsed += f.getSize();
        }
      }
    }
  } catch(e) {
    console.log("Error calculating folder size: " + e.toString());
  }

  // 2. Get Global Drive Usage
  try {
    globalUsed = DriveApp.getStorageUsed();
    // Ensure it's a number
    if (isNaN(globalUsed)) globalUsed = 0;
  } catch (e) {
    console.log("Error fetching global storage: " + e.toString());
    globalUsed = 0;
  }

  // 3. Logic: Return the MAX value.
  // - If global storage is lagging (shows 0), appFolderUsed (e.g. 50MB) will be shown.
  // - If global storage is working (e.g. 10GB used by Photos), that will be shown.
  const finalUsed = Math.max(globalUsed, appFolderUsed);

  return { 
    used: finalUsed, 
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
                 const range = sheet.getRange(idx, 1, 1, 11);
                 const vals = range.getValues()[0];
                 const url = vals[2];
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
                 
                 const title = (data.title !== undefined) ? data.title : vals[1];
                 const url = data.url || vals[2];
                 const desc = (data.description !== undefined) ? data.description : vals[3];
                 const year = (data.year !== undefined) ? data.year : vals[4];
                 const dateAdded = vals[5];
                 const cat = (data.category !== undefined) ? data.category : vals[6];
                 const color = (data.categoryColor !== undefined) ? data.categoryColor : vals[7];
                 const type = (data.type !== undefined) ? data.type : vals[8];

                 let icon = data.icon;
                 if (icon === undefined) icon = vals[9]; 
                 else if (icon && icon.length > 1000 && icon.startsWith('data:')) icon = processFile(icon, data.id+"_icon.png", uploadFolder);

                 let cov = data.coverImage;
                 if (cov === undefined) cov = vals[10];
                 else if (cov && cov.length > 49000) cov = processFile(cov, data.id+"_cov.jpg", uploadFolder);

                 range.setValues([[vals[0], title, url, desc, year, dateAdded, cat, color, type, icon, cov]]);
                 
                 return responseJSON({ 
                     status: 'success', 
                     data: { ...data, title, url, description: desc, year, category: cat, categoryColor: color, type, icon, coverImage: cov },
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
