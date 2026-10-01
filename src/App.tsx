import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react';

type PointerPosition = {
  x: number;
  y: number;
};

const moments = [
  "don't click this",
  'you clicked it.',
  'wait.',
  "okay. you're curious.",
  "that's probably enough.",
  'fine. keep looking.',
];

function App() {
  const [moment, setMoment] = useState(0);
  const [pointer, setPointer] = useState<PointerPosition>({ x: 0, y: 0 });
  const [logoSource, setLogoSource] = useState<string | null>(null);

  useEffect(() => {
    const source = new Image();
    source.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        setLogoSource('/THEOFF9.png');
        return;
      }

      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      context.drawImage(source, 0, 0);

      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < image.data.length; index += 4) {
        const red = image.data[index];
        const green = image.data[index + 1];
        const blue = image.data[index + 2];
        const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);

        if (chroma > 24) {
          image.data[index + 3] = 0;
        }
      }

      context.putImageData(image, 0, 0);
      setLogoSource(canvas.toDataURL('image/png'));
    };
    source.onerror = () => setLogoSource('/THEOFF9.png');
    source.src = '/THEOFF9.png';
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    setPointer({ x, y });
  };

  const handleDiscovery = () => {
    setMoment((current) => Math.min(current + 1, moments.length - 1));
  };

  return (
    <main
      className={`site-shell moment-${moment}`}
      onPointerMove={handlePointerMove}
      style={
        {
          '--pointer-x': pointer.x,
          '--pointer-y': pointer.y,
        } as CSSProperties
      }
    >
      <header className="topline">
        <span className="tiny-label">the office is currently</span>
        <span className="tiny-state"><i /> quiet</span>
      </header>

      <div className="coordinate" aria-hidden="true">
        <span>00</span>
        <span>09</span>
      </div>

      <section className="hero" aria-labelledby="site-title">
        <div className={`logo-wrap ${logoSource ? 'logo-ready' : ''}`}>
          {logoSource && (
            <img
              className="logo"
              src={logoSource}
              alt="THEOFF9"
              id="site-title"
            />
          )}
        </div>

        <div className="message-line">
          <p className="tagline">something is being built.</p>
          <span className="rule" aria-hidden="true" />
          <p className="aside-note" aria-live="polite">
            {moment > 0 ? `signal ${String(moment).padStart(2, '0')}` : 'signal 00'}
          </p>
        </div>

        <button className="discovery" type="button" onClick={handleDiscovery}>
          <span className="bracket">[</span>
          <span key={moment} className="discovery-copy">{moments[moment]}</span>
          <span className="bracket">]</span>
        </button>
      </section>

      <div className="edge-note" aria-hidden="true">not a real office</div>

      <footer className="footer">
        <span>© THEOFF9</span>
        <span className="footer-note">please return later</span>
      </footer>
    </main>
  );
}

export default App;
