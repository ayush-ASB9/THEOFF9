import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import wordmark from '../PUBLIC/image.png';

type Point = {
  x: number;
  y: number;
};

type DiscoveryId =
  | 'chk9'
  | 'ai'
  | 'physical'
  | 'dead'
  | 'capital'
  | 'tool'
  | 'consumer'
  | 'research';

type ExperimentState = {
  visible: boolean;
  x: number;
  y: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const DISCOVERY_DELAYS: Record<DiscoveryId, number> = {
  chk9: 1800,
  ai: 4200,
  physical: 5600,
  dead: 7000,
  capital: 8600,
  tool: 10200,
  consumer: 11800,
  research: 13400,
};

const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

function App() {
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [visible, setVisible] = useState<Record<DiscoveryId, boolean>>({
    chk9: false,
    ai: false,
    physical: false,
    dead: false,
    capital: false,
    tool: false,
    consumer: false,
    research: false,
  });

  const [chk9, setChk9] = useState({
    lineX: 160,
    value: 97.42,
    moving: false,
    frozen: false,
    choice: null as 'up' | 'down' | 'flat' | null,
    complete: false,
    label: false,
  });

  const [aiState, setAiState] = useState({
    expanded: false,
    round: 0,
    answered: false,
    result: '',
    done: false,
  });

  const [physicalState, setPhysicalState] = useState({
    dragging: false,
    x: 110,
    y: 720,
    vx: 0,
    vy: 0,
    throws: 0,
    unfolded: false,
    revealed: false,
  });

  const [deadState, setDeadState] = useState({
    count: 0,
    alive: false,
    value: 0,
  });

  const [capitalState, setCapitalState] = useState({
    value: 1,
    stage: 'base' as 'base' | 'choice1' | 'choice2' | 'final',
    choice: null as 'left' | 'right' | null,
    result: 0,
  });

  const [toolState, setToolState] = useState({
    input: '',
    submitted: false,
    useful: false,
  });

  const [consumerState, setConsumerState] = useState({
    open: false,
    explored: false,
    shown: false,
  });

  const [researchState, setResearchState] = useState({
    open: false,
    step: 0,
    conclusion: false,
  });

  const dragRef = useRef<Point | null>(null);
  const lineRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    sync();
    window.addEventListener('resize', sync);
    setMounted(true);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    const timers = Object.entries(DISCOVERY_DELAYS).map(([id, delay]) => {
      const timeout = window.setTimeout(() => {
        setVisible((current) => ({ ...current, [id]: true }));
      }, delay);
      return timeout;
    });

    return () => timers.forEach((timeout) => window.clearTimeout(timeout));
  }, []);

  useEffect(() => {
    if (!chk9.moving || chk9.frozen) return;

    const interval = window.setInterval(() => {
      setChk9((current) => {
        const nextValue = current.value + (Math.random() - 0.5) * 1.8;
        const direction = current.choice === 'up' ? 1 : current.choice === 'down' ? -1 : Math.random() > 0.5 ? 1 : -1;
        const drift = direction * (Math.random() * 18 + 6);
        const nextLine = clamp(current.lineX + drift * 0.35, 100, viewport.width - 150);
        return {
          ...current,
          lineX: nextLine,
          value: Number(Math.max(70, Math.min(110, nextValue)).toFixed(2)),
        };
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [chk9.moving, chk9.frozen, viewport.width]);

  useEffect(() => {
    if (!chk9.choice || !chk9.frozen || chk9.complete) return;
    const timer = window.setTimeout(() => {
      setChk9((current) => ({ ...current, complete: true, label: true }));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [chk9.choice, chk9.frozen, chk9.complete]);

  useEffect(() => {
    if (!physicalState.dragging) return;
    const frame = window.requestAnimationFrame(function tick() {
      setPhysicalState((current) => {
        if (!current.dragging) return current;
        return {
          ...current,
          x: clamp(current.x + current.vx, 50, viewport.width - 60),
          y: clamp(current.y + current.vy, 60, viewport.height - 60),
          vy: current.vy + 0.3,
        };
      });
      window.requestAnimationFrame(tick);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [physicalState.dragging, viewport.width, viewport.height]);

  useEffect(() => {
    if (capitalState.stage !== 'base') return;
    const timer = window.setTimeout(() => {
      setCapitalState((current) => ({ ...current, stage: 'choice1' }));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [capitalState.stage]);

  const protectedRegion = useMemo(
    () => ({
      x: viewport.width / 2 - 220,
      y: viewport.height / 2 - 170,
      width: 440,
      height: 260,
    }),
    [viewport],
  );

  const safePosition = (x: number, y: number, width = 60, height = 60) => {
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const withinX = Math.abs(x - centerX) < protectedRegion.width / 2 + width * 0.6;
    const withinY = Math.abs(y - centerY) < protectedRegion.height / 2 + height * 0.8;
    return withinX && withinY ? { x: clamp(x + 140, 80, viewport.width - 120), y: clamp(y + 220, 80, viewport.height - 120) } : { x, y };
  };

  const chk9Style = {
    left: `${clamp(70, 40, viewport.width - 260)}px`,
    top: `${clamp(70, 40, viewport.height - 200)}px`,
  };

  const aiStyle = {
    left: `${clamp(viewport.width - 210, 120, viewport.width - 80)}px`,
    top: `${clamp(115, 40, viewport.height - 260)}px`,
  };

  const capitalStyle = {
    left: `${clamp(220, 70, viewport.width - 180)}px`,
    top: `${clamp(240, 80, viewport.height - 220)}px`,
  };

  const toolStyle = {
    left: `${clamp(viewport.width - 520, 420, viewport.width - 180)}px`,
    top: `${clamp(viewport.height * 0.72, 500, viewport.height - 120)}px`,
  };

  const researchStyle = {
    left: `${clamp(viewport.width - 350, 120, viewport.width - 180)}px`,
    top: `${clamp(170, 110, viewport.height - 300)}px`,
  };

  const consumerStyle = {
    left: `${clamp(140, 80, viewport.width - 220)}px`,
    top: `${clamp(viewport.height - 285, 150, viewport.height - 180)}px`,
  };

  const physicalStyle = {
    left: `${clamp(80, 30, viewport.width - 140)}px`,
    top: `${clamp(viewport.height - 180, 180, viewport.height - 90)}px`,
  };

  const deadStyle = {
    left: `${clamp(viewport.width - 180, 110, viewport.width - 80)}px`,
    top: `${clamp(viewport.height * 0.75, 330, viewport.height - 90)}px`,
  };

  const handleLineClick = () => {
    if (chk9.complete) {
      window.location.hash = '#chk9';
      return;
    }

    setChk9((current) => {
      if (!current.frozen) {
        return { ...current, moving: true, value: 97.42 };
      }
      return current;
    });
  };

  const handleValueClick = () => {
    setChk9((current) => ({
      ...current,
      moving: false,
      frozen: true,
      choice: null,
    }));
  };

  const handleTrajectoryClick = (choice: 'up' | 'down' | 'flat') => {
    setChk9((current) => ({ ...current, choice, frozen: true, moving: true }));
  };

  const handleAiClick = () => {
    if (aiState.done) {
      window.location.hash = '#ai';
      return;
    }

    if (aiState.round >= 3) {
      setAiState((current) => ({ ...current, expanded: true, done: true }));
      return;
    }

    setAiState((current) => ({
      ...current,
      answered: !current.answered,
      round: current.round + 1,
      result: current.result || 'the page is still waiting.',
    }));
  };

  const handleAiInputSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('answer') as HTMLInputElement | null;
    const value = input?.value?.trim();
    if (!value) return;
    setAiState((current) => ({
      ...current,
      answered: true,
      round: current.round + 1,
      result: value,
      expanded: current.round >= 2,
    }));
    form.reset();
  };

  const handlePhysicalPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    setPhysicalState((current) => ({ ...current, dragging: true }));
  };

  const handlePhysicalPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !physicalState.dragging) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };

    setPhysicalState((current) => ({
      ...current,
      x: clamp(current.x + dx * 0.6, 30, viewport.width - 60),
      y: clamp(current.y + dy * 0.6, 30, viewport.height - 60),
      vx: dx * 0.12,
      vy: dy * 0.12,
    }));
  };

  const handlePhysicalPointerUp = () => {
    if (!physicalState.dragging) return;
    setPhysicalState((current) => ({
      ...current,
      dragging: false,
      throws: current.throws + 1,
      vx: current.vx * 0.7,
      vy: current.vy * 0.7,
    }));

    if (physicalState.throws + 1 >= 3) {
      setTimeout(() => {
        setPhysicalState((current) => ({ ...current, unfolded: true }));
      }, 250);
    }
  };

  const handleDeadClick = () => {
    setDeadState((current) => {
      const count = current.count + 1;
      if (count >= 9) {
        return { alive: true, count: 9, value: 1 };
      }
      return { ...current, count };
    });
  };

  useEffect(() => {
    if (!deadState.alive) return;
    const interval = window.setInterval(() => {
      setDeadState((current) => ({ ...current, value: current.value + 1 }));
    }, 160);
    return () => window.clearInterval(interval);
  }, [deadState.alive]);

  const handleCapitalClick = () => {
    setCapitalState((current) => {
      if (current.stage === 'base') {
        return { ...current, stage: 'choice1' };
      }
      if (current.stage === 'choice1') {
        return { ...current, stage: 'choice2', choice: 'left' };
      }
      if (current.stage === 'choice2') {
        return { ...current, stage: 'final', result: current.value };
      }
      return current;
    });
  };

  const handleCapitalChoice = (choice: 'left' | 'right') => {
    setCapitalState((current) => {
      const nextValue = current.value * (choice === 'left' ? 2 : 4);
      return {
        value: nextValue,
        stage: current.stage === 'choice1' ? 'choice2' : 'final',
        choice,
        result: current.stage === 'choice2' ? nextValue : current.result,
      };
    });
  };

  const handleToolSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('toolInput') as HTMLInputElement | null;
    const value = input?.value?.trim();
    if (!value) return;
    setToolState({ input: value, submitted: true, useful: true });
  };

  const handleConsumerClick = () => {
    setConsumerState((current) => ({ ...current, open: !current.open, explored: true }));
  };

  const handleResearchClick = () => {
    setResearchState((current) => ({
      open: true,
      step: current.step + 1,
      conclusion: current.step >= 5,
    }));
  };

  return (
    <main className="site-shell">
      <div className="poster" aria-label="THEOFF9 brand poster">
        <img className="wordmark" src={wordmark} alt="THEOFF9" />
        <p className="tagline">smthing is being built.</p>
      </div>

      <div className="experiment-layer" aria-live="polite">
        {visible.chk9 && (
          <div className="experiment chk9" style={chk9Style}>
            {!chk9.frozen && (
              <button type="button" className="line-trigger" onClick={handleLineClick} aria-label="CHK9 line experiment">
                <span className="market-line" />
              </button>
            )}

            {chk9.moving && (
              <button type="button" className="value-pill" onClick={handleValueClick}>
                {chk9.value.toFixed(2)}
              </button>
            )}

            {chk9.frozen && !chk9.complete && (
              <div className="trajectory-panel">
                {(['up', 'down', 'flat'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`trajectory ${option}`}
                    onClick={() => handleTrajectoryClick(option)}
                    aria-label={option}
                  />
                ))}
              </div>
            )}

            {chk9.choice && chk9.frozen && chk9.complete && (
              <button type="button" className="project-tag" onClick={() => window.location.hash = '#chk9'}>
                CHK9
              </button>
            )}
          </div>
        )}

        {visible.ai && (
          <div className="experiment ai" style={aiStyle}>
            <button type="button" className={`ai-square ${aiState.expanded ? 'expanded' : ''}`} onClick={handleAiClick}>
              {aiState.done ? '02' : 'AI'}
            </button>
            {aiState.round > 0 && !aiState.done && (
              <form className="ai-form" onSubmit={handleAiInputSubmit}>
                <input name="answer" type="text" placeholder="answer" autoComplete="off" />
                <button type="submit">send</button>
              </form>
            )}
          </div>
        )}

        {visible.physical && (
          <div
            className={`experiment physical ${physicalState.unfolded ? 'unfolded' : ''}`}
            style={{
              left: `${physicalState.x}px`,
              top: `${physicalState.y}px`,
              ...physicalStyle,
            }}
            onPointerDown={handlePhysicalPointerDown}
            onPointerMove={handlePhysicalPointerMove}
            onPointerUp={handlePhysicalPointerUp}
            onPointerLeave={handlePhysicalPointerUp}
          >
            {physicalState.unfolded ? <span className="prototype-mark">03</span> : <span className="physical-object" />}
          </div>
        )}

        {visible.dead && (
          <div className="experiment dead" style={deadStyle}>
            <button type="button" className={`dead-box ${deadState.alive ? 'alive' : ''}`} onClick={handleDeadClick}>
              {deadState.alive ? <span>{deadState.value}</span> : '□'}
            </button>
            {deadState.alive && (
              <button type="button" className="project-tag dead-tag" onClick={() => window.location.hash = '#04'}>
                04
              </button>
            )}
          </div>
        )}

        {visible.capital && (
          <div className="experiment capital" style={capitalStyle}>
            <button type="button" className="capital-pill" onClick={handleCapitalClick}>
              {capitalState.stage === 'base' ? '₹1' : capitalState.stage === 'choice1' ? '₹2' : capitalState.stage === 'choice2' ? 'choose' : `₹${capitalState.result}`}
            </button>
            {capitalState.stage === 'choice1' && (
              <div className="capital-choice-row">
                <button type="button" className="capital-choice left" onClick={() => handleCapitalChoice('left')}>A</button>
                <button type="button" className="capital-choice right" onClick={() => handleCapitalChoice('right')}>B</button>
              </div>
            )}
            {capitalState.stage === 'final' && <button type="button" className="project-tag">05</button>}
          </div>
        )}

        {visible.tool && (
          <div className="experiment tool" style={toolStyle}>
            {!toolState.submitted ? (
              <form onSubmit={handleToolSubmit} className="tool-form">
                <label htmlFor="toolInput">paste anything</label>
                <input id="toolInput" name="toolInput" type="text" autoComplete="off" />
                <button type="submit">submit</button>
              </form>
            ) : (
              <button type="button" className="tool-output" onClick={() => window.location.hash = '#tool'}>
                {toolState.useful ? '06' : 'tool'}
              </button>
            )}
          </div>
        )}

        {visible.consumer && (
          <div className="experiment consumer" style={consumerStyle}>
            <button type="button" className={`package ${consumerState.open ? 'open' : ''}`} onClick={handleConsumerClick}>
              {consumerState.open ? '07' : 'package'}
            </button>
          </div>
        )}

        {visible.research && (
          <div className="experiment research" style={researchStyle}>
            <button type="button" className="question-mark" onClick={handleResearchClick}>
              {researchState.conclusion ? '08' : '?'}
            </button>
            {researchState.open && !researchState.conclusion && (
              <div className="research-evidence">
                <span>WHY DOES</span>
                <strong>{researchState.step}</strong>
                <span>HAPPEN?</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
