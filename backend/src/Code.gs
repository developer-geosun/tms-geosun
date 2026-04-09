/**
 * MVP auth API для Google Apps Script.
 * Примітка: усі коментарі в коді навмисно українською.
 */

var AUTH_ACCESS_TTL_SEC = 900;
var AUTH_REFRESH_TTL_SEC = 60 * 60 * 24 * 7;
var AUTH_LOGIN_RATE_LIMIT_WINDOW_SEC = 60;
var AUTH_LOGIN_RATE_LIMIT_ATTEMPTS = 5;
var AUTH_CLOCK_SKEW_SEC = 30;
var AUTH_USERS_SHEET = 'users';
var AUTH_SESSIONS_SHEET = 'refresh_sessions';
var AUTH_SCRIPT_PROP_SECRET = 'AUTH_SECRET';
var AUTH_DEFAULT_SECRET = 'change-me-in-script-properties';

function doGet(e) {
  try {
    var path = resolveRoutePath_(e, null);
    if (!path || path === '/') {
      return jsonResponse_(200, { ok: true, service: 'tms-geosun' });
    }

    if (path === '/auth/me') {
      var meContext = requireAccess_(e, ['admin', 'manager', 'user']);
      return jsonResponse_(200, {
        id: meContext.user.id,
        email: meContext.user.email,
        roles: meContext.user.roles
      });
    }

    return errorResponse_(404, 'Not found');
  } catch (error) {
    return toErrorResponse_(error);
  }
}

function doPost(e) {
  try {
    var body = parseJsonBody_(e);
    var path = resolveRoutePath_(e, body);

    if (path === '/auth/login') {
      return handleLogin_(body, e);
    }
    if (path === '/auth/refresh') {
      return handleRefresh_(body);
    }
    if (path === '/auth/logout') {
      return handleLogout_(body);
    }

    return errorResponse_(404, 'Not found');
  } catch (error) {
    return toErrorResponse_(error);
  }
}

function handleLogin_(body, e) {
  var email = normalizeEmail_(body && body.email);
  var password = String((body && body.password) || '');

  if (!isValidEmail_(email) || password.length < 8) {
    throw apiError_(400, 'Invalid credentials payload');
  }

  var rateKey = 'login:' + email + ':' + getClientFingerprint_(e);
  if (!checkRateLimit_(rateKey, AUTH_LOGIN_RATE_LIMIT_WINDOW_SEC, AUTH_LOGIN_RATE_LIMIT_ATTEMPTS)) {
    logEvent_('login_failed', { email: email, reason: 'rate_limited' });
    throw apiError_(429, 'Too many attempts');
  }

  var user = findUserByEmail_(email);
  if (!user || user.status !== 'active') {
    logEvent_('login_failed', { email: email, reason: 'user_not_found_or_blocked' });
    throw apiError_(401, 'Invalid email or password');
  }

  if (!verifyPassword_(password, user.passwordHash)) {
    logEvent_('login_failed', { email: email, reason: 'invalid_password' });
    throw apiError_(401, 'Invalid email or password');
  }

  var accessToken = issueAccessToken_(user);
  var refreshToken = createRefreshSession_(user.id);
  logEvent_('login_success', { email: email, userId: user.id });

  return jsonResponse_(200, {
    accessToken: accessToken,
    refreshToken: refreshToken,
    expiresIn: AUTH_ACCESS_TTL_SEC,
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles
    }
  });
}

function handleRefresh_(body) {
  var refreshToken = String((body && body.refreshToken) || '');
  if (!refreshToken) {
    throw apiError_(400, 'refreshToken is required');
  }

  var session = findRefreshSessionByToken_(refreshToken);
  if (!session || session.revokedAt || session.expiresAt <= nowSec_()) {
    logEvent_('refresh_failed', { reason: 'token_invalid_or_expired' });
    throw apiError_(401, 'Invalid refresh token');
  }

  var user = findUserById_(session.userId);
  if (!user || user.status !== 'active') {
    logEvent_('refresh_failed', { reason: 'user_inactive', userId: session.userId });
    throw apiError_(401, 'User inactive');
  }

  var accessToken = issueAccessToken_(user);
  return jsonResponse_(200, {
    accessToken: accessToken,
    expiresIn: AUTH_ACCESS_TTL_SEC
  });
}

function handleLogout_(body) {
  var refreshToken = String((body && body.refreshToken) || '');
  if (!refreshToken) {
    throw apiError_(400, 'refreshToken is required');
  }

  revokeRefreshSessionByToken_(refreshToken);
  logEvent_('logout', {});
  return jsonResponse_(204, {});
}

function requireAccess_(e, allowedRoles) {
  var authHeader = getHeader_(e, 'authorization');
  if (!authHeader || authHeader.indexOf('Bearer ') !== 0) {
    throw apiError_(401, 'Missing bearer token');
  }

  var token = authHeader.substring(7);
  var payload = verifyAccessToken_(token);

  var user = findUserById_(payload.sub);
  if (!user || user.status !== 'active') {
    throw apiError_(401, 'User not active');
  }

  if (!hasRequiredRole_(user.roles, allowedRoles)) {
    throw apiError_(403, 'Forbidden');
  }

  return { user: user, tokenPayload: payload };
}

function hasRequiredRole_(roles, allowedRoles) {
  for (var i = 0; i < roles.length; i += 1) {
    if (allowedRoles.indexOf(roles[i]) !== -1) {
      return true;
    }
  }
  return false;
}

function issueAccessToken_(user) {
  var now = nowSec_();
  var payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    iat: now,
    exp: now + AUTH_ACCESS_TTL_SEC
  };

  var payloadJson = JSON.stringify(payload);
  var payloadB64 = toBase64Url_(payloadJson);
  var signature = sign_(payloadB64);
  return payloadB64 + '.' + signature;
}

function verifyAccessToken_(token) {
  var parts = token.split('.');
  if (parts.length !== 2) {
    throw apiError_(401, 'Invalid token format');
  }

  var payloadB64 = parts[0];
  var signature = parts[1];
  var expected = sign_(payloadB64);
  if (!safeEquals_(signature, expected)) {
    throw apiError_(401, 'Invalid token signature');
  }

  var payloadText = fromBase64Url_(payloadB64);
  var payload;
  try {
    payload = JSON.parse(payloadText);
  } catch (_e) {
    throw apiError_(401, 'Invalid token payload');
  }

  var now = nowSec_();
  if (!payload.exp || payload.exp + AUTH_CLOCK_SKEW_SEC < now) {
    throw apiError_(401, 'Token expired');
  }

  return payload;
}

function createRefreshSession_(userId) {
  var token = createRandomToken_();
  var tokenHash = sha256Hex_(token);
  var now = nowSec_();
  var expiresAt = now + AUTH_REFRESH_TTL_SEC;
  var sheet = getOrCreateSheet_(AUTH_SESSIONS_SHEET);
  sheet.appendRow([tokenHash, userId, String(now), String(expiresAt), '']);
  return token;
}

function findRefreshSessionByToken_(token) {
  var tokenHash = sha256Hex_(token);
  var sheet = getOrCreateSheet_(AUTH_SESSIONS_SHEET);
  var rows = readSheetRows_(sheet);
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (String(row.tokenHash) === tokenHash) {
      return {
        rowIndex: row._rowIndex,
        tokenHash: row.tokenHash,
        userId: String(row.userId),
        createdAt: Number(row.createdAt),
        expiresAt: Number(row.expiresAt),
        revokedAt: row.revokedAt ? Number(row.revokedAt) : 0
      };
    }
  }
  return null;
}

function revokeRefreshSessionByToken_(token) {
  var session = findRefreshSessionByToken_(token);
  if (!session || session.revokedAt) {
    return;
  }

  var sheet = getOrCreateSheet_(AUTH_SESSIONS_SHEET);
  var revokedAtCol = 5;
  sheet.getRange(session.rowIndex, revokedAtCol).setValue(String(nowSec_()));
}

function findUserByEmail_(email) {
  var sheet = getOrCreateSheet_(AUTH_USERS_SHEET);
  var rows = readSheetRows_(sheet);
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (normalizeEmail_(row.email) === email) {
      return mapUserRow_(row);
    }
  }
  return null;
}

function findUserById_(id) {
  var sheet = getOrCreateSheet_(AUTH_USERS_SHEET);
  var rows = readSheetRows_(sheet);
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (String(row.id) === String(id)) {
      return mapUserRow_(row);
    }
  }
  return null;
}

function mapUserRow_(row) {
  var roles = String(row.roles || '')
    .split(',')
    .map(function (role) { return role.trim(); })
    .filter(function (role) { return !!role; });
  return {
    id: String(row.id),
    email: normalizeEmail_(row.email),
    passwordHash: String(row.passwordHash || ''),
    roles: roles,
    status: String(row.status || 'active')
  };
}

function verifyPassword_(password, storedHash) {
  if (!storedHash || storedHash.indexOf('sha256:') !== 0) {
    return false;
  }

  var parts = storedHash.split(':');
  if (parts.length !== 3) {
    return false;
  }

  var salt = parts[1];
  var hash = parts[2];
  var actual = sha256Hex_(salt + ':' + password);
  return safeEquals_(actual, hash);
}

function createPasswordHash_(password, salt) {
  var usedSalt = salt || createRandomToken_().substring(0, 16);
  var hash = sha256Hex_(usedSalt + ':' + password);
  return 'sha256:' + usedSalt + ':' + hash;
}

function checkRateLimit_(key, windowSec, maxAttempts) {
  var cache = CacheService.getScriptCache();
  var now = nowSec_();
  var payloadText = cache.get(key);
  var payload = payloadText ? JSON.parse(payloadText) : null;

  if (!payload || payload.windowStart + windowSec < now) {
    payload = { windowStart: now, attempts: 0 };
  }

  payload.attempts += 1;
  cache.put(key, JSON.stringify(payload), windowSec);
  return payload.attempts <= maxAttempts;
}

function resolveRoutePath_(e, body) {
  // Порядок пріоритету маршруту:
  // 1) ?route=/auth/login
  // 2) body.route
  // 3) pathInfo (для середовищ, де воно підтримується)
  var routeFromQuery = e && e.parameter && e.parameter.route ? String(e.parameter.route) : '';
  var routeFromBody = body && body.route ? String(body.route) : '';
  var routeFromPathInfo = e && e.pathInfo ? String(e.pathInfo) : '';

  var candidate = routeFromQuery || routeFromBody || routeFromPathInfo;
  if (!candidate) {
    return '/';
  }
  return '/' + candidate.replace(/^\/+/, '');
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (_error) {
    throw apiError_(400, 'Invalid JSON');
  }
}

function getHeader_(e, key) {
  var lower = String(key || '').toLowerCase();
  if (!e || !e.headers) {
    return '';
  }
  var headers = e.headers;
  for (var headerName in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, headerName) && String(headerName).toLowerCase() === lower) {
      return String(headers[headerName] || '');
    }
  }
  return '';
}

function getClientFingerprint_(e) {
  var forwardedFor = getHeader_(e, 'x-forwarded-for');
  var userAgent = getHeader_(e, 'user-agent');
  return sha256Hex_(forwardedFor + '|' + userAgent).substring(0, 12);
}

function nowSec_() {
  return Math.floor(Date.now() / 1000);
}

function sign_(value) {
  var signature = Utilities.computeHmacSha256Signature(value, getAuthSecret_());
  return toBase64UrlBytes_(signature);
}

function getAuthSecret_() {
  return PropertiesService.getScriptProperties().getProperty(AUTH_SCRIPT_PROP_SECRET) || AUTH_DEFAULT_SECRET;
}

function createRandomToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function toBase64Url_(text) {
  return Utilities.base64EncodeWebSafe(text, Utilities.Charset.UTF_8).replace(/=+$/g, '');
}

function toBase64UrlBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function fromBase64Url_(text) {
  var normalized = text;
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }
  var decoded = Utilities.base64DecodeWebSafe(normalized);
  return Utilities.newBlob(decoded).getDataAsString();
}

function sha256Hex_(text) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  var out = '';
  for (var i = 0; i < digest.length; i += 1) {
    var value = digest[i];
    if (value < 0) {
      value += 256;
    }
    var hex = value.toString(16);
    if (hex.length === 1) {
      hex = '0' + hex;
    }
    out += hex;
  }
  return out;
}

function safeEquals_(a, b) {
  var left = String(a || '');
  var right = String(b || '');
  if (left.length !== right.length) {
    return false;
  }
  var mismatch = 0;
  for (var i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function apiError_(status, message) {
  var error = new Error(message);
  error.status = status;
  return error;
}

function toErrorResponse_(error) {
  var status = error && error.status ? Number(error.status) : 500;
  var message = error && error.message ? String(error.message) : 'Internal error';
  return errorResponse_(status, message);
}

function errorResponse_(status, message) {
  return jsonResponse_(status, {
    error: {
      code: status,
      message: message
    }
  });
}

function jsonResponse_(status, payload) {
  var output = ContentService.createTextOutput(status === 204 ? '' : JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function logEvent_(eventName, details) {
  var safeDetails = details || {};
  if (safeDetails.accessToken) {
    delete safeDetails.accessToken;
  }
  if (safeDetails.refreshToken) {
    delete safeDetails.refreshToken;
  }
  Logger.log(JSON.stringify({ event: eventName, details: safeDetails, timestamp: new Date().toISOString() }));
}

function getOrCreateSheet_(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw apiError_(500, 'Spreadsheet not available');
  }

  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheetHeaders_(sheetName, sheet);
  }
  return sheet;
}

function initializeSheetHeaders_(sheetName, sheet) {
  if (sheetName === AUTH_USERS_SHEET) {
    sheet.getRange(1, 1, 1, 5).setValues([['id', 'email', 'passwordHash', 'roles', 'status']]);
    return;
  }

  if (sheetName === AUTH_SESSIONS_SHEET) {
    sheet.getRange(1, 1, 1, 5).setValues([['tokenHash', 'userId', 'createdAt', 'expiresAt', 'revokedAt']]);
  }
}

function readSheetRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  var headerValues = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var rows = [];
  for (var i = 0; i < data.length; i += 1) {
    var rowData = data[i];
    var row = { _rowIndex: i + 2 };
    for (var j = 0; j < headerValues.length; j += 1) {
      row[String(headerValues[j])] = rowData[j];
    }
    rows.push(row);
  }
  return rows;
}
