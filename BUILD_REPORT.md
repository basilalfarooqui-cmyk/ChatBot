# SIH26088 Chatbot — Complete Project Report

## What This Is

A multilingual (23 Indian languages) chatbot for cooperative governance and
legal assistance — React Native (Expo) frontend, Node/Express backend with a
Gemini + Supabase RAG pipeline, deployed and live.

- **App:** `D:\Farooqui\ChatBot`
- **GitHub:** https://github.com/basilalfarooqui-cmyk/ChatBot (branch `main`)
- **Live backend:** https://chatbot-production-5315.up.railway.app
- **Admin upload UI:** https://chatbot-production-5315.up.railway.app/admin

---

## Part 1 — Frontend (Expo / React Native)

Stack: TypeScript, expo-router, zustand, AsyncStorage, `@react-native-voice/voice`,
`react-native-tts`. Built as 15 planned tasks (spec + plan under
`docs/superpowers/`), each with an implementer + independent reviewer pass.

**What's in it:**
- First-launch language picker across all 23 scheduled Indian languages +
  English, native script + English subtitle on every card.
- UI translated in 8 languages fully (English, Hindi, Telugu, Tamil, Bengali,
  Marathi, Gujarati, Kannada); the other 15 fall back to English text
  automatically — the data structure supports them, only content is missing.
- Chat screen: message bubbles, timestamps, a "Thinking… / Searching
  documents… / Checking guidelines…" cycling indicator while waiting on a
  reply.
- Voice input: mic pulses with a real animation while listening, an explicit
  "Transcribing…" state covers the gap between the recognizer stopping and a
  result arriving, and it never enables for a language/device combo it hasn't
  actually verified works.
- Voice output: tap a reply to hear it; the icon reflects real playback
  events (`tts-start`/`tts-finish`/`tts-cancel`), not a guess — tap again to
  stop instead of restarting.
- Hamburger menu: New Chat, History (local, AsyncStorage), Settings
  (change language instantly, no restart; honest "backend not connected —
  demo mode" note that's now stale since the backend *is* connected — worth
  updating).
- `services/ai.ts` is the single integration point between the UI and the
  backend — this is what got rewired from a stub to a real `fetch` call.

**Known frontend gaps:**
- Voice (mic pulse, transcribing state, TTS icon/stop) has not been tested
  on a real device yet — only reasoned through and unit-tested. Confirm on
  your phone.
- Settings screen still says "Backend not connected — demo mode" — no longer
  true, cosmetic fix pending.
- History screen shows dates in device locale, not the app's selected
  language (deferred, logged as minor).

---

## Part 2 — Backend (`/backend`, Node/Express)

**Endpoints:**
- `POST /api/chat` — `{ message, language }` → `{ reply }`. The whole RAG flow.
- `POST /admin/upload` — multipart `.txt`/`.pdf` upload → chunks, embeds, and
  stores it in Supabase.
- `GET /admin` — the upload UI (plain HTML/CSS/JS, no framework).
- `POST /calls/bolna-webhook` — stub only, logs and returns 200. Not wired to
  Exotel yet, per instruction.
- `GET /health` — `{ status: "ok", timestamp }`.

**The `/api/chat` flow, step by step:**
1. If the message isn't English, Gemini translates it to English first.
2. Gemini embeds the (English) message into a 768-number vector.
3. That vector is compared against stored document chunks in Supabase via
   pgvector cosine similarity (`match_documents` RPC), top 5 returned.
4. If nothing scores ≥ 0.3 similarity: Gemini gets a "no context" prompt
   telling it to respond naturally to greetings/small talk, but give an exact
   fixed "I don't have information on that topic…" line for real unanswered
   questions or off-topic requests — never invent facts either way.
5. If something matched: Gemini gets a RAG prompt with those chunks as the
   *only* allowed source of facts.
6. If the original message wasn't English, the answer gets translated back.
7. Every Gemini call goes through one shared queue + retry-on-429, so
   concurrent requests take turns instead of each independently exhausting
   quota (this was a real bug, reproduced and fixed — see Part 4).

**Document ingestion (`/admin/upload`):** extracts text (`pdf-parse` for
PDFs, direct read for `.txt`), rejects anything under 50 characters, splits
into ~300-word chunks with 50-word overlap, embeds each chunk, stores
`{content, embedding, topic, source_file}` in Supabase.

**Models actually in use** (the original spec named models that turned out to
be retired for this API key — swapped to what's live):
- Embeddings: `gemini-embedding-001`, pinned to 768 dimensions to match the
  database column.
- Generation/translation: `gemini-3.6-flash`.

---

## Part 3 — Infrastructure

**Supabase** (`nfapnocwbazskemsopap` project): `documents` table with a
pgvector `embedding` column, an ivfflat cosine-distance index, and a
`match_documents` SQL function the backend calls via RPC. REST/service-role
keys can't run schema DDL, so `backend/db/setup.sql` had to be pasted into
the Supabase SQL Editor manually, once — already done.

**Railway**: deploys straight from the GitHub `main` branch, root directory
`/backend`. Auto-redeploys on every push. Environment variables are set
directly in Railway's dashboard (separate from the local `.env` files, which
are gitignored and never committed).

**Secrets**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`GEMINI_API_KEY`, `BOLNA_API_KEY` — live in `backend/.env` (local) and
Railway's Variables tab (deployed). The Gemini key has been rotated once
already (see Part 4).

---

## Part 4 — Problems Hit and How They Were Actually Fixed

Chronological, because a couple of these matter for anyone touching this
project later:

1. **Android build: duplicate `versionedparcelable` classes.**
   `@react-native-voice/voice` pulls the legacy `com.android.support` library,
   conflicting with AndroidX. Fixed by excluding that legacy artifact in
   `android/app/build.gradle`.
2. **Dev client couldn't reach Metro** (`SocketTimeoutException` on a LAN
   IP). Standard Expo behavior — the manifest bakes in the PC's LAN IP by
   default, and the phone was on cellular, not the same Wi-Fi. Fixed with
   `adb reverse tcp:8081 tcp:8081` + `REACT_NATIVE_PACKAGER_HOSTNAME=localhost`
   so it routes over USB regardless of network.
3. **Supabase RPC missing after running the setup SQL.** PostgREST caches
   schema and doesn't always pick up a new function immediately —
   `NOTIFY pgrst, 'reload schema';` fixed it (now baked into `setup.sql`).
4. **Every message, including "hi", got the canned "I don't have
   information" reply.** The flow hard-gated on similarity score before
   Gemini ever saw the message. Fixed by always calling Gemini, with
   instructions to greet naturally for small talk and reserve the fixed
   no-info line for genuine unanswered questions.
5. **Concurrent chat requests all failing with 500.** Reproduced directly:
   3 requests sent at once each independently retried through 429s and all
   still failed — they were competing for the same tight quota at once.
   Fixed by serializing all Gemini calls through one FIFO queue.
6. **The real wall underneath #5: `gemini-3.6-flash`'s free tier caps at 20
   `generateContent` requests *per day***, not a per-minute limit. No queue
   or retry logic can fix a daily cap — this was communicated directly
   rather than papered over. Resolved by rotating to a fresh Gemini API key
   (done — both `backend/.env` and Railway's `GEMINI_API_KEY` updated,
   verified live).
7. **Drawer menu and chat screens missing safe-area insets** — headers sat
   under the status bar, and later, the keyboard covered the input bar
   entirely with no way to see what you were typing. Fixed with
   `useSafeAreaInsets` on every screen that was missing it, wrapped the chat
   screen in `KeyboardAvoidingView`, and added
   `android.softwareKeyboardLayoutMode: "resize"` for the next native
   rebuild.

---

## Part 5 — Known Issue, Not Yet Fixed (flagged, waiting on you)

**Every message costs the same latency, even "hi".** The backend always
runs the full embed → vector search → Gemini generate pipeline regardless of
whether the message is a real question or small talk. Fix direction agreed:
classify cheap/small-talk messages before doing any embedding or database
work, and only run the full RAG pipeline for actual information requests.
Not started yet — you asked to pick this up later.

---

## Part 6 — What's Genuinely Not Verified

- Native voice (mic animation, transcribing state, TTS playback/stop) — not
  tested on a real device.
- Only one test document (`PMFBY`) has ever been uploaded through
  `/admin/upload` — the real cooperative-law/scheme documents this is meant
  to answer from still need uploading.
- No auth on `/admin/upload` or `/api/chat` — anyone with the Railway URL
  can upload documents or spend your Gemini quota. Not in the original spec,
  worth deciding on before this goes anywhere public.
- Bolna webhook is an intentional stub — not wired to Exotel, per instruction.
