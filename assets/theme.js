(function () {
  var storageKey = "antonio-acuaviva-theme";
  var button = document.querySelector("[data-theme-toggle]");
  var root = document.documentElement;
  var preferenceQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  if (!button || !root) {
    return;
  }

  function getStoredTheme() {
    var storedTheme = "";

    try {
      storedTheme = window.localStorage.getItem(storageKey) || "";
    } catch (error) {
      storedTheme = "";
    }

    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "";
  }

  function getCurrentTheme() {
    var currentTheme = root.getAttribute("data-theme");

    if (currentTheme === "light" || currentTheme === "dark") {
      return currentTheme;
    }

    return preferenceQuery && preferenceQuery.matches ? "dark" : "light";
  }

  function updateButton() {
    var nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    var label = "Switch to " + nextTheme + " theme";

    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  button.addEventListener("click", function () {
    var nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", nextTheme);

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch (error) {
      // The selected theme still applies for this page view when storage is unavailable.
    }

    updateButton();
  });

  if (preferenceQuery) {
    var handlePreferenceChange = function (event) {
      if (!getStoredTheme()) {
        root.setAttribute("data-theme", event.matches ? "dark" : "light");
        updateButton();
      }
    };

    if (typeof preferenceQuery.addEventListener === "function") {
      preferenceQuery.addEventListener("change", handlePreferenceChange);
    } else if (typeof preferenceQuery.addListener === "function") {
      preferenceQuery.addListener(handlePreferenceChange);
    }
  }

  updateButton();
  button.setAttribute("data-theme-ready", "");
})();
