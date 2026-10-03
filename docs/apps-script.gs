/**
 * giftpicker.io: Google Apps Script web app (bound to the Gift Database sheet).
 *
 * Deploy as: Web app, execute as "Me", access "Anyone".
 * When updating, edit the EXISTING deployment and pick "New version" so the
 * /exec URL (hardcoded in the site) stays the same.
 *
 *   GET  /exec?tab=Gifts  -> { data: [...] }  rows with row_id = the gift's permanent ID
 *                                              (column "ID"; "r<row>" until that column exists).
 *        Only tabs in PUBLIC_TABS are served; Brands holds contact details.
 *   POST /exec  JSON body routed on `type`:
 *     "feedback" -> append to Feedback
 *     "request"  -> append to Requests
 *     "notify"   -> optional email for a request, written to Requests "email"
 *     "brand"    -> append to Brands (the /brands submission form)
 *     "review"   -> internal review tool (password-gated), see handleReview_
 *
 * The review password is NOT in this file. Set it once under
 * Project Settings > Script Properties as REVIEW_SECRET.
 *
 * Owner devices: every browser that unlocks the review tool registers its
 * anonymous clientId in the Script Property OWNER_CLIENT_IDS. When one of
 * those browsers marks a gift "Don't like" on the live site, the gift is
 * rejected (Status Rejected, Review status TRUE) with a note.
 *
 * Free-text "Other" occasions land in the Requests sheet with the occasion
 * column prefixed "NEW: ". Filter on that to see what new categories users
 * are asking for.
 */

// Column order MUST match the existing sheets; clientId is the last column.
const FEEDBACK_HEADERS = [
  "at", "giftId", "giftName", "brand", "reason",
  "reasonLabel", "detail", "answers", "clientId"
];

const REQUEST_HEADERS = [
  "at", "type", "recipient", "age", "occasion",
  "interests", "vibe", "budget", "clientId"
];

const BRAND_HEADERS = [
  "Submitted", "Placement", "Brand", "Contact name", "Email", "Website",
  "Product", "Product link", "Price", "Great gift for", "Notes", "Status"
];

// The GET endpoint is public. Never add a tab that holds personal details.
const PUBLIC_TABS = ["Gifts"];

// Values the review tool may write into the Gifts "Status" column.
const REVIEW_STATUSES = ["Live", "Rejected", "Retired", "Dead", "OOS", "Draft"];

/* ------------------------------------------------------------------ *
 * Abuse limits. Bots can call this endpoint directly, so limits live
 * here rather than on the page. Counters use the script cache and are
 * approximate, which is fine for slowing bots down.
 * ------------------------------------------------------------------ */
const REVIEW_MAX_FAILS = 10;            // wrong passwords allowed per window
const REVIEW_LOCK_SECONDS = 15 * 60;    // then every password check is refused this long
const WRITES_PER_CLIENT_PER_HOUR = 30;  // feedback, requests, opt-ins, brand forms
const WRITES_PER_HOUR = 300;            // across everyone, the backstop for faked clientIds

function reviewLocked_() {
  return CacheService.getScriptCache().get("review_lock") === "1";
}

function noteReviewFail_() {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get("review_fails") || 0) + 1;
  if (fails >= REVIEW_MAX_FAILS) {
    cache.put("review_lock", "1", REVIEW_LOCK_SECONDS);
    cache.remove("review_fails");
  } else {
    cache.put("review_fails", String(fails), REVIEW_LOCK_SECONDS);
  }
}

/** True when this write is within the hourly limits (and counts it). */
function allowWrite_(clientId) {
  const cache = CacheService.getScriptCache();
  const keys = ["writes_all", "writes_" + String(clientId || "anon").slice(0, 80)];
  const counts = keys.map((k) => Number(cache.get(k) || 0));
  if (counts[0] >= WRITES_PER_HOUR || counts[1] >= WRITES_PER_CLIENT_PER_HOUR) return false;
  keys.forEach((k, i) => cache.put(k, String(counts[i] + 1), 3600));
  return true;
}

/* ------------------------------------------------------------------ *
 * Permanent gift IDs. Column "ID" (column A) holds a fixed id per gift,
 * like "r495", so rows can be sorted or moved without breaking gift
 * URLs, shared links, or review writes. Existing gifts keep the id they
 * always had (their old row number); new gifts get the next free number
 * the next time the catalog is read (every 10 minutes). Never copy an ID
 * into a new row: leave it blank and it is filled in.
 * The column was created 10/3/26 (one-time setup, since removed).
 * ------------------------------------------------------------------ */
const ID_HEADER = "ID";

/** True when some gift row lacks a valid ID or repeats one (no lock, no writes). */
function idsNeedFixing_(values) {
  const headers = values[0].map(String);
  const idCol = headers.indexOf(ID_HEADER);
  const giftCol = headers.indexOf("Gift");
  if (idCol === -1 || giftCol === -1) return false;
  const seen = {};
  return values.slice(1).some(function (row) {
    if (String(row[giftCol]).trim() === "") return false;
    const id = String(row[idCol]).trim();
    if (!/^r\d+$/.test(id) || seen[id]) return true;
    seen[id] = true;
    return false;
  });
}

/**
 * Gives every gift row without an ID the next free number, and renumbers
 * later copies of a duplicated ID (the first row keeps it). Returns true
 * when it changed the sheet.
 */
function assignMissingIds_(sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const idCol = headers.indexOf(ID_HEADER);
    const giftCol = headers.indexOf("Gift");
    if (idCol === -1 || giftCol === -1) return false;
    let max = 0;
    values.slice(1).forEach(function (row) {
      const m = /^r(\d+)$/.exec(String(row[idCol]).trim());
      if (m) max = Math.max(max, Number(m[1]));
    });
    const seen = {};
    let changed = false;
    const ids = values.slice(1).map(function (row) {
      let id = String(row[idCol]).trim();
      const hasGift = String(row[giftCol]).trim() !== "";
      if (hasGift && (!/^r\d+$/.test(id) || seen[id])) {
        id = "r" + (++max);
        changed = true;
      }
      if (id) seen[id] = true;
      return [id];
    });
    if (changed) sheet.getRange(2, idCol + 1, ids.length, 1).setValues(ids);
    return changed;
  } finally {
    lock.releaseLock();
  }
}

/** Sheet row of the gift with this id, or -1. Falls back to row numbers until the ID column exists. */
function findGiftRow_(sheet, rowId) {
  const id = String(rowId || "").trim();
  if (!/^r\d+$/.test(id)) return -1;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const idCol = headers.indexOf(ID_HEADER);
  const last = sheet.getLastRow();
  if (idCol === -1) {
    const n = Number(id.slice(1));
    return n >= 2 && n <= last ? n : -1;
  }
  if (last < 2) return -1;
  const ids = sheet.getRange(2, idCol + 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === id) return i + 2;
  return -1;
}

/* ------------------------------------------------------------------ *
 * Catalog edits published at giftpicker.io/sheet-edits.json, so edits
 * never depend on someone typing in a browser tab. Applied only when the
 * catalog is read with ?edits=1 (sent right after a new list is published),
 * so nothing runs in the background. Each edit has a
 * unique id and applies once. "set" only changes a cell that still holds
 * the expected value, on the row whose Gift matches, so a stale or wrong
 * edit is skipped rather than written. The ID column is never edited.
 * Every result is recorded in the "Edit log" tab.
 * Run applyPendingEditsNow() once from the editor to grant the
 * "connect to an external service" permission this needs.
 * ------------------------------------------------------------------ */
const EDITS_URL = "https://giftpicker.io/sheet-edits.json";
const MAX_EDITS_PER_RUN = 50;
const EDIT_LOG_HEADERS = ["at", "edit_id", "op", "row_id", "column", "before", "after", "result"];

function applyPendingEditsNow() {
  applyPendingEdits_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Gifts"));
}

function applyPendingEdits_(sheet) {
  let edits;
  try {
    const res = UrlFetchApp.fetch(EDITS_URL + "?t=" + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return;
    edits = JSON.parse(res.getContentText()).edits || [];
  } catch (err) {
    return;
  }
  const props = PropertiesService.getScriptProperties();
  const done = JSON.parse(props.getProperty("APPLIED_EDITS") || "[]");
  const pending = edits.filter(function (e) { return e && e.id && done.indexOf(e.id) === -1; }).slice(0, MAX_EDITS_PER_RUN);
  if (!pending.length) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const log = ensureSheet_("Edit log", EDIT_LOG_HEADERS);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    const giftCol = headers.indexOf("Gift") + 1;
    const brandIdx = headers.indexOf("Brand");
    const noteCol = headers.indexOf("Feedback") + 1;
    const now = new Date().toISOString();
    const pairKey = function (gift, brand) { return String(gift || "").trim() + "\u0000" + String(brand || "").trim(); };
    const existing = {};
    if (sheet.getLastRow() >= 2) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues().forEach(function (r) {
        existing[pairKey(r[giftCol - 1], r[brandIdx])] = true;
      });
    }
    pending.forEach(function (e) {
      let before = "", after = "", result;
      try {
        if (e.op === "append") {
          const v = e.values || {};
          if (!v.Gift) result = "skipped: no Gift";
          else if (existing[pairKey(v.Gift, v.Brand)]) result = "skipped: already in the sheet";
          else {
            sheet.appendRow(headers.map(function (h) { return h === ID_HEADER ? "" : (v[h] === undefined ? "" : v[h]); }));
            existing[pairKey(v.Gift, v.Brand)] = true;
            after = v.Gift;
            result = "appended";
          }
        } else {
          const row = findGiftRow_(sheet, e.row_id);
          if (row === -1) result = "skipped: no such id";
          else if (String(sheet.getRange(row, giftCol).getValue()).trim() !== String(e.gift || "").trim()) result = "skipped: gift name differs";
          else if (e.op === "set") {
            const col = headers.indexOf(e.column) + 1;
            if (!col || e.column === ID_HEADER) result = "skipped: bad column";
            else {
              const cell = sheet.getRange(row, col);
              before = String(cell.getValue());
              if (before !== String(e.expect === undefined ? "" : e.expect)) result = "skipped: cell changed";
              else { cell.setValue(e.value === undefined ? "" : e.value); after = String(e.value || ""); result = "applied"; }
            }
          } else if (e.op === "note" && noteCol) {
            const cell = sheet.getRange(row, noteCol);
            before = String(cell.getValue() || "").trim();
            after = before ? before + " | " + e.text : String(e.text || "");
            cell.setValue(after);
            result = "applied";
          } else result = "skipped: bad op";
        }
      } catch (err) {
        result = "error: " + String(err).slice(0, 120);
      }
      done.push(e.id);
      log.appendRow([now, e.id, e.op || "", e.row_id || "", e.column || "", before.slice(0, 500), after.slice(0, 500), result]);
    });
    props.setProperty("APPLIED_EDITS", JSON.stringify(done.slice(-400)));
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const tab = (e && e.parameter && e.parameter.tab) || "Gifts";
    if (PUBLIC_TABS.indexOf(tab) === -1) return jsonOut_({ error: "Sheet not found: " + tab });
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
    if (!sheet) return jsonOut_({ error: "Sheet not found: " + tab });

    // Edits are applied only on request (?edits=1, sent right after a new
    // list is published), never on the regular 10-minute catalog read.
    if (tab === "Gifts" && e.parameter.edits === "1") applyPendingEdits_(sheet);
    let values = sheet.getDataRange().getValues();
    // One read per request; the lock and writes happen only when a new row
    // still needs an ID.
    if (tab === "Gifts" && values.length > 1 && idsNeedFixing_(values) && assignMissingIds_(sheet)) {
      values = sheet.getDataRange().getValues();
    }
    if (values.length < 2) return jsonOut_({ data: [] });

    const headers = values[0].map(String);
    const idCol = tab === "Gifts" ? headers.indexOf(ID_HEADER) : -1;
    const data = values.slice(1).map(function (row, i) {
      const fixedId = idCol === -1 ? "" : String(row[idCol]).trim();
      const obj = { row_id: fixedId || "r" + (i + 2) };
      headers.forEach(function (h, c) { obj[h] = row[c]; });
      return obj;
    });
    return jsonOut_({ data: data });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents)
      ? JSON.parse(e.postData.contents)
      : {};
    const type = String(body.type || "").toLowerCase();

    if (type === "review")   return jsonOut_(handleReview_(body));
    // Over the limit: answer as if it worked, so a bot learns nothing.
    if (["feedback", "request", "notify", "brand"].indexOf(type) !== -1 && !allowWrite_(body.clientId)) {
      return jsonOut_({ ok: true });
    }
    if (type === "feedback") return jsonOut_(handleFeedback_(body));
    if (type === "request")  return jsonOut_(handleRequest_(body));
    if (type === "notify")   return jsonOut_(handleNotify_(body));
    if (type === "brand")    return jsonOut_(handleBrand_(body));
    return jsonOut_({ error: "Unknown type: " + type });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

function handleFeedback_(p) {
  const sheet = ensureSheet_("Feedback", FEEDBACK_HEADERS);
  sheet.appendRow([
    p.at || new Date().toISOString(),
    p.giftId || "",
    p.giftName || "",
    p.brand || "",
    p.reason || "",
    p.reasonLabel || "",
    p.detail || "",
    safeJson_(p.answers),
    p.clientId || "",
  ]);
  if (p.reason === "dont" && isOwnerDevice_(p.clientId)) rejectFromOwnerFeedback_(p);
  return { ok: true };
}

/** Owner devices, stored as a comma list in Script Properties. */
function ownerDevices_() {
  const raw = PropertiesService.getScriptProperties().getProperty("OWNER_CLIENT_IDS") || "";
  return raw.split(",").map(function (s) { return s.trim(); }).filter(String);
}

function isOwnerDevice_(clientId) {
  const id = String(clientId || "").trim();
  return !!id && ownerDevices_().indexOf(id) !== -1;
}

/** Called after a correct review password, so only the owner's browsers land here. */
function registerOwnerDevice_(clientId) {
  const id = String(clientId || "").trim().slice(0, 80);
  if (!id || id === "ssr" || id === "no-storage" || isOwnerDevice_(id)) return;
  const ids = ownerDevices_().concat([id]).slice(-20);
  PropertiesService.getScriptProperties().setProperty("OWNER_CLIENT_IDS", ids.join(","));
}

/**
 * The owner marked a gift "Don't like" on the live site: reject it the same
 * way the review tool does, after checking the row still holds that gift.
 */
function rejectFromOwnerFeedback_(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Gifts");
  if (!sheet) return;
  const row = findGiftRow_(sheet, p.giftId);
  if (row === -1) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const giftCol = headers.indexOf("Gift") + 1;
  const statusCol = headers.indexOf("Status") + 1;
  const reviewCol = headers.indexOf("Review status") + 1;
  const noteCol = headers.indexOf("Feedback") + 1;
  if (!giftCol || !statusCol || !reviewCol) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (String(sheet.getRange(row, giftCol).getValue()).trim() !== String(p.giftName || "").trim()) return;
    sheet.getRange(row, statusCol).setValue("Rejected");
    sheet.getRange(row, reviewCol).setValue(true);
    if (noteCol) {
      const cell = sheet.getRange(row, noteCol);
      const old = String(cell.getValue() || "").trim();
      const note = "Rejected " + Utilities.formatDate(new Date(), "America/New_York", "M/d/yy") + ": owner marked Don't like on the site.";
      cell.setValue(old ? old + " | " + note : note);
    }
  } finally {
    lock.releaseLock();
  }
}

function handleRequest_(p) {
  const sheet = ensureSheet_("Requests", REQUEST_HEADERS);
  const a = p.answers || {};
  sheet.appendRow([
    p.at || new Date().toISOString(),
    p.type || "request",
    a.recipient || "",
    a.age || "",
    a.occasion || "",
    joinIfArray_(a.interests),
    joinIfArray_(a.vibe),
    a.budget || "",
    p.clientId || "",
  ]);
  return { ok: true };
}

/**
 * Optional email from the "Want a heads-up?" line shown after a request.
 * Writes it onto that shopper's latest matching Requests row (same clientId
 * and interests) in an "email" column, created on first use. If the request
 * row has not landed yet, appends a "notify" row carrying the answers.
 * The Requests tab is never served publicly (see PUBLIC_TABS).
 */
function handleNotify_(p) {
  const email = String(p.email == null ? "" : p.email).trim().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "invalid" };
  const safeEmail = /^[=+\-@]/.test(email) ? "'" + email : email;
  const clientId = String(p.clientId || "").slice(0, 80);
  const a = p.answers || {};
  const interests = String(joinIfArray_(a.interests));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureSheet_("Requests", REQUEST_HEADERS);
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    let emailCol = headers.indexOf("email") + 1;
    if (!emailCol) {
      emailCol = lastCol + 1;
      sheet.getRange(1, emailCol).setValue("email");
    }
    const idCol = headers.indexOf("clientId") + 1;
    const interestsCol = headers.indexOf("interests") + 1;
    const last = sheet.getLastRow();
    if (idCol && interestsCol && clientId && last > 1) {
      const from = Math.max(2, last - 199);
      const rows = sheet.getRange(from, 1, last - from + 1, Math.max(idCol, interestsCol)).getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (String(rows[i][idCol - 1]) === clientId && String(rows[i][interestsCol - 1]) === interests) {
          sheet.getRange(from + i, emailCol).setValue(safeEmail);
          return { ok: true };
        }
      }
    }
    const row = [
      p.at || new Date().toISOString(), "notify", a.recipient || "", a.age || "",
      a.occasion || "", interests, joinIfArray_(a.vibe), a.budget || "", clientId,
    ];
    while (row.length < emailCol - 1) row.push("");
    row.push(safeEmail);
    sheet.appendRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Brand submissions from /brands. Returns { ok: true } only after the row is
 * written, because the form shows success based on this reply.
 */
function handleBrand_(p) {
  const clip = function (v, n) { return String(v == null ? "" : v).trim().slice(0, n || 300); };
  // Honeypot: the hidden "company" field is only ever filled by bots.
  if (clip(p.company)) return { ok: true };
  const row = {
    placement: p.placement === "sponsored" ? "Sponsored placement" : "Editorial review",
    brand: clip(p.brand), contactName: clip(p.contactName), email: clip(p.email),
    website: clip(p.website), product: clip(p.product), productUrl: clip(p.productUrl),
    price: clip(p.price, 60), giftFor: clip(p.giftFor), notes: clip(p.notes, 1500),
  };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email);
  if (!row.brand || !row.contactName || !emailOk || !row.product || !row.productUrl || !row.price) {
    return { ok: false, error: "invalid" };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureSheet_("Brands", BRAND_HEADERS);
    // Leading "=", "+", "-", "@" would be evaluated as a formula; prefix with an apostrophe.
    const safe = function (v) { return /^[=+\-@]/.test(v) ? "'" + v : v; };
    sheet.appendRow([
      new Date(), row.placement, safe(row.brand), safe(row.contactName), safe(row.email),
      safe(row.website), safe(row.product), safe(row.productUrl), safe(row.price),
      safe(row.giftFor), safe(row.notes), "New",
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/**
 * Review tool writes. Every call must carry the REVIEW_SECRET password.
 *   { action: "ping" }  -> { ok: true } when the password is right
 *   { action: "set", rowId: "r123", gift: "<exact Gift cell>", status?, reviewed? }
 * `gift` must match what is in that row right now, so a write can never land
 * on the wrong gift if rows were inserted or deleted since the tool loaded.
 */
function handleReview_(p) {
  const secret = PropertiesService.getScriptProperties().getProperty("REVIEW_SECRET");
  if (!secret) return { ok: false, error: "not_configured" };
  // After too many wrong guesses, refuse every check (even a right one)
  // until the lock expires, so guessing at scale goes nowhere.
  if (reviewLocked_()) return { ok: false, error: "locked" };
  if (!p.secret || String(p.secret) !== secret) {
    noteReviewFail_();
    Utilities.sleep(500);  // slows down password guessing
    return { ok: false, error: "unauthorized" };
  }
  registerOwnerDevice_(p.clientId);
  if (p.action === "ping") return { ok: true };
  if (p.action !== "set") return { ok: false, error: "bad_action" };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Gifts");
  if (!sheet) return { ok: false, error: "bad_row" };
  const row = findGiftRow_(sheet, p.rowId);
  if (row === -1) return { ok: false, error: "bad_row" };

  if (p.status !== undefined && REVIEW_STATUSES.indexOf(p.status) === -1) {
    return { ok: false, error: "bad_value" };
  }
  if (p.reviewed !== undefined && typeof p.reviewed !== "boolean") {
    return { ok: false, error: "bad_value" };
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const giftCol = headers.indexOf("Gift") + 1;
  const statusCol = headers.indexOf("Status") + 1;
  const reviewCol = headers.indexOf("Review status") + 1;
  if (!giftCol || !statusCol || !reviewCol) return { ok: false, error: "bad_sheet" };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const current = String(sheet.getRange(row, giftCol).getValue()).trim();
    if (current !== String(p.gift || "").trim()) return { ok: false, error: "row_moved" };
    if (p.status !== undefined) sheet.getRange(row, statusCol).setValue(p.status);
    if (p.reviewed !== undefined) sheet.getRange(row, reviewCol).setValue(p.reviewed);
    SpreadsheetApp.flush();
    return {
      ok: true,
      rowId: p.rowId,
      status: String(sheet.getRange(row, statusCol).getValue()),
      reviewed: sheet.getRange(row, reviewCol).getValue() === true,
    };
  } finally {
    lock.releaseLock();
  }
}

/** Arrays go into a cell as "a, b"; appendRow would otherwise write "[Ljava.lang.Object;@...". */
function joinIfArray_(v) {
  if (Array.isArray(v)) return v.join(", ");
  return v == null ? "" : v;
}

function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function safeJson_(v) {
  try { return JSON.stringify(v); } catch (_) { return String(v); }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
