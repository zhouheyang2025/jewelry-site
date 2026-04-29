document.documentElement.classList.add("js-enabled");

const hoverPreviewQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const mobilePreviewQuery = window.matchMedia("(max-width: 767px)");
const browsers = document.querySelectorAll("[data-index-browser]");
let lastInputWasPointer = false;

window.addEventListener("pointerdown", () => {
  lastInputWasPointer = true;
});

window.addEventListener("keydown", () => {
  lastInputWasPointer = false;
});

function bindIndexPreview(browser) {
  const rows = browser.querySelectorAll("[data-preview-key]");
  const preview = browser.querySelector("[data-preview-stage]");

  if (!rows.length || !preview) {
    return;
  }

  const cards = preview.querySelectorAll("[data-preview-card]");
  const previewRoot = preview.closest("[data-preview-mode]");
  const previewMode = previewRoot ? previewRoot.dataset.previewMode : undefined;
  const isClickMode = previewMode === "click";
  const isAdaptiveMode = previewMode === "adaptive";

  function removeInlinePreview() {
    browser.querySelectorAll(".mobile-row-preview").forEach((node) => node.remove());
  }

  function renderInlinePreview(row, card) {
    removeInlinePreview();

    if (!row || !card || !mobilePreviewQuery.matches) {
      return;
    }

    const listItem = row.closest("li");

    if (!listItem) {
      return;
    }

    const slot = document.createElement("div");
    const clone = card.cloneNode(true);

    slot.className = "mobile-row-preview";
    clone.classList.add("is-active");
    slot.append(clone);
    listItem.append(slot);
  }

  function activatePreview(key) {
    const activeCard = [...cards].find((card) => card.dataset.previewCard === key);
    const activeRow = [...rows].find((row) => row.dataset.previewKey === key);

    preview.classList.add("has-preview");
    preview.setAttribute("aria-hidden", "false");

    rows.forEach((row) => {
      const isActive = row.dataset.previewKey === key;
      row.classList.toggle("is-active", isActive);

      if (row.matches("button")) {
        row.setAttribute("aria-pressed", isActive ? "true" : "false");
      }
    });

    cards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.previewCard === key);
    });

    if (isAdaptiveMode) {
      renderInlinePreview(activeRow, activeCard);
    }
  }

  function clearPreview() {
    preview.classList.remove("has-preview");
    preview.setAttribute("aria-hidden", "true");

    rows.forEach((row) => {
      row.classList.remove("is-active");

      if (row.matches("button")) {
        row.setAttribute("aria-pressed", "false");
      }
    });

    cards.forEach((card) => card.classList.remove("is-active"));
    removeInlinePreview();
  }

  rows.forEach((row) => {
    if (isAdaptiveMode && hoverPreviewQuery.matches) {
      row.addEventListener("pointerenter", () => activatePreview(row.dataset.previewKey));
      row.addEventListener("pointerleave", clearPreview);
      row.addEventListener("focus", () => {
        if (!lastInputWasPointer) {
          activatePreview(row.dataset.previewKey);
        }
      });
      row.addEventListener("blur", clearPreview);
      row.addEventListener("click", (event) => event.preventDefault());

      return;
    }

    if (isAdaptiveMode) {
      row.addEventListener("click", (event) => {
        event.preventDefault();
        activatePreview(row.dataset.previewKey);
      });

      return;
    }

    if (isClickMode) {
      row.addEventListener("click", (event) => {
        event.preventDefault();
        activatePreview(row.dataset.previewKey);
      });

      return;
    }

    if (hoverPreviewQuery.matches) {
      row.addEventListener("pointerenter", () => activatePreview(row.dataset.previewKey));
      row.addEventListener("focus", () => activatePreview(row.dataset.previewKey));
      row.addEventListener("blur", clearPreview);
    }
  });

  if (!isClickMode && hoverPreviewQuery.matches) {
    browser.addEventListener("pointerleave", clearPreview);
  }

  const handlePreviewModeChange = () => {
    if (isAdaptiveMode) {
      clearPreview();
    }
  };

  if (mobilePreviewQuery.addEventListener) {
    mobilePreviewQuery.addEventListener("change", handlePreviewModeChange);
  } else {
    mobilePreviewQuery.addListener(handlePreviewModeChange);
  }
}

browsers.forEach(bindIndexPreview);
