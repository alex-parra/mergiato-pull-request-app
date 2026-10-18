// Shared by every page: download buttons (latest .dmg, the first-open guide, Rybbit events), the theme
// switch, copy buttons and toasts. Each page's own script (the demo on the home page) runs after it.
const isMac = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints < 2;

// Downloads: on a Mac the .dmg starts and a short guide opens; elsewhere the button sends the link on.
function wireDownloads() {
  const dialog = document.querySelector("[data-after-download]");
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => event.target === dialog && dialog.close());
  if (!isMac) {
    for (const label of document.querySelectorAll("[data-download-label]")) label.textContent = "Send to my Mac";
    for (const note of document.querySelectorAll("[data-mac-only]")) note.hidden = true;
    // Windows and Linux visitors get a way to hear when it's theirs, and we learn how many there are.
    for (const line of document.querySelectorAll("[data-version]")) {
      const watch = document.createElement("a");
      watch.href = "https://github.com/alex-parra/mergiato-pull-request-app";
      watch.className = "underline";
      watch.textContent = "watch releases on GitHub";
      watch.addEventListener("click", () => window.rybbit?.event("Watch releases"));
      line.replaceChildren(
        "Mergiato runs on Macs today. Send yourself the link, or ",
        watch,
        " to hear about Windows and Linux.",
      );
    }
  }
  for (const link of document.querySelectorAll("[data-download]")) {
    link.addEventListener("click", (event) => {
      if (isMac) {
        countDownload("Download", link);
        // Let the download start, then explain the first open, the one step people get stuck on.
        setTimeout(() => dialog.showModal(), 400);
        return;
      }
      countDownload("Send to Mac", link);
      event.preventDefault();
      const page = { title: "Mergiato", text: "A desktop app for GitHub pull requests", url: location.href };
      if (navigator.share) navigator.share(page).catch(() => {});
      else copy(location.href, "Link copied. Open it on your Mac.");
    });
  }
  // The guide's "Download it here", for when the first try didn't start.
  const retry = dialog.querySelector("[data-download-direct]");
  retry.addEventListener("click", () => countDownload("Download", retry));
}

// Rybbit custom event: which button, and which version the link pointed at ("latest" before the release
// list loads). Rybbit may be blocked or still loading; the click works either way.
function countDownload(name, link) {
  const version = link.href.match(/\/download\/(v[^/]+)\//)?.[1] ?? "latest";
  window.rybbit?.event(name, { place: link.dataset.place, version });
}

// A pick is kept for the next visit.
function wireThemeToggle() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  const apply = (theme) => {
    root.dataset.theme = theme;
    const other = theme === "light" ? "dark" : "light";
    for (const button of buttons) {
      button.setAttribute("aria-label", `Switch to ${other} mode`);
      if (button.hasAttribute("data-theme-text"))
        button.textContent = `${other[0].toUpperCase()}${other.slice(1)} mode`;
    }
    document.querySelector('meta[name="theme-color"]').content = theme === "light" ? "#ffffff" : "#090909";
  };
  apply(root.dataset.theme);
  for (const button of buttons)
    button.addEventListener("click", () => {
      const theme = root.dataset.theme === "light" ? "dark" : "light";
      apply(theme);
      try {
        localStorage.setItem("theme", theme);
      } catch {}
    });
}

function wireCopyButtons() {
  for (const button of document.querySelectorAll("[data-copy]"))
    button.addEventListener("click", () => {
      copy(button.dataset.copy, "Copied: " + button.dataset.copy);
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = "Copy"), 1500);
    });
}

// Every Download link gets the newest release's .dmg, straight from GitHub; they already point at the
// Releases page should this fail (offline, rate limit).
function loadLatestRelease() {
  fetch("https://api.github.com/repos/alex-parra/mergiato-pull-request-app/releases?per_page=50")
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((list) => {
      const stable = list.filter((release) => !release.draft && !release.prerelease);
      const latest = stable[0];
      const dmgs = latest?.assets.filter((asset) => asset.name.endsWith(".dmg")) ?? [];
      const dmg = dmgs.find((asset) => asset.name.includes("universal")) ?? dmgs[0];
      if (!dmg) return;
      const macs = dmg.name.includes("universal") ? "Apple silicon and Intel" : "Apple silicon";
      const size = (dmg.size / 1_000_000).toFixed(1);
      // A small count reads as "nobody uses this", so it only shows once there's a crowd.
      const downloads = stable
        .flatMap((release) => release.assets)
        .filter((asset) => asset.name.endsWith(".dmg"))
        .reduce((sum, asset) => sum + asset.download_count, 0);
      const crowd = downloads >= 250 ? `, ${downloads.toLocaleString("en")} downloads` : "";
      if (isMac) {
        for (const link of document.querySelectorAll("[data-download], [data-download-direct]"))
          link.href = dmg.browser_download_url;
        for (const line of document.querySelectorAll("[data-version]"))
          line.textContent = `Free, ${size} MB. ${latest.tag_name}, updated ${ago(latest.published_at)}${crowd}. For ${macs} Macs.`;
      }
    })
    .catch(() => {});
}

function ago(date) {
  const days = Math.round((Date.now() - new Date(date)) / 86_400_000);
  if (days < 1) return "today";
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-days, "day");
}

function copy(text, note) {
  navigator.clipboard?.writeText(text).then(
    () => toast(note),
    () => toast(text),
  );
}

function toast(text) {
  const note = document.createElement("div");
  note.className =
    "fixed bottom-6 left-1/2 z-60 -translate-x-1/2 rounded-[10px] border border-edge-strong bg-raised px-4 py-2.5 text-[14px] text-fg shadow-[0_20px_50px_-20px_var(--color-shadow)]";
  note.setAttribute("role", "status");
  note.textContent = text;
  document.body.append(note);
  setTimeout(() => note.remove(), 2600);
}

wireThemeToggle();
wireDownloads();
wireCopyButtons();
loadLatestRelease();
wireVideos();

// The app's videos play while on screen and pause off it, so a long page doesn't run them all.
// With Reduce Motion on they stay on their poster, with controls to play one by choice.
function wireVideos() {
  // Posters far down the page wait until their video is a screen away, so they don't slow the first paint.
  const near = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.poster = target.dataset.poster;
        near.unobserve(target);
      }
    },
    { rootMargin: "100% 0px" },
  );
  for (const video of document.querySelectorAll("video[data-poster]")) near.observe(video);

  const videos = document.querySelectorAll("video[data-autoplay]");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const video of videos) video.controls = true;
    return;
  }
  const watch = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      }
    },
    { threshold: 0.2 },
  );
  for (const video of videos) watch.observe(video);
}
