/**
 * Lorius Scripts — Admin Hub.
 *
 * A lightweight, client-side CMS for both catalogs (Scripts and Executors):
 *   - switch between catalogs with the tabs at the top
 *   - add, edit and delete items (including changing each item's logo URL)
 *   - changes save instantly to localStorage (visible in this browser only)
 *   - "Export JSON" downloads the current catalog in its data/*.json shape
 *     so it can be committed to publish changes for every visitor
 *   - "Import JSON" loads an existing catalog file into the editor
 *
 * Note: this hub has no authentication — it is a convenience editor for the
 * site owner. Anything saved here only affects the current browser until
 * the exported JSON is committed to the repository.
 */
(function () {
  "use strict";

  const form = document.getElementById("admin-form");
  const list = document.getElementById("admin-list");
  if (!form || !list) return;

  const formTitle = document.getElementById("admin-form-title");
  const listTitle = document.getElementById("admin-list-title");
  const cancelBtn = document.getElementById("admin-cancel");
  const exportBtn = document.getElementById("admin-export");
  const importInput = document.getElementById("admin-import");
  const resetBtn = document.getElementById("admin-reset");
  const statusNote = document.getElementById("admin-status");
  const tabButtons = document.querySelectorAll(".admin-tabs button[data-type]");

  const nameLabel = document.getElementById("label-name");
  const groupScript = document.getElementById("group-script");
  const groupDownload = document.getElementById("group-download");

  let type = "scripts";
  let items = [];
  let editingId = null;

  function isExecutors() {
    return type === "executors";
  }

  function label() {
    return isExecutors() ? "executor" : "script";
  }

  function setStatus(text) {
    if (statusNote) statusNote.textContent = text;
  }

  function persist() {
    LoriusData.saveLocal(type, items);
    setStatus(
      "Changes saved to this browser. Export JSON and replace data/" +
        LoriusData.exportFileName(type) +
        " to publish for everyone."
    );
  }

  function uniqueId(base) {
    let id = LoriusData.slugify(base);
    let suffix = 2;
    const existing = new Set(
      items.map(function (s) {
        return s.id;
      })
    );
    while (existing.has(id)) {
      id = LoriusData.slugify(base) + "-" + suffix++;
    }
    return id;
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = isExecutors() ? "Add New Executor" : "Add New Script";
    cancelBtn.style.display = "none";
  }

  function applyTypeToForm() {
    nameLabel.textContent = isExecutors() ? "Executor name" : "Game name";
    groupScript.style.display = isExecutors() ? "none" : "";
    groupDownload.style.display = isExecutors() ? "" : "none";
    form.elements.script.required = !isExecutors();
    form.elements.download.required = isExecutors();
    listTitle.textContent = isExecutors() ? "Current Executors" : "Current Scripts";
    exportBtn.textContent = "Export " + LoriusData.exportFileName(type);
  }

  function startEdit(item) {
    editingId = item.id;
    form.elements.name.value = LoriusData.itemName(item);
    form.elements.logo.value = item.logo || "";
    form.elements.description.value = item.description || "";
    if (isExecutors()) {
      form.elements.download.value = item.download || "";
    } else {
      form.elements.script.value = item.script || "";
    }
    formTitle.textContent = "Edit: " + LoriusData.itemName(item);
    cancelBtn.style.display = "inline-flex";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeItem(item) {
    if (!window.confirm('Delete "' + LoriusData.itemName(item) + '"?')) return;
    items = items.filter(function (s) {
      return s.id !== item.id;
    });
    if (editingId === item.id) resetForm();
    persist();
    renderList();
  }

  function renderList() {
    list.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("li");
      empty.textContent = "Nothing here yet. Add one with the form.";
      empty.style.color = "var(--text-muted)";
      empty.style.border = "none";
      list.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.className = "item-name";
      name.textContent = LoriusData.itemName(item);

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-secondary btn-small";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        startEdit(item);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-danger btn-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        removeItem(item);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      li.appendChild(name);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function loadType(newType) {
    type = newType;
    tabButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.type === type);
    });
    applyTypeToForm();
    resetForm();
    LoriusData.loadCatalog(type).then(function (loaded) {
      items = loaded;
      renderList();
      if (LoriusData.hasLocalOverride(type)) {
        setStatus(
          "You have unpublished local " +
            label() +
            " changes. Export JSON and replace data/" +
            LoriusData.exportFileName(type) +
            " to publish them."
        );
      } else {
        setStatus(
          "Editing the " +
            label() +
            "s catalog. Changes preview in this browser; use Export JSON to publish."
        );
      }
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      loadType(btn.dataset.type);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const logo = form.elements.logo.value.trim();
    const description = form.elements.description.value.trim();

    if (!name || !description) {
      setStatus("Name and description are required.");
      return;
    }

    const entry = { id: editingId || uniqueId(name), logo: logo, description: description };

    if (isExecutors()) {
      entry.name = name;
      entry.download = form.elements.download.value.trim();
      if (!entry.download) {
        setStatus("A download link is required for executors.");
        return;
      }
    } else {
      entry.game = name;
      entry.script = form.elements.script.value.trim();
      if (!entry.script) {
        setStatus("Script content is required.");
        return;
      }
    }

    if (editingId) {
      items = items.map(function (s) {
        return s.id === editingId ? entry : s;
      });
    } else {
      items.push(entry);
    }

    persist();
    renderList();
    resetForm();
  });

  cancelBtn.addEventListener("click", resetForm);

  exportBtn.addEventListener("click", function () {
    const blob = new Blob([LoriusData.toJSON(type, items)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = LoriusData.exportFileName(type);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(
      "Exported " +
        LoriusData.exportFileName(type) +
        " — replace data/" +
        LoriusData.exportFileName(type) +
        " in the repo to publish."
    );
  });

  importInput.addEventListener("change", function () {
    const file = importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        const rootKey = LoriusData.CATALOGS[type].rootKey;
        const imported = Array.isArray(data) ? data : data[rootKey];
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        items = imported;
        persist();
        renderList();
        resetForm();
        setStatus("Imported " + imported.length + " " + label() + "(s).");
      } catch (err) {
        setStatus("Import failed: the file is not a valid " + label() + "s JSON.");
      }
      importInput.value = "";
    };
    reader.readAsText(file);
  });

  resetBtn.addEventListener("click", function () {
    if (
      !window.confirm(
        "Discard local " + label() + " changes and reload the published catalog?"
      )
    ) {
      return;
    }
    LoriusData.clearLocal(type);
    resetForm();
    LoriusData.loadCatalog(type).then(function (loaded) {
      items = loaded;
      renderList();
      setStatus("Local changes discarded — showing the published catalog.");
    });
  });

  loadType("scripts");
})();
