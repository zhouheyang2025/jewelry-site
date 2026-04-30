document.documentElement.classList.add("js-enabled");

const hoverPreviewQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const mobilePreviewQuery = window.matchMedia("(max-width: 767px)");
const tabletPreviewQuery = window.matchMedia("(min-width: 768px) and (max-width: 1180px)");
const inlinePreviewQuery = window.matchMedia("(max-width: 1180px)");
const browsers = document.querySelectorAll("[data-index-browser]");
let lastInputWasPointer = false;

window.addEventListener("pointerdown", () => {
  lastInputWasPointer = true;
});

window.addEventListener("keydown", () => {
  lastInputWasPointer = false;
});

function bindIndexPreview(browser) {
  const rows = [...browser.querySelectorAll("[data-preview-key]")];
  const preview = browser.querySelector("[data-preview-stage]");

  if (!rows.length || !preview) {
    return;
  }

  const cards = [...preview.querySelectorAll("[data-preview-card]")];
  const previewRoot = preview.closest("[data-preview-mode]");
  const previewMode = previewRoot ? previewRoot.dataset.previewMode : undefined;
  const isClickMode = previewMode === "click";
  const isAdaptiveMode = previewMode === "adaptive";
  let activeKey = null;

  function usesHoverPreview() {
    return hoverPreviewQuery.matches && !inlinePreviewQuery.matches;
  }

  function usesTouchPreview() {
    // Touch/click preview is enabled on mobile and tablet.
    // Desktop keeps hover preview; tablet uses an inline preview below each row.
    return isClickMode || (isAdaptiveMode && inlinePreviewQuery.matches);
  }

  function removeInlinePreview() {
    browser.querySelectorAll(".mobile-row-preview").forEach((node) => node.remove());
  }

  function renderInlinePreview(row, card) {
    removeInlinePreview();

    if (!row || !card || !inlinePreviewQuery.matches) {
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
    slot.addEventListener("click", () => clearPreview());
    listItem.append(slot);
  }

  function activatePreview(key) {
    const activeCard = cards.find((card) => card.dataset.previewCard === key);
    const activeRow = rows.find((row) => row.dataset.previewKey === key);

    preview.classList.add("has-preview");
    preview.setAttribute("aria-hidden", "false");
    activeKey = key;

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
    activeKey = null;

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
    row.addEventListener("pointerenter", () => {
      if (isAdaptiveMode && usesHoverPreview()) {
        activatePreview(row.dataset.previewKey);
      }
    });

    row.addEventListener("pointerleave", () => {
      if (isAdaptiveMode && usesHoverPreview()) {
        clearPreview();
      }
    });

    if (isAdaptiveMode) {
      row.addEventListener("focus", () => {
        if (!lastInputWasPointer && usesHoverPreview()) {
          activatePreview(row.dataset.previewKey);
        }
      });
      row.addEventListener("blur", clearPreview);
      row.addEventListener("click", (event) => {
        if (row.matches("button")) {
          event.preventDefault();
        }

        if (usesHoverPreview()) {
          return;
        }

        if (!usesTouchPreview()) {
          clearPreview();
          return;
        }

        if (activeKey === row.dataset.previewKey) {
          clearPreview();
          return;
        }

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

  if (!isClickMode) {
    browser.addEventListener("pointerleave", () => {
      if (usesHoverPreview()) {
        clearPreview();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!usesTouchPreview() || !activeKey) {
      return;
    }

    const target = event.target instanceof Element ? event.target : event.target.parentElement;

    if (!target) {
      return;
    }

    const previewTrigger = target.closest("[data-preview-key]");

    if (
      (previewTrigger && browser.contains(previewTrigger)) ||
      preview.contains(target) ||
      target.closest(".mobile-row-preview")
    ) {
      return;
    }

    clearPreview();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeKey) {
      clearPreview();
    }
  });

  const handlePreviewModeChange = () => {
    if (isAdaptiveMode) {
      clearPreview();
    }
  };

  if (mobilePreviewQuery.addEventListener) {
    mobilePreviewQuery.addEventListener("change", handlePreviewModeChange);
    tabletPreviewQuery.addEventListener("change", handlePreviewModeChange);
    inlinePreviewQuery.addEventListener("change", handlePreviewModeChange);
  } else {
    mobilePreviewQuery.addListener(handlePreviewModeChange);
    tabletPreviewQuery.addListener(handlePreviewModeChange);
    inlinePreviewQuery.addListener(handlePreviewModeChange);
  }
}

browsers.forEach(bindIndexPreview);
