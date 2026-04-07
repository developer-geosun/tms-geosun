/**
 * Головний файл Google Apps Script.
 * Після `clasp push` код з'явиться в редакторі скрипту на script.google.com.
 */

/**
 * Приклад HTTP-ендпоінта (Розгорнути → Веб-застосунок → Виконати від імені мене).
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'tms-geosun' }))
    .setMimeType(ContentService.MimeType.JSON);
}
