/**
 * Google Apps Script — Key-value store for Fanpage Dashboard.
 *
 * Setup:
 * 1. Create a Google Sheet, add a sheet tab named "data"
 * 2. Open Extensions > Apps Script, paste this code
 * 3. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL into the dashboard config
 */

function doGet(e) {
  try {
    const sheet = getSheet();
    const action = (e.parameter.action || 'getAll');

    if (action === 'get') {
      const key = e.parameter.key;
      const value = findValue(sheet, key);
      return json({ key, value });
    }

    // Default: return all key-value pairs
    const all = getAllData(sheet);
    return json(all);
  } catch (err) {
    return json({ error: err.message });
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();
    const body = JSON.parse(e.postData.contents);
    const { key, value } = body;
    upsert(sheet, key, value);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message });
  }
}

// -- helpers --

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('data');
  if (!sheet) {
    sheet = ss.insertSheet('data');
    sheet.appendRow(['key', 'value']);
  }
  return sheet;
}

function getAllData(sheet) {
  const rows = sheet.getDataRange().getValues();
  const result = {};
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) result[rows[i][0]] = rows[i][1];
  }
  return result;
}

function findValue(sheet, key) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) return rows[i][1];
  }
  return null;
}

function upsert(sheet, key, value) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}