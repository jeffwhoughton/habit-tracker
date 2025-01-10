// Export and Import localStorage data
const exportDataBtn = document.getElementById("exportDataBtn");

let pressTimer;

// Export data as a .txt file (short press)
exportDataBtn.addEventListener("click", () => {
    if (pressTimer) return; // Prevent action if it's a long press

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
});

// Handle long press for mobile and desktop
const startPressTimer = (event) => {
    event.preventDefault(); // Prevent default actions (e.g., context menu on desktop)

    pressTimer = setTimeout(() => {
        pressTimer = null; // Clear the timer to distinguish from a short press

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
    }, 800); // Long press threshold (800ms)
};

const clearPressTimer = () => clearTimeout(pressTimer);

// Add event listeners for both desktop and mobile
exportDataBtn.addEventListener("mousedown", startPressTimer);
exportDataBtn.addEventListener("mouseup", clearPressTimer);
exportDataBtn.addEventListener("mouseleave", clearPressTimer);

exportDataBtn.addEventListener("touchstart", startPressTimer); // Mobile support
exportDataBtn.addEventListener("touchend", clearPressTimer);   // Mobile support
exportDataBtn.addEventListener("touchcancel", clearPressTimer); // Mobile support
