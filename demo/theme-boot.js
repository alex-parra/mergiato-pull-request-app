// Runs before the first paint, so the page opens in the saved theme instead of the default one.
// Mirrors startTheme in src/lib/theme.ts (same keys and defaults); that code takes over after load.
(function () {
  function saved(key, fallback, allowed) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return allowed.indexOf(value) === -1 ? fallback : value;
    } catch {
      return fallback;
    }
  }
  var mode = saved("mergiato:theme-mode", "dark", ["dark", "light", "system"]);
  var dark = saved("mergiato:dark-theme", "graphite", ["graphite", "midnight", "dim"]);
  var light = saved("mergiato:light-theme", "paper", ["paper", "mist", "sand"]);
  var scheme =
    mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
  var root = document.documentElement;
  root.dataset.theme = scheme === "dark" ? dark : light;
  root.classList.toggle("dark", scheme === "dark");
})();
