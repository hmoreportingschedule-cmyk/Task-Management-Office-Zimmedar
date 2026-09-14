import { google } from "googleapis";

function auth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey || !process.env.GOOGLE_SHEET_ID) {
    throw new Error("Google Sheet environment variables missing.");
  }
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

async function sheets() {
  const client = await auth().getClient();
  return google.sheets({ version: "v4", auth: client });
}

export async function getSheetRows(sheetName) {
  const api = await sheets();
  const res = await api.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:Z`
  });
  return res.data.values || [];
}

export async function appendSheetRow(sheetName, values) {
  const api = await sheets();
  await api.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] }
  });
}

function columnLetter(n) {
  let s = "";
  while (n > 0) { let r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

export async function findRowByValue(sheetName, key, value, key2, value2) {
  const rows = await getSheetRows(sheetName);
  if (!rows.length) return null;
  const headers = rows[0].map(x => String(x).trim());
  const objects = rows.slice(1).map((r, i) => {
    const o = {};
    headers.forEach((h, j) => o[h] = r[j] ?? "");
    o.__row = i + 2;
    return o;
  });
  const hit = objects.find(o =>
    String(o[key]) === String(value) &&
    (!key2 || String(o[key2]) === String(value2))
  );
  if (!hit) return null;
  return { rowNumber: hit.__row, object: hit };
}

export async function updateSheetCell(sheetName, rowNumber, header, value) {
  const rows = await getSheetRows(sheetName);
  const headers = rows[0].map(x => String(x).trim());
  const col = headers.indexOf(header);
  if (col < 0) throw new Error(`Column ${header} not found in ${sheetName}.`);
  const api = await sheets();
  await api.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!${columnLetter(col + 1)}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });
}

export async function updateSheetValues(sheetName, rowNumber, values) {
  const rows = await getSheetRows(sheetName);
  const headers = rows[0].map(x => String(x).trim());
  const api = await sheets();
  const data = [];
  for (const [header, value] of Object.entries(values)) {
    const col = headers.indexOf(header);
    if (col >= 0) data.push({
      range: `${sheetName}!${columnLetter(col + 1)}${rowNumber}`,
      values: [[value]]
    });
  }
  if (data.length) {
    await api.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data }
    });
  }
}