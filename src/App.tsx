import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import './styles.css'

type StreamId = 'knowledge' | 'language' | 'creation' | 'journey' | 'wellness'
type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'
type PageId = SeasonId
type AppView = 'world' | 'library'
type ElementCategory = 'seasonal' | 'photos' | 'drawings'
type ElementFrame = 'pebble' | 'puddle' | 'sprout' | 'cloud'

type Activity = {
  id: string
  stream: StreamId
  amount: number
  note?: string
  tags?: string[]
  createdAt: string
}

type WorldState = {
  growth: Record<StreamId, number>
  activities: Activity[]
  targets: ProjectTarget[]
  placements: Record<PageId, PlacedElement[]>
  streamTitles: Record<StreamId, string>
  weeklyMinimums: Record<StreamId, WeeklyMinimum>
  streamPlacements: Record<PageId, Record<StreamId, ElementPosition>>
  trash: TrashedItem[]
  elementFrames: Record<string, ElementFrame>
  deletedElementIds: string[]
}

type ElementPosition = {
  x: number
  y: number
}

type TargetChecklistItem = {
  id: string
  text: string
  done: boolean
}

type TargetMotion = {
  x: number
  y: number
  vx: number
  vy: number
}

type ProjectTarget = {
  id: string
  title: string
  outcome: string
  stream: StreamId
  month: string
  minimumSuccess: string
  nextStep: string
  notes: string
  tags: string[]
  checklist: TargetChecklistItem[]
  reminders: string
  status: string
  completionPoints: 5 | 10 | 20 | 50
  motion: TargetMotion
  createdAt: string
  completedAt?: string
}

type WorldStyle = CSSProperties & {
  '--season-image': string
  '--mobile-season-image': string
  '--world-depth': string
}

type PlacedElementStyle = CSSProperties & {
  '--mobile-y': string
}

type PlacedElement = {
  elementId: string
  x: number
  y: number
  title?: string
  notes?: ElementNote[]
  weeklyMinimum?: WeeklyMinimum
  frame?: ElementFrame
}

type WeeklyMinimum = {
  text: string
  completedWeeks: string[]
  stream?: StreamId
}

type ElementNote = {
  id: string
  title: string
  text: string
  tags?: string[]
  createdAt: string
}

type TrashedItem =
  | {
      id: string
      kind: 'activity'
      deletedAt: string
      activity: Activity
    }
  | {
      id: string
      kind: 'element'
      deletedAt: string
      page: PageId
      elementId: string
      elementName: string
      note: ElementNote
    }
  | {
      id: string
      kind: 'placed-element'
      deletedAt: string
      page: PageId
      placement: PlacedElement
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
  userCreated?: boolean
}

type StoredUserElement = {
  id: string
  name: string
  blob: Blob
  createdAt: string
}

const STORAGE_KEY = 'suho-sesang-world-v1'
const ELEMENT_DB_NAME = 'suho-sesang-elements'
const ELEMENT_STORE_NAME = 'images'

const seasons: Array<{
  id: SeasonId
  label: string
  image: string
  mobileImage?: string
  alt: string
  artist: string
  title: string
  date: string
  license: string
  source?: string
}> = [
  {
    id: 'spring',
    label: 'Spring',
    image: 'spring-suho-desktop.webp',
    mobileImage: 'spring-suho-phone.jpeg',
    alt: 'Suho sitting outside Abbey Road Studios',
    artist: 'Personal collection',
    title: 'Suho at Abbey Road Studios',
    date: 'photograph',
    license: 'user supplied',
  },
  {
    id: 'summer',
    label: 'Summer',
    image: 'summer-suho.jpeg',
    alt: 'Suho posing beside a pink bear',
    artist: 'Personal collection',
    title: 'Suho and pink bear',
    date: 'photograph',
    license: 'user supplied',
  },
  {
    id: 'autumn',
    label: 'Autumn',
    image: 'autumn-suho.webp',
    alt: 'Black-and-white portrait of Suho at a bar',
    artist: 'Personal collection',
    title: 'Suho for Vogue Korea',
    date: 'photograph',
    license: 'user supplied',
  },
  {
    id: 'winter',
    label: 'Winter',
    image: 'winter-suho.webp',
    alt: 'Suho sitting among yellow flowers',
    artist: 'Personal collection',
    title: 'Suho among flowers',
    date: 'photograph',
    license: 'user supplied',
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

const defaultStreamPositions: Record<StreamId, ElementPosition> = {
  creation: { x: 8, y: 18 },
  knowledge: { x: 29, y: 35 },
  wellness: { x: 70, y: 18 },
  journey: { x: 48, y: 57 },
  language: { x: 78, y: 55 },
}

const emptyWeeklyMinimum = (): WeeklyMinimum => ({
  text: '',
  completedWeeks: [],
})

const initialState: WorldState = {
  growth: {
    knowledge: 0,
    language: 0,
    creation: 0,
    journey: 0,
    wellness: 0,
  },
  activities: [],
  targets: [],
  placements: {
    spring: [],
    summer: [],
    autumn: [],
    winter: [],
  },
  streamTitles: {
    creation: 'Creation',
    knowledge: 'Knowledge',
    wellness: 'Wellness',
    journey: 'Journey',
    language: 'Language',
  },
  weeklyMinimums: {
    creation: emptyWeeklyMinimum(),
    knowledge: emptyWeeklyMinimum(),
    wellness: emptyWeeklyMinimum(),
    journey: emptyWeeklyMinimum(),
    language: emptyWeeklyMinimum(),
  },
  streamPlacements: {
    spring: { ...defaultStreamPositions },
    summer: { ...defaultStreamPositions },
    autumn: { ...defaultStreamPositions },
    winter: { ...defaultStreamPositions },
  },
  trash: [],
  elementFrames: {},
  deletedElementIds: [],
}

function getPlacedElementStyle(position: ElementPosition): PlacedElementStyle {
  return {
    left: `${position.x}%`,
    top: `${position.y}%`,
    '--mobile-y': `${position.y}svh`,
  }
}

function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function getElementImageSource(image: string): string {
  return /^(blob:|data:|https?:)/.test(image)
    ? image
    : `${import.meta.env.BASE_URL}${image}`
}

function calculateGrowth(activities: Activity[]): Record<StreamId, number> {
  return activities.reduce<Record<StreamId, number>>(
    (growth, activity) => ({
      ...growth,
      [activity.stream]: growth[activity.stream] + activity.amount,
    }),
    { ...initialState.growth },
  )
}

function getWeekKey(date = new Date()): string {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const week = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  )
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

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
    name: 'Cloud opening',
    image: 'elements/summer-cloud-opening-iccup.webp',
    alt: 'A detail of towering white clouds around a vivid blue sky',
    category: 'seasonal',
    detail: 'Summer · photograph by iccup',
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

const defaultStreamElements: Record<StreamId, string> = {
  creation: 'neon-vine',
  knowledge: 'suho-glasses',
  wellness: 'clippy-sun',
  journey: 'cherry-path',
  language: 'heart-bloom',
}

const defaultStreamFrames: Record<StreamId, ElementFrame> = {
  creation: 'sprout',
  knowledge: 'pebble',
  wellness: 'cloud',
  journey: 'puddle',
  language: 'sprout',
}

function openElementDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ELEMENT_DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ELEMENT_STORE_NAME)) {
        request.result.createObjectStore(ELEMENT_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadStoredElements(): Promise<StoredUserElement[]> {
  const database = await openElementDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ELEMENT_STORE_NAME, 'readonly')
    const request = transaction.objectStore(ELEMENT_STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result as StoredUserElement[])
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

async function storeElement(element: StoredUserElement): Promise<void> {
  const database = await openElementDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ELEMENT_STORE_NAME, 'readwrite')
    transaction.objectStore(ELEMENT_STORE_NAME).put(element)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => reject(transaction.error)
  })
}

async function removeStoredElement(id: string): Promise<void> {
  const database = await openElementDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ELEMENT_STORE_NAME, 'readwrite')
    transaction.objectStore(ELEMENT_STORE_NAME).delete(id)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => reject(transaction.error)
  })
}

async function prepareUploadedImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('This browser could not prepare the image.')
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The image could not be saved.')),
      'image/webp',
      0.88,
    )
  })
}

function loadWorld(): WorldState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved) as Partial<WorldState>
    const activities = Array.isArray(parsed.activities)
      ? parsed.activities
      : []
    return {
      growth: calculateGrowth(activities),
      activities,
      targets: Array.isArray(parsed.targets) ? parsed.targets : [],
      streamTitles: {
        ...initialState.streamTitles,
        ...parsed.streamTitles,
      },
      weeklyMinimums: Object.fromEntries(
        streams.map((stream) => {
          const savedMinimum = parsed.weeklyMinimums?.[stream.id]
          return [
            stream.id,
            {
              text: savedMinimum?.text ?? '',
              completedWeeks: Array.isArray(savedMinimum?.completedWeeks)
                ? savedMinimum.completedWeeks
                : [],
            },
          ]
        }),
      ) as Record<StreamId, WeeklyMinimum>,
      placements: {
        spring: Array.isArray(parsed.placements?.spring) ? parsed.placements.spring : [],
        summer: Array.isArray(parsed.placements?.summer) ? parsed.placements.summer : [],
        autumn: Array.isArray(parsed.placements?.autumn) ? parsed.placements.autumn : [],
        winter: Array.isArray(parsed.placements?.winter) ? parsed.placements.winter : [],
      },
      streamPlacements: {
        spring: {
          ...initialState.streamPlacements.spring,
          ...parsed.streamPlacements?.spring,
        },
        summer: {
          ...initialState.streamPlacements.summer,
          ...parsed.streamPlacements?.summer,
        },
        autumn: {
          ...initialState.streamPlacements.autumn,
          ...parsed.streamPlacements?.autumn,
        },
        winter: {
          ...initialState.streamPlacements.winter,
          ...parsed.streamPlacements?.winter,
        },
      },
      trash: Array.isArray(parsed.trash)
        ? parsed.trash.filter(
            (item) => !('page' in item) || String(item.page) !== 'tulip-room',
          )
        : [],
      elementFrames: parsed.elementFrames ?? {},
      deletedElementIds: Array.isArray(parsed.deletedElementIds)
        ? parsed.deletedElementIds
        : [],
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

function createTargetMotion(index: number): TargetMotion {
  return {
    x: 0.12 + ((index * 0.23) % 0.7),
    y: 0.14 + ((index * 0.19) % 0.64),
    vx: index % 2 === 0 ? 13 : -11,
    vy: index % 3 === 0 ? 8 : -7,
  }
}

function TargetCloudLayer({
  targets,
  onOpen,
  onMotionCommit,
}: {
  targets: ProjectTarget[]
  onOpen: (targetId: string) => void
  onMotionCommit: (motions: Record<string, TargetMotion>) => void
}) {
  const cloudElements = useRef(new Map<string, HTMLButtonElement>())
  const motions = useRef(new Map<string, TargetMotion>())
  const commitRef = useRef(onMotionCommit)

  useEffect(() => {
    commitRef.current = onMotionCommit
  }, [onMotionCommit])

  useEffect(() => {
    const activeIds = new Set(targets.map((target) => target.id))
    targets.forEach((target) => {
      if (!motions.current.has(target.id)) {
        motions.current.set(target.id, { ...target.motion })
      }
    })
    motions.current.forEach((_, id) => {
      if (!activeIds.has(id)) motions.current.delete(id)
    })
  }, [targets])

  useEffect(() => {
    let animationFrame = 0
    let previousTime = performance.now()
    let lastCommit = previousTime
    const motionState = motions.current

    const animate = (time: number) => {
      const elapsed = Math.min(0.05, (time - previousTime) / 1000)
      previousTime = time
      const isPhone = window.innerWidth <= 640
      const topEdge = isPhone ? 112 : 82
      const bottomEdge = 76

      motionState.forEach((motion, id) => {
        const element = cloudElements.current.get(id)
        if (!element || element.matches(':hover, :focus-visible')) return
        const width = element.offsetWidth
        const height = element.offsetHeight
        const availableWidth = Math.max(1, window.innerWidth - width - 20)
        const availableHeight = Math.max(
          1,
          window.innerHeight - topEdge - bottomEdge - height,
        )
        let nextX = motion.x * availableWidth + motion.vx * elapsed
        let nextY = motion.y * availableHeight + motion.vy * elapsed

        if (nextX <= 0 || nextX >= availableWidth) {
          motion.vx *= -1
          nextX = Math.min(availableWidth, Math.max(0, nextX))
        }
        if (nextY <= 0 || nextY >= availableHeight) {
          motion.vy *= -1
          nextY = Math.min(availableHeight, Math.max(0, nextY))
        }

        motion.x = nextX / availableWidth
        motion.y = nextY / availableHeight
        element.style.transform = `translate3d(${Math.round(nextX + 10)}px, ${Math.round(nextY + topEdge)}px, 0)`
      })

      if (time - lastCommit >= 4000 && motionState.size > 0) {
        lastCommit = time
        commitRef.current(Object.fromEntries(motionState))
      }
      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animationFrame)
      if (motionState.size > 0) {
        commitRef.current(Object.fromEntries(motionState))
      }
    }
  }, [])

  return (
    <div className="target-cloud-layer" aria-label="Active project targets">
      {targets.map((target) => (
        <button
          className={`target-cloud target-cloud-${target.stream}`}
          type="button"
          key={target.id}
          ref={(element) => {
            if (element) cloudElements.current.set(target.id, element)
            else cloudElements.current.delete(target.id)
          }}
          onClick={() => onOpen(target.id)}
          aria-label={`Open target: ${target.title || 'Untitled target'}`}
        >
          <span>{target.title || 'New target'}</span>
          <small>{target.status || 'Active'}</small>
        </button>
      ))}
    </div>
  )
}

function App() {
  const [world, setWorld] = useState<WorldState>(loadWorld)
  const [view, setView] = useState<AppView>('world')
  const [targetPage, setTargetPage] = useState<PageId>('spring')
  const [elementFilter, setElementFilter] = useState<ElementCategory | 'all'>('all')
  const [userElements, setUserElements] = useState<LibraryElement[]>([])
  const [deleteMode, setDeleteMode] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeStream, setActiveStream] = useState<StreamId | null>(null)
  const [note, setNote] = useState('')
  const [noteTags, setNoteTags] = useState('')
  const [memorySearch, setMemorySearch] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [targetsOpen, setTargetsOpen] = useState(false)
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)
  const [trashOpen, setTrashOpen] = useState(false)
  const [activeNoteSource, setActiveNoteSource] = useState<{
    page: PageId
    elementId: string
  } | null>(null)
  const [activeSeason, setActiveSeason] = useState<SeasonId>(loadSeason)
  const dragMoved = useRef(false)
  const uploadInput = useRef<HTMLInputElement>(null)

  const totalGrowth = useMemo(
    () => Object.values(world.growth).reduce((sum, value) => sum + value, 0),
    [world.growth],
  )
  const currentWeek = getWeekKey()
  const totalStars = useMemo(
    () => {
      const successfulWeeks = new Set<string>()
      Object.values(world.weeklyMinimums).forEach((minimum) => {
        minimum.completedWeeks.forEach((week) => successfulWeeks.add(week))
      })
      Object.values(world.placements).forEach((placements) => {
        placements.forEach((placement) => {
          placement.weeklyMinimum?.completedWeeks.forEach((week) =>
            successfulWeeks.add(week),
          )
        })
      })
      return successfulWeeks.size
    },
    [world.placements, world.weeklyMinimums],
  )
  const today = new Date().toDateString()
  const todayGrowth = world.activities
    .filter((activity) => new Date(activity.createdAt).toDateString() === today)
    .reduce((sum, activity) => sum + activity.amount, 0)
  const level = Math.floor(totalGrowth / 100) + 1
  const activeTargets = world.targets.filter((target) => !target.completedAt)
  const completedTargets = world.targets.filter((target) => target.completedAt)
  const currentStream = streams.find((stream) => stream.id === activeStream)
  const season = seasons.find((item) => item.id === activeSeason)!
  const worldDepth = useMemo(() => {
    const customElementDepth = world.placements[activeSeason].reduce(
      (deepest, placement) => Math.max(deepest, placement.y),
      0,
    )
    const defaultElementDepth = Object.values(
      world.streamPlacements[activeSeason],
    ).reduce((deepest, position) => Math.max(deepest, position.y), 0)
    return Math.max(165, Math.ceil(Math.max(customElementDepth, defaultElementDepth) + 35))
  }, [activeSeason, world.placements, world.streamPlacements])
  const worldStyle: WorldStyle = {
    '--season-image': `url("${import.meta.env.BASE_URL}${season.image}")`,
    '--mobile-season-image': `url("${import.meta.env.BASE_URL}${season.mobileImage ?? season.image}")`,
    '--world-depth': `${worldDepth}svh`,
  }
  const allElements = useMemo(
    () =>
      [...libraryElements, ...userElements].filter(
        (item) => !world.deletedElementIds.includes(item.id),
      ),
    [userElements, world.deletedElementIds],
  )
  const visibleElements =
    elementFilter === 'all'
      ? allElements
      : allElements.filter((item) => item.category === elementFilter)
  const memoryResults = useMemo(() => {
    const query = memorySearch.trim().toLowerCase()
    if (!query) return []
    const words = query.split(/\s+/)
    const activityResults = world.activities.map((activity) => ({
      id: `activity-${activity.id}`,
      title: world.streamTitles[activity.stream],
      text: activity.note || 'A quiet step forward',
      tags: activity.tags ?? [],
      createdAt: activity.createdAt,
      context: `+${activity.amount} growth`,
    }))
    const elementResults = Object.entries(world.placements).flatMap(
      ([page, placements]) =>
        placements.flatMap((placement) =>
          (placement.notes ?? []).map((elementNote) => ({
            id: `element-${placement.elementId}-${elementNote.id}`,
            title: elementNote.title || placement.title || 'Untitled note',
            text: elementNote.text || 'Empty note',
            tags: elementNote.tags ?? [],
            createdAt: elementNote.createdAt,
            context: `${placement.title || 'Element'} · ${
              seasons.find((seasonItem) => seasonItem.id === page)?.label
            }`,
          })),
        ),
    )
    const targetResults = world.targets.map((target) => ({
      id: `target-${target.id}`,
      title: target.title || 'Untitled target',
      text:
        [target.outcome, target.nextStep, target.minimumSuccess, target.notes]
          .filter(Boolean)
          .join(' · ') || 'Target details',
      tags: target.tags,
      createdAt: target.createdAt,
      context: `${world.streamTitles[target.stream]} target · ${target.status}`,
    }))

    return [...activityResults, ...elementResults, ...targetResults]
      .filter((result) => {
        const searchable = [
          result.title,
          result.text,
          result.context,
          ...result.tags,
        ]
          .join(' ')
          .toLowerCase()
        return words.every((word) => searchable.includes(word))
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(0, 50)
  }, [
    memorySearch,
    world.activities,
    world.placements,
    world.streamTitles,
    world.targets,
  ])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world))
  }, [world])

  useEffect(() => {
    let active = true
    loadStoredElements()
      .then((storedElements) => {
        if (!active) return
        setUserElements(
          storedElements.map((item) => ({
            id: item.id,
            name: item.name,
            image: URL.createObjectURL(item.blob),
            alt: item.name,
            category: 'photos',
            detail: 'Your upload',
            userCreated: true,
          })),
        )
      })
      .catch(() => {
        if (active) setUploadError('Your saved uploads could not be opened.')
      })
    return () => {
      active = false
    }
  }, [])

  const addGrowth = (stream: StreamId, amount: number) => {
    setWorld((current) => {
      const activities = [
        {
          id: crypto.randomUUID(),
          stream,
          amount,
          note: note.trim() || undefined,
          tags: parseTags(noteTags),
          createdAt: new Date().toISOString(),
        },
        ...current.activities,
      ]
      return {
        ...current,
        growth: calculateGrowth(activities),
        activities,
      }
    })
    setNote('')
    setNoteTags('')
  }

  const addTarget = () => {
    const id = crypto.randomUUID()
    const month = new Date().toISOString().slice(0, 7)
    setWorld((current) => ({
      ...current,
      targets: [
        ...current.targets,
        {
          id,
          title: '',
          outcome: '',
          stream: 'creation',
          month,
          minimumSuccess: '',
          nextStep: '',
          notes: '',
          tags: [],
          checklist: [],
          reminders: '',
          status: 'Planning',
          completionPoints: 20,
          motion: createTargetMotion(current.targets.length),
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    setActiveTargetId(id)
  }

  const updateTarget = (
    targetId: string,
    update: Partial<ProjectTarget>,
  ) => {
    setWorld((current) => ({
      ...current,
      targets: current.targets.map((target) =>
        target.id === targetId ? { ...target, ...update } : target,
      ),
    }))
  }

  const addTargetChecklistItem = (targetId: string) => {
    setWorld((current) => ({
      ...current,
      targets: current.targets.map((target) =>
        target.id === targetId
          ? {
              ...target,
              checklist: [
                ...target.checklist,
                { id: crypto.randomUUID(), text: '', done: false },
              ],
            }
          : target,
      ),
    }))
  }

  const updateTargetChecklistItem = (
    targetId: string,
    itemId: string,
    update: Partial<TargetChecklistItem>,
  ) => {
    setWorld((current) => ({
      ...current,
      targets: current.targets.map((target) =>
        target.id === targetId
          ? {
              ...target,
              checklist: target.checklist.map((item) =>
                item.id === itemId ? { ...item, ...update } : item,
              ),
            }
          : target,
      ),
    }))
  }

  const removeTargetChecklistItem = (targetId: string, itemId: string) => {
    setWorld((current) => ({
      ...current,
      targets: current.targets.map((target) =>
        target.id === targetId
          ? {
              ...target,
              checklist: target.checklist.filter((item) => item.id !== itemId),
            }
          : target,
      ),
    }))
  }

  const completeTarget = (targetId: string) => {
    setWorld((current) => {
      const target = current.targets.find((item) => item.id === targetId)
      if (!target || target.completedAt) return current
      const activities = [
        {
          id: crypto.randomUUID(),
          stream: target.stream,
          amount: target.completionPoints,
          note: `Completed target: ${target.title.trim() || 'Untitled target'}`,
          tags: parseTags(`target, ${target.tags.join(', ')}`),
          createdAt: new Date().toISOString(),
        },
        ...current.activities,
      ]
      return {
        ...current,
        growth: calculateGrowth(activities),
        activities,
        targets: current.targets.map((item) =>
          item.id === targetId
            ? {
                ...item,
                status: 'Complete',
                completedAt: new Date().toISOString(),
              }
            : item,
        ),
      }
    })
    setActiveTargetId(null)
  }

  const reopenTarget = (targetId: string) => {
    updateTarget(targetId, { completedAt: undefined, status: 'Active' })
    setActiveTargetId(targetId)
  }

  const deleteTarget = (targetId: string) => {
    if (!window.confirm('Delete this target and its project details?')) return
    setWorld((current) => ({
      ...current,
      targets: current.targets.filter((target) => target.id !== targetId),
    }))
    setActiveTargetId((current) => (current === targetId ? null : current))
  }

  const commitTargetMotions = (motions: Record<string, TargetMotion>) => {
    setWorld((current) => ({
      ...current,
      targets: current.targets.map((target) =>
        motions[target.id]
          ? { ...target, motion: { ...motions[target.id] } }
          : target,
      ),
    }))
  }

  const updateActivityNote = (activityId: string, value: string) => {
    setWorld((current) => ({
      ...current,
      activities: current.activities.map((activity) =>
        activity.id === activityId
          ? { ...activity, note: value }
          : activity,
      ),
    }))
  }

  const updateActivityTags = (activityId: string, value: string) => {
    setWorld((current) => ({
      ...current,
      activities: current.activities.map((activity) =>
        activity.id === activityId
          ? { ...activity, tags: parseTags(value) }
          : activity,
      ),
    }))
  }

  const updateStreamMinimum = (
    stream: StreamId,
    update: Partial<WeeklyMinimum>,
  ) => {
    setWorld((current) => ({
      ...current,
      weeklyMinimums: {
        ...current.weeklyMinimums,
        [stream]: {
          ...current.weeklyMinimums[stream],
          ...update,
        },
      },
    }))
  }

  const completeStreamMinimum = (stream: StreamId) => {
    const minimum = world.weeklyMinimums[stream]
    if (!minimum.text.trim() || minimum.completedWeeks.includes(currentWeek)) {
      return
    }
    setWorld((current) => {
      const activities = [
        {
          id: crypto.randomUUID(),
          stream,
          amount: 15,
          note: `Weekly minimum win: ${minimum.text.trim()}`,
          tags: ['minimum-win'],
          createdAt: new Date().toISOString(),
        },
        ...current.activities,
      ]
      return {
        ...current,
        growth: calculateGrowth(activities),
        activities,
        weeklyMinimums: {
          ...current.weeklyMinimums,
          [stream]: {
            ...current.weeklyMinimums[stream],
            completedWeeks: [
              ...current.weeklyMinimums[stream].completedWeeks,
              currentWeek,
            ],
          },
        },
      }
    })
  }

  const trashActivityNote = (activityId: string) => {
    setWorld((current) => {
      const activity = current.activities.find((item) => item.id === activityId)
      if (!activity) return current
      const activities = current.activities.filter(
        (item) => item.id !== activityId,
      )

      return {
        ...current,
        growth: calculateGrowth(activities),
        activities,
        trash: [
          {
            id: crypto.randomUUID(),
            kind: 'activity',
            deletedAt: new Date().toISOString(),
            activity,
          },
          ...current.trash,
        ],
      }
    })
  }

  const openLibrary = () => {
    setTargetPage(activeSeason)
    setView('library')
  }

  const uploadElement = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file.')
      return
    }

    try {
      setUploadError(null)
      const blob = await prepareUploadedImage(file)
      const id = `upload-${crypto.randomUUID()}`
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      await storeElement({
        id,
        name,
        blob,
        createdAt: new Date().toISOString(),
      })
      setUserElements((current) => [
        ...current,
        {
          id,
          name,
          image: URL.createObjectURL(blob),
          alt: name,
          category: 'photos',
          detail: 'Your upload',
          userCreated: true,
        },
      ])
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'The image could not be added.',
      )
    }
  }

  const setElementFrame = (elementId: string, frame: ElementFrame) => {
    setWorld((current) => ({
      ...current,
      elementFrames: {
        ...current.elementFrames,
        [elementId]: frame,
      },
      placements: Object.fromEntries(
        Object.entries(current.placements).map(([page, placements]) => [
          page,
          placements.map((placement) =>
            placement.elementId === elementId
              ? { ...placement, frame }
              : placement,
          ),
        ]),
      ) as Record<PageId, PlacedElement[]>,
    }))
  }

  const deleteLibraryElement = async (element: LibraryElement) => {
    if (Object.values(defaultStreamElements).includes(element.id)) return

    try {
      if (element.userCreated) await removeStoredElement(element.id)
      if (element.userCreated) {
        URL.revokeObjectURL(element.image)
        setUserElements((current) =>
          current.filter((item) => item.id !== element.id),
        )
      }
      setWorld((current) => ({
        ...current,
        deletedElementIds: current.deletedElementIds.includes(element.id)
          ? current.deletedElementIds
          : [...current.deletedElementIds, element.id],
        placements: Object.fromEntries(
          Object.entries(current.placements).map(([page, placements]) => [
            page,
            placements.filter(
              (placement) => placement.elementId !== element.id,
            ),
          ]),
        ) as Record<PageId, PlacedElement[]>,
        trash: current.trash.filter(
          (item) =>
            !(
              (item.kind === 'placed-element' &&
                item.placement.elementId === element.id) ||
              (item.kind === 'element' && item.elementId === element.id)
            ),
        ),
      }))
    } catch {
      setUploadError('This element could not be deleted.')
    }
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
                    allElements.find((item) => item.id === elementId)?.name ??
                    'Untitled',
                  notes: [],
                  frame: current.elementFrames[elementId] ?? 'pebble',
                },
              ],
        },
        trash: isPlaced
          ? [
              {
                id: crypto.randomUUID(),
                kind: 'placed-element',
                deletedAt: new Date().toISOString(),
                page: targetPage,
                placement: currentPlacements.find(
                  (placement) => placement.elementId === elementId,
                )!,
              },
              ...current.trash,
            ]
          : current.trash,
      }
    })
  }

  const trashPlacedElement = (page: PageId, elementId: string) => {
    setWorld((current) => {
      const placement = current.placements[page].find(
        (item) => item.elementId === elementId,
      )
      if (!placement) return current

      return {
        ...current,
        placements: {
          ...current.placements,
          [page]: current.placements[page].filter(
            (item) => item.elementId !== elementId,
          ),
        },
        trash: [
          {
            id: crypto.randomUUID(),
            kind: 'placed-element',
            deletedAt: new Date().toISOString(),
            page,
            placement,
          },
          ...current.trash,
        ],
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

  const moveDefaultElement = (
    page: PageId,
    stream: StreamId,
    x: number,
    y: number,
  ) => {
    setWorld((current) => ({
      ...current,
      streamPlacements: {
        ...current.streamPlacements,
        [page]: {
          ...current.streamPlacements[page],
          [stream]: { x, y },
        },
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

  const updateElementMinimum = (update: Partial<WeeklyMinimum>) => {
    if (!activeNoteSource) return
    updatePlacedElement(
      activeNoteSource.page,
      activeNoteSource.elementId,
      (placement) => ({
        ...placement,
        weeklyMinimum: {
          ...emptyWeeklyMinimum(),
          ...placement.weeklyMinimum,
          ...update,
        },
      }),
    )
  }

  const completeElementMinimum = () => {
    if (!activeNoteSource || !activePlacement?.weeklyMinimum) return
    const minimum = activePlacement.weeklyMinimum
    if (
      !minimum.text.trim() ||
      !minimum.stream ||
      minimum.completedWeeks.includes(currentWeek)
    ) {
      return
    }
    const { page, elementId } = activeNoteSource
    setWorld((current) => {
      const activities = [
        {
          id: crypto.randomUUID(),
          stream: minimum.stream!,
          amount: 15,
          note: `Weekly minimum win: ${minimum.text.trim()}`,
          tags: ['minimum-win'],
          createdAt: new Date().toISOString(),
        },
        ...current.activities,
      ]
      return {
        ...current,
        growth: calculateGrowth(activities),
        activities,
        placements: {
          ...current.placements,
          [page]: current.placements[page].map((placement) =>
            placement.elementId === elementId
              ? {
                  ...placement,
                  weeklyMinimum: {
                    ...minimum,
                    completedWeeks: [...minimum.completedWeeks, currentWeek],
                  },
                }
              : placement,
          ),
        },
      }
    })
  }

  const startDragging = (
    event: ReactPointerEvent<HTMLButtonElement>,
    onMove: (x: number, y: number) => void,
    onTrash?: () => void,
  ) => {
    const element = event.currentTarget
    const container = element.parentElement
    if (!container) return

    event.preventDefault()
    element.setPointerCapture(event.pointerId)
    dragMoved.current = false

    const elementRect = element.getBoundingClientRect()
    const offsetX = event.clientX - elementRect.left
    const offsetY = event.clientY - elementRect.top
    const startX = event.clientX
    const startY = event.clientY
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    let latestClientX = event.clientX
    let latestClientY = event.clientY
    let scrollFrame = 0
    const isOverTrash = (pointerEvent: PointerEvent, rect: DOMRect) =>
      pointerEvent.clientX >= rect.left - 24 &&
      pointerEvent.clientX <= rect.right + 24 &&
      pointerEvent.clientY >= rect.top - 24 &&
      pointerEvent.clientY <= rect.bottom + 24

    const updatePosition = (clientX: number, clientY: number) => {
      const containerRect = container.getBoundingClientRect()
      const maximumX =
        ((containerRect.width - elementRect.width) / containerRect.width) * 100
      const x = Math.max(
        0,
        Math.min(
          maximumX,
          ((clientX - containerRect.left - offsetX) /
            containerRect.width) *
            100,
        ),
      )
      const rawY = isMobile
        ? ((clientY - containerRect.top - offsetY) / window.innerHeight) * 100
        : ((clientY - containerRect.top - offsetY) / containerRect.height) * 100
      const maximumY =
        ((containerRect.height - elementRect.height) / containerRect.height) * 100
      const y = Math.max(9, isMobile ? rawY : Math.min(maximumY, rawY))
      onMove(x, y)
    }

    const autoScroll = () => {
      if (isMobile) {
        const edgeSize = Math.min(110, window.innerHeight * 0.16)
        const bottomDistance = window.innerHeight - latestClientY
        const topDistance = latestClientY
        const scrollAmount =
          bottomDistance < edgeSize
            ? Math.ceil((edgeSize - bottomDistance) / 14)
            : topDistance < edgeSize
              ? -Math.ceil((edgeSize - topDistance) / 14)
              : 0

        if (scrollAmount !== 0) {
          window.scrollBy(0, scrollAmount)
          updatePosition(latestClientX, latestClientY)
        }
      }
      scrollFrame = window.requestAnimationFrame(autoScroll)
    }

    const handleMove = (moveEvent: PointerEvent) => {
      latestClientX = moveEvent.clientX
      latestClientY = moveEvent.clientY
      if (
        Math.abs(moveEvent.clientX - startX) > 4 ||
        Math.abs(moveEvent.clientY - startY) > 4
      ) {
        dragMoved.current = true
      }
      updatePosition(moveEvent.clientX, moveEvent.clientY)

      const bin = document.querySelector<HTMLElement>('[data-trash-bin]')
      if (bin && onTrash) {
        const binRect = bin.getBoundingClientRect()
        bin.classList.toggle('is-drop-target', isOverTrash(moveEvent, binRect))
      }
    }

    const stopDragging = (endEvent: PointerEvent) => {
      const bin = document.querySelector<HTMLElement>('[data-trash-bin]')
      const binRect = bin?.getBoundingClientRect()
      const droppedInBin =
        endEvent.type === 'pointerup' &&
        onTrash &&
        binRect &&
        isOverTrash(endEvent, binRect)

      bin?.classList.remove('is-drop-target')
      window.cancelAnimationFrame(scrollFrame)
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerup', stopDragging)
      element.removeEventListener('pointercancel', stopDragging)
      if (droppedInBin) onTrash()
    }

    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerup', stopDragging)
    element.addEventListener('pointercancel', stopDragging)
    scrollFrame = window.requestAnimationFrame(autoScroll)
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
      Math.max(
        9,
        window.matchMedia('(max-width: 640px)').matches
          ? placement.y + delta[1]
          : Math.min(88, placement.y + delta[1]),
      ),
    )
  }

  const handleDefaultElementKey = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    page: PageId,
    stream: StreamId,
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
    const position = world.streamPlacements[page][stream]
    moveDefaultElement(
      page,
      stream,
      Math.max(0, Math.min(92, position.x + delta[0])),
      Math.max(
        9,
        window.matchMedia('(max-width: 640px)').matches
          ? position.y + delta[1]
          : Math.min(88, position.y + delta[1]),
      ),
    )
  }

  const activePlacement = activeNoteSource
    ? world.placements[activeNoteSource.page].find(
        (placement) => placement.elementId === activeNoteSource.elementId,
      )
    : undefined
  const activePlacementElement = activePlacement
    ? allElements.find((item) => item.id === activePlacement.elementId)
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

  const updateElementNoteTags = (noteId: string, value: string) => {
    if (!activeNoteSource) return
    updatePlacedElement(
      activeNoteSource.page,
      activeNoteSource.elementId,
      (placement) => ({
        ...placement,
        notes: (placement.notes ?? []).map((elementNote) =>
          elementNote.id === noteId
            ? { ...elementNote, tags: parseTags(value) }
            : elementNote,
        ),
      }),
    )
  }

  const deleteElementNote = (noteId: string) => {
    if (!activeNoteSource) return
    setWorld((current) => {
      const placement = current.placements[activeNoteSource.page].find(
        (item) => item.elementId === activeNoteSource.elementId,
      )
      const elementNote = placement?.notes?.find((item) => item.id === noteId)
      if (!placement || !elementNote) return current

      return {
        ...current,
        placements: {
          ...current.placements,
          [activeNoteSource.page]: current.placements[
            activeNoteSource.page
          ].map((item) =>
            item.elementId === activeNoteSource.elementId
              ? {
                  ...item,
                  notes: (item.notes ?? []).filter(
                    (noteItem) => noteItem.id !== noteId,
                  ),
                }
              : item,
          ),
        },
        trash: [
          {
            id: crypto.randomUUID(),
            kind: 'element',
            deletedAt: new Date().toISOString(),
            page: activeNoteSource.page,
            elementId: activeNoteSource.elementId,
            elementName: placement.title ?? 'Untitled element',
            note: elementNote,
          },
          ...current.trash,
        ],
      }
    })
  }

  const restoreTrashedNote = (trashId: string) => {
    setWorld((current) => {
      const trashed = current.trash.find((item) => item.id === trashId)
      if (!trashed) return current

      if (trashed.kind === 'activity') {
        const activities = [trashed.activity, ...current.activities]
        return {
          ...current,
          growth: calculateGrowth(activities),
          activities,
          trash: current.trash.filter((item) => item.id !== trashId),
        }
      }

      if (trashed.kind === 'placed-element') {
        const alreadyPlaced = current.placements[trashed.page].some(
          (placement) =>
            placement.elementId === trashed.placement.elementId,
        )
        if (alreadyPlaced) return current

        return {
          ...current,
          placements: {
            ...current.placements,
            [trashed.page]: [
              ...current.placements[trashed.page],
              trashed.placement,
            ],
          },
          trash: current.trash.filter((item) => item.id !== trashId),
        }
      }

      const sourceExists = current.placements[trashed.page].some(
        (placement) => placement.elementId === trashed.elementId,
      )
      if (!sourceExists) return current

      return {
        ...current,
        placements: {
          ...current.placements,
          [trashed.page]: current.placements[trashed.page].map((placement) =>
            placement.elementId === trashed.elementId
              ? {
                  ...placement,
                  notes: [...(placement.notes ?? []), trashed.note],
                }
              : placement,
          ),
        },
        trash: current.trash.filter((item) => item.id !== trashId),
      }
    })
  }

  const permanentlyDeleteNote = (trashId: string) => {
    setWorld((current) => ({
      ...current,
      trash: current.trash.filter((item) => item.id !== trashId),
    }))
  }

  const placedElements = (page: PageId) => (
    <div className="placed-elements" aria-label="Placed elements">
      {world.placements[page].map((placement) => {
        const item = allElements.find(
          (element) => element.id === placement.elementId,
        )
        if (!item) return null

        return (
          <button
            className={`placed-element placed-${item.category} frame-${
              placement.frame ?? world.elementFrames[item.id] ?? 'pebble'
            }`}
            type="button"
            key={item.id}
            style={getPlacedElementStyle(placement)}
            onPointerDown={(event) =>
              startDragging(
                event,
                (x, y) => moveElement(page, placement.elementId, x, y),
                () => trashPlacedElement(page, placement.elementId),
              )
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
              src={getElementImageSource(item.image)}
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

  const defaultElements = (page: PageId) => (
    <div
      className="placed-elements default-stream-elements"
      aria-label="Default note elements"
    >
      {streams.map((stream) => {
        const item = libraryElements.find(
          (element) => element.id === defaultStreamElements[stream.id],
        )!
        const position = world.streamPlacements[page][stream.id]
        const noteCount = world.activities.filter(
          (activity) => activity.stream === stream.id,
        ).length

        return (
          <button
            className={`placed-element default-note-element placed-${item.category} frame-${defaultStreamFrames[stream.id]}`}
            type="button"
            key={stream.id}
            style={getPlacedElementStyle(position)}
            onPointerDown={(event) =>
              startDragging(
                event,
                (x, y) => moveDefaultElement(page, stream.id, x, y),
              )
            }
            onClick={() => {
              if (dragMoved.current) {
                dragMoved.current = false
                return
              }
              setActiveStream(stream.id)
            }}
            onKeyDown={(event) =>
              handleDefaultElementKey(event, page, stream.id)
            }
            aria-label={`Open ${world.streamTitles[stream.id]} notes. Drag or use the arrow keys to move this element.`}
          >
            <img
              src={getElementImageSource(item.image)}
              alt=""
              draggable="false"
            />
            <span className="stream-element-name" aria-hidden="true">
              {world.streamTitles[stream.id]}
            </span>
            <span className="note-count" aria-hidden="true">
              {noteCount
                ? `${noteCount} ${noteCount === 1 ? 'note' : 'notes'}`
                : '+'}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <main
      className={`app-shell ${view === 'library' ? 'library-open' : ''}`}
      style={worldStyle}
    >
      <header className={`topbar ${view === 'library' ? 'library-topbar' : ''}`}>
        <a
          className="brand"
          href="#"
          aria-label="suho's sesang home"
          onClick={(event) => {
            event.preventDefault()
            setView('world')
          }}
        >
          <img
            className="bunny-logo"
            src={`${import.meta.env.BASE_URL}bunny-simple.svg`}
            alt=""
          />
          <strong>suho's sesang</strong>
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
        </nav>
        <div className="topbar-actions">
          {view === 'world' && (
          <>
            <span className="growth-status">
              {totalGrowth} growth · <span aria-label={`${totalStars} successful weeks`}>★ {totalStars}</span>
            </span>
            <button
              className="record-button"
              type="button"
              onClick={() => setRecordOpen(true)}
            >
              Record
            </button>
            <button
              className="targets-button"
              type="button"
              onClick={() => setTargetsOpen(true)}
            >
              Targets{activeTargets.length ? ` ${activeTargets.length}` : ''}
            </button>
          </>
          )}
          <button
          className="library-button"
          type="button"
          onClick={() => {
            if (view === 'library') {
              setView('world')
            } else {
              openLibrary()
            }
          }}
          >
          {view === 'library' ? 'Back' : 'Elements'}
          </button>
        </div>
      </header>

      {view === 'world' && activeTargets.length > 0 && (
        <TargetCloudLayer
          targets={activeTargets}
          onOpen={(targetId) => {
            setActiveTargetId(targetId)
            setTargetsOpen(true)
          }}
          onMotionCommit={commitTargetMotions}
        />
      )}

      {view === 'library' ? (
        <section className="element-library" aria-labelledby="library-title">
          <header className="library-heading">
          <span className="library-eyebrow">Element library</span>
          <h1 id="library-title">The world drawer</h1>
          <p>
            Pieces to keep, rearrange, and eventually place into each season.
          </p>
          {uploadError && <p className="library-error" role="alert">{uploadError}</p>}
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
            </select>
          </label>
          </div>

          <div className="element-grid">
          {visibleElements.map((item) => (
            <article className={`element-card ${item.shape ?? 'square'}`} key={item.id}>
              <div
                className={`element-image frame-${
                  world.elementFrames[item.id] ?? 'pebble'
                }`}
              >
                <img
                  src={getElementImageSource(item.image)}
                  alt={item.alt}
                  loading="lazy"
                />
              </div>
              <div className="frame-choices" aria-label={`Shape for ${item.name}`}>
                {(['pebble', 'puddle', 'sprout', 'cloud'] as const).map(
                  (frame) => (
                    <button
                      className={
                        (world.elementFrames[item.id] ?? 'pebble') === frame
                          ? `frame-choice frame-${frame} active`
                          : `frame-choice frame-${frame}`
                      }
                      type="button"
                      key={frame}
                      onClick={() => setElementFrame(item.id, frame)}
                      aria-label={`Use ${frame} shape`}
                      aria-pressed={
                        (world.elementFrames[item.id] ?? 'pebble') === frame
                      }
                    />
                  ),
                )}
              </div>
              {Object.values(defaultStreamElements).includes(item.id) ? (
                <span className="default-element-mark">Default</span>
              ) : (
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
                    seasons.find((page) => page.id === targetPage)?.label
                  }`}
                >
                  <span aria-hidden="true">✓</span>
                </button>
              )}
              <div className="element-copy">
                <h2>{item.name}</h2>
                <p>{item.detail}</p>
              </div>
              {deleteMode &&
                !Object.values(defaultStreamElements).includes(item.id) && (
                  <button
                    className="library-delete-element"
                    type="button"
                    onClick={() => deleteLibraryElement(item)}
                    aria-label={`Permanently delete ${item.name} from the library`}
                  >
                    delete
                  </button>
                )}
            </article>
          ))}
          </div>

          <div className="library-tools" aria-label="Element library tools">
            <input
              ref={uploadInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                files.forEach((file) => void uploadElement(file))
                event.target.value = ''
              }}
              aria-label="Upload element images"
            />
            <button
              type="button"
              onClick={() => uploadInput.current?.click()}
              aria-label="Upload element images"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" />
              </svg>
            </button>
            <button
              className={deleteMode ? 'active' : ''}
              type="button"
              onClick={() => setDeleteMode((current) => !current)}
              aria-label={deleteMode ? 'Exit delete mode' : 'Delete elements'}
              aria-pressed={deleteMode}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 8v10m4-10v10m4-10v10M5 5h14m-9-2h4m4 2-1 16H7L6 5" />
              </svg>
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="painting-world" aria-label={`${season.label} world`}>
          <img
            className={`season-background season-${season.id}`}
            src={`${import.meta.env.BASE_URL}${season.image}`}
            alt={season.alt}
          />
          <button
            className="painting-hotspot record-area"
            type="button"
            aria-label="Open the garden record"
            onClick={() => setRecordOpen(true)}
          />
          {defaultElements(activeSeason)}
          {placedElements(activeSeason)}
          </section>

          <footer className="painting-caption">
          <span>{season.label.toLowerCase()} · {totalGrowth} growth</span>
          {season.source ? (
            <a href={season.source} target="_blank" rel="noreferrer">
              {season.artist}, <cite>{season.title}</cite>, {season.date} · {season.license}
            </a>
          ) : (
            <span>
              {season.artist}, <cite>{season.title}</cite> · {season.license}
            </span>
          )}
          </footer>
        </>
      )}

      {currentStream && view !== 'library' && (
        <div
          className="overlay notebook-overlay"
          onClick={() => setActiveStream(null)}
        >
          <section
            className={`stream-notebook themed-notebook comic-strip notebook-season-${activeSeason} notebook-stream-${currentStream.id}`}
            onClick={(event) => event.stopPropagation()}
            aria-label={`${world.streamTitles[currentStream.id]} notes`}
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setActiveStream(null)}
              aria-label="Close default element"
            >
              ×
            </button>
            <div className="comic-heading-panel">
              <input
                className="stream-notebook-title"
                value={world.streamTitles[currentStream.id]}
                onChange={(event) =>
                  setWorld((current) => ({
                    ...current,
                    streamTitles: {
                      ...current.streamTitles,
                      [currentStream.id]: event.target.value,
                    },
                  }))
                }
                aria-label="Element heading"
              />
              <div className="stream-prompt-panel">
                <span className="stream-prompt-kicker">Meanwhile, in your world…</span>
                <p className="stream-prompt">{currentStream.prompt}</p>
                <span className="stream-prompt-examples">{currentStream.examples}</span>
                <span className="stream-prompt-spark" aria-hidden="true">✦</span>
              </div>
            </div>
            <section className="weekly-minimum" aria-label="Weekly minimum win">
              <div className="weekly-minimum-heading">
                <div>
                  <span>This week's minimum win</span>
                  <strong>★ {world.weeklyMinimums[currentStream.id].completedWeeks.length}</strong>
                </div>
                <label className="minimum-check">
                  <input
                    type="checkbox"
                    checked={world.weeklyMinimums[
                      currentStream.id
                    ].completedWeeks.includes(currentWeek)}
                    disabled={
                      !world.weeklyMinimums[currentStream.id].text.trim() ||
                      world.weeklyMinimums[
                        currentStream.id
                      ].completedWeeks.includes(currentWeek)
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        completeStreamMinimum(currentStream.id)
                      }
                    }}
                  />
                  <span>Complete for +15</span>
                </label>
              </div>
              <input
                className="minimum-text"
                value={world.weeklyMinimums[currentStream.id].text}
                onChange={(event) =>
                  updateStreamMinimum(currentStream.id, {
                    text: event.target.value,
                  })
                }
                placeholder="What is the smallest successful version this week?"
                aria-label="Weekly minimum win"
              />
              <details className="points-guide">
                <summary>How growth works</summary>
                <p>
                  5 small step · 10 focused session · 15 weekly minimum win ·
                  20 major milestone · 50 breakthrough
                </p>
              </details>
            </section>
            <div className="new-growth-note">
              <span className="comic-panel-label">Write it down</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Write a new note…"
                rows={2}
              />
              <input
                className="tag-editor"
                value={noteTags}
                onChange={(event) => setNoteTags(event.target.value)}
                placeholder="tags, separated by commas"
                aria-label="Tags for this note"
              />
              <div className="growth-buttons" aria-label="Save note with growth">
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
            </div>
            <div className="stream-note-history">
              <h3>Notes held here</h3>
              {world.activities.filter(
                (activity) => activity.stream === currentStream.id,
              ).length === 0 ? (
                <p className="empty-stream-notes">No notes yet.</p>
              ) : (
                world.activities
                  .filter((activity) => activity.stream === currentStream.id)
                  .map((activity) => (
                    <article className="stream-note" key={activity.id}>
                      <div>
                        <strong>+{activity.amount}</strong>
                        <time dateTime={activity.createdAt}>
                          {formatDate(activity.createdAt)}
                        </time>
                      </div>
                      <div className="note-fields">
                        <textarea
                          value={activity.note ?? ''}
                          onChange={(event) =>
                            updateActivityNote(activity.id, event.target.value)
                          }
                          placeholder="Add words to this trace…"
                          rows={2}
                          aria-label={`${world.streamTitles[currentStream.id]} note`}
                        />
                        <input
                          className="tag-editor"
                          value={(activity.tags ?? []).join(', ')}
                          onChange={(event) =>
                            updateActivityTags(activity.id, event.target.value)
                          }
                          placeholder="add tags"
                          aria-label={`Tags for ${world.streamTitles[currentStream.id]} note`}
                        />
                      </div>
                      <button
                        className="trash-note-button"
                        type="button"
                        onClick={() => trashActivityNote(activity.id)}
                        aria-label={`Move this ${world.streamTitles[currentStream.id]} note to trash`}
                      >
                        Remove
                      </button>
                    </article>
                  ))
              )}
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
              <div><strong>{totalStars}</strong><span>Successful weeks</span></div>
            </div>
            <p className="level-rule">Every 100 Growth advances one level.</p>
            <section className="record-section memory-search">
              <h3>Find a memory</h3>
              <input
                type="search"
                value={memorySearch}
                onChange={(event) => setMemorySearch(event.target.value)}
                placeholder="Search notes, elements, or tags"
                aria-label="Search all memories"
              />
              {memorySearch.trim() && (
                <div className="memory-results" aria-live="polite">
                  {memoryResults.length === 0 ? (
                    <p>No memories match that search.</p>
                  ) : (
                    memoryResults.map((result) => (
                      <article className="memory-result" key={result.id}>
                        <div className="memory-result-heading">
                          <strong>{result.title}</strong>
                          <time dateTime={result.createdAt}>
                            {formatDate(result.createdAt)}
                          </time>
                        </div>
                        <small>{result.context}</small>
                        <p>{result.text}</p>
                        {result.tags.length > 0 && (
                          <div className="note-tags" aria-label="Tags">
                            {result.tags.map((tag) => (
                              <span key={tag}>#{tag}</span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              )}
            </section>
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

      {targetsOpen && view === 'world' && (
        <div className="overlay" onClick={() => setTargetsOpen(false)}>
          <aside
            className="target-board"
            onClick={(event) => event.stopPropagation()}
            aria-label="Target board"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setTargetsOpen(false)}
              aria-label="Close Target board"
            >
              ×
            </button>
            <header className="target-board-heading">
              <span>Major projects</span>
              <h2>Target board</h2>
              <p>
                Shape the outcome here. Active targets become drifting clouds
                in every season.
              </p>
              <button type="button" onClick={addTarget}>+ Add a target</button>
            </header>

            <datalist id="target-status-options">
              <option value="Planning" />
              <option value="Active" />
              <option value="Waiting" />
              <option value="Paused" />
              <option value="Reviewing" />
            </datalist>

            <section className="target-board-section">
              <h3>Active clouds</h3>
              {activeTargets.length === 0 ? (
                <p className="empty-targets">
                  Add a major project and its cloud will enter the world.
                </p>
              ) : (
                <div className="target-card-list">
                  {activeTargets.map((target) => {
                    const expanded = activeTargetId === target.id
                    const completedSteps = target.checklist.filter(
                      (item) => item.done,
                    ).length
                    return (
                      <article
                        className={`target-card target-card-${target.stream} ${expanded ? 'expanded' : ''}`}
                        key={target.id}
                      >
                        <button
                          className="target-card-summary"
                          type="button"
                          onClick={() =>
                            setActiveTargetId(expanded ? null : target.id)
                          }
                          aria-expanded={expanded}
                        >
                          <span>
                            {world.streamTitles[target.stream]} · {target.status}
                          </span>
                          <strong>{target.title || 'Untitled target'}</strong>
                          <small>
                            {target.checklist.length
                              ? `${completedSteps}/${target.checklist.length} steps`
                              : 'No steps yet'}
                          </small>
                        </button>

                        {expanded && (
                          <div className="target-card-editor">
                            <label className="target-field target-field-wide">
                              <span>Project name</span>
                              <input
                                value={target.title}
                                onChange={(event) =>
                                  updateTarget(target.id, {
                                    title: event.target.value,
                                  })
                                }
                                placeholder="Name this target"
                              />
                            </label>
                            <label className="target-field target-field-wide">
                              <span>Target outcome</span>
                              <textarea
                                value={target.outcome}
                                onChange={(event) =>
                                  updateTarget(target.id, {
                                    outcome: event.target.value,
                                  })
                                }
                                placeholder="What will be true when this succeeds?"
                              />
                            </label>
                            <div className="target-field-row">
                              <label className="target-field">
                                <span>Life stream</span>
                                <select
                                  value={target.stream}
                                  onChange={(event) =>
                                    updateTarget(target.id, {
                                      stream: event.target.value as StreamId,
                                    })
                                  }
                                >
                                  {streams.map((stream) => (
                                    <option value={stream.id} key={stream.id}>
                                      {world.streamTitles[stream.id]}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="target-field">
                                <span>Target month</span>
                                <input
                                  type="month"
                                  value={target.month}
                                  onChange={(event) =>
                                    updateTarget(target.id, {
                                      month: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label className="target-field">
                                <span>Status</span>
                                <input
                                  list="target-status-options"
                                  value={target.status}
                                  onChange={(event) =>
                                    updateTarget(target.id, {
                                      status: event.target.value,
                                    })
                                  }
                                  placeholder="Add a status"
                                />
                              </label>
                            </div>
                            <label className="target-field target-field-wide">
                              <span>Minimum success</span>
                              <input
                                value={target.minimumSuccess}
                                onChange={(event) =>
                                  updateTarget(target.id, {
                                    minimumSuccess: event.target.value,
                                  })
                                }
                                placeholder="The smallest version that still counts"
                              />
                            </label>
                            <label className="target-field target-field-wide">
                              <span>Next concrete step</span>
                              <input
                                value={target.nextStep}
                                onChange={(event) =>
                                  updateTarget(target.id, {
                                    nextStep: event.target.value,
                                  })
                                }
                                placeholder="What happens next?"
                              />
                            </label>

                            <section className="target-checklist">
                              <div>
                                <h4>Progress</h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    addTargetChecklistItem(target.id)
                                  }
                                >
                                  + Add step
                                </button>
                              </div>
                              {target.checklist.map((item) => (
                                <label key={item.id}>
                                  <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={(event) =>
                                      updateTargetChecklistItem(
                                        target.id,
                                        item.id,
                                        { done: event.target.checked },
                                      )
                                    }
                                  />
                                  <input
                                    value={item.text}
                                    onChange={(event) =>
                                      updateTargetChecklistItem(
                                        target.id,
                                        item.id,
                                        { text: event.target.value },
                                      )
                                    }
                                    placeholder="A concrete step"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeTargetChecklistItem(
                                        target.id,
                                        item.id,
                                      )
                                    }
                                    aria-label="Remove step"
                                  >
                                    ×
                                  </button>
                                </label>
                              ))}
                            </section>

                            <label className="target-field target-field-wide">
                              <span>Notes</span>
                              <textarea
                                value={target.notes}
                                onChange={(event) =>
                                  updateTarget(target.id, {
                                    notes: event.target.value,
                                  })
                                }
                                placeholder="Context, decisions, or ideas"
                              />
                            </label>
                            <div className="target-field-row">
                              <label className="target-field">
                                <span>Tags</span>
                                <input
                                  value={target.tags.join(', ')}
                                  onChange={(event) =>
                                    updateTarget(target.id, {
                                      tags: parseTags(event.target.value),
                                    })
                                  }
                                  placeholder="work, writing"
                                />
                              </label>
                              <label className="target-field">
                                <span>Reminders</span>
                                <input
                                  value={target.reminders}
                                  onChange={(event) =>
                                    updateTarget(target.id, {
                                      reminders: event.target.value,
                                    })
                                  }
                                  placeholder="Friday review"
                                />
                              </label>
                            </div>

                            <footer className="target-card-actions">
                              <label>
                                <span>Completion Growth</span>
                                <select
                                  value={target.completionPoints}
                                  onChange={(event) =>
                                    updateTarget(target.id, {
                                      completionPoints: Number(
                                        event.target.value,
                                      ) as ProjectTarget['completionPoints'],
                                    })
                                  }
                                >
                                  <option value={5}>+5 small</option>
                                  <option value={10}>+10 focused</option>
                                  <option value={20}>+20 major</option>
                                  <option value={50}>+50 breakthrough</option>
                                </select>
                              </label>
                              <button
                                className="complete-target"
                                type="button"
                                onClick={() => completeTarget(target.id)}
                              >
                                ✓ Complete for +{target.completionPoints}
                              </button>
                              <button
                                className="delete-target"
                                type="button"
                                onClick={() => deleteTarget(target.id)}
                              >
                                Delete
                              </button>
                            </footer>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            {completedTargets.length > 0 && (
              <section className="target-board-section completed-targets">
                <h3>Completed targets</h3>
                {completedTargets.map((target) => (
                  <article key={target.id}>
                    <div>
                      <strong>{target.title || 'Untitled target'}</strong>
                      <small>
                        {formatDate(target.completedAt!)} · +{target.completionPoints}{' '}
                        Growth
                      </small>
                    </div>
                    <button type="button" onClick={() => reopenTarget(target.id)}>
                      Reopen
                    </button>
                    <button type="button" onClick={() => deleteTarget(target.id)}>
                      Delete
                    </button>
                  </article>
                ))}
              </section>
            )}
          </aside>
        </div>
      )}

      {activeNoteSource && activePlacement && activePlacementElement && (
        <div
          className="overlay notebook-overlay"
          onClick={() => setActiveNoteSource(null)}
        >
          <section
            className={`element-notebook themed-notebook comic-strip notebook-season-${activeNoteSource.page}`}
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
            <section className="weekly-minimum" aria-label="Weekly minimum win">
              <div className="weekly-minimum-heading">
                <div>
                  <span>This week's minimum win</span>
                  <strong>
                    ★ {activePlacement.weeklyMinimum?.completedWeeks.length ?? 0}
                  </strong>
                </div>
                <label className="minimum-check">
                  <input
                    type="checkbox"
                    checked={
                      activePlacement.weeklyMinimum?.completedWeeks.includes(
                        currentWeek,
                      ) ?? false
                    }
                    disabled={
                      !activePlacement.weeklyMinimum?.text.trim() ||
                      !activePlacement.weeklyMinimum.stream ||
                      activePlacement.weeklyMinimum.completedWeeks.includes(
                        currentWeek,
                      )
                    }
                    onChange={(event) => {
                      if (event.target.checked) completeElementMinimum()
                    }}
                  />
                  <span>Complete for +15</span>
                </label>
              </div>
              <input
                className="minimum-text"
                value={activePlacement.weeklyMinimum?.text ?? ''}
                onChange={(event) =>
                  updateElementMinimum({ text: event.target.value })
                }
                placeholder="What is the smallest successful version this week?"
                aria-label="Weekly minimum win"
              />
              <label className="minimum-stream">
                <span>Add growth to</span>
                <select
                  value={activePlacement.weeklyMinimum?.stream ?? ''}
                  onChange={(event) =>
                    updateElementMinimum({
                      stream: event.target.value as StreamId,
                    })
                  }
                >
                  <option value="" disabled>
                    Choose a life stream
                  </option>
                  {streams.map((stream) => (
                    <option value={stream.id} key={stream.id}>
                      {world.streamTitles[stream.id]}
                    </option>
                  ))}
                </select>
              </label>
              <details className="points-guide">
                <summary>How growth works</summary>
                <p>
                  5 small step · 10 focused session · 15 weekly minimum win ·
                  20 major milestone · 50 breakthrough
                </p>
              </details>
            </section>

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
                    <div className="element-note-meta">
                      <time dateTime={elementNote.createdAt}>
                        {formatDate(elementNote.createdAt)}
                      </time>
                      <input
                        className="tag-editor"
                        value={(elementNote.tags ?? []).join(', ')}
                        onChange={(event) =>
                          updateElementNoteTags(
                            elementNote.id,
                            event.target.value,
                          )
                        }
                        placeholder="add tags"
                        aria-label={`Tags for ${elementNote.title || 'untitled note'}`}
                      />
                    </div>
                    <button
                      className="delete-note"
                      type="button"
                      onClick={() => deleteElementNote(elementNote.id)}
                      aria-label={`Move ${elementNote.title || 'untitled note'} to trash`}
                    >
                      Remove
                    </button>
                  </article>
                ))
              )}
            </div>

            <button className="add-note-button" type="button" onClick={addElementNote}>
              + Add a note
            </button>
          </section>
        </div>
      )}

      {view !== 'library' && <button
        className={`trash-bin-button ${world.trash.length > 0 ? 'has-notes' : ''}`}
        type="button"
        data-trash-bin
        onClick={() => setTrashOpen(true)}
        aria-label={`Open trash${world.trash.length ? `, ${world.trash.length} items` : ''}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8v10m4-10v10m4-10v10M5 5h14m-9-2h4m4 2-1 16H7L6 5" />
        </svg>
        {world.trash.length > 0 && <span>{world.trash.length}</span>}
      </button>}

      {trashOpen && (
        <div className="overlay" onClick={() => setTrashOpen(false)}>
          <aside
            className="trash-panel"
            onClick={(event) => event.stopPropagation()}
            aria-label="Deleted notes"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setTrashOpen(false)}
              aria-label="Close trash"
            >
              ×
            </button>
            <span className="eyebrow">Trash</span>
            <h2>Things set aside</h2>
            {world.trash.length === 0 ? (
              <p className="empty-trash">The bin is empty.</p>
            ) : (
              <div className="trash-list">
                {world.trash.map((trashed) => {
                  const sourceExists =
                    trashed.kind === 'activity'
                      ? true
                      : trashed.kind === 'placed-element'
                        ? !world.placements[trashed.page].some(
                            (placement) =>
                              placement.elementId ===
                              trashed.placement.elementId,
                          )
                        : world.placements[trashed.page].some(
                            (placement) =>
                              placement.elementId === trashed.elementId,
                          )
                  const placedItem =
                    trashed.kind === 'placed-element'
                      ? allElements.find(
                          (item) =>
                            item.id === trashed.placement.elementId,
                        )
                      : undefined
                  const title =
                    trashed.kind === 'activity'
                      ? world.streamTitles[trashed.activity.stream]
                      : trashed.kind === 'placed-element'
                        ? trashed.placement.title ||
                          placedItem?.name ||
                          'Untitled element'
                        : trashed.note.title || 'Untitled note'
                  const text =
                    trashed.kind === 'activity'
                      ? trashed.activity.note || 'A quiet step forward'
                      : trashed.kind === 'placed-element'
                        ? `${trashed.placement.notes?.length ?? 0} notes · ${
                            seasons.find(
                              (page) => page.id === trashed.page,
                            )?.label
                          }`
                        : trashed.note.text || 'Empty note'

                  return (
                    <article className="trashed-note" key={trashed.id}>
                      {placedItem && (
                        <img
                          className="trashed-element-image"
                          src={getElementImageSource(placedItem.image)}
                          alt=""
                        />
                      )}
                      <div>
                        <span>
                          {trashed.kind === 'activity'
                            ? `Growth note · +${trashed.activity.amount}`
                            : trashed.kind === 'placed-element'
                              ? 'Element and notebook'
                              : trashed.elementName}
                        </span>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                      <div className="trash-actions">
                        {sourceExists && (
                          <button
                            type="button"
                            onClick={() => restoreTrashedNote(trashed.id)}
                          >
                            Restore
                          </button>
                        )}
                        <button
                          className="delete-forever"
                          type="button"
                          onClick={() => permanentlyDeleteNote(trashed.id)}
                        >
                          Delete forever
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
            <p className="trash-explanation">
              Drag custom elements here to remove them. “Delete forever”
              permanently erases the element and every note it holds.
            </p>
          </aside>
        </div>
      )}

    </main>
  )
}

export default App
