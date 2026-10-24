# Mergiato

**Your PRs in one window, not seven tabs.**

Mergiato is a fast desktop app for GitHub pull requests: the ones you ship and the ones you review. Your inbox, CI checks, stacked PRs, diffs of any size, code review threads, previews and the merge button sit side by side. It signs in through the GitHub CLI you already use, so there's no token to paste and nothing for your org to approve.

**[mergiato.com](https://mergiato.com)** · [Try the live demo](https://mergiato.com/#demo) · [Features](https://mergiato.com/#features) · [FAQ](https://mergiato.com/#faq)

## Download

Mergiato 0.3.6 · [all releases](https://github.com/alex-parra/mergiato-pull-request-app/releases)

- **Mac** (Apple silicon or Intel): [Mergiato_0.3.6_universal.dmg](https://github.com/alex-parra/mergiato-pull-request-app/releases/download/v0.3.6/Mergiato_0.3.6_universal.dmg)

Open the `.dmg` and drag Mergiato to Applications. Mergiato is in beta and free for now. Installed copies update themselves.

## First open

Open Mergiato from Applications. It is signed with an Apple Developer ID and notarized by Apple. If macOS asks whether to open an app downloaded from the internet, click **Open**. No Privacy & Security override is needed for the current release.

## What it does

- **CI checks:** each job's latest run, its state and its time, grouped by workflow. Re-run the failed jobs, all of them, or one, from the PR.
- **Stacked PRs:** Graphite stacks, GitHub's native stacks and plain branch chains. **Option ↑ / ↓** moves within the stack; **Option Shift ↑ / ↓** follows sidebar order. One Merge button follows the repo's rules: Graphite's merge queue, GitHub's merge queue or its merge methods.
- **Vercel deployments:** preview state and links per project, with deploy and redeploy from the PR. After merging, follow production and custom-environment deployments, including building, ready, failed and replaced states.
- **Terminal and optional AI:** shells docked under each PR, in its local clone, with sessions kept running while you browse other PRs. With Claude Code installed, start a docked review or draft a PR description for you to check before saving.
- **Diffs of any size:** every file GitHub has, up to 3,000, drawn only near your view. A 914-file PR draws its first screen in 0.2 seconds.
- **Code review:** comment on a line or a range, reply, react and resolve. Post comments individually or collect them in a pending review, then submit with a comment, approval or request for changes. Insert suggested changes from selected lines. Unsent editor drafts stay on this device across restarts and updates, with recovery for failed comment and reply sends.
- **Inbox:** your PRs and the reviews waiting on you, in two lists that refresh every 30 seconds, with check, review and PR state on every row. Unread markers, recent PRs and a configurable Dock badge help you find what needs attention. Open any PR by link, `owner/repo#123` or `#123`.
- **Quick-action cards:** right-click a sidebar or stack row, or press Space on a focused row, to inspect reviews, checks and merge readiness and act without opening the PR.
- **Keyboard navigation:** **⌘K** opens commands and recent PRs; **⌘P** in Changes finds a file by path. **⌘/** lists all shortcuts.
- **Reading preferences:** unified or split diffs, a file tree or list, adjustable code and comment text sizes, optional test-file folding, and six themes.
- **Close and quit protection:** optional **⌘Q** confirmation in Settings, off by default. Closing a running Claude terminal tab with **⌘W** still asks for a second press.

Everything lands on GitHub as your own account, so your team doesn't have to switch. [See every feature →](https://mergiato.com/#features)

## Coming in the next release

- **PR description reactions:** view GitHub emoji reaction counts and add or remove your own reactions directly on the description. The picker sits beside existing reactions, with a standalone button when there are none. Failed changes roll back and show an error.

## Security and privacy

Mergiato drives the tools you already trust, on your computer: `gh`, `git` and, if you use it, `vercel`. Every request goes straight from your machine to GitHub with your own access. There's no GitHub App or OAuth grant, Mergiato stores no tokens, and it has no servers, no account and no analytics. [More on security →](https://mergiato.com/#security)

## Requirements

- macOS on Apple silicon or Intel (one universal download).
- The [GitHub CLI](https://cli.github.com), signed in: `brew install gh`, then `gh auth login`.
- Optional: the Vercel CLI, for preview deployments. No local clone needed, except for the docked terminal.

## FAQ

**Is it free?** Yes, while in beta, with every feature. Paid plans may come later, likely a one-time license, and early users will hear first.

**Does my team need it too?** No. Everything you do lands on GitHub as usual, so it works for one person on a team of a hundred.

**Does it work with Graphite?** Yes. It shows Graphite stacks and the merge queue, merges through the queue, and links each PR to its Graphite page.

**How is it different from GitHub Desktop?** GitHub Desktop is a git client for commits and branches. Mergiato is for the pull request side: inbox, reviews, checks, stacks and merges. They work side by side.

[All questions →](https://mergiato.com/#faq)

## Feedback

Found a bug or missing something? [Open an issue](https://github.com/alex-parra/mergiato-pull-request-app/issues). In a beta, your bug report is the roadmap.
