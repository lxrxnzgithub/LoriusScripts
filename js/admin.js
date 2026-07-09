/**
 * Lorius Scripts — Admin Hub.
 *
 * A lightweight, client-side CMS for the script catalog:
 *   - add, edit and delete scripts through a form
 *   - changes save instantly to localStorage (visible on this browser)
 *   - "Export JSON" downloads the catalog in the data/scripts.json shape
 *     so it can be committed to publish changes for every visitor
 *   - "Import JSON" loads an existing scripts.json into the editor
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
  const cancelBtn = document.getElementById("admin-cancel");
  const exportBtn = document.getElementById("admin-export");
  const importInput = document.getElementById("admin-import");
  const resetBtn = document.getElementById("admin-reset");
  const statusNote = document.getElementById("admin-status");

  let scripts = [];
  let editingId = null;

  function setStatus(text) {
    if (statusNote) statusNote.textContent = text;
  }

  function persist() {
    LoriusData.saveLocal(scripts);
    setStatus(
      "Changes saved to this browser. Export JSON and replace data/scripts.json to publish for everyone."
    );
  }

  function uniqueId(base) {
    let id = LoriusData.slugify(base);
    let suffix = 2;
    const existing = new Set(scripts.map(function (s) { return s.id; }));
    while (existing.has(id)) {
      id = LoriusData.slugify(base) + "-" + suffix++;
    }
    return id;
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Add New Script";
    cancelBtn.style.display = "none";
  }

  function startEdit(item) {
    editingId = item.id;
    form.elements.game.value = item.game;
    form.elements.logo.value = item.logo || "";
    form.elements.description.value = item.description;
    form.elements.script.value = item.script;
    formTitle.textContent = "Edit: " + item.game;
    cancelBtn.style.display = "inline-flex";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeScript(item) {
    if (!window.confirm('Delete "' + item.game + '"?')) return;
    scripts = scripts.filter(function (s) { return s.id !== item.id; });
    if (editingId === item.id) resetForm();
    persist();
    renderList();
  }

  function renderList() {
    list.innerHTML = "";
    if (!scripts.length) {
      const empty = document.createElement("li");
      empty.textContent = "No scripts yet. Add one with the form.";
      empty.style.color = "var(--text-muted)";
      empty.style.border = "none";
      list.appendChild(empty);
      return;
    }
    scripts.forEach(function (item) {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.className = "item-name";
      name.textContent = item.game;

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-secondary btn-small";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () { startEdit(item); });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-danger btn-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () { removeScript(item); });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      li.appendChild(name);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const entry = {
      id: editingId || uniqueId(form.elements.game.value),
      game: form.elements.game.value.trim(),
      logo: form.elements.logo.value.trim(),
      description: form.elements.description.value.trim(),
      script: form.elements.script.value.trim()
    };

    if (!entry.game || !entry.description || !entry.script) {
      setStatus("Game name, description and script content are required.");
      return;
    }

    if (editingId) {
      scripts = scripts.map(function (s) {
        return s.id === editingId ? entry : s;
      });
    } else {
      scripts.push(entry);
    }

    persist();
    renderList();
    resetForm();
  });

  cancelBtn.addEventListener("click", resetForm);

  exportBtn.addEventListener("click", function () {
    const blob = new Blob([LoriusData.toJSON(scripts)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scripts.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Exported scripts.json — replace data/scripts.json in the repo to publish.");
  });

  importInput.addEventListener("change", function () {
    const file = importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        const imported = Array.isArray(data) ? data : data.scripts;
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        scripts = imported;
        persist();
        renderList();
        resetForm();
        setStatus("Imported " + imported.length + " script(s).");
      } catch (err) {
        setStatus("Import failed: the file is not a valid scripts JSON.");
      }
      importInput.value = "";
    };
    reader.readAsText(file);
  });

  resetBtn.addEventListener("click", function () {
    if (!window.confirm("Discard local changes and reload the published catalog?")) {
      return;
    }
    LoriusData.clearLocal();
    resetForm();
    LoriusData.loadScripts().then(function (loaded) {
      scripts = loaded;
      renderList();
      setStatus("Local changes discarded — showing the published catalog.");
    });
  });

  LoriusData.loadScripts().then(function (loaded) {
    scripts = loaded;
    renderList();
    if (LoriusData.hasLocalOverride()) {
      setStatus(
        "You have unpublished local changes. Export JSON and replace data/scripts.json to publish them."
      );
    }
  });
})();
