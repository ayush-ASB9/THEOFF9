import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import brokenO from '../PUBLIC/O of theoff9.png';
import wordmark from '../PUBLIC/image.png';

type Point = {
  x: number;
  y: number;
};

type SharedState = {
  current: number;
  updatedAt: number;
  signature: number;
};

type StateConfig = {
  oX: number;
  oY: number;
  oScale: number;
  oRotation: number;
  ghostX: number;
  ghostY: number;
  ghostScale: number;
  ghostRotation: number;
  ghostOpacity: number;
  wordmarkX: number;
  wordmarkY: number;
  wordmarkRotation: number;
  taglineShift: number;
};

const STORAGE_KEY = 'theoff9.collective.v1';
const CHANNEL_KEY = 'theoff9.collective.channel';
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const stateConfigs: StateConfig[] = [
  {
    oX: 0.79,
    oY: 0.29,
    oScale: 210,
    oRotation: 0,
    ghostX: 0.26,
    ghostY: 0.68,
    ghostScale: 84,
    ghostRotation: 12,
    ghostOpacity: 0.12,
    wordmarkX: 0,
    wordmarkY: 0,
    wordmarkRotation: 0,
    taglineShift: 0,
  },
  {
    oX: 0.7,
    oY: 0.38,
    oScale: 190,
    oRotation: 12,
    ghostX: 0.34,
    ghostY: 0.5,
    ghostScale: 98,
    ghostRotation: -18,
    ghostOpacity: 0.2,
    wordmarkX: 20,
    wordmarkY: 36,
    wordmarkRotation: -3,
    taglineShift: 16,
  },
  {
    oX: 0.64,
    oY: 0.46,
    oScale: 182,
    oRotation: -18,
    ghostX: 0.42,
    ghostY: 0.42,
    ghostScale: 114,
    ghostRotation: -10,
    ghostOpacity: 0.26,
    wordmarkX: -18,
    wordmarkY: 52,
    wordmarkRotation: 6,
    taglineShift: 26,
  },
  {
    oX: 0.57,
    oY: 0.51,
    oScale: 204,
    oRotation: 22,
    ghostX: 0.38,
    ghostY: 0.63,
    ghostScale: 88,
    ghostRotation: 14,
    ghostOpacity: 0.28,
    wordmarkX: -26,
    wordmarkY: 62,
    wordmarkRotation: -8,
    taglineShift: 30,
  },
  {
    oX: 0.49,
    oY: 0.57,
    oScale: 240,
    oRotation: -32,
    ghostX: 0.28,
    ghostY: 0.7,
    ghostScale: 72,
    ghostRotation: 10,
    ghostOpacity: 0.34,
    wordmarkX: 16,
    wordmarkY: 88,
    wordmarkRotation: 4,
    taglineShift: 40,
  },
  {
    oX: 0.53,
    oY: 0.44,
    oScale: 226,
    oRotation: 18,
    ghostX: 0.53,
    ghostY: 0.54,
    ghostScale: 128,
    ghostRotation: -18,
    ghostOpacity: 0.42,
    wordmarkX: -62,
    wordmarkY: 22,
    wordmarkRotation: 10,
    taglineShift: 8,
  },
  {
    oX: 0.59,
    oY: 0.4,
    oScale: 214,
    oRotation: -14,
    ghostX: 0.45,
    ghostY: 0.38,
    ghostScale: 136,
    ghostRotation: 22,
    ghostOpacity: 0.52,
    wordmarkX: 44,
    wordmarkY: -12,
    wordmarkRotation: -12,
    taglineShift: -6,
  },
  {
    oX: 0.62,
    oY: 0.35,
    oScale: 260,
    oRotation: 7,
    ghostX: 0.49,
    ghostY: 0.48,
    ghostScale: 154,
    ghostRotation: -4,
    ghostOpacity: 0.64,
    wordmarkX: -40,
    wordmarkY: -32,
    wordmarkRotation: 6,
    taglineShift: -18,
  },
  {
    oX: 0.5,
    oY: 0.46,
    oScale: 286,
    oRotation: -2,
    ghostX: 0.5,
    ghostY: 0.48,
    ghostScale: 178,
    ghostRotation: 0,
    ghostOpacity: 0.8,
    wordmarkX: -4,
    wordmarkY: 14,
    wordmarkRotation: 0,
    taglineShift: -24,
  },
];

const defaultState: SharedState = {
  current: 0,
  updatedAt: 0,
  signature: 0,
};

const shortestAngleDelta = (current: number, previous: number) => {
  const difference = current - previous;
  const wrapped = ((difference + Math.PI) % (Math.PI * 2)) - Math.PI;
  return wrapped < -Math.PI ? wrapped + Math.PI * 2 : wrapped;
};

function App() {
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const [sharedState, setSharedState] = useState<SharedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const orbitHistoryRef = useRef<Point[]>([]);

  const currentConfig = stateConfigs[clamp(sharedState.current, 0, stateConfigs.length - 1)];

  const commitState = useCallback((nextIndex: number) => {
    const bounded = clamp(nextIndex, 0, stateConfigs.length - 1);
    setSharedState((current) => {
      const next: SharedState = {
        current: bounded,
        updatedAt: Date.now(),
        signature: current.signature + 1,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // keep the app working without storage access
      }

      channelRef.current?.postMessage(next);
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SharedState>;
        const nextState: SharedState = {
          current: clamp(parsed.current ?? 0, 0, stateConfigs.length - 1),
          updatedAt: parsed.updatedAt ?? Date.now(),
          signature: Math.max(parsed.signature ?? 0, 0),
        };
        setSharedState(nextState);
      }
    } catch {
      // ignore invalid storage and keep default state
    }

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_KEY);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<SharedState>) => {
        const next = event.data;
        if (!next || typeof next.current !== 'number') return;
        setSharedState((current) => {
          const candidate = {
            current: clamp(next.current ?? current.current, 0, stateConfigs.length - 1),
            updatedAt: next.updatedAt ?? current.updatedAt,
            signature: Math.max(current.signature, next.signature ?? current.signature),
          };
          return candidate.updatedAt > current.updatedAt ? candidate : current;
        });
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<SharedState>;
        const nextState: SharedState = {
          current: clamp(parsed.current ?? 0, 0, stateConfigs.length - 1),
          updatedAt: parsed.updatedAt ?? Date.now(),
          signature: Math.max(parsed.signature ?? 0, 0),
        };
        setSharedState((current) => (nextState.updatedAt > current.updatedAt ? nextState : current));
      } catch {
        // ignore invalid storage sync data
      }
    };

    window.addEventListener('storage', handleStorage);
    setHydrated(true);

    return () => {
      channelRef.current?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 1.1;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 1.1;

    const nextPointer = {
      x: clamp(normalizedX - 0.05, 0, 1),
      y: clamp(normalizedY - 0.05, 0, 1),
    };

    setPointer(nextPointer);

    if (!hydrated) return;

    const center = { x: currentConfig.oX, y: currentConfig.oY };
    const dx = nextPointer.x - center.x;
    const dy = nextPointer.y - center.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0.18) {
      orbitHistoryRef.current = [];
      return;
    }

    orbitHistoryRef.current.push(nextPointer);
    if (orbitHistoryRef.current.length > 12) orbitHistoryRef.current.shift();
    if (orbitHistoryRef.current.length < 6) return;

    let turnTotal = 0;
    for (let index = 1; index < orbitHistoryRef.current.length; index += 1) {
      const previous = orbitHistoryRef.current[index - 1];
      const current = orbitHistoryRef.current[index];
      const previousAngle = Math.atan2(previous.y - center.y, previous.x - center.x);
      const currentAngle = Math.atan2(current.y - center.y, current.x - center.x);
      turnTotal += Math.abs(shortestAngleDelta(currentAngle, previousAngle));
    }

    if (turnTotal > 2.6) {
      orbitHistoryRef.current = [];
      commitState(sharedState.current + 1);
    }
  };

  const styles = {
    '--o-x': `${currentConfig.oX * 100}%`,
    '--o-y': `${currentConfig.oY * 100}%`,
    '--o-scale': `${currentConfig.oScale}px`,
    '--o-rotation': `${currentConfig.oRotation}deg`,
    '--ghost-x': `${currentConfig.ghostX * 100}%`,
    '--ghost-y': `${currentConfig.ghostY * 100}%`,
    '--ghost-scale': `${currentConfig.ghostScale}px`,
    '--ghost-rotation': `${currentConfig.ghostRotation}deg`,
    '--ghost-opacity': `${currentConfig.ghostOpacity}`,
    '--wordmark-x': `${currentConfig.wordmarkX}px`,
    '--wordmark-y': `${currentConfig.wordmarkY}px`,
    '--wordmark-rotation': `${currentConfig.wordmarkRotation}deg`,
    '--tagline-shift': `${currentConfig.taglineShift}px`,
  } as CSSProperties;

  return (
    <main className="site-shell" onPointerMove={handlePointerMove}>
      <div className="scene" style={styles} data-state-index={sharedState.current} aria-label="THEOFF9 object">
        <div className="ghost-o" aria-hidden="true">
          <img className="broken-o-image" src={brokenO} alt="" />
        </div>

        <div className="broken-o" aria-label="THEOFF9 broken O" role="img">
          <img className="broken-o-image" src={brokenO} alt="THEOFF9 broken O" />
        </div>

        <div className="brand-block" aria-label="THEOFF9 wordmark">
          <img className="wordmark" src={wordmark} alt="THEOFF9" />
        </div>

        <p className="tagline">smthing is being built.</p>
      </div>
    </main>
  );
}

export default App;
