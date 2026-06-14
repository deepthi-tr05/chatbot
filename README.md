<div align="center">

# 🎙️ Nimma Mitra — Voice Sentiment Chatbot

**A real-time, multilingual voice AI chatbot with live sentiment analysis, Indian speech synthesis, and cloud-synced conversation history.**

<br />

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.14-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3-F55036?style=flat-square&logo=meta&logoColor=white)](https://groq.com/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Voice_STT%2FTTS-4CAF50?style=flat-square)](https://sarvam.ai/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## 📌 Table of Contents

1. [Overview](#-overview)
2. [Live Demo](#-live-demo)
3. [Key Features](#-key-features)
4. [Tech Stack](#-tech-stack)
5. [Architecture](#-architecture)
6. [Project Structure](#-project-structure)
7. [API Endpoints](#-api-endpoints)
8. [Data Models & Firestore Schema](#-data-models--firestore-schema)
9. [Supported Languages](#-supported-languages)
10. [Environment Variables](#-environment-variables)
11. [Local Setup & Running](#-local-setup--running)
12. [Deploying to Vercel via GitHub](#-deploying-to-vercel-via-github)
13. [Firebase Setup (Optional)](#-firebase-setup-optional)
14. [Security](#-security)
15. [Contributing](#-contributing)

---

## 🧭 Overview

**Nimma Mitra** is a full-stack, production-grade AI chatbot application that lets users interact through text or voice in multiple Indian and English languages. The backend is a Node.js Express server that proxies requests to the **Groq Cloud API** (Llama 3.3 70B) for fast, structured JSON chat completions with in-response sentiment analysis. Voice is handled by **Sarvam AI's** Saaras model (STT) and Bulbul model (TTS), delivering natural and expressive Indian-language voice synthesis.

The frontend is a React 19 SPA bundled by Vite, styled using Tailwind CSS v4 with a default dark theme, and animated using Motion. Firebase Firestore provides optional real-time cloud sync for user profiles, chat history, and audio blobs — with a full localStorage fallback for a zero-config guest sandbox mode.

---

## 🌐 Live Demo

> After deploying to Vercel, replace this section with your live link:

```
https://your-project-name.vercel.app
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎤 **Voice Input (STT)** | Records audio via browser mic, uploads to `POST /api/stt`, and transcribes using Sarvam AI Saaras v3 |
| 🔊 **Voice Output (TTS)** | Converts bot replies to audio using Sarvam AI Bulbul v2/v3 (`POST /api/tts`) with speaker selection |
| 🧠 **Sentiment Analysis** | Every Groq response includes structured sentiment (`positive` / `neutral` / `negative`) embedded in JSON |
| 🌍 **10 Indian Languages** | Supports Hindi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, English |
| 💬 **Multi-Session Chat** | Create, rename, switch, and delete multiple conversation threads per user |
| 🔐 **Google OAuth Login** | Sign in with Google via Firebase Authentication popup |
| 👤 **Guest Sandbox Mode** | No login needed — full chatbot experience with localStorage persistence |
| 🌙 **Default Dark Mode** | Dark theme enabled by default, with live toggle to light mode |
| 🔄 **Firestore Real-time Sync** | Profiles, chat sessions, and messages sync instantly to Firestore |
| 🛡️ **Immutable Messages** | Firestore security rules enforce append-only messages — no tampering allowed |
| ⚡ **Vercel Serverless** | Express routes exposed as Vercel serverless functions via `api/server.ts` |
| 🎨 **Premium UI** | Glassmorphism cards, Inter/JetBrains Mono fonts, smooth animations, Lucide icons |

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 19.0.1 | UI component framework |
| TypeScript | 5.8.2 | Static typing |
| Vite | 6.2.3 | Build tool + dev server |
| Tailwind CSS | 4.1.14 | Utility-first styling |
| Motion | 12.23 | UI animations |
| Lucide React | 0.546.0 | Icon system |
| Firebase | 12.14.0 | Auth + Firestore SDK |

### Backend
| Library | Version | Purpose |
|---|---|---|
| Express | 4.21.2 | HTTP server + API proxy |
| Multer | 2.1.1 | In-memory audio file handling |
| dotenv | 17.2.3 | Environment variable loading |
| tsx | 4.21.0 | TypeScript execution (dev) |
| esbuild | 0.25.0 | Production server bundling |

### External APIs
| Service | Usage |
|---|---|
| **Groq Cloud** (Llama 3.3 70B / Llama 3.1 8B) | Chat completions + structured JSON sentiment |
| **Sarvam AI Saaras v3** | Speech-to-Text transcription (10 Indian languages) |
| **Sarvam AI Bulbul v2/v3** | Text-to-Speech synthesis (MP3 output) |
| **Firebase Auth** | Google OAuth 2.0 login |
| **Firebase Firestore** | Real-time cloud sync for chat history |

---

## 🏗️ Architecture

```
Browser (React SPA)
        │
        │  /api/chat  (POST JSON)
        │  /api/stt   (POST multipart audio)
        │  /api/tts   (POST JSON text)
        ▼
Express Server (server.ts / api/server.ts on Vercel)
        │
        ├──► Groq Cloud API ──────────► Llama 3.3 70B or 3.1 8B
        │    (chat + sentiment)
        │
        ├──► Sarvam AI /speech-to-text  (Saaras v3 STT)
        │
        └──► Sarvam AI /text-to-speech  (Bulbul v2/v3 TTS)

Firebase (optional cloud layer)
        ├── Auth ──────────────────────► Google OAuth
        └── Firestore ─────────────────► user_profiles / chats / messages
```

**Data flow for a voice message:**
1. User records audio → browser sends `webm` blob to `POST /api/stt`
2. Server re-streams blob to Sarvam AI → receives transcript text
3. Transcript is sent to `POST /api/chat` → Groq returns `{response, sentiment, detectedLanguage}`
4. Chat area updates with bot bubble + sentiment badge
5. Background prefetch silently calls `POST /api/tts` → receives base64 MP3
6. User clicks the speak button → audio plays from cached base64 string

---

## 📁 Project Structure

```
voice-sentiment-ai-chatbot/
│
├── api/
│   └── server.ts                  # Vercel serverless function entry (imports Express app)
│
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx          # Login UI: Google OAuth + Guest Sandbox button
│   │   ├── ChatArea.tsx            # Main chat view: bubbles, mic, TTS playback
│   │   ├── ProfileCustomizer.tsx   # Settings drawer: avatar, language, model
│   │   └── Sidebar.tsx             # Session list, theme toggle, sign-out
│   │
│   ├── lib/
│   │   └── firebase.ts             # Firebase SDK init, Auth, Firestore helpers
│   │
│   ├── App.tsx                     # Root: auth guard, session manager, message handler
│   ├── index.css                   # Tailwind v4 directives + dark variant + Google Fonts
│   ├── main.tsx                    # React 19 root render
│   └── types.ts                    # Shared TypeScript interfaces & const arrays
│
├── assets/
│   └── .aistudio/                  # Static assets placeholder
│
├── server.ts                       # Express server: /api/chat, /api/stt, /api/tts + Vite dev
├── vercel.json                     # Vercel rewrite: /api/* → /api/server
├── firebase-applet-config.json     # Firebase project configuration
├── firebase-blueprint.json         # Firestore entity schema definitions
├── firestore.rules                 # Firestore security rules
├── tsconfig.json                   # TypeScript compiler config (ES2022, bundler resolution)
├── vite.config.ts                  # Vite: React plugin, Tailwind plugin, @ alias
├── package.json                    # Scripts: dev, build, start, lint, clean
├── .env.example                    # Template for required environment keys
├── .gitignore                      # Ignores node_modules, dist, .env*
└── README.md                       # This file
```

---

## 🔌 API Endpoints

All endpoints are served by the Express backend (`server.ts`), accessible at `/api/*`.

### `POST /api/chat`
Processes a conversation history and returns an AI reply with sentiment and language detection.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello, I feel great today!" }
  ],
  "preferredLanguage": "en-IN",
  "preferredModel": "llama-3.3-70b-versatile"
}
```

**Response:**
```json
{
  "response": "That's wonderful to hear! What's making your day great?",
  "sentiment": "positive",
  "detectedLanguage": "en"
}
```

---

### `POST /api/stt`
Transcribes a voice recording into text using Sarvam AI's Saaras model.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | `Blob` (audio/webm) | Recorded audio |
| `language_code` | `string` | Language hint e.g. `en-IN`, `hi-IN` |

**Response:**
```json
{
  "transcript": "What is the weather like today?",
  "language_code": "en-IN"
}
```

---

### `POST /api/tts`
Synthesizes a text string into base64-encoded MP3 audio using Sarvam AI's Bulbul model.

**Request Body:**
```json
{
  "text": "Hello, I am your AI assistant.",
  "languageCode": "en-IN",
  "speaker": "anushka",
  "model": "bulbul:v2"
}
```

**Response:**
```json
{
  "audioBase64": "<base64-encoded-mp3>"
}
```

---

## 🗄️ Data Models & Firestore Schema

### `user_profiles/{userId}`
| Field | Type | Description |
|---|---|---|
| `userId` | `string` | Firebase Auth UID |
| `email` | `string` | User email address |
| `displayName` | `string` | Profile display name |
| `avatarIcon` | `string` | Avatar preset (e.g. `Robot`, `Ninja`) |
| `avatarColor` | `string` | Tailwind gradient class for avatar |
| `preferredLanguage` | `string` | e.g. `en-IN`, `hi-IN` |
| `preferredModel` | `string` | e.g. `llama-3.3-70b-versatile` |
| `updatedAt` | `Timestamp` | Firestore server timestamp |

### `chats/{chatId}`
| Field | Type | Description |
|---|---|---|
| `chatId` | `string` | Unique session ID |
| `userId` | `string` | Owner UID |
| `title` | `string` | Derived from first message text |
| `createdAt` | `Timestamp` | Thread creation time |
| `updatedAt` | `Timestamp` | Last message time |

### `chats/{chatId}/messages/{messageId}`
| Field | Type | Description |
|---|---|---|
| `messageId` | `string` | Unique message ID |
| `chatId` | `string` | Parent chat reference |
| `sender` | `"user"` \| `"bot"` | Message origin |
| `text` | `string` | Message body |
| `sentiment` | `"positive"` \| `"neutral"` \| `"negative"` | AI-classified sentiment |
| `detectedLanguage` | `string` | ISO language code (e.g. `hi`, `ta`) |
| `audioBase64` | `string?` | Cached TTS MP3 base64 string |
| `createdAt` | `Timestamp` | Immutable creation timestamp |

> ⚠️ **Messages are immutable** once written (enforced by Firestore rules via `allow update: if false`).

---

## 🌍 Supported Languages

| Language | Code | Script |
|---|---|---|
| English (India) | `en-IN` | Latin |
| Hindi | `hi-IN` | देवनागरी |
| Tamil | `ta-IN` | தமிழ் |
| Telugu | `te-IN` | తెలుగు |
| Bengali | `bn-IN` | বাংলা |
| Gujarati | `gu-IN` | ગુજરાતી |
| Kannada | `kn-IN` | ಕನ್ನಡ |
| Malayalam | `ml-IN` | മലയാളം |
| Marathi | `mr-IN` | मराठी |
| Punjabi | `pa-IN` | ਪੰਜਾਬੀ |

---

## 🔐 Environment Variables

Create a `.env` file in the root directory. **Never commit this file to Git** (it is already listed in `.gitignore`).

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | API key from [console.groq.com](https://console.groq.com) |
| `SARVAM_API_KEY` | ✅ Yes | API key from [dashboard.sarvam.ai](https://dashboard.sarvam.ai) |

```env
# Groq Cloud API key — used for chat completions (Llama 3.3 70B) and sentiment analysis
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Sarvam AI subscription key — used for Speech-to-Text (Saaras) and Text-to-Speech (Bulbul)
SARVAM_API_KEY="sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> 📝 See [`.env.example`](.env.example) for a ready-to-copy template.

---

## 💻 Local Setup & Running

### Prerequisites
- **Node.js** v18.x or higher → [nodejs.org](https://nodejs.org/)
- **npm** (bundled with Node.js)
- A **Groq API Key** → [console.groq.com](https://console.groq.com/)
- A **Sarvam AI API Key** → [dashboard.sarvam.ai](https://dashboard.sarvam.ai/)

### Step 1 — Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd voice-sentiment-ai-chatbot
```

### Step 2 — Install Dependencies
```bash
npm install
```

### Step 3 — Configure Environment
```bash
# Windows PowerShell
Copy-Item .env.example .env
```
Edit `.env` and replace placeholder values with your real API keys.

### Step 4 — Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

> 💡 The dev server runs both the React Vite frontend (with HMR) and the Express API proxy on the same port `3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Express + Vite dev server on port 3000 |
| `npm run build` | Build React SPA to `dist/` and compile server to `dist/server.cjs` |
| `npm start` | Run production server from built `dist/server.cjs` |
| `npm run lint` | TypeScript type-checking only (no emit) |
| `npm run clean` | Delete `dist/` and `server.js` build artifacts |

---

## 🚀 Deploying to Vercel via GitHub

This project includes a pre-configured [`vercel.json`](vercel.json) that routes all `/api/*` traffic to the Express serverless function at `api/server.ts`.

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit of Nimma Mitra Chatbot"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main --force
```

### Step 2 — Import on Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Select your GitHub repository from the list

### Step 3 — Set Environment Variables
In the Vercel project setup screen, expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `GROQ_API_KEY` | Your Groq API key |
| `SARVAM_API_KEY` | Your Sarvam AI key |

### Step 4 — Deploy
Click **Deploy**. Vercel will:
- Build the React Vite frontend to static files on the CDN
- Deploy the Express backend as a Serverless Function via `api/server.ts`
- Automatically apply the `/api/*` rewrites from `vercel.json`

> ✅ After deployment, your live URL will be something like `https://nimma-mitra.vercel.app`

---

## 🔥 Firebase Setup (Optional)

Without Firebase, the app runs in **Guest Sandbox mode** using browser `localStorage`.
With Firebase connected, users get **Google OAuth login** and **real-time Firestore sync**.

### Setup Steps
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable **Authentication → Google Sign-in**
3. Enable **Firestore Database**
4. Copy your project's config object into `firebase-applet-config.json`:
   ```json
   {
     "projectId": "your-project-id",
     "appId": "...",
     "apiKey": "...",
     "authDomain": "your-project.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "your-project.firebasestorage.app",
     "messagingSenderId": "..."
   }
   ```
5. Deploy the Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 🛡️ Security

- **Firestore Rules** (`firestore.rules`) enforce strict per-user access:
  - Users can only read and write their own profile, sessions, and messages
  - Messages are **append-only** (immutable once created)
  - All input fields have **size limits** enforced server-side
- **API keys** are stored server-side only; never sent to the client
- **Audio uploads** are handled in-memory by Multer with a 10MB size cap
- **Secrets** are excluded from Git via `.gitignore` with `.env*` patterns

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** this repository
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Commit your changes**: `git commit -m "feat: add your feature"`
4. **Push to the branch**: `git push origin feature/your-feature`
5. **Open a Pull Request** on GitHub

---

<div align="center">

Made with ❤️ using **React**, **Groq**, and **Sarvam AI**

</div>
