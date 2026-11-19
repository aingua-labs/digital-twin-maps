# Ask the maps (Tambo copy)

A copy of the Digital Twin maps site with a [Tambo](https://docs.tambo.co) assistant beside the 3D maps.
A visitor describes their situation; the assistant finds the matching use cases and platform features,
shows them as cards, and points the map at them. The static site in the repo root is not changed by this app.

## Run it

```bash
cd tambo-app
npm install
npx tambo init            # signs you in and gives you an API key
cp .env.example .env.local   # then paste the key as VITE_TAMBO_API_KEY
npm run dev
```

Without a key the app runs in preview mode: it shows a sample conversation so the layout and cards can be
reviewed, and the input is disabled.

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
  to say when a result is not measured yet. Add the same rules as the project's system prompt in the Tambo
  console for a firmer guarantee.

## Before sharing it widely

- The API key is used in the browser. Check the key's allowed origins and usage limits in the Tambo console.
- `userKey` is an anonymous id kept in the visitor's browser. Replace `visitorKey()` in `src/App.tsx` with a
  real user id when the app sits behind sign-in.
- `npm run build` writes a static site to `dist/` (relative paths, so it can be hosted from any folder).
