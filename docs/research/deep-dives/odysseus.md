# Deep dive: Odysseus

- **Status:** Code-level review, 2026-06-01
- **Repo:** [pewdiepie-archdaemon/odysseus](https://github.com/pewdiepie-archdaemon/odysseus) (~21.8k★, approx., gh, 2026-06-01)
- **Method:** Shallow clone + sweep of `routes/`, `services/`, `src/`, `mcp_servers/`, `companion/`, `ROADMAP.md`, deps. **Feeds the [`../feature-matrix.md`](../feature-matrix.md) update** (the older matrix Odysseus column was README/intent-level). Findings are _code-present_ — observed in a days-old repo, not maturity- or stability-verified.
- **Role for Telemachus:** the **parity baseline** (ring 1). The other deep dives are feature-mining sources (ring 3 imports).

## Architecture

Python monolith — **FastAPI + SQLite (SQLAlchemy) + ChromaDB/fastembed**, with subprocess-managed model serving. Frontend is vanilla JS/HTML/CSS. **Appears built on OpenCode** (`anomalyco/opencode`) as the underlying agent loop (observed in the repo, not independently confirmed). ~40 route modules; the real surface is ~3× the 12-bullet README.

## Feature inventory

### Chat & conversation

- Multi-model streaming chat (vLLM/llama.cpp/Ollama/OpenRouter/OpenAI/Anthropic/Gemini/Groq/xAI/DeepSeek via OpenAI-compatible API; dynamic endpoint discovery)
- Persistent sessions + history, auto-titling, duplicate/export, session forking
- Blind Compare (A/B two models, randomized, voting + synthesis)
- Context compaction (auto-summarize old messages near context limit)
- Thinking/reasoning-model support (hides thinking, shows answer)
- Mid-conversation context injection (web search, docs, memories, notes, research)

### Agent loop & tools

- Multi-round streaming agent loop (parse tool blocks → execute → re-prompt); 60s/10K-char tool limits
- Tool schema discovery/registration/validation; per-user tool blocking
- Unified executor (built-ins, shell, Python, document/email/calendar ops)
- Tool security: prompt-injection detection on untrusted context, untrusted-context sandboxing

### Built-in actions & automations

- Cron-like scheduled/background tasks (croniter; one-off/daily/weekly/monthly/cron)
- 40+ built-in actions (tidy sessions/docs/research, consolidate memory, SSH/local scripts, email summarize, event extraction, skill test/audit, daily brief, urgency check)

### Models & serving / Cookbook

- Hardware detection (CPU/GPU NVIDIA/AMD/Intel/Apple Silicon, RAM → VRAM budgets)
- Model recommendations (hardware-fit ranking of GGUF/FP8/AWQ via `llmfit`; vRAM/speed/quality scoring)
- Model download (HuggingFace GGUF/AWQ/FP8, resume, tmux background jobs)
- Model serving (launch vLLM/llama.cpp/Ollama/SGLang as background services; port probing, preflight)
- Serve presets, cache scanning, endpoint management, provider auto-probing/health checks

### Memory & RAG

- Persistent memory: vector + BM25 hybrid (ChromaDB + fastembed/ONNX, local/private)
- Auto memory extraction (from chat/notes/emails/docs) + LLM-driven consolidation/dedupe
- Personal-docs RAG (chunk + top-K retrieval), import/export

### Deep research

- Iterative Think→Search→Extract→Synthesize loop; auto research plan + query gen; goal-based extraction
- Multi-provider search (SearXNG/Google PSE/Brave/Tavily/Serper/DuckDuckGo, fallback chain)
- Visual HTML+Markdown report with source attribution; background tasks (progress/cancel/partial export)

### Email

- Multi-account IMAP/SMTP (per-account routing, folder browse, UID ops, attachment/charset handling)
- AI triage: auto-summarize, draft replies, urgency detection, boundaries, auto-tag, auto-spam
- CalDAV-aware (extract events from email), notifications (ntfy/browser/email), signatures, bulk ops
- Exposed to agent via bundled email MCP server

### Calendar & contacts

- Local SQLite calendar, multi-calendar + colors; CalDAV pull (Radicale/Nextcloud/Apple/Fastmail)
- ICS import/export with RRULE; event CRUD/search; email→event extraction + classification
- Contacts via CardDAV (read Radicale), fuzzy search, CSV/JSON import/export

### Documents & editor

- Multi-tab editor (markdown/HTML/CSV/plaintext, syntax highlighting, autosave drafts) + version history
- AI editing (rewrites, format, summaries); sharing URLs
- PDF upload/extract (PyMuPDF) + **PDF AcroForm form-filling**; Office/.epub via `markitdown`

### Gallery & images

- Image gallery (organize/tag/dedupe via SHA-256), EXIF extraction
- Image generation (local FLUX/SD via image-gen MCP), browser canvas editor + inpainting

### Skills

- Markdown skills framework (procedures/pitfalls/verification, categorized)
- Auto-extraction from successful runs (confidence scoring), auditing, import/export. **No public registry.**

### MCP

- MCP client/manager (stdio + SSE, auto-discover, schema translation, per-server disabled tools)
- Bundled servers: **email, memory, RAG, image-gen**; third-party (Playwright, custom)

### Tasks, shell, voice

- Scheduled task CRUD + execution (LLM/action/research), housekeeping, notifications
- Shell exec (bash/sh/zsh, PTY on POSIX, streaming; Windows pipe fallback), SSH remote, tmux for cookbook
- STT (faster-whisper local / OpenAI / Web Speech); TTS (Kokoro-82M local / API / Web Speech) + disk cache

### Auth, security, sync

- Auth (bcrypt) + optional 2FA (TOTP); multi-user + roles; single-user mode; rate limiting; scoped API tokens
- Full data export/import (JSON); Vaultwarden/Bitwarden bridge (read metadata); settings backup
- **Companion**: read-only LAN bridge API (capability/endpoint discovery, health check)

### Mobile, theming, integrations, extras

- Responsive + PWA (installable, partial offline), theme system (dark/light, color/font pickers)
- Webhooks (HMAC-SHA256 signed); integration presets (Miniflux/Gitea/Linkding/Home Assistant/ntfy/Vaultwarden/FreshRSS); generic authenticated API calls; secret encryption at rest
- Session notes/tagging, emoji picker, diagnostics, DB cleanup/retention, admin tools

## Roadmap (from ROADMAP.md)

No major unshipped features flagged — mostly reliability (bug fixes, integration audit, cross-platform Cookbook, hardware-keyed model presets, UI error feedback). Read as a broad, fast-moving self-host workspace: code-present across a wide surface, but a days-old repo (maturity/stability not verified).

## Install & provisioning — the "Cookbook"

Added 2026-06-02 from a code-level fetch of the repo (README, Dockerfile, `docker-compose.yml`, `routes/cookbook_routes.py` + `cookbook_helpers.py`, `services/hwfit/`).

- **App install:** always `git clone` + one of — **`docker compose up -d --build`** (canonical; app on `:7000`, bound `127.0.0.1`), native `venv`+`pip`+`python setup.py`+uvicorn, or platform scripts (`start-macos.sh`, `launch-windows.ps1`). A `systemd` unit template + `install-service.sh` ship (manual). **No `curl|sh`, no pip package, no Helm.** First run prints a temp admin password to the logs.
- **Prereqs:** Python 3.11+; **`tmux` mandatory** for Cookbook; Docker image (`python:3.12-slim`) adds `build-essential`/`cmake`/`git`/`nodejs`/`tmux`/`gosu`. **GPU drivers/CUDA/ROCm are NOT bundled** — host-provided; GPU passthrough is opt-in via `docker/gpu.{nvidia,amd}.yml` overlays, and CUDA/ROCm _userspace_ is installed via Cookbook→Dependencies (passthrough ≠ a CUDA-enabled build).
- **Runner provisioning = hybrid (managed default, external underneath):** llama.cpp is **built from source** (cmake) lazily, fallback `pip install llama-cpp-python`; **Ollama is port-probed and attached, never owned** (only `ollama serve` if nothing's reachable + CLI present; not auto-installed); vLLM/SGLang are not auto-installed (preflight + install-instructions). Engine + flags are built **client-side** and POSTed; the backend **validates (allowlist) → installs → launches**.
- **Supervision = weak:** each serve/download runs as a **tmux subprocess** (SSH for remote; detached procs on Windows) with log/PID files, **polled via `tmux capture-pane`** + ~18 hardcoded failure-diagnosis regexes. **No auto-restart** (systemd covers only the app).
- **Model download:** `hf` CLI in tmux (hf_transfer→plain fallback for clean resume), token encrypted at rest.
- **Hardware detect + fit scoring:** `services/hwfit/` — nvidia-smi/sysfs/Metal probes + GPU-bandwidth/quant tables + a curated `hf_models.json`. **Pure, portable logic** (the standout to reimplement in TS).
- **Deployment:** single `Dockerfile`; `docker-compose.yml` bundles app + ChromaDB + SearXNG + ntfy but **NOT any runner** — it reaches a host Ollama via `host.docker.internal` and persists Cookbook-installed runners via volumes. So Odysseus **separates app-deploy from runner-provisioning** (provisioning is an in-app managed feature, not the compose).
- **Serving boundary:** no in-process manager/daemon — the app shells out (tmux/SSH) to independent OS processes and talks to them purely over **HTTP (OpenAI-compatible)** via an endpoint resolver; served models auto-register as endpoint rows. Telemachus mirrors this as **external-first + an additive Cookbook rung** ([roadmap](../../specs/roadmap.md), [ADR-006](../../decisions/006-model-llm-layer.md)).

## Capabilities needing first-class TS re-engineering (no Python, no wrappers)

These are the non-trivial ports for an all-TS rebuild (mapping → TS strategy belongs in the parity inventory, not here):

- **Local embeddings** (fastembed/ONNX) → `transformers.js` / `onnxruntime-node`
- **STT** (faster-whisper) → whisper via `transformers.js` / whisper.cpp WASM, or external API
- **TTS** (Kokoro) → `kokoro-js` (ONNX) / Web Speech, or external API
- **Hardware-fit scoring** (`llmfit`) → reimplement algorithm + GPU tables in TS
- **Model serving** (vLLM/llama.cpp/Ollama) → external binaries managed over HTTP from Node (not Python)
- **Doc extraction** (markitdown, PyMuPDF + AcroForms) → `mammoth`/`xlsx`/`pdf.js` (gaps to accept)
- **CalDAV/CardDAV** → `tsdav`; **IMAP/SMTP** → `imapflow`/`nodemailer`/`mailparser`
- **Face recognition** (services/faces) → `human`/`face-api.js` (weaker — reconsider/skip)
