# Launch kit

Link: https://stefankasamakov.github.io/ai-compass/
Share image: assets/og.png (shows automatically when you paste the link).

## Before posting
1. Google Search Console: add the site, submit `sitemap.xml`.
2. Optional: a custom domain (GitHub repo > Settings > Pages > Custom domain). Update the URLs in the HTML meta tags, sitemap.xml and robots.txt if you do.
3. Rotate the Gemini test key, then `gh secret set GEMINI_API_KEY --repo StefanKasamakov/ai-compass`.

## Show HN (news.ycombinator.com/submit)
Title: Show HN: AI Compass – which AI model and tool to use, in plain English

Text:
I kept getting asked "which AI should I use for X?" and "what is this MCP / skills thing?" by people who don't follow AI daily. Existing directories list thousands of repos with no explanation, so I built a guide instead.
- Pick a task and what matters (best, value, free, private) and it names one model, where to use it and what it costs.
- 150+ tools (apps, skills, MCP connectors) explained with "use it to" examples and step-by-step setup, filterable by goal and skill level.
- Benchmarks from independent sources where vendors' own numbers aren't comparable.
It's a static site; a GitHub Action refreshes stars, installs, news and new repos every 6 hours and uses an LLM to write the plain-English explanations. Feedback on wrong info is very welcome.

## Reddit (r/ClaudeAI, r/ChatGPT, r/LocalLLaMA, r/artificial — check each sub's self-promo rules)
Title: I made a plain-English guide to which AI model and tools to use (free, no sign-up)

Body:
Every week there's a new model and 50 new "must-have" GitHub repos, and most explanations assume you already know what MCP or a skill is. So I built AI Compass:
- Tell it what you want to do (write, research, images, code, keep data private...) and it recommends one model, with where to use it and the cost.
- A tool finder with 150+ apps, skills and connectors, each with what it's for and how to start, filterable by "No coding / Some setup / For developers".
- Guides for MCP, skills and "is this GitHub project safe?".
Updated automatically every few hours. What's missing or wrong?

## LinkedIn / Facebook
Most people I talk to use one AI app and have no idea which model is best for what, or what all the new tools actually do. I built a free guide that answers exactly that, in plain English: pick a task, get one clear recommendation, and step-by-step setup for 150+ tools. No sign-up.
https://stefankasamakov.github.io/ai-compass/

## Where else
- Newsletters that feature tools: TLDR AI, Ben's Bites, The Rundown (submission forms on their sites).
- Directories: Product Hunt (launch on a Tuesday–Thursday), There's An AI For That, Futurepedia.
- Awesome lists: open a PR adding the site to awesome-claude-code / awesome-mcp-servers "resources" sections, if they accept guides.
