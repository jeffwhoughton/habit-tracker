/********************************************************************
 *  2. Date utility functions
 ********************************************************************/
function getStartOfWeek(date) {
	const newDate = new Date(date);
	const dayOfWeek = newDate.getDay(); 
	newDate.setDate(newDate.getDate() - dayOfWeek + 1);
	return newDate;
}

function shiftDate(date, days) {
	const newDate = new Date(date);
	newDate.setDate(newDate.getDate() + days);
	return newDate;
}

function formatDateKey(date) {
	return date.toISOString().slice(0,10); 
}


function getMonthName(date) {
	return date.toLocaleString("default", { month: "long" });
}

function getWeekOfMonth(date) {
	// date is the Sunday of the week
	const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	let weekCount = 1;
	let sundayCursor = getStartOfWeek(firstDayOfMonth);

	if (sundayCursor.getMonth() < date.getMonth()) {
		sundayCursor = shiftDate(sundayCursor, 7);
	}

	while (sundayCursor <= date) {
		sundayCursor = shiftDate(sundayCursor, 7);
		weekCount++;
	}
	return weekCount - 1;
	}

	Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function formatDateKeyToDateString(dateKey) {
	const [year, month, day] = dateKey.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	return date.toDateString();
}