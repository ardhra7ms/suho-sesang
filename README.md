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
- Offline-first persistence with local browser storage and client-side encrypted
  Google Drive synchronization across connected devices
- Responsive, mobile-first layout and installable web app metadata

World state remains available offline through `localStorage`, and uploaded
images remain available through IndexedDB. Connecting the same Google account
and encryption passphrase on phone and laptop merges each device's existing
records and then keeps notes, Growth, targets, layouts, and uploaded elements
synchronized.

## Configure cloud sync

1. Create a Google Cloud project and enable the Google Drive API.
2. Configure an OAuth consent screen and create a Web application OAuth client.
3. Add `https://ardhra7ms.github.io` as an authorized JavaScript origin.
4. Copy `.env.example` to `.env.local` and add the OAuth client ID for local
   development.
5. Add `VITE_GOOGLE_CLIENT_ID` as a GitHub Actions repository variable for the
   Pages deployment.

The app requests only the narrow `drive.appdata` scope. World state and uploaded
images are encrypted in the browser with AES-256-GCM before entering the hidden
application-data folder in the user's Google Drive. The passphrase and
encryption key are never uploaded; losing the passphrase means the cloud copy
cannot be recovered.

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
