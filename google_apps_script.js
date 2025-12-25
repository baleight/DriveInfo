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
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    // Try to get 'Resources', fallback to the first sheet if not found (robustness for existing sheets)
    let sheet = doc.getSheetByName('Resources');
    if (!sheet) {
        sheet = doc.getSheets()[0];
    }
    
    // READ REQUEST (GET)
    if (!e.postData || !e.postData.contents) {
      const rows = sheet.getDataRange().getValues();
      
      // Handle empty sheet case
      if (rows.length === 0) return responseJSON([]);

      // Normalize headers to lowercase to allow case-insensitive matching (e.g., "Title" vs "title")
      const rawHeaders = rows.shift();
      const headers = rawHeaders.map(h => h.toString().toLowerCase().trim());
      
      const result = rows.map((row, index) => {
        let obj = {};
        headers.forEach((header, colIndex) => {
             // Safe assignment if row has data
             obj[header] = (row[colIndex] !== undefined) ? row[colIndex] : "";
        });

        // 1. ROBUST ID: If ID is missing (manual entry), generate a temporary one based on row index
        if (!obj.id || obj.id === "") {
            obj.id = "row_" + (index + 2); 
        } else {
            obj.id = obj.id.toString(); // Ensure ID is always a string
        }

        // 2. ROBUST TYPE: Normalize type to lowercase and default to 'note' if missing
        if (!obj.type) {
            obj.type = 'note';
        } else {
            obj.type = obj.type.toString().toLowerCase().trim();
        }

        return obj;
      }).filter(item => item.title && item.title.toString().trim() !== ""); // Only filter out rows that strictly have NO title
      
      return responseJSON(result);
    }

    // WRITE REQUEST (POST)
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create'; // 'create', 'edit', 'delete'
    const timestamp = new Date().toLocaleDateString('en-GB');

    // --- CREATE ---
    if (action === 'create') {
        const id = Math.random().toString(36).substr(2, 9);
        
        // Handle Cover Image (Base64 -> Drive)
        const finalCoverImageUrl = processFile(data.coverImage, id + "_cover");
        
        // Handle Icon Image (Base64 -> Drive)
        const finalIconUrl = processFile(data.icon, id + "_icon");

        // Handle Main File (Base64 -> Drive)
        let resourceUrl = data.url;
        if (data.fileData) {
            resourceUrl = processFile(data.fileData, id + "_file");
        }
        
        const row = [
          id,
          data.title || '',
          resourceUrl || '',
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

            // Image processing logic...
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

            let resourceUrl = data.url;
            if (data.fileData && data.fileData.startsWith('data:')) {
                 resourceUrl = processFile(data.fileData, idToEdit + "_file");
            }
            
            const updatedRow = [
                currentValues[0], // Keep ID
                data.title,
                resourceUrl,
                data.description,
                data.year,
                currentValues[5], // Keep original Date Added
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