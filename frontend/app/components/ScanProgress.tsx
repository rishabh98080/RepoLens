"use client";

import { useEffect, useRef } from "react";

interface ScanProgressProps {
  scanStage: string;
  scanProgress: number;
  scanLogs: string[];
}

export default function ScanProgress({ scanStage, scanProgress, scanLogs }: ScanProgressProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scanLogs]);

  return (
    <div className="progress-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
        <span style={{ color: 'var(--blue)', fontWeight: 500 }}>{scanStage}</span>
        <span style={{ color: '#888' }}>{Math.round(scanProgress)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${scanProgress}%` }}></div>
      </div>
      
      <div className="terminal-logs" style={{ marginTop: '15px', background: '#000', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#0f0', height: '120px', overflowY: 'auto' }}>
        {scanLogs.map((log, i) => (
          <div key={i} style={{ marginBottom: '4px', opacity: i === scanLogs.length - 1 ? 1 : 0.7 }}>
            <span style={{ color: '#888' }}>[{new Date().toISOString().substring(11,19)}]</span> {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
