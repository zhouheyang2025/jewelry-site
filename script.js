document.documentElement.classList.add("js-enabled");

const hoverPreviewQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const browsers = document.querySelectorAll("[data-index-browser]");

function bindIndexPreview(browser) {
  const rows = browser.querySelectorAll("[data-preview-key]");
  const preview = browser.querySelector("[data-preview-stage]");

  if (!rows.length || !preview) {
    return;
  }

  const cards = preview.querySelectorAll("[data-preview-card]");

  function activatePreview(key) {
    preview.classList.add("has-preview");

    rows.forEach((row) => {
      row.classList.toggle("is-active", row.dataset.previewKey === key);
    });

    cards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.previewCard === key);
    });
  }

  function clearPreview() {
    preview.classList.remove("has-preview");
    rows.forEach((row) => row.classList.remove("is-active"));
    cards.forEach((card) => card.classList.remove("is-active"));
  }

  rows.forEach((row) => {
    row.addEventListener("pointerenter", () => activatePreview(row.dataset.previewKey));
    row.addEventListener("focus", () => activatePreview(row.dataset.previewKey));
    row.addEventListener("blur", clearPreview);
  });

  browser.addEventListener("pointerleave", clearPreview);
}

if (hoverPreviewQuery.matches) {
  browsers.forEach(bindIndexPreview);
}
