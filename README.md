# ◆ Vossle

**Enterprise WebRTC Video Communication Platform**
*Connect at the speed of trust.*

---

## Overview

Vossle is a production-ready 1-to-1 video communication platform built on WebRTC. It features HD video/audio, end-to-end encryption, JWT authentication, real-time signaling, screen sharing, in-call chat, and a premium dark-themed UI.

## Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Frontend    | React 18 · React Router · Socket.IO Client |
| Backend     | Node.js · Express · Socket.IO             |
| Auth        | JWT (access + refresh tokens) · bcrypt    |
| Media       | WebRTC (VP9/H.264, Opus) · STUN/TURN     |
| Security    | Helmet · CORS · Rate Limiting · DTLS-SRTP |
| Build       | Docker · Docker Compose                   |

## Project Structure

```
Meet-Vid/
├── server/                    # Backend (Node.js + Express + Socket.IO)
│   ├── src/
│   │   ├── config/            # ICE & auth configuration
│   │   ├── controllers/       # Auth & session controllers
│   │   ├── middleware/         # Auth, validation, error middleware
│   │   ├── models/            # In-memory user & session stores
│   │   ├── routes/            # API routes
│   │   ├── services/          # Socket.IO signaling service
│   │   ├── utils/             # JWT token utilities
│   │   ├── app.js             # Express app setup
│   │   └── index.js           # Server entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── client/                    # Frontend (React 18)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Navbar, VideoPlayer, CallControls, ChatPanel
│   │   ├── context/           # AuthContext (global auth state)
│   │   ├── hooks/             # useWebRTC (core WebRTC hook)
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Room
│   │   ├── services/          # API client, Socket.IO service
│   │   ├── styles/            # Global CSS (dark theme)
│   │   ├── App.js             # Router & layout
│   │   └── index.js           # React entry point
│   └── package.json
│
├── PRODUCT_CONCEPT.md         # Full product blueprint
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Docker Compose setup
└── package.json               # Root scripts (dev, build, install)
```

## Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **npm** 9+ installed

### 1. Install Dependencies

```bash
# From root directory
npm run install:all
```

Or manually:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment

The server `.env` is pre-configured for development. Edit `server/.env` if needed:

```env
PORT=5000
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:3000
```

### 3. Run Development Servers

**Option A — Run both simultaneously (requires `concurrently`):**
```bash
npm install          # Install root devDependencies
npm run dev          # Starts server (5000) + client (3000)
```

**Option B — Run separately in two terminals:**

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm start
```

### 4. Open the App

Visit **http://localhost:3000** in your browser.

## Usage Flow

1. **Register** — Create an account on the Register page
2. **Create Room** — Click "Create Room" on the Dashboard
3. **Share Code** — Copy the room code (e.g., `ab3k-m7qr-x2np`)
4. **Join** — Open another browser/tab, register a second user, and enter the room code
5. **Video Call** — HD video/audio starts automatically with WebRTC P2P

## API Endpoints

| Method | Endpoint                    | Auth | Description                |
| ------ | --------------------------- | ---- | -------------------------- |
| POST   | `/api/auth/register`        | No   | Create account             |
| POST   | `/api/auth/login`           | No   | Login                      |
| POST   | `/api/auth/refresh`         | No   | Refresh access token       |
| POST   | `/api/auth/logout`          | No   | Logout                     |
| GET    | `/api/auth/me`              | Yes  | Get profile                |
| POST   | `/api/sessions`             | Yes  | Create session             |
| GET    | `/api/sessions`             | Yes  | List user's sessions       |
| GET    | `/api/sessions/:id`         | Yes  | Get session by ID          |
| GET    | `/api/sessions/room/:code`  | Yes  | Find session by room code  |
| POST   | `/api/sessions/:id/join`    | Yes  | Join session               |
| POST   | `/api/sessions/:id/end`     | Yes  | End session                |
| GET    | `/api/ice/servers`          | Yes  | Get ICE server config      |
| GET    | `/api/health`               | No   | Health check               |

## Socket.IO Events

### Client → Server

| Event                    | Payload                              | Description           |
| ------------------------ | ------------------------------------ | --------------------- |
| `room:join`              | `{ roomId, sessionId }`              | Join signaling room   |
| `room:leave`             | —                                    | Leave room            |
| `webrtc:offer`           | `{ offer, targetSocketId }`          | Send SDP offer        |
| `webrtc:answer`          | `{ answer, targetSocketId }`         | Send SDP answer       |
| `webrtc:ice-candidate`   | `{ candidate, targetSocketId }`      | Send ICE candidate    |
| `media:toggle-audio`     | `{ enabled }`                        | Toggle mic            |
| `media:toggle-video`     | `{ enabled }`                        | Toggle camera         |
| `media:screen-share`     | `{ sharing }`                        | Toggle screen share   |
| `chat:message`           | `{ message }`                        | Send chat message     |

### Server → Client

| Event                    | Payload                              | Description            |
| ------------------------ | ------------------------------------ | ---------------------- |
| `room:joined`            | `{ roomId, existingUsers }`          | Room join confirmed    |
| `room:user-joined`       | `{ socketId, userId, userName }`     | Peer joined            |
| `room:user-left`         | `{ socketId, userName }`             | Peer left              |
| `webrtc:offer`           | `{ offer, senderSocketId }`          | Incoming SDP offer     |
| `webrtc:answer`          | `{ answer, senderSocketId }`         | Incoming SDP answer    |
| `webrtc:ice-candidate`   | `{ candidate, senderSocketId }`      | Incoming ICE candidate |
| `chat:message`           | `{ id, senderId, senderName, ... }`  | Incoming chat message  |

## Docker Deployment

```bash
# Build and run
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f vossle-app
```

The app will be available at **http://localhost:5000**.

## Production Checklist

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values
- [ ] Set up SSL/TLS termination (nginx/Cloudflare)
- [ ] Deploy TURN server (coturn) for NAT traversal behind firewalls
- [ ] Replace in-memory stores with PostgreSQL/Redis
- [ ] Add rate limiting per user (currently per IP)
- [ ] Enable CORS only for your production domain
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Implement session recording pipeline (Phase 3)

## License

Proprietary — © 2026 Vossle. All rights reserved.
