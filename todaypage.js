// "Today" tab content
const todayTabContent = document.getElementById("todayTabContent");
const todayEntriesList = document.getElementById("todayEntriesList");

/********************************************************************
 *  1) "Today" tab rendering
 *  2) Add click/tap toggle for each relevant entry
 *  3) Show old TODOs (⬜) below the main list
 ********************************************************************/
function renderTodayTab() {
	// Show/hide the appropriate content
	if (selectedTab === "today") {
		todayTabContent.style.display = "block";
		
		// -----------------------------
		//  Show the date in weekDisplay
		// -----------------------------
		weekDisplay.textContent = formatFriendlyDate(currentDate);

		// -----------------------------
		//  Update the H2 heading
		// -----------------------------
		const heading = todayTabContent.querySelector("h2");
		if (currentDate.toDateString() === new Date().toDateString()) {
			heading.textContent = "Things to do today:";
		} else {
			heading.textContent = "Things to do on " + formatFriendlyDate(currentDate) + ":";
		}

	} else {
		todayTabContent.style.display = "none";
		return;
	}

	// Clear out the list
	todayEntriesList.innerHTML = "";

	const todayKey = formatDateKey(currentDate);
	const relevantTitles = ["⬜", "✅", "❌"];

	// Shift TODOs to the end
	const categoriesForToday = calendarData[todayKey] || {};
	let categoryNames = Object.keys(categoriesForToday);
	categoryNames = categoryNames.filter(name => name !== "TODOs");
	if (categoriesForToday["TODOs"]) {
		categoryNames.push("TODOs");
	}

	// Loop through all categories for current day
	for (let categoryName of categoryNames) {
		// Skip "Early Rise" if it's not relevant
		if (categoryName === "Early Rise") continue;

		const entries = categoriesForToday[categoryName] || [];
		entries.forEach((entry, idx) => {
			if (relevantTitles.includes(entry.title)) {
				// Decide the display text
				let displayText = "";
				if (categoryName === "TODOs") {
					displayText = `${entry.title}\u00A0${entry.description || "(no description)"}`;
				} else {
					displayText = `${entry.title}\u00A0${categoryName}`;
				}

				// Create an <li> for the "todayEntriesList"
				const li = document.createElement("li");
				li.innerHTML = displayText;

				/** 
				 * ===============================
				 *   CLICK HANDLER: CYCLE TITLE
				 * ===============================
				 */
				li.addEventListener("click", () => {
					const newTitle = getNextTitle(entry.title);
					entry.title = newTitle;

					// Save changes to localStorage
					localStorage.setItem("calendarData", JSON.stringify(calendarData));

					// Re-render to see updated titles
					renderCalendar(currentDate);
					renderTodayTab();
				});

				todayEntriesList.appendChild(li);
			}
		});
	}

	// -----------------------------------------------------
	//  At the end, display any old TODOs with title "⬜"
	// -----------------------------------------------------
	const oldTodos = [];
	for (let dateKey in calendarData) {
		// Check only past dates (using string comparison for YYYY-MM-DD format)
		if (dateKey < todayKey) {
			const categories = calendarData[dateKey];
			if (categories && categories["TODOs"]) {
				for (let oldTodo of categories["TODOs"]) {
					if (oldTodo.title === "⬜") {
						oldTodos.push({
							dateKey,
							entry: oldTodo
						});
					}
				}
			}
		}
	}

	if (oldTodos.length > 0) {
		// Add a header for old TODOs
		const oldTodosHeader = document.createElement("h2");
		oldTodosHeader.textContent = "Old TODOs:";
		todayTabContent.appendChild(oldTodosHeader);

		// Create a separate list for them
		const oldTodosList = document.createElement("ul");

		oldTodos.forEach(({ dateKey, entry }) => {
			const li = document.createElement("li");
			// Show the date plus the description or a default
			const dateObj = new Date(dateKey);
			const friendlyDate = formatFriendlyDate(dateObj);
			li.innerHTML = `⬜\u00A0${entry.description || "(no description)"} <span style="font-size:0.6rem">(${friendlyDate})</span>`;

			// Optional: If you want them clickable to cycle titles,
			li.addEventListener("click", () => {
				const newTitle = getNextTitle(entry.title);
				entry.title = newTitle;
				// Save changes
				localStorage.setItem("calendarData", JSON.stringify(calendarData));
				// Re-render
				renderCalendar(currentDate);
				renderTodayTab();
			});

			oldTodosList.appendChild(li);
		});

		todayTabContent.appendChild(oldTodosList);
	}
}

/**
 * Helper function to cycle through "⬜", "✅", "❌"
 */
function getNextTitle(currentTitle) {
	const cycle = ["⬜", "✅", "❌"];
	const currentIndex = cycle.indexOf(currentTitle);
	if (currentIndex === -1) {
		// If somehow not in the list, default to the first
		return cycle[0];
	} else {
		return cycle[(currentIndex + 1) % cycle.length];
	}
}
