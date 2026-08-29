import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type StreamId = 'knowledge' | 'language' | 'creation' | 'journey' | 'wellness'

type Position = {
  x: number
  y: number
}

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
  positions: Record<StreamId, Position>
}

type Stream = {
  id: StreamId
  name: string
  prompt: string
  examples: string
  icon: string
}

type WorldObject = {
  name: string
  icon: string
  threshold: number
  className: string
}

const STORAGE_KEY = 'suho-sesang-world-v1'

const streams: Stream[] = [
  {
    id: 'knowledge',
    name: 'Knowledge Tree',
    prompt: 'What did you discover?',
    examples: 'Reading · research · learning',
    icon: '🌳',
  },
  {
    id: 'language',
    name: 'Language Pond',
    prompt: 'How did your language grow?',
    examples: 'Korean · listening · vocabulary',
    icon: '🪷',
  },
  {
    id: 'creation',
    name: 'Creation Garden',
    prompt: 'What did you bring to life?',
    examples: 'Writing · coding · creative work',
    icon: '🌷',
  },
  {
    id: 'journey',
    name: 'Journey Gate',
    prompt: 'What moved your journey forward?',
    examples: 'Documents · planning · life admin',
    icon: '⛩️',
  },
  {
    id: 'wellness',
    name: 'Wellness Grove',
    prompt: 'How did you care for yourself?',
    examples: 'Walking · movement · rest',
    icon: '🌿',
  },
]

const initialPositions: Record<StreamId, Position> = {
  knowledge: { x: 20, y: 33 },
  language: { x: 67, y: 63 },
  creation: { x: 44, y: 70 },
  journey: { x: 47, y: 22 },
  wellness: { x: 78, y: 36 },
}

const initialState: WorldState = {
  growth: {
    knowledge: 0,
    language: 0,
    creation: 0,
    journey: 0,
    wellness: 0,
  },
  activities: [],
  positions: initialPositions,
}

const worldObjects: WorldObject[] = [
  { name: 'Butterfly', icon: '🦋', threshold: 10, className: 'butterfly-one' },
  { name: 'Snail', icon: '🐌', threshold: 20, className: 'snail' },
  { name: 'Lotus bloom', icon: '🪷', threshold: 35, className: 'lotus-one' },
  { name: 'White rabbit', icon: '🐇', threshold: 50, className: 'rabbit' },
  { name: 'Garden statue', icon: '🏛️', threshold: 75, className: 'statue' },
  { name: 'Second butterfly', icon: '🦋', threshold: 100, className: 'butterfly-two' },
  { name: 'Old bridge', icon: '🌉', threshold: 140, className: 'bridge' },
  { name: 'Moon lotus', icon: '🪷', threshold: 190, className: 'lotus-two' },
  { name: 'Garden lantern', icon: '🏮', threshold: 250, className: 'lantern' },
]

function loadWorld(): WorldState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved) as Partial<WorldState>
    return {
      growth: { ...initialState.growth, ...parsed.growth },
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      positions: { ...initialPositions, ...parsed.positions },
    }
  } catch {
    return initialState
  }
}

function App() {
  const [world, setWorld] = useState<WorldState>(loadWorld)
  const [activeStream, setActiveStream] = useState<StreamId | null>(null)
  const [note, setNote] = useState('')
  const [scrollOpen, setScrollOpen] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [newUnlock, setNewUnlock] = useState<WorldObject | null>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: StreamId; moved: boolean } | null>(null)

  const totalGrowth = useMemo(
    () => Object.values(world.growth).reduce((sum, value) => sum + value, 0),
    [world.growth],
  )
  const today = new Date().toDateString()
  const todayGrowth = world.activities
    .filter((activity) => new Date(activity.createdAt).toDateString() === today)
    .reduce((sum, activity) => sum + activity.amount, 0)
  const level = Math.floor(totalGrowth / 100) + 1
  const nextUnlock = worldObjects.find((object) => object.threshold > totalGrowth)
  const completion = Math.min(100, Math.round((totalGrowth / 300) * 100))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world))
  }, [world])

  useEffect(() => {
    if (!newUnlock) return
    const timer = window.setTimeout(() => setNewUnlock(null), 3200)
    return () => window.clearTimeout(timer)
  }, [newUnlock])

  const addGrowth = (stream: StreamId, amount: number) => {
    const previousGrowth = totalGrowth
    const updatedGrowth = previousGrowth + amount
    const unlocked = worldObjects.find(
      (object) =>
        object.threshold > previousGrowth && object.threshold <= updatedGrowth,
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
    if (unlocked) setNewUnlock(unlocked)
  }

  const beginDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    id: StreamId,
  ) => {
    if (!customizing) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { id, moved: false }
  }

  const moveObject = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!customizing || !dragRef.current || !worldRef.current) return
    const bounds = worldRef.current.getBoundingClientRect()
    const x = Math.min(92, Math.max(8, ((event.clientX - bounds.left) / bounds.width) * 100))
    const y = Math.min(84, Math.max(14, ((event.clientY - bounds.top) / bounds.height) * 100))
    dragRef.current.moved = true
    setWorld((current) => ({
      ...current,
      positions: {
        ...current.positions,
        [dragRef.current!.id]: { x, y },
      },
    }))
  }

  const finishDrag = () => {
    window.setTimeout(() => {
      dragRef.current = null
    }, 0)
  }

  const selectStream = (id: StreamId) => {
    if (customizing || dragRef.current?.moved) return
    setActiveStream(id)
  }

  const currentStream = streams.find((stream) => stream.id === activeStream)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Suho Sesang home">
          <span className="bunny-logo" aria-hidden="true">
            <span className="ear left" />
            <span className="ear right" />
            <span className="bunny-face">·ᴗ·</span>
          </span>
          <span>
            <strong>Suho Sesang</strong>
            <small>수호 세상 · a world that grows with you</small>
          </span>
        </a>
        <button
          className={`customize-button ${customizing ? 'active' : ''}`}
          type="button"
          onClick={() => setCustomizing((value) => !value)}
        >
          {customizing ? 'Save world' : 'Customize'}
        </button>
      </header>

      <nav className="season-nav" aria-label="Seasons">
        <button className="season active" type="button">
          <span>🌸</span> Spring
        </button>
        <button className="season" type="button" disabled>
          <span>☀️</span> Summer
        </button>
        <button className="season" type="button" disabled>
          <span>🍁</span> Autumn
        </button>
        <button className="season" type="button" disabled>
          <span>✨</span> Winter
        </button>
      </nav>

      <section className="world-frame" aria-label="Spring garden">
        <div className="world-heading">
          <div>
            <span className="eyebrow">Season of growth</span>
            <h1>The Palace Garden</h1>
          </div>
          <div className="growth-orb" aria-label={`${totalGrowth} growth`}>
            <span>{totalGrowth}</span>
            <small>Growth</small>
          </div>
        </div>

        {customizing && (
          <div className="customize-hint">
            <span>✦</span> Drag the glowing places to make this world your own
          </div>
        )}

        <div className="world" ref={worldRef}>
          <div className="sky-glow" />
          <div className="far-trees" />
          <div className="palace">
            <span className="roof roof-top" />
            <span className="roof roof-bottom" />
            <span className="palace-body">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="mountain mountain-left" />
          <div className="mountain mountain-right" />
          <div className="lawn lawn-left" />
          <div className="lawn lawn-right" />
          <div className="stone-path" />
          <div className="pond-shape">
            <span />
            <span />
            <span />
          </div>
          <div className="flower-bed bed-left">✿ · ✾ · ✿ · ❀</div>
          <div className="flower-bed bed-right">❀ · ✿ · ✾ · ✿</div>

          {worldObjects.map((object) => (
            <span
              className={`world-detail ${object.className} ${
                totalGrowth >= object.threshold ? 'revealed' : ''
              }`}
              key={object.name}
              aria-hidden={totalGrowth < object.threshold}
              title={object.name}
            >
              {object.icon}
            </span>
          ))}

          {streams.map((stream) => {
            const position = world.positions[stream.id]
            return (
              <button
                className={`stream-object stream-${stream.id} ${
                  customizing ? 'moving' : ''
                }`}
                type="button"
                key={stream.id}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                onClick={() => selectStream(stream.id)}
                onPointerDown={(event) => beginDrag(event, stream.id)}
                onPointerMove={moveObject}
                onPointerUp={finishDrag}
                aria-label={`${stream.name}, ${world.growth[stream.id]} growth`}
              >
                <span className="object-icon" aria-hidden="true">
                  {stream.icon}
                </span>
                <span className="object-label">
                  <strong>{stream.name}</strong>
                  <small>{world.growth[stream.id]} growth</small>
                </span>
              </button>
            )
          })}

          <button
            className="guardian"
            type="button"
            onClick={() => setScrollOpen((value) => !value)}
            aria-label="Open the Qilin guardian scroll"
            aria-expanded={scrollOpen}
          >
            <span className="guardian-aura" />
            <span className="qilin" aria-hidden="true">麒麟</span>
            <span className="guardian-name">Qilin · Guardian</span>
          </button>
        </div>
      </section>

      <p className="world-whisper">
        {totalGrowth === 0
          ? 'The garden is quiet, but it is listening. Touch a place to begin.'
          : nextUnlock
            ? `${nextUnlock.threshold - totalGrowth} more growth until the garden reveals a secret.`
            : 'Every corner of the garden is awake because you are growing.'}
      </p>

      {scrollOpen && (
        <div className="overlay" onClick={() => setScrollOpen(false)}>
          <aside
            className="guardian-scroll"
            onClick={(event) => event.stopPropagation()}
            aria-label="Guardian scroll"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setScrollOpen(false)}
              aria-label="Close guardian scroll"
            >
              ×
            </button>
            <div className="scroll-flourish">☙ ✦ ❧</div>
            <span className="eyebrow">The guardian’s record</span>
            <h2>Your garden remembers</h2>
            <p className="scroll-intro">
              Nothing is lost. Every small act has become part of this place.
            </p>
            <div className="summary-grid">
              <div><strong>{level}</strong><span>Current level</span></div>
              <div><strong>{totalGrowth}</strong><span>Total growth</span></div>
              <div><strong>+{todayGrowth}</strong><span>Today</span></div>
              <div><strong>{completion}%</strong><span>Spring awake</span></div>
            </div>
            <div className="completion-track">
              <span style={{ width: `${completion}%` }} />
            </div>
            <section className="scroll-section">
              <h3>Life streams</h3>
              {streams.map((stream) => (
                <div className="stream-progress" key={stream.id}>
                  <span>{stream.icon} {stream.name}</span>
                  <strong>{world.growth[stream.id]}</strong>
                </div>
              ))}
            </section>
            <section className="scroll-section">
              <h3>Upcoming wonder</h3>
              <p>
                {nextUnlock
                  ? `${nextUnlock.name} at ${nextUnlock.threshold} growth`
                  : 'The garden is fully awake—for now.'}
              </p>
            </section>
            <section className="scroll-section recent">
              <h3>Recent traces</h3>
              {world.activities.length === 0 ? (
                <p>Your first trace will appear here.</p>
              ) : (
                world.activities.slice(0, 3).map((activity) => {
                  const stream = streams.find((item) => item.id === activity.stream)!
                  return (
                    <div className="activity" key={activity.id}>
                      <span>{stream.icon}</span>
                      <p>
                        <strong>+{activity.amount} · {stream.name}</strong>
                        <small>{activity.note || 'A quiet step forward'}</small>
                      </p>
                    </div>
                  )
                })
              )}
            </section>
          </aside>
        </div>
      )}

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
            <span className="sheet-icon" aria-hidden="true">{currentStream.icon}</span>
            <span className="eyebrow">{currentStream.examples}</span>
            <h2>{currentStream.prompt}</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a small note, if you like…"
              rows={2}
            />
            <div className="growth-buttons" aria-label="Choose growth amount">
              {[5, 10, 20, 50].map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() => addGrowth(currentStream.id, amount)}
                >
                  <span>+</span>{amount}
                </button>
              ))}
            </div>
            <p className="sheet-note">One tap is enough. Notes are always optional.</p>
          </section>
        </div>
      )}

      {newUnlock && (
        <div className="unlock-toast" role="status">
          <span>{newUnlock.icon}</span>
          <div>
            <small>The garden changed</small>
            <strong>{newUnlock.name} appeared</strong>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
