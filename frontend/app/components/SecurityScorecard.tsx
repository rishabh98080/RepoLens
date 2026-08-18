"use client";

import { ScorecardStats, ScanMetrics, ParsedIssue } from "../types";

interface SecurityScorecardProps {
  scorecardStats: ScorecardStats;
  metrics: ScanMetrics;
  issues: ParsedIssue[];
}

export default function SecurityScorecard({ scorecardStats, metrics, issues }: SecurityScorecardProps) {
  return (
    <section className="content" style={{ marginTop: '30px', marginBottom: '30px', display: 'flex', gap: '24px' }}>
      <div style={{ flex: '1.5', background: 'var(--panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow)', backdropFilter: 'blur(20px)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontFamily: 'var(--font-outfit)' }}>Security Scorecard</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secrets</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: scorecardStats.secrets > 0 ? 'var(--red)' : '#fff' }}>{scorecardStats.secrets}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code Risk</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: scorecardStats.sast > 0 ? 'var(--orange)' : '#fff' }}>{scorecardStats.sast}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dependencies</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: scorecardStats.deps > 0 ? 'var(--yellow)' : '#fff' }}>{scorecardStats.deps}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Licenses</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{scorecardStats.license}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', borderLeft: '1px solid var(--glass-border)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>Repository Summary</h3>
        <p style={{ margin: '0', fontSize: '13px', color: '#aaa', lineHeight: '1.6' }}>
          {issues.length > 0 ? (
            <>This repository has an overall health score of <strong style={{color: metrics.score === null ? '#888' : (metrics.score >= 80 ? 'var(--green)' : metrics.score >= 50 ? 'var(--orange)' : 'var(--red)')}}>{metrics.score !== null ? metrics.score : 'N/A'}</strong>. We detected <strong style={{color: 'var(--red)'}}>{metrics.high} high/critical issues</strong> that require immediate attention. The top concern is {issues[0].tool.toLowerCase()} finding: <em>"{issues[0].title}"</em>.</>
          ) : (
            <>No security vulnerabilities were detected in this repository. The codebase appears healthy and dependencies are secure.</>
          )}
        </p>
      </div>
    </section>
  );
}
