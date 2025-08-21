// devtools.js
// This script has one job: create the panel.
// All the real logic is in panel.js.

try {
  chrome.devtools.panels.create(
    "API Monitor",           // Panel title
    "",
    "panel.html",            // The HTML page for the panel's content
    null                     // Callback function
  );
} catch (e) {
  console.error(e);
}