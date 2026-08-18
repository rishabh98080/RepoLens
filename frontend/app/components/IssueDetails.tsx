"use client";

import { useState, useEffect } from 'react';

import { ParsedIssue, AIExplanation } from "../types";
import CopyButton from "./CopyButton";

interface IssueDetailsProps {
  selectedIssue: ParsedIssue | null;
  handleSelectIssue: (i: number | null) => void;
  aiExplanation: AIExplanation | null;
  isExplaining: boolean;
  handleExplain: (issue: ParsedIssue) => void;
  url: string;
}

export default function IssueDetails({ 
  selectedIssue, handleSelectIssue, aiExplanation, isExplaining, handleExplain, url 
}: IssueDetailsProps) {
  const getGithubLink = (repoUrl: string, file: string, line: string) => {
    if (!repoUrl || !file || file === 'Unknown') return null;
    let base = repoUrl.trim();
    if (base.endsWith('.git')) base = base.slice(0, -4);
    if (base.endsWith('/')) base = base.slice(0, -1);
    
    let link = `${base}/blob/main/${file}`;
    if (line && line !== '—') link += `#L${line}`;
    return link;
  };

  const renderHighlightedLine = (line: string, isTarget: boolean) => {
    if (!line) return <span className={`src ${isTarget ? 'err' : ''}`} style={{ minHeight: '19px' }} />;
    let html = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span style="color: #A3BE8C">$1</span>')
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|async|await|try|catch|def|import|from|class|return)\b/g, '<span style="color: #88C0D0">$1</span>')
      .replace(/\b(\d+)\b/g, '<span style="color: #B48EAD">$1</span>')
      .replace(/(\/\/.*$|#.*$)/gm, '<span style="color: #616E88">$1</span>');
      
    return <span className={`src ${isTarget ? 'err' : ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const [realCode, setRealCode] = useState<string[] | null>(null);
  const [realCodeStartLine, setRealCodeStartLine] = useState<number | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  useEffect(() => {
    if (!selectedIssue || !url || selectedIssue.file === 'Unknown' || selectedIssue.line === '—') {
      setRealCode(null);
      return;
    }

    const fetchRealCode = async () => {
      setIsLoadingCode(true);
      try {
         let base = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
         const parts = base.split('github.com/');
         if (parts.length < 2) throw new Error("Not github");
         const [owner, repo] = parts[1].split('/');
         const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${selectedIssue.file}`;
         
         const res = await fetch(rawUrl);
         let text = "";
         if (!res.ok) {
           const resMaster = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${selectedIssue.file}`);
           if (!resMaster.ok) throw new Error("Fetch failed");
           text = await resMaster.text();
         } else {
           text = await res.text();
         }
         
         const lines = text.split('\n');
         const targetLine = parseInt(selectedIssue.line);
         if (!isNaN(targetLine)) {
           const start = Math.max(0, targetLine - 5);
           const end = Math.min(lines.length, targetLine + 4);
           let snippetLines = lines.slice(start, end);
           
           let minIndent = Infinity;
           snippetLines.forEach(l => {
             if (l.trim().length > 0) {
               const match = l.match(/^(\s*)/);
               if (match) minIndent = Math.min(minIndent, match[1].length);
             }
           });
           
           if (minIndent > 0 && minIndent !== Infinity) {
             snippetLines = snippetLines.map(l => l.trim().length > 0 ? l.substring(minIndent) : l);
           }

           setRealCodeStartLine(start + 1);
           setRealCode(snippetLines);
         }
      } catch(e) {
         setRealCode(null);
      }
      setIsLoadingCode(false);
    };

    fetchRealCode();
  }, [selectedIssue, url]);

  return (
    <aside className="panel" style={{ maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-head">
        <div className="panel-title">Issue details</div>
        <button className="filter" onClick={() => handleSelectIssue(null)}>Clear</button>
      </div>
      <div className="details" style={{ padding: '19px', overflowY: 'auto', flex: 1 }}>
        {!selectedIssue ? (
          <div className="detail-empty">Select a finding to inspect the problem, exact location, impact, and recommended fix.</div>
        ) : (
          <div className="detail active">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span className={`sev ${selectedIssue.sev}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedIssue.sev}</span>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedIssue.title}</h2>
              <CopyButton textToCopy={`${selectedIssue.title}\n${selectedIssue.desc || ''}\n${selectedIssue.impact || ''}`} />
            </div>
            <div style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: '12px', color: '#888', marginBottom: '24px' }}>
              {getGithubLink(url, selectedIssue.file, selectedIssue.line) ? (
                <a href={getGithubLink(url, selectedIssue.file, selectedIssue.line) as string} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: 'var(--blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {selectedIssue.file}{selectedIssue.line !== "—" ? `:${selectedIssue.line}` : ""}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"></path></svg>
                </a>
              ) : (
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{selectedIssue.file}{selectedIssue.line !== "—" ? `:${selectedIssue.line}` : ""}</span>
              )}
            </div>
            
            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>Overview</h4>
                {!aiExplanation && (
                  <button 
                    onClick={() => handleExplain(selectedIssue)} 
                    disabled={isExplaining}
                    style={{ background: 'rgba(109, 169, 255, 0.15)', color: 'var(--blue)', border: '1px solid rgba(109, 169, 255, 0.3)', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isExplaining ? 0.7 : 1, transition: '0.2s' }}
                  >
                    {isExplaining ? 'Analyzing...' : '✨ Explain with AI'}
                  </button>
                )}
              </div>

              {aiExplanation && (
                <div style={{ background: 'rgba(58, 134, 255, 0.08)', border: '1px solid rgba(58, 134, 255, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ color: 'var(--blue)', fontWeight: 'bold', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✨ AI Explanation
                  </div>
                  <p style={{ color: '#e0e0e0', marginBottom: '10px', fontSize: '13px' }}><strong style={{color: '#888'}}>Summary:</strong><br />{aiExplanation.summary}</p>
                  <p style={{ color: '#e0e0e0', marginBottom: '10px', fontSize: '13px' }}><strong style={{color: '#888'}}>Attack Scenario:</strong><br />{aiExplanation.attack_scenario}</p>
                  <p style={{ color: '#e0e0e0', margin: 0, fontSize: '13px' }}><strong style={{color: '#888'}}>Verification:</strong><br />{aiExplanation.verification_steps}</p>
                </div>
              )}

              {selectedIssue.desc && !aiExplanation && <p style={{ marginBottom: '8px' }}>{selectedIssue.desc}</p>}
              {selectedIssue.impact && selectedIssue.impact !== selectedIssue.desc && !aiExplanation && <p>{selectedIssue.impact}</p>}
            </div>

            {selectedIssue.tool === 'Dependency Audit' && selectedIssue.pkgName && (
              <div className="detail-section">
                <h4>Affected Package</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                  <div><div style={{color: '#888', marginBottom: '4px'}}>Package</div><div>{selectedIssue.pkgName}</div></div>
                  <div><div style={{color: '#888', marginBottom: '4px'}}>Installed</div><div>{selectedIssue.installedVersion || 'unknown'}</div></div>
                  <div><div style={{color: '#888', marginBottom: '4px'}}>Fixed In</div><div>{selectedIssue.fixedVersion || '—'}</div></div>
                </div>
              </div>
            )}

            {selectedIssue.tool !== 'Dependency Audit' && (realCode || (selectedIssue.code && selectedIssue.code.length > 0)) && (
              <div className="detail-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0 }}>Code Context</h4>
                    {isLoadingCode && <span style={{ fontSize: '11px', color: '#888' }}>Fetching live code...</span>}
                  </div>
                  <CopyButton textToCopy={realCode ? realCode.join('\n') : selectedIssue.code.join('\n')} />
                </div>
                <div className="code">
                  {realCode && realCodeStartLine !== null ? (
                    realCode.map((line, n) => {
                      const currentLineNum = realCodeStartLine + n;
                      const isTarget = currentLineNum.toString() === selectedIssue.line;
                      return (
                        <div key={n} className="code-line" style={isTarget ? { background: 'rgba(255, 140, 0, 0.05)', borderLeft: '2px solid var(--orange)' } : { borderLeft: '2px solid transparent' }}>
                          <span className="ln" style={isTarget ? { color: 'var(--orange)', fontWeight: 'bold' } : {}}>{currentLineNum}</span>
                          {renderHighlightedLine(line, isTarget)}
                        </div>
                      );
                    })
                  ) : (
                    selectedIssue.code.map((line, n) => {
                      const ln = (selectedIssue.line !== "—" && n === 0) ? selectedIssue.line : "";
                      const isTarget = n === 0;
                      return (
                        <div key={n} className="code-line">
                          <span className="ln" style={isTarget ? { color: 'var(--orange)', fontWeight: 'bold' } : {}}>{ln}</span>
                          {renderHighlightedLine(line, isTarget)}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>Recommendations</h4>
                <CopyButton textToCopy={selectedIssue.fix} />
              </div>
              <div style={{ background: 'rgba(0, 230, 118, 0.05)', borderLeft: '3px solid var(--green)', padding: '16px', borderRadius: '0 6px 6px 0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontWeight: 500 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg>
                  {selectedIssue.fix}
                </div>
                {selectedIssue.tool === 'Dependency Audit' && selectedIssue.fixedVersion && selectedIssue.targetFile?.includes('requirements.txt') && (
                  <div style={{ position: 'relative', background: '#080808', padding: '10px 14px', borderRadius: '4px', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: '12px', color: '#ccc', border: '1px solid var(--line)', marginTop: '12px' }}>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      <CopyButton textToCopy={`pip install --upgrade ${selectedIssue.pkgName}==${selectedIssue.fixedVersion}`} />
                    </div>
                    pip install --upgrade {selectedIssue.pkgName}=={selectedIssue.fixedVersion}
                  </div>
                )}
                {selectedIssue.tool === 'Dependency Audit' && selectedIssue.fixedVersion && selectedIssue.targetFile?.includes('package.json') && (
                  <div style={{ position: 'relative', background: '#080808', padding: '10px 14px', borderRadius: '4px', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: '12px', color: '#ccc', border: '1px solid var(--line)', marginTop: '12px' }}>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      <CopyButton textToCopy={`npm install ${selectedIssue.pkgName}@${selectedIssue.fixedVersion}`} />
                    </div>
                    npm install {selectedIssue.pkgName}@{selectedIssue.fixedVersion}
                  </div>
                )}
              </div>
            </div>

            {selectedIssue.references && selectedIssue.references.length > 0 && (
              <div className="detail-section">
                <h4>References</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                  {selectedIssue.references.slice(0, 5).map((ref, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>
                      <a href={ref} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '90%' }}>{ref}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"></path></svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
