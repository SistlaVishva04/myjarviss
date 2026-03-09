# JARVIS Frontend

## Tech stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Running locally

Requirements:
- Node.js and npm installed (for example via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

Steps:

```sh
# Step 1: Install dependencies
npm install

# Step 2: Start the development server
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

## Backend integration

This frontend expects a separate backend that exposes a small `/api/...` surface for:
- Authentication (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/session`)
- Conversation history (`/api/conversations`, `/api/conversations/:id`)
- Chat completion (`/api/chat`)

You can implement the backend in any stack you prefer and either:
- Run it on the same origin under `/api/...`, or
- Run it on a separate host and proxy `/api/...` to it via your dev server / reverse proxy.
