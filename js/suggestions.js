/**
 * Lorius Scripts — Suggestions page.
 *
 * Backend-ready: suggestions are collected into a JSON payload shaped for a
 * POST endpoint. Until a backend exists they are stored in localStorage
 * (key: lorius_suggestions) so nothing is lost. To wire up a real backend,
 * set SUGGESTIONS_ENDPOINT to your API URL (e.g. a Formspree form,
 * a Cloudflare Worker, or your own server).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "lorius_suggestions";
  const SUGGESTIONS_ENDPOINT = ""; // e.g. "https://formspree.io/f/your-id"

  const form = document.getElementById("suggestion-form");
  if (!form) return;

  const message = document.getElementById("form-message");

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "form-message " + type;
  }

  function storeLocally(payload) {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (err) {
      stored = [];
    }
    stored.push(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const suggestion = form.elements.suggestion.value.trim();

    if (!name || !suggestion) {
      showMessage("Please fill in your name and suggestion.", "error");
      return;
    }

    const payload = {
      name: name,
      email: email || null,
      suggestion: suggestion,
      submittedAt: new Date().toISOString()
    };

    if (SUGGESTIONS_ENDPOINT) {
      try {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Request failed");
      } catch (err) {
        storeLocally(payload);
      }
    } else {
      storeLocally(payload);
    }

    form.reset();
    showMessage(
      "Thanks, " + name + "! Your suggestion has been received.",
      "success"
    );
  });
})();
