# Railway Ticket Booking System

An educational, full-stack railway ticket booking application demonstrating a minimal production-like architecture: an Express.js backend, a static vanilla-JavaScript frontend, and SQL-based persistence. It includes user authentication, train search, booking management, admin controls, and ticket PDF generation.

## Table of contents

- Overview
- Features
- Architecture
- Quick start
- Configuration
- Database
- API (summary)
- Frontend
- Development
- Contributing
- License & contact

## Overview

This repository contains a lightweight railway ticket booking demo intended for learning and prototyping. It is not hardened for production — use it as a starting point for feature development or as a reference implementation.

## Features

- User registration, authentication and session middleware
- Search trains and select seats
- Create and manage bookings
- Admin endpoints to manage trains and bookings
- Generate printable ticket PDFs

## Architecture

- Backend: Node.js + Express. Routes are under `backend/routes/` and logic is implemented in `backend/controllers/`.
- Frontend: static HTML/CSS/JS in `frontend/` that calls backend APIs.
- Database: relational SQL schema in `database/schema.sql`.

## Quick start

1. Install prerequisites:

	- Node.js (14+)
	- npm
	- A SQL database (MySQL / MariaDB / Postgres)

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Create the database and apply the schema located at `database/schema.sql`.

4. Configure environment variables (see next section).

5. Start the server:

```bash
npm start
# or (for development with nodemon)
npx nodemon server.js
```

Server defaults to port `3000` unless overridden by `PORT`.

## Configuration

Place runtime configuration in environment variables or a `.env` file loaded by your preferred loader. Minimal variables used by the backend:

- `PORT` — server port (default 3000)
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` — database connection
- `JWT_SECRET` — JWT signing secret (if JWT auth is enabled)

Example `.env` (create at `backend/.env`):

```
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=yourpassword
DB_NAME=railwaydb
JWT_SECRET=replace-with-secure-secret
```

Also check `backend/config/db.js` for the DB client and connection configuration.

## Database

The SQL schema and initial table definitions are in `database/schema.sql`. Run the file against your database to create the required tables. Example with MySQL:

```bash
mysql -u root -p railwaydb < database/schema.sql
```

Add sensible production migrations and seed data before real use.

## API (summary)

The backend exposes REST endpoints under `/api/*`. Key areas:

- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — obtain a session or JWT
- `GET /api/trains` — list/search trains
- `GET /api/trains/:id` — train details
- `POST /api/bookings` — create a booking
- `GET /api/bookings/me` — user bookings
- Admin routes under `/api/admin/*` for train/booking management

Refer to the route files in `backend/routes/` and implementation in `backend/controllers/` for precise parameters, validation rules, and response formats.

## Frontend

The static frontend is in `frontend/`. To point the frontend at a backend instance, edit the API base URL in `frontend/js/config.js` (or equivalent) and open `frontend/index.html` in a browser or serve via a static HTTP server.

For local development you can serve `frontend/` files using `npx http-server frontend` or similar.

## Development

- Use `nodemon` for backend auto-reload during development: `npx nodemon server.js`.
- Add unit and integration tests (currently not included).
- Linting and formatting are recommended (ESLint + Prettier).

## Deployment notes

- Secure `JWT_SECRET` and DB credentials via environment variables or secret manager.
- Add proper CORS policy for the frontend origin.
- Use HTTPS and secure cookie/session settings for production.

## Contributing

Contributions are welcome. Please open issues or PRs with clear descriptions. Consider the following:

- Add tests for backend controllers
- Harden authentication and authorization
- Replace static frontend with SPA framework (optional)

## License & contact

This project is provided for educational purposes. No license specified — add one if you plan to publish.

Questions or feedback? Open an issue or contact the repository owner.

