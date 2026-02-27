# Open Session

When the user says "open session", "start session", or "/open-session", perform the following steps **in order**:

---

## Step 1 — Load Context Files

Read all of the following (in parallel for speed):
1. `SESSION_LOG.md` — full file, most recent entry first
2. `KNOWLEDGE_BASE.md` — project knowledge base
3. Memory files from the auto-memory directory:
   - `MEMORY.md` — quick reference and patterns
   - `architecture.md` — project structure and routing
   - `pricing.md` — business logic and pricing model
   - `deployment.md` — self-hosting transition plan

---

## Step 2 — Check Server & Project Health

Run these checks in parallel:
1. `ssh hampton-vps "docker ps --filter name=mygravelguy --format '{{.Names}}\t{{.Status}}'"` — check if MGG containers are running
2. `git status` — check for uncommitted changes
3. `git log --oneline -5` — recent commits

---

## Step 3 — Output a Session Briefing

Print exactly this format:

---

### Session Briefing — MyGravelGuy

**Last Session:** Session [N] on [date]
**State:** [2-3 sentence project state from last session log]

**Known Issues / Blockers from Last Session:**
- [bullets from last Known Issues section]

**Priority TODO (in order):**
1. [top priority]
2. [second priority]
3. [third priority]

**Key Context:**
- VPS: root@5.161.88.134 (SSH: `hampton-vps`)
- Supabase: `losrkjvrcambvgijfism`
- Stack: React 18 + Vite + Supabase + Tailwind/shadcn
- Current hosting: Lovable → transitioning to Hetzner VPS

**Server Status:**
- [Docker container status or "Not yet deployed to VPS"]

**Last Files Changed:**
- [list from last session log]

---

## Step 4 — Confirm Understanding

End with exactly:

> I've reviewed the session log and project context. What would you like to work on first, or should I start on priority #1?
