// theme.js - Paper (light) / Ink (dark) color mode control.
//
// The pre-paint script in head.html already applied the resolved mode before
// the page painted. This file only handles interaction afterwards: recording an
// explicit choice and updating the buttons. With no stored choice the site
// follows the operating system, and keeps following it when that changes.

(function () {
  var KEY = "r15-papercss-hugo-theme:color-mode";
  var root = document.documentElement;
  var buttons = document.querySelectorAll(".theme-mode-switch button");

  function readPreference() {
    try {
      var stored = window.localStorage.getItem(KEY);
      if (stored === "light" || stored === "dark" || stored === "auto") {
        return stored;
      }
    } catch (e) { /* storage unavailable: treat as auto */ }
    return "auto";
  }

  function systemPrefersDark() {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return false;
    }
  }

  function resolve(mode) {
    return mode === "auto" ? (systemPrefersDark() ? "dark" : "light") : mode;
  }

  function apply(mode) {
    var resolved = resolve(mode);
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", resolved === "dark" ? "#41403e" : "#ffffff");
    }
    // There is no "auto" button, so the pressed state reflects the mode that
    // is actually showing, which may come from the system preference.
    buttons.forEach(function (button) {
      var active = button.getAttribute("data-mode") === resolved;
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function store(mode) {
    try {
      window.localStorage.setItem(KEY, mode);
    } catch (e) { /* storage unavailable: the choice just will not persist */ }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var mode = button.getAttribute("data-mode") || "light";
      store(mode);
      apply(mode);
    });
  });

  // Sync the pressed state (and theme-color) with the mode already applied.
  apply(readPreference());

  // While in auto mode, follow the system preference when it changes.
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (readPreference() === "auto") {
        apply("auto");
      }
    });
  } catch (e) { /* older browsers: no live system tracking */ }

  // Follow a change made in another tab.
  window.addEventListener("storage", function (event) {
    if (event.key === KEY) {
      apply(readPreference());
    }
  });
})();
