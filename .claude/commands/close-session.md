# Close Session

When the user says "close session", "end session", or "/close-session", perform the following steps **in order**:

---

## Step 1 — Review This Session

Scan and summarize:
- All files created, modified, or deleted this session
- All commands run and their outcomes (success / failure / partial)
- Architectural or logic decisions made
- Blockers encountered and how (or whether) they were resolved
- Any unfinished work or known issues

---

## Step 2 — Update SESSION_LOG.md

Read `SESSION_LOG.md` in the project root (create it if it doesn't exist).
Append a new session entry in this format:

```md
## Session [N] — [Date]

### What Was Accomplished
- [bullet list of completed work]

### Decisions Made
- [architectural, naming, logic decisions — and WHY]

### Known Issues / Blockers
- [anything broken, incomplete, or unclear]

### Current Project State
[2-3 sentence snapshot of where things stand]

### Updated Priority TODO (in order)
1. [Most urgent next tasks]
2. [What's next in the overall plan]

### Files Changed This Session
- [list key files and what changed]
```

Increment session number N based on the number of existing entries.
Use today's date from the system.

---

## Step 3 — Update Memory Files

Update the auto-memory files if any new patterns, conventions, or important learnings were discovered:
- `MEMORY.md` — quick reference updates
- `architecture.md` — if structure changed
- `pricing.md` — if business logic changed
- `deployment.md` — if deployment/hosting progress was made

---

## Step 4 — Output a Closing Summary

Print exactly this format (fill in the brackets):

> Session [N] closed. SESSION_LOG.md updated.
> State: [one sentence on where things stand]
> Next priority: [top 1-2 tasks for next session]

---

## Step 5 — Generate and Print the Opening Prompt

Generate the opening prompt for the next session. Print it inside a clearly labeled markdown code block so it can be copied and pasted directly into the next Claude Code session.

The opening prompt must:
1. Reference SESSION_LOG.md and the most recent entry
2. List the top 2-3 priority tasks
3. Remind the agent to read memory files
4. Be self-contained — no assumed context

Format:
````
```
[Opening prompt here — self-contained, copy-paste ready]
```
````
