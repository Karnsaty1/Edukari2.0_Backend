# Edukari Backend

Node + Express backend scaffold for the Edukari React platform.

## Features

- MongoDB connection via `MONGODB_URI`
- JWT-based authentication
- Local email/password login
- Google sign-in token verification
- Access + refresh token rotation
- Module-based folder structure

## Environment

Copy `.env.example` to `.env` and fill in your values.

## Run

```bash
npm install
npm run dev
```

## Auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`

## MongoDB

Use the same `MONGODB_URI` format for Atlas or a local MongoDB instance.
