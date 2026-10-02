import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react';

type Point = {
  x: number;
  y: number;
};

const markPositions: Point[] = [
  { x: 82, y: 64 },
  { x: 73, y: 29 },
  { x: 24, y: 72 },
];

function App() {
  const [stage, setStage] = useState(0);
  const [escape, setEscape] = useState(0);
  const [markPosition, setMarkPosition] = useState(markPositions[0]);

  const isFinished = stage >= 4;

  useEffect(() => {
    if (stage !== 3) return undefined;

    const timeout = window.setTimeout(() => setStage(4), 950);
    return () => window.clearTimeout(timeout);
  }, [stage]);

  const handleCanvasMove = (event: PointerEvent<HTMLElement>) => {
    if (stage !== 0 || escape >= 2) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
    const distance = Math.hypot(pointerX - markPosition.x, pointerY - markPosition.y);

    if (distance < 10) {
      const nextEscape = escape + 1;
      setEscape(nextEscape);
      setMarkPosition(markPositions[nextEscape]);

      if (nextEscape === 2) {
        setStage(1);
      }
    }
  };

  const handleMarkClick = () => {
    if (stage === 0) {
      setEscape(2);
      setStage(1);
      setMarkPosition(markPositions[2]);
      return;
    }

    if (stage === 1) {
      setStage(2);
      return;
    }

    if (stage === 2) {
      setStage(3);
    }
  };

  const tagline = [
    'something is being built.',
    'something noticed you.',
    'that was not the thing.',
    'you found something.',
    'not the thing.',
  ][stage];

  return (
    <main
      className={`site-shell stage-${stage}`}
      onPointerMove={handleCanvasMove}
      style={
        {
          '--mark-x': `${markPosition.x}%`,
          '--mark-y': `${markPosition.y}%`,
        } as CSSProperties
      }
    >
      <section className="hero" aria-labelledby="site-title">
        <div className="logo-wrap">
          <div className="brand-lockup" aria-label="THEOFF9 logo set">
            <img className="logo-mark" src="/O%20of%20theoff9.png" alt="THEOFF9 icon" />
            <img className="logo" src="/image.png" alt="THEOFF9" id="site-title" />
          </div>
        </div>

        <p className="tagline" aria-live="polite">{tagline}</p>

        {!isFinished && (
          <button
            className="odd-mark"
            type="button"
            aria-label={stage === 0 ? 'a strange little mark' : 'continue'}
            onClick={handleMarkClick}
          />
        )}
      </section>

      <footer className="footer">© THEOFF9</footer>
    </main>
  );
}

export default App;
