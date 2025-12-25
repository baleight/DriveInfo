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
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
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
    const sheet = doc.getSheetByName('Resources');
    
    // READ REQUEST (GET)
    if (!e.postData || !e.postData.contents) {
      const rows = sheet.getDataRange().getValues();
      const headers = rows.shift();
      const result = rows.map(row => {
        let obj = {};
        headers.forEach((header, index) => obj[header] = row[index]);
        return obj;
      }).filter(item => item.id); // Filter valid rows
      
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
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
        // If data.icon contains a base64 string, upload it. Otherwise assume it's a URL or empty.
        const finalIconUrl = processFile(data.icon, id + "_icon");

        // Handle Main File (Base64 -> Drive) - If provided, it overrides the URL field
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
          data.type || 'note',
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
            // Note: We don't delete files from Drive automatically here to be safe, 
            // but in a production app you might want to via DriveApp.getFileById().setTrashed(true).
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
            const range = sheet.getRange(rowIndex, 1, 1, 11);
            const currentValues = range.getValues()[0];

            // Check if cover image is new base64 or existing url
            let finalCoverImageUrl = currentValues[10]; // Default to existing
            if (data.coverImage && data.coverImage.startsWith('data:image')) {
                 finalCoverImageUrl = processFile(data.coverImage, idToEdit + "_cover");
            } else if (data.coverImage === '') {
                 finalCoverImageUrl = ''; // User removed image
            }

            // Check if icon is new base64 or existing url
            let finalIconUrl = currentValues[9]; // Default to existing
            if (data.icon && data.icon.startsWith('data:image')) {
                finalIconUrl = processFile(data.icon, idToEdit + "_icon");
            } else if (data.icon !== undefined) {
                // If it's a simple URL string or empty, update it
                finalIconUrl = data.icon;
            }

            // Check if a new file was uploaded
            let resourceUrl = data.url; // Default to incoming URL (could be same as old)
            if (data.fileData && data.fileData.startsWith('data:')) {
                 resourceUrl = processFile(data.fileData, idToEdit + "_file");
            }
            // If user didn't upload new file but provided URL, use URL. 

            // Update cells. order matches headers:
            // id(0), title(1), url(2), description(3), year(4), dateAdded(5), category(6), color(7), type(8), icon(9), cover(10)
            
            const updatedRow = [
                currentValues[0], // Keep ID
                data.title,
                resourceUrl,
                data.description,
                data.year,
                currentValues[5], // Keep original Date Added
                data.category,
                data.categoryColor,
                data.type,
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
    // Headers are row 1 (index 0). Data starts row 2.
    // Loop through data to find matching ID in column 0
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            return i + 1; // Return 1-based row index for sheet operations
        }
    }
    return -1;
}

// Generalized function for Images and PDFs
function processFile(base64String, fileNameSuffix) {
    if (!base64String || !base64String.startsWith('data:')) return base64String || '';
    try {
        const parts = base64String.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), mimeType, fileNameSuffix);
        const file = DriveApp.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Return a direct download/view link
        // For images we usually use 'export=view', for PDFs 'view' is also good.
        return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch (e) {
        return '';
    }
}

function responseJSON(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}