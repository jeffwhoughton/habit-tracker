/**************************************************************
 * 1. References
 **************************************************************/
const modalBackdrop		= document.getElementById("modalBackdrop");
const entryModal			= document.getElementById("entryModal");
const modalTitle			= document.getElementById("modalTitle");
const previousEntriesDiv	= document.getElementById("previousEntries");
const cancelBtn			= document.getElementById("cancelBtn");

const categoryEmojisMap = {
	"Weekly Goal": [],
	"Weight / BMI": [],
	"Spending": [],
	"Screen Time": [],
	"Cals / Protein": [],
	"Mood": ["😀", "🙂", "😑", "😞", "😢"],
	"Alcohol": ["🍺","🌿","—"]
};

// Fallback if the category doesn't appear in the map
const defaultQuickEmojis = ["⬜", "✅", "❌", "—"];

// Tint certain emojis for demonstration
function tintEmoji(emoji, div) {
	if (emoji === "😀") div.style.filter = "hue-rotate(60deg)";
	if (emoji === "🙂") div.style.filter = "hue-rotate(30deg)";
	if (emoji === "😞") div.style.filter = "hue-rotate(-30deg)";
	if (emoji === "😢") div.style.filter = "hue-rotate(-60deg)";
}

/**************************************************************
 * 2. State variables
 **************************************************************/
let currentEditDateKey = null;
let currentEditCategory = null;

/**************************************************************
 * 3. Core modal functions
 **************************************************************/
function openModal(dateKey, category) {
	currentEditDateKey = dateKey;
	currentEditCategory = category;

	modalTitle.innerHTML = `${category}<br>${formatDateKeyToDateString(dateKey)} Entries:`;

	previousEntriesDiv.innerHTML = "";
	const entries = calendarData[dateKey]?.[category] || [];
	
	// Build each existing entry row
	entries.forEach((entry, idx) => {
		createEntryRow(entry, idx, entries);
	});

	// Create one extra blank row at the end
	createEntryRow({ title: "", description: "" }, entries.length, entries, true);

	// Show the modal
	modalBackdrop.style.display = "flex";

	// Push a new history state
	history.pushState({ modalOpen: true }, "Modal Open");
}

function closeModal() {
	modalBackdrop.style.display = "none";
	currentEditDateKey = null;
	currentEditCategory = null;

	// Go back in the history stack if modal was opened
	if (history.state?.modalOpen) {
		history.back();
	}
}

/**************************************************************
 * 4. Create (and return) a single entry row
 *    'isBlankRow' determines if this is the "extra" row
 **************************************************************/
function createEntryRow(entry, idx, entries, isBlankRow = false) {
	// Container for this entry
	const entryRow = document.createElement("div");
	entryRow.classList.add("entry-row");
	
	// Add a small "drag-handle" so you can reorder
	const dragHandle = document.createElement("div");
	dragHandle.classList.add("drag-handle");
	dragHandle.innerHTML = "⋮⋮"; // or any icon
	if (isBlankRow) {
		dragHandle.style.visibility = "hidden";
	}

	// Mark row as draggable
	entryRow.draggable = true;
	entryRow.addEventListener("dragstart", (e) => {
		// Store the start index
		e.dataTransfer.setData("text/plain", idx.toString());
		// Add some style
		entryRow.classList.add("dragging");
	});
	entryRow.addEventListener("dragend", () => {
		entryRow.classList.remove("dragging");
	});
	entryRow.addEventListener("dragover", (e) => {
		e.preventDefault();
		// This will let us drop here
	});
	entryRow.addEventListener("drop", (e) => {
		e.preventDefault();
		const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
		const toIndex = idx;

		// Reorder the array
		if (fromIndex !== toIndex && !isBlankRow) {
			const movedItem = entries.splice(fromIndex, 1)[0];
			entries.splice(toIndex, 0, movedItem);
			
			// Save changes to localStorage
			saveData(entries);

			// Re-render the modal without closing it
			openModal(currentEditDateKey, currentEditCategory);
		}
	});

	// Decide which emojis apply to this category
	const relevantEmojis = categoryEmojisMap[currentEditCategory] || defaultQuickEmojis;
	const isEmojiListEmpty = !relevantEmojis || relevantEmojis.length === 0;

	let titleElement;
	let descArea = document.createElement("textarea");
	descArea.classList.add("entry-row-desc");
	descArea.rows = 2;

	if (!isEmojiListEmpty) {
		// If there is at least one emoji in the list
		if (relevantEmojis.includes(entry.title)) {
			// If the title is one of the relevant emojis, display a <select>
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
				entry.title = titleElement.value.trim();
				maybeAddOrRemoveBlankRow(entry, entries, idx, isBlankRow);
			});

			descArea.value = entry.description || "";
			descArea.placeholder = "Description (optional)";
			descArea.addEventListener("change", () => {
				entry.description = descArea.value.trim();
				maybeAddOrRemoveBlankRow(entry, entries, idx, isBlankRow);
			});
		} else {
			// Otherwise, a <select> (with blank + emojis)
			titleElement = document.createElement("select");
			titleElement.classList.add("entry-row-drop");

			// Add an empty option
			const emptyOption = document.createElement("option");
			emptyOption.value = "";
			emptyOption.textContent = "";
			titleElement.appendChild(emptyOption);

			// Insert relevant emojis as additional options
			relevantEmojis.forEach((emoji) => {
				const option = document.createElement("option");
				option.value = emoji;
				option.textContent = emoji;
				titleElement.appendChild(option);
			});

			titleElement.value = relevantEmojis.includes(entry.title) ? entry.title : "";
			titleElement.addEventListener("change", () => {
				entry.title = titleElement.value.trim();
				tintEmoji(entry.title, titleElement);
				maybeAddOrRemoveBlankRow(entry, entries, idx, isBlankRow);
			});

			descArea.value = entry.description || "";
			descArea.placeholder = "Description (optional)";
			descArea.addEventListener("change", () => {
				entry.description = descArea.value.trim();
				maybeAddOrRemoveBlankRow(entry, entries, idx, isBlankRow);
			});
		}
		tintEmoji(entry.title, titleElement);
	} else {
		// If the relevant emoji list is empty, hide the dropdown
		// and use the description field for the "title"
		titleElement = document.createElement("span");
		titleElement.style.display = "none"; // Hide it entirely

		// Place the existing title into the desc field (or just use what's there)
		// Because we are now treating the desc field as the "title"
		descArea.value = entry.title || entry.description || "";
		descArea.placeholder = "Enter text here.";

		// Make it wider:
		descArea.style.width = "80%";

		// When changed, assign descArea to entry.title
		descArea.addEventListener("change", () => {
			entry.title = descArea.value.trim();
			entry.description = ""; // We'll keep the 'description' field empty
			maybeAddOrRemoveBlankRow(entry, entries, idx, isBlankRow);
		});
	}

	// Delete button
	const deleteBtn = document.createElement("button");
	deleteBtn.classList.add("entry-delete-button");
	deleteBtn.textContent = "🗑️";

	// Confirm user really wants to delete
	deleteBtn.addEventListener("click", () => {
		if (!confirm("Are you sure you want to delete this entry?")) {
			return;
		}
		// Remove this entry from the array
		entries.splice(idx, 1);
		// Save
		saveData(entries);
		// Re-render the modal in-place
		openModal(currentEditDateKey, currentEditCategory);
	});

	// Append elements
	entryRow.appendChild(dragHandle);
	entryRow.appendChild(titleElement);
	entryRow.appendChild(descArea);
	entryRow.appendChild(deleteBtn);

	previousEntriesDiv.appendChild(entryRow);
}

/**************************************************************
 * 5. Decide whether to save + add a fresh blank row
 **************************************************************/
function maybeAddOrRemoveBlankRow(entry, entries, idx, isBlankRow) {
	// If user typed something in either the title or the description
	const hasContent = (entry.title && entry.title.trim() !== "") ||
					   (entry.description && entry.description.trim() !== "");

	if (isBlankRow && hasContent) {
		// We convert this blank row into a real entry
		// Then we create a new blank row at the bottom
		entries[idx] = { title: entry.title, description: entry.description };
		
		// Save
		saveData(entries);

		// Re-render
		openModal(currentEditDateKey, currentEditCategory);
	} else if (!isBlankRow) {
		// If this wasn't a blank row, then we just save if there's content
		saveData(entries);
	}
}

/**************************************************************
 * 6. Save data to localStorage, filtering out empty entries
 **************************************************************/
function saveData(entries) {
	// Filter out any completely empty entries
	const filtered = entries.filter((myE) => {
		const t = myE.title ? myE.title.trim() : "";
		const d = myE.description ? myE.description.trim() : "";
		return (t !== "" || d !== "");
	});

	// Reassign filtered array
	calendarData[currentEditDateKey][currentEditCategory] = filtered;

	// Save to localStorage
	localStorage.setItem("calendarData", JSON.stringify(calendarData));

	// Re-render the main calendar
	renderCalendar(currentDate);
}

/**************************************************************
 * 7. Popstate + Cancel handling
 **************************************************************/
window.addEventListener("popstate", (event) => {
	if (event.state?.modalOpen) {
		closeModal();
	}
});

cancelBtn.addEventListener("click", closeModal);
