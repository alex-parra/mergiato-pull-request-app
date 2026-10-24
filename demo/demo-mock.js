// Stands in for the desktop app's Rust side, so the real app runs in a browser on the demo workspace
// (scripts/demo/data.js): every command answers from that data, and actions (reacting, replying,
// merging) succeed without doing anything. Loaded before the app, after data.js.
(() => {
  const demo = window.__DEMO__;

  // No real person's picture: every GitHub avatar becomes initials on a color, whoever the login is.
  const initialsFor = (login) => {
    const initials = login
      .split(/[-_]/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
    const hue = [...login].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 45% 42%)"/><text x="32" y="41" font-family="-apple-system,Helvetica,sans-serif" font-size="26" font-weight="600" fill="#fff" text-anchor="middle">${initials}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };
  const localAvatar = (value) => {
    const match = String(value).match(/^https:\/\/github\.com\/([^/?]+)\.png/);
    return match ? initialsFor(decodeURIComponent(match[1])) : value;
  };
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    return setAttribute.call(
      this,
      name,
      this instanceof HTMLImageElement && name === "src" ? localAvatar(value) : value,
    );
  };
  const imageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    ...imageSrc,
    set(value) {
      imageSrc.set.call(this, localAvatar(value));
    },
  });
  // What the demo's actions change, so the app sees the result: labels added by Merge (Graphite's
  // queue label shows the PR as queued) and re-runs (failed jobs run for a few seconds, then pass).
  const addedLabels = {};
  const reruns = {};
  const RERUN_MS = 3500;
  // Reviews you write in the demo: the one in progress per PR, and those you finished.
  const pendingReviews = {};
  const finishedReviews = {};
  const withState = (number, data) => {
    const labels = addedLabels[number] ?? [];
    const overview = {
      ...data.overview,
      labels: [...data.overview.labels, ...labels.map((name) => ({ name, color: "888888" }))],
    };
    const startedAt = reruns[number];
    const checks = startedAt
      ? data.checks.map((check) => {
          if (check.conclusion !== "FAILURE") return check;
          if (Date.now() - startedAt < RERUN_MS)
            return {
              ...check,
              status: "IN_PROGRESS",
              conclusion: "",
              startedAt: new Date(startedAt).toISOString(),
              completedAt: null,
            };
          return {
            ...check,
            conclusion: "SUCCESS",
            startedAt: new Date(startedAt).toISOString(),
            completedAt: new Date(startedAt + RERUN_MS).toISOString(),
          };
        })
      : data.checks;
    const own = [...(finishedReviews[number] ?? []), ...(pendingReviews[number] ? [pendingReviews[number]] : [])];
    const reviews = {
      reviews: [...data.reviews.reviews, ...own.map((item) => item.review)],
      threads: [...data.reviews.threads, ...own.flatMap((item) => item.threads)],
    };
    return { ...data, overview, checks, reviews };
  };
  // A comment in your review in progress, starting the review if it's the first.
  const addToReview = ({ url, path, line, startLine, side, body }) => {
    const number = demo.numberOf(url);
    const pending = (pendingReviews[number] ??= {
      review: {
        id: `PRR_demo${number}_${Date.now()}`,
        author: { login: demo.viewer },
        body: "",
        state: "PENDING",
        submittedAt: null,
        viewerDidAuthor: true,
      },
      threads: [],
    });
    pending.threads.push({
      id: `PRRT_demo${Date.now()}`,
      path,
      line,
      startLine: startLine ?? null,
      diffSide: side,
      isResolved: false,
      isOutdated: false,
      comments: {
        nodes: [
          {
            id: `PRRC_demo${Date.now()}`,
            author: { login: demo.viewer },
            body,
            createdAt: new Date().toISOString(),
            viewerDidAuthor: true,
            pullRequestReview: { id: pending.review.id },
          },
        ],
      },
    });
    return pending.review.id;
  };
  const finishReview = ({ url, verdict, body }) => {
    const number = demo.numberOf(url);
    const pending = pendingReviews[number];
    if (!pending) return null;
    delete pendingReviews[number];
    const state = { comment: "COMMENTED", approve: "APPROVED", "request-changes": "CHANGES_REQUESTED" }[verdict];
    const review = { ...pending.review, body, state, submittedAt: new Date().toISOString() };
    finishedReviews[number] = [...(finishedReviews[number] ?? []), { ...pending, review }];
    return null;
  };
  const byUrl = (handler) => (args) => {
    const number = demo.numberOf(args.url);
    return handler(withState(number, demo.detailFor(number)), args);
  };
  const answers = {
    check_online: () => true,
    check_startup: () => ({ state: "ready", login: demo.viewer, detail: null }),
    check_tools: () => demo.tools,
    viewer_login: () => demo.viewer,
    load_viewer_stats: () => demo.stats,
    // The window counts as focused; otherwise the app waits for native focus and pauses its polling.
    "plugin:window|is_focused": () => true,
    load_remote_inbox: () => demo.inbox,
    // The menu bar's mini inbox, from the same PRs as the inbox (a few unread, as the sidebar shows them).
    get_menu_bar_panel: () => {
      const unread = [490, 477, 482];
      const mini = (row) => ({
        url: row.url,
        number: row.number,
        title: row.title,
        repository: row.repository.nameWithOwner,
        author: row.author,
        status: row.isDraft
          ? "draft"
          : row.reviewDecision === "CHANGES_REQUESTED"
            ? "changes"
            : row.reviewDecision === "APPROVED"
              ? "approved"
              : "waiting",
        checks: row.checksState,
        unread: unread.includes(row.number),
      });
      const mine = demo.inbox.myOpenPrs.data.map(mini);
      const reviews = demo.inbox.reviewRequestedPrs.data.map(mini);
      return {
        revision: 1,
        data: {
          mine,
          reviews,
          mineCount: mine.length,
          reviewCount: reviews.length,
          updatedAt: Date.now(),
          refreshing: false,
          error: null,
          theme: window.__DEMO_MENU_THEME__?.theme ?? "graphite",
          dark: window.__DEMO_MENU_THEME__?.dark ?? true,
        },
      };
    },
    // Healthy unless a scene sets window.__DEMO_INCIDENT__ before the app loads.
    load_github_status: () => {
      const now = Date.now();
      const incident = window.__DEMO_INCIDENT__;
      return {
        page: { updatedAt: new Date(now).toISOString() },
        components: incident
          ? [
              { id: "hhtssxt0f5v2", name: "Pull Requests", status: "degraded_performance" },
              { id: "br0l2tvcx85d", name: "Actions", status: "degraded_performance" },
            ]
          : [],
        incidents: incident
          ? [
              {
                id: "demo0incident",
                name: "Delays in pull request updates and Actions runs",
                status: "monitoring",
                impact: "minor",
                updatedAt: new Date(now - 12 * 60 * 1000).toISOString(),
                components: [{ id: "hhtssxt0f5v2" }, { id: "br0l2tvcx85d" }],
              },
            ]
          : [],
      };
    },
    load_more_prs: () => ({ prs: [], next: null }),
    search_prs: () => [],
    find_prs: () => [],
    load_pr_detail: byUrl(({ detail }) => detail),
    load_pr_overview: byUrl(({ overview }) => overview),
    load_pr_checks: byUrl(({ checks }) => ({ statusCheckRollup: checks })),
    load_pr_reviews: byUrl(({ reviews }) => reviews),
    load_pr_diff: byUrl(({ diff }) => diff),
    load_commit_diff: byUrl(({ diff }) => diff),
    load_pr_files: () => ({ files: [] }),
    load_viewed_files: () => ({ id: "PR_demo", viewed: [] }),
    load_pr_notifications: () => demo.notifications ?? [],
    mark_notification_read: () => null,
    load_pr_commits: byUrl(({ commits }) => ({ commits })),
    load_reactions: byUrl(({ reactions }) => reactions),
    load_pr_stack: (args) => demo.stackFor(demo.numberOf(args.url)),
    load_pr_templates: () => [],
    load_pr_labels: () => [
      { name: "billing", color: "a371f7", description: "Plans, usage and invoices" },
      { name: "frontend", color: "3fb950", description: "" },
      { name: "api", color: "1f6feb", description: "" },
      { name: "needs-design", color: "d29922", description: "" },
    ],
    search_pr_users: () => ({
      viewer: demo.viewer,
      users: ["maya-chen", "jonas-weber", "priya-raman", "leo-martins", "aiko-tanaka", "ben-okafor"].map((login) => ({
        login,
        name: login.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      })),
    }),
    search_pr_teams: () => [{ name: "Billing", slug: "billing" }],
    load_repo_merge_settings: () => ({
      mergeCommitAllowed: false,
      squashMergeAllowed: true,
      rebaseMergeAllowed: true,
      autoMergeAllowed: true,
      deleteBranchOnMerge: true,
      viewerDefaultMergeMethod: "SQUASH",
      mergeQueue: null,
      queueLabel: null,
      hotfixLabel: null,
    }),
    list_claude_skills: () => [{ name: "code-review", description: "Review a pull request", source: "personal" }],
    vercel_projects: () => demo.vercelProjects,
    load_pr_releases: () => ({
      commit: "demo-merge-commit",
      deployments: [
        {
          environment: "Production",
          project: "web",
          status: "ready",
          url: "https://atlas.example.com",
          logUrl: "https://vercel.com/acme/web/demo",
          createdAt: new Date().toISOString(),
        },
        {
          environment: "Production",
          project: "docs",
          status: "building",
          url: null,
          logUrl: "https://vercel.com/acme/docs/demo",
          createdAt: new Date().toISOString(),
        },
        {
          environment: "staging",
          project: "web",
          status: "ready",
          url: "https://staging.atlas.example.com",
          logUrl: "https://vercel.com/acme/web/staging-demo",
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    edit_pr: ({ url, field, value, add }) => {
      if (field !== "label") return null;
      // Graphite's queue label is how a merge is asked for there.
      if (add && /queue/i.test(value)) report("merge");
      const number = demo.numberOf(url);
      const labels = new Set(addedLabels[number] ?? []);
      if (add) labels.add(value);
      else labels.delete(value);
      addedLabels[number] = [...labels];
      return null;
    },
    add_review_comment: addToReview,
    submit_pending_review: finishReview,
    discard_pending_review: ({ url }) => {
      delete pendingReviews[demo.numberOf(url)];
      return null;
    },
    rerun_workflow_runs: ({ url }) => {
      reruns[demo.numberOf(url)] = Date.now();
      return null;
    },
    rerun_job: ({ url }) => {
      reruns[demo.numberOf(url)] = Date.now();
      return null;
    },
    // A shell in the PR's clone, running the tests: the docked terminal's shot.
    shell_session_start: ({ onEvent }) => {
      let index = 0;
      const send = (data) => window[`_${onEvent.id}`]?.({ index: index++, message: { data } });
      const prompt = "\x1b[36m~/code/atlas\x1b[0m \x1b[35malex/usage-panel\x1b[0m \x1b[32m❯\x1b[0m ";
      const lines = [
        "",
        " \x1b[46m\x1b[30m RUN \x1b[0m \x1b[36mv3.2.4\x1b[0m ~/code/atlas",
        "",
        " \x1b[32m✓\x1b[0m apps/web/src/features/billing/plans.test.ts \x1b[2m(6 tests)\x1b[0m \x1b[33m41ms\x1b[0m",
        " \x1b[32m✓\x1b[0m apps/web/src/features/billing/UsagePanel.test.tsx \x1b[2m(9 tests)\x1b[0m \x1b[33m212ms\x1b[0m",
        " \x1b[32m✓\x1b[0m apps/web/src/features/billing/useUsage.test.ts \x1b[2m(5 tests)\x1b[0m \x1b[33m96ms\x1b[0m",
        " \x1b[32m✓\x1b[0m packages/api/src/billing/usage.test.ts \x1b[2m(12 tests)\x1b[0m \x1b[33m388ms\x1b[0m",
        "",
        " \x1b[2mTest Files\x1b[0m  \x1b[1m\x1b[32m4 passed\x1b[0m \x1b[2m(4)\x1b[0m",
        " \x1b[2m     Tests\x1b[0m  \x1b[1m\x1b[32m32 passed\x1b[0m \x1b[2m(32)\x1b[0m",
        " \x1b[2m  Duration\x1b[0m  1.94s",
        "",
      ];
      setTimeout(() => {
        send(prompt + "pnpm test billing\r\n");
        setTimeout(() => send(lines.join("\r\n") + "\r\n" + prompt), 400);
      }, 300);
      return 1;
    },
  };

  // What the website listens for when the demo runs in a frame: which kind of thing was done.
  const reported = {
    merge_pr: "merge",
    request_stack_merge: "merge",
    submit_review: "approve",
    submit_pending_review: "approve",
    rerun_workflow_runs: "rerun",
    rerun_job: "rerun",
    add_review_comment: "comment",
    add_inline_comment: "comment",
    post_pr_comment: "comment",
    reply_to_thread: "comment",
    resolve_thread: "resolve",
    vercel_deploy: "deploy",
  };
  const report = (action) => {
    if (window.parent !== window) window.parent.postMessage({ mergiatoDemo: action }, location.origin);
  };

  let next = 0;
  window.isTauri = true;
  window.__TAURI_INTERNALS__ = {
    metadata: { currentWindow: { label: "main" }, currentWebview: { windowLabel: "main", label: "main" } },
    transformCallback(callback) {
      const id = ++next;
      window[`_${id}`] = callback;
      return id;
    },
    convertFileSrc: (path) => path,
    async invoke(command, args = {}) {
      const answer = answers[command];
      if (reported[command]) report(reported[command]);
      // A short, varied pause, as a real call has; actions (and the window's own calls) just succeed.
      if (!answer) return null;
      await new Promise((resolve) => setTimeout(resolve, 60 + Math.random() * 120));
      return structuredClone(answer(args));
    },
  };
})();
