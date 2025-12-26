// ISTRUZIONI:
// 1. Incolla questo codice in Code.gs.
// 2. Seleziona '_FORCE_AUTH' ed esegui. Accetta i permessi.
// 3. Fai il Deploy come "Me" e "Chiunque".

function _FORCE_AUTH() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  console.log("Sheet permission: OK");
  const folders = DriveApp.getFoldersByName("Materiale_Informatica_Uploads"); // Force Drive Scope
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
      if (rows.length === 0) return responseJSON([]);
      const rawHeaders = rows.shift();
      const headers = rawHeaders.map(h => h.toString().toLowerCase().trim());
      const result = rows.map((row, index) => {
        let obj = {};
        headers.forEach((header, colIndex) => { obj[header] = (row[colIndex] !== undefined) ? row[colIndex] : ""; });
        if (!obj.id) obj.id = "row_" + (index + 2); else obj.id = obj.id.toString();
        if (!obj.type) obj.type = 'note';
        
        // Fix legacy drive images if any exist
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
      return responseJSON(result);
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
            
            // COVER IMAGE: We now prefer the direct base64 string because frontend compresses it
            let finalCover = data.coverImage || "";
            // Only upload to drive if it's somehow massive (fallback), otherwise keep raw string
            if (finalCover.length > 49000) {
                 finalCover = processFile(finalCover, id+"_cover.jpg", uploadFolder);
            }
            
            let resUrl = data.url || '';
            if (data.fileData && data.fileData.length > 50) resUrl = processFile(data.fileData, id+"_file.pdf", uploadFolder);
            else if (data.uploadId) {
                 // Reassemble chunks
                 let full = "";
                 for(let i=0; i<data.totalChunks; i++) {
                     const f = uploadFolder.getFilesByName(`temp_chunk_${data.uploadId}_${i}`).next();
                     full += f.getBlob().getDataAsString();
                     f.setTrashed(true);
                 }
                 resUrl = processFile(full, id+"_file.pdf", uploadFolder);
            }

            sheet.appendRow([id, data.title, resUrl, data.description, data.year, new Date().toLocaleDateString('en-GB'), data.category, data.categoryColor, (data.type||'note'), finalIcon, finalCover]);
            return responseJSON({ status: 'success', data: { ...data, id, url: resUrl, coverImage: finalCover } });
        }
        
        if (action === 'delete') {
             const idx = findRowIndexById(sheet, data.id);
             if (idx > 0) { sheet.deleteRow(idx); return responseJSON({ status: 'success' }); }
        }

        if (action === 'edit') {
             const idx = findRowIndexById(sheet, data.id);
             if (idx > 0) {
                 const range = sheet.getRange(idx, 1, 1, 11);
                 const vals = range.getValues()[0];
                 
                 let cov = data.coverImage;
                 // If undefined, keep old. If empty string, clear it. If string, update.
                 if (cov === undefined) cov = vals[10];
                 else if (cov.length > 49000) cov = processFile(cov, data.id+"_cov.jpg", uploadFolder);
                 
                 range.setValues([[vals[0], data.title, data.url||vals[2], data.description, data.year, vals[5], data.category, data.categoryColor, data.type, vals[9], cov]]);
                 return responseJSON({ status: 'success', data: {...data, coverImage: cov} });
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