# Finix - Social Finance Platform

## Overview
Finix is a full-stack web application for financial social networking.
Built with a Monorepo structure using:
- **Frontend**: React, Vite, Tailwind, Shadcn/UI, Zustand
- **Backend**: NestJS, Prisma, SQLite (dev)
- **Shared**: TypeScript Zod Schemas

## Prerequisites
- Node.js (v18+)
- npm (v9+)

## Project Structure
- `backend`: Wrapper to run the backend
- `frontend`: Wrapper to run the frontend
- `apps/api`: NestJS Backend (real code)
- `apps/web`: React Frontend (real code)
- `packages/shared`: Shared types and logic

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Default database is SQLite (no extra service needed).
   - `DATABASE_URL` is already set in `apps/api/.env`:
     ```bash
     DATABASE_URL="file:./dev.db"
     ```
   - For production, switch to PostgreSQL and update `DATABASE_URL`.

3. **Prisma Migration & Seeding (optional)**
   - The API runs `prisma migrate deploy` automatically on `npm start`.
   - To load demo data:
     ```bash
     cd backend
     npm run seed
     ```

4. **Run Development**
   - Backend:
     ```bash
     cd backend
     npm start
     ```
   - Frontend:
     ```bash
     cd frontend
     npm run dev
     ```
   - API runs on `http://localhost:3001`
   - Frontend runs on `http://localhost:5173`

## Features
- **Auth**: JWT Authentication with Argon2 hashing.
- **Market Data**: Mocked live prices and Dollar MEP conversion.
- **Charts**: Integrated TradingView Widgets.
- **Portfolio**: Manual portfolio tracking with Currency Toggle (USD/ARS).
- **Influencers**: Role-based badges and sections.

## Demo Credentials
- **User**: `user@finix.com` / `password123`
- **Influencer**: `trader@finix.com` / `password123`
- **Admin**: `admin@finix.com` / `password123`

## Deployment
- **VPS**: Install Node, PM2, and Nginx.
- **Build**: Run `npm run build` in root.
- **Serve**: 
  - API: `node apps/api/dist/main.js` (Use PM2)
  - Web: Serve `apps/web/dist` folder via Nginx.
