# suho's sesang

suho's sesang (수호 세상) is a personal world that grows as you grow. Real-life
progress adds Growth to a calm palace garden, revealing new details over time.

## Current foundation

- Five interactive life streams: knowledge, language, creation, journey, and
  wellness
- One-tap `+5`, `+10`, `+20`, and `+50` Growth updates with optional notes
- Five permanent visual elements that open the life-stream Growth notes
- A persistent Target board for major projects, with gentle moving cloud
  markers, custom statuses, checklists, reminders, and explicit completion
  Growth
- Four switchable seasonal worlds
- Clear progression where every 100 Growth advances the garden record by one
  level
- A filterable element library with page-specific placement and drag positioning
- Local image uploads with four irregular frame choices and library deletion
- Uploaded images stored in IndexedDB and restored as usable elements after
  refresh
- Custom element notebooks with editable headings and multiple editable notes
- Distinct high-contrast comic palettes for each life-stream notebook
- Drag-to-trash custom elements with restore and permanent deletion
- Browser-only persistence with `localStorage`
- Responsive, mobile-first layout and installable web app metadata

Your progress stays in the browser on the device where you record it. World
state uses `localStorage`, while uploaded element images use IndexedDB. Version
1 does not include accounts or cloud sync.

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
