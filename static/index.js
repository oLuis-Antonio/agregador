document.addEventListener("DOMContentLoaded", () => {
  function formatShort(dateStr) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatLong(dateStr) {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(`${y}-${m}-${d}T00:00:00`);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /* Collapse */

  document.querySelectorAll(".day").forEach((section) => {
    const btn = section.querySelector(".daily-heading-toggle");
    const content = section.querySelector(".day-content");
    const date = btn.dataset.date;

    btn.textContent = formatLong(date);

    // começa expandido
    content.style.maxHeight = content.scrollHeight + "px";

    btn.addEventListener("click", () => {
      const isCollapsed = section.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", (!isCollapsed).toString());

      if (isCollapsed) {
        content.style.maxHeight = "0px";
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  document.querySelectorAll(".article-date").forEach((el) => {
    el.textContent = formatShort(el.dateTime);
  });

  /* Theme */

  const html = document.documentElement;
  const toggle = document.getElementById("theme-toggle");

  const savedTheme = localStorage.getItem("theme");

  /* padrão é dark */
  if (savedTheme === "light") {
    html.setAttribute("data-theme", "light");
  } else {
    html.setAttribute("data-theme", "dark");
  }

  toggle.addEventListener("click", () => {
    const isLight = html.getAttribute("data-theme") === "light";
    const next = isLight ? "dark" : "light";

    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
});
