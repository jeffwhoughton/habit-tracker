// Data structure: For each dateKey -> category -> array of objects
let calendarData = {};

// Attempt to load existing data from localStorage
const savedData = localStorage.getItem("calendarData");
if (savedData) {
	calendarData = JSON.parse(savedData);
}

// *** Variables for copy/paste logic
let copiedData = null;
let copiedDataOldDate = null;

// Some references to DOM elements
const weekDisplay = document.getElementById("weekDisplay");
const calendarTable = document.getElementById("calendarTable");
const tbody = calendarTable.querySelector("tbody");

/********************************************************************
 *	Helpers to decide row styling
 ********************************************************************/
function isWideCell(cat){
	return (
		cat === "Weight / BMI" ||
		cat === "Spending" ||
		cat === "Weekly Goal"
	);
}

function isTallCell(cat){
	return (
		cat === "TODOs" ||
		cat === "Mood" ||
		cat === "Journal"
	);
}

function shouldDisplayDescription(cat){
	return cat == "TODOs";
}

// For categories like "TODOs", we might add extra blank lines on certain days
function howManyNewLinesToAdd(startOfWeek, cat, x){
	if (x == 0) return 0;

	const previousDateKey = formatDateKey(shiftDate(startOfWeek, x-1));
	const previousEntries = calendarData[previousDateKey]?.[cat] || [];

	const currentDateKey = formatDateKey(shiftDate(startOfWeek, x));
	const currentEntries = calendarData[currentDateKey]?.[cat] || [];

	const totalLines = previousEntries.length + howManyNewLinesToAdd(startOfWeek, cat, x-1);
	if (totalLines + currentEntries.length > 13) return 0;
	else return totalLines;
}

/********************************************************************
 *	Core function to render the calendar (for Week/Health)
 ********************************************************************/
function renderCalendar(selectedDate) {
	// Only show the calendar if we're on week/health
	if (selectedTab === "today") {
		calendarTable.style.display = "none";
		return;
	} else {
		calendarTable.style.display = "";
	}

	const categories = categoriesByTab[selectedTab];
	const startOfWeek = getStartOfWeek(selectedDate);

	const monthName = getMonthName(startOfWeek);
	const year = startOfWeek.getFullYear();
	const weekNum = getWeekOfMonth(startOfWeek);

	weekDisplay.textContent = `${monthName} ${year}, W${weekNum}`;

	// Build date headers
	const theadRow = calendarTable.querySelector("thead tr");
	while (theadRow.children.length > 1) {
		theadRow.removeChild(theadRow.lastChild);
	}
	for (let i = 0; i < 7; i++) {
		const d = shiftDate(startOfWeek, i);
		const dayName = d.toLocaleString("default", { weekday: "short" });
		const dateNum = d.getDate();

		const th = document.createElement("th");
		// Highlight today's cell in header
		if (d.toDateString() === new Date().toDateString()) {
			th.style.outline = "1px solid black";
		}
		th.innerHTML = `${dayName}<br>${dateNum}`;
		th.addEventListener("click", () => {
			// Switch app to "Today" tab, set date to 'd'
			currentDate = d;
			activateTab("today");
		});
		theadRow.appendChild(th);
	}

	// Build category rows
	tbody.innerHTML = "";
	categories.forEach((cat) => {
		const row = document.createElement("tr");

		// Category cell
		const categoryFirstColumnCell = document.createElement("td");
		categoryFirstColumnCell.textContent = cat;
		row.appendChild(categoryFirstColumnCell);

		// 7 day cells
		for (let i = 0; i < 7; i++) {
			const d = shiftDate(startOfWeek, i);
			const dateKey = formatDateKey(d);

			const tdTableCell = document.createElement("td");
			if (isWideCell(cat) && i === 0) {
				tdTableCell.colSpan = 7;
			}
			tdTableCell.dataset.dateKey = dateKey;
			tdTableCell.dataset.category = cat;

			const catEntries = calendarData[dateKey]?.[cat] || [];

			const cellWrapper = document.createElement("div");
			if (isTallCell(cat)) {
				cellWrapper.classList.add("cell-wrapper-tall");
			} else {
				cellWrapper.classList.add("cell-wrapper-short");
				if (catEntries.length == 1){
					cellWrapper.style.display = "flex";
				}
			}

			// Possibly add new lines for "TODOs"
			if (isTallCell(cat) && shouldDisplayDescription(cat)) {
				let newLineCount = howManyNewLinesToAdd(startOfWeek, cat, i);
				for (let j = 0; j < newLineCount; j++) {
					const myBr = document.createElement("div");
					myBr.style.height = "13px";
					cellWrapper.appendChild(myBr);
				}
			}

			catEntries.forEach((entry, index) => {
				const cellContentEntry = document.createElement("div");
				if (shouldDisplayDescription(cat)) {
					cellContentEntry.classList.add("cell-content-overflow");
				} else {
					cellContentEntry.classList.add("cell-content-wrapped");
				}
				cellContentEntry.style.zIndex = ((i+1)*100)-index;

				if (d.getDay() === 0 && cellContentEntry.classList.contains('cell-content-overflow')) {
					cellContentEntry.style.marginLeft = "-20px";
				}

				let displayText = "";
				if (isTallCell(cat) && shouldDisplayDescription(cat) && entry.description) {
					displayText = "<br>".repeat(index) +
						entry.title + " " +
						entry.description;
				} else if (entry) {
					displayText = entry.title;						
				}
				if (entry) {
					tintEmoji(entry.title, cellContentEntry);
				}

				cellContentEntry.innerHTML = displayText;
				cellWrapper.appendChild(cellContentEntry);
			});

			// *** We'll attach a combined short-press / long-press logic
			if (cat === "TODOs") {
				// For "TODOs", we want short press = open modal, long press = copy/move
				addPressListenersForTODOs(tdTableCell, dateKey, cat);
			} else {
				// For non-TODOs categories, just open the modal on click
				tdTableCell.addEventListener("click", () => openModal(dateKey, cat));
			}

			if (!isWideCell(cat) || i === 0) {
				tdTableCell.appendChild(cellWrapper);
				row.appendChild(tdTableCell);
			}
		}

		tbody.appendChild(row);
	});
}

/********************************************************************
 *	Combined short press & long press logic for TODOs
 ********************************************************************/
const LONG_PRESS_TIME = 600; // in ms

function addPressListenersForTODOs(cellElement, dateKey, category) {
	let pressTimer = null;
	let isLongPress = false;

	// Helper: Start the press timer
	const startPress = (callback) => {
		isLongPress = false;
		pressTimer = setTimeout(() => {
			isLongPress = true;
			callback(); // Call the long-press action
		}, LONG_PRESS_TIME);
	};

	// Helper: Clear the press timer
	const clearPress = () => {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	};

	// MOUSE events (desktop)
	cellElement.addEventListener("mousedown", (e) => {
		if (e.button !== 0) return; // Only respond to left mouse button
		e.preventDefault(); // Avoid text selection or drag
		startPress(() => handleCellLongPress(dateKey));
	});

	cellElement.addEventListener("mouseup", (e) => {
		clearPress();
		if (!isLongPress) {
			openModal(dateKey, category); // Short press action
		}
	});

	cellElement.addEventListener("mouseleave", clearPress);

	// TOUCH events (mobile)
	cellElement.addEventListener("touchstart", (e) => {
		e.preventDefault(); // Prevent context menu on long press
		startPress(() => handleCellLongPress(dateKey));
	});

	cellElement.addEventListener("touchend", () => {
		clearPress();
		if (!isLongPress) {
			openModal(dateKey, category); // Short press action
		}
	});

	cellElement.addEventListener("touchcancel", clearPress);
}

/********************************************************************
 *	Handle the long-press action on a TODO cell
 *	(copy/paste logic or any long-press functionality)
 ********************************************************************/
function handleCellLongPress(dateKey) {
	if (!copiedData) {
		// Copy logic
		const entries = calendarData[dateKey]?.["TODOs"] || [];
		if (entries.length === 0) return; // Nothing to copy

		copiedData = JSON.parse(JSON.stringify(entries)); // Deep copy
		copiedDataOldDate = dateKey;
		showToast("Entries copied");
	} else {
		// Move logic
		if (copiedDataOldDate === dateKey) return; // No-op for the same cell

		// Clear old date's entries
		if (calendarData[copiedDataOldDate]?.["TODOs"]) {
			calendarData[copiedDataOldDate]["TODOs"] = [];
		}

		// Append to new date
		if (!calendarData[dateKey]["TODOs"]) {
			calendarData[dateKey]["TODOs"] = [];
		}
		calendarData[dateKey]["TODOs"] = calendarData[dateKey]["TODOs"].concat(copiedData);

		// Save changes to localStorage
		localStorage.setItem("calendarData", JSON.stringify(calendarData));

		// Re-render the calendar
		renderCalendar(currentDate);

		// Clear copied data
		copiedData = null;
		copiedDataOldDate = null;

		showToast("Entries moved");
	}
}

/********************************************************************
 *	A simple toast function for feedback
 ********************************************************************/
function showToast(message) {
	const toast = document.createElement("div");
	toast.textContent = message;
	toast.classList.add("toast");
	document.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 1500);
}