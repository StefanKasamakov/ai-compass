// Всички данни на сайта. Нов модел или скил = нов ред тук, нищо друго.
// Цени: $ за 1M токена (вход / изход), API. Проверено към UPDATED.
const UPDATED = "29.09.2026";

const PROVIDERS = {
  anthropic: { name: "Claude", org: "Anthropic", app: "claude.ai" },
  openai: { name: "ChatGPT", org: "OpenAI", app: "chatgpt.com" },
  google: { name: "Gemini", org: "Google", app: "gemini.google.com" },
  open: { name: "Отворени", org: "open-weight", app: "локално / OpenRouter" },
};

const MODELS = [
  // Anthropic
  { id: "fable", p: "anthropic", name: "Claude Fable 5.1", tier: "Флагман", best: "Най-трудните задачи: дълга агентна работа, наука, сложен анализ. Бавен и скъп.", price: "$10 / $50", ctx: "1M" },
  { id: "opus", p: "anthropic", name: "Claude Opus 5.5", tier: "Основен", best: "Препоръчителният избор по подразбиране. Програмиране (Claude Code), дълги задачи, документи.", price: "$4 / $20", ctx: "1M" },
  { id: "sonnet", p: "anthropic", name: "Claude Sonnet 5.5", tier: "Баланс", best: "Бърз и умен: писане, ежедневна работа, приложения с много заявки.", price: "$2 / $10", ctx: "1M" },
  { id: "haiku", p: "anthropic", name: "Claude Haiku 4.5", tier: "Бърз", best: "Масови и прости задачи: класификация, извличане на данни, чатботове.", price: "$1 / $5", ctx: "200K" },
  { id: "mythos", p: "anthropic", name: "Claude Mythos 5.1", tier: "Ограничен", best: "Същият модел като Fable 5.1 с други предпазни механизми, за киберсигурност и науки за живота. Само за одобрени организации.", price: "$10 / $50", ctx: "1M" },
  // OpenAI
  { id: "astra", p: "openai", name: "GPT-6 Astra", tier: "Флагман", best: "Най-силният модел на OpenAI: код, работа с компютър и браузър, наука, професионална работа.", price: "$10 / $50", ctx: "1.05M" },
  { id: "sol", p: "openai", name: "GPT-6 Sol", tier: "Баланс", best: "Силен и достъпен: сложна професионална работа на разумна цена.", price: "$2 / $10", ctx: "1.05M" },
  { id: "luna", p: "openai", name: "GPT-6 Luna", tier: "Бърз", best: "Изключително евтин: рутинни задачи и голям обем.", price: "$0.10 / $0.50", ctx: "1.05M" },
  { id: "gptimage", p: "openai", name: "GPT Image 2.5", tier: "Картинки", best: "Генериране и редакция на изображения в ChatGPT, включително рисунка → картинка (Sketch).", price: "в ChatGPT", ctx: "—" },
  // Google
  { id: "gpro", p: "google", name: "Gemini 3.1 Pro", tier: "Флагман", best: "Сложни задачи и мултимодалност (текст, снимки, видео, аудио наведнъж).", price: "$2 / $12", ctx: "1M" },
  { id: "gflash", p: "google", name: "Gemini 3.8 Flash", tier: "Баланс", best: "Най-умният Flash: код, агенти, бизнес процеси. Много добро съотношение цена/качество.", price: "$0.75 / $3.75", ctx: "1M" },
  { id: "glite", p: "google", name: "Gemini 3.5 Flash-Lite", tier: "Бърз", best: "Най-евтиният и бърз Gemini за голям обем.", price: "$0.30 / $2.50", ctx: "1M" },
  { id: "nano", p: "google", name: "Nano Banana Pro / 2", tier: "Картинки", best: "Изображения и редакция на снимки. Pro дава 4K и прецизен текст в картинката.", price: "~$0.13 / снимка", ctx: "—" },
  { id: "veo", p: "google", name: "Veo 3.1", tier: "Видео", best: "Кинематографично видео със синхронизиран звук.", price: "$0.05–0.60 / сек", ctx: "—" },
  { id: "omni", p: "google", name: "Gemini Omni Flash", tier: "Видео", best: "Бързо генериране и редактиране на видео в разговор.", price: "API", ctx: "—" },
  { id: "live", p: "google", name: "Gemini 3.8 Live", tier: "Глас", best: "Разговор с глас в реално време, гласови асистенти.", price: "API", ctx: "—" },
  { id: "lyria", p: "google", name: "Lyria 3.5", tier: "Музика", best: "Цели песни със структура (куплет, припев).", price: "API", ctx: "—" },
  // Open-weight
  { id: "qwen", p: "open", name: "Qwen3.8 (Max / 27B)", tier: "Отворен", best: "Водещ отворен модел. 27B версията е най-практичната за локален компютър.", price: "безплатно*", ctx: "варира" },
  { id: "glm", p: "open", name: "GLM-5.3", tier: "Отворен", best: "Най-силният отворен модел за програмиране.", price: "безплатно*", ctx: "варира" },
  { id: "deepseek", p: "open", name: "DeepSeek V4 (Pro / Flash)", tier: "Отворен", best: "Почти frontier качество, Flash върви на 2 видеокарти.", price: "безплатно*", ctx: "варира" },
  { id: "kimi", p: "open", name: "Kimi K3", tier: "Отворен", best: "Силен универсален отворен модел, добър за агенти.", price: "безплатно*", ctx: "варира" },
  { id: "mistral", p: "open", name: "Mistral Small 4", tier: "Отворен", best: "Европейски, Apache-2.0, 256K контекст. Удобен за фирмен сървър.", price: "безплатно*", ctx: "256K" },
];

// "Искам да..." → кой модел. first = най-добрият избор, после алтернативи.
const TASKS = [
  { id: "code", icon: "⌨️", label: "Програмирам", picks: [
    ["opus", "По подразбиране в Claude Code. Най-добрият баланс за реален код."],
    ["fable", "Когато Opus засече: огромни рефактори, трудни бъгове."],
    ["astra", "Ако работиш в Codex / ChatGPT екосистемата."],
    ["glm", "Безплатно / локално, когато кодът не може да излиза навън."]] },
  { id: "write", icon: "✍️", label: "Пиша текстове", picks: [
    ["sonnet", "Естествен стил, бърз, евтин. Отличен и на български."],
    ["opus", "За дълги, важни текстове: оферти, договори, статии."],
    ["sol", "Добра алтернатива, ако ползваш ChatGPT."]] },
  { id: "docs", icon: "📄", label: "Анализирам документи", picks: [
    ["opus", "1M токена контекст: цели PDF-и, договори, Excel таблици."],
    ["gpro", "Когато има и видео, аудио или много снимки."],
    ["haiku", "Масово извличане на данни от стотици фактури."]] },
  { id: "research", icon: "🔎", label: "Проучвам тема", picks: [
    ["astra", "Deep research в ChatGPT: сърфира и обобщава сам."],
    ["gpro", "Gemini Deep Research: силен с Google търсене."],
    ["opus", "Research режим в Claude: подробни доклади с източници."]] },
  { id: "image", icon: "🎨", label: "Правя картинки", picks: [
    ["gptimage", "Най-лесно в ChatGPT, добре следва инструкции."],
    ["nano", "Редакция на реални снимки, 4K, текст в картинката."]] },
  { id: "video", icon: "🎬", label: "Правя видео", picks: [
    ["veo", "Най-високо качество, със звук."],
    ["omni", "Бързи итерации и редакция в разговор."]] },
  { id: "voice", icon: "🎙️", label: "Говоря с глас", picks: [
    ["live", "Gemini Live: най-естественият гласов разговор."],
    ["sol", "Гласовият режим в ChatGPT приложението."]] },
  { id: "music", icon: "🎵", label: "Правя музика", picks: [
    ["lyria", "Цели песни от текстово описание."]] },
  { id: "cheap", icon: "💸", label: "Евтино и в голям обем", picks: [
    ["luna", "$0.10 за 1M токена: практически безплатно."],
    ["glite", "Бърз, евтин, 1M контекст."],
    ["haiku", "Най-бързият Claude, надежден за структурирани данни."]] },
  { id: "private", icon: "🔒", label: "Поверително / локално", picks: [
    ["qwen", "Qwen3.8-27B на един работен компютър. Данните не напускат машината."],
    ["mistral", "Европейски, свободен лиценз, за фирмен сървър."],
    ["deepseek", "DeepSeek V4-Flash: по-мощен, изисква 2 видеокарти."]] },
  { id: "agent", icon: "🤖", label: "Агент, който работи сам", picks: [
    ["fable", "Часове самостоятелна работа по сложна задача."],
    ["astra", "Най-добър в управление на компютър и браузър."],
    ["gflash", "Евтини агенти в голям мащаб."]] },
  { id: "chat", icon: "💬", label: "Просто питам неща", picks: [
    ["sonnet", "Безплатният план на claude.ai е достатъчен."],
    ["sol", "ChatGPT: най-много интеграции и приложения."],
    ["gflash", "Gemini: вграден в Google (Gmail, Drive, Android)."]] },
];

// Скилове. plat: "claude" | "codex" | "any" (отворен стандарт, работи навсякъде)
const A = "https://github.com/anthropics/skills/tree/main/skills/";
const O = "https://github.com/openai/skills/tree/main/skills/.curated/";
const SKILLS = [
  // Документи
  { n: "docx", cat: "Документи", plat: "claude", src: "Anthropic", d: "Създава и редактира Word документи с форматиране, таблици и коментари.", url: A + "docx" },
  { n: "xlsx", cat: "Документи", plat: "claude", src: "Anthropic", d: "Excel: формули, таблици, графики, анализ на данни.", url: A + "xlsx" },
  { n: "pptx", cat: "Документи", plat: "claude", src: "Anthropic", d: "PowerPoint презентации от нулата или по шаблон.", url: A + "pptx" },
  { n: "pdf", cat: "Документи", plat: "claude", src: "Anthropic", d: "Чете, попълва формуляри, слива и разделя PDF файлове.", url: A + "pdf" },
  { n: "doc-coauthoring", cat: "Документи", plat: "claude", src: "Anthropic", d: "Пише документ заедно с теб, секция по секция.", url: A + "doc-coauthoring" },
  { n: "internal-comms", cat: "Документи", plat: "claude", src: "Anthropic", d: "Вътрешни съобщения, отчети и бюлетини във фирмен стил.", url: A + "internal-comms" },
  { n: "jupyter-notebook", cat: "Документи", plat: "codex", src: "OpenAI", d: "Работа с Jupyter тетрадки за анализ на данни.", url: O + "jupyter-notebook" },
  // Дизайн
  { n: "frontend-design", cat: "Дизайн", plat: "claude", src: "Anthropic", d: "Сайтове и интерфейси, които не изглеждат като шаблонен AI дизайн.", url: A + "frontend-design" },
  { n: "canvas-design", cat: "Дизайн", plat: "claude", src: "Anthropic", d: "Плакати и визуални материали като PNG/PDF.", url: A + "canvas-design" },
  { n: "algorithmic-art", cat: "Дизайн", plat: "claude", src: "Anthropic", d: "Генеративно изкуство с код (p5.js).", url: A + "algorithmic-art" },
  { n: "theme-factory", cat: "Дизайн", plat: "claude", src: "Anthropic", d: "Готови цветови и шрифтови теми за документи и слайдове.", url: A + "theme-factory" },
  { n: "brand-guidelines", cat: "Дизайн", plat: "claude", src: "Anthropic", d: "Прилага бранд цветове и шрифтове. Шаблон за твоя бранд.", url: A + "brand-guidelines" },
  { n: "slack-gif-creator", cat: "Дизайн", plat: "claude", src: "Anthropic", d: "Анимирани GIF-ове, оптимизирани за Slack.", url: A + "slack-gif-creator" },
  { n: "figma", cat: "Дизайн", plat: "codex", src: "OpenAI", d: "Превръща Figma дизайни в код и обратно (вече като плъгин).", url: "https://github.com/openai/plugins/tree/main/plugins/figma" },
  // Разработка
  { n: "web-artifacts-builder", cat: "Разработка", plat: "claude", src: "Anthropic", d: "По-сложни уеб приложения (React, Tailwind) като един HTML файл.", url: A + "web-artifacts-builder" },
  { n: "webapp-testing", cat: "Разработка", plat: "claude", src: "Anthropic", d: "Тества уеб приложение в браузър с Playwright.", url: A + "webapp-testing" },
  { n: "mcp-builder", cat: "Разработка", plat: "claude", src: "Anthropic", d: "Създава MCP сървъри, т.е. свързва AI с твои системи.", url: A + "mcp-builder" },
  { n: "claude-api", cat: "Разработка", plat: "claude", src: "Anthropic", d: "Правилна употреба на Claude API: модели, цени, кеширане.", url: A + "claude-api" },
  { n: "playwright", cat: "Разработка", plat: "codex", src: "OpenAI", d: "Автоматизира браузър: клика, попълва, прави скрийншоти.", url: O + "playwright" },
  { n: "gh-fix-ci", cat: "Разработка", plat: "codex", src: "OpenAI", d: "Намира и оправя счупени GitHub Actions проверки.", url: O + "gh-fix-ci" },
  { n: "gh-address-comments", cat: "Разработка", plat: "codex", src: "OpenAI", d: "Отговаря на review коментари в pull request.", url: O + "gh-address-comments" },
  { n: "vercel / netlify / cloudflare-deploy", cat: "Разработка", plat: "codex", src: "OpenAI", d: "Качва сайта ти онлайн с една команда.", url: O + "vercel-deploy" },
  { n: "sentry", cat: "Разработка", plat: "codex", src: "OpenAI", d: "Чете грешки от Sentry и предлага поправки.", url: O + "sentry" },
  // Сигурност
  { n: "security-threat-model", cat: "Сигурност", plat: "codex", src: "OpenAI", d: "Прави модел на заплахите за проекта ти.", url: O + "security-threat-model" },
  { n: "security-best-practices", cat: "Сигурност", plat: "codex", src: "OpenAI", d: "Проверява кода за типични дупки в сигурността.", url: O + "security-best-practices" },
  // Продуктивност
  { n: "notion", cat: "Продуктивност", plat: "codex", src: "OpenAI", d: "Бележки от срещи, проучвания и спецификации в Notion.", url: "https://github.com/openai/plugins/tree/main/plugins/notion" },
  { n: "transcribe / speech", cat: "Продуктивност", plat: "codex", src: "OpenAI", d: "Аудио → текст и текст → глас.", url: O + "transcribe" },
  { n: "skill-creator", cat: "Продуктивност", plat: "any", src: "Anthropic", d: "Скил, който прави скилове. Започни оттук за собствен скил.", url: A + "skill-creator" },
  // Методология (цели колекции)
  { n: "superpowers", cat: "Колекции", plat: "any", src: "obra", d: "Най-популярната колекция (~290k★): brainstorm → план → TDD → debug. Кара агента да работи като сениор.", url: "https://github.com/obra/superpowers" },
  { n: "agent-skills", cat: "Колекции", plat: "any", src: "Addy Osmani", d: "Производствени инженерни навици: spec, план, тестове, review, пускане.", url: "https://github.com/addyosmani/agent-skills" },
  { n: "anthropics/skills", cat: "Колекции", plat: "claude", src: "Anthropic", d: "Официалното хранилище, от което идват горните Anthropic скилове.", url: "https://github.com/anthropics/skills" },
  { n: "openai/plugins", cat: "Колекции", plat: "codex", src: "OpenAI", d: "Новото официално място за Codex скилове (openai/skills вече е остаряло).", url: "https://github.com/openai/plugins" },
];

const DIRECTORIES = [
  { n: "SkillsMP", url: "https://skillsmp.com/", d: "Милиони скилове, събрани от публични GitHub хранилища. Търсачка." },
  { n: "MCP Market", url: "https://mcpmarket.com/tools/skills", d: "Скилове за Claude, ChatGPT и Codex, с възможност за продажба." },
  { n: "Claude Marketplaces", url: "https://claudemarketplaces.com/skills", d: "23 000+ скила за Claude Code." },
  { n: "SkillsClaude", url: "https://skillsclaude.org/skills", d: "7 000+ скила с оценка за доверие." },
  { n: "awesome-claude-skills", url: "https://github.com/ComposioHQ/awesome-claude-skills", d: "Ръчно подбран списък в GitHub." },
  { n: "agentskills.io", url: "https://agentskills.io", d: "Отвореният стандарт SKILL.md: как работи и кой го поддържа." },
];
