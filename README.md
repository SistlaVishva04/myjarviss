# 🤖 myVishva — AI Voice Assistant

## 📌 Overview

myVishva is a voice-enabled AI assistant built with modern full-stack technologies and generative AI. The system enables users to interact with Vishva through natural voice conversations, combining speech recognition, AI reasoning, and speech synthesis into a seamless experience.

This repository demonstrates how to build a production-style AI assistant using a scalable architecture with a dedicated backend, database, authentication system, and AI integration.

---

## 🎯 Features

### Core Features

- 🔐 Register and log in securely
- 🎙️ Speak to the assistant using voice input
- 📝 Convert speech to text (speech recognition)
- 🤖 Send prompts to Google Gemini AI
- 💬 Receive streamed intelligent responses
- 🔊 Convert AI responses to speech
- 🧾 Store conversation history per user
- 💻 Interact through a clean and responsive UI

### Technical Highlights

- 🎙️ Voice-based interaction (Speech-to-Text + Text-to-Speech)
- 🤖 Google Gemini AI integration
- 🔐 JWT authentication with HTTP-only cookies
- 🧾 User-specific conversation history
- ⚡ Fast frontend powered by Vite
- 🎨 Modern UI built with Tailwind CSS
- 🗂 MongoDB conversation storage
- 🧠 Vishva assistant personality and prompt engineering
- ⚙️ Built-in assistant skills (time, date)
- 🌐 Web-based voice interface

---

## 🏗️ Architecture

```
Frontend (React + TypeScript)
        │
        ▼
Backend API (Node.js + Express)
        │
        ▼
MongoDB Database
        │
        ▼
Gemini AI (Google Generative AI)
``` 

**Voice pipeline:**

```
Speech → Text → AI → Response → Speech
```

---

## 🗂️ Project Structure

```
myyjarviss/
├── frontend/             # React application
│   ├── public/           # Static assets
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Voice & auth hooks
│   │   ├── lib/          # Utilities and helpers
│   │   ├── styles/       # Tailwind styles
│   │   └── main.tsx      # App entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/              # Express API
│   ├── src/
│   │   ├── config/        # Database connection
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   └── server.ts      # Express server
│   ├── package.json
│   └── tsconfig.json
└── README.md             # This file
```

---

## 🧾 Prerequisites

Ensure you have the following installed on your machine:

- Node.js (v18 or higher)
- npm
- MongoDB (local instance or Atlas)
- Google Gemini API key

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` directory with the following values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_ORIGIN=http://localhost:8080
```

`backend/.env.local.example` is a placeholder-only template. Do not overwrite an existing `.env`; keep API keys and credentials out of source control. The local development server should use a local MongoDB database rather than a production URI.

## Local development (Windows PowerShell)

Start the backend in one terminal. The explicit `MONGODB_URI` override keeps local development isolated from any URI in `backend/.env`:

```powershell
cd backend
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/jarvis_dev"
$env:JWT_SECRET = "replace-with-a-local-development-secret"
$env:CLIENT_ORIGIN = "http://localhost:5173"
$env:NODE_ENV = "development"
npm run dev
```

The backend also reads `GEMINI_API_KEY` from its existing `.env` for Gemini requests. If it is not configured, health, auth, and conversation operations work, but AI chat will report that Gemini is unavailable.

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev:local
```

Open `http://localhost:5173`; the backend is at `http://localhost:5000`. Development mode uses the local API URL even if another URL is present in a local frontend `.env`. Production builds continue to use `VITE_API_BASE_URL`. The backend accepts credentialed requests from `http://localhost:5173` and `http://localhost:8080`; local auth cookies use development-only `SameSite=Lax` settings.

Run focused checks from each app directory:

```powershell
npm test
npm run build
```

The frontend also supports `npm run lint`. A local MongoDB service and a development Gemini API key are needed for full authenticated chat verification.

---

## 🚀 Setup & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SistlaVishva04/myyjarviss.git
   cd myyjarviss
   ```
2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```
4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5000`.
5. **Start the frontend:**
   From the project root:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:8080`.

---

## 🧠 How myVishva Works

1. User speaks using the microphone.
2. Speech recognition converts voice to text.
3. The text prompt is sent to the backend.
4. The backend checks for built-in assistant skills (e.g., ``"What time is it?"`` or ``"What's today's date?"``).
5. If no built-in skill matches, the request is forwarded to Gemini AI and streamed to the frontend.
6. The completed response and conversation title are persisted for authenticated users.
7. Text-to-speech speaks the completed response.

---

## 🛡️ Authentication & Conversation History

- JWT authentication using HTTP-only cookies
- Paginated, user-specific conversation history stored in MongoDB
- Guest mode allows unauthenticated interactions (history not saved)
- Authenticated history is loaded in pages; each conversation's messages are paginated separately
- `POST /api/chat` retains its JSON response; `POST /api/chat/stream` streams incremental server-sent events

---

## 🧪 What This Project Demonstrates

- Full‑stack AI application architecture
- Voice‑based human‑AI interaction
- REST API design and authentication
- Database schema with MongoDB
- Prompt engineering techniques for AI assistants
- Scalable, modular project structure

---

## 👨‍💻 Author

[S V Vishnu Vamsi](https://github.com/SistlaVishva04)

📧 vishnuvamsi04@gmail.com

---

## ⭐ Future Improvements

- Possible upgrades for the project:

- Long-term conversation memory

- Weather & news assistant skills

- Deployment (Vercel + Render + MongoDB Atlas)

- Interruptible voice interaction
