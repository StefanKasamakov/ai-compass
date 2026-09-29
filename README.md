# AI Compass

A plain-English map of AI models, MCP servers and agent skills, kept fresh by an agent.

**Live:** https://stefankasamakov.github.io/ai-compass/

- **Repo Explainer**: ruflo, OmniRoute, LiteLLM, Ollama… each popular AI repo in plain English (what, when, caveats, alternatives). Ask for any repo via an issue
- **Model picker + benchmarks**: tell it the job, get the model; heatmap of 9 benchmarks, per-skill rankings, smarts-vs-price chart (`data/benchmarks.json`, every number linked to its source)
- **MCP guide + config generator**: exact setup for Claude Code, Claude Desktop, claude.ai, ChatGPT, Codex, Cursor, VS Code, Gemini CLI
- **Skills**: what `SKILL.md` is, how to install, a curated list
- **GitHub 101**: read a repo, judge if it's safe, install from it
- **News**: official blogs, agent releases, Hacker News, summarized by AI (Gemini or Claude)
- **Leaderboard**: vote for tools with 👍 on their GitHub issue, earn points

## How it stays fresh

`.github/workflows/agent.yml` runs every 6 hours:

| Step | Script | Writes |
|---|---|---|
| GitHub stars, weekly growth, releases | `agent/update.mjs` | `data/github.json`, `data/history.json` |
| New repos tagged MCP / skills / Claude Code / Codex | `agent/update.mjs` | `data/trending.json` |
| News + AI summaries | `agent/update.mjs` | `data/news.json` |
| Repo explanations (curated, trending, requested via `explain` issues) | `agent/update.mjs` | `data/explain.json` |
| Votes and points | `agent/update.mjs` | `data/leaderboard.json`, `data/votes.json` |
| Daily: model lineup vs OpenRouter catalog, **opens a PR** | `agent/models-watch.mjs` | `data/models.json` |

AI steps (news summaries, repo explanations, model watch) need **one** repo secret: `GEMINI_API_KEY` (used first) or `ANTHROPIC_API_KEY`. See `agent/llm.mjs`. Without a key, everything else still runs.

## Points

+1 per 👍 vote · +2 per repo explained on request · +10 per accepted tool suggestion (issue labeled `submission` + `accepted`) · +5 per merged PR.

## Editing

Curated content is plain JSON in `data/`: `models.json`, `tasks.json`, `tools.json`, `repos.json` (explainer categories and seed repos). No build step: `python -m http.server` and open http://localhost:8000.

Design system: `design-system/ai-compass/MASTER.md` (generated with [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)).
