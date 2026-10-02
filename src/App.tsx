import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import brokenO from '../PUBLIC/O of theoff9.png';
import wordmark from '../PUBLIC/image.png';

type Point = {
  x: number;
  y: number;
};

type VisitorState = {
  visitCount: number;
  attention: number;
  offsetX: number;
  offsetY: number;
  phase: number;
  memorySeed: number;
};

const STORAGE_KEY = 'theoff9-state-v1';
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const defaultState: VisitorState = {
  visitCount: 0,
  attention: 0,
  offsetX: 0,
  offsetY: 0,
  phase: 0,
  memorySeed: 0,
};

function App() {
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const [state, setState] = useState<VisitorState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const nearRef = useRef(false);
  const lastInteractionRef = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<VisitorState>;
        setState({
          ...defaultState,
          ...parsed,
          visitCount: Math.max(0, parsed.visitCount ?? 0),
          attention: clamp(parsed.attention ?? 0, 0, 2),
          offsetX: clamp(parsed.offsetX ?? 0, -30, 30),
          offsetY: clamp(parsed.offsetY ?? 0, -18, 18),
          phase: clamp(parsed.phase ?? 0, 0, 2),
          memorySeed: clamp(parsed.memorySeed ?? 0, 0, 100),
        });
      }
    } catch {
      // ignore invalid storage and keep default state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    const dx = pointer.x - 0.26;
    const dy = pointer.y + 0.12;
    const distance = Math.hypot(dx, dy);
    const nearMainO = distance < 0.22;

    if (!nearMainO) {
      nearRef.current = false;
      return;
    }

    const now = performance.now();
    if (nearRef.current && now - lastInteractionRef.current < 140) {
      return;
    }

    nearRef.current = true;
    lastInteractionRef.current = now;

    setState((current) => {
      const nextAttention = clamp(current.attention + 0.18, 0, 2);
      const nextPhase = nextAttention > 1.2 ? 2 : nextAttention > 0.45 ? 1 : 0;
      const nextOffsetX = clamp(current.offsetX + pointer.x * 9, -28, 28);
      const nextOffsetY = clamp(current.offsetY + pointer.y * 7, -18, 18);

      return {
        ...current,
        visitCount: current.visitCount + 1,
        attention: nextAttention,
        phase: Math.max(current.phase, nextPhase),
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
        memorySeed: current.memorySeed + 1,
      };
    });
  }, [pointer]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;

    setPointer({
      x: clamp(normalizedX, -1, 1),
      y: clamp(normalizedY, -1, 1),
    });
  };

  const handleMarkToggle = () => {
    setState((current) => ({
      ...current,
      phase: current.phase >= 2 ? 0 : current.phase + 1,
      attention: clamp(current.attention + 0.25, 0, 2),
      offsetX: clamp(current.offsetX + 8, -30, 30),
      offsetY: clamp(current.offsetY - 6, -18, 18),
      memorySeed: current.memorySeed + 1,
      visitCount: current.visitCount + 1,
    }));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMarkToggle();
    }
  };

  const markStyle = {
    '--pointer-x': `${pointer.x * 18}px`,
    '--pointer-y': `${pointer.y * 14}px`,
    '--offset-x': `${state.offsetX}px`,
    '--offset-y': `${state.offsetY}px`,
    '--tilt': `${pointer.x * 8 + state.phase * 4}deg`,
    '--scale': `${1 + state.attention * 0.12}`,
  } as CSSProperties;

  const ghostStyle = {
    '--ghost-x': `${pointer.x * 12 + state.offsetX * 0.3}px`,
    '--ghost-y': `${pointer.y * 10 + state.offsetY * 0.4}px`,
    '--ghost-tilt': `${pointer.x * -5}deg`,
    opacity: state.phase === 0 ? 0.12 : state.phase === 1 ? 0.38 : 0.82,
  } as CSSProperties;

  const wordmarkStyle = {
    transform: `translate(${state.offsetX * 0.4}px, ${state.offsetY * 0.3}px) rotate(${state.phase * 0.8}deg)`,
  } as CSSProperties;

  return (
    <main className={`site-shell phase-${state.phase}`} onPointerMove={handlePointerMove}>
      <div className="scene" aria-label="THEOFF9 homepage">
        <div className="ghost-o" style={ghostStyle} aria-hidden="true">
          <img className="broken-o-image" src={brokenO} alt="" />
        </div>

        <button
          type="button"
          className="broken-o"
          style={markStyle}
          onClick={handleMarkToggle}
          onKeyDown={handleKeyDown}
          aria-label="Toggle THEOFF9 visual state"
        >
          <img className="broken-o-image" src={brokenO} alt="THEOFF9 broken O logo" />
        </button>

        <div className="brand-block" aria-label="THEOFF9 wordmark and tagline" style={wordmarkStyle}>
          <img className="wordmark" src={wordmark} alt="THEOFF9" />
        </div>

        <p className="tagline">smthing is being built.</p>
      </div>
    </main>
  );
}

export default App;
