# Suho Sesang

Suho Sesang (수호 세상) is a personal world that grows as you grow. Real-life
progress adds Growth to a calm palace garden, revealing new details over time.

## Current foundation

- Five interactive life streams: knowledge, language, creation, journey, and
  wellness
- One-tap `+5`, `+10`, `+20`, and `+50` Growth updates with optional notes
- Five permanent visual elements that open the life-stream Growth notes
- Four switchable seasonal worlds
- Incremental discoveries tied to meaningful Growth milestones
- A filterable element library with page-specific placement and drag positioning
- Local image uploads with four irregular frame choices and library deletion
- Custom element notebooks with editable headings and multiple editable notes
- Distinct seasonal notebook treatments for Spring, Summer, Autumn, and Winter
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

The spring world uses Claude Monet's *Water Lilies (Nymphéas)* (1907), from the
Museum of Fine Arts, Houston. The high-resolution reproduction is marked public
domain by [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Monet,_Claude_-_Water_Lilies_(Nymph%C3%A9as)_-_Google_Art_Project.jpg).

The remaining seasonal worlds use iccup's *White clouds and blue sky during
daytime* (Unsplash License), Tom Thomson's *Autumn Foliage* (1915, public
domain), and Johannes Groll's *Aurora over Flakstad, Lofoten* (2017, CC0).
Each live season links to its full source and license information. The element
library contains cropped details of these four seasonal works alongside
user-supplied images and drawings.
