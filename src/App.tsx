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
}

type WorldObject = {
  name: string
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
  },
  {
    id: 'language',
    name: 'Language Pond',
    prompt: 'How did your language grow?',
    examples: 'Korean · listening · vocabulary',
  },
  {
    id: 'creation',
    name: 'Creation Garden',
    prompt: 'What did you bring to life?',
    examples: 'Writing · coding · creative work',
  },
  {
    id: 'journey',
    name: 'Journey Gate',
    prompt: 'What moved your journey forward?',
    examples: 'Documents · planning · life admin',
  },
  {
    id: 'wellness',
    name: 'Wellness Grove',
    prompt: 'How did you care for yourself?',
    examples: 'Walking · movement · rest',
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
  { name: 'Butterfly', threshold: 10, className: 'butterfly-one' },
  { name: 'Snail', threshold: 20, className: 'snail' },
  { name: 'Lotus bloom', threshold: 35, className: 'lotus-one' },
  { name: 'White rabbit', threshold: 50, className: 'rabbit' },
  { name: 'Garden statue', threshold: 75, className: 'statue' },
  { name: 'Second butterfly', threshold: 100, className: 'butterfly-two' },
  { name: 'Old bridge', threshold: 140, className: 'bridge' },
  { name: 'Moon lotus', threshold: 190, className: 'lotus-two' },
  { name: 'Garden lantern', threshold: 250, className: 'lantern' },
]

function StreamIllustration({ id, compact = false }: { id: StreamId; compact?: boolean }) {
  const common = {
    viewBox: '0 0 80 80',
    className: `stream-illustration ${compact ? 'compact' : ''}`,
    'aria-hidden': true,
  }

  if (id === 'knowledge') {
    return (
      <svg {...common}>
        <path className="fill-sage" d="M39 67c-5-11-4-24 1-38 5 13 6 27 1 38Z" />
        <path className="fill-leaf" d="M40 39C21 42 12 32 15 18c15-4 27 2 25 21ZM41 32C43 15 54 8 67 13c2 14-7 24-26 26Z" />
        <path d="M40 68V29M40 43 25 28M41 35l13-13M22 54c10 4 26 4 37 0" />
        <circle className="fill-blush" cx="26" cy="23" r="3" />
        <circle className="fill-gold" cx="57" cy="19" r="3" />
      </svg>
    )
  }

  if (id === 'language') {
    return (
      <svg {...common}>
        <path className="fill-water" d="M7 51c12-8 21-7 32-2 12 5 22 4 34-3v20H7Z" />
        <path d="M7 51c12-8 21-7 32-2 12 5 22 4 34-3M18 61c8-4 15-3 21 0M48 57c7 3 13 2 19-2" />
        <path className="fill-blush" d="M40 46c-9-3-13-10-10-18 7 0 11 4 12 10 2-8 7-12 14-11 2 9-4 16-16 19Z" />
        <path d="M41 48V35" />
        <ellipse className="fill-leaf" cx="22" cy="46" rx="9" ry="4" />
      </svg>
    )
  }

  if (id === 'creation') {
    return (
      <svg {...common}>
        <path d="M12 66h56M22 65V36M40 66V27M58 66V40" />
        <path className="fill-blush" d="M40 30c-9-3-13-11-9-18 6-1 10 3 11 9 3-6 8-8 13-5 1 7-5 13-15 14Z" />
        <path className="fill-gold" d="M22 39c-7-2-10-8-7-13 5-1 8 2 9 6 2-4 6-6 10-3 0 5-4 9-12 10Z" />
        <path className="fill-rose" d="M58 42c-7-2-10-8-7-13 5-1 8 2 9 6 2-4 6-6 10-3 0 5-4 9-12 10Z" />
        <path d="M21 50c-5-5-9-5-12-2M41 45c6-6 10-6 14-3M57 54c6-4 10-3 13 0" />
      </svg>
    )
  }

  if (id === 'journey') {
    return (
      <svg {...common}>
        <path className="fill-clay" d="M16 31h48l-5-11H21Z" />
        <path d="M11 31h58M17 32v34M63 32v34M26 36v30M54 36v30M14 66h52" />
        <path className="fill-paper" d="m12 30 8-12h40l8 12Z" />
        <path d="M21 18 27 9M59 18 53 9M24 10h32" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path className="fill-sage" d="M40 67C22 57 16 39 23 18c18 8 26 26 17 49Z" />
      <path className="fill-leaf" d="M40 67c-4-23 6-40 27-48 4 22-6 39-27 48Z" />
      <path d="M40 68c0-18-4-31-13-42M40 67c4-18 11-31 21-41M30 42l-10-2M33 51l-10 1M50 42l11-5M47 52l11 1" />
      <circle className="fill-gold" cx="39" cy="18" r="4" />
    </svg>
  )
}

function DetailIllustration({ kind }: { kind: string }) {
  if (kind.includes('butterfly')) {
    return (
      <svg viewBox="0 0 48 40" aria-hidden="true">
        <path className="fill-gold" d="M23 20C14 2 3 5 7 17c2 6 8 7 16 3ZM25 20c9-18 20-15 16-3-2 6-8 7-16 3Z" />
        <path d="M24 15v15M20 31l4-8 4 8" />
      </svg>
    )
  }
  if (kind === 'snail') {
    return (
      <svg viewBox="0 0 58 35" aria-hidden="true">
        <path className="fill-clay" d="M18 29C7 26 6 12 16 7c12-6 24 7 18 18l14 1c4 0 7 2 7 5H12" />
        <circle cx="21" cy="17" r="7" />
        <path d="M21 10c7 4 4 13-3 13-5 0-7-5-5-9M45 25l2-8m1 8 5-7" />
      </svg>
    )
  }
  if (kind.includes('lotus')) {
    return (
      <svg viewBox="0 0 52 45" aria-hidden="true">
        <path className="fill-blush" d="M26 36C7 32 5 19 13 12c7 1 11 6 13 14 2-11 8-17 16-15 7 10 1 21-16 25Z" />
        <path d="M26 38V18M8 39c11-5 25-5 36 0" />
      </svg>
    )
  }
  if (kind === 'rabbit') {
    return (
      <svg viewBox="0 0 55 64" aria-hidden="true">
        <path className="fill-paper" d="M17 27C8 9 14 2 20 5c5 3 6 13 6 21M38 27c9-18 3-25-3-22-5 3-6 13-6 21" />
        <path className="fill-paper" d="M27 22c15 0 23 10 21 23-2 11-11 16-22 15C14 59 7 52 8 41c1-12 8-19 19-19Z" />
        <circle cx="20" cy="39" r="1.7" className="ink-dot" />
        <circle cx="35" cy="39" r="1.7" className="ink-dot" />
        <path d="M25 47c2 2 4 2 6 0" />
      </svg>
    )
  }
  if (kind === 'statue') {
    return (
      <svg viewBox="0 0 54 68" aria-hidden="true">
        <path className="fill-stone" d="M17 58h20l-3-32H20ZM12 66h30v-8H12Z" />
        <circle className="fill-stone" cx="27" cy="17" r="11" />
        <path d="M23 14h1M30 14h1M24 20c2 1 4 1 6 0M18 29h18" />
      </svg>
    )
  }
  if (kind === 'bridge') {
    return (
      <svg viewBox="0 0 80 50" aria-hidden="true">
        <path className="fill-clay" d="M7 39c15-28 51-28 66 0H59c-7-15-31-15-38 0Z" />
        <path d="M8 39h64M15 30h50M21 20h38M18 29v10M31 18v17M49 18v17M62 29v10" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 42 64" aria-hidden="true">
      <path className="fill-clay" d="M10 17h22v29H10Z" />
      <path className="fill-gold" d="M14 21h14v21H14Z" />
      <path d="M7 17h28M12 10h18M21 4v6M21 46v13M15 59h12" />
    </svg>
  )
}

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
          <img className="bunny-logo" src={`${import.meta.env.BASE_URL}bunny.svg`} alt="" />
          <strong>Suho Sesang</strong>
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
          <div className="far-trees">
            <i /><i /><i /><i /><i /><i /><i />
          </div>
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
              <DetailIllustration kind={object.className} />
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
                  <StreamIllustration id={stream.id} />
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
            <span className="qilin" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}qilin-historical.jpg`} alt="" />
            </span>
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
                  <span><StreamIllustration id={stream.id} compact /> {stream.name}</span>
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
                      <StreamIllustration id={stream.id} compact />
                      <p>
                        <strong>+{activity.amount} · {stream.name}</strong>
                        <small>{activity.note || 'A quiet step forward'}</small>
                      </p>
                    </div>
                  )
                })
              )}
            </section>
            <a
              className="art-credit"
              href="https://commons.wikimedia.org/wiki/File:Confucius_identifying_a_qilin_during_a_hunt_(18th-19th_century)_-_%27Anedoctes_from_the_life_of_Confucius%27,_after_Qiu_Ying_(1494-1554)_and_Wen_Zhengming_(1470-1559).jpg"
              target="_blank"
              rel="noreferrer"
            >
              Qilin detail from an anonymous 18th–19th c. Chinese painting · Public domain
            </a>
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
            <span className="sheet-icon" aria-hidden="true">
              <StreamIllustration id={currentStream.id} />
            </span>
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
          <span><DetailIllustration kind={newUnlock.className} /></span>
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
