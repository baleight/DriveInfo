
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

const RESOURCE_SHEET_NAME = 'Resources';
const SUBJECT_SHEET_NAME = 'Materie';
const DEFAULT_SUBJECTS = [
  'Generale',
  'Calcolo numerico',
  'Linguaggi C/C++ Python',
  'Fisica',
  'Ingegneria del Software',
  'Reti',
  'Gestioni Informazioni',
  'Ricerca operativa OLI',
  'Architettura dei calcolatori'
];
const ALLOWED_COLORS = ['red', 'yellow', 'brown', 'pink', 'green', 'gray', 'default', 'purple', 'orange', 'blue'];
const ALLOWED_TYPES = ['note', 'book'];
const MAX_TITLE_LENGTH = 220;
const MAX_TEXT_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 800;
const MAX_SUBJECT_LENGTH = 90;
const MAX_INLINE_IMAGE_CHARS = 500 * 1024;
const MAX_PDF_DATA_CHARS = 75 * 1024 * 1024;
const MAX_CHUNK_CHARS = 2200 * 1024;
const MAX_TOTAL_CHUNKS = 40;
const STORAGE_CACHE_SECONDS = 60;

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

function setupSheet(syncExisting, refreshValidation) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
  if (!sheet) {
    sheet = doc.insertSheet(RESOURCE_SHEET_NAME);
  }
  const headers = ['id', 'title', 'url', 'description', 'year', 'dateAdded', 'category', 'categoryColor', 'type', 'icon', 'coverImage'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  setupSubjectsSheet(doc, false);
  if (syncExisting !== false) syncSubjectsFromResources(doc, sheet);
  if (refreshValidation !== false) applyCategoryValidation(doc, sheet);
  return sheet;
}

function setupSubjectsSheet(doc, refreshValidation) {
  let sheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  let created = false;
  if (!sheet) {
    sheet = doc.insertSheet(SUBJECT_SHEET_NAME);
    created = true;
  }

  const headers = ['name', 'color', 'active', 'dateAdded'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    created = true;
  }

  let changed = false;
  if (created || refreshValidation !== false) {
    DEFAULT_SUBJECTS.forEach(function(subject) {
      if (addSubjectIfMissing(sheet, subject, 'gray', false)) changed = true;
    });
  }

  if (changed && refreshValidation !== false) {
    const resourcesSheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
    if (resourcesSheet) applyCategoryValidation(doc, resourcesSheet);
  }
  return sheet;
}

function applyCategoryValidation(doc, resourcesSheet) {
  const subjectsSheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  if (!resourcesSheet || !subjectsSheet) return;

  const maxRows = Math.max(resourcesSheet.getMaxRows() - 1, 1);
  const categoryRange = resourcesSheet.getRange(2, 7, maxRows, 1);
  const subjectsRange = subjectsSheet.getRange(2, 1, Math.max(subjectsSheet.getMaxRows() - 1, 1), 1);
  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInRange(subjectsRange, true)
    .setAllowInvalid(true)
    .setHelpText('Scegli una o piu materie dal foglio Materie. Per piu materie nella stessa cella usa la virgola, es: Fisica, Reti.')
    .build();

  categoryRange.setDataValidation(validation);
  resourcesSheet.getRange(1, 7).setNote('Collegata al foglio Materie. La cella puo contenere piu materie separate da virgola.');
}

function getSubjects(doc) {
  const sheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  return rows
    .map(function(row) {
      return {
        name: (row[0] || '').toString().trim(),
        color: (row[1] || 'gray').toString().trim(),
        active: row[2] === false ? false : true,
        dateAdded: row[3] || ''
      };
    })
    .filter(function(subject) { return subject.name && subject.active; });
}

function saveSubjectsFromCategory(doc, category, color) {
  setupSubjectsSheet(doc, false);
  const sheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  let changed = false;
  splitCategories(category).forEach(function(subject) {
    if (addSubjectIfMissing(sheet, subject, color || 'gray', false)) changed = true;
  });
  if (changed) {
    const resourcesSheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
    if (resourcesSheet) applyCategoryValidation(doc, resourcesSheet);
  }
}

function syncSubjectsFromResources(doc, resourcesSheet) {
  const subjectsSheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  if (!resourcesSheet || resourcesSheet.getLastRow() < 2) return;

  let changed = false;
  const rows = resourcesSheet.getRange(2, 7, resourcesSheet.getLastRow() - 1, 2).getValues();
  rows.forEach(function(row) {
    const category = row[0];
    const color = row[1] || 'gray';
    splitCategories(category).forEach(function(subject) {
      if (addSubjectIfMissing(subjectsSheet, subject, color, false)) changed = true;
    });
  });
  if (changed) applyCategoryValidation(doc, resourcesSheet);
}

function addSubjectIfMissing(sheet, subjectName, color, refreshValidation) {
  if (!sheet) return false;
  subjectName = cleanText(subjectName, MAX_SUBJECT_LENGTH);
  const normalizedName = normalizeSubject(subjectName);
  if (!normalizedName) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const exists = values.some(function(row) {
      return normalizeSubject(row[0]) === normalizedName;
    });
    if (exists) return false;
  }

  sheet.appendRow([
    subjectName,
    cleanColor(color),
    true,
    new Date().toLocaleDateString('en-GB')
  ]);

  if (refreshValidation !== false) {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const resourcesSheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
    if (resourcesSheet) applyCategoryValidation(doc, resourcesSheet);
  }
  return true;
}

function updateSubject(doc, originalName, newName, color, active) {
  const sheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  if (!sheet) throw new Error('Foglio Materie non trovato');

  originalName = cleanText(originalName, MAX_SUBJECT_LENGTH);
  newName = cleanText(newName, MAX_SUBJECT_LENGTH);
  if (!originalName || !newName) throw new Error('Nome materia obbligatorio');

  const rowIndex = findSubjectRowIndex(sheet, originalName);
  if (rowIndex < 0) throw new Error('Materia non trovata');

  const current = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
  const safeColor = cleanColor(color !== undefined ? color : current[1]);
  const safeActive = active === false ? false : true;
  sheet.getRange(rowIndex, 1, 1, 4).setValues([[newName, safeColor, safeActive, current[3] || new Date().toLocaleDateString('en-GB')]]);

  if (normalizeSubject(originalName) !== normalizeSubject(newName)) {
    updateResourceCategorySubject(doc, originalName, newName);
  }

  const resourcesSheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
  if (resourcesSheet) applyCategoryValidation(doc, resourcesSheet);
}

function deactivateSubject(doc, subjectName) {
  const sheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
  if (!sheet) throw new Error('Foglio Materie non trovato');

  const rowIndex = findSubjectRowIndex(sheet, subjectName);
  if (rowIndex < 0) throw new Error('Materia non trovata');

  sheet.getRange(rowIndex, 3).setValue(false);
  const resourcesSheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
  if (resourcesSheet) applyCategoryValidation(doc, resourcesSheet);
}

function findSubjectRowIndex(sheet, subjectName) {
  const normalizedName = normalizeSubject(subjectName);
  if (!normalizedName || sheet.getLastRow() < 2) return -1;

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (normalizeSubject(values[i][0]) === normalizedName) return i + 2;
  }
  return -1;
}

function updateResourceCategorySubject(doc, oldName, newName) {
  const sheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;

  const range = sheet.getRange(2, 7, sheet.getLastRow() - 1, 1);
  const values = range.getValues();
  const oldKey = normalizeSubject(oldName);
  let changed = false;

  const nextValues = values.map(function(row) {
    const nextCategory = splitCategories(row[0]).map(function(subject) {
      return normalizeSubject(subject) === oldKey ? newName : subject;
    }).join(', ');
    if (nextCategory !== row[0]) changed = true;
    return [nextCategory];
  });

  if (changed) range.setValues(nextValues);
}

function splitCategories(category) {
  return (category || '')
    .toString()
    .split(',')
    .map(function(item) { return item.trim(); })
    .filter(function(item) { return item; });
}

function normalizeSubject(subjectName) {
  return (subjectName || '').toString().trim().toLowerCase();
}

function cleanText(value, maxLength) {
  return (value || '')
    .toString()
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength);
}

function cleanColor(color) {
  color = cleanText(color, 20).toLowerCase();
  return ALLOWED_COLORS.indexOf(color) >= 0 ? color : 'gray';
}

function cleanType(type) {
  type = cleanText(type, 20).toLowerCase();
  return ALLOWED_TYPES.indexOf(type) >= 0 ? type : 'note';
}

function cleanUrl(url) {
  url = cleanText(url, 2000);
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : '';
}

function cleanCategory(category) {
  const seen = {};
  return splitCategories(category)
    .map(function(subject) { return cleanText(subject, MAX_SUBJECT_LENGTH); })
    .filter(function(subject) {
      const key = normalizeSubject(subject);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    })
    .join(', ')
    .substring(0, MAX_CATEGORY_LENGTH);
}

function cleanResourcePayload(data, fallback) {
  fallback = fallback || {};
  return {
    title: cleanText(data.title !== undefined ? data.title : fallback.title, MAX_TITLE_LENGTH),
    url: cleanUrl(data.url !== undefined ? data.url : fallback.url),
    description: cleanText(data.description !== undefined ? data.description : fallback.description, MAX_TEXT_LENGTH),
    year: cleanText(data.year !== undefined ? data.year : fallback.year, 80),
    category: cleanCategory(data.category !== undefined ? data.category : fallback.category),
    categoryColor: cleanColor(data.categoryColor !== undefined ? data.categoryColor : fallback.categoryColor),
    type: cleanType(data.type !== undefined ? data.type : fallback.type),
    icon: data.icon !== undefined ? data.icon : fallback.icon,
    coverImage: data.coverImage !== undefined ? data.coverImage : fallback.coverImage
  };
}

function isValidUploadId(uploadId) {
  return /^[A-Za-z0-9_-]{6,80}$/.test((uploadId || '').toString());
}

function getStorageInfo(forceRefresh) {
  const LIMIT = 15 * 1024 * 1024 * 1024; // 15 GB
  const cacheKey = 'storage_info_v1';
  const cache = CacheService.getScriptCache();
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
  }

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

  const result = { used: finalUsed, limit: LIMIT };
  cache.put(cacheKey, JSON.stringify(result), STORAGE_CACHE_SECONDS);
  return result;
}

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    e = e || {};
    let data = null;
    let action = 'create';
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
      action = data.action || 'create';

      if (action === 'upload_chunk') {
        const uploadFolder = getOrCreateFolder("Materiale_Informatica_Uploads");
        try {
            if (!isValidUploadId(data.uploadId)) throw new Error('Invalid upload id');
            const chunkIndex = Number(data.chunkIndex);
            if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= MAX_TOTAL_CHUNKS) throw new Error('Invalid chunk index');
            if (!data.chunkData || data.chunkData.length > MAX_CHUNK_CHARS) throw new Error('Invalid chunk size');
            uploadFolder.createFile(`temp_chunk_${data.uploadId}_${data.chunkIndex}`, data.chunkData, MimeType.PLAIN_TEXT);
            return responseJSON({ status: 'success', chunk: data.chunkIndex });
        } catch (err) { return responseJSON({ status: 'error', message: 'Chunk failed: ' + err.toString() }); }
      }
    }

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    setupSheet(false, false);
    let sheet = doc.getSheetByName(RESOURCE_SHEET_NAME);
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
        subjects: getSubjects(doc),
        storage: getStorageInfo()
      });
    }

    // WRITE (POST)
    if (action === 'list_subjects') {
        return responseJSON({ status: 'success', subjects: getSubjects(doc) });
    }

    if (action === 'create_subject') {
        const subjectsSheet = doc.getSheetByName(SUBJECT_SHEET_NAME);
        addSubjectIfMissing(subjectsSheet, data.name, data.color || 'gray', true);
        return responseJSON({ status: 'success', subjects: getSubjects(doc) });
    }

    if (action === 'update_subject') {
        updateSubject(doc, data.originalName, data.name, data.color, data.active);
        return responseJSON({ status: 'success', subjects: getSubjects(doc) });
    }

    if (action === 'delete_subject') {
        deactivateSubject(doc, data.name);
        return responseJSON({ status: 'success', subjects: getSubjects(doc) });
    }

    const uploadFolder = getOrCreateFolder("Materiale_Informatica_Uploads");

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return responseJSON({ status: 'error', message: 'Busy' });

    try {
        if (action === 'create') {
            const clean = cleanResourcePayload(data);
            if (!clean.title) return responseJSON({ status: 'error', message: 'Titolo obbligatorio' });
            if (!clean.category) return responseJSON({ status: 'error', message: 'Seleziona almeno una materia' });
            const id = Math.random().toString(36).substr(2, 9);
            const finalIcon = clean.icon ? processFile(clean.icon, id+"_icon.png", uploadFolder, ['image/png', 'image/jpeg', 'image/webp'], MAX_INLINE_IMAGE_CHARS) : "";
            
            let finalCover = clean.coverImage || "";
            if (finalCover.length > 49000) {
                 finalCover = processFile(finalCover, id+"_cover.jpg", uploadFolder, ['image/png', 'image/jpeg', 'image/webp'], MAX_INLINE_IMAGE_CHARS);
            }
            
            let resUrl = clean.url || '';
            if (data.fileData && data.fileData.length > 50) {
                resUrl = processFile(data.fileData, id+"_file.pdf", uploadFolder, ['application/pdf'], MAX_PDF_DATA_CHARS);
            }
            else if (data.uploadId) {
                 if (!isValidUploadId(data.uploadId)) throw new Error('Invalid upload id');
                 const totalChunks = Number(data.totalChunks);
                 if (!Number.isInteger(totalChunks) || totalChunks <= 0 || totalChunks > MAX_TOTAL_CHUNKS) throw new Error('Invalid chunk count');
                 let full = "";
                 for(let i=0; i<totalChunks; i++) {
                     const files = uploadFolder.getFilesByName(`temp_chunk_${data.uploadId}_${i}`);
                     if (!files.hasNext()) throw new Error('Missing upload chunk ' + i);
                     const f = files.next();
                     full += f.getBlob().getDataAsString();
                     f.setTrashed(true);
                 }
                 resUrl = processFile(full, id+"_file.pdf", uploadFolder, ['application/pdf'], MAX_PDF_DATA_CHARS);
            }
            if (!resUrl) return responseJSON({ status: 'error', message: 'URL o PDF obbligatorio' });

            sheet.appendRow([id, clean.title, resUrl, clean.description, clean.year, new Date().toLocaleDateString('en-GB'), clean.category, clean.categoryColor, clean.type, finalIcon, finalCover]);
            saveSubjectsFromCategory(doc, clean.category, clean.categoryColor);
            return responseJSON({ 
                status: 'success', 
                data: { ...clean, id, url: resUrl, coverImage: finalCover },
                subjects: getSubjects(doc),
                storage: getStorageInfo(true) 
            });
        }
        
        if (action === 'delete') {
             const idx = findRowIndexById(sheet, data.id);
             if (idx > 0) { 
                 const range = sheet.getRange(idx, 1, 1, 11);
                 const vals = range.getValues()[0];
                 trashDriveFileFromUrl(vals[2]);
                 trashDriveFileFromUrl(vals[9]);
                 trashDriveFileFromUrl(vals[10]);
                 sheet.deleteRow(idx); 
                 return responseJSON({ status: 'success', storage: getStorageInfo(true) }); 
             }
        }

        if (action === 'edit') {
             const idx = findRowIndexById(sheet, data.id);
             if (idx > 0) {
                 const range = sheet.getRange(idx, 1, 1, 11);
                 const vals = range.getValues()[0];
                 
                 const clean = cleanResourcePayload(data, {
                   title: vals[1],
                   url: vals[2],
                   description: vals[3],
                   year: vals[4],
                   category: vals[6],
                   categoryColor: vals[7],
                   type: vals[8],
                   icon: vals[9],
                   coverImage: vals[10]
                 });
                 if (!clean.title) return responseJSON({ status: 'error', message: 'Titolo obbligatorio' });
                 if (!clean.category) return responseJSON({ status: 'error', message: 'Seleziona almeno una materia' });
                 const title = clean.title;
                 const url = clean.url || vals[2];
                 const desc = clean.description;
                 const year = clean.year;
                 const dateAdded = vals[5];
                 const cat = clean.category;
                 const color = clean.categoryColor;
                 const type = clean.type;

                 let icon = clean.icon;
                 if (icon === undefined) icon = vals[9]; 
                 else if (icon && icon.length > 1000 && icon.startsWith('data:')) icon = processFile(icon, data.id+"_icon.png", uploadFolder, ['image/png', 'image/jpeg', 'image/webp'], MAX_INLINE_IMAGE_CHARS);

                 let cov = clean.coverImage;
                 if (cov === undefined) cov = vals[10];
                 else if (cov && cov.length > 49000) cov = processFile(cov, data.id+"_cov.jpg", uploadFolder, ['image/png', 'image/jpeg', 'image/webp'], MAX_INLINE_IMAGE_CHARS);

                 range.setValues([[vals[0], title, url, desc, year, dateAdded, cat, color, type, icon, cov]]);
                 saveSubjectsFromCategory(doc, cat, color);
                 
                 return responseJSON({ 
                     status: 'success', 
                     data: { ...clean, id: vals[0], title, url, description: desc, year, category: cat, categoryColor: color, type, icon, coverImage: cov },
                     subjects: getSubjects(doc),
                     storage: getStorageInfo(true)
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

function processFile(base64, name, folder, allowedMimeTypes, maxChars) {
    if(!base64 || !base64.startsWith('data:')) return base64||'';
    try {
        if (maxChars && base64.length > maxChars) throw new Error('File too large');
        const parts = base64.split(',');
        if (parts.length < 2) throw new Error('Invalid data URL');
        const mimeType = parts[0].split(';')[0].split(':')[1];
        if (allowedMimeTypes && allowedMimeTypes.indexOf(mimeType) === -1) throw new Error('Unsupported file type');

        const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), mimeType, name);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch(e) { return ''; }
}
function trashDriveFileFromUrl(url) {
    if (!url || !url.toString().includes('drive.google.com')) return;
    try {
        const idMatch = url.toString().match(/id=([a-zA-Z0-9_-]+)/) || url.toString().match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch) DriveApp.getFileById(idMatch[1]).setTrashed(true);
    } catch(e) {}
}
function findRowIndexById(sheet, id) {
    const d = sheet.getDataRange().getValues();
    for(let i=1; i<d.length; i++) if(d[i][0] == id) return i+1;
    return -1;
}
function responseJSON(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
