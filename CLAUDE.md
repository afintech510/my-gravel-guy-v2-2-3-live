# MyGravelGuy — Claude Code Project Guide

## Project Overview
MyGravelGuy is a live React/TypeScript web application for a gravel and construction materials delivery business. Currently hosted on the Lovable platform, transitioning to self-hosted on a Hetzner VPS.

## Quick Reference
- **Supabase**: `losrkjvrcambvgijfism` — https://losrkjvrcambvgijfism.supabase.co
- **VPS**: `ssh hampton-vps` → root@5.161.88.134
- **Dev server**: `npm run dev` → http://localhost:8080
- **Build**: `npm run build` → dist/

## Stack
React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui, Supabase, React Query, React Router v6, React Hook Form + Zod, Stripe, Twilio, Resend, Mapbox

## Important Rules
- This is a **live production website** — test changes carefully
- Supabase is the backend (DB, Auth, Edge Functions) — no server-side code in this repo
- All client env vars use `VITE_` prefix
- Path alias: `@/` → `./src/`
- The `KNOWLEDGE_BASE.md` has detailed project documentation — read it for deep context

## Session Workflow
- Start sessions with `/open-session` — loads context, checks server, outputs briefing
- End sessions with `/close-session` — logs progress, updates memory, generates next prompt

## Server Access
- SSH alias `hampton-vps` connects to the Hetzner VPS (shared with Host Hampton project)
- SSH key: `~/.ssh/id_ed25519` (ed25519)
- Server runs Docker Compose with nginx reverse proxy

## Key Directories
- `src/pages/` — Route pages
- `src/components/` — Feature-grouped React components
- `src/services/` — Business logic and API calls
- `src/hooks/` — Custom React hooks
- `src/contexts/` — React Context providers
- `src/utils/` — Helper functions
- `supabase/functions/` — Edge Functions (deployed separately)
