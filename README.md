# MUSAB AI STUDIO

A responsive AI video-generator website starter branded for **Admin: Musab Baloch**.

## Important: provider setup is required
You selected “Other / not decided.” Video APIs use different endpoints, request fields, authentication, and job-status flows. This starter includes a secure server-side integration point, but it cannot generate real videos until you choose a provider and adapt `server.js` to that provider's official API documentation.

## Run locally
1. Install Node.js 20 or newer.
2. In this folder, run `npm install express`.
3. Copy `.env.example` to `.env` and fill in the provider's actual values.
4. Use a hosting environment that loads `.env`, or set the variables in your shell:
   - `VIDEO_API_KEY`
   - `VIDEO_API_URL`
   - `VIDEO_MODEL` (if required)
5. Run `npm start` and open `http://localhost:3000`.

Do not commit `.env` to a public repository. This project does not load `.env` automatically; on a local machine, use your hosting platform's environment settings or add a dotenv package and import it.

## Free hosting
You can try a free Node.js web-service tier from a hosting provider that supports persistent Node servers and environment variables. Free tiers can sleep, have usage limits, or change their terms. Deploy this project as a Node web service with build command `npm install` and start command `npm start`, then set the environment variables in the host dashboard. A static-only host is not enough for this version because the API key must stay on the server.

## Before public launch
- Choose a video API provider and follow its official docs.
- Update the upstream request payload and response parsing in `server.js`.
- Add provider-specific polling/webhooks for asynchronous jobs.
- The starter enforces a basic limit of 3 successful generation requests per client IP per UTC day.
- This quota is stored in server memory: it resets if the server restarts and is not shared across multiple instances. For reliable production limits, use persistent storage (such as a database) and add authentication/admin controls and abuse protection.
- Anyone sharing the same public IP also shares the same 3-video quota. Visitors may be able to bypass IP-based limits using a different network.
- Configure allowed duration/aspect ratios according to provider capabilities.
- Add terms/privacy details and monitor usage.

The API key is never embedded in `public/index.html`; it is read from server-side environment variables. The included IP-based daily quota is a basic starter safeguard, not a substitute for persistent quotas and stronger abuse protection before sharing widely.


## Admin Settings / Gemini key
The page now includes an Admin Settings panel. Set `ADMIN_PASSWORD` in your host's environment variables, then enter that password and your Gemini API key in the panel. The key is sent to the server, not stored in browser local storage or shown back in the page.

**Important limitations:** the panel's saved key is held in server memory and is lost when the server restarts; set `GEMINI_API_KEY` in the hosting provider's secret/environment settings for persistence. Also, this update adds the secure key-entry UI but does not by itself implement Google's Veo video-generation flow. The Gemini/Veo API integration still needs provider-specific endpoint, operation polling, and response handling. Do not share the public site until admin authentication, persistent secret storage, rate limits, and Veo integration are configured.
