// Export localStorage data as a .txt file
document.getElementById("exportDataBtn").addEventListener("click", () => {
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