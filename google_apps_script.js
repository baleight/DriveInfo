// INSTRUCTIONS:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code into Code.gs
// 4. Run the 'setupSheet' function once to create headers
// 5. Deploy as Web App:
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
  lock.tryLock(10000);
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Resources');
    
    // HANDLE POST (ADD ROW)
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      
      // Generate ID if missing
      const id = data.id || Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toLocaleDateString('en-GB');
      
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
        data.coverImage || ''
      ];
      
      sheet.appendRow(row);
      
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: { ...data, id } }))
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