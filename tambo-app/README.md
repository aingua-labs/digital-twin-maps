# Ask the maps (Tambo copy)

A copy of the Digital Twin maps site with a [Tambo](https://docs.tambo.co) assistant beside the 3D maps.
A visitor describes their situation; the assistant finds the matching use cases and platform features,
shows them as cards, and points the map at them. The static site in the repo root is not changed by this app.

## Run it against a self-hosted Tambo

The app talks to whichever Tambo API `VITE_TAMBO_URL` points at, so it does not depend on Tambo Cloud.

1. Start Tambo on your own machine or server (needs Docker, Docker Compose and an LLM provider key):

   ```bash
   git clone https://github.com/tambo-ai/tambo.git && cd tambo
   ./scripts/cloud/tambo-setup.sh        # creates docker.env
   # edit docker.env: POSTGRES_PASSWORD, API_KEY_SECRET, PROVIDER_KEY_SECRET,
   #                  NEXTAUTH_SECRET, FALLBACK_OPENAI_API_KEY
   ./scripts/cloud/tambo-start.sh
   ./scripts/cloud/init-database.sh
   ```

   Dashboard: http://localhost:8260. API: http://localhost:8261. Database: PostgreSQL on 5433.
   Full guide: https://docs.tambo.co/guides/self-hosting

2. In your dashboard, create a project and an API key for it.

3. Point this app at it:

   ```bash
   cd tambo-app
   npm install
   cp .env.example .env.local   # set VITE_TAMBO_URL and VITE_TAMBO_API_KEY
   npm run dev
   ```

For production, put the Tambo API behind HTTPS on your own domain, set `VITE_TAMBO_URL` to that address and
run `npm run build`; the result in `dist/` is a static site you can host anywhere.

Without a key the app runs in preview mode: it shows a sample conversation so the layout and cards can be
reviewed, and the input is disabled.

### Keep your own copy of Tambo

If the hosted service or its repository goes away, a clone alone may not be enough. Fork
`tambo-ai/tambo` to your own account and keep the built Docker images in your own registry.
The SDK (`@tambo-ai/react`) is pinned in `package-lock.json`; consider mirroring it too.

## How it is put together

| File | What it does |
| --- | --- |
| `scripts/sync-data.mjs` | Reads `../use-case-map.html` and `../product-map.html`, writes `src/data/catalog.json` and copies the maps to `public/maps/`. Runs before `dev` and `build`, so the assistant never drifts from the maps. |
| `src/tambo/components.tsx` | The four cards Tambo can generate: `UseCaseStory`, `UseCaseList`, `FeatureCard`, `FeatureList`. |
| `src/tambo/tools.ts` | The tools Tambo can call: search and read use cases and features, and `show_on_map`. |
| `src/tambo/context.ts` | Standing context sent with each message: what the assistant is and the rules it follows. |
| `src/components/Chat.tsx` | The chat panel, built on `useTambo` and `useTamboThreadInput`. |
| `src/components/MapStage.tsx` | The embedded map viewer the cards and the assistant can steer. |
| `src/App.tsx` | `TamboProvider` (live) or `TamboStubProvider` (preview, no key). |

## Two design choices worth knowing

- **Cards take ids, not content.** The assistant chooses which use case or feature to show; every word and
  number on the card is read from the map data. A generated card cannot carry an invented figure.
- **Facts come from tools.** The assistant's context tells it to state only what the search tools return and
  to say when a result is not measured yet. Add the same rules as the project's system prompt in your Tambo
  dashboard for a firmer guarantee.

## Before sharing it widely

- The API key is used in the browser. Restrict it and set usage limits in your Tambo dashboard, and do not expose the dashboard or database ports publicly.
- `userKey` is an anonymous id kept in the visitor's browser. Replace `visitorKey()` in `src/App.tsx` with a
  real user id when the app sits behind sign-in.
- `npm run build` writes a static site to `dist/` (relative paths, so it can be hosted from any folder).
