/**
 * Lorius Scripts — catalog list pages (Scripts and Executors).
 * Renders item cards that link through to the matching detail page.
 * The grid element declares which catalog it shows via data-catalog,
 * and which detail page to link to via data-detail.
 */
(function () {
  "use strict";

  const grid = document.querySelector("[data-catalog]");
  if (!grid) return;

  const type = grid.dataset.catalog;
  const detailPage = grid.dataset.detail;

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
    img.loading = "lazy";
    img.addEventListener("error", function () {
      img.replaceWith(fallback);
    });
    return img;
  }

  function buildCard(item, index) {
    const card = document.createElement("article");
    card.className = "script-card";
    card.style.animationDelay = Math.min(index * 0.08, 0.5) + "s";

    const header = document.createElement("div");
    header.className = "card-header";
    header.appendChild(buildLogo(item));

    const title = document.createElement("h3");
    title.textContent = LoriusData.itemName(item);
    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "card-body";

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = item.description;
    body.appendChild(description);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const view = document.createElement("a");
    view.className = "btn btn-primary btn-small";
    view.href = detailPage + "?id=" + encodeURIComponent(item.id);
    view.textContent = type === "executors" ? "View Executor" : "View Script";
    actions.appendChild(view);

    body.appendChild(actions);
    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function render(items) {
    grid.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent =
        type === "executors"
          ? "No executors published yet — check back soon!"
          : "No scripts published yet — check back soon!";
      grid.appendChild(empty);
      return;
    }
    items.forEach(function (item, index) {
      grid.appendChild(buildCard(item, index));
    });
  }

  LoriusData.loadCatalog(type).then(render);
})();
