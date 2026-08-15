"use client";

import { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';


export default function Home() {
  const [isAwake, setIsAwake] = useState(false);
  const [url, setUrl] = useState("https://github.com/example/project");
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [progressText, setProgressText] = useState("Initializing repository scanner…");
  const [progressPct, setProgressPct] = useState(0);
  const [logs, setLogs] = useState("");
  
  const [currentTaskId, setCurrentTaskId] = useState(null);
  
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, high: 0, time: "0s", score: 100 });
  const [filterLevel, setFilterLevel] = useState("all");
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(null);
  
  const [toastMsg, setToastMsg] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  
  const logOutputRef = useRef(null);
  const modalLogOutputRef = useRef(null);
  
  useEffect(() => {
    if (logOutputRef.current) logOutputRef.current.scrollTop = logOutputRef.current.scrollHeight;
    if (modalLogOutputRef.current) modalLogOutputRef.current.parentElement.scrollTop = modalLogOutputRef.current.parentElement.scrollHeight;
  }, [logs, logModalOpen]);

  useEffect(() => {
    let timeout;
    if (toastMsg) {
      timeout = setTimeout(() => setToastMsg(""), 3000);
    }
    return () => clearTimeout(timeout);
  }, [toastMsg]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          setIsAwake(true);
          return true;
        }
      } catch(e) {}
      return false;
    };

    checkHealth().then(awake => {
      if (!awake) {
        const interval = setInterval(async () => {
          if (await checkHealth()) {
            clearInterval(interval);
          }
        }, 4000);
      }
    });
  }, []);

  const toast = (msg) => setToastMsg(msg);

  const startScan = async (e) => {
    e.preventDefault();
    if(!/^https?:\/\/.+/.test(url.trim())){ toast("Enter a valid Git repository URL."); return; }
    
    setIsScanning(true);
    setHasScanned(false);
    setProgressText("Initializing scanner...");
    setProgressPct(0);
    setLogs(`[${new Date().toLocaleTimeString()}] Starting scan for ${url}...\n`);
    
    const start = Date.now();
    let pollInterval = null;
    
    try {
      const response = await fetch(`${API_BASE}/scan`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ repo_url: url.trim() })
      });
      const data = await response.json();
      
      if (data.task_id) {
         setCurrentTaskId(data.task_id);
         let currentPct = 10;
         setProgressPct(currentPct);
         
         pollInterval = setInterval(async () => {
             try {
                 const scanRes = await fetch(`${API_BASE}/scan/${data.task_id}`);
                 const myScan = await scanRes.json();
                 
                 if (myScan && myScan.status !== 'running') {
                     clearInterval(pollInterval);
                     
                     if (myScan.status === "error") {
                         setProgressText("Analysis failed");
                         setProgressPct(100);
                         toast("Repository analysis failed: Check logs.");
                         setLogs(prev => prev + "\n--- SCAN ERROR ---\n" + (myScan.message || "Unknown error occurred."));
                         
                         const newIssues = [{
                             title: 'Analysis Execution Failed',
                             desc: myScan.message || "The backend worker encountered an unexpected error during analysis.",
                             sev: 'critical',
                             tool: 'System Pipeline',
                             file: 'Repository Scanner',
                             line: '—',
                             impact: 'Security scan could not be completed. Results are unavailable.',
                             fix: 'Review the detailed execution logs to identify the cause of the failure.',
                             code: []
                         }];
                         setIssues(newIssues);
                         setMetrics({ total: 1, high: 1, time: ((Date.now()-start)/1000).toFixed(1)+"s", score: null });
                         setHasScanned(true);
                         setIsScanning(false);
                     } else {
                         setProgressPct(100);
                         setProgressText("Analysis complete");
                         toast("Repository analysis completed.");
                         
                         let finalLogs = "\n--- FINAL SCAN FINDINGS ---\n\n";
                         if (myScan.findings && myScan.findings.length > 0) {
                             myScan.findings.forEach(f => {
                                 finalLogs += `[${f.scanner_type.toUpperCase()}]\n${f.raw_output || 'No output'}\n\n`;
                             });
                         } else {
                             finalLogs += "No logs or findings were returned.";
                         }
                         setLogs(prev => prev + finalLogs);
                         processScanResults(myScan, start);
                         setHasScanned(true);
                         setIsScanning(false);
                     }
                 } else {
                     try {
                         const progressRes = await fetch(`${API_BASE}/scan/${data.task_id}/progress`);
                         if (progressRes.ok) {
                             const progressData = await progressRes.json();
                             if (progressData.progress) {
                                 setLogs(prev => {
                                     if (!prev.includes(progressData.progress)) {
                                         return prev + `[${new Date().toLocaleTimeString()}] ${progressData.progress}\n`;
                                     }
                                     return prev;
                                 });
                                 if(currentPct < 90) {
                                   currentPct += 15;
                                   setProgressPct(currentPct);
                                 }
                                 setProgressText(progressData.progress);
                             }
                         }
                     } catch(err) {}
                 }
             } catch(e) {}
         }, 1500);
      } else {
         throw new Error("Failed to start scan");
      }
    } catch (err) {
      setProgressText("Error analyzing repository");
      setIsScanning(false);
      toast("Server error.");
    }
  };

  const processScanResults = (scan, start) => {
    let parsedIssues = [];
    if (scan.findings) {
        scan.findings.forEach(f => {
            if (f.scanner_type === 'gitleaks') {
                const lines = f.raw_output.split('\n');
                lines.forEach(line => {
                    if (line.includes('File:') || line.includes('Secret:')) {
                        parsedIssues.push({
                            title: 'Hardcoded secret detected',
                            desc: 'Cloud credentials or secrets are embedded directly in source.',
                            sev: 'critical',
                            tool: 'Gitleaks',
                            file: line.trim().replace('File: ', '').replace('Secret: ', ''),
                            line: '—',
                            impact: 'Potential unauthorized access.',
                            fix: 'Revoke this secret immediately and rotate the credentials.',
                            code: [line.trim()]
                        });
                    }
                });
            } else if (f.scanner_type === 'semgrep') {
                try {
                    const data = JSON.parse(f.raw_output);
                    if (data.results) {
                        data.results.forEach(res => {
                            parsedIssues.push({
                                title: res.check_id,
                                desc: res.extra.message.split('.')[0],
                                sev: res.extra.severity === 'ERROR' ? 'high' : 'medium',
                                tool: 'Semgrep',
                                file: res.path,
                                line: res.start ? res.start.line : '—',
                                impact: 'Security or code quality issue.',
                                fix: res.extra.message,
                                code: [res.extra.lines || '']
                            });
                        });
                    }
                } catch (e) {}
            } else if (f.scanner_type === 'trivy') {
                try {
                    const data = JSON.parse(f.raw_output);
                    if (data.Results) {
                        data.Results.forEach(res => {
                            if(res.Vulnerabilities) {
                                res.Vulnerabilities.forEach(vuln => {
                                    parsedIssues.push({
                                        title: `${vuln.VulnerabilityID} in ${vuln.PkgName}`,
                                        desc: vuln.Title || 'Vulnerable dependency identified.',
                                        sev: (vuln.Severity || 'medium').toLowerCase(),
                                        tool: 'Dependency Audit',
                                        file: res.Target,
                                        line: '—',
                                        impact: 'Known vulnerable dependency may expose the application.',
                                        fix: vuln.FixedVersion ? `Upgrade to version ${vuln.FixedVersion}.` : (vuln.Description || 'Review dependency.'),
                                        code: [`${vuln.PkgName}: ${vuln.InstalledVersion || ''}`]
                                    });
                                });
                            }
                            if(res.Licenses) {
                                res.Licenses.forEach(lic => {
                                    const restricted = ['GPL', 'AGPL', 'SSPL'];
                                    const isRestricted = restricted.some(r => lic.Name.includes(r));
                                    parsedIssues.push({
                                        title: `License: ${lic.Name} in ${lic.PkgName}`,
                                        desc: 'License compliance check.',
                                        sev: isRestricted ? 'medium' : 'info',
                                        tool: 'Licensee',
                                        file: res.Target,
                                        line: '—',
                                        impact: 'Distribution and reuse terms.',
                                        fix: isRestricted ? `WARNING: Restrictive license (${lic.Name}). Ensure compliance.` : 'Informational finding.',
                                        code: [`License: ${lic.Name}`]
                                    });
                                });
                            }
                        });
                    }
                } catch(e){}
            }
        });
    }

    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    parsedIssues.forEach(f => {
        let s = f.sev;
        if(s === 'warning') s = 'medium';
        if(s === 'error') s = 'high';
        f.sev = s; 
        if(counts[s] !== undefined) counts[s]++;
        else counts['info']++;
    });

    const total = parsedIssues.length;
    const highSev = counts.critical + counts.high;
    const score = Math.max(0, 100 - (counts.critical * 10) - (counts.high * 5) - (counts.medium * 2));

    setIssues(parsedIssues);
    setMetrics({ total, high: highSev, time: ((Date.now()-start)/1000).toFixed(1)+"s", score });
    setFilterLevel("all");
    setSelectedIssueIndex(null);
  };

  const exportReport = (type) => {
    if (type === 'html') {
      const blob = new Blob([document.documentElement.outerHTML], {type: 'text/html'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'repolens-report.html';
      a.click();
      URL.revokeObjectURL(a.href);
      toast("HTML report exported.");
    } else if (type === 'pdf') {
      window.print();
    } else if (type === 'docx') {
      if (!currentTaskId) {
          toast("No scan results to export.");
          return;
      }
      toast("Downloading DOCX report...");
      fetch(`${API_BASE}/scan/${currentTaskId}/export/docx`)
        .then(res => {
          if (!res.ok) throw new Error("Export failed");
          return res.blob();
        })
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `report_${currentTaskId.substring(0,8)}.docx`;
          a.click();
          URL.revokeObjectURL(a.href);
        })
        .catch(err => {
          toast("Failed to download DOCX report");
        });
    }
  };

  const displayIssues = issues.filter(x => filterLevel === 'all' || x.sev === filterLevel || (filterLevel==='medium' && x.sev==='warning'));
  const selectedIssue = selectedIssueIndex !== null ? issues[selectedIssueIndex] : null;

  return (
    <>
      <div id="startupLoader" className={`startup-loader ${isAwake ? 'hidden' : ''}`}>
        <div className="loader-content">
          <div className="spinner"></div>
          <h2>Waking up backend...</h2>
          <p>Please wait. The free tier instance takes ~1 minute to start from sleep.</p>
        </div>
      </div>

      <div className="shell">
        <header className="topbar">
          <div className="brand"><div className="mark">R</div>Repo<span>Lens</span></div>
          <div className="top-actions">
            <button className="btn" onClick={() => exportReport('html')}>Export HTML</button>
            <button className="btn" onClick={() => exportReport('pdf')}>Export PDF</button>
            <button className="btn primary" onClick={() => exportReport('docx')}>Export DOCX</button>
          </div>
        </header>

        <main className="container">
          <section className="hero">
            <div>
              <div className="eyebrow">Repository intelligence</div>
              <h1>Codebase analysis, without the noise.</h1>
              <p>Scan a Git repository, surface actionable issues, and trace every finding back to its exact source line.</p>
            </div>
          </section>

          <form className="repo-form" onSubmit={startScan}>
            <input type="url" placeholder="https://github.com/owner/repository" value={url} onChange={e => setUrl(e.target.value)} />
            <button className="btn primary" type="submit" disabled={isScanning}>Analyze repository</button>
          </form>

          <section id="progress" className={`progress ${isScanning || hasScanned ? 'active' : ''}`} style={{ display: isScanning || (hasScanned && currentTaskId) ? 'block' : 'none' }}>
            <div className="progress-head"><span>{progressText}</span><strong>{progressPct}%</strong></div>
            <div className="track">
              <i style={{ width: `${progressPct}%`, animation: isScanning ? 'scan 1.4s infinite ease-in-out' : 'none', background: (hasScanned && !metrics.score && metrics.score !== 0) ? 'var(--red)' : '' }}></i>
            </div>
            <div className="chain"><b>Clone</b><span>→</span><b>Structure</b><span>→</span><b>Static analysis</b><span>→</span><b>Security</b><span>→</span><b>Report</b></div>
            
            <div style={{marginTop:'20px', background:'#0c0c0c', border:'1px solid var(--line)', borderRadius:'8px', padding:'12px', fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize:'11px', color:'#a0a0a0', height:'160px', overflowY:'auto'}} ref={logOutputRef}>
              <div style={{whiteSpace:'pre-wrap'}}>{logs}</div>
            </div>
          </section>

          {hasScanned && (
            <>
              <section className="grid">
                <div className="card"><div className="metric-label">Issues found</div><div className="metric red">{metrics.total}</div></div>
                <div className="card"><div className="metric-label">High severity</div><div className="metric orange">{metrics.high}</div></div>
                <div className="card"><div className="metric-label">Scan time</div><div className="metric">{metrics.time}</div></div>
                <div className="card"><div className="metric-label">Health score</div>
                  {metrics.score !== null ? 
                    <div className={`metric ${metrics.score > 80 ? 'green' : metrics.score > 60 ? 'orange' : 'red'}`}>{metrics.score}<small>/100</small></div> :
                    <div className="metric red">N/A</div>
                  }
                </div>
              </section>

              <section className="content">
                <div className="panel" style={{maxHeight: '800px', display: 'flex', flexDirection: 'column'}}>
                  <div className="panel-head">
                    <div className="panel-title">Findings</div>
                    <div className="filters">
                      <button className={`filter ${filterLevel === 'all' ? 'active' : ''}`} onClick={() => { setFilterLevel('all'); setSelectedIssueIndex(null); }}>All</button>
                      <button className={`filter ${filterLevel === 'high' ? 'active' : ''}`} onClick={() => { setFilterLevel('high'); setSelectedIssueIndex(null); }}>High</button>
                      <button className={`filter ${filterLevel === 'medium' ? 'active' : ''}`} onClick={() => { setFilterLevel('medium'); setSelectedIssueIndex(null); }}>Medium</button>
                      <button className="filter" style={{marginLeft: '10px', borderColor: 'var(--line)'}} onClick={() => setLogModalOpen(true)}>View Logs</button>
                    </div>
                  </div>

                  <div id="findingsList" style={{overflowY: 'auto', flex: 1}}>
                    {displayIssues.map((x, i) => {
                      const origIndex = issues.indexOf(x);
                      let displaySev = x.sev;
                      if(displaySev === 'warning') displaySev = 'medium';
                      return (
                        <div key={i} className={`finding ${selectedIssueIndex === origIndex ? 'selected' : ''}`} onClick={() => setSelectedIssueIndex(origIndex)}>
                          <div className={`sev ${displaySev}`}>{displaySev}</div>
                          <div>
                            <h3>{x.title}</h3>
                            <p>{x.desc}</p>
                            <div className="path">{x.file}{x.line !== "—" && <> : <span>{x.line}</span></>}</div>
                          </div>
                          <div className="chev">›</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="legend"><span><i className="dot dred"></i>High risk</span><span><i className="dot dyellow"></i>Needs attention</span><span><i className="dot dgreen"></i>Improvement</span></div>
                </div>

                <aside className="panel" style={{maxHeight: '800px', display: 'flex', flexDirection: 'column'}}>
                  <div className="panel-head"><div className="panel-title">Issue details</div><button className="filter" onClick={() => setSelectedIssueIndex(null)}>Clear</button></div>
                  <div className="details" style={{padding: '19px', overflowY: 'auto', flex: 1}}>
                    {!selectedIssue ? (
                      <div className="detail-empty">Select a finding to inspect the problem, exact location, impact, and recommended fix.</div>
                    ) : (
                      <div className="detail active">
                        <h2>{selectedIssue.title}</h2>
                        <span className="tag">{selectedIssue.file}{selectedIssue.line !== "—" ? ` · line ${selectedIssue.line}` : ""}</span>
                        <div className="detail-section"><h4>Issue</h4><p>{selectedIssue.impact}<br/>{selectedIssue.desc}</p></div>
                        <div className="detail-section"><h4>Scanner</h4><p>{selectedIssue.tool}</p></div>
                        {selectedIssue.code && selectedIssue.code.length > 0 && (
                        <div className="detail-section"><h4>Location</h4>
                          <div className="code">
                            {selectedIssue.code.map((line, n) => {
                              const ln = (selectedIssue.line !== "—" && n === 0) ? selectedIssue.line : "";
                              return <div key={n} className="code-line"><span className="ln">{ln}</span><span className={`src ${n===0?'err':''}`}>{line}</span></div>;
                            })}
                          </div>
                        </div>
                        )}
                        <div className="detail-section"><h4>Fix</h4><p className="fix">{selectedIssue.fix}</p></div>
                      </div>
                    )}
                  </div>
                </aside>
              </section>
            </>
          )}

          <div className="footer"><span>RepoLens · Local analysis UI prototype</span><span><span>{currentTaskId ? "SCN-" + currentTaskId.substring(0,8).toUpperCase() : ""}</span></span></div>
        </main>
      </div>

      <footer style={{position: 'fixed', bottom: 0, left: 0, padding: '15px 0', borderTop: '1px solid var(--line)', textAlign: 'center', color: 'var(--muted)', fontSize: '12px', background: 'rgba(8,8,8,.94)', backdropFilter: 'blur(14px)', width: '100%', zIndex: 10}}>
        <div className="container" style={{padding:0}}>
          &copy; 2026 RepoLens AI. All rights reserved.<br/>
          Enterprise Codebase Risk Intelligence Platform
        </div>
      </footer>

      {logModalOpen && (
        <div className="modal open" onClick={(e) => { if(e.target.className.includes('modal open')) setLogModalOpen(false); }}>
          <div className="modal-box">
            <div className="modal-head"><h2>Execution Logs</h2><button className="close" onClick={() => setLogModalOpen(false)}>×</button></div>
            <div className="modal-body" style={{background:'#0a0c0c', border:'1px solid var(--line)', borderRadius:'5px', margin: '20px'}} ref={modalLogOutputRef}>
              <pre style={{color:'#a0a0a0', fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize:'11px', whiteSpace:'pre-wrap', margin:0}}>{logs}</pre>
            </div>
          </div>
        </div>
      )}

      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
