import { useEffect, useMemo, useState } from 'react'
import './App.css'

type StreamId = 'knowledge' | 'language' | 'creation' | 'journey' | 'wellness'
type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'

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
}

type Stream = {
  id: StreamId
  name: string
  prompt: string
  examples: string
  area: string
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
}

const milestones = [
  { name: 'a new reflection', threshold: 10 },
  { name: 'a small ripple', threshold: 20 },
  { name: 'a lotus bloom', threshold: 35 },
  { name: 'a hidden visitor', threshold: 50 },
  { name: 'a glimmer on the water', threshold: 75 },
  { name: 'another bloom', threshold: 100 },
]

function loadWorld(): WorldState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved) as Partial<WorldState>
    return {
      growth: { ...initialState.growth, ...parsed.growth },
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
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
  const [activeStream, setActiveStream] = useState<StreamId | null>(null)
  const [note, setNote] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [newUnlock, setNewUnlock] = useState<string | null>(null)
  const [activeSeason, setActiveSeason] = useState<SeasonId>(loadSeason)

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

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Suho Sesang home">
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
              className={item.id === activeSeason ? 'active' : ''}
              type="button"
              key={item.id}
              onClick={() => setActiveSeason(item.id)}
              aria-current={item.id === activeSeason ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <span className="growth-status">{totalGrowth} growth</span>
          <button
            className="record-button"
            type="button"
            onClick={() => setRecordOpen(true)}
          >
            record
          </button>
        </div>
      </header>

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

      {currentStream && (
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

      {recordOpen && (
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
