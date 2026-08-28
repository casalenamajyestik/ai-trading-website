// ============================================================================
// Google Apps Script for AI Trading Bot → Google Sheets Integration
// ============================================================================
// Deploy: Extensions → Apps Script → Deploy → New Deployment
//   - Execute as: Me
//   - Who has access: Anyone (WAJIB untuk CORS)
//
// Sheet header (baris 1):
//   Timestamp, Balance (USD), Daily PnL (USD), Total PnL (USD),
//   Biggest Win (USD), Total Positions, Session ID,
//   Current Positions (JSON), Status, Total Unrealized PnL (USD)
//
// Endpoints:
//   WRITE (default):  https://script.google.com/macros/s/.../exec?balance=...&daily_pnl=...&total_pnl=...
//   READ:             https://script.google.com/macros/s/.../exec?mode=read
//   READ LAST:        https://script.google.com/macros/s/.../exec?mode=read_last
// ============================================================================

const SHEET_NAME = 'Sheet1';
const HEADERS = [
  'Timestamp',
  'Balance (USD)',
  'Daily PnL (USD)',
  'Total PnL (USD)',
  'Biggest Win (USD)',
  'Total Positions',
  'Session ID',
  'Current Positions (JSON)',
  'Status',
  'Total Unrealized PnL (USD)',
  'User ID'
];

// ---- Helper: ensure headers ----
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    for (let i = 0; i < HEADERS.length; i++) {
      if (firstRow[i] !== HEADERS[i]) {
        sheet.getRange(1, i + 1).setValue(HEADERS[i]);
      }
    }
  }
}

// ---- doGet: route write / read ----
function doGet(e) {
  const params = e.parameter || {};

  // READ mode
  // Ambil user_id dari parameter (wajib untuk isolasi)
  const userId = params.user_id || 'anonymous';

  // READ mode
  if (params.mode === 'read_last') {
    const data = getLastRowData(userId);
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (params.mode === 'read') {
    const data = getAllRowsData(userId);
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // WRITE mode (default)
  const balance        = parseFloat(params.balance)         || 0;
  const dailyPnl       = parseFloat(params.daily_pnl)       || 0;
  const totalPnl       = parseFloat(params.total_pnl)       || 0;
  const biggestWin     = parseFloat(params.biggest_win)     || 0;
  const totalPositions = parseInt(params.total_positions)   || 0;
  const sessionId      = params.session_id || 'unknown';
  const currentPositions = params.current_positions || '[]';
  const status         = params.status || 'running';
  const totalUnrealized = parseFloat(params.total_unrealized_pnl) || 0;
  const userIdWrite    = params.user_id || 'anonymous';

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  ensureHeaders(sheet);

  const timestamp = new Date().toISOString();
  sheet.appendRow([
    timestamp,
    balance,
    dailyPnl,
    totalPnl,
    biggestWin,
    totalPositions,
    sessionId,
    currentPositions,
    status,
    totalUnrealized,
    userIdWrite
  ]);

  const lastRow = sheet.getLastRow();

  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved to spreadsheet',
      row: lastRow,
      timestamp: timestamp
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Helper: get last data row ----
// Aturan:
//   1. Ambil data pada baris terakhir
//   2. Jika angka pada baris terakhir = 0, ambil angka terakhir yang bukan 0
//      dari baris sebelumnya (fallback per-kolom, vertikal ke atas)
//   3. Jika semua baris bernilai 0, tampilkan 0
function getLastRowData(userId) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  ensureHeaders(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return {
      success: true,
      data: null,
      message: 'No data rows yet'
    };
  }

  // Numeric fields yang berlaku aturan fallback (0 -> nilai non-zero terakhir)
  const NUMERIC_FIELDS = [
    'Balance (USD)',
    'Daily PnL (USD)',
    'Total PnL (USD)',
    'Biggest Win (USD)',
    'Total Positions',
    'Total Unrealized PnL (USD)'
  ];

  // Cari baris terakhir YANG MILIK USER INI (dari bawah ke atas)
  const userIdCol = HEADERS.indexOf('User ID') + 1;
  let targetRow = 0;
  for (let r = lastRow; r >= 2; r--) {
    const cellUserId = sheet.getRange(r, userIdCol).getValue();
    if (cellUserId === userId) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === 0) {
    return {
      success: true,
      data: null,
      message: 'No data for this user'
    };
  }

  const lastValues = sheet.getRange(targetRow, 1, 1, HEADERS.length).getValues()[0];
  let result = {};
  HEADERS.forEach((h, i) => { result[h] = lastValues[i]; });

  // Untuk setiap kolom numerik, jika bernilai 0 cari nilai non-zero
  // dari baris sebelumnya ke atas (vertikal, kolom yang sama)
  NUMERIC_FIELDS.forEach(field => {
    const colIndex = HEADERS.indexOf(field) + 1; // 1-based untuk getRange
    let val = parseFloat(result[field]) || 0;
    if (val === 0) {
      // Cari ke atas (baris sebelumnya) di KOLOM YANG SAMA, FILTER USER ID
      for (let r = targetRow - 1; r >= 2; r--) {
        const cellUserId = sheet.getRange(r, userIdCol).getValue();
        if (cellUserId !== userId) continue; // skip user lain
        const cellVal = sheet.getRange(r, colIndex).getValue();
        const parsed = (field === 'Total Positions')
          ? parseInt(cellVal)
          : parseFloat(cellVal);
        if (parsed !== 0 && !isNaN(parsed)) {
          val = parsed;
          break;
        }
      }
    }
    result[field] = val;
  });

  return {
    success: true,
    data: {
      timestamp: result['Timestamp'],
      balance: parseFloat(result['Balance (USD)']) || 0,
      daily_pnl: parseFloat(result['Daily PnL (USD)']) || 0,
      total_pnl: parseFloat(result['Total PnL (USD)']) || 0,
      biggest_win: parseFloat(result['Biggest Win (USD)']) || 0,
      total_positions: parseInt(result['Total Positions']) || 0,
      session_id: result['Session ID'],
      current_positions: result['Current Positions (JSON)'],
      status: result['Status'],
      total_unrealized_pnl: parseFloat(result['Total Unrealized PnL (USD)']) || 0
    },
    row: lastRow
  };
}

// ---- Helper: get all data rows ----
function getAllRowsData(userId) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  ensureHeaders(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, data: [], message: 'No data rows yet' };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const userIdCol = HEADERS.indexOf('User ID') + 1;
  let rows = values.map((row, idx) => {
    const rowUserId = row[userIdCol - 1];
    if (rowUserId !== userId) return null; // filter user lain
    let obj = {};
    HEADERS.forEach((h, i) => { obj[h] = row[i]; });
    return {
      timestamp: obj['Timestamp'],
      balance: parseFloat(obj['Balance (USD)']) || 0,
      daily_pnl: parseFloat(obj['Daily PnL (USD)']) || 0,
      total_pnl: parseFloat(obj['Total PnL (USD)']) || 0,
      biggest_win: parseFloat(obj['Biggest Win (USD)']) || 0,
      total_positions: parseInt(obj['Total Positions']) || 0,
      session_id: obj['Session ID'],
      current_positions: obj['Current Positions (JSON)'],
      status: obj['Status'],
      total_unrealized_pnl: parseFloat(obj['Total Unrealized PnL (USD)']) || 0
    };
  }).filter(r => r !== null);

  return { success: true, data: rows, count: rows.length };
}