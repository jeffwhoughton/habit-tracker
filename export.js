const exportDataBtn = document.getElementById("exportDataBtn");

// Threshold in milliseconds for a "long press"
const LONG_PRESS_THRESHOLD = 600;

let pressTimer = null;
let isLongPress = false; // track whether the user held long enough

function doExport() {
  const data = localStorage.getItem("calendarData");
  if (!data) {
    alert("No data available to export.");
    return;
  }

  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendarData.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log("Short press: Exported data");
}

function doImport() {
  // Create and trigger a file input for importing JSON
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        localStorage.setItem("calendarData", JSON.stringify(importedData));
        alert("Data imported successfully.");
      } catch (error) {
        alert("Invalid JSON file.");
      }
    };

    reader.readAsText(file);
  });

  fileInput.click();
  console.log("Long press: Imported data");
}

// ------------------------------------
// MOUSE events (desktop)
// ------------------------------------
exportDataBtn.addEventListener("mousedown", (e) => {
	console.log("1");
  // Only care about the left mouse button
  if (e.button !== 0) return;

  // Prevent default to avoid text selection or drag
  e.preventDefault();

  isLongPress = false;

  // Start the timer; if it goes off, we know it's a long press
  pressTimer = setTimeout(() => {
    isLongPress = true;
    doImport();
  }, LONG_PRESS_THRESHOLD);
});

exportDataBtn.addEventListener("mouseup", (e) => {
	console.log("2");
  // If we never hit the long press timeout, it's a short press
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
    if (!isLongPress) {
      // If we haven't flagged it as a long press yet, do short press
      doExport();
    }
  }
});

exportDataBtn.addEventListener("mouseleave", () => {
	console.log("3");
  // User moved pointer off the button—cancel the press
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
});

// ------------------------------------
// TOUCH events (mobile)
// ------------------------------------
exportDataBtn.addEventListener("touchstart", (e) => {
	console.log("4");
  e.preventDefault(); // Prevent long-press context menu on mobile
  isLongPress = false;
  pressTimer = setTimeout(() => {
    isLongPress = true;
    doImport();
  }, LONG_PRESS_THRESHOLD);
});

exportDataBtn.addEventListener("touchend", () => {
	console.log("5");
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
    if (!isLongPress) {
      doExport();
    }
  }
});

exportDataBtn.addEventListener("touchcancel", () => {
	console.log("6");
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
});
