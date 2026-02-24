// Renderizar timestamp de build
(function renderBuildTimestamp() {
  const timestamp = document.getElementById("build-timestamp");
  if (timestamp) {
    timestamp.innerText = new Date(timestamp.getAttribute("datetime")).toLocaleString();
  }
})();

// Renderizar dia da semana (se você quiser)
(function renderWeekday() {
  document.querySelectorAll(".js-offset-weekday").forEach((element) => {
    const weekday = new Date(element.getAttribute("data-offset-date")).toLocaleString(window.navigator.language, {
      weekday: "long",
      timeZone: "UTC",
    });
    element.innerText = weekday;
  });
})();