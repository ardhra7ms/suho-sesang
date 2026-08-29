import { useEffect, useMemo, useState } from 'react'
import './App.css'

type StreamId = 'knowledge' | 'language' | 'creation' | 'journey' | 'wellness'

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
    name: 'Journey Bridge',
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
  { name: 'a blue butterfly', threshold: 10 },
  { name: 'a garden snail', threshold: 20 },
  { name: 'the first lotus bloom', threshold: 35 },
  { name: 'a white rabbit', threshold: 50 },
  { name: 'the stone lantern', threshold: 75 },
  { name: 'a second butterfly', threshold: 100 },
  { name: 'the old footbridge', threshold: 140 },
  { name: 'the moon lotus', threshold: 190 },
  { name: 'the far garden lights', threshold: 250 },
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

function PaintedGarden({
  totalGrowth,
  onSelectStream,
  onOpenGuardian,
}: {
  totalGrowth: number
  onSelectStream: (id: StreamId) => void
  onOpenGuardian: () => void
}) {
  const activateWithKeyboard = (
    event: React.KeyboardEvent<SVGGElement>,
    action: () => void,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  return (
    <svg
      className="painted-garden"
      viewBox="0 0 1200 820"
      role="img"
      aria-label="An impressionistic spring palace garden reflected in a lotus pond"
    >
      <defs>
        <filter id="paper-grain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="3"
            seed="17"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="saturate"
            values="0"
            result="grayNoise"
          />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
        </filter>
        <filter id="soft-paint" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018"
            numOctaves="2"
            seed="9"
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
        <filter id="water-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <linearGradient id="water-field" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#324c48" />
          <stop offset="0.22" stopColor="#697d45" />
          <stop offset="0.47" stopColor="#536a60" />
          <stop offset="0.7" stopColor="#817dab" />
          <stop offset="1" stopColor="#4a5d53" />
        </linearGradient>
        <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8b5c5" />
          <stop offset="0.55" stopColor="#a6ad94" />
          <stop offset="1" stopColor="#687958" />
        </linearGradient>
      </defs>

      <rect width="1200" height="820" fill="url(#dawn)" />

      <g className="sky-brushes" filter="url(#soft-paint)" strokeLinecap="round">
        {Array.from({ length: 64 }, (_, index) => {
          const x = (index * 173) % 1180
          const y = 24 + ((index * 67) % 280)
          const length = 34 + ((index * 29) % 105)
          const colors = ['#9fa6aa', '#b8afa8', '#8f929f', '#c0b9a4', '#939f91']
          return (
            <path
              key={index}
              d={`M${x} ${y}c${length * 0.3} ${index % 2 ? -8 : 9} ${length * 0.65} ${index % 3 ? 7 : -6} ${length} 0`}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth={5 + (index % 5) * 3}
              opacity={0.22 + (index % 4) * 0.06}
            />
          )
        })}
      </g>

      <g className="paint-layer distant-garden" filter="url(#soft-paint)">
        <path d="M0 266C105 222 180 226 259 253c86-59 178-72 278-28 87-65 185-66 291-18 98-44 213-36 372 30v205H0Z" fill="#43543d" />
        <path d="M0 302c126-81 236-50 324 6 116-96 227-71 301 5 91-102 211-84 278-9 87-69 175-48 297 18v120H0Z" fill="#637340" opacity=".86" />
        <path d="M0 359c116-55 212-44 296 2 87-62 184-55 269-4 116-73 212-73 300-4 88-51 198-47 335 4v105H0Z" fill="#77814a" opacity=".88" />
        <g className="tree-marks" strokeLinecap="round">
          <path d="M32 310 8 388M67 291 43 390M106 304 91 392M154 286l-8 112M198 301l9 97M1008 296l-12 103M1050 280l7 118M1101 299l24 101M1151 284l31 111" />
          <path d="M10 350c49-45 96-43 143-5M70 326c65-45 117-34 160 12M978 337c52-47 108-45 165 4M1040 317c58-39 108-24 151 20" />
        </g>
      </g>

      <g className="paint-layer palace" filter="url(#soft-paint)">
        <path d="M441 289h321v134H441Z" fill="#a66a50" opacity=".9" />
        <path d="M465 310h273v113H465Z" fill="#bd8763" />
        <path d="M413 290c58-24 118-30 187-20 68-13 132-4 191 22l-23 18H434Z" fill="#263f36" />
        <path d="M449 272c45-17 95-22 151-14 55-9 105-3 154 15l-18 13H465Z" fill="#3d5845" />
        <path d="m501 246 99-30 101 31-15 14H516Z" fill="#304b3e" />
        <path d="M522 217h155l-77-54Z" fill="#3e5847" />
        <path d="M545 216v-69h111v69M562 205v-47M592 205v-47M624 205v-47" fill="none" stroke="#263a31" strokeWidth="8" />
        <path d="M490 331v92M548 323v100M606 320v103M664 323v100M722 331v92" stroke="#39483a" strokeWidth="23" />
        <path d="M476 422h250" stroke="#694b3e" strokeWidth="9" />
      </g>

      <g
        className="scene-hotspot knowledge-area"
        role="button"
        tabIndex={0}
        aria-label="Knowledge Tree"
        onClick={() => onSelectStream('knowledge')}
        onKeyDown={(event) =>
          activateWithKeyboard(event, () => onSelectStream('knowledge'))
        }
      >
        <g className="paint-layer willow" filter="url(#soft-paint)">
          <path d="M156 416c18-96 43-170 80-226" stroke="#3a4430" strokeWidth="24" fill="none" />
          <path d="M216 210c-74 38-121 91-143 161M232 191c13 58 1 131-28 218M235 199c63 51 83 119 72 201M217 231c-38 53-52 111-45 176" stroke="#64783a" strokeWidth="17" fill="none" />
          <path d="M205 208c-52 24-89 57-117 102M224 189c-25 62-32 133-20 207M237 208c42 56 58 117 52 184" stroke="#8b9846" strokeWidth="7" fill="none" />
        </g>
        <path className="hit-shape" d="M40 152h300v306H40Z" />
      </g>

      <g
        className="scene-hotspot wellness-area"
        role="button"
        tabIndex={0}
        aria-label="Wellness Grove"
        onClick={() => onSelectStream('wellness')}
        onKeyDown={(event) =>
          activateWithKeyboard(event, () => onSelectStream('wellness'))
        }
      >
        <g className="paint-layer grove" filter="url(#soft-paint)">
          <path d="M930 406c9-87 30-153 64-200M1018 415c-4-90 9-160 44-217M1094 420c-8-80 4-141 38-185" stroke="#354536" strokeWidth="20" fill="none" />
          <path d="M919 258c38-45 78-51 116-19-16 45-53 59-116 19ZM1024 227c38-39 77-40 113-3-21 43-60 51-113 3ZM1076 284c42-35 81-30 112 12-26 38-64 41-112-12Z" fill="#52683c" />
          <path d="M942 319c39-29 75-23 108 17-29 35-65 33-108-17ZM1022 349c42-30 82-22 116 25-35 34-73 25-116-25Z" fill="#778344" />
        </g>
        <path className="hit-shape" d="M885 163h315v300H885Z" />
      </g>

      <g className="paint-layer flower-bank" filter="url(#soft-paint)">
        <path d="M0 395c160-45 309-29 441 45l-40 103C274 483 144 475 0 513Z" fill="#66763f" />
        <path d="M767 430c153-74 298-78 433-26v113c-145-43-278-24-400 44Z" fill="#5d7041" />
        <g strokeLinecap="round">
          <path d="m44 440 33-14M91 467l37-24M151 428l29 20M211 468l41-28M278 432l35 24M854 480l35-30M928 445l36 24M1003 487l37-29M1090 446l39 20" stroke="#cbc15d" strokeWidth="10" />
          <path d="m65 426 25 19M132 450l32-21M196 432l38 24M254 473l34-24M331 454l39 19M821 453l34 20M894 479l43-30M976 456l38 25M1046 472l31-27M1122 481l43-28" stroke="#d73546" strokeWidth="14" />
          <path d="m40 459 26 10M113 421l21 14M175 469l25-12M299 456l22-16M858 434l22 17M949 470l25 11M1025 441l27 13M1150 457l25-14" stroke="#ef6871" strokeWidth="7" />
        </g>
      </g>

      <g className="garden-brushes" filter="url(#soft-paint)" strokeLinecap="round">
        {Array.from({ length: 112 }, (_, index) => {
          const x = (index * 149) % 1190
          const y = 245 + ((index * 83) % 280)
          const length = 18 + ((index * 37) % 72)
          const colors = ['#3e573b', '#879147', '#a2a04e', '#57683b', '#c0aa52', '#6d7741']
          return (
            <path
              key={index}
              d={`M${x} ${y}q${length * 0.45} ${index % 2 ? -9 : 8} ${length} ${index % 3 ? 2 : -3}`}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth={3 + (index % 4) * 3}
              opacity={0.25 + (index % 5) * 0.07}
            />
          )
        })}
      </g>

      <g
        className="scene-hotspot creation-area"
        role="button"
        tabIndex={0}
        aria-label="Creation Garden"
        onClick={() => onSelectStream('creation')}
        onKeyDown={(event) =>
          activateWithKeyboard(event, () => onSelectStream('creation'))
        }
      >
        <path className="hit-shape" d="M0 388h430v174H0Z" />
      </g>

      <path d="M0 477c179-30 337-6 474 72 142 80 255 60 353-1 121-75 245-91 373-58v330H0Z" fill="url(#water-field)" />

      <g className="paint-layer water-strokes" filter="url(#water-blur)" fill="none" strokeLinecap="round">
        <path d="M-20 551c143-39 276-26 398 39M33 605c151-33 292-6 422 56M-9 699c131-25 258-11 379 42M786 557c138-46 278-51 420-14M753 629c147-43 300-39 461 10M701 717c176-51 346-42 512 27" stroke="#889250" strokeWidth="31" />
        <path d="M20 578c103-21 202-13 299 25M62 647c121-24 241-7 361 50M797 584c112-34 230-34 355-3M737 682c139-33 278-20 418 32" stroke="#aaa85b" strokeWidth="17" />
        <path d="M337 526c99 58 178 81 237 69M430 673c112 37 211 33 298-13M522 770c84 20 170 10 260-29M745 520c-85 52-157 73-214 62" stroke="#7470aa" strokeWidth="27" />
        <path d="M458 515c82 26 153 23 214-8M492 625c81 29 153 25 217-13M508 735c84 21 165 9 243-36" stroke="#4d5593" strokeWidth="12" />
      </g>

      <g className="water-brushes" filter="url(#soft-paint)" strokeLinecap="round">
        {Array.from({ length: 168 }, (_, index) => {
          const x = -20 + ((index * 163) % 1240)
          const y = 500 + ((index * 71) % 310)
          const length = 22 + ((index * 41) % 112)
          const colors = ['#343f5e', '#565596', '#858b43', '#b0a94f', '#596a4e', '#7774a3', '#c2ba61', '#344e46']
          return (
            <path
              key={index}
              d={`M${x} ${y}c${length * 0.25} ${index % 2 ? -6 : 7} ${length * 0.72} ${index % 4 ? 5 : -7} ${length} ${index % 3 - 1}`}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth={3 + (index % 6) * 2}
              opacity={0.22 + (index % 6) * 0.07}
            />
          )
        })}
      </g>

      <g
        className="scene-hotspot language-area"
        role="button"
        tabIndex={0}
        aria-label="Language Pond"
        onClick={() => onSelectStream('language')}
        onKeyDown={(event) =>
          activateWithKeyboard(event, () => onSelectStream('language'))
        }
      >
        <g className="paint-layer lily-field" filter="url(#soft-paint)">
          {[
            [99, 568, 82, 23, -8],
            [224, 611, 105, 27, 9],
            [363, 554, 83, 24, -4],
            [520, 607, 105, 29, 6],
            [679, 552, 81, 22, -10],
            [826, 621, 116, 28, 4],
            [1018, 561, 98, 25, -7],
            [1120, 684, 101, 28, 8],
            [128, 731, 111, 27, 5],
            [327, 702, 88, 23, -9],
            [570, 756, 119, 29, 3],
            [784, 729, 87, 23, -5],
            [950, 775, 116, 29, 7],
          ].map(([cx, cy, rx, ry, rotate], index) => (
            <g key={index} transform={`rotate(${rotate} ${cx} ${cy})`}>
              <ellipse cx={cx} cy={cy} rx={rx / 2} ry={ry / 2} fill={index % 3 === 0 ? '#a8a950' : index % 3 === 1 ? '#7f9544' : '#c0b85a'} />
              <path d={`M${cx} ${cy}h${rx / 2}`} stroke="#4a5837" strokeWidth="5" />
            </g>
          ))}
          <g className={totalGrowth >= 35 ? 'growth-reveal visible' : 'growth-reveal'}>
            <path d="M349 690c-26-24-25-51-2-65 24 14 29 36 3 65Z" fill="#f0b3b0" />
            <path d="M350 692c19-30 44-37 61-17-5 27-26 35-61 17Z" fill="#e55b68" />
            <path d="M349 692c-30-16-39-40-21-58 26 1 38 20 21 58Z" fill="#e78691" />
          </g>
          <g className={totalGrowth >= 190 ? 'growth-reveal visible' : 'growth-reveal'}>
            <path d="M857 597c-24-22-23-47-2-60 22 13 27 33 3 60Z" fill="#e8d7dc" />
            <path d="M858 599c18-28 41-34 57-16-5 25-24 33-57 16Z" fill="#b89fc9" />
            <path d="M857 599c-28-15-36-37-19-54 24 1 35 19 19 54Z" fill="#d7b8d0" />
          </g>
        </g>
        <path className="hit-shape" d="M0 500h1200v320H0Z" />
      </g>

      <g
        className="scene-hotspot journey-area"
        role="button"
        tabIndex={0}
        aria-label="Journey Bridge"
        onClick={() => onSelectStream('journey')}
        onKeyDown={(event) =>
          activateWithKeyboard(event, () => onSelectStream('journey'))
        }
      >
        <g className={`paint-layer bridge ${totalGrowth >= 140 ? 'fully-awake' : ''}`} filter="url(#soft-paint)">
          <path d="M418 534c103-89 252-89 363-2l-19 35c-99-70-219-70-324 2Z" fill="#9a6c4d" />
          <path d="M428 538c108-73 232-74 342-3" fill="none" stroke="#483e31" strokeWidth="14" />
          <path d="M449 524v53M498 491v57M551 467v60M606 458v62M661 468v59M714 492v57M761 525v49" stroke="#584536" strokeWidth="10" />
        </g>
        <path className="hit-shape" d="M389 443h421v145H389Z" />
      </g>

      <g className="paint-layer milestone-creatures" filter="url(#soft-paint)">
        <g className={totalGrowth >= 10 ? 'growth-reveal visible butterfly blue' : 'growth-reveal butterfly blue'}>
          <path d="M330 353c-29-36-51-13-23 12-30 14-7 39 23 5 29 34 52 9 23-5 28-25 6-48-23-12Z" fill="#4859aa" />
          <path d="M330 350v28" stroke="#313f38" strokeWidth="5" />
        </g>
        <g className={totalGrowth >= 100 ? 'growth-reveal visible butterfly rose' : 'growth-reveal butterfly rose'}>
          <path d="M876 394c-22-29-42-10-20 10-23 11-5 31 20 4 23 27 42 7 19-4 22-20 4-38-19-10Z" fill="#d84d64" />
          <path d="M876 391v23" stroke="#313f38" strokeWidth="4" />
        </g>
        <g className={totalGrowth >= 20 ? 'growth-reveal visible snail' : 'growth-reveal snail'}>
          <path d="M256 488c-26-6-28-35-7-46 26-13 47 18 30 39 32-3 52 2 59 16h-96" fill="#b9945b" />
          <circle cx="258" cy="462" r="15" fill="none" stroke="#675442" strokeWidth="7" />
        </g>
        <g className={totalGrowth >= 50 ? 'growth-reveal visible rabbit' : 'growth-reveal rabbit'}>
          <path d="M1048 491c-7-45 2-62 17-53 9 6 7 32 5 49 14-39 29-49 38-35 8 12-14 36-27 49 28 5 39 28 24 44-17 18-65 9-70-17-3-16 3-29 13-37Z" fill="#d7d2b7" />
          <circle cx="1062" cy="509" r="3" fill="#384438" />
        </g>
        <g className={totalGrowth >= 75 ? 'growth-reveal visible lantern' : 'growth-reveal lantern'}>
          <path d="M934 422h41l-6-65h-29Z" fill="#948e76" />
          <path d="M928 357h52M937 345h34M954 319v26M950 422v45M935 467h38" fill="none" stroke="#4d5141" strokeWidth="8" />
        </g>
        <g className={totalGrowth >= 250 ? 'growth-reveal visible far-lights' : 'growth-reveal far-lights'}>
          <circle cx="82" cy="344" r="9" fill="#efce78" />
          <circle cx="1114" cy="329" r="8" fill="#efce78" />
          <circle cx="1160" cy="370" r="7" fill="#efce78" />
        </g>
      </g>

      <g
        className="scene-hotspot guardian-area"
        role="button"
        tabIndex={0}
        aria-label="Qilin guardian"
        onClick={onOpenGuardian}
        onKeyDown={(event) => activateWithKeyboard(event, onOpenGuardian)}
      >
        <g className="paint-layer painted-qilin" filter="url(#soft-paint)">
          <path d="M86 727c14-54 53-79 101-67 38 10 54 46 44 83 34 3 62 18 81 45-77-7-139-4-216 16-17-27-20-52-10-77Z" fill="#425443" opacity=".82" />
          <path d="M92 708c-2-35 4-58 18-70l12 46c8-40 22-61 39-64l-4 50" fill="none" stroke="#39473a" strokeWidth="12" />
          <path d="M111 720c25-15 50-13 74 7M123 745c24 11 48 10 71-4M199 696c35 24 53 54 54 90" fill="none" stroke="#7f8b59" strokeWidth="9" />
          <circle cx="133" cy="704" r="4" fill="#d7c069" />
        </g>
        <path className="hit-shape" d="M46 609h286v211H46Z" />
      </g>

      <rect
        className="canvas-grain"
        width="1200"
        height="820"
        fill="#b6a987"
        filter="url(#paper-grain)"
        opacity=".16"
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  )
}

function App() {
  const [world, setWorld] = useState<WorldState>(loadWorld)
  const [activeStream, setActiveStream] = useState<StreamId | null>(null)
  const [note, setNote] = useState('')
  const [scrollOpen, setScrollOpen] = useState(false)
  const [newUnlock, setNewUnlock] = useState<string | null>(null)

  const totalGrowth = useMemo(
    () => Object.values(world.growth).reduce((sum, value) => sum + value, 0),
    [world.growth],
  )
  const today = new Date().toDateString()
  const todayGrowth = world.activities
    .filter((activity) => new Date(activity.createdAt).toDateString() === today)
    .reduce((sum, activity) => sum + activity.amount, 0)
  const level = Math.floor(totalGrowth / 100) + 1
  const nextUnlock = milestones.find((milestone) => milestone.threshold > totalGrowth)
  const completion = Math.min(100, Math.round((totalGrowth / 300) * 100))
  const currentStream = streams.find((stream) => stream.id === activeStream)

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
    const unlocked = milestones.find(
      (milestone) =>
        milestone.threshold > previousGrowth &&
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
        <button
          className="guardian-record-button"
          type="button"
          onClick={() => setScrollOpen(true)}
        >
          the guardian’s record
        </button>
      </header>

      <section className="world-stage" aria-label="Spring">
        <PaintedGarden
          totalGrowth={totalGrowth}
          onSelectStream={setActiveStream}
          onOpenGuardian={() => setScrollOpen(true)}
        />
      </section>

      <footer className="scene-footer">
        <span>spring</span>
        <span>{totalGrowth} growth</span>
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
            <span className="eyebrow">The guardian’s record</span>
            <h2>The garden remembers</h2>
            <p className="scroll-intro">
              Every small act has entered the landscape.
            </p>
            <div className="summary-grid">
              <div><strong>{level}</strong><span>Level</span></div>
              <div><strong>{totalGrowth}</strong><span>Growth</span></div>
              <div><strong>+{todayGrowth}</strong><span>Today</span></div>
              <div><strong>{completion}%</strong><span>Spring</span></div>
            </div>
            <div className="completion-track">
              <span style={{ width: `${completion}%` }} />
            </div>
            <section className="scroll-section">
              <h3>Life streams</h3>
              {streams.map((stream) => (
                <div className="stream-progress" key={stream.id}>
                  <span>{stream.name}</span>
                  <strong>{world.growth[stream.id]}</strong>
                </div>
              ))}
            </section>
            <section className="scroll-section">
              <h3>Next change</h3>
              <p>
                {nextUnlock
                  ? `${nextUnlock.name} at ${nextUnlock.threshold} growth`
                  : 'The spring garden is fully awake—for now.'}
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

      {newUnlock && (
        <div className="unlock-toast" role="status">
          <small>The scene changed</small>
          <strong>{newUnlock} appeared</strong>
        </div>
      )}
    </main>
  )
}

export default App
