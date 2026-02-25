document.addEventListener('DOMContentLoaded', () => {

  function parseDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return { y, m, d };
  }

  function formatShort(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    return `${d.d}/${d.m}/${d.y}`;
  }

  function formatLong(dateStr) {
    if (!dateStr) return '';

    const [y, m, d] = dateStr.split('-');

    const date = new Date(`${y}-${m}-${d}T00:00:00`);

    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // HEADER (usa data já agrupada)
  document.querySelectorAll('.daily-heading-toggle__date').forEach(el => {
    const date = el.getAttribute('data-date');
    el.textContent = formatLong(date);
  });

  // ARTIGOS (mesma data!)
  document.querySelectorAll('.article-date').forEach(el => {
    const date = el.getAttribute('datetime');
    el.textContent = formatShort(date);
  });

});