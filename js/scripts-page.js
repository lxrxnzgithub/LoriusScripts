/**
 * Lorius Scripts — public Scripts page.
 * Renders the script catalog as cards with copy and download actions.
 */
(function () {
  "use strict";

  const grid = document.getElementById("scripts-grid");
  if (!grid) return;

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
    const fallback = document.createElement("div");
    fallback.className = "game-logo-fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = initials(item.game);

    if (!item.logo) return fallback;

    const img = document.createElement("img");
    img.className = "game-logo";
    img.src = item.logo;
    img.alt = item.game + " logo";
    img.loading = "lazy";
    img.addEventListener("error", function () {
      img.replaceWith(fallback);
    });
    return img;
  }

  function copyScript(item, button) {
    const original = button.textContent;
    navigator.clipboard
      .writeText(item.script)
      .then(function () {
        button.textContent = "Copied!";
        button.classList.add("copy-feedback");
        setTimeout(function () {
          button.textContent = original;
          button.classList.remove("copy-feedback");
        }, 1600);
      })
      .catch(function () {
        // Clipboard API can be unavailable on http/file — offer a prompt instead
        window.prompt("Copy the script below:", item.script);
      });
  }

  function downloadScript(item) {
    const blob = new Blob([item.script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (item.id || LoriusData.slugify(item.game)) + ".lua";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function buildCard(item, index) {
    const card = document.createElement("article");
    card.className = "script-card";
    card.style.animationDelay = Math.min(index * 0.08, 0.5) + "s";

    const header = document.createElement("div");
    header.className = "card-header";
    header.appendChild(buildLogo(item));

    const title = document.createElement("h3");
    title.textContent = item.game;
    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "card-body";

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = item.description;
    body.appendChild(description);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn btn-primary btn-small";
    copyBtn.textContent = "Copy Script";
    copyBtn.addEventListener("click", function () {
      copyScript(item, copyBtn);
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.className = "btn btn-secondary btn-small";
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", function () {
      downloadScript(item);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    body.appendChild(actions);

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function render(scripts) {
    grid.innerHTML = "";
    if (!scripts.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No scripts published yet — check back soon!";
      grid.appendChild(empty);
      return;
    }
    scripts.forEach(function (item, index) {
      grid.appendChild(buildCard(item, index));
    });
  }

  LoriusData.loadScripts().then(render);
})();
