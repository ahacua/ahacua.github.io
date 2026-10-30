(function () {
  var storageKey = "antonio-acuaviva-theme";
  var button = document.querySelector("[data-theme-toggle]");
  var root = document.documentElement;

  if (!button || !root) {
    return;
  }

  function getCurrentTheme() {
    var currentTheme = root.getAttribute("data-theme");

    if (currentTheme === "light" || currentTheme === "dark") {
      return currentTheme;
    }

    return "light";
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

  updateButton();
  button.setAttribute("data-theme-ready", "");
})();
