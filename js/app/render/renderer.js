export function createRenderer(rootElement) {
  return {
    status: 'placeholder ready',
    renderPlaceholder(payload) {
      if (!rootElement) {
        return;
      }

      const lines = (payload.lines || [])
        .map((line) => `<div>${escapeHtml(line)}</div>`)
        .join('');

      rootElement.innerHTML = `
        <div>
          <strong>${escapeHtml(payload.title || 'Renderer placeholder')}</strong>
          <div style="margin-top: 12px; display: grid; gap: 8px;">${lines}</div>
        </div>
      `;
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
