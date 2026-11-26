# Production handoff — LangGraph Social Agent

**Repo:** `fjkiani/langchain-social-agent`  
**Primary branch for CrisPRO:** `cursor/linkedin-crispro-org-0411` · PR https://github.com/fjkiani/langchain-social-agent/pull/2  
**TikTok branch:** `cursor/add-tiktok-0411` · PR https://github.com/fjkiani/langchain-social-agent/pull/1  
**Zeta / portal / Hygraph / bridge:** https://github.com/fjkiani/zeta-tech/blob/cursor/notebooklm-social-bridge-0411/docs/PRODUCTION-HANDOFF.md  
**Bridge ops:** https://github.com/fjkiani/zeta-tech/blob/cursor/notebooklm-social-bridge-0411/apps/notebooklm-social-agent-bridge/HANDOFF.md

Ownership split: **this doc** = LangGraph graphs, Arcade/OAuth, platform clients, scheduling, specialized agents, Slack/LangSmith, agent-side production checklist. **zeta docs** = portal UI, Hygraph schema, bridge HTTP surface, multi-school LMS.

---

## 1. Current architecture (as-built)

### Graphs (`langgraph.json`)

| Graph id                              | Entry                                             | Role                                             |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `ingest_data`                         | `src/agents/ingest-data/ingest-data-graph.ts`     | Slack/content ingest                             |
| `generate_post`                       | `src/agents/generate-post/generate-post-graph.ts` | URL → report → post → HITL → schedule            |
| `upload_post`                         | `src/agents/upload-post/index.ts`                 | Immediate Twitter + LinkedIn (+ TikTok on PR #1) |
| `reflection`                          | `src/agents/reflection/index.ts`                  | Reflections store                                |
| `generate_thread`                     | `src/agents/generate-thread/index.ts`             | Thread posts + HITL                              |
| `curate_data`                         | `src/agents/curate-data/index.ts`                 | Source curation                                  |
| `verify_reddit_post` / `verify_tweet` | respective graphs                                 | Relevance filters                                |
| `supervisor`                          | `src/agents/supervisor/supervisor-graph.ts`       | Curate → reports → post type → generate          |
| `generate_report`                     | `src/agents/generate-report/index.ts`             | Report generation                                |

### Runtime

| Item             | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Dev server       | `yarn langgraph:in_mem:up` → `@langchain/langgraph-cli dev --port 54367`   |
| Persistent local | `yarn langgraph:up` → `up --watch --port 54367`                            |
| Auth helper      | `yarn start:auth` → `src/clients/auth-server.ts` (default Express `:3000`) |
| Env file         | `.env` (from `.env.full.example` / `.env.quickstart.example`)              |
| Node             | `>=18` (langgraph.json pins `node_version: 20`)                            |

### LinkedIn client (`src/clients/linkedin.ts`)

- `createTextPost` → `POST /v2/ugcPosts` `shareMediaCategory: NONE`
- `createImagePost` → `assets?action=registerUpload` + feedshare-image
- `createVideoPost` → feedshare-video + `waitForAssetReady` + ugcPosts VIDEO
- `fromArcade(userId, { postToOrganization, organizationId })` scopes:
  - member: `w_member_social`
  - org: `w_member_social` + `w_organization_social`
- Org author URN: `urn:li:organization:${LINKEDIN_ORGANIZATION_ID}` (CrisPRO **`107412290`**)

### Verified live (2026-11-26)

| Type      | URN                                  | Notes                                           |
| --------- | ------------------------------------ | ----------------------------------------------- |
| Text org  | `urn:li:share:7531543177888116736`   | `scripts/post-crispro-org.mts`                  |
| Video org | `urn:li:ugcPost:7531543923190833152` | Hygraph graphassets mp4 `Reasoning_Biology.mp4` |
| Auth      | `ORG_AUTH_OK`                        | After fresh Arcade authorize with org scopes    |

### What does not work on this branch

| Item                                  | Reality                                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instagram                             | **No code** — no client, no env, no graph node.                                                                                                            |
| TikTok on `linkedin-crispro-org-0411` | **Absent** — lives on PR #1 only; merge/rebase required.                                                                                                   |
| TikTok OAuth                          | Often pending; unaudited apps forced `TIKTOK_PRIVACY_LEVEL=SELF_ONLY`; media domain must be TikTok-verified.                                               |
| NotebookLM googleusercontent URLs     | Explicitly unsupported for video fetch.                                                                                                                    |
| Asset status GET                      | Returns **400 Invalid asset id** for digitalmediaAsset URNs; client logs and proceeds; posts still succeed.                                                |
| `schedulePost` API URL                | Hardcodes `http://localhost:${process.env.PORT}` in `src/agents/generate-post/nodes/schedule-post/index.ts` — breaks when LangGraph is not that host/port. |
| `upload_post` error model             | Catches Twitter/LinkedIn errors, Slack-notifies, returns `{}` — callers (bridge) may see “success” run with failed destination.                            |

---

## 2. Brittleness matrix

| Area                             | Symptom                                        | Root cause                                     | Fix                                                                                                                                              | Pri          |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| Arcade stale auth URLs           | `flow_not_found` in browser                    | Expired single-use flow id                     | Re-run `scripts/authorize-linkedin-org.mts`; never reuse URL                                                                                     | P0           |
| Org vs member tokens             | 403 on company page                            | Token without `w_organization_social`          | Authorize with org scopes; confirm admin of 107412290                                                                                            | P0           |
| Dual LangGraph / `.env` drift    | Intermittent auth                              | Two processes or unsynced env                  | One CLI; restart after auth; never copy tokens into bridge                                                                                       | P0           |
| LangGraph localhost-only publish | Bridge 503 in Cursor publish                   | `LANGGRAPH_API_URL=http://localhost:54367`     | Host LangGraph Cloud/self-host; update publish secret                                                                                            | P0           |
| schedule-post localhost          | Scheduled runs never fire remotely             | `Client({ apiUrl: http://localhost:${PORT} })` | **Fixed on branch**: `LANGGRAPH_API_URL` env wins, localhost fallback for dev (schedule-post + rewrite-post)                                     | ~~P0~~ FIXED |
| LinkedIn asset poll 400          | Noise / false failure perception               | Wrong/legacy assets GET encoding               | Keep proceed-on-timeout; evaluate LinkedIn Videos API / correct status resource                                                                  | P1           |
| No public lesson mp4             | Video path unused for classroom content        | Content pipeline stores YouTube in `videoUrl`  | Hygraph `videoFile` CDN; `scripts/resolve-hygraph-video.mts`                                                                                     | P0           |
| upload_post swallows errors      | Bridge shows ok while LinkedIn failed          | try/catch without rethrow                      | **Fixed on branch**: per-platform `results` array in state annotation (`{platform, attempted, ok, urn?, error?}`); failures still Slack-notified | ~~P0~~ FIXED |
| Twitter always attempted         | Twitter errors on every LinkedIn-only post     | `uploadPost` always enters Twitter block       | **Fixed on branch**: `platforms` configurable allowlist (unset = both, backwards compatible); skipped platforms returned as `attempted:false`    | ~~P1~~ FIXED |
| HITL bypass via bridge           | Unreviewed posts go live                       | Bridge → `upload_post` direct                  | Route production through `generate_post` interrupt or bridge approval                                                                            | P1           |
| Secrets                          | Risk of committing `.env`                      | Local dotenv                                   | Keep gitignored; use `.env.full.example` names only                                                                                              | P0           |
| Rate limits                      | 429 / intermittent fail                        | Platform quotas                                | Scheduler spacing; backoff; Slack alert                                                                                                          | P2           |
| CI format/build                  | PR checks red overlapping main Gemini debt     | Pre-existing LLM adapter migration             | Isolate PR files or finish Gemini response.parsed migration                                                                                      | P1           |
| fahadkiani Vercel                | Dead-end hosting                               | Wrong repo for bridge                          | Ignore; zeta-tech canonical                                                                                                                      | P2           |
| TikTok branch divergence         | CrisPRO video on one branch, TikTok on another | Parallel PRs                                   | Rebase/merge #1 into main then #2 (or reverse) carefully                                                                                         | P1           |

---

## 3. Production readiness checklist

### Backend / agent

- [ ] Durable LangGraph deployment (not only in-memory dev)
- [ ] `LANGGRAPH_API_URL` consistent across schedule-post, bridge, crons
- [ ] `upload_post` returns `{ twitter?, linkedin?, tiktok?, errors[] }`
- [ ] Platform feature flags
- [ ] Org Arcade auth documented in runbook + weekly check cron

### Auth

- [ ] `ARCADE_API_KEY`, `LINKEDIN_USER_ID`, `USE_ARCADE_AUTH=true`
- [ ] `POST_TO_LINKEDIN_ORGANIZATION=true`, `LINKEDIN_ORGANIZATION_ID=107412290`
- [ ] Twitter path: either Arcade user **or** `USE_TWITTER_API_ONLY` + API keys
- [ ] TikTok (after merge): `TIKTOK_CLIENT_KEY/SECRET`, tokens via `yarn start:auth`
- [ ] Instagram: N/A until implemented

### Observability

- [ ] LangSmith: `LANGCHAIN_API_KEY` + `LANGCHAIN_TRACING_V2=true`
- [ ] Slack: `SLACK_BOT_OAUTH_TOKEN` + `SLACK_CHANNEL_ID` (schedule + failure messages exist)
- [ ] Structured JSON logs for URN + thread/run ids

### CI/CD

- [ ] `yarn format:check`, `yarn build`, `yarn test` green on branch
- [ ] Do not commit secrets; scan PR diffs
- [ ] Cron scripts: `yarn cron:create|list|delete` against prod API URL

### Multi-tenant / rollback

- [ ] Today: single-operator env users (`LINKEDIN_USER_ID`) — not multi-tenant
- [ ] Rollback: redeploy previous LangGraph revision; revoke Arcade connection if compromised
- [ ] Manual LinkedIn delete of bad URN via UI (no delete API wrapper in repo)

---

## 4. Agentic product design

Existing supervisor (`src/agents/supervisor/supervisor-graph.ts`):

`ingestData (curate_data)` → parallel `generateReport` → `groupReports` → `determinePostType` → `generatePosts` → END.

**Target specialized agents** (new graphs or supervisor nodes):

| Agent             | Graph / node home                   | Inputs                         | Outputs                   | Tools                                                            | Human gate                        |
| ----------------- | ----------------------------------- | ------------------------------ | ------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| Supervisor        | existing `supervisor`               | Cron / Slack / manual          | Fan-out to specialists    | curate, report, generate                                         | Inbox on generate_post            |
| GTM Strategist    | **new** `gtm_strategist`            | Hygraph lesson inventory, KPIs | Calendar JSON             | Hygraph GraphQL (`HYGRAPH_ENDPOINT` + token), optional FireCrawl | Accept calendar                   |
| Content Curator   | `generate_post` / `generate_report` | URL or lesson transcript       | `post`, `image`, `report` | FireCrawl, find-images, LLMs                                     | Edit/rewrite/ignore               |
| Platform Poster   | `upload_post`                       | `post` + `image`               | Platform ids              | LinkedIn/Twitter/TikTok clients                                  | Optional final accept             |
| Compliance/Brand  | **new** before schedule             | Draft + brand rules            | `{ ok, issues[] }`        | LLM + static doctrine text                                       | Block schedule on fail            |
| Analytics Monitor | **new** cron graph                  | Recent URNs                    | Advice + alerts           | Platform analytics (UNKNOWN access), Slack                       | Escalation only                   |
| Scheduler         | `schedule-post` + `scripts/crons/*` | `scheduleDate`                 | Delayed `upload_post`     | LangGraph SDK `afterSeconds`                                     | P1/P2/P3 date rules in human-node |

---

## 5. GTM Strategist agent

**Role:** Propose CrisPRO (and later school) content calendars from NotebookLM/Hygraph inventory; hand off to `generate_post` or `upload_post`.

**Prompt pattern:**

```
src/agents/gtm-strategist/
  index.ts          # graph
  state.ts          # calendar rows annotation
  prompts.ts        # system + few-shot
  nodes/propose.ts
  nodes/handoff.ts  # creates generate_post or upload_post runs
```

**KPIs (starter):** posts/week, % video, lesson-link CTR (portal), auth-failure count (ops KPI).

**Handoff mechanics:**

1. For each approved row with public `videoUrl` → `client.runs.create(thread, "upload_post", { input: { post, image: { imageUrl, mimeType: "video/mp4" } }, config: { configurable: { postToLinkedInOrganization: true, linkedInOrganizationId: "107412290" } }, afterSeconds })`.
2. For URL-based thought leadership → `generate_post` with HITL.
3. Never auto-post without flag `GTM_AUTO_POST=true` (default false).

**Content source:** zeta Hygraph project `cm65g7pxd09kx07my82376f33`; helper `scripts/resolve-hygraph-video.mts`.

---

## 6. Multi-platform pipeline

### LinkedIn (member + org) — **production-proven for CrisPRO**

| Path           | Files                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Client         | `src/clients/linkedin.ts`                                                                                                                   |
| Upload routing | `src/agents/upload-post/index.ts` (video MIME / extension → `createVideoPost`)                                                              |
| Auth interrupt | `src/agents/generate-post/nodes/auth-socials.ts` + `src/agents/shared/auth/linkedin.js`                                                     |
| Scripts        | `scripts/authorize-linkedin-org.mts`, `post-crispro-org.mts`, `resolve-crispro-org.mts`, `check-linkedin-auth.mts`, `e2e-linkedin-post.mts` |
| Constants      | `src/agents/generate-post/constants.ts` → `POST_TO_LINKEDIN_ORGANIZATION`, `LINKEDIN_ORGANIZATION_ID`                                       |

Media: public HTTPS URL fetched server-side. Org posts need company admin + org scopes.

### Twitter/X — **implemented, env-dependent**

| Mode     | Env                                                            |
| -------- | -------------------------------------------------------------- |
| Arcade   | `USE_ARCADE_AUTH=true`, `TWITTER_USER_ID`, optional token pair |
| API only | `USE_TWITTER_API_ONLY=true` + Twitter developer keys           |

Client: `src/clients/twitter/client.ts`. Always invoked inside `upload_post` today.

### TikTok — **code on PR #1, not on CrisPRO branch**

| Piece            | Path (on `cursor/add-tiktok-0411`)                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client           | `src/clients/tiktok.ts` — Login Kit + Content Posting `PULL_FROM_URL`                                                                                       |
| Auth routes      | `src/clients/auth-server.ts` `/auth/tiktok`                                                                                                                 |
| Interrupt helper | `src/agents/shared/auth/tiktok.ts`                                                                                                                          |
| Upload hook      | `upload_post` when `TikTokClient.isConfigured()`                                                                                                            |
| Env              | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`, `TIKTOK_ACCESS_TOKEN`, `TIKTOK_REFRESH_TOKEN`, `TIKTOK_OPEN_ID`, `TIKTOK_PRIVACY_LEVEL` |
| Tests            | `src/clients/tests/tiktok.test.ts`                                                                                                                          |

**Extension plan:** merge TikTok PR → add configurable `platforms` allowlist → bridge passes platforms → skip unconfigured quietly → return statuses.
**Shipped (2026-11-26, this branch):** `platforms` allowlist + per-platform `results` in state (URNs captured from `createTextPost`/`createVideoPost`/`createImagePost`). Verified: `tsc --noEmit` clean, CI unit tests 29/29, prettier/eslint clean. No live posts made.

### Instagram — **stub only (honest)**

No files. Feature flag suggestion for later: `ENABLE_INSTAGRAM=false`. Implementation would need Meta Graph API content publishing + Business account — mark UNKNOWN until app review.

---

## 7. Hygraph extension (agent-side consumption)

Agent already documents optional:

```
HYGRAPH_ENDPOINT=https://api-us-west-2.hygraph.com/v2/cm65g7pxd09kx07my82376f33/master
HYGRAPH_TOKEN=…
VIDEO_URL=https://….graphassets.com/…
```

`scripts/resolve-hygraph-video.mts` queries `mediaItem(where: { slug }) { videoFile { url mimeType fileName } }` and falls back to glassbox public mp4.

**Needed from zeta CMS (consumed here):** absolute `video/mp4` CDN URLs; optional webhook to trigger `gtm_strategist` or `generate_post`. PDF: caption link only until document UGC exists.

---

## 8. Frontend content ops (agent contracts)

Bridge and future portal `/social` should call:

| Need        | API                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------- |
| Health      | LangGraph `/assistants/search` (bridge already)                                              |
| Post now    | `POST /threads` + `POST /threads/{id}/runs` assistant `upload_post`                          |
| Schedule    | `runs.create(..., { afterSeconds })` after fixing API URL                                    |
| HITL        | Agent Inbox against `generate_post` interrupts (`src/agents/generate-post/nodes/human-node`) |
| Auth status | Run `authorize-linkedin-org.mts` or expose thin status route (not built)                     |

CrisPRO vs personal: configurable `postToLinkedInOrganization` + `linkedInOrganizationId` (bridge already sends these).

---

## 9. LangGraph extension plan

| Addition               | Detail                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Fix schedule client    | **Done**: `schedule-post/index.ts` now uses `process.env.LANGGRAPH_API_URL                             |     | http://localhost:${PORT}` |
| `upload_post` state    | **Done**: `results` annotation (+ `platforms: string[]` configurable); errors still surfaced via Slack |
| `gtm_strategist` graph | Register in `langgraph.json`                                                                           |
| `monitor_auth` cron    | `scripts/crons/create-cron.ts` targeting new graph weekly                                              |
| `advise` node          | LLM summary of failures from Slack/LangSmith — new                                                     |
| Multi-platform fan-out | Parallel Send to platform-specific nodes instead of one try/catch blob                                 |
| HITL                   | Keep `interrupt()` in auth-socials + human-node; Agent Inbox setup in README                           |
| Feature flags          | Env `ENABLE_TWITTER_UPLOAD`, `ENABLE_TIKTOK_UPLOAD`, `ENABLE_INSTAGRAM_UPLOAD`                         |

---

## 10. Dashboard LLM assistant (tools backed by this repo)

| Tool                  | Backing                                              |
| --------------------- | ---------------------------------------------------- |
| `check_linkedin_auth` | Arcade `auth.start` / authorize script               |
| `draft_from_url`      | `generate_post` (with HITL)                          |
| `post_to_crispro`     | `upload_post` + org configurable                     |
| `list_scheduled`      | `yarn get:scheduled_runs` / SDK search               |
| `resolve_video`       | `resolve-hygraph-video.mts` logic                    |
| `metrics`             | UNKNOWN — need LinkedIn Marketing API product access |

Guardrails: no tool returns raw access tokens; `post_to_crispro` requires role + confirmation; dry-run flag default in staging.

---

## 11. Monitors & advising

| Signal           | Current                          | Prod                                                           |
| ---------------- | -------------------------------- | -------------------------------------------------------------- |
| Upload failure   | Slack message from `upload_post` | Keep + page on repeated fail                                   |
| Schedule created | Slack from `schedule-post`       | Keep                                                           |
| Auth pending     | Manual                           | Cron → Slack with fresh authorize instructions (not stale URL) |
| Engagement       | None                             | Analytics Monitor (future)                                     |
| LangSmith traces | Optional                         | Required in prod                                               |

---

## 12. 90-day build plan (agent column)

| Week  | Agent/BE milestone                                                   |
| ----- | -------------------------------------------------------------------- |
| 1     | Deploy LangGraph; fix `schedule-post` API URL; platform result state |
| 2     | Feature flags; stop mandatory Twitter on LinkedIn-only               |
| 3     | Merge TikTok; e2e OAuth; verified domain media                       |
| 4     | GTM Strategist graph v0 + Hygraph pull                               |
| 5     | Compliance node + doctrine text                                      |
| 6     | Auth monitor cron                                                    |
| 7     | Instagram spike go/no-go                                             |
| 8     | Harden asset status / Videos API                                     |
| 9     | Load/rate-limit policy                                               |
| 10–12 | Eval suite for captions; runbooks; chaos (kill Arcade)               |

FE weeks aligned in zeta `docs/PRODUCTION-HANDOFF.md` §12.

---

## 13. How to run / extend (cheat sheet)

```bash
cd /path/to/langchain-social-agent
cp .env.full.example .env   # fill secrets locally — never commit

yarn install
yarn langgraph:in_mem:up    # :54367

# Org LinkedIn
yarn tsx scripts/authorize-linkedin-org.mts
yarn tsx scripts/check-linkedin-auth.mts
DRY_RUN=1 yarn tsx scripts/post-crispro-org.mts
yarn tsx scripts/post-crispro-org.mts
VIDEO_URL='https://us-west-2.graphassets.com/cm65gc2pl00vr08gs2em34vmw/cmkrjbuftdycb07lpstjklcss' \
  yarn tsx scripts/post-crispro-org.mts
yarn tsx scripts/resolve-hygraph-video.mts

# Upload graph e2e (needs server up)
yarn tsx scripts/e2e-upload-post.mts

# Crons
yarn cron:list
yarn get:scheduled_runs

# TikTok (checkout cursor/add-tiktok-0411)
yarn start:auth             # open /auth/tiktok
```

**Bridge pairing:**

```bash
LANGGRAPH_API_URL=http://localhost:54367 node \
  /path/to/zeta-tech/apps/notebooklm-social-agent-bridge/server.js
```

**Key env (names):** `ARCADE_API_KEY`, `USE_ARCADE_AUTH`, `LINKEDIN_USER_ID`, `POST_TO_LINKEDIN_ORGANIZATION`, `LINKEDIN_ORGANIZATION_ID`, `TWITTER_*`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `SLACK_*`, `LANGGRAPH_API_URL`, `VIDEO_URL`, `DRY_RUN`, optional `HYGRAPH_*`, TikTok `TIKTOK_*` on TikTok branch.

---

## 14. Anti-sandbag appendix

| Do not claim                           | Until                                              |
| -------------------------------------- | -------------------------------------------------- |
| Instagram supported                    | Client + OAuth + upload node merged                |
| TikTok live on CrisPRO branch          | PR #1 merged/rebased and OAuth completed           |
| Asset READY polling reliable           | Non-400 status API or confirmed alternative        |
| schedule_post works in prod            | `LANGGRAPH_API_URL` used instead of localhost PORT |
| upload_post success ⇒ LinkedIn success | State returns per-platform results                 |
| YouTube/Drive URL is LinkedIn video    | Never                                              |
| WPL cookie is API token                | Never — `LINKEDIN_WPL_COOKIE` unused by client     |
| Multi-tenant SaaS ready                | Per-tenant secrets + ACL (absent)                  |
| “Arcade TikTok”                        | Arcade has no TikTok provider here — native only   |

**Proof artifacts (internal to Cursor project, not git):** live text/video verify notes under the project store (`crispro-org-live-text-verify.md`, `crispro-org-video-post-result.md`).
