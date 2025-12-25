// INSTRUCTIONS:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code into Code.gs (REPLACE ALL EXISTING CODE)
// 4. Run the 'setupSheet' function once to create headers
// 5. Deploy as Web App (New Version):
//    - Execute as: Me
//    - Who has access: Anyone

function setupSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName('Resources');
  if (!sheet) {
    sheet = doc.insertSheet('Resources');
  }
  
  // Define Headers
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
  lock.tryLock(30000); // Increased lock time for file operations
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Resources');
    
    // HANDLE POST (ADD ROW)
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      
      // Generate ID if missing
      const id = data.id || Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toLocaleDateString('en-GB');
      
      // IMAGE HANDLING
      // If coverImage is a base64 string, upload it to Drive and get the URL
      let finalCoverImageUrl = '';
      if (data.coverImage && data.coverImage.startsWith('data:image')) {
        try {
          finalCoverImageUrl = uploadImageToDrive(data.coverImage, id);
        } catch (imgError) {
          // If upload fails, just leave it blank to not break the whole row insert
          finalCoverImageUrl = ''; 
        }
      } else {
        // Assume it's already a URL or empty
        finalCoverImageUrl = data.coverImage || '';
      }
      
      // Map object to array based on headers
      const row = [
        id,
        data.title || '',
        data.url || '',
        data.description || '',
        data.year || '',
        data.dateAdded || timestamp,
        data.category || 'Generale',
        data.categoryColor || 'gray',
        data.type || 'note',
        data.icon || '',
        finalCoverImageUrl // Use the Drive URL
      ];
      
      sheet.appendRow(row);
      
      // Return the new object with the correct URL
      return ContentService
        .createTextOutput(JSON.stringify({ 
            status: 'success', 
            data: { ...data, id, coverImage: finalCoverImageUrl } 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // HANDLE GET (READ ROWS)
    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift(); // Remove header row
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    }).filter(item => item.title && item.url); // Filter empty rows
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Helper to convert Base64 to Drive File
function uploadImageToDrive(base64String, id) {
  // 1. Extract content type and data
  // base64String looks like: "data:image/jpeg;base64,....."
  const parts = base64String.split(',');
  const mimeType = parts[0].match(/:(.*?);/)[1];
  const data = parts[1];
  
  // 2. Decode
  const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, "cover_" + id);
  
  // 3. Create file in Root or specific folder
  // Note: To use a specific folder: DriveApp.getFolderById('YOUR_ID').createFile(blob)
  const file = DriveApp.createFile(blob);
  
  // 4. Make it public so the website can see it
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // 5. Return a direct link (Thumbnail link is usually best for img tags)
  // We use getThumbnailLink() and replace the size parameter to get a decent size
  // Alternatively, use `https://drive.google.com/uc?export=view&id=${file.getId()}`
  return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
}