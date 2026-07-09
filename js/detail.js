/**
 * Lorius Scripts — detail pages.
 * Renders a single script (copy + download) or executor (download only),
 * selected by the ?id= query parameter. The container declares its catalog
 * via data-catalog.
 */
(function () {
  "use strict";

  const container = document.querySelector("[data-catalog][data-detail-view]");
  if (!container) return;

  const type = container.dataset.catalog;
  const listPage = container.dataset.list;
  const id = new URLSearchParams(window.location.search).get("id");

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (word) {
        return word[0].toUpperCase();
      })
      .join("");
  }

  function buildLogo(item) {
    const name = LoriusData.itemName(item);
    const fallback = document.createElement("div");
    fallback.className = "game-logo-fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = initials(name);

    if (!item.logo) return fallback;

    const img = document.createElement("img");
    img.className = "game-logo";
    img.src = item.logo;
    img.alt = name + " logo";
    img.addEventListener("error", function () {
      img.replaceWith(fallback);
    });
    return img;
  }

  function notFound() {
    container.innerHTML = "";
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Sorry, we couldn't find that one.";
    const back = document.createElement("p");
    back.style.textAlign = "center";
    const link = document.createElement("a");
    link.className = "btn btn-secondary";
    link.href = listPage;
    link.textContent = "Back to the list";
    back.appendChild(link);
    container.appendChild(message);
    container.appendChild(back);
  }

  function renderScript(item) {
    const name = LoriusData.itemName(item);

    const box = document.createElement("pre");
    box.className = "script-box";
    box.textContent = item.script;

    const actions = document.createElement("div");
    actions.className = "detail-actions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn btn-primary";
    copyBtn.textContent = "Copy Script";
    copyBtn.addEventListener("click", function () {
      navigator.clipboard
        .writeText(item.script)
        .then(function () {
          copyBtn.textContent = "Copied!";
          copyBtn.classList.add("copy-feedback");
          setTimeout(function () {
            copyBtn.textContent = "Copy Script";
            copyBtn.classList.remove("copy-feedback");
          }, 1600);
        })
        .catch(function () {
          window.prompt("Copy the script below:", item.script);
        });
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.className = "btn btn-secondary";
    downloadBtn.textContent = "Download .lua";
    downloadBtn.addEventListener("click", function () {
      const blob = new Blob([item.script], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (item.id || LoriusData.slugify(name)) + ".lua";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    container.appendChild(box);
    container.appendChild(actions);
  }

  function renderExecutor(item) {
    const actions = document.createElement("div");
    actions.className = "detail-actions";

    const download = document.createElement("a");
    download.className = "btn btn-primary";
    download.href = item.download || "#";
    download.target = "_blank";
    download.rel = "noopener noreferrer";
    download.textContent = "Download";
    actions.appendChild(download);

    container.appendChild(actions);
  }

  function render(item) {
    const name = LoriusData.itemName(item);
    document.title = name + " — Lorius Scripts";

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "detail-header";
    header.appendChild(buildLogo(item));
    const title = document.createElement("h1");
    title.textContent = name;
    header.appendChild(title);
    container.appendChild(header);

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = item.description;
    container.appendChild(description);

    if (type === "executors") {
      renderExecutor(item);
    } else {
      renderScript(item);
    }
  }

  if (!id) {
    notFound();
    return;
  }

  LoriusData.loadCatalog(type).then(function (items) {
    const item = LoriusData.findById(items, id);
    if (!item) {
      notFound();
      return;
    }
    render(item);
  });
})();
