/**
 * Lorius Scripts — catalog data layer.
 *
 * Single source of truth for the two catalogs, shared by the public pages
 * and the Admin Hub:
 *   - scripts   → data/scripts.json    (game scripts: copy + download)
 *   - executors → data/executors.json  (executors: download link only)
 *
 * How data is resolved (first match wins):
 *   1. Admin Hub edits saved in localStorage.
 *   2. The catalog's JSON file fetched from the server.
 *   3. The embedded defaults below (used when the site is opened via file://
 *      where fetch is blocked).
 *
 * To publish Admin Hub changes for every visitor, use "Export JSON" in the
 * Admin Hub and replace the matching file in data/ with the download.
 */
(function (global) {
  "use strict";

  const CATALOGS = {
    scripts: {
      storageKey: "lorius_scripts",
      url: "data/scripts.json",
      rootKey: "scripts",
      defaults: [
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
      ]
    },
    executors: {
      storageKey: "lorius_executors",
      url: "data/executors.json",
      rootKey: "executors",
      defaults: [
        {
          id: "example-executor",
          name: "Example Executor",
          logo: "assets/logos/example-executor.png",
          description:
            "This is a sample entry. Open the Admin Hub, switch to the Executors tab, and replace it with a real executor.",
          download: "https://example.com/download/example-executor"
        }
      ]
    }
  };

  function config(type) {
    const c = CATALOGS[type];
    if (!c) throw new Error("Unknown catalog: " + type);
    return c;
  }

  /** Display name of an item regardless of catalog ("game" or "name"). */
  function itemName(item) {
    return item.game || item.name || "";
  }

  function readLocal(type) {
    try {
      const raw = localStorage.getItem(config(type).storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function saveLocal(type, items) {
    localStorage.setItem(config(type).storageKey, JSON.stringify(items));
  }

  function clearLocal(type) {
    localStorage.removeItem(config(type).storageKey);
  }

  function hasLocalOverride(type) {
    return readLocal(type) !== null;
  }

  async function fetchRemote(type) {
    const c = config(type);
    const response = await fetch(c.url, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load " + c.url);
    const data = await response.json();
    if (!Array.isArray(data[c.rootKey])) throw new Error("Invalid " + c.url);
    return data[c.rootKey];
  }

  /**
   * Resolve a catalog: localStorage override first, then the JSON file,
   * then the embedded defaults.
   */
  async function loadCatalog(type) {
    const local = readLocal(type);
    if (local) return local;
    try {
      return await fetchRemote(type);
    } catch (err) {
      return config(type).defaults.slice();
    }
  }

  /** Serialize a list in the same shape as its data/*.json file. */
  function toJSON(type, items) {
    const c = config(type);
    const out = {};
    out[c.rootKey] = items;
    return JSON.stringify(out, null, 2);
  }

  function exportFileName(type) {
    return config(type).url.split("/").pop();
  }

  function findById(items, id) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function slugify(name) {
    return (
      String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "item"
    );
  }

  global.LoriusData = {
    CATALOGS: CATALOGS,
    itemName: itemName,
    loadCatalog: loadCatalog,
    saveLocal: saveLocal,
    clearLocal: clearLocal,
    hasLocalOverride: hasLocalOverride,
    toJSON: toJSON,
    exportFileName: exportFileName,
    findById: findById,
    slugify: slugify,

    // Back-compat helpers for the scripts catalog
    loadScripts: function () {
      return loadCatalog("scripts");
    }
  };
})(window);
