# Mergiato

**Your PRs in one window, not seven tabs.**

Mergiato is a fast desktop app for GitHub pull requests and code review. Your inbox, CI checks, stacked PRs, diffs of any size, review threads, previews and the merge button sit side by side. It runs on the GitHub CLI you already use, so your org has nothing to approve.

**[mergiato.com](https://mergiato.com)** · [Try the live demo](https://mergiato.com/#demo) · [Features](https://mergiato.com/#features) · [FAQ](https://mergiato.com/#faq)

## Download

Get the latest `.dmg` from [Releases](https://github.com/alex-parra/mergiato-pull-request-app/releases/latest) (Apple silicon), open it and drag Mergiato to Applications.

Mergiato is in beta and free for now. Installed copies update themselves.

## First open

Mergiato isn't signed with an Apple Developer ID yet, so macOS can't verify it on the first open. Allow it once: System Settings → Privacy & Security → **Open Anyway**. Updates don't ask again.

## What it does

- **Inbox:** your PRs and the reviews waiting on you, in two lists that refresh every 30 seconds, with check and review state on every row. Open any PR by link, `owner/repo#123` or `#123`.
- **Code review:** comment on a line or a range, reply, react and resolve. Approve, approve with a comment, or request changes. Drafts are kept per line.
- **CI checks:** each job's latest run, its state and its time, grouped by workflow. Re-run the failed jobs, all of them, or one, from the PR.
- **Diffs of any size:** every file GitHub has, up to 3,000, drawn only near your view. A 914-file PR draws its first screen in 0.2 seconds.
- **Stacked PRs:** Graphite stacks, GitHub's native stacks and plain branch chains, with ↑ ↓ to move along them. One Merge button follows the repo's rules: Graphite's merge queue, GitHub's merge queue or its merge methods.
- **Previews:** each Vercel project's deployment, with deploy and redeploy from the PR.
- **Terminal:** shells docked under each PR, in its local clone.

Everything lands on GitHub as your own account, so your team doesn't have to switch. [See every feature →](https://mergiato.com/#features)

## Security and privacy

Mergiato drives the tools you already trust, on your Mac: `gh`, `git` and, if you use it, `vercel`. Every request goes straight from your machine to GitHub with your own access. There's no GitHub App or OAuth grant, Mergiato stores no tokens, and it has no servers, no account and no analytics. [More on security →](https://mergiato.com/#security)

## Requirements

- macOS on Apple silicon. Intel Macs are next.
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
