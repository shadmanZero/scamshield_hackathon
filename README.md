# ScamShield

**Vertical: Cybersecurity. Problem statement PS01, ScamShield: Suspicious Message Detector.**

ScamShield tells you whether a message is a scam. Paste an SMS, WhatsApp or email message, or upload a screenshot of it, and in a few seconds you get a clear verdict (**Scam**, **Suspicious** or **Safe**), the exact phrases that give it away, what the scammer would do next, and what to do now, all in simple English, Hindi, Bengali or Assamese, with a button that reads it aloud.

It is built for the people most at risk from fraud messages in India: older users and people who are not comfortable reading English, on a phone.

## Contents

1. [Chosen vertical and problem](#chosen-vertical-and-problem)
2. [Approach and logic](#approach-and-logic)
3. [How the solution works](#how-the-solution-works)
4. [Assumptions](#assumptions)
5. [Security](#security)
6. [Testing](#testing)
7. [Accessibility](#accessibility)
8. [Efficiency](#efficiency)
9. [Project structure](#project-structure)
10. [Run it locally](#run-it-locally)
11. [Deploy](#deploy)

## Chosen vertical and problem

People receive fraudulent SMS and WhatsApp messages pretending to be from banks, couriers, utilities and government bodies, and many cannot tell them apart from genuine ones. The problem statement asks for a web application that helps users identify potentially fraudulent messages and understand the risks.

ScamShield does not only say "this is a scam". It shows the trap: which words are the hook, what happens if you follow the link, and what to do instead, in the user's own language, for a user who may not read well.

## Approach and logic

The assistant adapts its output to the user's context at three levels.

**1. Language and literacy.** The user picks English, Hindi, Bengali or Assamese on the home screen. Every explanation is generated directly in that language, in short sentences and everyday words, and can be read aloud with the Listen button. The interface itself is translated, and the page's `lang` attribute follows the choice so screen readers and voices switch too.

**2. Verdict driven screens.** The result screen changes with the decision:

| Verdict    | What the user sees                                                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scam       | Red band with an alert shield, risk score, scam type (KYC, courier, electricity bill, job offer, digital arrest, lottery, UPI), highlighted red flags with a numbered reason for each, a "what happens next" timeline, three actions, a tap-to-call 1930 helpline button and a link to cybercrime.gov.in |
| Suspicious | Amber band, the same evidence sections, the same helpline buttons                                                                                                                                                                                                                                        |
| Safe       | Green band and a short reassurance; no red flags, no timeline, no helpline buttons, so a safe message is not made to look alarming                                                                                                                                                                       |

**3. Evidence, not opinion.** The model must quote red flags character for character from the message. The server drops any flag that is not a real substring, so every highlight the user sees is text that is actually in their message. The risk score is clamped to 0 to 100. Links are shown as plain text and are never clickable.

The scam knowledge is encoded in the system prompt: the common Indian patterns (fake KYC updates, courier fees, electricity disconnection threats, part-time job offers, "digital arrest" calls, lottery wins, UPI collect tricks) and the rule that genuine banks and government bodies never ask for OTPs, PINs or app installs through a link. Message text is passed to the model as delimited, untrusted data, and the prompt states that instructions inside the message are themselves a red flag.

## How the solution works

```
Phone  ──(text or compressed screenshot + language)──▶  POST /api/analyze
                                                           │  rate limit, size limit, zod validation
                                                           │  OpenRouter chat completion with a strict JSON schema
                                                           │  red flags filtered, risk score clamped
                                                           │  spoken text composed and HMAC signed
       ◀──(typed analysis + signed speech)─────────────────┘

Listen ──(speech text + token)──────────────────────────▶  POST /api/speak
                                                           │  token verified, text sent to a TTS model
       ◀──(WAV audio)──────────────────────────────────────┘
```

- **Screens.** Home (language, upload or paste, three sample messages), Checking (step list over a skeleton of the result), Result. One page, three states, no router or state library needed.
- **Screenshots** are resized to 1600 px and JPEG compressed in the browser before upload, so a 6 MB photo becomes a few hundred kilobytes.
- **The model call** uses OpenRouter's structured outputs. The zod schema in `lib/analysis.ts` is the single source of truth: it is converted to the JSON schema the model must follow and it validates what comes back. Only providers that honour the schema are allowed, so the reply is always parseable.
- **Speech** is synthesised server side by a text-to-speech model and streamed to the browser as WAV. The spoken text is composed and signed on the server when the analysis is produced, so the speech endpoint cannot be used to synthesise arbitrary text.
- **Share** uses the native share sheet on HTTPS and falls back to a WhatsApp link elsewhere, because warning family on WhatsApp is the real use.
- **Dark mode** follows the system setting, can be toggled, and is applied before first paint so there is no flash.

## Assumptions

- Users are on a phone. Every screen is designed at 360 px first and verified at 320 px; desktop is a centred column.
- Many users cannot read English well and some cannot read well at all, so icons and colour carry meaning alongside text, and every result can be read aloud.
- Users should never be sent to a scammer's site, so links in a message are displayed but never made tappable.
- Genuine helplines must not come from the model. The only contacts shown are the national cybercrime helpline 1930 and cybercrime.gov.in, which are hard coded.
- The app does not store anything: no login, no database, no history. Each check is independent.
- Each check costs a fraction of a cent through OpenRouter; abuse is limited by rate limiting and signed speech rather than by accounts.

## Security

- **Secrets stay on the server.** The OpenRouter key is read only in server code. `.env` files are git ignored; `.env.example` documents the variables.
- **Input validation.** Both API routes validate the body with zod: supported language only, text up to 5,000 characters, images only as JPEG, PNG or WebP data URLs with a size cap, speech text up to 4,000 characters.
- **Denial of service.** Oversized bodies are rejected on the declared `Content-Length` before being read. Each client is limited to 20 requests a minute per route, keyed on the address appended by the hosting proxy so it cannot be rotated.
- **Paid endpoint protection.** The speech route only synthesises text that this server composed and HMAC signed, so it cannot be used as a free text-to-speech proxy.
- **Prompt injection.** Message text is wrapped as untrusted data and the prompt instructs the model that embedded instructions are a red flag. Output is schema validated, so a manipulated reply cannot change the response shape.
- **Error handling.** Upstream errors are logged server side and replaced with a generic message, so provider details never reach the client.
- **Headers.** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a `Permissions-Policy` that disables camera, microphone and geolocation on every response; `Content-Security-Policy` and `Strict-Transport-Security` in production. API responses are `Cache-Control: no-store`.
- **Supply chain.** Zero `npm audit` findings; CI fails on high severity. The Docker image runs as a non-root user with a health check.

## Testing

```bash
npm run check   # lint, type-check, formatting, tests with coverage thresholds
npm test        # tests only
```

Vitest, 15 test files, 79 tests, enforced coverage thresholds (90% statements and lines, 85% branches). Current coverage is above 97% for statements and branches. The same checks run in GitHub Actions on every push.

| Area                           | What is covered                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/analysis`                 | Schema accepts a full analysis, rejects unknown verdicts and scam types, requires every field                                                                                                                                                                                                                                            |
| `lib/openrouter`               | Request shape (key, strict JSON schema, image before text, delimited message), red flag filtering, risk score clamping, error envelopes, upstream failures, missing key                                                                                                                                                                  |
| `lib/speech`                   | WAV header bytes, token signing and verification, tampering, secret rotation                                                                                                                                                                                                                                                             |
| `lib/highlight`                | Segmentation, overlaps, repeated phrases, phrases at the edges                                                                                                                                                                                                                                                                           |
| `lib/guards`, `lib/rate-limit` | Window, per-client buckets, last-hop keying, 429 and 413 responses, table cap                                                                                                                                                                                                                                                            |
| `lib/i18n`                     | Every key present and non-empty in all four languages                                                                                                                                                                                                                                                                                    |
| API routes                     | 200, 400, 403, 413, 429 and 502 paths, generic error masking, no-store headers                                                                                                                                                                                                                                                           |
| Components                     | Home (language, samples, paste, upload, error), Checking (timers, live region), Result (verdict, meter, highlights, hidden sections for safe, share fallback and native share, reset), theme toggle, speech hook (fetch once, replay, abort, cleanup), page flow (sample to result, server error, network error, screenshot compression) |

## Accessibility

- Semantic landmarks and heading order on every screen; focus moves to the verdict heading when a result appears.
- The risk bar is an ARIA `meter`; the checking steps are a polite live region with `aria-current` on the active step; errors use `role="alert"`.
- Highlighted phrases are linked to their numbered reason with `aria-describedby`; icons are decorative and hidden.
- All controls are at least 44 px tall, show a visible focus ring, and are labelled in the chosen language, including the theme toggle and the file input.
- Primary text is 16 px or larger and supporting labels are 14 px; every text and background token pair was measured against WCAG AA in both themes; the verdict is conveyed by colour, icon and text together.
- `prefers-reduced-motion` disables animation. `prefers-color-scheme` is respected. The `lang` attribute follows the chosen language.
- Harmonised Noto Sans and Noto Serif families cover Latin, Devanagari and Bengali so Hindi, Bengali and Assamese text renders consistently.

## Efficiency

- One API round trip per check. Screenshots compressed client side before upload.
- Structured output means no retry loops and no parsing heuristics.
- Fonts are self hosted and subset; the Indic faces are not preloaded and download only when text in that script is on screen.
- No state library, no router, no CSS framework beyond Tailwind utilities, no unused dependencies. The production bundle is a single static page plus two serverless routes.
- The Docker image is a multi-stage standalone build.

## Project structure

```
app/
  page.tsx              home / checking / result state machine
  layout.tsx            fonts, theme script, metadata
  api/analyze/route.ts  message analysis endpoint
  api/speak/route.ts    speech endpoint
  error.tsx, loading.tsx
components/
  home.tsx, checking.tsx, result.tsx, header.tsx, logo.tsx, theme-toggle.tsx
  ui/                   shadcn primitives
hooks/use-speech.ts     audio playback with caching and cleanup
lib/
  analysis.ts           zod schema, the single source of truth for the result
  openrouter.ts         model call and prompt
  speech.ts             TTS, WAV framing, speech signing
  guards.ts, rate-limit.ts
  highlight.ts          red flag segmentation
  i18n.ts               interface strings in four languages
  samples.ts, compress-image.ts
test/                   fixtures and setup
*.test.ts(x)            tests live next to the code they cover
.github/workflows/ci.yml
```

## Run it locally

You need [Node.js](https://nodejs.org) 20.9 or newer and an OpenRouter API key.

```bash
npm install
cp .env.example .env
```

Open `.env` and paste your key after `OPENROUTER_API_KEY=`. Then:

```bash
npm run dev
```

Open http://localhost:3000.

| Variable             | Needed? | What it is                                                                                                                |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY` | Yes     | Your key from openrouter.ai. Also used as the signing secret for speech tokens.                                           |
| `OPENROUTER_MODEL`   | No      | The model that checks messages. It must read images and support structured output. Defaults to `google/gemini-2.5-flash`. |
| `DEV_ORIGIN`         | No      | Your computer's LAN address, to open the dev server from a phone.                                                         |

**Testing on a phone.** Put the phone and the computer on the same Wi-Fi, start with `DEV_ORIGIN=<your-computer-ip> npm run dev`, and open `http://<your-computer-ip>:3000` on the phone. The native share sheet only works over HTTPS, so on a plain `http://` address the Share button opens WhatsApp directly.

## Deploy

The included `Dockerfile` works on Easypanel or any Docker host:

1. Create an app from this repository and choose the Dockerfile build.
2. Set `OPENROUTER_API_KEY` in the app's environment. The `.env` file is not included in the image.
3. Point the domain at port `3000`.

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, zod, Vitest, OpenRouter.
