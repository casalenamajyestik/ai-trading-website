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
//   J=Session ID, K=User ID, L=PNL Yesterday,
//   M=Long Position, N=Short Position, O=Size
//   P=Size USDT, Q=Entry Price, R=Mark Price, S=Unrealized PnL,
//   T=Leverage, U=Position Amt
//
// Endpoints:
//   WRITE (default):  https://script.google.com/macros/s/.../exec?saldo=...&pnl=...&total_position=...&nama_koin=...&harga_exit=...&side=...&user_id=...&timestamp=...&data_type=...&long_count=...&short_count=...&size=...]
//   READ:             https://script.google.com/macros/s/.../exec?mode=read&user_id=...
//   READ LAST:        https://script.google.com/macros/s/.../exec?mode=read_last&user_id=...
// ============================================================================

const SHEET_NAME = 'Sheet1';
// Kolom BARU untuk trading bot data (sheets_sender) - urutan permanen
const HEADERS = [
  'Timestamp',              // A - WIB (UTC+7)
  'Nama Koin',              // B
  'Side',                   // C
  'Harga Exit',             // D
  'PNL Exit',               // E
  'Saldo',                  // F
  'PNL Unrealized',         // G - Total unrealized PnL dari semua posisi aktif
  'Total Position',         // H
  'Data Type',              // I
  'Session ID',             // J
  'User ID',                // K
  'PNL Yesterday',          // L - Daily net PnL (hasil bersih harian) untuk Overview stat card
  'Long Position',          // M - Jumlah posisi Long aktif
  'Short Position',         // N - Jumlah posisi Short aktif
  'Size',                   // O - Ukuran posisi yang ditutup (|positionAmt|)
  'Size USDT',              // P - Size posisi dalam USDT (untuk active_position_detail)
  'Entry Price',            // Q - Harga entry posisi
  'Mark Price',             // R - Harga mark/current price
  'Unrealized PnL',         // S - PnL unrealized per posisi
  'Leverage',               // T - Leverage posisi
  'Position Amt'            // U - Posisi amount (positif long, negatif short)
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
    const data = getLastErrorRowData(userId);
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

  // CLEANUP mode - hapus unrealized_snapshot lama, sisakan 1 terbaru per user
  // Support: ?mode=cleanup_snapshots (real) / ?mode=cleanup_snapshots&dry_run=true (test only)
  if (params.mode === 'cleanup_snapshots') {
    const dryRun = params.dry_run === 'true';
    const result = cleanupOldUnrealizedSnapshots(dryRun);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // WRITE mode (default)
  // Check if this is trading bot data (sheets_sender) vs heartbeat
  const dataType = params.data_type || '';

  if (dataType === 'closed_position' || dataType === 'unrealized_snapshot' || dataType === 'daily_pnl_yesterday') {
    // Handle trading bot data from sheets_sender
    const saldo        = parseFloat(params.saldo)        || 0;
    const pnl          = parseFloat(params.pnl)          || 0;
    const totalPosition = parseInt(params.total_position) || 0;
    const namaKoin     = params.nama_koin || 'unknown';
    const hargaExit    = parseFloat(params.harga_exit)   || 0;
    const sideStr      = params.side || '';
    const userIdWrite  = params.user_id || 'anonymous';
    // New columns for long/short
    const longCount    = parseInt(params.long_count)    || 0;
    const shortCount   = parseInt(params.short_count)   || 0;
    // Size: ukuran posisi yang ditutup (|positionAmt|)
    const size         = parseFloat(params.size)         || 0;
    // Gunakan timestamp dari bot (sudah WIB) atau generate WIB
    const timestamp    = params.timestamp || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

    ensureHeaders(sheet);

    // Kolom: A-U
    // A=Timestamp, B=Nama Koin, C=Side, D=Harga Exit,
    // E=PNL Exit, F=Saldo, G=PNL Unrealized, H=Total Position,
    // I=Data Type, J=Session ID, K=User ID, L=PNL Yesterday,
    // M=Long Position, N=Short Position, O=Size
    // P=Size USDT, Q=Entry Price, R=Mark Price, S=Unrealized PnL,
    // T=Leverage, U=Position Amt
    if (dataType === 'closed_position') {
      // Closed position: E=PNL Exit (pnl), G=PNL Unrealized (0), L=PNL Yesterday (0)
      // closed_position TIDAK di-dedupe — setiap close posisi adalah event unik
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
        params.session_id || '',  // J - Session ID (dari parameter bot)
        userIdWrite,    // K - User ID
        0,              // L - PNL Yesterday (0 untuk closed position)
        longCount,      // M - Long Position
        shortCount,     // N - Short Position
        size,           // O - Size (ukuran posisi yang ditutup)
        0,              // P - Size USDT (0 untuk closed position)
        0,              // Q - Entry Price (0 untuk closed position)
        0,              // R - Mark Price (0 untuk closed position)
        0,              // S - Unrealized PnL (0 untuk closed position)
        0,              // T - Leverage (0 untuk closed position)
        0               // U - Position Amt (0 untuk closed position)
      ]);
      const lastRow = sheet.getLastRow();
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Closed position saved (new, not deduplicated)',
          row: lastRow,
          timestamp: timestamp
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (dataType === 'daily_pnl_yesterday') {
      // Daily PnL yesterday: E=PNL Exit (0), G=PNL Unrealized (0), L=PNL Yesterday (pnl)
      // daily_pnl_yesterday TIDAK di-dedupe — harian, append baru tiap hari
      sheet.appendRow([
        timestamp,      // A - Timestamp WIB
        namaKoin,       // B - Nama Koin (ALL)
        sideStr,        // C - Side (kosong)
        hargaExit,      // D - Harga Exit (0)
        0,              // E - PNL Exit (0 untuk daily pnl)
        saldo,          // F - Saldo
        0,              // G - PNL Unrealized (0 untuk daily pnl)
        totalPosition,  // H - Total Position
        dataType,       // I - Data Type
        params.session_id || '',  // J - Session ID (dari parameter bot)
        userIdWrite,    // K - User ID
        pnl,            // L - PNL Yesterday (daily net PnL)
        longCount,      // M - Long Position
        shortCount,     // N - Short Position
        size,           // O - Size (0 untuk daily pnl)
        0,              // P - Size USDT (0 untuk daily pnl)
        0,              // Q - Entry Price (0 untuk daily pnl)
        0,              // R - Mark Price (0 untuk daily pnl)
        0,              // S - Unrealized PnL (0 untuk daily pnl)
        0,              // T - Leverage (0 untuk daily pnl)
        0               // U - Position Amt (0 untuk daily pnl)
      ]);
      const lastRow = sheet.getLastRow();
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Daily PnL saved (new, not deduplicated)',
          row: lastRow,
          timestamp: timestamp
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // unrealized_snapshot: E=PNL Exit (0), G=PNL Unrealized (pnl), L=PNL Yesterday (0)
      // UNREALIZED SNAPSHOT: UPDATE baris lama jika sudah ada, jika tidak append baru
      // Ini mencegah spreadsheet penuh dengan data snapshot lama
      const dataTypeCol = HEADERS.indexOf('Data Type') + 1;  // kolom I (9)
      const userIdCol = HEADERS.indexOf('User ID') + 1;      // kolom K (11)
      const lastRow = sheet.getLastRow();

      let targetRow = 0;
      if (lastRow >= 2) {
        // Ambil kolom I (Data Type) sampai K (User ID) = 3 kolom
        const range = sheet.getRange(2, dataTypeCol, lastRow - 1, 3); // kolom I, J, K
        const values = range.getValues();

        // Cari dari bawah ke atas (paling baru dulu)
        // values[i][0] = Data Type (kolom I), values[i][2] = User ID (kolom K)
        for (let i = values.length - 1; i >= 0; i--) {
          if (values[i][0] === 'unrealized_snapshot' && values[i][2] === userIdWrite) {
            targetRow = i + 2; // +2 karena data mulai baris 2, index 0-based
            break;
          }
        }
      }

      const rowData = [
        timestamp,      // A - Timestamp WIB
        namaKoin,       // B - Nama Koin (ALL)
        sideStr,        // C - Side (kosong)
        hargaExit,      // D - Harga Exit (0)
        0,              // E - PNL Exit (0 untuk unrealized snapshot)
        saldo,          // F - Saldo
        pnl,            // G - PNL Unrealized (dari unrealized PnL)
        totalPosition,  // H - Total Position
        dataType,       // I - Data Type
        params.session_id || '',  // J - Session ID (dari parameter bot)
        userIdWrite,    // K - User ID
        0,              // L - PNL Yesterday (0 untuk unrealized snapshot)
        longCount,      // M - Long Position
        shortCount,     // N - Short Position
        size,           // O - Size (0 untuk unrealized snapshot)
        0,              // P - Size USDT (0 untuk unrealized snapshot)
        0,              // Q - Entry Price (0 untuk unrealized snapshot)
        0,              // R - Mark Price (0 untuk unrealized snapshot)
        0,              // S - Unrealized PnL (0 untuk unrealized snapshot)
        0,              // T - Leverage (0 untuk unrealized snapshot)
        0               // U - Position Amt (0 untuk unrealized snapshot)
      ];

      if (targetRow > 0) {
        // UPDATE baris yang sudah ada (dedupe!)
        sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: 'Unrealized snapshot updated (deduplicated)',
            row: targetRow,
            timestamp: timestamp,
            deduplicated: true
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        // APPEND baris baru (pertama kali untuk user ini)
        sheet.appendRow(rowData);
        const newRow = sheet.getLastRow();
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: 'Unrealized snapshot saved (new)',
            row: newRow,
            timestamp: timestamp,
            deduplicated: false
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  // ACTIVE POSITION DETAIL: CLEAN REPLACE PATTERN
  // Handle data_type=active_position_detail (kirim detail 99 posisi aktif)
  if (dataType === 'active_position_detail') {
    // 1. Hapus SEMUA baris lama dengan data_type='active_position_detail' untuk user ini
    // 2. Parse active_positions JSON array
    // 3. Append baris BARU untuk setiap posisi aktif
    // Ini mencegah spreadsheet penuh karena data lama dihapus setiap 5 menit
    
    // Initialize sheet first (FIX: was missing before using sheet.getLastRow())
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
    
    // Initialize timestamp for this block (FIX: was only declared in other branches)
    const timestamp = params.timestamp || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
    // Declare variables needed in this block (FIX: were only in closed_position branch)
    const saldo        = parseFloat(params.saldo)        || 0;
    const pnl          = parseFloat(params.pnl)          || 0;
    const totalPosition = parseInt(params.total_position) || 0;
    const namaKoin     = params.nama_koin || 'unknown';
    const sideStr      = params.side || '';
    const userIdWrite  = params.user_id || 'anonymous';
    const longCount    = parseInt(params.long_count)    || 0;
    const shortCount   = parseInt(params.short_count)   || 0;
    const size         = parseFloat(params.size)         || 0;
    
    const dataTypeCol = HEADERS.indexOf('Data Type') + 1;  // kolom I (9)
    const userIdCol = HEADERS.indexOf('User ID') + 1;      // kolom K (11)
    const lastRow = sheet.getLastRow();
    
    // Parse active_positions JSON dari parameter
    const activePositionsRaw = params.active_positions || '[]';
    let activePositions = [];
    try {
      activePositions = JSON.parse(activePositionsRaw);
    } catch (e) {
      activePositions = [];
    }
    
    // 1. Hapus semua baris lama dengan active_position_detail untuk user yang sama
    const rowsToDelete = [];
    if (lastRow >= 2 && activePositions.length > 0) {
      const range = sheet.getRange(2, dataTypeCol, lastRow - 1, 3); // kolom I, J, K
      const values = range.getValues();
      
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i][0] === 'active_position_detail' && values[i][2] === userIdWrite) {
          rowsToDelete.push(i + 2); // +2 karena data mulai baris 2
        }
      }
      
      // Hapus dari bawah ke atas (urutan menurun agar row number tidak bergeser)
      for (let i = 0; i < rowsToDelete.length; i++) {
        sheet.deleteRow(rowsToDelete[i]);
      }
    }
    
    // 2. Append baris baru untuk setiap posisi aktif
    let appendedCount = 0;
    for (let i = 0; i < activePositions.length; i++) {
      const pos = activePositions[i];
      sheet.appendRow([
        timestamp,                    // A - Timestamp WIB
        pos.nama_koin || '',          // B - Nama Koin (symbol)
        pos.side || '',               // C - Side (long/short)
        0,                            // D - Harga Exit (0 untuk posisi aktif)
        0,                            // E - PNL Exit (0 untuk posisi aktif)
        saldo,                        // F - Saldo
        0,                            // G - PNL Unrealized (0 untuk detail posisi)
        totalPosition,                // H - Total Position
        'active_position_detail',     // I - Data Type
        params.session_id || '',      // J - Session ID
        userIdWrite,                  // K - User ID
        0,                            // L - PNL Yesterday
        longCount,                    // M - Long Position
        shortCount,                   // N - Short Position
        0,                            // O - Size (0 untuk detail)
        pos.size_usdt || 0,           // P - Size USDT
        pos.entry_price || 0,         // Q - Entry Price
        pos.mark_price || 0,          // R - Mark Price
        pos.unrealized_pnl || 0,      // S - Unrealized PnL
        pos.leverage || 0,            // T - Leverage
        pos.position_amt || 0         // U - Position Amt
      ]);
      appendedCount++;
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Active positions detail saved (clean replace)',
        rows_appended: appendedCount,
        rows_deleted: rowsToDelete.length,
        total_positions: activePositions.length,
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
  const sessionId      = params.session_id || 'unknown';
  const currentPositions = params.current_positions || '[]';
  const status         = params.status || 'running';
  const totalUnrealized = parseFloat(params.total_unrealized_pnl) || 0;
  const userIdWrite    = params.user_id || 'anonymous';
  // New columns for heartbeat - default to 0
  const longCount      = parseInt(params.long_count)        || 0;
  const shortCount     = parseInt(params.short_count)       || 0;
  const size           = parseFloat(params.size)            || 0;

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
    userIdWrite,    // K - User ID
    dailyPnl,       // L - PNL Yesterday (dari heartbeat)
    longCount,      // M - Long Position
    shortCount,     // N - Short Position
    size,           // O - Size (0 untuk heartbeat, karena ini snapshot bukan close)
    0,              // P - Size USDT (0 untuk heartbeat)
    0,              // Q - Entry Price (0 untuk heartbeat)
    0,              // R - Mark Price (0 untuk heartbeat)
    0,              // S - Unrealized PnL (0 untuk heartbeat)
    0,              // T - Leverage (0 untuk heartbeat)
    0               // U - Position Amt (0 untuk heartbeat)
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

// ---- Helper: get last data row for user ----
// Aturan:
//   1. Ambil baris terakhir milik user
//   2. Untuk kolom numerik, jika bernilai 0 cari nilai non-zero terakhir (vertikal ke atas, filter user)
//   3. Untuk PNL Yesterday: cari baris terdekat dengan data_type=daily_pnl_yesterday
function getLastErrorRowData(userId) {
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
    'Total Position',
    'PNL Yesterday',
    'Long Position',
    'Short Position',
    'Size'
  ];

  // Cari baris terakhir YANG MILIK USER INI (dari bawah ke atas)
  const userIdCol = HEADERS.indexOf('User ID') + 1;
  const dataTypeCol = HEADERS.indexOf('Data Type') + 1;
  const pnlYesterdayCol = HEADERS.indexOf('PNL Yesterday') + 1;

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
  // dari baris sebelumnya ke atas (vertikal, kolom yang sama, filter user)
  NUMERIC_FIELDS.forEach(field => {
    const colIndex = HEADERS.indexOf(field) + 1; // 1-based untuk getRange
    let val = parseFloat(result[field]) || 0;
    if (val === 0) {
      // Cari ke atas (baris sebelumnya) di KOLOM YANG SAMA, FILTER USER ID
      for (let r = targetRow - 1; r >= 2; r--) {
        const cellUserId = sheet.getRange(r, userIdCol).getValue();
        if (cellUserId !== userId) continue; // skip user lain
        const cellVal = sheet.getRange(r, colIndex).getValue();
        let parsed;
        if (field === 'Total Position' || field === 'Long Position' || field === 'Short Position') {
          parsed = parseInt(cellVal);
        } else {
          parsed = parseFloat(cellVal);
        }
        if (parsed !== 0 && !isNaN(parsed)) {
          val = parsed;
          break;
        }
      }
    }
    result[field] = val;
  });

  // Khusus PNL Yesterday: cari baris terdekat dengan data_type=daily_pnl_yesterday
  // (jika belum ada, cari ke atas dari target row)
  let pnlYesterdayVal = parseFloat(result['PNL Yesterday']) || 0;
  if (pnlYesterdayVal === 0) {
    for (let r = targetRow; r >= 2; r--) {
      const cellUserId = sheet.getRange(r, userIdCol).getValue();
      if (cellUserId !== userId) continue;
      const dt = sheet.getRange(r, dataTypeCol).getValue();
      if (dt === 'daily_pnl_yesterday') {
        const cellVal = sheet.getRange(r, pnlYesterdayCol).getValue();
        const parsed = parseFloat(cellVal);
        if (!isNaN(parsed) && parsed !== 0) {
          pnlYesterdayVal = parsed;
          break;
        }
      }
    }
  }

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
      user_id: result['User ID'],
      pnl_yesterday: pnlYesterdayVal,   // ← kolom baru untuk Overview stat card
      long_position: parseInt(result['Long Position']) || 0,    // ← kolom baru Long
      short_position: parseInt(result['Short Position']) || 0,  // ← kolom baru Short
      size: parseFloat(result['Size']) || 0                       // ← kolom baru Size
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
      user_id: obj['User ID'],
      pnl_yesterday: parseFloat(obj['PNL Yesterday']) || 0,
      long_position: parseInt(obj['Long Position']) || 0,
      short_position: parseInt(obj['Short Position']) || 0,
      size: parseFloat(obj['Size']) || 0,
      size_usdt: parseFloat(obj['Size USDT']) || 0,
      entry_price: parseFloat(obj['Entry Price']) || 0,
      mark_price: parseFloat(obj['Mark Price']) || 0,
      unrealized_pnl: parseFloat(obj['Unrealized PnL']) || 0,
      leverage: parseInt(obj['Leverage']) || 0,
      position_amt: parseFloat(obj['Position Amt']) || 0
    };
  }).filter(r => r !== null);

  return { success: true, data: rows, count: rows.length };
}

// ---- Helper: cleanup old unrealized_snapshot rows (run once manually) ----
// Untuk setiap user_id, hapus semua unrealized_snapshot KECUALI yang paling baru (baris terakhir)
// Ini bersihkan data lama yang sudah tumpuk sebelum fitur dedupe aktif
// Support: ?mode=cleanup_snapshots (real) / ?mode=cleanup_snapshots&dry_run=true (test only)
function cleanupOldUnrealizedSnapshots(dryRun = false) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  ensureHeaders(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, message: 'No data rows', deleted: 0, dryRun: dryRun };
  }

  // Ambil kolom I (Data Type), K (User ID), A (Timestamp)
  const dataTypeCol = HEADERS.indexOf('Data Type') + 1;  // 9
  const userIdCol = HEADERS.indexOf('User ID') + 1;      // 11
  
  // Ambil semua data baris 2 sampai lastRow, kolom A, I, K
  const range = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  const allValues = range.getValues();

  // Kelompokkan per user_id: simpan index baris (0-based dari allValues) untuk tiap user_id
  const userSnapshots = {}; // { userId: [ {rowIndex, timestamp, originalRow} ] }
  let skippedInvalidUserId = 0;
  let skippedNonSnapshot = 0;
  
  for (let i = 0; i < allValues.length; i++) {
    const row = allValues[i];
    const dataType = row[dataTypeCol - 1]; // kolom I
    const userId = row[userIdCol - 1];     // kolom K
    
    // Skip kalau bukan unrealized_snapshot
    if (dataType !== 'unrealized_snapshot') {
      skippedNonSnapshot++;
      continue;
    }
    
    // Skip kalau User ID kosong, 'anonymous', atau whitespace only
    const cleanUserId = String(userId || '').trim();
    if (!cleanUserId || cleanUserId.toLowerCase() === 'anonymous') {
      skippedInvalidUserId++;
      continue;
    }
    
    if (!userSnapshots[cleanUserId]) {
      userSnapshots[cleanUserId] = [];
    }
    // originalRow = i + 2 (karena allValues start dari baris 2)
    userSnapshots[cleanUserId].push({
      rowIndex: i,
      originalRow: i + 2,
      timestamp: row[0] // kolom A
    });
  }

  // Untuk setiap user, cari yang paling baru (timestamp terbesar), hapus yang lain
  const rowsToDelete = [];
  const keptRows = [];
  
  for (const userId in userSnapshots) {
    const snapshots = userSnapshots[userId];
    if (snapshots.length <= 1) {
      // Sudah cuma 1, catat sebagai kept
      keptRows.push({ userId, row: snapshots[0].originalRow, timestamp: snapshots[0].timestamp });
      continue;
    }
    
    // Urutkan berdasarkan timestamp descending (paling baru dulu)
    snapshots.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return tb - ta;
    });
    
    // Simpan yang pertama (paling baru)
    keptRows.push({ userId, row: snapshots[0].originalRow, timestamp: snapshots[0].timestamp });
    
    // Hapus yang lain
    for (let j = 1; j < snapshots.length; j++) {
      rowsToDelete.push({
        rowNum: snapshots[j].originalRow,
        userId: userId,
        timestamp: snapshots[j].timestamp
      });
    }
  }

  if (rowsToDelete.length === 0) {
    return { 
      success: true, 
      message: 'No duplicates to clean', 
      deleted: 0,
      dryRun: dryRun,
      skipped: { invalidUserId: skippedInvalidUserId, nonSnapshot: skippedNonSnapshot },
      kept: keptRows.length
    };
  }

  // Dry-run: hanya return apa yang AKAN dihapus, JANGAN hapus
  if (dryRun) {
    return {
      success: true,
      message: 'DRY-RUN: No rows deleted (test mode)',
      wouldDelete: rowsToDelete.length,
      rowsToDelete: rowsToDelete.map(r => ({ row: r.rowNum, userId: r.userId, timestamp: r.timestamp })),
      kept: keptRows.map(r => ({ row: r.row, userId: r.userId, timestamp: r.timestamp })),
      skipped: { invalidUserId: skippedInvalidUserId, nonSnapshot: skippedNonSnapshot },
      dryRun: true
    };
  }

  // Hapus dari bawah ke atas agar index tidak bergeser
  rowsToDelete.sort((a, b) => b.rowNum - a.rowNum);
  
  let deleted = 0;
  const errors = [];
  for (const item of rowsToDelete) {
    try {
      sheet.deleteRow(item.rowNum);
      deleted++;
    } catch (e) {
      errors.push('Row ' + item.rowNum + ': ' + e);
      console.error('Failed to delete row ' + item.rowNum + ': ' + e);
    }
  }

  return { 
    success: true, 
    message: errors.length ? 'Cleanup completed with errors' : 'Cleanup completed', 
    deleted: deleted,
    errors: errors.length ? errors : undefined,
    kept: keptRows.map(r => ({ row: r.row, userId: r.userId, timestamp: r.timestamp })),
    skipped: { invalidUserId: skippedInvalidUserId, nonSnapshot: skippedNonSnapshot },
    dryRun: false
  };
}

// ---- doPost: handle large payloads (POST requests) ----
function doPost(e) {
  // Parse JSON body
  let params = {};
  try {
    const body = e.postData.getDataAsString();
    params = JSON.parse(body);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Invalid JSON body' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Convert active_positions array to JSON string (doGet expect string)
  if (Array.isArray(params.active_positions)) {
    params.active_positions = JSON.stringify(params.active_positions);
  }

  // Delegate to doGet logic (reuse same routing)
  // Create a mock parameter object
  const mockE = { parameter: params };
  return doGet(mockE);
}