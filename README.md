# suho's sesang

suho's sesang (수호 세상) is a personal world that grows as you grow. Real-life
progress adds Growth to a calm palace garden, revealing new details over time.

## Current foundation

- Five interactive life streams: knowledge, language, creation, journey, and
  wellness
- One-tap `+5`, `+10`, `+20`, and `+50` Growth updates with optional notes
- Five permanent visual elements that open the life-stream Growth notes
- A persistent Target board for major projects, with smooth moving cloud
  markers, a visible status lifecycle, reorderable checklists, reminders, and
  repeatable/removable completion Growth units
- Four switchable seasonal worlds
- Clear progression where every 100 Growth advances the garden record by one
  level
- A filterable element library with page-specific placement and drag positioning
- Image uploads with four irregular frame choices and library deletion
- Uploaded images cached in IndexedDB and synchronized through private cloud
  storage
- Custom element notebooks with editable headings and multiple editable notes
- Distinct high-contrast comic palettes for each life-stream notebook
- Drag-to-trash custom elements with restore and permanent deletion
- Offline-first persistence with local browser storage and private Supabase
  synchronization across signed-in devices
- Responsive, mobile-first layout and installable web app metadata

World state remains available offline through `localStorage`, and uploaded
images remain available through IndexedDB. Signing in with the same email on
phone and laptop merges each device's existing records and then keeps notes,
Growth, targets, layouts, and uploaded elements synchronized.

## Configure cloud sync

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Add the deployed site URL to Supabase Authentication's allowed redirect
   URLs: `https://ardhra7ms.github.io/suho-sesang/`.
3. Copy `.env.example` to `.env.local` and fill in the project URL and
   browser-safe publishable key for local development.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as GitHub
   Actions repository variables for the Pages deployment.

The `user_worlds` and `user_elements` tables use row-level security, and the
`user-elements` storage bucket is private. Every policy is scoped to the signed
in user's ID.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run build
```

Pushes to `main` are deployed to GitHub Pages by the workflow in
`.github/workflows/deploy.yml`.

## Artwork

The four seasonal worlds use user-supplied Suho photographs. Spring has
separate desktop and phone compositions so its subject remains visible at both
aspect ratios. The element library retains cropped painting details alongside
user-supplied images and drawings.
