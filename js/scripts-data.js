/**
 * Lorius Scripts — script data layer.
 *
 * Single source of truth for the script catalog, shared by the public
 * Scripts page and the Admin Hub.
 *
 * How data is resolved (first match wins):
 *   1. Admin Hub edits saved in localStorage (key: lorius_scripts).
 *   2. data/scripts.json fetched from the server.
 *   3. The embedded DEFAULT_SCRIPTS fallback below (used when the site is
 *      opened via file:// where fetch is blocked).
 *
 * To publish Admin Hub changes for every visitor, use "Export JSON" in the
 * Admin Hub and replace data/scripts.json with the downloaded file.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "lorius_scripts";
  const DATA_URL = "data/scripts.json";

  const DEFAULT_SCRIPTS = [
    {
      id: "blox-fruits-hub",
      game: "Blox Fruits",
      logo: "assets/logos/blox-fruits.png",
      description:
        "Auto-farm hub with quest helper, teleports and fruit finder. Updated for the latest version.",
      script:
        'loadstring(game:HttpGet("https://example.com/loriusscripts/blox-fruits.lua"))()'
    },
    {
      id: "pet-simulator-99",
      game: "Pet Simulator 99",
      logo: "assets/logos/pet-sim-99.png",
      description:
        "Auto-collect coins, auto-hatch eggs and inventory sorting in one lightweight script.",
      script:
        'loadstring(game:HttpGet("https://example.com/loriusscripts/pet-sim-99.lua"))()'
    },
    {
      id: "brookhaven-utils",
      game: "Brookhaven RP",
      logo: "assets/logos/brookhaven.png",
      description:
        "Utility pack: speed controls, teleport menu and fun cosmetic toggles for Brookhaven RP.",
      script:
        'loadstring(game:HttpGet("https://example.com/loriusscripts/brookhaven.lua"))()'
    }
  ];

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function saveLocal(scripts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  }

  function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasLocalOverride() {
    return readLocal() !== null;
  }

  async function fetchRemote() {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load " + DATA_URL);
    const data = await response.json();
    if (!Array.isArray(data.scripts)) throw new Error("Invalid scripts.json");
    return data.scripts;
  }

  /**
   * Resolve the current script list: localStorage override first,
   * then scripts.json, then the embedded defaults.
   */
  async function loadScripts() {
    const local = readLocal();
    if (local) return local;
    try {
      return await fetchRemote();
    } catch (err) {
      return DEFAULT_SCRIPTS.slice();
    }
  }

  /** Serialize the list in the same shape as data/scripts.json. */
  function toJSON(scripts) {
    return JSON.stringify({ scripts: scripts }, null, 2);
  }

  function slugify(name) {
    return String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "script";
  }

  global.LoriusData = {
    STORAGE_KEY: STORAGE_KEY,
    DATA_URL: DATA_URL,
    DEFAULT_SCRIPTS: DEFAULT_SCRIPTS,
    loadScripts: loadScripts,
    saveLocal: saveLocal,
    clearLocal: clearLocal,
    hasLocalOverride: hasLocalOverride,
    toJSON: toJSON,
    slugify: slugify
  };
})(window);
