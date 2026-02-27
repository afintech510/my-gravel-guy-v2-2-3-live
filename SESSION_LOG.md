# MyGravelGuy Session Log

## Session 1 — 2026-02-27

### What Was Accomplished
- Complete codebase review and learning of the MyGravelGuy project
- Created comprehensive memory files (MEMORY.md, architecture.md, pricing.md, deployment.md)
- Created CLAUDE.md project guide
- Created `/open-session` and `/close-session` skills (`.claude/commands/`)
- Verified SSH connectivity to Hetzner VPS (`hampton-vps` → root@5.161.88.134)
- Updated `.claude/settings.local.json` with SSH and server permissions
- Assessed Hetzner VPS capacity for self-hosting (25GB free, 2.2GB RAM available)
- Identified transition plan from Lovable to self-hosted

### Decisions Made
- **Shared VPS**: Will share the existing Hetzner VPS (5.161.88.134) with Host Hampton — both are lightweight enough
- **Docker deployment**: MyGravelGuy will be a simple Docker container (multi-stage: node build → nginx serve static SPA)
- **Supabase stays**: Backend (DB, Auth, Edge Functions) stays on Supabase cloud — only the frontend static files move to VPS
- **Nginx integration**: Add a new server block to the existing nginx container for the MGG domain
- **Cloudflare SSL**: Use same Cloudflare Origin Certificate approach as Host Hampton

### Known Issues / Blockers
- Need to know the production domain name (mygravelguy.com?) to configure DNS and nginx
- Need to check current DNS provider and how domain is managed
- VPS has 25GB free disk and ~2.2GB available RAM — sufficient but should monitor
- Host Hampton already uses ports 80/443 via its nginx — MGG needs to be added as a virtual host

### Current Project State
Project fully reviewed and documented. SSH access to Hetzner VPS confirmed working. Ready to begin self-hosting transition — need domain/DNS details to proceed with nginx and Cloudflare configuration.

### Updated Priority TODO (in order)
1. Confirm domain name and DNS provider for MyGravelGuy
2. Create Dockerfile and docker-compose for MGG static site
3. Add MGG server block to Hetzner nginx config
4. Set up Cloudflare Origin Certificate for MGG domain
5. Deploy and test on VPS with staging subdomain
6. DNS cutover from Lovable to Hetzner
7. Verify all functionality post-migration

### Files Changed This Session
- `.claude/commands/open-session.md` — created (session start skill)
- `.claude/commands/close-session.md` — created (session end skill)
- `.claude/settings.local.json` — updated with SSH/server permissions
- `CLAUDE.md` — created (project guide for Claude Code)
- `SESSION_LOG.md` — created (this file)
