
document.getElementById("prepopulateBtn").addEventListener("click", prepopulateDefaultsForCurrentWeek);

function prepopulateDefaultsForCurrentWeek() {
	// === Confirmation popup ===
	if (!confirm("Are you sure you want to prepopulate this week's data?")) {
		return; // Exit if user cancels
	}

	// Get the Monday of the currently displayed week
	const startOfWeek = getStartOfWeek(currentDate);

	// Define each default entry:
	// Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4, Saturday=5, Sunday=6
	const defaultEntries = [
		{ dayIndex: 0, category: "Workout", title: "⬜", description: "" },
		{ dayIndex: 1, category: "Work", title: "⬜", description: "" },
		{ dayIndex: 2, category: "Workout", title: "⬜", description: "" },
		{ dayIndex: 3, category: "Work", title: "⬜", description: "" },
		{ dayIndex: 3, category: "TODOs", title: "⬜", description: "Vacuum" },
		{ dayIndex: 3, category: "TODOs", title: "⬜", description: "Bathrooms" },
		{ dayIndex: 3, category: "TODOs", title: "⬜", description: "Waterplants" },
		{ dayIndex: 4, category: "Workout", title: "⬜", description: "" },
		{ dayIndex: 6, category: "TODOs", title: "⬜", description: "Laundry" },
		{ dayIndex: 6, category: "TODOs", title: "⬜", description: "Shopping" }
	];

	// Loop through each default entry and insert into calendarData
	defaultEntries.forEach((entry) => {
		const targetDate = shiftDate(startOfWeek, entry.dayIndex);
		const dateKey = formatDateKey(targetDate);

		// Ensure there's an object for this date
		if (!calendarData[dateKey]) {
			calendarData[dateKey] = {};
		}
		// Ensure there's an array for this category
		if (!calendarData[dateKey][entry.category]) {
			calendarData[dateKey][entry.category] = [];
		}

		// Push this new entry
		calendarData[dateKey][entry.category].push({
			title: entry.title,
			description: entry.description
		});
	});

	// Save to localStorage
	localStorage.setItem("calendarData", JSON.stringify(calendarData));

	// Re-render
	renderCalendar(currentDate);
	renderTodayTab();
}