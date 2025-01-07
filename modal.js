
// Modal references
const modalBackdrop = document.getElementById("modalBackdrop");
const entryModal = document.getElementById("entryModal");
const modalTitle = document.getElementById("modalTitle");
const previousEntriesDiv = document.getElementById("previousEntries");
const newEntryTitleField = document.getElementById("newEntryTitle");
const saveEntryBtn = document.getElementById("saveEntryBtn");
const cancelBtn = document.getElementById("cancelBtn");

const categoryEmojisMap = {
	"Weekly Goal": [],
	"Weight / BMI": [],
	"Spending": [],
	"Cals / Protein": [],
	"Mood": ["😀", "🙂", "😑", "😞", "😢"],
	"Alcohol": ["🍺"]
};

// Fallback if the category doesn't appear in the map
const defaultQuickEmojis = ["✅", "❌", "🟡","—"];

function tintEmoji(emoji, div) {
	if (emoji === "😀") div.style.filter = "hue-rotate(60deg)";
	if (emoji === "🙂") div.style.filter = "hue-rotate(30deg)";
	if (emoji === "😞") div.style.filter = "hue-rotate(-30deg)";
	if (emoji === "😢") div.style.filter = "hue-rotate(-60deg)";
}

/********************************************************************
 *  4. Modal handling (view & add/edit entries)
 ********************************************************************/
let currentEditDateKey = null;
let currentEditCategory = null;
const quickEmojis = ["✅", "❌", "🟡"];

function openModal(dateKey, category) {
	currentEditDateKey = dateKey;
	currentEditCategory = category;

	modalTitle.innerHTML = `${category}<br>${formatDateKeyToDateString(dateKey)} Entries:`;

	// Display all previous entries in a row with two textareas + a delete button
	previousEntriesDiv.innerHTML = "";
	const entries = calendarData[dateKey]?.[category] || [];
	if (entries.length === 0) {
		previousEntriesDiv.innerHTML = "No entries yet, select an option below:";
	}

	entries.forEach((entry, idx) => {
		// Container for this entry
		const entryRow = document.createElement("div");
		entryRow.classList.add("entry-row");

		// Decide which emojis apply to this category
		const relevantEmojis = categoryEmojisMap[category] || defaultQuickEmojis;

		let titleElement;
		if (relevantEmojis.includes(entry.title)) {
			// If the title is one of the relevant emojis, display a <select> of all relevant emojis
			titleElement = document.createElement("select");
			titleElement.classList.add("entry-row-drop");

			relevantEmojis.forEach((emoji) => {
				const option = document.createElement("option");
				option.value = emoji;
				option.textContent = emoji;
				if (emoji === entry.title) {
					option.selected = true;
				}
				titleElement.appendChild(option);
			});

			titleElement.addEventListener("change", () => {
				entry.title = titleElement.value;
				// Save immediately
				saveEntryBtn.click();
			});
		} else {
			// Otherwise, fall back to a regular textarea for the plain text
			titleElement = document.createElement("textarea");
			titleElement.classList.add("entry-row-title");
			titleElement.rows = 2;
			titleElement.value = entry.title || "";
			tintEmoji(entry.title, titleElement);
			titleElement.addEventListener("change", () => {
				entry.title = titleElement.value.trim();
				// Save immediately
				saveEntryBtn.click();
			});
		}

		// Create the description textarea
		const descArea = document.createElement("textarea");
		descArea.classList.add("entry-row-desc");
		descArea.rows = 2;
		descArea.value = entry.description || "";
		descArea.placeholder = "Description (optional)";
		descArea.addEventListener("change", () => {
			entry.description = descArea.value.trim();
			// Save immediately
			saveEntryBtn.click();
		});

		// Delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.classList.add("entry-delete-button");
		deleteBtn.textContent = "🗑️";

		// ---------------------------------------------------------
		//  MODIFICATION #2: Confirm user really wants to delete
		// ---------------------------------------------------------
		deleteBtn.addEventListener("click", () => {
			// Request confirmation before deleting
			if (!confirm("Are you sure you want to delete this entry?")) {
				return;
			}
			// Remove this entry from the array
			entries.splice(idx, 1);
			// Re-open modal so user sees updated list
			openModal(dateKey, category);
			// Save
			saveEntryBtn.click();
		});

		// Append elements to the entryRow
		entryRow.appendChild(titleElement);

		// For categories that do have a description field
		if (
			category !== "Weekly Goal" &&
			category !== "Weight / BMI" &&
			category !== "Spending"
		) {
			entryRow.appendChild(descArea);
		} else {
			// If you still want a description for these categories, remove the ‘if’ check
			titleElement.style.width = "200px";
		}

		entryRow.appendChild(deleteBtn);
		previousEntriesDiv.appendChild(entryRow);
	});

	// --- DYNAMIC QUICK BUTTONS ---
	// 1) Clear out newEntryWrap
	const newEntryWrap = document.getElementById("newEntryWrap");
	newEntryWrap.innerHTML = "";

	// 3) Decide which emojis to display
	let emojisToDisplay = categoryEmojisMap[category] || defaultQuickEmojis;

	// 4) For each emoji, create a “button” div and attach the quickEntry event
	emojisToDisplay.forEach((emoji) => {
		const btn = document.createElement("div");
		btn.classList.add("newEntryButton");
		btn.textContent = emoji;
		tintEmoji(emoji, btn);
		btn.onclick = () => quickEntry(emoji);
		newEntryWrap.appendChild(btn);
	});

	// Show the modal
	modalBackdrop.style.display = "flex";
}

function closeModal() {
	modalBackdrop.style.display = "none";
	currentEditDateKey = null;
	currentEditCategory = null;
	newEntryTitleField.value = "";
}

function quickEntry(emoji) {
	document.getElementById("newEntryTitle").value = emoji;
	saveEntryBtn.click();
}

// -------------------------------------------------------
//   MODIFICATION #1: Filter out empty entries on save
// -------------------------------------------------------
saveEntryBtn.addEventListener("click", () => {
	if (!currentEditDateKey || !currentEditCategory) return;

	// Grab references to the array in calendarData
	if (!calendarData[currentEditDateKey]) {
		calendarData[currentEditDateKey] = {};
	}
	if (!calendarData[currentEditDateKey][currentEditCategory]) {
		calendarData[currentEditDateKey][currentEditCategory] = [];
	}
	let entries = calendarData[currentEditDateKey][currentEditCategory];

	// 1) Add new entry if the user typed a title
	const newTitle = newEntryTitleField.value.trim();
	if (newTitle) {
		entries.push({ title: newTitle });
	}

	// 2) Now remove any entries which are blank after trimming
	entries = entries.filter((entry) => {
		const titleIsEmpty = !entry.title || entry.title.trim() === "";
		const descIsEmpty = !entry.description || entry.description.trim() === "";
		// Keep the entry if it has something in title or description
		return !(titleIsEmpty && descIsEmpty);
	});
	calendarData[currentEditDateKey][currentEditCategory] = entries;

	// 3) Save to localStorage
	localStorage.setItem("calendarData", JSON.stringify(calendarData));

	// 4) Close modal and re-render
	const tempDate = currentEditDateKey;
	const tempCat = currentEditCategory;
	closeModal();
	openModal(tempDate, tempCat);
	renderCalendar(currentDate);
});

cancelBtn.addEventListener("click", closeModal);
