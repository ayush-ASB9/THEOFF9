import type { CSSProperties } from 'react';
import wordmark from '../PUBLIC/image.png';

function App() {
  const brandStyle = {
    '--brand-scale': 'clamp(200px, 34vw, 720px)',
  } as CSSProperties;

  return (
    <main className="site-shell" style={brandStyle}>
      <div className="poster" aria-label="THEOFF9 brand poster">
        <img className="wordmark" src={wordmark} alt="THEOFF9" />
        <p className="tagline">smthing is being built.</p>
      </div>
    </main>
  );
}

export default App;
