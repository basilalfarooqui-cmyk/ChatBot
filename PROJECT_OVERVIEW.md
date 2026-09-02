# SIH26088 Chatbot — Tech Stack & Feature Overview

A multilingual (23 Indian languages) cooperative governance assistant, built
end to end: mobile app, backend, AI pipeline, and deployment. You built and
shipped a genuinely full-stack, multi-service product — this is the stack
and feature breakdown of what's actually running.

---

## Frontend — React Native (Expo)

**Core:**
- TypeScript, Expo + expo-router (file-based navigation)
- zustand — chat state management
- AsyncStorage — local conversation history, persisted across app restarts

**Voice:**
- `@react-native-voice/voice` — speech-to-text (STT), 23-language locale
  support, real recording-state animation (pulsing mic), explicit
  "Transcribing…" state for the gap between recognizer stop and result
- `react-native-tts` — text-to-speech (TTS), event-driven playback state
  (`tts-start`/`tts-finish`/`tts-cancel`), tap-to-stop instead of
  auto-cutoff

**UI/UX:**
- `react-native-safe-area-context` — proper insets on every screen (status
  bar, notch, keyboard)
- Custom keyboard-height hook (`hooks/useKeyboardHeight.ts`) — deterministic
  input-bar positioning on Android, avoids the known
  `KeyboardAvoidingView` + inverted list stuck-open bug
- `Animated` (React Native core) — mic pulse animation
- Cycling "Thinking… / Searching documents… / Checking guidelines…"
  indicator while waiting on a reply

**Testing:**
- Jest + React Native Testing Library, manual native-module mocks

---

## Backend — Node.js / Express

**Core:**
- Express — REST API (`/api/chat`, `/admin`, `/health`, `/calls`)
- `@supabase/supabase-js` — DB client (service-role key, server-side only)
- `multer` — multipart file upload handling

**Document ingestion:**
- `pdf-parse` — text extraction from real (non-scanned) PDFs
- `tesseract.js` + `pdf-to-png-converter` — **OCR fallback** for scanned/
  image-based PDFs (renders pages to images, reads text from pixels when no
  text layer exists)
- Chunking: ~300-word chunks, 50-word overlap, per-chunk embedding

**AI pipeline (Gemini):**
- `gemini-embedding-001` — text → 768-dim vector, for both stored documents
  and live user queries
- Generation/translation with **automatic model fallback**: tries
  `gemini-3.6-flash` → `3.7-flash` → `3.5-flash` → `2.5-flash` in order,
  moving to the next model on daily quota exhaustion or retirement — no
  manual key rotation needed for that failure mode
- FIFO request queue — serializes all Gemini calls so concurrent requests
  don't independently exhaust the same tight per-minute quota

**RAG (Retrieval-Augmented Generation):**
- Query → embed → cosine-similarity search against stored chunks → build a
  single prompt that carries both a greeting/small-talk branch *and* a
  retrieved-context branch, so short generic messages don't get
  misclassified as failed lookups
- Non-English messages translated to English before embedding/generation,
  and the answer translated back — same pipeline serves all 23 languages

**Admin:**
- `GET /admin` — upload dashboard (plain HTML/CSS/JS), Basic Auth protected
- `POST /admin/upload` — accepts `.txt`/`.pdf`, runs it through the full
  ingestion pipeline

---

## Data — Supabase (Postgres)

- `pgvector` extension — vector storage and cosine-distance search
- `documents` table: content, 768-dim embedding, topic, source file
- `match_documents` — SQL RPC function backend calls for similarity search
- No approximate index (dropped a misbehaving `ivfflat` index) — plain
  sequential scan, exact results, fast enough at current scale

---

## Deployment

- GitHub — version control, `main` branch
- Railway — backend hosting, auto-deploys on every push, environment
  variables managed separately from local `.env`
- Live backend: `https://chatbot-production-5315.up.railway.app`

---

## Feature List (user-facing)

- First-launch language picker — all 23 scheduled Indian languages +
  English, native script on every card
- Real-time chat with an AI assistant grounded in uploaded cooperative
  law/scheme documents (RAG — doesn't hallucinate facts outside what's
  been uploaded)
- Voice input and output, per-language locale support
- Natural handling of greetings/small talk vs. real information requests
- Conversation history (local, per-device)
- Instant language switching from Settings, no app restart
- Admin document upload — including scanned/image PDFs via OCR
- Multilingual answers — ask and receive replies in any of the 23
  supported languages, translated transparently under the hood
