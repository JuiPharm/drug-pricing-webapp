/**
 * Google Apps Script Web App API (Google Sheet DB)
 *
 * ✅ Uses SheetID from Script Properties: SHEET_ID
 * ✅ Creates missing sheets and headers automatically (items/config)
 * ✅ Validates required columns; adds missing columns to the right
 *
 * Deploy: "New deployment" -> Web app
 * - Execute as: Me
 * - Who has access: Anyone (or Anyone with link)
 *
 * SECURITY (simple):
 * - Put API key in Script Properties: API_KEY
 * - Client must pass apiKey via query (?apiKey=...) for GET or JSON body { apiKey: "..." } for POST
 */

const SHEET_ITEMS = "items";
const SHEET_CONFIG = "config";

const ITEMS_HEADERS = [
  "item_code",
  "generic_name",
  "full_name",
  "dosage_form",
  "major_class",
  "sub_class",
  "cost",
  "opd_price",
  "ipd_price",
  "skg_opd_price",
  "skg_ipd_price",
  "opd_foreigner_price",
  "ipd_foreigner_price",
  "ipd_factor",
  "skg_opd_factor",
  "skg_ipd_factor",
  "foreigner_uplift_pct",
  "updated_at",
  "updated_by"
];

const CONFIG_HEADERS = ["key", "value"];

function doGet(e) {
  try {
    const apiKey = (e && e.parameter && e.parameter.apiKey) ? e.parameter.apiKey : "";
    assertApiKey_(apiKey);

    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "items";

    if (action === "items") {
      const q = (e.parameter.q || "").toString().trim();
      const limit = parseInt(e.parameter.limit || "0", 10); // 0 = no limit
      const data = listItems_(q, limit);
      return json_(data);
    }

    if (action === "summarySubclass") {
      const data = summaryBySubclass_();
      return json_(data);
    }

    if (action === "config") {
      return json_(getConfig_());
    }

    return json_({ ok: false, error: "Unknown action" }, 400);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    const apiKey = body.apiKey || "";
    assertApiKey_(apiKey);

    const action = body.action || "";

    if (action === "createItem") {
      const created = createItem_(body.item, body.updatedBy || "");
      return json_({ ok: true, item: created });
    }

    if (action === "updatePricing") {
      const updated = updatePricing_(body.item_code, body.pricing, body.updatedBy || "");
      return json_({ ok: true, item: updated });
    }

    if (action === "bulkUpdatePricing") {
      const updated = bulkUpdatePricing_(body.items || [], body.updatedBy || "");
      return json_({ ok: true, updatedCount: updated });
    }

    return json_({ ok: false, error: "Unknown action" }, 400);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

/** ----------------- Init / Validation ----------------- **/

function getDb_() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID") || "";
  if (!sheetId) throw new Error("Missing Script Property: SHEET_ID");

  const ss = SpreadsheetApp.openById(sheetId);

  // ensure sheets + headers
  ensureSheetWithHeaders_(ss, SHEET_ITEMS, ITEMS_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_CONFIG, CONFIG_HEADERS);

  // ensure required config defaults
  ensureConfigDefaults_(ss);

  return ss;
}

function ensureSheetWithHeaders_(ss, name, expectedHeaders) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  const lastCol = sh.getLastColumn();
  if (sh.getLastRow() < 1 || lastCol === 0) {
    sh.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sh.setFrozenRows(1);
    return;
  }

  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  // If first row is blank-ish, set headers
  const allBlank = existing.every(h => !String(h || "").trim());
  if (allBlank) {
    sh.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sh.setFrozenRows(1);
    return;
  }

  // Add missing expected headers to the right
  const existingSet = {};
  existing.forEach(h => { existingSet[String(h).trim()] = true; });

  const missing = expectedHeaders.filter(h => !existingSet[h]);
  if (missing.length > 0) {
    sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
  sh.setFrozenRows(1);
}

function ensureConfigDefaults_(ss) {
  const sh = ss.getSheetByName(SHEET_CONFIG);
  const headers = getHeaders_(sh);
  const keyCol = headers.indexOf("key");
  const valCol = headers.indexOf("value");
  if (keyCol === -1 || valCol === -1) throw new Error("config sheet missing headers: key,value");

  const last = sh.getLastRow();
  const existing = {};
  if (last >= 2) {
    const values = sh.getRange(2, 1, last - 1, headers.length).getValues();
    values.forEach(r => {
      const k = String(r[keyCol] || "").trim();
      if (k) existing[k] = r[valCol];
    });
  }

  const defaults = [
    ["skg_discount_pct", 20],
    ["min_margin_pct_warning", 0],
    ["default_ipd_factor", 1.6],
    ["default_foreigner_uplift_pct", 30]
  ];

  const rowsToAppend = [];
  defaults.forEach(pair => {
    if (existing[pair[0]] === undefined) rowsToAppend.push(pair);
  });

  if (rowsToAppend.length > 0) {
    rowsToAppend.forEach(p => sh.appendRow([p[0], p[1]]));
  }
}

/** ----------------- Core helpers ----------------- **/

function assertApiKey_(apiKey) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty("API_KEY") || "";
  if (!expected) throw new Error("Missing Script Property: API_KEY");
  if (!apiKey || apiKey !== expected) throw new Error("Unauthorized (invalid apiKey)");
}

function json_(obj, status) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error("Invalid JSON body");
  }
}

function getSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error("Missing sheet: " + name);
  return sh;
}

function getHeaders_(sheet) {
  const values = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
  return values[0].map(String);
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

function objectToRow_(headers, obj) {
  return headers.map(h => (obj[h] !== undefined ? obj[h] : ""));
}

function toNum_(v) {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

/** ----------------- Config ----------------- **/

function getConfig_() {
  const ss = getDb_();
  const sh = getSheet_(ss, SHEET_CONFIG);

  const headers = getHeaders_(sh);
  const keyCol = headers.indexOf("key");
  const valCol = headers.indexOf("value");
  if (keyCol === -1 || valCol === -1) throw new Error("config sheet missing headers: key,value");

  const last = sh.getLastRow();
  const cfg = {};
  if (last < 2) return cfg;

  const values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  values.forEach(r => {
    const k = String(r[keyCol] || "").trim();
    if (!k) return;
    cfg[k] = r[valCol];
  });

  return cfg;
}

/** ----------------- Items API ----------------- **/

function listItems_(q, limit) {
  const ss = getDb_();
  const sh = getSheet_(ss, SHEET_ITEMS);
  const headers = getHeaders_(sh);
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, items: [] };

  const values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  let items = values.map(r => rowToObject_(headers, r));

  if (q) {
    const qq = q.toLowerCase();
    items = items.filter(it => {
      const hay = [
        it.item_code, it.generic_name, it.full_name, it.dosage_form,
        it.major_class, it.sub_class
      ].map(v => String(v || "").toLowerCase()).join(" ");
      return hay.indexOf(qq) !== -1;
    });
  }

  if (limit && limit > 0) items = items.slice(0, limit);

  return { ok: true, items };
}

function createItem_(item, updatedBy) {
  if (!item) throw new Error("Missing item");

  const required = ["item_code","generic_name","full_name","dosage_form","major_class","sub_class","cost"];
  required.forEach(k => {
    if (item[k] === undefined || item[k] === null || String(item[k]).trim() === "") {
      throw new Error("Missing required field: " + k);
    }
  });

  const ss = getDb_();
  const sh = getSheet_(ss, SHEET_ITEMS);
  const headers = getHeaders_(sh);

  // unique item_code
  const idx = findRowByItemCode_(sh, headers, String(item.item_code));
  if (idx !== -1) throw new Error("item_code already exists: " + item.item_code);

  const cfg = getConfig_();
  const now = new Date().toISOString();
  item.updated_at = now;
  item.updated_by = updatedBy || "";

  // defaults for factors
  if (item.ipd_factor === undefined || item.ipd_factor === "") item.ipd_factor = toNum_(cfg["default_ipd_factor"]) || 1;
  if (item.foreigner_uplift_pct === undefined || item.foreigner_uplift_pct === "") item.foreigner_uplift_pct = toNum_(cfg["default_foreigner_uplift_pct"]) || 0;
  if (item.skg_opd_factor === undefined || item.skg_opd_factor === "") item.skg_opd_factor = 1;
  if (item.skg_ipd_factor === undefined || item.skg_ipd_factor === "") item.skg_ipd_factor = 1;

  sh.appendRow(objectToRow_(headers, item));
  return item;
}

function updatePricing_(itemCode, pricing, updatedBy) {
  if (!itemCode) throw new Error("Missing item_code");
  if (!pricing) throw new Error("Missing pricing");

  const ss = getDb_();
  const sh = getSheet_(ss, SHEET_ITEMS);
  const headers = getHeaders_(sh);

  const rowIndex = findRowByItemCode_(sh, headers, String(itemCode));
  if (rowIndex === -1) throw new Error("Item not found: " + itemCode);

  const rowValues = sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  const item = rowToObject_(headers, rowValues);

  Object.keys(pricing).forEach(k => { item[k] = pricing[k]; });

  item.updated_at = new Date().toISOString();
  item.updated_by = updatedBy || "";

  sh.getRange(rowIndex, 1, 1, headers.length).setValues([objectToRow_(headers, item)]);
  return item;
}

function bulkUpdatePricing_(items, updatedBy) {
  if (!Array.isArray(items) || items.length === 0) return 0;

  const ss = getDb_();
  const sh = getSheet_(ss, SHEET_ITEMS);
  const headers = getHeaders_(sh);

  const last = sh.getLastRow();
  if (last < 2) return 0;
  const values = sh.getRange(2, 1, last - 1, headers.length).getValues();

  const codeCol = headers.indexOf("item_code");
  if (codeCol === -1) throw new Error("items sheet missing header: item_code");

  const map = {};
  values.forEach((r, i) => {
    const code = String(r[codeCol] || "");
    if (code) map[code] = i + 2;
  });

  let updatedCount = 0;
  items.forEach(entry => {
    const code = String(entry.item_code || "");
    const pricing = entry.pricing || {};
    const rowIndex = map[code];
    if (!rowIndex) return;

    const rowValues = sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    const item = rowToObject_(headers, rowValues);

    Object.keys(pricing).forEach(k => { item[k] = pricing[k]; });
    item.updated_at = new Date().toISOString();
    item.updated_by = updatedBy || "";

    sh.getRange(rowIndex, 1, 1, headers.length).setValues([objectToRow_(headers, item)]);
    updatedCount += 1;
  });

  return updatedCount;
}

function findRowByItemCode_(sh, headers, itemCode) {
  const col = headers.indexOf("item_code");
  if (col === -1) throw new Error("items sheet missing header: item_code");
  const last = sh.getLastRow();
  if (last < 2) return -1;

  const values = sh.getRange(2, col + 1, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(itemCode)) return i + 2;
  }
  return -1;
}

/** ----------------- Summary ----------------- **/

function summaryBySubclass_() {
  const ss = getDb_();
  const sh = getSheet_(ss, SHEET_ITEMS);
  const headers = getHeaders_(sh);
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, rows: [] };

  const idxSub = headers.indexOf("sub_class");
  const idxCost = headers.indexOf("cost");
  const idxOpd = headers.indexOf("opd_price");
  const idxIpd = headers.indexOf("ipd_price");

  const values = sh.getRange(2, 1, last - 1, headers.length).getValues();

  const agg = {};
  values.forEach(r => {
    const sub = String(r[idxSub] || "").trim() || "(blank)";
    const cost = toNum_(r[idxCost]);
    const opd = toNum_(r[idxOpd]);
    const ipd = toNum_(r[idxIpd]);

    if (!agg[sub]) agg[sub] = { sub_class: sub, count: 0, sum_gm_opd: 0, sum_gm_ipd: 0, n_gm_opd: 0, n_gm_ipd: 0 };
    agg[sub].count += 1;

    if (cost !== null && opd !== null && opd > 0) {
      const gm = ((opd - cost) / opd) * 100;
      agg[sub].sum_gm_opd += gm;
      agg[sub].n_gm_opd += 1;
    }
    if (cost !== null && ipd !== null && ipd > 0) {
      const gm = ((ipd - cost) / ipd) * 100;
      agg[sub].sum_gm_ipd += gm;
      agg[sub].n_gm_ipd += 1;
    }
  });

  const rows = Object.keys(agg).sort().map(k => {
    const a = agg[k];
    return {
      sub_class: a.sub_class,
      item_count: a.count,
      avg_gm_opd: a.n_gm_opd ? (a.sum_gm_opd / a.n_gm_opd) : null,
      avg_gm_ipd: a.n_gm_ipd ? (a.sum_gm_ipd / a.n_gm_ipd) : null
    };
  });

  return { ok: true, rows };
}