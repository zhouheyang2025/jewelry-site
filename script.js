document.documentElement.classList.add("js-enabled");

const hoverPreviewQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const mobilePreviewQuery = window.matchMedia("(max-width: 767px)");
const tabletPreviewQuery = window.matchMedia("(min-width: 768px) and (max-width: 1180px)");
const inlinePreviewQuery = window.matchMedia("(max-width: 767px), ((min-width: 768px) and (max-width: 1180px) and (orientation: portrait))");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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
    // Touch/click preview is enabled when hover is unavailable.
    // Mobile and portrait tablet render inline; landscape tablet uses the side preview.
    return isClickMode || (isAdaptiveMode && !usesHoverPreview());
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

function bindMeasurementGridRipples() {
  if (!document.body.matches(".home-page, .info-page")) {
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    return;
  }

  canvas.className = "grid-ripple-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let ripples = [];
  let frameRequest = 0;
  const waveFrames = [
    { at: 0, x: -10, y: 6, tx: -9, ty: 4, scale: 1.024, rotate: -0.12, skewX: 0.42, skewY: 0, originX: 0.24, originY: 0.76 },
    { at: 0.24, x: 14, y: -11, tx: 8, ty: -8, scale: 1.038, rotate: 0.16, skewX: 0, skewY: -0.62, originX: 0.82, originY: 0.18 },
    { at: 0.56, x: -8, y: 17, tx: -7, ty: 9, scale: 1.03, rotate: -0.18, skewX: -0.58, skewY: 0, originX: 0.16, originY: 0.42 },
    { at: 0.78, x: 5, y: 14, tx: 2, ty: 7, scale: 1.034, rotate: 0.08, skewX: 0, skewY: 0.5, originX: 0.58, originY: 0.92 },
    { at: 1, x: 16, y: 5, tx: 9, ty: 2, scale: 1.032, rotate: 0.14, skewX: 0, skewY: 0.46, originX: 0.92, originY: 0.62 }
  ];

  function readNumber(value, fallback) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function readGridSettings() {
    const style = window.getComputedStyle(document.body);

    return {
      majorSize: readNumber(style.getPropertyValue("--home-grid-size"), 64),
      minorSize: readNumber(style.getPropertyValue("--home-grid-subsize"), 16),
      majorLine: style.getPropertyValue("--home-grid-line").trim() || "rgba(16, 16, 16, 0.68)",
      minorLine: style.getPropertyValue("--home-grid-subline").trim() || "rgba(16, 16, 16, 0.26)",
      baseOpacity: readNumber(style.getPropertyValue("--home-grid-opacity"), 0.068)
    };
  }

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function rippleProgress(ripple, now) {
    return Math.min((now - ripple.startedAt) / ripple.duration, 1);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeOutSoft(value) {
    return 1 - Math.pow(1 - value, 1.15);
  }

  function easeInOut(value) {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function readWaveFrame(now) {
    if (reducedMotionQuery.matches) {
      return waveFrames[0];
    }

    const cycle = 22000;
    const rawProgress = (now % (cycle * 2)) / cycle;
    const progress = rawProgress > 1 ? 2 - rawProgress : rawProgress;
    const upperIndex = waveFrames.findIndex((frame) => frame.at >= progress);
    const end = waveFrames[Math.max(upperIndex, 1)];
    const start = waveFrames[Math.max(upperIndex - 1, 0)];
    const span = end.at - start.at || 1;
    const amount = easeInOut((progress - start.at) / span);

    return {
      x: mix(start.x, end.x, amount),
      y: mix(start.y, end.y, amount),
      tx: mix(start.tx, end.tx, amount),
      ty: mix(start.ty, end.ty, amount),
      scale: mix(start.scale, end.scale, amount),
      rotate: mix(start.rotate, end.rotate, amount),
      skewX: mix(start.skewX, end.skewX, amount),
      skewY: mix(start.skewY, end.skewY, amount),
      originX: mix(start.originX, end.originX, amount),
      originY: mix(start.originY, end.originY, amount)
    };
  }

  function transformPoint(x, y, wave) {
    const originX = width * wave.originX;
    const originY = height * wave.originY;
    const localX = x - originX;
    const localY = y - originY;
    const skewedX = localX + Math.tan((wave.skewX * Math.PI) / 180) * localY;
    const skewedY = localY + Math.tan((wave.skewY * Math.PI) / 180) * localX;
    const scaledX = skewedX * wave.scale;
    const scaledY = skewedY * wave.scale;
    const rotation = (wave.rotate * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return {
      x: originX + scaledX * cos - scaledY * sin + wave.tx,
      y: originY + scaledX * sin + scaledY * cos + wave.ty
    };
  }

  function displacePoint(point, now) {
    let x = point.x;
    let y = point.y;

    ripples.forEach((ripple) => {
      const progress = rippleProgress(ripple, now);

      if (progress >= 1) {
        return;
      }

      const dx = x - ripple.x;
      const dy = y - ripple.y;
      const distance = Math.hypot(dx, dy) || 1;
      const radius = ripple.maxRadius * easeOutSoft(progress);
      const edgeDistance = distance - radius;
      const envelope = Math.exp(-(edgeDistance * edgeDistance) / (ripple.band * ripple.band));

      if (envelope < 0.004) {
        return;
      }

      const phase = (edgeDistance / ripple.wavelength) * Math.PI * 2;
      const fade = Math.pow(1 - progress, 1.55);
      const offset = Math.sin(phase) * ripple.amplitude * envelope * fade;

      x += (dx / distance) * offset;
      y += (dy / distance) * offset;
    });

    return { x, y };
  }

  function traceLine(startX, startY, endX, endY, sampleStep, wave, now) {
    context.beginPath();

    for (let distance = 0; distance <= 1; distance += sampleStep) {
      const source = transformPoint(mix(startX, endX, distance), mix(startY, endY, distance), wave);
      const point = displacePoint(source, now);

      if (distance === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }

    const source = transformPoint(endX, endY, wave);
    const point = displacePoint(source, now);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function strokeGridSet(settings, wave, now, size, strokeStyle, lineWidth, opacityScale) {
    const margin = Math.max(width, height) * 0.22;
    const minX = -margin;
    const maxX = width + margin;
    const minY = -margin;
    const maxY = height + margin;
    const sampleStep = 1 / Math.ceil(Math.hypot(width, height) / Math.max(12, size * 0.32));

    context.globalAlpha = settings.baseOpacity * opacityScale;
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let x = Math.floor((minX - wave.x) / size) * size + wave.x; x <= maxX; x += size) {
      traceLine(x, minY, x, maxY, sampleStep, wave, now);
    }

    for (let y = Math.floor((minY - wave.y) / size) * size + wave.y; y <= maxY; y += size) {
      traceLine(minX, y, maxX, y, sampleStep, wave, now);
    }
  }

  function render(now) {
    context.clearRect(0, 0, width, height);
    const settings = readGridSettings();
    const wave = readWaveFrame(now);

    ripples = ripples.filter((ripple) => rippleProgress(ripple, now) < 1);

    strokeGridSet(settings, wave, now, settings.minorSize, settings.minorLine, 1, 1);
    strokeGridSet(settings, wave, now, settings.majorSize, settings.majorLine, 1, 1);
    context.globalAlpha = 1;

    if (!reducedMotionQuery.matches || ripples.length) {
      frameRequest = window.requestAnimationFrame(render);
    } else {
      frameRequest = 0;
    }
  }

  function addRipple(x, y) {
    if (reducedMotionQuery.matches) {
      return;
    }

    const farthestX = Math.max(x, width - x);
    const farthestY = Math.max(y, height - y);
    const travel = Math.hypot(farthestX, farthestY);

    ripples.push({
      x,
      y,
      startedAt: performance.now(),
      duration: 4600,
      maxRadius: Math.max(280, travel * 0.84),
      wavelength: 74,
      band: 96,
      amplitude: Math.min(4.4, Math.max(2.4, Math.min(width, height) * 0.0052))
    });

    if (ripples.length > 5) {
      ripples = ripples.slice(-5);
    }

    if (!frameRequest) {
      frameRequest = window.requestAnimationFrame(render);
    }
  }

  function handlePointerDown(event) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    addRipple(event.clientX, event.clientY);
  }

  function handleResize() {
    resizeCanvas();

    if (!frameRequest) {
      frameRequest = window.requestAnimationFrame(render);
    }
  }

  resizeCanvas();
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  frameRequest = window.requestAnimationFrame(render);
}

bindMeasurementGridRipples();
