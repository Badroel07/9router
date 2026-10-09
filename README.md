<div align="center">
  <img src="./images/9router.png?1" alt="67Router Dashboard" width="800"/>
  
  # 67Router - High-Performance AI Router, Token Saver & Agent Skills Hub

  **Enhanced & Hardened Fork of 9Router • Never stop coding. Save 20-40% tokens with RTK + auto-fallback to FREE & cheap AI models.**

  **Connect All AI Code Tools (Claude Code, Cursor, Antigravity, Copilot, Codex, Gemini, OpenCode, Cline, OpenClaw...) to 40+ AI Providers & 100+ Models.**

  [![npm](https://img.shields.io/npm/v/67router.svg)](https://www.npmjs.com/package/67router)
  [![Downloads](https://img.shields.io/npm/dm/67router.svg)](https://www.npmjs.com/package/67router)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![GitHub Repository](https://img.shields.io/badge/GitHub-Badroel07%2F9router-orange?logo=github)](https://github.com/Badroel07/9router)
  [![Upstream](https://img.shields.io/badge/Upstream-decolua%2F9router-lightgrey?logo=github)](https://github.com/decolua/9router)

  [🚀 Quick Start](#-quick-start) • [⚡ 67Router vs 9Router](#-67router-vs-upstream-9router) • [💡 Features](#-key-features) • [📖 Setup Guide](#-setup-guide) • [🌐 Website](https://9router.com)

  [🇮🇩 Bahasa Indonesia](./i18n/README.id-ID.md) • [🇧🇷 Português (Brasil)](./i18n/README.pt-BR.md) • [🇻🇳 Tiếng Việt](./i18n/README.vi.md) • [🇨🇳 中文](./i18n/README.zh-CN.md) • [🇯🇵 日本語](./i18n/README.ja-JP.md) • [🇷🇺 Русский](./i18n/README.ru.md) • [🇹🇭 ไทย](./i18n/README.th.md) • [🇮🇷 فارسی](./i18n/README.fa_IR.md) • [🇪🇸 Español](./i18n/README.es.md) • [🇫🇷 Français](./i18n/README.fr.md)

</div>

---

## ⚡ 67Router vs Upstream 9Router

**67Router** is an enhanced, security-hardened, and aesthetically re-engineered distribution of **9Router** (`decolua/9router`). It preserves full backwards compatibility with all upstream providers, combos, and routing mechanisms while introducing critical architecture, security, UI, and agent intelligence upgrades:

### 📊 Comparison Matrix

| Feature / Capability | Upstream 9Router (`decolua/9router`) | 67Router (`Badroel07/9router`) |
| :--- | :--- | :--- |
| **Package & CLI Binary** | `9router` | **`67router`** (with dual executable support: both `67router` and `9router` work interchangeably) |
| **Security Audit (`npm audit`)** | ⚠️ Contains `node-forge` vulnerability (**GHSA-86w9-cpqp-85rv**, High Severity) | 🛡️ **0 Vulnerabilities**: Replaced with modern `selfsigned` & native `node:crypto` `X509Certificate` |
| **MITM SSL/TLS Proxy Engine** | Synchronous leaf certificate generation; risk of race conditions under concurrency | ⚡ **Async `sniCallback` + concurrency queue** (`pendingCerts` memoization) for rock-solid stability |
| **Agent Skills & Prompt Sanitization** | Basic token saver filters only | 🤖 **Agent Skills Hub** (`smart_toy`) + **`@antislop-code` Comment Hygiene** (cleans low-value AI comment slop) |
| **OpenCode CLI Integration** | Manual single-model input | 🔄 **Automated "Fetch All Models"**: Auto-detects context window, output limit, and vision modalities into schema |
| **Design System & Aesthetics** | Default light/dark UI | 💎 **Monolithic Architectural Luxury**: Permanent high-contrast dark theme, **Momo Trust Sans** typography, hairline armatures, bronze accents |
| **Header & Sidebar Alignment** | Static header text, variable height offsets | 📐 **Pixel-perfect `h-[69px]` alignment** (0px offset across resolutions), dynamic route title (`PAGE_META`) |
| **Windows & Build Reliability** | Occasional `EPERM` clean failures & `EBUSY` runtime locks | 🪟 Dedicated runtime dir (`~/.67router` / `%APPDATA%\67router`), resilient `EPERM` build cleanup handler |
| **Project Tracking & Memory** | Monolithic `CHANGELOG.md` | 🗂️ **Modular `changelog/arsip-NNN.md`** (reverse chronological, anti-duplication) + `codebase-memory-mcp` graph indexing |

---

### 🔍 Deep Dive: What Makes 67Router Different?

#### 1. 🛡️ Zero-Vulnerability Security Architecture (v1.0.5)
- Upstream 9Router depends on legacy `node-forge` for generating dynamic MITM SSL certificates, which carries a persistent High-Severity vulnerability ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)) without an upstream resolution.
- **67Router completely purges `node-forge`**. Leaf and Root CA generation is refactored to use modern `selfsigned` (leveraging standard Web Crypto API) and Node.js native `crypto.X509Certificate`.
- Implements an asynchronous SNI callback queue in `server.js` with promise memoization (`pendingCerts`), preventing race conditions when handling simultaneous concurrent TLS handshakes.
- **Result:** `npm audit --omit=dev` produces **0 vulnerabilities**.

#### 2. 🤖 Agent Skills & Code Comment Hygiene (`@antislop-code`) (v1.0.3)
- Modern AI models often pollute generated code with useless, repetitive comments (e.g. decorative `// === Helper ===`, `// Step 1: initialize`, or restating obvious keywords).
- 67Router introduces the **Agent Skills** system (`/dashboard/skills` or `/dashboard/token-saver`), integrating **`@antislop-code`** (powered by `miqdadbadjuber/anti-slop`).
- When toggled ON, 67Router injects an intelligent code comment hygiene directive into the system prompt:
  - ❌ Strips out decorative delimiters, obvious restatements, and workflow step narration.
  - ✅ Retains genuine architectural decisions, edge-case workarounds, and security rationale.
  - Keeps code lean, clean, and professional directly out of the router.

#### 3. ⚡ Automated OpenCode Full-Specification Discovery
- Connecting OpenCode in upstream 9Router required manual single-model entry.
- 67Router introduces an automated **Fetch All Models** workflow in both the Dashboard (`OpenCodeToolCard`) and CLI (`67router connect opencode`):
  - Automatically queries the provider's `/v1/models` endpoint via `baseUrl` and `apiKey`.
  - Automatically extracts exact model limits (context window, max output tokens) and multimodal modalities (vision/image support).
  - Populates compliant `opencode.json` configuration structures automatically.
  - Enables instant 1-click selection of primary active models and subagent explorer models.

#### 4. 💎 Monolithic Luxury Architectural Design System
- Built on sharp, architectural geometry (`border-radius: 0px`), obsidian backgrounds (`#080808`, `#141416`), brushed bronze (`#C5A880`), and champagne gold accents.
- Uses **Momo Trust Sans** font globally for superior technical legibility.
- Strict layout discipline: Header and Sidebar brand containers are locked at exactly `h-[69px]`, guaranteeing zero pixel shift or baseline displacement across all screen resolutions.
- Dynamic route header updating (`PAGE_META`) keeps navigation clear and intuitive.

#### 5. 🪟 Robust CLI & Dedicated Runtime Isolation
- Published on npm as **`67router`** with dual-binary links (`67router` and `9router`).
- Isolated user data and SQLite dependencies under `~/.67router` (or `%APPDATA%\67router` on Windows), preventing file lock collisions (`EBUSY`) when updating the global CLI.
- Handles Windows filesystem idiosyncrasies (`EPERM` cleanup handling during builds).

---

## 🤔 Why 67Router?

**Stop wasting money, burning prompt tokens, and hitting provider rate limits:**

- ❌ Subscription quota expires unused every month
- ❌ Rate limits freeze your coding sessions mid-flow
- ❌ Large CLI tool outputs (`git diff`, `grep`, `ls`, logs) burn context tokens fast
- ❌ Expensive separate API bills ($20–$50/month per provider)
- ❌ AI code assistants cluttering code with generic AI slop comments
- ❌ Manual toggling and configuring across fragmented tools

**67Router solves this all in one unified proxy:**

- ✅ **RTK Token Saver** - Auto-compresses `tool_result` payloads, saving 20–40% input tokens per request
- ✅ **Agent Skills (@antislop-code)** - Enforces clean code comment hygiene automatically
- ✅ **Zero Vulnerability MITM** - Enterprise-safe interception with native cryptography
- ✅ **Smart 3-Tier Fallback** - Subscription → Low Cost → Free tiers with 0s downtime
- ✅ **Multi-Account Round-Robin** - Balances load across multiple accounts per provider
- ✅ **Universal Compatibility** - Works with Claude Code, Cursor, Antigravity, OpenCode, Codex, Cline, and any OpenAI/Anthropic client

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                       Your CLI Tools                        │
│   (Claude Code, Cursor, Antigravity, OpenCode, Codex, Cline)│
└──────────────────────────────┬──────────────────────────────┘
                               │ http://localhost:20128/v1
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                   67Router (Smart Core)                     │
│  • RTK Token Compression (saves 20-40% context)             │
│  • Agent Skills (@antislop-code prompt hygiene)             │
│  • Zero-Vulnerability Native Crypto MITM Proxy              │
│  • Format Translation (OpenAI ↔ Claude ↔ Gemini)            │
│  • Quota Tracking & Auto-Token Refresh                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ├─→ [Tier 1: SUBSCRIPTION] Claude Code, Codex, GitHub Copilot
        │   ↓ quota exhausted
        ├─→ [Tier 2: CHEAP] GLM ($0.6/1M), MiniMax ($0.2/1M), Kimi ($9/mo)
        │   ↓ budget limit reached
        └─→ [Tier 3: FREE] Kiro, OpenCode Free, Vertex AI ($300 credits)

Result: Continuous coding, rock-solid security, pristine code quality, minimal cost.
```

---

## ⚡ Quick Start

### 1. Install Globally (npm)

```bash
npm install -g 67router
67router

# Or run directly without global install via npx:
npx 67router
```

> **Note:** The binary alias `9router` is also supported for complete drop-in replacement (`9router`).

🎉 **Dashboard opens automatically at:** `http://localhost:20128`

---

### 2. Connect a FREE Provider (No Credit Card Required)

1. Open Dashboard → **Providers**
2. Connect **Kiro AI** (~50 credits/month free: Claude 4.5 + GLM-5 + MiniMax) or **OpenCode Free** (no authentication required).
3. Connect your API keys or subscriptions for other providers if available.

---

### 3. Configure Your Favorite AI Coding Tool

Point your tool's OpenAI or Anthropic endpoint to 67Router:

```
Endpoint: http://localhost:20128/v1
API Key:  [Copy from 67Router Dashboard -> Endpoint / API Keys]
Model:    kr/claude-sonnet-4.5 (or any configured combo/model)
```

#### Automated CLI Tool Connection:

```bash
# Connect OpenCode automatically with full model discovery
67router connect opencode

# Connect Claude Code
67router connect claude

# Connect Codex CLI
67router connect codex
```

---

### Alternative: Run from Source

```bash
# Clone this repository
git clone https://github.com/Badroel07/9router.git
cd 9router

# Install dependencies
npm install

# Start local development server
npm run dev
# (or specify port): PORT=20128 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run dev
```

For production builds:

```bash
npm run build
PORT=20128 HOSTNAME=0.0.0.0 npm run start
```

Default local endpoints:
- **Web Dashboard**: `http://localhost:20128/dashboard`
- **OpenAI-Compatible API**: `http://localhost:20128/v1`

---

## 🛠️ Supported CLI Tools

67Router bridges any modern coding tool to 40+ providers:

<div align="center">
  <table>
    <tr>
      <td align="center" width="120">
        <img src="./public/providers/claude.png" width="60" alt="Claude Code"/><br/>
        <b>Claude-Code</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/openclaw.png" width="60" alt="OpenClaw"/><br/>
        <b>OpenClaw</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/codex.png" width="60" alt="Codex"/><br/>
        <b>Codex</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/opencode.png" width="60" alt="OpenCode"/><br/>
        <b>OpenCode</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/cursor.png" width="60" alt="Cursor"/><br/>
        <b>Cursor</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/antigravity.png" width="60" alt="Antigravity"/><br/>
        <b>Antigravity</b>
      </td>
    </tr>
    <tr>
      <td align="center" width="120">
        <img src="./public/providers/cline.png" width="60" alt="Cline"/><br/>
        <b>Cline</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/continue.png" width="60" alt="Continue"/><br/>
        <b>Continue</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/droid.png" width="60" alt="Droid"/><br/>
        <b>Droid</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/roo.png" width="60" alt="Roo"/><br/>
        <b>Roo</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/copilot.png" width="60" alt="Copilot"/><br/>
        <b>Copilot</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/kilocode.png" width="60" alt="Kilo Code"/><br/>
        <b>Kilo Code</b>
      </td>
    </tr>
    <tr>
      <td align="center" width="120">
        <img src="./public/providers/opendesign.png" width="60" alt="OpenDesign"/><br/>
        <b>OpenDesign</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/jcode.png" width="60" alt="jcode"/><br/>
        <b>jcode</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/grok-cli.png" width="60" alt="Grok Build"/><br/>
        <b>Grok Build</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/devin-cli.png" width="60" alt="Devin CLI"/><br/>
        <b>Devin CLI</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/deepseek-tui.png" width="60" alt="DeepSeek TUI"/><br/>
        <b>DeepSeek TUI</b>
      </td>
      <td align="center" width="120">
        <img src="./public/providers/qwen.png" width="60" alt="Qwen Code"/><br/>
        <b>Qwen Code</b>
      </td>
    </tr>
  </table>
</div>

---

## 🌐 Supported Providers

### 🔐 OAuth Providers
- **Claude Code** (Anthropic Pro / Max)
- **Codex** (OpenAI Plus / Pro)
- **GitHub Copilot**
- **Cursor IDE**
- **Antigravity** (Google DeepMind Gemini 3.8 Flash, 3.6 Flash, 3.1 Pro High, Sonnet 5.5, Opus 5.5)
- **Kimchi**

### 🆓 Free Providers
- **Kiro AI**: Claude 4.5 + GLM-5 + MiniMax (~50 credits/month free via AWS Builder ID / GitHub / Google)
- **OpenCode Free**: No auth required • Auto-fetches live model registry
- **Vertex AI**: $300 free credits for new Google Cloud accounts (Gemini 3 Pro + Partner models via Vertex AI Studio)

### 🔑 40+ API Key Providers
- **OpenRouter, GLM (Zhipu AI), MiniMax, Kimi (Moonshot), OpenAI, Anthropic, Gemini, DeepSeek, Groq, xAI (Grok), Mistral, Perplexity, Together AI, Fireworks, Cerebras, Cohere, NVIDIA, SiliconFlow, Amazon Bedrock, Cloudflare Workers AI**, and any custom OpenAI / Anthropic-compatible reverse proxy.

### 🏠 Self-Hosted Local Providers
- **Speech-to-Text (STT)**: whisper.cpp, faster-whisper, Speaches (`/v1/audio/transcriptions`)
- **Text-to-Speech (TTS)**: Kokoro-FastAPI, openedai-speech (`/v1/audio/speech`)
- **Embeddings**: llama-server, vLLM, Infinity, text-embeddings-inference (`/v1/embeddings`)

---

## 💡 Key Features & Token Savers

| Feature | What It Does | Why It Matters |
| :--- | :--- | :--- |
| 🛡️ **Zero-Vulnerability MITM** | Modern `selfsigned` + native `node:crypto` engine with async queue | Complete security assurance (`0 npm audit issues`), rock-solid concurrency |
| 🤖 **@antislop-code Agent Skill** | System prompt injector for code comment hygiene | Eliminates generic AI comments, keeps architectural & security explanations |
| 🚀 **RTK Token Saver** ([RTK](https://github.com/rtk-ai/rtk)) | Compresses tool outputs (`git diff`, `grep`, `ls`, `tree`, logs) before LLM | Saves **20–40% input tokens** per request |
| 🧠 **Headroom Token Saver** | Optional external `/v1/compress` proxy before routing | Additional context token reduction |
| 🪨 **Caveman Mode** ([Caveman](https://github.com/JuliusBrussee/caveman)) | Injects terse, information-dense persona prompt | Saves **up to 65% output tokens** |
| 🐴 **Ponytail** ([Ponytail](https://github.com/DietrichGebert/ponytail)) | "Lazy senior dev" prompt enforcing YAGNI and minimal code diffs | Fewer output tokens, cleaner code, less refactoring |
| 🎯 **Smart 3-Tier Fallback** | Subscription → Low Cost → Free automatic routing | Never stop coding, 0s downtime |
| 📊 **Real-Time Quota Tracking** | Live token count, rate limit meters, reset countdowns | Maximize subscription value |
| 🔄 **Universal Format Translation** | Translates OpenAI ↔ Claude ↔ Gemini ↔ Cursor ↔ Antigravity | Connect any client tool to any model |
| 👥 **Multi-Account Load Balancing**| Round-robin distribution across multiple accounts per provider | Redundancy & increased throughput |

---

## 📖 Setup Guide

<details>
<summary><b>🔐 Connecting Subscription Providers</b></summary>

### Claude Code (Pro/Max)
1. Dashboard → Providers → Connect **Claude Code**
2. Complete OAuth authentication.
3. Automatically tracks 5-hour and weekly reset windows.
4. Models: `cc/claude-opus-4-7`, `cc/claude-opus-4-6`, `cc/claude-sonnet-4-6`, `cc/claude-haiku-4-5`.

### OpenAI Codex (Plus/Pro)
1. Dashboard → Providers → Connect **Codex**
2. Complete OAuth login.
3. Models: `cx/gpt-5.5`, `cx/gpt-5.4`, `cx/gpt-5.3-codex`.

### GitHub Copilot
1. Dashboard → Providers → Connect **GitHub**
2. Models: `gh/gpt-5.4`, `gh/claude-opus-4.7`, `gh/claude-sonnet-4.6`, `gh/gemini-3.1-pro-preview`.

</details>

<details>
<summary><b>🤖 Using Agent Skills (@antislop-code)</b></summary>

### Code Comment Hygiene
1. Open Dashboard → **Agent Skills** (or `/dashboard/token-saver`).
2. Toggle **Code Comment Hygiene (@antislop-code)** to **ON**.
3. All requests passing through 67Router will automatically have prompt hygiene enforced:
   - Prohibits decorative dividers (`// =====`, `/* ----- */`).
   - Prohibits step-by-step narration (`// Step 1: get user`, `// Finally return result`).
   - Prohibits restating the obvious (`let count = 0; // initialize count`).
   - Preserves all valuable comments (workarounds, business logic, security constraints).

</details>

<details>
<summary><b>🔄 OpenCode Tool Integration</b></summary>

### Automated Fetch All Models
1. Open Dashboard → **CLI Tools** → **OpenCode**.
2. Click **Fetch All Models** — 67Router automatically discovers all models from your endpoint, parses context limits and vision modalities, and configures `opencode.json`.
3. Choose your **Active Model** and **Explorer Subagent Model** directly in the UI.
4. Alternatively run via CLI:
   ```bash
   67router connect opencode
   ```

</details>

<details>
<summary><b>🎨 Custom Combos & Smart Fallback</b></summary>

Create unlimited smart fallback chains in **Dashboard → Combos**:

```
Combo: "bulletproof-stack"
  1. cc/claude-opus-4-7        (Primary subscription)
  2. glm/glm-5.1               (Budget fallback: $0.6/1M tokens)
  3. kr/claude-sonnet-4.5      (Emergency free fallback via Kiro)
```

Use the combo name (`bulletproof-stack`) as the model name in your CLI tools!

</details>

---

## 🚀 CLI Commands & Options

```bash
# Start server with default configuration
67router

# Custom port
67router --port 20128

# Headless mode (no auto-open browser)
67router --no-browser

# Connect CLI tools automatically
67router connect opencode
67router connect claude
67router connect codex

# View all options
67router --help
```

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js 20+ (ESM & Web Crypto standard)
- **Framework**: Next.js 16 (App Router)
- **Design System**: Monolithic Architectural Luxury (Momo Trust Sans, permanent dark theme)
- **Security**: Native `node:crypto` + `selfsigned` (0 npm audit vulnerabilities)
- **Database**: SQLite (`better-sqlite3` / `node:sqlite` / `sql.js` fallback)
- **Token Compression**: RTK (Rust Token Killer pipeline in JS)
- **Code Intelligence**: `@antislop-code` system injector
- **Streaming**: Server-Sent Events (SSE) with bidirectional backpressure

---

## 📄 License & Attribution

- **License**: MIT License - see [LICENSE](LICENSE) for details.
- **Upstream Project**: Built on the foundations of [9Router](https://github.com/decolua/9router) by **[@decolua](https://github.com/decolua)**.
- **Token Savers & Agent Skills**:
  - [RTK](https://github.com/rtk-ai/rtk) by RTK AI team
  - [Anti-Slop](https://github.com/miqdadbadjuber/anti-slop) by **[@miqdadbadjuber](https://github.com/miqdadbadjuber)**
  - [Caveman](https://github.com/JuliusBrussee/caveman) by **[@JuliusBrussee](https://github.com/JuliusBrussee)**
  - [Ponytail](https://github.com/DietrichGebert/ponytail) by **[@DietrichGebert](https://github.com/DietrichGebert)**

---

<div align="center">
  <sub>Engineered with precision for developers who demand zero-downtime AI workflows.</sub>
</div>
