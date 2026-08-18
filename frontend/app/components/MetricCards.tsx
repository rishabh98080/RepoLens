"use client";

import { ScanMetrics } from "../types";

export default function MetricCards({ metrics }: { metrics: ScanMetrics }) {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon" style={{ background: 'rgba(255, 51, 102, 0.1)', color: 'var(--red)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
        </div>
        <div className="metric-val">{metrics.total}</div>
        <div className="metric-label">Issues Found</div>
      </div>
      
      <div className="metric-card">
        <div className="metric-icon" style={{ background: 'rgba(255, 170, 0, 0.1)', color: 'var(--orange)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div className="metric-val">{metrics.high}</div>
        <div className="metric-label">High Severity</div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ background: 'rgba(109, 169, 255, 0.1)', color: 'var(--blue)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div className="metric-val">{metrics.time}</div>
        <div className="metric-label">Scan Time</div>
      </div>

      <div className="metric-card" style={{ background: 'linear-gradient(145deg, rgba(30, 34, 42, 0.6), rgba(15, 18, 25, 0.8))', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="metric-icon" style={{ 
          background: metrics.score === null ? 'rgba(255,255,255,0.05)' : (metrics.score >= 80 ? 'rgba(0, 230, 118, 0.1)' : metrics.score >= 50 ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255, 51, 102, 0.1)'), 
          color: metrics.score === null ? '#888' : (metrics.score >= 80 ? 'var(--green)' : metrics.score >= 50 ? 'var(--orange)' : 'var(--red)') 
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div className="metric-val">{metrics.score !== null ? metrics.score : 'N/A'}<span style={{ fontSize: '16px', color: '#888' }}>{metrics.score !== null ? '/100' : ''}</span></div>
        <div className="metric-label">Health Score</div>
      </div>
    </div>
  );
}
