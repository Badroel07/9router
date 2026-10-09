<div align="center">
  <img src="../images/9router.png?1" alt="67Router Dashboard" width="800"/>

  # 67Router - AI Router Berkinerja Tinggi, Penghemat Token & Agent Skills Hub

  **Distribusi & Hardening Khusus dari 9Router • Ngoding tanpa henti. Hemat 20-40% token dengan RTK + fallback otomatis ke model AI gratis & murah.**

  **Hubungkan semua AI Coding Tools (Claude Code, Cursor, Antigravity, Copilot, Codex, Gemini, OpenCode, Cline, OpenClaw...) ke 40+ Provider AI dan 100+ Model.**

  [![npm](https://img.shields.io/npm/v/67router.svg)](https://www.npmjs.com/package/67router)
  [![Downloads](https://img.shields.io/npm/dm/67router.svg)](https://www.npmjs.com/package/67router)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
  [![GitHub Repository](https://img.shields.io/badge/GitHub-Badroel07%2F9router-orange?logo=github)](https://github.com/Badroel07/9router)
  [![Upstream](https://img.shields.io/badge/Upstream-decolua%2F9router-lightgrey?logo=github)](https://github.com/decolua/9router)

  [🚀 Mulai Cepat](#-mulai-cepat) • [⚡ 67Router vs 9Router](#-67router-vs-upstream-9router) • [💡 Fitur Utama](#-fitur-utama) • [📖 Panduan Setup](#-panduan-setup) • [🌐 Website](https://9router.com)

  [🇺🇸 English](../README.md) • [🇮🇩 Bahasa Indonesia](./README.id-ID.md) • [🇻🇳 Tiếng Việt](./README.vi.md) • [🇨🇳 中文](./README.zh-CN.md) • [🇯🇵 日本語](./README.ja-JP.md)
</div>

---

## ⚡ 67Router vs Upstream 9Router

**67Router** adalah varian yang diperkuat, ditingkatkan keamanannya, dan didesain ulang secara estetika dari **9Router** (`decolua/9router`). Semua kompabilitas upstream (provider, combo, format translator) tetap dipertahankan 100%, ditambah berbagai peningkatan krusial:

### 📊 Tabel Perbandingan

| Fitur / Aspek | Upstream 9Router (`decolua/9router`) | 67Router (`Badroel07/9router`) |
| :--- | :--- | :--- |
| **Paket & Binary CLI** | `9router` | **`67router`** (didukung alias ganda: `67router` dan `9router` keduanya aktif) |
| **Audit Keamanan (`npm audit`)** | ⚠️ Menggunakan `node-forge` (kerentanan **GHSA-86w9-cpqp-85rv**, High Severity) | 🛡️ **0 Vulnerability**: Direfaktor total ke `selfsigned` modern & `node:crypto` `X509Certificate` |
| **Mesin Proxy MITM SSL/TLS** | Pembuatan sertifikat sinkron; rawan race condition saat request bersamaan | ⚡ **Async `sniCallback` + antrean konkurensi** (`pendingCerts` memoization) bebas hambatan |
| **Agent Skills & Prompt Sanitizer** | Hanya kompresi token dasar (RTK tool result) | 🤖 **Agent Skills Hub** (`smart_toy`) + **`@antislop-code` Comment Hygiene** (pembersih komentar sampah AI) |
| **Integrasi OpenCode CLI** | Input konfigurasi model tunggal manual | 🔄 **Otomatisasi "Fetch All Models"**: Deteksi otomatis batas konteks, output token, & modalitas vision |
| **Desain UI & Visual System** | Tampilan default standar | 💎 **Monolithic Architectural Luxury**: Dark mode permanen, font **Momo Trust Sans**, hairline border, aksen perunggu |
| **Presisi Header & Sidebar** | Judul header statis, offset padding tidak rata | 📐 **Tinggi terkunci presisi `h-[69px]`** (0px offset antar-sidebar/header), judul dinamis (`PAGE_META`) |
| **Stabilitas Runtime Windows** | Kendala `EPERM` saat build & potensi `EBUSY` file lock | 🪟 Direktori runtime terisolasi (`~/.67router` / `%APPDATA%\67router`), penanganan build `EPERM` aman |
| **Pelacakan Arsip & Knowledge Graph** | Satu file `CHANGELOG.md` monolitik | 🗂️ **Arsip modular `changelog/arsip-NNN.md`** (kronologis terbalik, anti-duplikasi) + indeks graf `codebase-memory-mcp` |

---

### 🔍 Rincian Fitur Unggulan 67Router

#### 1. 🛡️ Arsitektur Keamanan Zero-Vulnerability (v1.0.5)
- Pada 9Router upstream, modul MITM bergantung pada pustaka `node-forge` yang memiliki kerentanan High Severity ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)) tanpa patch resmi upstream.
- **67Router menghapus total dependensi `node-forge`**. Logika Root CA dan leaf certificate diganti dengan library `selfsigned` standar Web Crypto API dan `crypto.X509Certificate` bawaan Node.js.
- Dilengkapi mekanisme antrean `pendingCerts` asinkron pada `server.js` untuk mencegah race condition pada handshake TLS simultan.
- **Hasil:** `npm audit --omit=dev` kini menghasilkan **0 vulnerability**.

#### 2. 🤖 Agent Skills & Kebersihan Komentar Kode (`@antislop-code`) (v1.0.3)
- Model AI masa kini kerap mengotori kode dengan komentar basa-basi dan narasi berlebih (misalnya `// === Helper function ===`, `// Step 1: lakukan ini`, `// initialize variable`).
- 67Router memperkenalkan menu **Agent Skills** (`/dashboard/skills` / `/dashboard/token-saver`), mengintegrasikan fitur **`@antislop-code`** (didukung oleh `miqdadbadjuber/anti-slop`).
- Saat diaktifkan, 67Router menyuntikkan instruksi ke system prompt:
  - ❌ Melarang komentar dekoratif, narasi alur langkah demi langkah, dan penulisan ulang hal yang sudah jelas.
  - ✅ Mempertahankan penjelasan keputusan arsitektur, workaround bug, batasan keamanan, dan logika esensial.

#### 3. ⚡ Integrasi OpenCode: Sinkronisasi Model Otomatis dengan Spesifikasi Lengkap
- Pada versi upstream, pengaturan model OpenCode dilakukan secara manual satu per satu.
- 67Router menambahkan fitur **Fetch All Models** baik di antarmuka Web Dashboard maupun via CLI (`67router connect opencode`):
  - Membaca semua model aktif dari endpoint `/v1/models` via `baseUrl` dan `apiKey`.
  - Mengekstrak batas window konteks, limit output token, dan kapabilitas multimodal/vision ke skema `opencode.json`.
  - Pemilihan model utama (active model) dan subagent explorer model hanya dengan 1 kali klik.

#### 4. 💎 Desain Monolithic Architectural Luxury
- Geometri tajam tanpa rounded corner (`border-radius: 0px`), latar belakang obsidian (`#080808`, `#141416`), garis pembagi rambut 1px (`#222226`), dan aksen perunggu/emas (`#C5A880`).
- Menggunakan tipografi **Momo Trust Sans** di seluruh aplikasi untuk keterbacaan teknis maksimal.
- Header dan Sidebar terkunci pada ketinggian tetap `h-[69px]` sehingga garis batas bawah sejajar sempurna di semua resolusi layar.

#### 5. 🪟 CLI Berkinerja Tinggi & Runtime Bebas Tabrakan
- Dirilis di npm dengan nama **`67router`**, mendukung perintah ganda (`67router` dan `9router`).
- Dependensi native dan runtime SQLite disimpan terisolasi di `~/.67router` (atau `%APPDATA%\67router`), mencegah bentrok `EBUSY` saat update CLI global di Windows.

---

## 🤔 Kenapa 67Router?

**Berhenti buang-buang uang, token, dan terhenti karena rate limit:**

- ❌ Kuota langganan hangus tiap bulan tanpa terpakai
- ❌ Rate limit membekukan sesi ngoding di tengah jalan
- ❌ Output tool CLI (`git diff`, `grep`, `ls`, logs) memboroskan kuota token
- ❌ Biaya API terpisah yang mahal ($20–$50/bulan per provider)
- ❌ Komentar kode sampah dari AI yang mengotori repository
- ❌ Harus gonta-ganti konfigurasi secara manual antar tool

**67Router menyelesaikan semuanya dalam satu router cerdas:**

- ✅ **RTK Token Saver** - Kompres otomatis output tools, hemat 20–40% token input per request
- ✅ **Agent Skills (@antislop-code)** - Sanitasi otomatis komentar kode dari AI
- ✅ **Proxy MITM Zero-Vulnerability** - Intersepsi aman berbasis Node crypto standar
- ✅ **Smart 3-Tier Fallback** - Langganan → Murah → Gratis dengan 0 downtime
- ✅ **Multi-Akun Round-Robin** - Bagi beban antar banyak akun untuk tiap provider
- ✅ **Universal** - Mendukung Claude Code, Cursor, Antigravity, OpenCode, Codex, Cline, dan seluruh tool CLI

---

## 🔄 Cara Kerja

```
┌─────────────────────────────────────────────────────────────┐
│                       Tool CLI Kamu                         │
│   (Claude Code, Cursor, Antigravity, OpenCode, Codex, Cline)│
└──────────────────────────────┬──────────────────────────────┘
                               │ http://localhost:20128/v1
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                    67Router (Smart Core)                    │
│  • Kompresi Token RTK (hemat 20-40% konteks input)          │
│  • Agent Skills (@antislop-code kebersihan kode)            │
│  • Proxy MITM Aman Bebas Kerentanan                         │
│  • Konversi Format (OpenAI ↔ Claude ↔ Gemini)               │
│  • Pelacakan Kuota & Refresh Token Otomatis                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ├─→ [Tier 1: Langganan] Claude Code, Codex, GitHub Copilot
        │   ↓ kuota habis
        ├─→ [Tier 2: Murah] GLM ($0.6/1M), MiniMax ($0.2/1M), Kimi ($9/bln)
        │   ↓ batas budget tercapai
        └─→ [Tier 3: Gratis] Kiro, OpenCode Free, Vertex AI ($300 kredit)

Hasil: Ngoding nonstop, keamanan terjamin, kode rapi tanpa slop, biaya minimal.
```

---

## ⚡ Mulai Cepat

### 1. Install Global via npm:

```bash
npm install -g 67router
67router

# Atau jalankan langsung via npx:
npx 67router
```

> **Catatan:** Perintah alias `9router` juga dapat digunakan secara langsung (`9router`).

🎉 **Dashboard otomatis terbuka di:** `http://localhost:20128`

---

### 2. Hubungkan Provider GRATIS (Tanpa Kartu Kredit):

1. Buka Dashboard → **Providers**
2. Hubungkan **Kiro AI** (~50 kredit gratis/bulan: Claude 4.5 + GLM-5 + MiniMax) atau **OpenCode Free** (tanpa login).

---

### 3. Konfigurasikan Tool Coding AI Kamu:

Arahkan base URL OpenAI atau Anthropic ke 67Router:

```
Endpoint: http://localhost:20128/v1
API Key:  [Salin dari Dashboard -> Endpoint / API Keys]
Model:    kr/claude-sonnet-4.5 (atau model/combo yang dipilih)
```

Atau gunakan perintah otomatis via CLI:

```bash
# Sinkronkan OpenCode otomatis dengan deteksi semua model
67router connect opencode

# Sinkronkan Claude Code
67router connect claude

# Sinkronkan Codex
67router connect codex
```

---

## 💡 Fitur Utama & Penghemat Token

| Fitur | Fungsi | Manfaat |
| :--- | :--- | :--- |
| 🛡️ **Zero-Vulnerability MITM** | Engine kriptografi native Node.js + antrean asinkron | Keamanan teruji (`0 audit issue`), bebas race condition |
| 🤖 **@antislop-code Agent Skill** | Injeksi prompt sistem untuk higienitas komentar kode | Bersihkan komentar basa-basi AI, pertahankan arsitektur penting |
| 🚀 **RTK Token Saver** | Kompresi output tool (`git diff`, `grep`, `ls`, logs) sebelum ke LLM | Hemat **20–40% token input** di setiap request |
| 🪨 **Caveman Mode** | Gaya respons singkat dan padat teknis | Hemat **hingga 65% token output** |
| 🐴 **Ponytail** | Prompt "lazy senior dev" dengan pendekatan YAGNI | Kode lebih ringkas, sedikit abstraksi berlebih |
| 🎯 **Smart 3-Tier Fallback** | Pengalihan otomatis: Langganan → Murah → Gratis | Ngoding 24/7 tanpa downtime |
| 📊 **Pelacakan Kuota Real-Time** | Hitungan token live dan countdown reset | Maksimalkan kuota langganan sebelum hangus |
| 🔄 **Konversi Format Universal** | Konversi OpenAI ↔ Claude ↔ Gemini ↔ Antigravity | Gunakan tool apa pun dengan model apa pun |

---

## 🛠️ Stack Teknologi & Arsitektur

- **Runtime**: Node.js 20+ (ESM & Web Crypto API standard)
- **Framework**: Next.js 16 (App Router)
- **Desain UI**: Monolithic Architectural Luxury (Momo Trust Sans, dark mode)
- **Keamanan**: Native `node:crypto` + `selfsigned` (0 vulnerabilitas)
- **Database**: SQLite (`better-sqlite3` / `node:sqlite` / `sql.js` fallback)
- **Token Saver**: Pipeline RTK (Rust Token Killer dalam JavaScript)
- **Streaming**: Server-Sent Events (SSE) dengan backpressure dua arah

---

## 📄 Lisensi & Atribusi

- **Lisensi**: MIT License - lihat [LICENSE](../LICENSE).
- **Upstream Project**: Dikembangkan dari fondasi [9Router](https://github.com/decolua/9router) karya **[@decolua](https://github.com/decolua)**.
- **Komponen Eksternal**:
  - [RTK](https://github.com/rtk-ai/rtk) oleh tim RTK AI
  - [Anti-Slop](https://github.com/miqdadbadjuber/anti-slop) oleh **[@miqdadbadjuber](https://github.com/miqdadbadjuber)**
  - [Caveman](https://github.com/JuliusBrussee/caveman) oleh **[@JuliusBrussee](https://github.com/JuliusBrussee)**
  - [Ponytail](https://github.com/DietrichGebert/ponytail) oleh **[@DietrichGebert](https://github.com/DietrichGebert)**
