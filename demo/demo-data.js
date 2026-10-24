// The demo workspace: a made-up company ("acme") with a small team, for screenshots and videos of the
// real app without anyone's real data. Times are relative to now, so "2h ago" stays true whenever the
// shots are taken. Loaded before the app by scripts/demo/mock.js's page; sets window.__DEMO__.
(() => {
  const now = Date.now();
  const ago = (minutes) => new Date(now - minutes * 60_000).toISOString();
  const hours = (n) => ago(n * 60);
  const days = (n) => ago(n * 24 * 60);

  const viewer = "alex-parra";
  const atlas = "acme/atlas";
  const design = "acme/design-system";
  const url = (repo, number) => `https://github.com/${repo}/pull/${number}`;

  // ── Diffs ────────────────────────────────────────────────────────────────────────────────────
  // A new file: every line added.
  const added = (path, lines) =>
    `diff --git a/${path} b/${path}\nnew file mode 100644\n--- /dev/null\n+++ b/${path}\n@@ -0,0 +1,${lines.length} @@\n${lines.map((line) => `+${line}`).join("\n")}\n`;
  // A changed file from hunks of " context", "-old" and "+new" lines; the counts are worked out here.
  const changed = (path, hunks) =>
    `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n${hunks
      .map(({ at, lines }) => {
        const old = lines.filter((line) => !line.startsWith("+")).length;
        const next = lines.filter((line) => !line.startsWith("-")).length;
        return `@@ -${at[0]},${old} +${at[1]},${next} @@\n${lines.join("\n")}`;
      })
      .join("\n")}\n`;
  const stats = (diff) => {
    const lines = diff.split("\n");
    return {
      additions: lines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length,
      deletions: lines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length,
      changedFiles: lines.filter((line) => line.startsWith("diff --git")).length,
    };
  };

  const usagePanel = [
    'import { Gauge } from "lucide-react";',
    "",
    'import { Card, CardHeader, CardTitle } from "@/components/ui/card";',
    'import { formatAmount } from "@/lib/format";',
    "",
    'import { meterTone, type Plan } from "./plans";',
    'import { useUsage } from "./useUsage";',
    'import { UsageChart } from "./UsageChart";',
    "",
    "// This month's usage per meter, against what the workspace's plan includes.",
    "export function UsagePanel({ workspaceId, plan }: { workspaceId: string; plan: Plan }) {",
    "  const usage = useUsage(workspaceId);",
    '  if (usage.status === "pending") return <UsageSkeleton />;',
    '  if (plan.kind === "flat") return <FlatPlanNotice plan={plan} />;',
    "",
    "  return (",
    "    <Card>",
    "      <CardHeader>",
    '        <CardTitle className="flex items-center gap-2">',
    '          <Gauge className="size-4" aria-hidden />',
    "          Usage this month",
    "        </CardTitle>",
    "      </CardHeader>",
    '      <ul className="grid gap-3 p-4">',
    "        {plan.meters.map((meter) => {",
    "          const used = usage.data.totals[meter.id] ?? 0;",
    "          const share = used / meter.included;",
    "          return (",
    "            <li key={meter.id} data-tone={meterTone(share, plan)}>",
    '              <span className="font-medium">{meter.label}</span>',
    "              <span>",
    "                {formatAmount(used, meter.unit)} of {formatAmount(meter.included, meter.unit)}",
    "              </span>",
    "              <progress value={Math.min(share, 1)} />",
    "            </li>",
    "          );",
    "        })}",
    "      </ul>",
    "      <UsageChart days={usage.data.days} />",
    "    </Card>",
    "  );",
    "}",
  ];
  const useUsage = [
    'import { useQuery } from "@tanstack/react-query";',
    "",
    'import { api } from "@/lib/api";',
    "",
    "export interface Usage {",
    "  totals: Record<string, number>;",
    "  days: { date: string; totals: Record<string, number> }[];",
    "}",
    "",
    "// The workspace's usage so far this month, refreshed every minute while the page is open.",
    "export function useUsage(workspaceId: string) {",
    "  return useQuery({",
    '    queryKey: ["usage", workspaceId, "month"],',
    "    queryFn: () => api.get<Usage>(`/v1/workspaces/${workspaceId}/usage?range=month`),",
    "    refetchInterval: 60_000,",
    "    staleTime: 30_000,",
    "  });",
    "}",
  ];
  const usageApi = [
    'import { sql } from "../db";',
    'import type { MeterId } from "./meters";',
    "",
    "export interface DailyUsage {",
    "  date: string;",
    "  totals: Partial<Record<MeterId, number>>;",
    "}",
    "",
    "// Usage per day for one workspace, from the rollup table (raw events are kept 30 days).",
    "export async function dailyUsage(workspaceId: string, from: Date, to: Date): Promise<DailyUsage[]> {",
    "  const rows = await sql<{ day: string; meter: MeterId; total: number }>`",
    "    select day::text, meter, sum(quantity)::int as total",
    "    from usage_rollups",
    "    where workspace_id = ${workspaceId} and day between ${from} and ${to}",
    "    group by day, meter",
    "    order by day",
    "  `;",
    "  const byDay = new Map<string, DailyUsage>();",
    "  for (const row of rows) {",
    "    const day = byDay.get(row.day) ?? { date: row.day, totals: {} };",
    "    day.totals[row.meter] = row.total;",
    "    byDay.set(row.day, day);",
    "  }",
    "  return [...byDay.values()];",
    "}",
  ];
  const usageTest = [
    'import { describe, expect, it } from "vitest";',
    "",
    'import { meterTone } from "../../apps/web/src/features/billing/plans";',
    "",
    'describe("meterTone", () => {',
    '  const plan = { kind: "usage", warnAt: 0.8 } as const;',
    "",
    '  it("stays calm under the warning line", () => {',
    '    expect(meterTone(0.5, plan)).toBe("ok");',
    "  });",
    "",
    '  it("warns from the plan\'s threshold", () => {',
    '    expect(meterTone(0.8, plan)).toBe("warn");',
    "  });",
    "",
    '  it("flags overage", () => {',
    '    expect(meterTone(1.2, plan)).toBe("over");',
    "  });",
    "});",
  ];
  const heroDiff = [
    added("apps/web/src/features/billing/UsagePanel.tsx", usagePanel),
    added("apps/web/src/features/billing/useUsage.ts", useUsage),
    changed("apps/web/src/features/billing/plans.ts", [
      {
        at: [12, 12],
        lines: [
          " export interface Plan {",
          "   id: string;",
          '   kind: "flat" | "usage";',
          "+  // Share of an allowance at which its meter turns amber (finance sets it per plan).",
          "+  warnAt: number;",
          "   meters: Meter[];",
          " }",
        ],
      },
      {
        at: [40, 42],
        lines: [
          " ",
          '-export const meterTone = (share: number) => (share >= 1 ? "over" : share >= 0.8 ? "warn" : "ok");',
          '+export function meterTone(share: number, plan: Pick<Plan, "warnAt">) {',
          '+  if (share >= 1) return "over";',
          '+  return share >= plan.warnAt ? "warn" : "ok";',
          "+}",
        ],
      },
    ]),
    changed("apps/web/src/routes/settings/billing.tsx", [
      {
        at: [3, 3],
        lines: [
          ' import { InvoiceList } from "@/features/billing/InvoiceList";',
          ' import { PlanCard } from "@/features/billing/PlanCard";',
          '+import { UsagePanel } from "@/features/billing/UsagePanel";',
          ' import { useWorkspace } from "@/features/workspaces/useWorkspace";',
        ],
      },
      {
        at: [21, 22],
        lines: [
          '     <div className="grid gap-6">',
          "       <PlanCard plan={workspace.plan} />",
          "+      <UsagePanel workspaceId={workspace.id} plan={workspace.plan} />",
          "       <InvoiceList workspaceId={workspace.id} />",
          "     </div>",
        ],
      },
    ]),
    added("packages/api/src/billing/usage.ts", usageApi),
    added("packages/api/src/billing/usage.test.ts", usageTest),
    changed("packages/api/src/routes/workspaces.ts", [
      {
        at: [58, 58],
        lines: [
          '   app.get("/v1/workspaces/:id/members", requireMember, listMembers);',
          '+  app.get("/v1/workspaces/:id/usage", requireMember, async (req) => {',
          "+    const { from, to } = monthRange(req.query.range);",
          "+    return { days: await dailyUsage(req.params.id, from, to) };",
          "+  });",
          " ",
        ],
      },
    ]),
    changed("pnpm-lock.yaml", [
      {
        at: [2210, 2210],
        lines: [
          "   /recharts@2.12.7:",
          "-    resolution: {integrity: sha512-hlLJMhPQfv4tP0yk/6RYrbDcDV1xETo0Sc1rBdyH8nAo3kx1hFKIG5SrUsaJsS9ckK4bxj3/Gv3Iqv9Tx2pWdA==}",
          "+    resolution: {integrity: sha512-ab8tP4kBhHyfAnRdKLTzSPGmVKrVKX7IEpMnZn1AeSlh2WBXl1vyUgM7I5Uy2PK7BhpTUvqbmD7j1xCH1RZ1VQ==}",
        ],
      },
    ]),
  ].join("");

  const rateLimitDiff = [
    added("packages/api/src/limits/tokenBucket.ts", [
      "// A token bucket per key: `capacity` requests at once, refilled at `perSecond`.",
      "export class TokenBucket {",
      "  private tokens: number;",
      "  private updatedAt = Date.now();",
      "",
      "  constructor(",
      "    private readonly capacity: number,",
      "    private readonly perSecond: number,",
      "  ) {",
      "    this.tokens = capacity;",
      "  }",
      "",
      "  take(now = Date.now()): boolean {",
      "    const refill = ((now - this.updatedAt) / 1000) * this.perSecond;",
      "    this.tokens = Math.min(this.capacity, this.tokens + refill);",
      "    this.updatedAt = now;",
      "    if (this.tokens < 1) return false;",
      "    this.tokens -= 1;",
      "    return true;",
      "  }",
      "}",
    ]),
    changed("packages/api/src/middleware/apiKey.ts", [
      {
        at: [14, 14],
        lines: [
          "   const key = await findKey(req.headers.authorization);",
          '   if (!key) return reply.code(401).send({ error: "invalid_key" });',
          "+  if (!limiter.for(key.orgId).take()) {",
          '+    reply.header("retry-after", "1");',
          '+    return reply.code(429).send({ error: "rate_limited" });',
          "+  }",
          "   req.apiKey = key;",
        ],
      },
    ]),
    changed("docs/api/limits.md", [
      {
        at: [1, 1],
        lines: [
          " # Rate limits",
          " ",
          "-Public API keys aren't rate limited yet.",
          "+Each organization's keys share 100 requests per second, with bursts up to 300.",
          "+Past that, the API answers `429` with a `retry-after` header.",
        ],
      },
    ]),
  ].join("");

  // A small change for the rest, so every PR opens to something.
  const smallDiff = (title) =>
    changed("apps/web/src/app/changelog.ts", [
      {
        at: [1, 1],
        lines: [
          " export const changelog = [",
          `+  { date: "${new Date(now).toISOString().slice(0, 10)}", entry: ${JSON.stringify(title)} },`,
          '   { date: "2026-09-30", entry: "Faster workspace switching" },',
        ],
      },
    ]);

  // A big PR for the "every file" shots: renaming workspaces to organizations touches 913 source files
  // and the lockfile. Generated, so the counts stay right if the lists change.
  const renameAreas = [
    "billing",
    "members",
    "settings",
    "api-keys",
    "audit-log",
    "onboarding",
    "search",
    "invoices",
    "webhooks",
    "sso",
    "usage",
    "notifications",
    "activity",
    "projects",
    "integrations",
    "exports",
    "roles",
    "sessions",
    "domains",
    "plans",
  ];
  const renameFiles = [];
  for (const area of renameAreas) {
    const name = area.replace(/(^|-)(\w)/g, (_, __, letter) => letter.toUpperCase());
    for (const file of [
      `${name}Page.tsx`,
      `${name}List.tsx`,
      `${name}Row.tsx`,
      `${name}Form.tsx`,
      `${name}Empty.tsx`,
      `use${name}.ts`,
      `use${name}Mutation.ts`,
      `${area}.test.ts`,
      `${area}.stories.tsx`,
      `${name}Header.tsx`,
      `${name}Filters.tsx`,
      `${name}Dialog.tsx`,
      `${name}Menu.tsx`,
      `${name}Skeleton.tsx`,
      `${name}Settings.tsx`,
    ])
      renameFiles.push(`apps/web/src/features/${area}/${file}`);
    for (const file of [
      "routes.ts",
      "service.ts",
      "repository.ts",
      "schema.ts",
      "permissions.ts",
      "events.ts",
      "routes.test.ts",
      "service.test.ts",
      "fixtures.ts",
      "serializers.ts",
      "jobs.ts",
      "webhooks.ts",
      "queries.ts",
      "mutations.ts",
      "errors.ts",
      "limits.ts",
      "audit.ts",
      "cache.ts",
      "index.ts",
      "types.ts",
      "validate.ts",
      "policies.ts",
      "metrics.ts",
      "seed.ts",
      "migrate.ts",
    ])
      renameFiles.push(`packages/api/src/${area}/${file}`);
    for (const file of ["model.ts", "queries.sql.ts", "factory.ts", "model.test.ts", "indexes.ts"])
      renameFiles.push(`packages/db/src/${area}/${file}`);
    renameFiles.push(`packages/sdk/src/${area}.ts`);
  }
  const renameDiff = [
    ...renameFiles.slice(0, 913).map((path, index) =>
      changed(path, [
        {
          at: [3 + (index % 5), 3 + (index % 5)],
          lines: [
            ` import { logger } from "@acme/logger";`,
            `-import { useWorkspace } from "@/features/workspaces/useWorkspace";`,
            `+import { useOrganization } from "@/features/organizations/useOrganization";`,
          ],
        },
        {
          at: [18 + (index % 23), 18 + (index % 23)],
          lines: [
            `   // ${["Scoped to the current org.", "Only admins see this.", "Cached for a minute.", "Runs on every request."][index % 4]}`,
            `-  const workspace = useWorkspace();`,
            `-  const id = workspace.id;`,
            `+  const organization = useOrganization();`,
            `+  const id = organization.id;`,
            `   if (!id) return null;`,
          ],
        },
      ]),
    ),
    changed("pnpm-lock.yaml", [
      {
        at: [1, 1],
        lines: [
          " lockfileVersion: '9.0'",
          ...Array.from({ length: 40 }, (_, index) => `-  /@acme/workspace-${index}@1.${index}.0:`),
          ...Array.from({ length: 40 }, (_, index) => `+  /@acme/organization-${index}@1.${index}.0:`),
        ],
      },
    ]),
  ].join("");

  // Graphite's stack comment, as Graphite posts it on each PR of a stack: it lists the stack and its
  // merge-queue labels, which is how the Merge button knows to go through Graphite's queue.
  const graphiteStack = [482, 479, 476];
  const graphiteComment = (number) => ({
    id: `IC_graphite_${number}`,
    author: { login: "graphite-app" },
    body: [
      "<!-- Current dependencies on/for this PR: -->",
      ...graphiteStack.map(
        (item) =>
          `* **#${item}** <a href="https://app.graphite.com/github/pr/acme/atlas/${item}?utm_source=stack-comment-icon" target="_blank"><img src="https://static.graphite.dev/graphite-32x32-black.png" alt="Graphite" width="10px" height="10px"/></a>${item === number ? " 👈" : ""}`,
      ),
      "* `main`",
      "",
      "This stack of pull requests is managed by Graphite. Learn more about stacking.",
      "",
      "#### How to use the Graphite Merge Queue",
      "",
      "Add either label to this PR to merge it via the merge queue:",
      "",
      "- <kbd>merge-queue</kbd> - adds this PR to the back of the merge queue",
      "- <kbd>hotfix</kbd> - for urgent hot fixes, skip the queue and merge this PR next",
    ].join("\n"),
    createdAt: hours(6),
  });

  // ── PRs ──────────────────────────────────────────────────────────────────────────────────────
  const pr = (repo, number, fields) => ({
    number,
    url: url(repo, number),
    repository: { nameWithOwner: repo },
    baseRefName: "main",
    isDraft: false,
    state: "OPEN",
    mergedAt: null,
    merging: false,
    reviewedByMe: false,
    reviewRequestedAt: null,
    myLastActivityAt: null,
    reviewStates: [],
    reviewRequestCount: 0,
    stack: null,
    stackEntry: null,
    ...fields,
  });

  const myOpenPrs = [
    pr(atlas, 482, {
      title: "Billing: usage panel in workspace settings",
      headRefName: "alex/usage-panel",
      baseRefName: "alex/usage-api",
      reviewDecision: "CHANGES_REQUESTED",
      checksState: "PENDING",
      reviewStates: ["CHANGES_REQUESTED", "APPROVED", "COMMENTED"],
      reviewRequestCount: 1,
      updatedAt: ago(14),
      author: viewer,
    }),
    pr(atlas, 479, {
      title: "Billing: usage API with daily rollups",
      headRefName: "alex/usage-api",
      baseRefName: "alex/usage-events",
      reviewDecision: "APPROVED",
      checksState: "SUCCESS",
      reviewStates: ["APPROVED", "APPROVED"],
      updatedAt: hours(3),
      author: viewer,
    }),
    pr(atlas, 476, {
      title: "Billing: record usage events in Postgres",
      headRefName: "alex/usage-events",
      reviewDecision: "APPROVED",
      checksState: "SUCCESS",
      reviewStates: ["APPROVED", "APPROVED"],
      updatedAt: hours(5),
      author: viewer,
    }),
    pr(atlas, 468, {
      title: "Upgrade to React Router 7 data APIs",
      headRefName: "alex/react-router-7",
      reviewDecision: "APPROVED",
      checksState: "SUCCESS",
      reviewStates: ["APPROVED"],
      updatedAt: days(1),
      author: viewer,
    }),
    pr(atlas, 471, {
      title: "Fix flaky invite email test",
      headRefName: "alex/flaky-invite-test",
      isDraft: true,
      reviewDecision: null,
      checksState: "FAILURE",
      updatedAt: days(2),
      author: viewer,
    }),
    pr(design, 131, {
      title: "Tokens: add the warning palette for meters",
      headRefName: "alex/warning-tokens",
      reviewDecision: "REVIEW_REQUIRED",
      checksState: "SUCCESS",
      reviewRequestCount: 1,
      updatedAt: days(3),
      author: viewer,
    }),
  ];
  const reviewRequestedPrs = [
    pr(atlas, 490, {
      title: "Rename workspaces to organizations everywhere",
      headRefName: "leo/rename-workspaces",
      reviewDecision: "REVIEW_REQUIRED",
      checksState: "SUCCESS",
      reviewRequestCount: 2,
      reviewRequestedAt: ago(30),
      updatedAt: ago(25),
      author: "leo-martins",
    }),
    pr(atlas, 477, {
      title: "Rate-limit public API keys per organization",
      headRefName: "jonas/api-rate-limits",
      reviewDecision: "REVIEW_REQUIRED",
      checksState: "PENDING",
      reviewRequestCount: 2,
      reviewRequestedAt: hours(1),
      updatedAt: ago(40),
      author: "jonas-weber",
    }),
    pr(atlas, 474, {
      title: "SAML single sign-on for enterprise workspaces",
      headRefName: "priya/saml-sso",
      reviewDecision: "REVIEW_REQUIRED",
      checksState: "SUCCESS",
      reviewRequestCount: 3,
      reviewRequestedAt: hours(6),
      updatedAt: hours(4),
      author: "priya-raman",
    }),
    pr(design, 128, {
      title: "Button: loading state with an inline spinner",
      headRefName: "aiko/button-loading",
      reviewDecision: "REVIEW_REQUIRED",
      checksState: "SUCCESS",
      reviewRequestCount: 1,
      reviewRequestedAt: days(1),
      updatedAt: hours(20),
      author: "aiko-tanaka",
    }),
    pr(atlas, 466, {
      title: "Search: highlight matched terms in results",
      headRefName: "ben/search-highlights",
      reviewDecision: "REVIEW_REQUIRED",
      checksState: "FAILURE",
      reviewRequestCount: 1,
      reviewRequestedAt: days(2),
      updatedAt: days(1),
      author: "ben-okafor",
    }),
    pr(atlas, 469, {
      title: "Move cron jobs onto the queue worker",
      headRefName: "leo/cron-to-queue",
      reviewDecision: "APPROVED",
      checksState: "SUCCESS",
      reviewedByMe: true,
      myLastActivityAt: hours(8),
      reviewStates: ["APPROVED"],
      updatedAt: hours(7),
      author: "leo-martins",
    }),
  ];
  const mergedTitles = [
    "Workspace switcher: remember the last workspace",
    "Invoices: download as PDF",
    "Settings: move danger zone to its own tab",
    "API: paginate members with cursors",
    "Onboarding: skip the team step for solo plans",
    "Fix timezone drift in the activity feed",
    "Audit log: record API key rotations",
    "Docs: billing webhooks",
  ];
  const recentlyMergedPrs = mergedTitles.map((title, index) =>
    pr(atlas, 465 - index * 3, {
      title,
      headRefName: `alex/${title
        .toLowerCase()
        .replace(/[^a-z]+/g, "-")
        .slice(0, 28)}`,
      state: "MERGED",
      mergedAt: days(index + 1),
      reviewDecision: "APPROVED",
      checksState: null,
      updatedAt: days(index + 1),
      author: viewer,
    }),
  );
  const allPrs = [...myOpenPrs, ...reviewRequestedPrs, ...recentlyMergedPrs];

  // ── Detail per PR ────────────────────────────────────────────────────────────────────────────
  const job = (workflowName, name, minutes, seconds, conclusion = "SUCCESS", status = "COMPLETED") => ({
    __typename: "CheckRun",
    workflowName,
    name,
    status,
    conclusion: status === "COMPLETED" ? conclusion : "",
    startedAt: ago(minutes),
    completedAt: status === "COMPLETED" ? new Date(now - minutes * 60_000 + seconds * 1000).toISOString() : null,
    detailsUrl: `https://github.com/${atlas}/actions/runs/9120${minutes}/job/88${seconds}`,
  });
  const ciChecks = (state) => {
    const failing = state === "FAILURE";
    const running = state === "PENDING";
    return [
      job("CI", "lint", 20, 38),
      job("CI", "typecheck", 20, 74),
      job("CI", "test (web)", 20, 141, failing ? "FAILURE" : "SUCCESS"),
      job("CI", "test (api)", 20, 96, "SUCCESS", running ? "IN_PROGRESS" : "COMPLETED"),
      job("CI", "build", 19, 162),
      job("E2E", "playwright (chromium)", 18, 233, "SUCCESS", running ? "IN_PROGRESS" : "COMPLETED"),
      job("E2E", "playwright (webkit)", 18, 251, "SUCCESS", running ? "QUEUED" : "COMPLETED"),
      job("Security", "dependency review", 20, 22),
      job("Security", "codeql", 20, 300, "SKIPPED"),
    ];
  };

  const vercelComment = (number, building) => {
    const project = (name, id, status) => ({
      name,
      projectId: id,
      rootDirectory: `apps/${name}`,
      inspectorUrl: `https://vercel.com/acme/${name}/9fK2p${number}${name.length}`,
      previewUrl: `${name}-git-pr-${number}-acme.vercel.app`,
      nextCommitStatus: status,
    });
    const data = {
      isMonorepo: true,
      type: "github",
      projects: [
        project("web", "prj_web7Qe2", building ? "PENDING" : "DEPLOYED"),
        project("docs", "prj_docs41X", "DEPLOYED"),
        project("marketing", "prj_mkt0Pz", "SKIPPED"),
      ],
    };
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));
    return {
      id: `IC_vercel_${number}`,
      author: { login: "vercel" },
      body: `[vc]: #demo${number}:${encoded}\nThe latest updates on your projects. <relative-time datetime="${ago(9)}">now</relative-time>`,
      createdAt: hours(2),
    };
  };

  const heroBody = `## What
Adds a **Usage** panel to *Settings → Billing*: this month's usage for each meter (API calls, seats, storage) against what the plan includes, plus a daily chart.

Builds on the usage API from #479.

## Why
Customers on usage-based plans currently ask support how much they've used so far. This answers it in the product, before the invoice does.

## How
- \`useUsage\` fetches \`/v1/workspaces/:id/usage?range=month\` and refreshes every minute while the page is open
- A meter turns amber at the plan's \`warnAt\` share of its allowance, red past 100%
- Workspaces on the legacy flat plan see a short notice instead

## Testing
- [x] Unit tests for the meter thresholds
- [x] Checked against a workspace on each plan
- [ ] Copy review with @maya-chen`;

  const thread = (id, path, line, comments, extra = {}) => ({
    id,
    path,
    line,
    diffSide: "RIGHT",
    isResolved: false,
    isOutdated: false,
    viewerCanResolve: true,
    viewerCanUnresolve: true,
    comments: { nodes: comments },
    ...extra,
  });
  const comment = (id, login, body, minutes, review) => ({
    id,
    author: { login },
    body,
    createdAt: ago(minutes),
    pullRequestReview: { id: review },
    viewerDidAuthor: login === viewer,
    viewerCanDelete: login === viewer,
  });

  const details = {
    482: {
      body: heroBody,
      diff: heroDiff,
      labels: [
        { name: "billing", color: "a371f7" },
        { name: "frontend", color: "3fb950" },
      ],
      assignees: [viewer],
      reviewRequests: [{ login: "leo-martins" }],
      checks: [
        ...ciChecks("PENDING"),
        {
          __typename: "StatusContext",
          context: "Vercel – web",
          state: "PENDING",
          targetUrl: "https://vercel.com/acme/web",
          startedAt: ago(9),
        },
      ],
      comments: [
        vercelComment(482, true),
        {
          id: "IC_maya_1",
          author: { login: "maya-chen" },
          body: "Pulled the preview on staging data: the chart reads really well. 🙌",
          createdAt: hours(1),
        },
      ],
      reviews: [
        {
          id: "R_maya",
          author: { login: "maya-chen" },
          state: "CHANGES_REQUESTED",
          submittedAt: hours(2),
          body: "Looks great overall! Two things before we ship: thresholds should come from the plan (finance wants 90% for enterprise), and let's double-check the refresh doesn't run in background tabs.",
        },
        {
          id: "R_jonas",
          author: { login: "jonas-weber" },
          state: "COMMENTED",
          submittedAt: ago(95),
          body: "Nits only. The rollup query is exactly what I hoped for.",
        },
        { id: "R_priya", author: { login: "priya-raman" }, state: "APPROVED", submittedAt: ago(50), body: "LGTM 🚀" },
      ],
      threads: [
        thread("T_1", "apps/web/src/features/billing/UsagePanel.tsx", 29, [
          comment(
            "C_1",
            "maya-chen",
            "Should the amber line come from the plan? Enterprise asked for alerts at 90%, not 80%.",
            125,
            "R_maya",
          ),
          comment(
            "C_2",
            viewer,
            "Good call: moved it into `plans.ts` as `warnAt`, so each plan sets its own. Updated in the latest push.",
            40,
            "R_maya",
          ),
        ]),
        thread(
          "T_2",
          "apps/web/src/features/billing/useUsage.ts",
          15,
          [
            comment("C_3", "maya-chen", "Does this keep polling in a background tab?", 124, "R_maya"),
            comment(
              "C_4",
              viewer,
              "React Query pauses `refetchInterval` while the tab is hidden (`refetchIntervalInBackground` is off by default), so we're good.",
              38,
              "R_maya",
            ),
          ],
          { isResolved: true },
        ),
        thread("T_3", "packages/api/src/billing/usage.ts", 12, [
          comment(
            "C_5",
            "jonas-weber",
            "nit: `sum(quantity)::int` will overflow for storage bytes on big workspaces. `::bigint` and parse on our side?",
            96,
            "R_jonas",
          ),
        ]),
      ],
      reactions: {
        IC_maya_1: [
          { content: "HEART", count: 2, viewer: true },
          { content: "HOORAY", count: 1, viewer: false },
        ],
        R_priya: [{ content: "ROCKET", count: 3, viewer: true }],
      },
      commits: [
        ["Add usage panel with meters against plan allowances", 26 * 60],
        ["Daily usage chart", 23 * 60],
        ["Empty state for flat plans", 6 * 60],
        ["Thresholds per plan (warnAt)", 45],
      ],
    },
    490: {
      body: `Renames **workspaces** to **organizations** across the web app, the API and the database layer, to match what customers and the docs already call them.

- No behavior change: types, hooks, routes and tables are renamed, nothing else
- The old \`/v1/workspaces\` routes stay as aliases until the next major version
- Generated with a codemod, then checked by hand in billing, roles and SSO`,
      diff: renameDiff,
      labels: [{ name: "api", color: "1f6feb" }],
      assignees: ["leo-martins"],
      reviewRequests: [{ login: viewer }, { login: "maya-chen" }],
      checks: ciChecks("SUCCESS"),
      comments: [],
      reviews: [],
      threads: [],
      reactions: {},
      commits: [
        ["Codemod: workspace → organization", 240],
        ["Keep /v1/workspaces as an alias", 120],
        ["Fix up billing and SSO by hand", 50],
      ],
    },
    477: {
      body: `Public API keys have no rate limit today, so one noisy integration can slow the API for everyone.

This adds a **token bucket per organization** (100 req/s, bursts to 300). Over the limit, requests get \`429\` with \`retry-after\`.

> [!NOTE]
> Limits live in memory per API node for now. A Redis-backed limiter is the follow-up once we run more than two nodes.`,
      diff: rateLimitDiff,
      labels: [{ name: "api", color: "1f6feb" }],
      assignees: ["jonas-weber"],
      reviewRequests: [{ login: viewer }, { login: "maya-chen" }],
      checks: ciChecks("PENDING"),
      comments: [],
      reviews: [],
      threads: [],
      reactions: {},
      commits: [
        ["Token bucket per organization", 300],
        ["429 with retry-after", 120],
        ["Document the limits", 60],
      ],
    },
  };

  const detailFor = (number) => {
    const row = allPrs.find((item) => item.number === number);
    const rich = details[number];
    const diff = rich?.diff ?? smallDiff(row.title);
    return {
      row,
      detail: {
        number,
        title: row.title,
        url: row.url,
        updatedAt: row.updatedAt,
        headRefName: row.headRefName,
        headRefOid: `9f3c2a${number}e7b1d4c8a0f6e2b9d3c5a7e1f4b2${number}`.slice(0, 40),
        baseRefName: row.baseRefName ?? "main",
        state: row.state,
        isDraft: row.isDraft,
        author: { login: row.author },
        reviewDecision: row.reviewDecision ?? null,
        mergeable: "MERGEABLE",
        mergeStateStatus: row.reviewDecision === "APPROVED" && row.checksState === "SUCCESS" ? "CLEAN" : "BLOCKED",
        ...stats(diff),
      },
      overview: {
        id: `PR_demo${number}`,
        body: rich?.body ?? `${row.title}.\n\n- Covered by the existing tests\n- No migration needed`,
        comments: [...(rich?.comments ?? []), ...(graphiteStack.includes(number) ? [graphiteComment(number)] : [])],
        assignees: (rich?.assignees ?? [row.author]).map((login) => ({ login })),
        labels: rich?.labels ?? [],
        reviewRequests: rich?.reviewRequests ?? [],
        latestReviews: (rich?.reviews ?? []).map(({ author, state }) => ({ author, state })),
      },
      checks: rich?.checks ?? (row.state === "MERGED" ? ciChecks("SUCCESS") : ciChecks(row.checksState ?? "SUCCESS")),
      reviews: { reviews: rich?.reviews ?? [], threads: rich?.threads ?? [] },
      diff,
      reactions: rich?.reactions ?? {},
      commits: (rich?.commits ?? [[row.title, 120]]).map(([messageHeadline, minutes], index) => ({
        oid: `${(number * 7919 + index * 104729).toString(16).padStart(8, "0")}c4e1a9b27d5f03e8a6c2b4d1f9e7a3c5`.slice(
          0,
          40,
        ),
        messageHeadline,
        authors: [{ login: row.author, name: row.author }],
        committedDate: ago(minutes),
      })),
    };
  };

  // The stack is found from branches (each PR's base is the one below's head).
  const stackFor = (number) => {
    const row = allPrs.find((item) => item.number === number);
    const chain = myOpenPrs.filter((item) => [476, 479, 482].includes(item.number));
    return { prs: chain.some((item) => item.number === number) ? chain : [row], native: null };
  };

  window.__DEMO__ = {
    viewer,
    inbox: {
      myOpenPrs: { data: myOpenPrs, error: null },
      reviewRequestedPrs: { data: reviewRequestedPrs, error: null },
      recentlyMergedPrs: { data: recentlyMergedPrs, error: null, next: null },
    },
    stats: { merged: 23, graphiteMerged: 0, reviewed: 41, since: days(30).slice(0, 10) },
    tools: [
      { name: "gh", path: "/opt/homebrew/bin/gh", version: "gh version 2.83.0 (2026-09-30)", error: null },
      { name: "claude", path: "/Users/alex/.local/bin/claude", version: "2.1.302 (Claude Code)", error: null },
      { name: "claude-desktop", path: "/Applications/Claude.app", version: "1.4.12", error: null },
      { name: "vercel", path: "/opt/homebrew/bin/vercel", version: "Vercel CLI 59.10.0", error: null },
    ],
    vercelProjects: [
      { team: "team_acme", id: "prj_web7Qe2", name: "web", rootDirectory: "apps/web" },
      { team: "team_acme", id: "prj_docs41X", name: "docs", rootDirectory: "apps/docs" },
      { team: "team_acme", id: "prj_mkt0Pz", name: "marketing", rootDirectory: "apps/marketing" },
      { team: "team_acme", id: "prj_adm9Lq", name: "admin", rootDirectory: "apps/admin" },
    ],
    detailFor,
    stackFor,
    numberOf: (prUrl) => Number(String(prUrl).split("/").pop()),
  };
})();
