# 🎙️ Lumina AI — Voice Sentiment Chatbot

Lumina AI is an interactive, responsive, and multilingual voice-sentiment chatbot. It analyzes user input in real-time, outputs sentiment ratings (Positive, Neutral, Negative), transcribes spoken queries using Indian voice recognition models, and synthesizes text responses back to high-fidelity audio streams.

---

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-purple?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Express-4.21-lightgrey?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

---

## ✨ Key Capabilities

*   **🗣️ Multilingual Voice (STT & TTS)**:
    *   **Speech-to-Text**: Dictate queries naturally in multiple regional languages (Hindi, Tamil, Telugu, Kannada, Bengali, Gujarati, Malayalam, Marathi, Punjabi, or English), transcribed via the Sarvam Saaras model.
    *   **Text-to-Speech**: Conversational replies vocalized back to speech using the high-fidelity Sarvam Bulbul model with compatible speakers (e.g. Anushka).
*   **📊 Real-Time Sentiment Assessment**: Analyzes input content dynamically to classify sentiment metrics (Positive, Neutral, Negative) displayed with clean UI indicators.
*   **💾 Dual Data Management (Sync vs Sandbox)**:
    *   **Google & Firebase Sync**: Real-time cloud save of conversation streams and visual settings when connected to Firestore.
    *   **Guest Sandbox**: Works locally in sandbox mode using localStorage when Firebase is not configured, enabling immediate exploration.
*   **🎨 Premium UI/UX Design**: Built with smooth dark mode settings by default, micro-animations, clean typography (Inter & Space Grotesk), and custom avatar cards.

---

## ⚡ Quick Deployment on Vercel (Option B)

Deploy your chatbot directly to Vercel with automatic serverless function routing:

1.  **Push this repository to GitHub**:
    Create a new repository on GitHub, and push the codebase:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of Lumina AI Chatbot"
    git branch -M main
    git remote add origin <YOUR_GITHUB_REPO_URL>
    git push -u origin main --force
    ```
2.  **Import to Vercel**:
    *   Go to your [Vercel Dashboard](https://vercel.com).
    *   Click **Add New > Project**, and import your GitHub repository.
3.  **Configure Environment Variables**:
    In the deployment configuration screen under **Environment Variables**, add:
    *   `GROQ_API_KEY`: Your Groq Cloud API key.
    *   `SARVAM_API_KEY`: Your Sarvam AI key.
4.  **Click Deploy**:
    Vercel builds the frontend statically to its CDN and automatically hosts the backend Express proxy (`/api/*`) as Serverless Functions (`api/server.ts`).

---

## 💻 Local Setup & Execution

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (comes packaged with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Environment Variables
Create a `.env` file in the root directory:
```bash
GROQ_API_KEY="your-groq-key-here"
SARVAM_API_KEY="your-sarvam-key-here"
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

### 4. Build and Run in Production Mode
```bash
npm run build
npm start
```

---

## 📁 Repository Structure

```
├── api/
│   └── server.ts                    # Vercel serverless function wrapper
├── assets/                          # Static icons & configs
├── src/
│   ├── components/                  # React UI components (Sidebar, ChatArea, etc.)
│   ├── lib/                         # Firebase utilities and sync engine
│   ├── App.tsx                      # App layout & routing container
│   ├── index.css                    # Styling rules
│   ├── main.tsx                     # React entrypoint
│   └── types.ts                     # Core TypeScript declarations
├── server.ts                        # Express backend proxy configuration
├── vercel.json                      # Vercel rewrite configuration
├── firebase-applet-config.json      # Firebase configuration file
├── firebase-blueprint.json          # Firebase resources blueprint
├── firestore.rules                  # Firestore access security rules
├── tsconfig.json                    # TypeScript compiler settings
├── vite.config.ts                   # Vite bundler parameters
├── package.json                     # Dependency manifests
└── .gitignore                       # Ignored file profiles
```
