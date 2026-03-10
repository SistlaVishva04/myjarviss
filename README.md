# 🤖 MyJarvis — AI Voice Assistant

## 📌 Overview

MyJarvis is a voice-enabled AI assistant built with modern full-stack technologies and generative AI. The system enables users to interact with an AI assistant through natural voice conversations, combining speech recognition, AI reasoning, and speech synthesis into a seamless experience.

This repository demonstrates how to build a production-style AI assistant using a scalable architecture with a dedicated backend, database, authentication system, and AI integration.

---

## 🎯 Features

### Core Features

- 🔐 Register and log in securely
- 🎙️ Speak to the assistant using voice input
- 📝 Convert speech to text (speech recognition)
- 🤖 Send prompts to Google Gemini AI
- 💬 Receive intelligent responses
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
- 🧠 AI personality system (JARVIS prompt engineering)
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

## 🧠 How MyJarvis Works

1. User speaks using the microphone.
2. Speech recognition converts voice to text.
3. The text prompt is sent to the backend.
4. The backend checks for built-in assistant skills (e.g., ``"What time is it?"`` or ``"What's today's date?"``).
5. If no built-in skill matches, the request is forwarded to Gemini AI.
6. AI generates a response.
7. The response is returned to the frontend.
8. Text-to-speech converts the response back into voice.
9. Conversation history is stored for authenticated users.

---

## 🛡️ Authentication & Conversation History

- JWT authentication using HTTP-only cookies
- User-specific conversation logs stored in MongoDB
- Guest mode allows unauthenticated interactions (history not saved)

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

- Streaming AI responses

- Long-term conversation memory

- Weather & news assistant skills

- Deployment (Vercel + Render + MongoDB Atlas)

- Interruptible voice interaction

- Smart conversation title generation
