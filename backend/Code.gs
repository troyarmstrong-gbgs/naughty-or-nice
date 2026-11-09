/**
 * NAUGHTY CHIP CASE — submission backend (Google Apps Script)
 *
 * Setup:
 *  1. Create a new Google Sheet (e.g. "Naughty Chip Submissions").
 *  2. Extensions > Apps Script. Replace Code.gs with this file. Save.
 *  3. Deploy > New deployment > type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Copy the Web app URL into SUBMIT_URL in config.js.
 *
 * Every accepted guess is appended to the "Submissions" tab:
 *   Timestamp | Name | Email | Chip # | Chip Name
 * A name OR email that has already been used is rejected.
 */

const SHEET_NAME = 'Submissions';
const CHIP_COUNT = 24;
const HEADERS = ['Timestamp', 'Name', 'Email', 'Chip #', 'Chip Name'];

// Password for the admin page (admin.html). It lives only here on the server,
// never in the public website files. Change it here and redeploy (new version) to update.
const ADMIN_PASSWORD = 'hohohost2026';

function doPost(e) {
  // Admin page: list every submission (password checked on the server)
  let peek = {};
  try { peek = JSON.parse(e.postData.contents); } catch (err) {}
  if (peek && peek.action === 'list') return listSubmissions_(peek.password);

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // serialize writes so two identical submissions can't both slip through
  } catch (err) {
    return json({ ok: false, error: 'busy', message: 'The server is busy. Please try again in a moment.' });
  }

  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return json({ ok: false, error: 'bad_request', message: 'Invalid submission.' });
    }

    const name = String(data.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const email = String(data.email || '').trim().toLowerCase().slice(0, 120);
    const chipId = Number(data.chipId);
    const chipName = String(data.chipName || '').trim().slice(0, 60);

    if (name.length < 2) return json({ ok: false, error: 'invalid', message: 'Please enter your full name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid', message: 'Please enter a valid email address.' });
    if (!Number.isInteger(chipId) || chipId < 1 || chipId > CHIP_COUNT) return json({ ok: false, error: 'invalid', message: 'Please choose a suspect.' });

    const sheet = getSheet_();
    const rows = sheet.getLastRow() > 1
      ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues() // Name, Email
      : [];

    const normName = normalizeName_(name);
    const dup = rows.some(function (r) {
      return String(r[1]).trim().toLowerCase() === email || normalizeName_(String(r[0])) === normName;
    });
    if (dup) {
      return json({ ok: false, error: 'duplicate', message: 'A guess has already been submitted with that name or email. Only one guess per detective!' });
    }

    sheet.appendRow([new Date(), safe_(name), safe_(email), chipId, safe_(chipName)]);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function listSubmissions_(password) {
  if (String(password || '') !== ADMIN_PASSWORD) {
    Utilities.sleep(1200); // slow down password guessing
    return json({ ok: false, error: 'unauthorized', message: 'Wrong password.' });
  }
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  const values = last > 1 ? sheet.getRange(2, 1, last - 1, 5).getValues() : [];
  const rows = values.map(function (r) {
    return {
      ts: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]).replace(/^'/, ''),
      email: String(r[2]).replace(/^'/, ''),
      chipId: Number(r[3]),
      chipName: String(r[4]).replace(/^'/, '')
    };
  });
  return json({ ok: true, rows: rows });
}

// Lets you open the URL in a browser to confirm the deployment is live.
function doGet() {
  return json({ ok: true, status: 'North Pole-ice Department server is online.' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeName_(s) {
  return String(s).replace(/^'/, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Prevent spreadsheet formula injection from user input
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
