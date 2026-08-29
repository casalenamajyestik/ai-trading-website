// ============================================================================
// Google Apps Script for AI Trading Bot → Google Sheets Integration
// ============================================================================
// Deploy: Extensions → Apps Script → Deploy → New Deployment
//   - Execute as: Me
//   - Who has access: Anyone (WAJIB untuk CORS)
//
// Sheet header (baris 1):
//   A=Timestamp(WIB), B=Nama Koin, C=Side, D=Harga Exit, E=PNL Exit,
//   F=Saldo, G=PNL Unrealized, H=Total Position, I=Data Type,
//   J=Session ID, K=User ID
//
// Endpoints:
//   WRITE (default):  https://script.google.com/macros/s/.../exec?saldo=...&pnl=...&total_position=...&nama_koin=...&harga_exit=...&side=...&user_id=...&timestamp=...&data_type=...
//   READ:             https://script.google.com/macros/s/.../exec?mode=read&user_id=...
//   READ LAST:        https://script.google.com/macros/s/.../exec?mode=read_last&user_id=...
// ============================================================================

const SHEET_NAME = 'Sheet1';
// Session ID untuk kolom J - isi dengan MY_SESSION_ID dari bot (bisa di-hardcode atau pakai PropertiesService)
// Contoh: const MY_SESSION_ID = '5da130b3-1352-4f8d-af15-a94949d45e7d';
const MY_SESSION_ID = PropertiesService.getScriptProperties().getProperty('MY_SESSION_ID') || '';

// Kolom BARU untuk trading bot data (sheets_sender) - urutan permanen
const HEADERS = [
  'Timestamp',        // A - WIB (UTC+7)
  'Nama Koin',        // B
  'Side',             // C
  'Harga Exit',       // D
  'PNL Exit',         // E
  'Saldo',            // F
  'PNL Unrealized',   // G
  'Total Position',   // H
  'Data Type',        // I
  'Session ID',       // J
  'User ID'           // K
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
    // Check if this is trading bot data (sheets_sender) vs heartbeat
    const dataType = params.data_type || '';
  
    if (dataType === 'closed_position' || dataType === 'unrealized_snapshot') {
        // Handle trading bot data from sheets_sender
        const saldo        = parseFloat(params.saldo)        || 0;
        const pnl          = parseFloat(params.pnl)          || 0;
        const totalPosition = parseInt(params.total_position) || 0;
        const namaKoin     = params.nama_koin || 'unknown';
        const hargaExit    = parseFloat(params.harga_exit)   || 0;
        const sideStr      = params.side || '';
        const userIdWrite  = params.user_id || 'anonymous';
        // Gunakan timestamp dari bot (sudah WIB) atau generate WIB
        const timestamp    = params.timestamp || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = spreadsheet.getSheetByName(SHEET_NAME);
        if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
    
        ensureHeaders(sheet);
    
        // Write ke kolom baru sesuai urutan: A-K
        // A=Timestamp, B=Nama Koin, C=Side, D=Harga Exit, E=PNL Exit, F=Saldo, G=PNL Unrealized, H=Total Position, I=Data Type, J=Session ID, K=User ID
        if (dataType === 'closed_position') {
          // Closed position: E=PNL Exit (pnl), G=PNL Unrealized (0)
          sheet.appendRow([
            timestamp,      // A - Timestamp WIB
            namaKoin,       // B - Nama Koin
            sideStr,        // C - Side
            hargaExit,      // D - Harga Exit
            pnl,            // E - PNL Exit (dari closed position)
            saldo,          // F - Saldo
            0,              // G - PNL Unrealized (0 untuk closed position)
            totalPosition,  // H - Total Position
            dataType,       // I - Data Type
            MY_SESSION_ID || '',             // J - Session ID (isi dari env MY_SESSION_ID)
            userIdWrite     // K - User ID
          ]);
        } else {
          // unrealized_snapshot: E=PNL Exit (0), G=PNL Unrealized (pnl dari unrealized)
          sheet.appendRow([
            timestamp,      // A - Timestamp WIB
            namaKoin,       // B - Nama Koin (ALL)
            sideStr,        // C - Side (kosong)
            hargaExit,      // D - Harga Exit (0)
            0,              // E - PNL Exit (0 untuk unrealized snapshot)
            saldo,          // F - Saldo
            pnl,            // G - PNL Unrealized (dari unrealized PnL)
            totalPosition,  // H - Total Position
            dataType,       // I - Data Type
            MY_SESSION_ID || '',             // J - Session ID (isi dari env MY_SESSION_ID)
            userIdWrite     // K - User ID
          ]);
        }
    
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
  
    // Heartbeat data (tanpa data_type) - write ke struktur baru juga tapi field khusus dibiarkan 0
    const balance        = parseFloat(params.balance)         || 0;
    const dailyPnl       = parseFloat(params.daily_pnl)       || 0;
    const totalPnl       = parseFloat(params.total_pnl)       || 0;
    const biggestWin     = parseFloat(params.biggest_win)     || 0;
    const totalPositions = parseInt(params.total_positions)   || 0;
    const sessionId      = params.session_id || MY_SESSION_ID || 'unknown';
    const currentPositions = params.current_positions || '[]';
    const status         = params.status || 'running';
    const totalUnrealized = parseFloat(params.total_unrealized_pnl) || 0;
    const userIdWrite    = params.user_id || 'anonymous';
  
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  
    ensureHeaders(sheet);
  
    // Timestamp WIB
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([
      timestamp,      // A - Timestamp WIB
      '',             // B - Nama Koin (kosong)
      '',             // C - Side (kosong)
      0,              // D - Harga Exit (kosong)
      totalPnl,       // E - PNL Exit (pakai totalPnl)
      balance,        // F - Saldo (pakai balance)
      totalUnrealized,// G - PNL Unrealized
      totalPositions, // H - Total Position
      'heartbeat',    // I - Data Type
      sessionId,      // J - Session ID
      userIdWrite     // K - User ID
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
    'Saldo',
    'PNL Exit',
    'PNL Unrealized',
    'Total Position'
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
        const parsed = (field === 'Total Position')
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
      nama_koin: result['Nama Koin'],
      side: result['Side'],
      harga_exit: parseFloat(result['Harga Exit']) || 0,
      pnl_exit: parseFloat(result['PNL Exit']) || 0,
      saldo: parseFloat(result['Saldo']) || 0,
      pnl_unrealized: parseFloat(result['PNL Unrealized']) || 0,
      total_position: parseInt(result['Total Position']) || 0,
      data_type: result['Data Type'],
      session_id: result['Session ID'],
      user_id: result['User ID']
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
      nama_koin: obj['Nama Koin'],
      side: obj['Side'],
      harga_exit: parseFloat(obj['Harga Exit']) || 0,
      pnl_exit: parseFloat(obj['PNL Exit']) || 0,
      saldo: parseFloat(obj['Saldo']) || 0,
      pnl_unrealized: parseFloat(obj['PNL Unrealized']) || 0,
      total_position: parseInt(obj['Total Position']) || 0,
      data_type: obj['Data Type'],
      session_id: obj['Session ID'],
      user_id: obj['User ID']
    };
  }).filter(r => r !== null);

  return { success: true, data: rows, count: rows.length };
}