
// "Today" tab content
const todayTabContent = document.getElementById("todayTabContent");
const todayEntriesList = document.getElementById("todayEntriesList");

/********************************************************************
 *  1) "Today" tab rendering
 *  2) Add click/tap toggle for each relevant entry
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

	// Shift TODOs to the end:
    const categoriesForToday = calendarData[todayKey] || {};
    let categoryNames = Object.keys(categoriesForToday);
    categoryNames = categoryNames.filter(name => name !== "TODOs");
    if (categoriesForToday["TODOs"]) {
        categoryNames.push("TODOs");
    }

	// Loop through all categories in your calendarData[currentDateKey]
	for (let categoryName of categoryNames) {
		if (categoryName == "Early Rise") continue;
		const entries = categoriesForToday[categoryName];

		entries.forEach((entry, idx) => {
			if (relevantTitles.includes(entry.title)) {
				
				// Decide the display text
				let displayText = "";
				if (categoryName === "TODOs") {
					displayText = `${entry.title} &nbsp;${entry.description || "(no description)"}`;
				} else {
					displayText = `${entry.title} &nbsp;${categoryName}`;
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