# 📘 MatchDay - Project Documentation

## 1. Overview

**MatchDay** is a mobile-first web application designed to simplify the organization of amateur sports matches. It addresses common challenges in organizing friendly games, such as tracking participation, managing teams, and handling logistics. Additionally, it introduces gamification elements like voting and skill ratings to make the experience more engaging.

## 2. Tech Stack

The project is built using the **MEVN** stack (MySQL, Express.js, Vue.js, Node.js).

### Frontend

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **UI Library:** Ionic Vue (Mobile-native look and feel)
- **State Management:** Vuex 4
- **Routing:** Vue Router
- **HTTP Client:** Axios

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **ORM/Query Builder:** `mysql2` (using Promises)
- **Authentication:** JSON Web Tokens (JWT)
- **File Uploads:** Multer

## 3. Key Features

### 🏟️ Match Management

- **Create Matches:** Organizers can schedule matches specifying date, time, location, price, and sport type.
- **Supported Sports:** Soccer ⚽, Volleyball 🏀, Padel 🎾, Tennis 🎾.
- **Dynamic Player Limits:**
  - Soccer: 10 players
  - Volleyball: 12 players
  - Padel/Tennis: 4 players
- **Status Workflow:** Open -> Locked -> Voting -> Finished.

### 👥 Participation System

- **Join/Leave:** Users can sign up for matches.
- **Waitlist:** Automatic waitlist system when the maximum number of players is reached. If a spot frees up, the system (currently manual/logic based) handles the overflow.
- **Team Generation:** Automatic team balancing based on players' skill ratings.

### 🏆 Gamification & Stats

- **Voting System:** After a match finishes, players can vote for the "MVP" and rate others' performance.
- **Skill Rating:** Dynamic ELO-like rating updated based on votes received.
- **Profile Stats:**
  - Total Matches Played
  - MVP Awards count
  - Recent Rating history
  - Visual badges for performance

### 🔔 Notifications

- **In-App System:** Real-time-like notifications for:
  - Match status changes (e.g., "Voting started")
  - Team generation alerts
- **Unread Badge:** Visual indicator on the main dashboard.

## 4. Database Schema

### `users`

- Stores user credentials, profile info, and calculated skill rating.

### `matches`

- Stores match details including `sport_type`, `max_players`, and `status`.

### `participants`

- Links users to matches.
- Tracks `status` ('confirmed', 'waitlist', 'maybe', 'declined') and assigned `team` ('Team A', 'Team B').

### `votes`

- Stores ratings and tags (e.g., "MVP") given by users to other players after a match.

### `notifications`

- Stores system messages for users, linked to specific matches.

## 5. API Reference

### Authentication

- `POST /api/auth/register` - Create a new account
- `POST /api/auth/login` - Authenticate and receive JWT

### Matches

- `GET /api/matches` - List all matches
- `POST /api/matches` - Create a new match
- `GET /api/matches/:id` - Get match details (including participants)
- `POST /api/matches/:id/join` - Join a match (handles waitlist logic)
- `PUT /api/matches/:id/status` - Update match status (Open/Voting/Finished)
- `POST /api/matches/:id/generate-teams` - Generate balanced teams

### Users

- `GET /api/users/profile` - Get current user profile
- `GET /api/users/stats` - Get advanced user statistics (MVP, Matches played)
- `POST /api/users/avatar` - Upload profile picture

### Notifications

- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/read-all` - Mark all as read

## 6. Deployment

The application is designed to be deployed on a Linux server (e.g., Ubuntu) using Nginx as a web server and reverse proxy.

- **Frontend:** Built static files served via Nginx (configured at `/match-day` or root).
- **Backend:** Node.js process managed by PM2 (running on port 3000).
- **Database:** MySQL instance.

See `DEPLOY.md` for detailed deployment instructions.
