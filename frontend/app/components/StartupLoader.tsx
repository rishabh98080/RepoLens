"use client";

interface StartupLoaderProps {
  initStage: number;
  isAwake: boolean;
}

export default function StartupLoader({ initStage, isAwake }: StartupLoaderProps) {
  if (isAwake && initStage >= 5) return null;

  return (
    <div className={`startup-loader`}>
      <div className="loader-content" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <div className="init-text" style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 10px', background: 'linear-gradient(135deg, var(--orange), var(--orange2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RepoLens</h2>
          <p>{initStage >= 4 && !isAwake ? "Waking up the backend..." : "Enterprise Codebase Risk Intelligence"}</p>
        </div>
        
        {initStage < 4 ? (
          <div className="init-logs" style={{ marginTop: '24px', fontSize: '13px', color: '#888', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--blue)' }}>[SYS]</span> Initializing core runtime... <span style={{ color: 'var(--green)' }}>OK</span></div>
            {initStage > 1 && <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--blue)' }}>[SEC]</span> Loading vulnerability signatures... <span style={{ color: 'var(--green)' }}>OK</span></div>}
            {initStage > 2 && <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--blue)' }}>[NET]</span> Establishing secure API tunnel... <span style={{ color: 'var(--green)' }}>OK</span></div>}
          </div>
        ) : !isAwake ? (
          <div className="init-logs" style={{ marginTop: '24px', fontSize: '14px', color: '#ccc', textAlign: 'center', background: 'rgba(255, 140, 0, 0.05)', padding: '24px', borderRadius: '8px', border: '1px solid rgba(255, 140, 0, 0.2)' }}>
            <div style={{ marginBottom: '12px', color: 'var(--orange)', fontWeight: 'bold' }}>Hold tight!</div>
            <p style={{ margin: '0 0 10px', lineHeight: '1.5' }}>The Render.com free-tier backend is currently waking up from a deep slumber. This can take up to <strong>50 seconds</strong>.</p>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#888', fontSize: '12px' }}>Please be patient, I'm broke and can't afford the premium tier right now. 😭☕</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
