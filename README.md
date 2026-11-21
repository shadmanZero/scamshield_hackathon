# ScamShield

ScamShield tells you whether a message is a scam.

Paste an SMS, WhatsApp or email message, or upload a screenshot of it. In a few seconds you get a clear answer: **Scam**, **Suspicious** or **Safe**, with the reasons in simple words.

It is built for people in India who are most at risk from fraud messages, especially older people and those who are not comfortable reading English.

## What it does

- **Reads text or screenshots.** No typing needed: take a screenshot and upload it.
- **Shows the dangerous parts.** The exact phrases that give the scam away are highlighted, each with a one-line reason.
- **Explains what would happen next.** It walks through what the scammer does if you follow the message.
- **Tells you what to do now.** Simple steps, plus one-tap buttons to call the 1930 cybercrime helpline or report at cybercrime.gov.in.
- **Speaks your language.** English, Hindi, Bengali and Assamese.
- **Reads the result aloud.** Tap Listen to hear the answer in a natural voice, for people who find reading hard.
- **Warns the family.** Share the result to WhatsApp in one tap.

It recognises the common Indian scams: fake KYC updates, courier and customs fees, electricity disconnection threats, part-time job offers, "digital arrest" calls, lottery wins and UPI tricks.

## How it works

1. You give it a message or a screenshot and choose a language.
2. The app sends it to an AI model through [OpenRouter](https://openrouter.ai). The model reads the message, decides how risky it is and writes the explanation in your language.
3. The app shows the result. If you tap Listen, a second AI model turns the explanation into speech.

Nothing is stored. There is no database and no login.

## Run it on your computer

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

### Settings

| Name | Needed? | What it is |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Your key from openrouter.ai. |
| `OPENROUTER_MODEL` | No | The model that checks messages. It must be able to read images and return structured output. Defaults to `google/gemini-2.5-flash`. |

### Testing on a phone

Put the phone and the computer on the same Wi-Fi or hotspot and open `http://<your-computer-ip>:3000` on the phone. Add that IP address to `allowedDevOrigins` in `next.config.ts`, otherwise the dev server blocks the phone.

The native share sheet only works over HTTPS, so on a plain `http://` address the Share button opens WhatsApp directly instead.

## Deploy

The included `Dockerfile` works on Easypanel or any Docker host:

1. Create an app from this repository and choose the Dockerfile build.
2. Set `OPENROUTER_API_KEY` in the app's environment. The `.env` file is not included in the image.
3. Point the domain at port `3000`.

## Cost

Each use is paid through your OpenRouter account. Reading one result aloud costs roughly half a US cent. Checking a message costs whatever the chosen model charges.

## Built with

Next.js, React, Tailwind CSS, shadcn/ui and OpenRouter.
