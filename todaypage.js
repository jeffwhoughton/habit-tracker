/***************************************
 * Global variables
 ***************************************/
const todayTabContent			= document.getElementById("todayTabContent");
const todayEntriesList			= document.getElementById("todayEntriesList");

// Global array to store old entries once they are removed from calendarData
var removedOldTodos				= [];

/********************************************************************
 *	1) "Today" tab rendering
 *	2) Add click/tap toggle for each relevant entry
 *	3) Show old TODOs (only "⬜" left in calendarData OR removed ones)
 ********************************************************************/
function renderTodayTab() {
	todayTabContent.innerHTML = "<h2>Things to do today:</h2>" +
		"<ul id='todayEntriesList'></ul>";
	const todayEntriesList = document.getElementById("todayEntriesList");


	// Show/hide the appropriate content
	if (selectedTab === "today") {
		todayTabContent.style.display = "block";
		
		// -----------------------------
		//	Show the date in weekDisplay
		// -----------------------------
		weekDisplay.textContent = formatFriendlyDate(currentDate);

		// -----------------------------
		//	Update the H2 heading
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

	// Clear out the list for "Today" tasks
	todayEntriesList.innerHTML = "";

	const todayKey		= formatDateKey(currentDate);
	const relevantTitles= ["⬜", "✅", "❌"];

	// Shift TODOs to the end
	const categoriesForToday	= calendarData[todayKey] || {};
	let categoryNames			= Object.keys(categoriesForToday);
	categoryNames = categoryNames.filter(name => name !== "TODOs");
	if (categoriesForToday["TODOs"]) {
		categoryNames.push("TODOs");
	}

	// Loop through all categories for current day
	for (let categoryName of categoryNames) {
		// Skip "Early Rise" if it's not relevant
		if (categoryName === "Early Rise") continue;

		const entries = categoriesForToday[categoryName] || [];
		entries.forEach((entry) => {
			// Only render it in the "today" list if the title is one of our relevant symbols
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
					const newTitle	= getNextTitle(entry.title);
					entry.title		= newTitle;

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
	//	Render "Old TODOs" below: 
	//	  - STILL in calendar (with title "⬜" only), or
	//	  - REMOVED from calendarData (stored in removedOldTodos)
	// -----------------------------------------------------
	const oldTodosToDisplay = [];

	// 1) Gather all old "⬜" from calendarData
	for (let dateKey in calendarData) {
		if (dateKey < todayKey) {  // Only past dates
			const categories = calendarData[dateKey];
			if (categories && categories["TODOs"]) {
				for (let oldTodo of categories["TODOs"]) {
					if (oldTodo.title === "⬜" || isEntryInRemoved(dateKey,oldTodo)) {
						oldTodosToDisplay.push({ dateKey, entry: oldTodo });
					}
				}
			}
		}
	}

	if (oldTodosToDisplay.length > 0) {
		// Add a header for old TODOs
		const oldTodosHeader = document.createElement("h2");
		oldTodosHeader.textContent = "Old TODOs:";
		todayTabContent.appendChild(oldTodosHeader);

		// Create a separate list for them
		const oldTodosList = document.createElement("ul");

		oldTodosToDisplay.forEach(({ dateKey, entry }) => {
			const li			= document.createElement("li");
			const dateObj		= new Date(dateKey);
			const friendlyDate	= formatFriendlyDate(dateObj);

			// Show the date plus the description or a default
			li.innerHTML = `${entry.title}\u00A0${entry.description || "(no description)"} <span style="font-size:0.6rem">(${friendlyDate})</span>`;

			// ------------------------------------
			//   CLICK HANDLER for OLD TODO entries
			// ------------------------------------
			li.addEventListener("click", () => {

				// Push into removedOldTodos if not already stored
				if (!removedOldTodos.find(r => r.entry === entry)) {
					removedOldTodos.push({ dateKey, entry });
				}

				// Now cycle the title
				const newTitle = getNextTitle(entry.title);
				entry.title		= newTitle;

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
	const cycle			= ["⬜", "✅", "❌"];
	const currentIndex	= cycle.indexOf(currentTitle);
	if (currentIndex === -1) {
		// If somehow not in the list, default to the first
		return cycle[0];
	} else {
		return cycle[(currentIndex + 1) % cycle.length];
	}
}

/**
 * Helper to check if a given entry is still in calendarData
 */
function isEntryInRemoved(dateKey, entry) {
	// Iterate through the removedOldTodos array
	return removedOldTodos.some(removed => 
		removed.dateKey === dateKey && removed.entry === entry
	);
}
