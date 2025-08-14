(function () {
  // Use globalThis for both browser and SSR environments
  var g = (typeof globalThis !== 'undefined') ? globalThis : {};
  g.__env = g.__env || {};
  // NOTES_API_BASE_URL: If set, the app will use REST API at this base URL.
  // Example: "https://api.example.com"
  g.__env.NOTES_API_BASE_URL = g.__env.NOTES_API_BASE_URL || '';
})();
