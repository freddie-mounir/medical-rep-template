(() => {
  const storageKey = "gocloud-medical-crm-brand-v1";
  // EDIT BRAND_CONFIG: set your default palette and asset paths here.
  // Add logo/icon files to assets/ before referencing them below.
  const BRAND_CONFIG = {
    theme: {
      navy: "#194C7D",
      blue: "#2879B8",
      red: "#D95160",
      cyan: "#35A8C5",
      green: "#3C9C63"
    },
    logos: {
      gocloud: "assets/gocloud-logo.jpe",
      egyptomedical: "assets/egyptomedical-logo.png"
    },
    icon: "assets/brand-icon.svg"
  };
  const defaults = JSON.parse(JSON.stringify(BRAND_CONFIG));
  const configSignature = JSON.stringify(defaults);
  const colorKeys = ["navy", "blue", "red", "cyan", "green"];
  const assetPath = /^assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:svg|png|jpe|jpe?g|webp)$/i;
  let current = structuredClone(defaults);
  let backdrop;
  let editor;
  let errorMessage;

  function validateSettings(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("The JSON must contain a settings object.");
    }
    if (!value.theme || typeof value.theme !== "object" || Array.isArray(value.theme)) {
      throw new Error('Add a "theme" object with navy, blue, red, cyan, and green colors.');
    }
    for (const key of colorKeys) {
      if (typeof value.theme[key] !== "string" || !/^#[\da-f]{6}$/i.test(value.theme[key])) {
        throw new Error(`theme.${key} must be a six-digit hex color, such as "#194C7D".`);
      }
    }
    if (!value.logos || typeof value.logos !== "object" || Array.isArray(value.logos)) {
      throw new Error('Add a "logos" object with gocloud and egyptomedical image paths.');
    }
    for (const key of ["gocloud", "egyptomedical"]) {
      if (typeof value.logos[key] !== "string" || !assetPath.test(value.logos[key])) {
        throw new Error(`logos.${key} must be an image path inside assets/, such as "assets/egyptomedical-logo.png".`);
      }
    }
    if (typeof value.icon !== "string" || !assetPath.test(value.icon)) {
      throw new Error('icon must be an image path inside assets/, such as "assets/brand-icon.svg".');
    }
    return {
      theme: Object.fromEntries(colorKeys.map(key => [key, value.theme[key].toUpperCase()])),
      logos: { gocloud: value.logos.gocloud, egyptomedical: value.logos.egyptomedical },
      icon: value.icon
    };
  }

  function applySettings(settings) {
    const root = document.documentElement;
    root.style.setProperty("--brand-navy", settings.theme.navy);
    root.style.setProperty("--brand-blue", settings.theme.blue);
    root.style.setProperty("--brand-red", settings.theme.red);
    root.style.setProperty("--brand-cyan", settings.theme.cyan);
    root.style.setProperty("--brand-green", settings.theme.green);
    document.querySelectorAll('[data-brand-logo="gocloud"]').forEach(image => {
      image.src = settings.logos.gocloud;
    });
    document.querySelectorAll('[data-brand-logo="egyptomedical"]').forEach(image => {
      image.src = settings.logos.egyptomedical;
    });
    const favicon = document.getElementById("brandFavicon");
    if (favicon) favicon.href = settings.icon;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = settings.theme.navy;
    document.querySelectorAll(".brand-settings-colors i").forEach((swatch, index) => {
      swatch.style.setProperty("--chip-color", settings.theme[colorKeys[index]]);
    });
    current = settings;
  }

  function setError(message) {
    errorMessage.textContent = message;
  }

  function openSettings() {
    editor.value = JSON.stringify(current, null, 2);
    setError("");
    backdrop.hidden = false;
    backdrop.querySelector(".brand-settings-close").focus();
  }

  function closeSettings() {
    backdrop.hidden = true;
  }

  function saveSettings(settings) {
    const serialized = JSON.stringify({ configSignature, settings });
    try {
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      throw new Error(`Could not save settings in this browser: ${error.message}`);
    }
    applySettings(settings);
  }

  function installSettingsDialog() {
    backdrop = document.createElement("div");
    backdrop.className = "brand-settings-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="brand-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="brandSettingsTitle">
        <div class="brand-settings-heading">
          <div><h2 id="brandSettingsTitle">Brand settings</h2><p>Set the shared CRM colors, company logos, and browser icon using JSON.</p></div>
          <button class="brand-settings-close" type="button" aria-label="Close brand settings">×</button>
        </div>
        <div class="brand-settings-colors" aria-label="Current brand palette">
          <span class="brand-color-chip"><span><i style="--chip-color:#194C7D"></i>Navy</span></span>
          <span class="brand-color-chip"><span><i style="--chip-color:#2879B8"></i>Blue</span></span>
          <span class="brand-color-chip"><span><i style="--chip-color:#D95160"></i>Red</span></span>
          <span class="brand-color-chip"><span><i style="--chip-color:#35A8C5"></i>Cyan</span></span>
          <span class="brand-color-chip"><span><i style="--chip-color:#3C9C63"></i>Green</span></span>
        </div>
        <label class="brand-settings-json-label" for="brandSettingsJson">Brand configuration JSON</label>
        <textarea class="brand-settings-json" id="brandSettingsJson" spellcheck="false" aria-describedby="brandSettingsHelp"></textarea>
        <p class="brand-settings-help" id="brandSettingsHelp">Put custom image files in <code>assets/</code> and reference them by relative path. Colors must be six-digit hex values. Company links remain GoCloud and EgyptoMedical.</p>
        <p class="brand-settings-error" role="alert" aria-live="polite"></p>
        <div class="brand-settings-actions">
          <button type="button" data-action="reset">Restore defaults</button>
          <button type="button" data-action="export">Download JSON</button>
          <button type="button" class="brand-settings-apply" data-action="apply">Apply settings</button>
        </div>
      </section>`;
    document.body.append(backdrop);
    editor = backdrop.querySelector("#brandSettingsJson");
    errorMessage = backdrop.querySelector(".brand-settings-error");

    backdrop.querySelector(".brand-settings-close").addEventListener("click", closeSettings);
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeSettings();
      const action = event.target.closest("button[data-action]")?.dataset.action;
      if (action === "apply" || action === "reset") {
        try {
          const value = action === "reset" ? defaults : JSON.parse(editor.value);
          const settings = validateSettings(value);
          saveSettings(settings);
          editor.value = JSON.stringify(settings, null, 2);
          setError("Settings applied and saved for both pages.");
        } catch (error) {
          setError(error.message);
        }
      } else if (action === "export") {
        try {
          const settings = validateSettings(JSON.parse(editor.value));
          const file = new Blob([`${JSON.stringify(settings, null, 2)}\n`], { type: "application/json" });
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = "gocloud-brand-settings.json";
          link.click();
          URL.revokeObjectURL(url);
          setError("Brand JSON downloaded.");
        } catch (error) {
          setError(error.message);
        }
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !backdrop.hidden) closeSettings();
    });
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-open-brand-settings]");
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openSettings();
  }, true);

  installSettingsDialog();
  try {
    const saved = localStorage.getItem(storageKey);
    const savedRecord = saved ? JSON.parse(saved) : null;
    const useSavedSettings = savedRecord?.configSignature === configSignature;
    if (saved && !useSavedSettings) localStorage.removeItem(storageKey);
    applySettings(useSavedSettings ? validateSettings(savedRecord.settings) : validateSettings(defaults));
  } catch (error) {
    console.error("Saved brand settings could not be applied.", error);
    applySettings(validateSettings(defaults));
  }

  window.BrandSettings = { open: openSettings };
})();
