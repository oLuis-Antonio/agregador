document.addEventListener("DOMContentLoaded", () => {
  /* DATE FORMAT */

  function formatShort(dateStr) {
    const date = new Date(dateStr);

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
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

  document.querySelectorAll(".day").forEach((section) => {
    const summary = section.querySelector(".daily-heading");
    if (!summary) return;

    const date = summary.dataset.date;
    summary.textContent = formatLong(date);
  });

  document.querySelectorAll(".article-date").forEach((el) => {
    el.textContent = formatShort(el.dateTime);
  });

  /* COPY LINK */

  document.querySelectorAll(".copy-link").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = btn.dataset.url;

      try {
        await navigator.clipboard.writeText(url);

        btn.textContent = "✓";
        btn.classList.add("copy-link--copied");

        setTimeout(() => {
          btn.textContent = "⛓️‍💥";
          btn.classList.remove("copy-link--copied");
        }, 1200);
      } catch (err) {
        console.error("Erro ao copiar:", err);
      }
    });
  });

  /* THEME */

  const html = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");

  html.setAttribute("data-theme", saved === "light" ? "light" : "dark");

  function updateIcon() {
    toggle.textContent =
      html.getAttribute("data-theme") === "light" ? "🌚" : "🌞";
  }

  updateIcon();

  toggle.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateIcon();
  });
});
