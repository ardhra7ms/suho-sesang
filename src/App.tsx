import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import './App.css'

type StreamId = 'knowledge' | 'language' | 'creation' | 'journey' | 'wellness'
type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'
type PageId = SeasonId | 'tulip-room'
type AppView = 'world' | 'library' | 'tulip-room'
type ElementCategory = 'seasonal' | 'photos' | 'drawings'

type Activity = {
  id: string
  stream: StreamId
  amount: number
  note?: string
  createdAt: string
}

type WorldState = {
  growth: Record<StreamId, number>
  activities: Activity[]
  placements: Record<PageId, PlacedElement[]>
}

type PlacedElement = {
  elementId: string
  x: number
  y: number
  title?: string
  notes?: ElementNote[]
}

type ElementNote = {
  id: string
  title: string
  text: string
  createdAt: string
}

type Stream = {
  id: StreamId
  name: string
  prompt: string
  examples: string
  area: string
}

type LibraryElement = {
  id: string
  name: string
  image: string
  alt: string
  category: ElementCategory
  detail: string
  shape?: 'portrait' | 'landscape' | 'square' | 'drawing'
}

const STORAGE_KEY = 'suho-sesang-world-v1'

const seasons: Array<{
  id: SeasonId
  label: string
  image: string
  alt: string
  artist: string
  title: string
  date: string
  license: string
  source: string
}> = [
  {
    id: 'spring',
    label: 'Spring',
    image: 'monet-water-lilies-1907.jpg',
    alt: 'Water Lilies, painted by Claude Monet in 1907',
    artist: 'Claude Monet',
    title: 'Water Lilies',
    date: '1907',
    license: 'public domain',
    source:
      'https://commons.wikimedia.org/wiki/File:Monet,_Claude_-_Water_Lilies_(Nymph%C3%A9as)_-_Google_Art_Project.jpg',
  },
  {
    id: 'summer',
    label: 'Summer',
    image: 'summer-hiroshige.jpg',
    alt: 'The Whirlpools of Awa, a Japanese woodblock print by Utagawa Hiroshige',
    artist: 'Utagawa Hiroshige',
    title: 'The Whirlpools of Awa',
    date: '1857',
    license: 'CC0',
    source:
      'https://commons.wikimedia.org/wiki/File:Awa_no_Naruto-%E9%9B%AA%E6%9C%88%E8%8A%B1_%E9%98%BF%E6%B3%A2%E9%B3%B4%E9%96%80%E4%B9%8B%E9%A2%A8%E6%99%AF-The_Whirlpools_of_Awa_MET_DP146864.jpg',
  },
  {
    id: 'autumn',
    label: 'Autumn',
    image: 'autumn-thomson.jpg',
    alt: 'Autumn Foliage, painted by Tom Thomson in 1915',
    artist: 'Tom Thomson',
    title: 'Autumn Foliage',
    date: '1915',
    license: 'public domain',
    source:
      'https://commons.wikimedia.org/wiki/File:Tom_Thomson_-_Autumn_Foliage_-_Google_Art_Project.jpg',
  },
  {
    id: 'winter',
    label: 'Winter',
    image: 'winter-lofoten.jpg',
    alt: 'Aurora over snowy mountains at Flakstad in Lofoten, Norway',
    artist: 'Johannes Groll',
    title: 'Aurora over Flakstad, Lofoten',
    date: '2017',
    license: 'CC0',
    source:
      'https://commons.wikimedia.org/wiki/File:Lofoten,_Norway_(Unsplash).jpg',
  },
]

const streams: Stream[] = [
  {
    id: 'creation',
    name: 'Creation',
    prompt: 'What did you bring to life?',
    examples: 'Writing · coding · creative work',
    area: 'creation-area',
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    prompt: 'What did you discover?',
    examples: 'Reading · research · learning',
    area: 'knowledge-area',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    prompt: 'How did you care for yourself?',
    examples: 'Walking · movement · rest',
    area: 'wellness-area',
  },
  {
    id: 'journey',
    name: 'Journey',
    prompt: 'What moved your journey forward?',
    examples: 'Documents · planning · life admin',
    area: 'journey-area',
  },
  {
    id: 'language',
    name: 'Language',
    prompt: 'How did your language grow?',
    examples: 'Korean · listening · vocabulary',
    area: 'language-area',
  },
]

const initialState: WorldState = {
  growth: {
    knowledge: 0,
    language: 0,
    creation: 0,
    journey: 0,
    wellness: 0,
  },
  activities: [],
  placements: {
    spring: [],
    summer: [],
    autumn: [],
    winter: [],
    'tulip-room': [],
  },
}

const milestones = [
  { name: 'a new reflection', threshold: 10 },
  { name: 'a small ripple', threshold: 20 },
  { name: 'a lotus bloom', threshold: 35 },
  { name: 'a hidden visitor', threshold: 50 },
  { name: 'a glimmer on the water', threshold: 75 },
  { name: 'another bloom', threshold: 100 },
]

const libraryElements: LibraryElement[] = [
  {
    id: 'spring-lilies',
    name: 'Lilies at dusk',
    image: 'elements/painting-spring-lilies.webp',
    alt: 'A detail of water lilies from Claude Monet’s painting',
    category: 'seasonal',
    detail: 'Spring · from Water Lilies',
    shape: 'landscape',
  },
  {
    id: 'summer-whirlpool',
    name: 'Turning tide',
    image: 'elements/painting-summer-whirlpool.webp',
    alt: 'A detail of the sea from Hiroshige’s Whirlpools of Awa',
    category: 'seasonal',
    detail: 'Summer · from The Whirlpools of Awa',
  },
  {
    id: 'autumn-leaves',
    name: 'Red canopy',
    image: 'elements/painting-autumn-leaves.webp',
    alt: 'A detail of vivid foliage from Tom Thomson’s painting',
    category: 'seasonal',
    detail: 'Autumn · from Autumn Foliage',
  },
  {
    id: 'winter-aurora',
    name: 'Night current',
    image: 'elements/painting-winter-aurora.webp',
    alt: 'A detail of the aurora over snowy Lofoten mountains',
    category: 'seasonal',
    detail: 'Winter · from Aurora over Flakstad',
  },
  {
    id: 'suho-glasses',
    name: 'A look over the glasses',
    image: 'elements/suho-glasses.webp',
    alt: 'Suho looking over rose-tinted glasses',
    category: 'photos',
    detail: 'Saved image',
  },
  {
    id: 'clippy-sun',
    name: 'Clippy takes the sun',
    image: 'elements/clippy-sun.gif',
    alt: 'Animated Clippy wearing sunglasses beside the sun',
    category: 'drawings',
    detail: 'Animated element',
    shape: 'drawing',
  },
  {
    id: 'cherry-path',
    name: 'Blossom walk',
    image: 'elements/cherry-blossom-path.webp',
    alt: 'A sunny path leading toward a fountain between cherry trees',
    category: 'photos',
    detail: 'Your photograph',
    shape: 'landscape',
  },
  {
    id: 'neon-vine',
    name: 'Green growing thing',
    image: 'elements/neon-vine.webp',
    alt: 'A hand-drawn curling green and purple botanical form',
    category: 'drawings',
    detail: 'Your drawing',
    shape: 'drawing',
  },
  {
    id: 'crimson-wing',
    name: 'Crimson wing',
    image: 'elements/floral-crimson-wing.webp',
    alt: 'A separate red hand-drawn winged flower',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
  {
    id: 'sun-wing',
    name: 'Sunlit wing',
    image: 'elements/floral-sun-wing.webp',
    alt: 'A separate red and gold hand-drawn winged flower',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
  {
    id: 'left-wing',
    name: 'Small red wing',
    image: 'elements/floral-left-wing.webp',
    alt: 'A separate small red hand-drawn winged flower',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
  {
    id: 'heart-bloom',
    name: 'Heart bloom',
    image: 'elements/floral-heart-bloom.webp',
    alt: 'A separate red and gold hand-drawn heart-shaped flower',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
  {
    id: 'right-wing',
    name: 'Turning wing',
    image: 'elements/floral-right-wing.webp',
    alt: 'A separate red hand-drawn winged flower turning inward',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
  {
    id: 'lower-left-bloom',
    name: 'Golden opening',
    image: 'elements/floral-lower-left.webp',
    alt: 'A separate red and gold hand-drawn opening flower',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
  {
    id: 'lower-right-bloom',
    name: 'Golden curl',
    image: 'elements/floral-lower-right.webp',
    alt: 'A separate red and gold hand-drawn curling flower',
    category: 'drawings',
    detail: 'Your drawing · separated',
    shape: 'drawing',
  },
]

function loadWorld(): WorldState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved) as Partial<WorldState>
    return {
      growth: { ...initialState.growth, ...parsed.growth },
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      placements: {
        spring: Array.isArray(parsed.placements?.spring) ? parsed.placements.spring : [],
        summer: Array.isArray(parsed.placements?.summer) ? parsed.placements.summer : [],
        autumn: Array.isArray(parsed.placements?.autumn) ? parsed.placements.autumn : [],
        winter: Array.isArray(parsed.placements?.winter) ? parsed.placements.winter : [],
        'tulip-room': Array.isArray(parsed.placements?.['tulip-room'])
          ? parsed.placements['tulip-room']
          : [],
      },
    }
  } catch {
    return initialState
  }
}

function loadSeason(): SeasonId {
  const requested = new URLSearchParams(window.location.search).get('season')
  return seasons.some((season) => season.id === requested)
    ? (requested as SeasonId)
    : 'spring'
}

function App() {
  const [world, setWorld] = useState<WorldState>(loadWorld)
  const [view, setView] = useState<AppView>('world')
  const [libraryReturnView, setLibraryReturnView] = useState<Exclude<AppView, 'library'>>('world')
  const [targetPage, setTargetPage] = useState<PageId>('spring')
  const [elementFilter, setElementFilter] = useState<ElementCategory | 'all'>('all')
  const [activeStream, setActiveStream] = useState<StreamId | null>(null)
  const [note, setNote] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [activeNoteSource, setActiveNoteSource] = useState<{
    page: PageId
    elementId: string
  } | null>(null)
  const [newUnlock, setNewUnlock] = useState<string | null>(null)
  const [activeSeason, setActiveSeason] = useState<SeasonId>(loadSeason)
  const dragMoved = useRef(false)

  const totalGrowth = useMemo(
    () => Object.values(world.growth).reduce((sum, value) => sum + value, 0),
    [world.growth],
  )
  const today = new Date().toDateString()
  const todayGrowth = world.activities
    .filter((activity) => new Date(activity.createdAt).toDateString() === today)
    .reduce((sum, activity) => sum + activity.amount, 0)
  const level = Math.floor(totalGrowth / 100) + 1
  const completion = Math.min(100, Math.round((totalGrowth / 300) * 100))
  const nextUnlock = milestones.find((milestone) => milestone.threshold > totalGrowth)
  const currentStream = streams.find((stream) => stream.id === activeStream)
  const season = seasons.find((item) => item.id === activeSeason)!
  const visibleElements =
    elementFilter === 'all'
      ? libraryElements
      : libraryElements.filter((item) => item.category === elementFilter)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world))
  }, [world])

  useEffect(() => {
    if (!newUnlock) return
    const timer = window.setTimeout(() => setNewUnlock(null), 3000)
    return () => window.clearTimeout(timer)
  }, [newUnlock])

  const addGrowth = (stream: StreamId, amount: number) => {
    const updatedGrowth = totalGrowth + amount
    const unlocked = milestones.find(
      (milestone) =>
        milestone.threshold > totalGrowth &&
        milestone.threshold <= updatedGrowth,
    )

    setWorld((current) => ({
      ...current,
      growth: {
        ...current.growth,
        [stream]: current.growth[stream] + amount,
      },
      activities: [
        {
          id: crypto.randomUUID(),
          stream,
          amount,
          note: note.trim() || undefined,
          createdAt: new Date().toISOString(),
        },
        ...current.activities,
      ].slice(0, 100),
    }))
    setNote('')
    setActiveStream(null)
    if (unlocked) setNewUnlock(unlocked.name)
  }

  const openLibrary = () => {
    const returnView = view === 'tulip-room' ? 'tulip-room' : 'world'
    setLibraryReturnView(returnView)
    setTargetPage(returnView === 'tulip-room' ? 'tulip-room' : activeSeason)
    setView('library')
  }

  const toggleElement = (elementId: string) => {
    setWorld((current) => {
      const currentPlacements = current.placements[targetPage]
      const isPlaced = currentPlacements.some(
        (placement) => placement.elementId === elementId,
      )

      return {
        ...current,
        placements: {
          ...current.placements,
          [targetPage]: isPlaced
            ? currentPlacements.filter(
                (placement) => placement.elementId !== elementId,
              )
            : [
                ...currentPlacements,
                {
                  elementId,
                  x: 12 + (currentPlacements.length % 5) * 17,
                  y: 18 + (Math.floor(currentPlacements.length / 5) % 4) * 18,
                  title:
                    libraryElements.find((item) => item.id === elementId)?.name ??
                    'Untitled',
                  notes: [],
                },
              ],
        },
      }
    })
  }

  const moveElement = (
    page: PageId,
    elementId: string,
    x: number,
    y: number,
  ) => {
    setWorld((current) => ({
      ...current,
      placements: {
        ...current.placements,
        [page]: current.placements[page].map((placement) =>
          placement.elementId === elementId
            ? { ...placement, x, y }
            : placement,
        ),
      },
    }))
  }

  const updatePlacedElement = (
    page: PageId,
    elementId: string,
    update: (placement: PlacedElement) => PlacedElement,
  ) => {
    setWorld((current) => ({
      ...current,
      placements: {
        ...current.placements,
        [page]: current.placements[page].map((placement) =>
          placement.elementId === elementId ? update(placement) : placement,
        ),
      },
    }))
  }

  const startDragging = (
    event: ReactPointerEvent<HTMLButtonElement>,
    page: PageId,
    elementId: string,
  ) => {
    const element = event.currentTarget
    const container = element.parentElement
    if (!container) return

    event.preventDefault()
    element.setPointerCapture(event.pointerId)
    dragMoved.current = false

    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const offsetX = event.clientX - elementRect.left
    const offsetY = event.clientY - elementRect.top
    const startX = event.clientX
    const startY = event.clientY

    const handleMove = (moveEvent: PointerEvent) => {
      if (
        Math.abs(moveEvent.clientX - startX) > 4 ||
        Math.abs(moveEvent.clientY - startY) > 4
      ) {
        dragMoved.current = true
      }
      const x = Math.max(
        0,
        Math.min(
          92,
          ((moveEvent.clientX - containerRect.left - offsetX) /
            containerRect.width) *
            100,
        ),
      )
      const y = Math.max(
        9,
        Math.min(
          88,
          ((moveEvent.clientY - containerRect.top - offsetY) /
            containerRect.height) *
            100,
        ),
      )
      moveElement(page, elementId, x, y)
    }

    const stopDragging = () => {
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerup', stopDragging)
      element.removeEventListener('pointercancel', stopDragging)
    }

    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerup', stopDragging)
    element.addEventListener('pointercancel', stopDragging)
  }

  const handlePlacedElementKey = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    page: PageId,
    placement: PlacedElement,
  ) => {
    const movement: Partial<Record<typeof event.key, [number, number]>> = {
      ArrowLeft: [-2, 0],
      ArrowRight: [2, 0],
      ArrowUp: [0, -2],
      ArrowDown: [0, 2],
    }
    const delta = movement[event.key]
    if (!delta) return

    event.preventDefault()
    moveElement(
      page,
      placement.elementId,
      Math.max(0, Math.min(92, placement.x + delta[0])),
      Math.max(9, Math.min(88, placement.y + delta[1])),
    )
  }

  const activePlacement = activeNoteSource
    ? world.placements[activeNoteSource.page].find(
        (placement) => placement.elementId === activeNoteSource.elementId,
      )
    : undefined
  const activePlacementElement = activePlacement
    ? libraryElements.find((item) => item.id === activePlacement.elementId)
    : undefined

  const addElementNote = () => {
    if (!activeNoteSource) return
    updatePlacedElement(
      activeNoteSource.page,
      activeNoteSource.elementId,
      (placement) => ({
        ...placement,
        notes: [
          ...(placement.notes ?? []),
          {
            id: crypto.randomUUID(),
            title: 'New note',
            text: '',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    )
  }

  const updateElementNote = (
    noteId: string,
    field: 'title' | 'text',
    value: string,
  ) => {
    if (!activeNoteSource) return
    updatePlacedElement(
      activeNoteSource.page,
      activeNoteSource.elementId,
      (placement) => ({
        ...placement,
        notes: (placement.notes ?? []).map((elementNote) =>
          elementNote.id === noteId
            ? { ...elementNote, [field]: value }
            : elementNote,
        ),
      }),
    )
  }

  const deleteElementNote = (noteId: string) => {
    if (!activeNoteSource) return
    updatePlacedElement(
      activeNoteSource.page,
      activeNoteSource.elementId,
      (placement) => ({
        ...placement,
        notes: (placement.notes ?? []).filter(
          (elementNote) => elementNote.id !== noteId,
        ),
      }),
    )
  }

  const placedElements = (page: PageId) => (
    <div className="placed-elements" aria-label="Placed elements">
      {world.placements[page].map((placement) => {
        const item = libraryElements.find(
          (element) => element.id === placement.elementId,
        )
        if (!item) return null

        return (
          <button
            className={`placed-element placed-${item.category}`}
            type="button"
            key={item.id}
            style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
            onPointerDown={(event) =>
              startDragging(event, page, placement.elementId)
            }
            onClick={() => {
              if (dragMoved.current) {
                dragMoved.current = false
                return
              }
              setActiveNoteSource({
                page,
                elementId: placement.elementId,
              })
            }}
            onKeyDown={(event) =>
              handlePlacedElementKey(event, page, placement)
            }
            aria-label={`Open notes for ${
              placement.title || item.name
            }. Drag or use the arrow keys to move it.`}
          >
            <img
              src={`${import.meta.env.BASE_URL}${item.image}`}
              alt=""
              draggable="false"
            />
            <span className="note-count" aria-hidden="true">
              {placement.notes?.length || '+'}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <main
      className={`app-shell ${view === 'library' ? 'library-open' : ''} ${
        view === 'tulip-room' ? 'tulip-open' : ''
      }`}
    >
      <header className={`topbar ${view === 'library' ? 'library-topbar' : ''}`}>
        <a
          className="brand"
          href="#"
          aria-label="Suho Sesang home"
          onClick={(event) => {
            event.preventDefault()
            setView('world')
          }}
        >
          <img
            className="bunny-logo"
            src={`${import.meta.env.BASE_URL}bunny.svg`}
            alt=""
          />
          <strong>suho sesang</strong>
        </a>
        <nav className="season-switcher" aria-label="Seasons">
          {seasons.map((item) => (
            <button
              className={
                view === 'world' && item.id === activeSeason ? 'active' : ''
              }
              type="button"
              key={item.id}
              onClick={() => {
                setActiveSeason(item.id)
                setView('world')
              }}
              aria-current={
                view === 'world' && item.id === activeSeason ? 'page' : undefined
              }
            >
              {item.label}
            </button>
          ))}
          <button
            className={view === 'tulip-room' ? 'active' : ''}
            type="button"
            onClick={() => setView('tulip-room')}
            aria-current={view === 'tulip-room' ? 'page' : undefined}
          >
            Tulip Room
          </button>
        </nav>
        <div className="topbar-actions">
          {view === 'world' && (
          <>
            <span className="growth-status">{totalGrowth} growth</span>
            <button
              className="record-button"
              type="button"
              onClick={() => setRecordOpen(true)}
            >
              record
            </button>
          </>
          )}
          <button
          className="library-button"
          type="button"
          onClick={() => {
            if (view === 'library') {
              setView(libraryReturnView)
            } else {
              openLibrary()
            }
          }}
          >
          {view === 'library' ? 'back' : 'elements'}
          </button>
        </div>
      </header>

      {view === 'library' ? (
        <section className="element-library" aria-labelledby="library-title">
          <header className="library-heading">
          <span className="library-eyebrow">Element library</span>
          <h1 id="library-title">The World Drawer</h1>
          <p>
            Pieces to keep, rearrange, and eventually place into each season.
          </p>
          </header>

          <div className="library-controls">
          <nav className="library-filters" aria-label="Filter elements">
            {([
              ['all', 'Everything'],
              ['seasonal', 'From the worlds'],
              ['photos', 'Photos'],
              ['drawings', 'Drawings'],
            ] as const).map(([id, label]) => (
              <button
                className={elementFilter === id ? 'active' : ''}
                type="button"
                key={id}
                onClick={() => setElementFilter(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <label className="library-destination">
            <span>Add checked pieces to</span>
            <select
              value={targetPage}
              onChange={(event) => setTargetPage(event.target.value as PageId)}
            >
              {seasons.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
              <option value="tulip-room">Tulip Room</option>
            </select>
          </label>
          </div>

          <div className="element-grid">
          {visibleElements.map((item) => (
            <article className={`element-card ${item.shape ?? 'square'}`} key={item.id}>
              <div className="element-image">
                <img
                  src={`${import.meta.env.BASE_URL}${item.image}`}
                  alt={item.alt}
                  loading="lazy"
                />
              </div>
              <button
                className={
                  world.placements[targetPage].some(
                    (placement) => placement.elementId === item.id,
                  )
                    ? 'element-check selected'
                    : 'element-check'
                }
                type="button"
                onClick={() => toggleElement(item.id)}
                aria-pressed={world.placements[targetPage].some(
                  (placement) => placement.elementId === item.id,
                )}
                aria-label={`${
                  world.placements[targetPage].some(
                    (placement) => placement.elementId === item.id,
                  )
                    ? 'Remove'
                    : 'Add'
                } ${item.name} ${
                  world.placements[targetPage].some(
                    (placement) => placement.elementId === item.id,
                  )
                    ? 'from'
                    : 'to'
                } ${
                  targetPage === 'tulip-room'
                    ? 'Tulip Room'
                    : seasons.find((page) => page.id === targetPage)?.label
                }`}
              >
                <span aria-hidden="true">✓</span>
              </button>
              <div className="element-copy">
                <h2>{item.name}</h2>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
          </div>
        </section>
      ) : view === 'tulip-room' ? (
        <section className="tulip-room-page" aria-labelledby="tulip-room-title">
          <div
            className="tulip-room-haze"
            style={{
              backgroundImage: `url("${import.meta.env.BASE_URL}elements/suho-tulips.webp")`,
            }}
            aria-hidden="true"
          />
          <img
            className="tulip-room-image"
            src={`${import.meta.env.BASE_URL}elements/suho-tulips.webp`}
            alt="Suho sitting in a room filled with yellow tulips"
          />
          <header className="tulip-room-title">
            <span>A room of its own</span>
            <h1 id="tulip-room-title">Tulip Room</h1>
          </header>
          {placedElements('tulip-room')}
        </section>
      ) : (
        <>
          <section className="painting-world" aria-label={`${season.label} world`}>
          <img
            className={`season-background season-${season.id}`}
            src={`${import.meta.env.BASE_URL}${season.image}`}
            alt={season.alt}
          />
          {streams.map((stream) => (
            <button
              className={`painting-hotspot ${stream.area}`}
              type="button"
              key={stream.id}
              aria-label={`Add growth to ${stream.name}`}
              onClick={() => setActiveStream(stream.id)}
            />
          ))}
          <button
            className="painting-hotspot record-area"
            type="button"
            aria-label="Open the garden record"
            onClick={() => setRecordOpen(true)}
          />
          {placedElements(activeSeason)}
          </section>

          <section className="stream-dock" aria-label="Life streams">
          <div className="dock-heading">
            <span>add to your world</span>
            <small>or tap the painting</small>
            </div>
          <div className="stream-actions">
            {streams.map((stream) => (
              <button
                type="button"
                key={stream.id}
                onClick={() => setActiveStream(stream.id)}
              >
                <span>{stream.name}</span>
                <small>{world.growth[stream.id]}</small>
              </button>
            ))}
          </div>
          </section>

          <footer className="painting-caption">
          <span>{season.label.toLowerCase()} · {totalGrowth} growth</span>
          <a
            href={season.source}
            target="_blank"
            rel="noreferrer"
          >
            {season.artist}, <cite>{season.title}</cite>, {season.date} · {season.license}
          </a>
          </footer>
        </>
      )}

      {currentStream && view === 'world' && (
        <div className="overlay sheet-overlay" onClick={() => setActiveStream(null)}>
          <section
          className="quick-sheet"
          onClick={(event) => event.stopPropagation()}
          aria-label={`Update ${currentStream.name}`}
          >
          <button
            className="close-button"
            type="button"
            onClick={() => setActiveStream(null)}
            aria-label="Close quick update"
          >
            ×
          </button>
          <span className="eyebrow">{currentStream.examples}</span>
          <h2>{currentStream.prompt}</h2>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="A note, if you like…"
            rows={2}
          />
          <div className="growth-buttons" aria-label="Choose growth amount">
            {[5, 10, 20, 50].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => addGrowth(currentStream.id, amount)}
              >
                +{amount}
              </button>
            ))}
          </div>
          </section>
        </div>
      )}

      {recordOpen && view === 'world' && (
        <div className="overlay" onClick={() => setRecordOpen(false)}>
          <aside
            className="garden-record"
            onClick={(event) => event.stopPropagation()}
            aria-label="Garden record"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setRecordOpen(false)}
              aria-label="Close garden record"
            >
              ×
            </button>
            <span className="eyebrow">The garden record</span>
            <h2>What the water remembers</h2>
            <div className="summary-grid">
              <div><strong>{level}</strong><span>Level</span></div>
              <div><strong>{totalGrowth}</strong><span>Growth</span></div>
              <div><strong>+{todayGrowth}</strong><span>Today</span></div>
              <div><strong>{completion}%</strong><span>{season.label}</span></div>
            </div>
            <div className="completion-track">
              <span style={{ width: `${completion}%` }} />
            </div>
            <section className="record-section">
              <h3>Life streams</h3>
              {streams.map((stream) => (
                <div className="stream-progress" key={stream.id}>
                  <span>{stream.name}</span>
                  <strong>{world.growth[stream.id]}</strong>
                </div>
              ))}
            </section>
            <section className="record-section">
              <h3>Next change</h3>
              <p>
                {nextUnlock
                  ? `${nextUnlock.name} at ${nextUnlock.threshold} growth`
                  : 'The water is fully awake—for now.'}
              </p>
            </section>
            <section className="record-section">
              <h3>Recent traces</h3>
              {world.activities.length === 0 ? (
                <p>Your first trace will appear here.</p>
              ) : (
                world.activities.slice(0, 3).map((activity) => {
                  const stream = streams.find((item) => item.id === activity.stream)!
                  return (
                    <div className="activity" key={activity.id}>
                      <strong>+{activity.amount} · {stream.name}</strong>
                      <small>{activity.note || 'A quiet step forward'}</small>
                    </div>
                  )
                })
              )}
            </section>
          </aside>
        </div>
      )}

      {activeNoteSource && activePlacement && activePlacementElement && (
        <div
          className="overlay notebook-overlay"
          onClick={() => setActiveNoteSource(null)}
        >
          <section
            className="element-notebook"
            onClick={(event) => event.stopPropagation()}
            aria-label={`Notes for ${
              activePlacement.title || activePlacementElement.name
            }`}
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setActiveNoteSource(null)}
              aria-label="Close element notes"
            >
              ×
            </button>
            <div className="notebook-source">
              <img
                src={`${import.meta.env.BASE_URL}${activePlacementElement.image}`}
                alt=""
              />
              <div>
                <span className="eyebrow">Notes held by this element</span>
                <input
                  className="notebook-title"
                  value={activePlacement.title ?? activePlacementElement.name}
                  onChange={(event) =>
                    updatePlacedElement(
                      activeNoteSource.page,
                      activeNoteSource.elementId,
                      (placement) => ({
                        ...placement,
                        title: event.target.value,
                      }),
                    )
                  }
                  aria-label="Element notes heading"
                />
              </div>
            </div>

            <div className="element-notes">
              {(activePlacement.notes ?? []).length === 0 ? (
                <p className="empty-notes">
                  Nothing here yet. Add the first note this element will hold.
                </p>
              ) : (
                (activePlacement.notes ?? []).map((elementNote) => (
                  <article className="element-note" key={elementNote.id}>
                    <input
                      value={elementNote.title}
                      onChange={(event) =>
                        updateElementNote(
                          elementNote.id,
                          'title',
                          event.target.value,
                        )
                      }
                      aria-label="Note title"
                    />
                    <textarea
                      value={elementNote.text}
                      onChange={(event) =>
                        updateElementNote(
                          elementNote.id,
                          'text',
                          event.target.value,
                        )
                      }
                      placeholder="Write anything…"
                      rows={3}
                      aria-label={`${elementNote.title || 'Untitled'} note`}
                    />
                    <button
                      className="delete-note"
                      type="button"
                      onClick={() => deleteElementNote(elementNote.id)}
                      aria-label={`Delete ${elementNote.title || 'untitled note'}`}
                    >
                      remove
                    </button>
                  </article>
                ))
              )}
            </div>

            <button className="add-note-button" type="button" onClick={addElementNote}>
              + add a note
            </button>
          </section>
        </div>
      )}

      {newUnlock && (
        <div className="unlock-toast" role="status">
          <small>The water changed</small>
          <strong>{newUnlock} appeared</strong>
        </div>
      )}
    </main>
  )
}

export default App
