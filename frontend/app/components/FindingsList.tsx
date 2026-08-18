"use client";

import { ParsedIssue } from "../types";

interface FindingsListProps {
  issues: ParsedIssue[];
  displayIssues: ParsedIssue[];
  filterLevel: string;
  setFilterLevel: (l: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedIssueIndex: number | null;
  handleSelectIssue: (index: number | null) => void;
  setLogModalOpen: (b: boolean) => void;
  exportDocx: () => void;
  currentTaskId: string | null;
}

export default function FindingsList({ 
  issues, displayIssues, filterLevel, setFilterLevel, searchQuery, setSearchQuery, 
  selectedIssueIndex, handleSelectIssue, setLogModalOpen, exportDocx, currentTaskId 
}: FindingsListProps) {
  return (
    <div className="panel" style={{ maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-head">
        <div className="panel-title">Findings ({displayIssues.length})</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filter" onClick={exportDocx} disabled={!currentTaskId} style={{ borderColor: 'var(--line)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Report
          </button>
        </div>
      </div>
      
      <div style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search findings..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px', width: '180px', outline: 'none' }}
          />
          <button className={`filter ${filterLevel === 'all' ? 'active' : ''}`} onClick={() => { setFilterLevel('all'); handleSelectIssue(null); }}>All</button>
          <button className={`filter ${filterLevel === 'critical' ? 'active' : ''}`} onClick={() => { setFilterLevel('critical'); handleSelectIssue(null); }}>Critical</button>
          <button className={`filter ${filterLevel === 'high' ? 'active' : ''}`} onClick={() => { setFilterLevel('high'); handleSelectIssue(null); }}>High</button>
          <button className={`filter ${filterLevel === 'medium' ? 'active' : ''}`} onClick={() => { setFilterLevel('medium'); handleSelectIssue(null); }}>Medium</button>
          <button className={`filter ${filterLevel === 'low' ? 'active' : ''}`} onClick={() => { setFilterLevel('low'); handleSelectIssue(null); }}>Low</button>
          <button className={`filter ${filterLevel === 'info' ? 'active' : ''}`} onClick={() => { setFilterLevel('info'); handleSelectIssue(null); }}>Info</button>
          <button className={`filter ${filterLevel === 'license' ? 'active' : ''}`} onClick={() => { setFilterLevel('license'); handleSelectIssue(null); }}>Licenses</button>
          <button className="filter" style={{ marginLeft: '10px', borderColor: 'var(--line)' }} onClick={() => setLogModalOpen(true)}>View Logs</button>
        </div>
      </div>

      <div id="findingsList" style={{ overflowY: 'auto', flex: 1 }}>
        {displayIssues.map((x, i) => {
          const origIndex = issues.indexOf(x);
          const displaySev = x.sev;
          return (
            <div key={i} className={`finding ${selectedIssueIndex === origIndex ? 'selected' : ''}`} onClick={() => handleSelectIssue(origIndex)}>
              <div className={`sev ${displaySev}`}>{displaySev}</div>
              <div>
                <h3>{x.title}</h3>
                <div className="meta"><span>{x.tool}</span> • <span>{x.file}</span></div>
              </div>
            </div>
          );
        })}
        {displayIssues.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontSize: '13px' }}>No findings match the current filters.</div>
        )}
      </div>
    </div>
  );
}
