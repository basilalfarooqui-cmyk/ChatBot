# SIH26088 Chatbot — Frontend-Only Design

Date: 2026-08-28
Status: Approved for planning

## Overview

A React Native (Expo) chatbot app supporting first-launch language selection across
23 languages (22 scheduled Indian languages + English), a translated UI, a chat screen
with a stubbed AI response function, voice input/output where the device supports it,
and local chat history — all with zero backend/network calls. Built in the same
conventions as the existing HORA app (`D:\Farooqui\HORA-v2\HoraApp`): Expo Router,
TypeScript, zustand, manual AsyncStorage persistence, `Animated`-based drawer menu,
`@expo/vector-icons` (Ionicons).

Project root: `D:\Farooqui\ChatBot`

## Goals

- First-launch language picker, skipped on subsequent launches.
- All UI strings pulled from a single translation dictionary — zero hardcoded English.
- Chat screen with `getAIResponse(message, language)` as the sole integration point
  for a future backend.
- Voice input/output that checks real device capability at runtime and degrades
  gracefully — never fakes coverage, never crashes.
- Hamburger menu → New Chat / History / Settings, all local (AsyncStorage).
- A UI that looks like a real product, not a scaffold.

## Non-Goals

- No network calls anywhere in this build.
- No dark/light theme toggle (not in scope of the spec; single clean palette).
- No full translation of all 23 languages' content (structure supports it; content
  filled in for 8 now, rest fall back to English).
- No backend/RAG integration — `getAIResponse` is a stub.

## Tech Stack

- Expo ~54 (matching HORA), TypeScript, `expo-router`
- `newArchEnabled: false` in app.json (matches HORA, maximizes native module compat)
- `zustand` for chat state, manual AsyncStorage persistence (no persist middleware —
  matches HORA's `userStore.ts` pattern)
- `@react-native-async-storage/async-storage`
- `@react-native-voice/voice`, `react-native-tts` — native modules, require
  `expo-dev-client`. **Not Expo Go compatible.** Run via `npx expo run:android` or an
  EAS dev build. Voice code is guarded with `Platform.OS !== 'web'` so the rest of the
  app (language picker, chat, history, settings) is fully testable in a web preview.
- `@expo/vector-icons` (Ionicons)

## Folder Structure

```
ChatBot/
  app/
    _layout.tsx            — providers (LanguageProvider, ThemeProvider) + Stack, store hydration
    index.tsx               — startup gate: AsyncStorage 'appLanguage' → language-select or chat
    language-select.tsx     — full-screen picker (first launch AND settings "change language")
    (main)/
      _layout.tsx
      chat.tsx               — main chat screen
      history.tsx             — conversation list
      settings.tsx             — language change + about/version
  components/
    ChatBubble.tsx
    ChatInputBar.tsx           — text field + mic + send
    SlideMenu.tsx                — hamburger drawer (adapted from HORA's SlideMenu.tsx)
    LanguagePickerGrid.tsx        — shared grid used by language-select.tsx
    VoiceUnavailableNote.tsx
  constants/
    theme.ts                  — new clean palette + spacing/typography scale
    ThemeContext.tsx
  i18n/
    translations.ts             — { en: {...}, hi: {...}, te: {...}, ... }
    LanguageContext.tsx           — t(key), languageCode, setLanguage()
    languages.ts                  — metadata: code, nativeName, englishName, voiceLocale
  store/
    chatStore.ts                — zustand: conversations[], activeConversationId, actions
  services/
    ai.ts                       — getAIResponse(message, language) stub
  hooks/
    useVoiceAvailability.ts      — runtime STT/TTS capability check
    useSpeechToText.ts             — wraps @react-native-voice/voice
    useTextToSpeech.ts               — wraps react-native-tts
```

## Data Model

```ts
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  title: string;       // derived from first user message, truncated
  language: string;     // language code active when conversation was created
  messages: ChatMessage[];
  updatedAt: number;
};
```

`chatStore` (zustand) holds `conversations: Conversation[]` and `activeConversationId:
string | null`, with actions `startNewConversation()`, `sendMessage(text)`,
`loadConversation(id)`. Every mutation persists the full array to AsyncStorage under
key `chatHistory`; the root layout hydrates it once on mount — mirrors HORA's manual
`AsyncStorage.getItem`/`setItem` pattern in `_layout.tsx`, no zustand persist
middleware.

## Language & i18n

`i18n/languages.ts` holds all 23 entries: `code` (dictionary key, e.g. `en`, `hi`,
`bn`, `te`, `mr`, `ta`, `ur`, `gu`, `kn`, `or`, `ml`, `pa`, `as`, `mai`, `sat`, `ks`,
`ne`, `kok`, `sd`, `doi`, `mni`, `brx`, `sa`), `nativeName`, `englishName`, and
`voiceLocale` (BCP-47 tag, e.g. `hi-IN`; `undefined` for languages with no standard
tag — Santali, Bodo, Dogri, Kashmiri, Manipuri, Sanskrit skip voice checks entirely).

`i18n/translations.ts` is `{ [languageCode]: { [key]: string } }`. Fully populated
for **English, Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Kannada** (8
languages). All other 15 languages exist in the dictionary object but fall back to
the English string for any missing key — no code changes needed to fill them in
later.

`LanguageContext` (mirrors HORA's `ThemeContext` pattern) exposes `languageCode`,
`t(key: string): string`, and `setLanguage(code: string)`, which updates AsyncStorage
key `appLanguage` and context state together — instant UI update, no restart.

The `getAIResponse` stub's return string (`"[Backend not connected — echo]: " +
message`) is a debug string, not user-facing localized content — left as literal
English, not part of the translation dictionary.

## Screens & Navigation

- **`app/index.tsx`** — on mount, reads `appLanguage` from AsyncStorage. Unset →
  `router.replace('/language-select')`. Set → hydrate `LanguageContext` →
  `router.replace('/(main)/chat')`. Shows a themed blank/loading state during the
  check, no flash of wrong content.
- **`language-select.tsx`** — full-screen `FlatList`, 2-column grid, 23 cards (native
  script large + English name subtitle small). On select: persist + context update,
  then `router.replace('/(main)/chat')` on first launch, or `router.back()` when
  reached via `?from=settings`.
- **`(main)/chat.tsx`** — header with hamburger (opens `SlideMenu`) + app title.
  Inverted `FlatList` of `ChatBubble`s (user right-aligned/accent color, assistant
  left-aligned/card color, timestamp caption under each). Bottom `ChatInputBar`: text
  field, mic button (pulses while listening), send button. If voice unsupported for
  the active language, mic renders disabled + a small dismissible note via `t()`.
  Assistant bubbles get a speaker icon to replay via TTS, hidden/disabled if TTS
  unsupported.
- **`(main)/history.tsx`** — `FlatList` of conversations, sorted by `updatedAt` desc:
  title + formatted date. Tap → `chatStore.loadConversation(id)` →
  `router.push('/(main)/chat')`. Empty state when no history.
- **`(main)/settings.tsx`** — "Change language" row → `router.push('/language-
  select?from=settings')`. "About" block: app name, version (from
  `Constants.expoConfig`), and an explicit "Backend not connected — demo mode" note.
- **`SlideMenu`** — adapted directly from HORA's `components/SlideMenu.tsx` (same
  `Animated.spring` drawer mechanics, `Ionicons`). Items: **New Chat** (action:
  `chatStore.startNewConversation()`, closes drawer, stays on chat), **History**,
  **Settings**.

## Voice I/O

`useVoiceAvailability(voiceLocale)` runs on mount and on language change:

- Android STT: `Voice.getSpeechRecognitionServices()` + `Voice.isAvailable()`.
- iOS STT: `Voice.isAvailable()` (module presence only — iOS doesn't expose
  per-locale query), cross-checked against a static whitelist of the 11
  device-reliable languages the spec identifies (Hindi, English, Bengali, Tamil,
  Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu).
- TTS: `Tts.voices()`, checks for a voice whose `language` matches the `voiceLocale`
  prefix.
- Languages with no `voiceLocale` (Santali, Bodo, Dogri, Kashmiri, Manipuri,
  Sanskrit, and any other without a standard tag) skip the check and are disabled
  immediately.
- Result shape: `{ sttAvailable: boolean, ttsAvailable: boolean, checked: boolean }`.
  Until `checked` is true, mic/speaker render in a neutral disabled state (no flash of
  enabled-then-disabled).
- Defensive runtime fallback: actual `Voice.start()` / `Tts.speak()` calls are
  wrapped in try/catch. A runtime failure flips the relevant flag off for the rest of
  the session and surfaces the same note — never crashes, never fails silently.
- On web (`Platform.OS === 'web'`), voice is always unavailable — this is what makes
  the rest of the app testable in a browser preview.

## Visual Design

Clean, modern chat UI, distinct from HORA's dark/cream branding: soft neutral
background, rounded message bubbles (accent color for user, card color for
assistant), consistent spacing/typography scale (new `theme.ts`, structured like
HORA's but with its own palette), subtle caption-style timestamps, 2-column native-
script cards for the language grid.

## Testing / Verification

- Web preview (browser tool) exercises: first-launch gate, language picker, chat
  send → stub response → persistence, history list/reopen, settings language change,
  and the voice-unavailable fallback UI (real on web, since voice is force-disabled
  there).
- Native voice behavior (STT/TTS actually working) can only be confirmed on a
  device/emulator running the dev client — this will be called out explicitly as
  unverified-by-me rather than claimed as tested.

## Open Items Resolved During Brainstorming

- Project root confirmed as `D:\Farooqui\ChatBot` (was empty).
- Dev client (not Expo Go) accepted, since voice is a real spec requirement.
- Fully-translated language set: English, Hindi, Telugu, Tamil, Bengali, Marathi,
  Gujarati, Kannada.
