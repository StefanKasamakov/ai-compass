# AI Compass

A plain-English map of AI models, MCP servers and agent skills, kept fresh by an agent.

**Live:** https://stefankasamakov.github.io/ai-compass/

- **Model picker**: tell it the job, get the model (Claude, GPT-6, Gemini, open-weight)
- **MCP guide + config generator**: exact setup for Claude Code, Claude Desktop, claude.ai, ChatGPT, Codex, Cursor, VS Code, Gemini CLI
- **Skills**: what `SKILL.md` is, how to install, a curated list
- **GitHub 101**: read a repo, judge if it's safe, install from it
- **News**: official blogs, agent releases, Hacker News, summarized by Claude
- **Leaderboard**: vote for tools with 👍 on their GitHub issue, earn points

## How it stays fresh

`.github/workflows/agent.yml` runs every 6 hours:

| Step | Script | Writes |
|---|---|---|
| GitHub stars, weekly growth, releases | `agent/update.mjs` | `data/github.json`, `data/history.json` |
| New repos tagged MCP / skills / Claude Code / Codex | `agent/update.mjs` | `data/trending.json` |
| News + Claude summaries | `agent/update.mjs` | `data/news.json` |
| Votes and points | `agent/update.mjs` | `data/leaderboard.json`, `data/votes.json` |
| Daily: model lineup vs OpenRouter catalog, **opens a PR** | `agent/models-watch.mjs` | `data/models.json` |

Claude features need an `ANTHROPIC_API_KEY` repo secret. Without it, everything else still runs.

## Points

+1 per 👍 vote · +10 per accepted tool suggestion (issue labeled `submission` + `accepted`) · +5 per merged PR.

## Editing

Curated content is plain JSON in `data/`: `models.json`, `tasks.json`, `tools.json`. No build step: `python -m http.server` and open http://localhost:8000.

Design system: `design-system/ai-compass/MASTER.md` (generated with [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)).
