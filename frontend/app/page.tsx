"use client";

import { useState, useEffect, useRef } from 'react';
import StartupLoader from './components/StartupLoader';
import ScanForm from './components/ScanForm';
import ScanProgress from './components/ScanProgress';
import MetricCards from './components/MetricCards';
import SecurityScorecard from './components/SecurityScorecard';
import FindingsList from './components/FindingsList';
import IssueDetails from './components/IssueDetails';
import CopyButton from './components/CopyButton';
import { ParsedIssue, ScanMetrics, ScorecardStats, AIExplanation } from './types';

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  return 'http://localhost:8000/api';
};
const API_BASE = getApiBase();


export default function Home() {
  const [isAwake, setIsAwake] = useState(false);
  const [initStage, setInitStage] = useState(0);
  const [url, setUrl] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [progressText, setProgressText] = useState("Initializing repository scanner…");
  const [progressPct, setProgressPct] = useState(0);
  const [logs, setLogs] = useState("");

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const [issues, setIssues] = useState<ParsedIssue[]>([]);
  const [metrics, setMetrics] = useState<ScanMetrics>({ total: 0, high: 0, time: "0s", score: 100 });
  const [filterLevel, setFilterLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);

  const logOutputRef = useRef(null);
  const modalLogOutputRef = useRef(null);

  useEffect(() => {
    if (logOutputRef.current) logOutputRef.current.scrollTop = logOutputRef.current.scrollHeight;
    if (modalLogOutputRef.current) modalLogOutputRef.current.parentElement.scrollTop = modalLogOutputRef.current.parentElement.scrollHeight;
  }, [logs, logModalOpen]);

  useEffect(() => {
    let timers = [
      setTimeout(() => setInitStage(1), 500),
      setTimeout(() => setInitStage(2), 1200),
      setTimeout(() => setInitStage(3), 2000),
      setTimeout(() => setInitStage(4), 2600),
      setTimeout(() => setInitStage(5), 3200)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
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
      } catch (e) { }
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

  const startScan = async (e: any) => {
    e.preventDefault();
    if (!/^https?:\/\/.+/.test(url.trim())) { toast("Enter a valid Git repository URL."); return; }

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

                const newIssues: ParsedIssue[] = [{
                  title: 'Analysis Execution Failed',
                  desc: myScan.message || "The backend worker encountered an unexpected error during analysis.",
                  sev: 'critical',
                  tool: 'Semgrep', // fallback tool to fit type
                  file: 'Repository Scanner',
                  line: '—',
                  impact: 'Security scan could not be completed. Results are unavailable.',
                  fix: 'Review the detailed execution logs to identify the cause of the failure.',
                  code: []
                }];
                setIssues(newIssues);
                setMetrics({ total: 1, high: 1, time: ((Date.now() - start) / 1000).toFixed(1) + "s", score: null });
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
                    if (currentPct < 90) {
                      currentPct += 15;
                      setProgressPct(currentPct);
                    }
                    setProgressText(progressData.progress);
                  }
                }
              } catch (err) { }
            }
          } catch (e) { }
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

  const handleSelectIssue = (index) => {
    setSelectedIssueIndex(index);
    setAiExplanation(null);
  };

  const handleExplain = async (issue: ParsedIssue) => {
    setIsExplaining(true);
    setAiExplanation(null);
    try {
      const codeSnippet = issue.code ? issue.code.join("\n") : "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: issue.title, desc: issue.desc || issue.impact || "", code_snippet: codeSnippet })
      });
      const data = await res.json();
      setAiExplanation(data);
    } catch (e) {
      setAiExplanation({
        summary: "Automated explanation unavailable: Network error.",
        attack_scenario: "Could not reach the AI service. Review the scanner's raw output.",
        verification_steps: "Review the affected code block, implement the suggested fix, and trigger a new scan to verify."
      });
    }
    setIsExplaining(false);
  };

  const getGithubLink = (repoUrl, file, line) => {
    if (!repoUrl || !file || file === 'Unknown') return null;
    let base = repoUrl.trim();
    if (base.endsWith('.git')) base = base.slice(0, -4);
    if (base.endsWith('/')) base = base.slice(0, -1);
    
    let link = `${base}/blob/main/${file}`;
    if (line && line !== '—') link += `#L${line}`;
    return link;
  };

  const processScanResults = (scan, start) => {
    let parsedIssues = [];
    
    const cleanPath = (p) => p ? p.replace(/^\/tmp\/codeguard_repos\/[^/]+\//, '') : 'Unknown';
    
    if (scan.findings) {
      scan.findings.forEach(f => {
        if (f.scanner_type === 'gitleaks') {
          try {
            const data = JSON.parse(f.raw_output);
            if (Array.isArray(data)) {
               data.forEach(leak => {
                 parsedIssues.push({
                   title: `Secret detected: ${leak.RuleID || 'Hardcoded secret'}`,
                   desc: 'Cloud credentials or secrets are embedded directly in source.',
                   sev: 'critical',
                   tool: 'Gitleaks',
                   file: cleanPath(leak.File),
                   line: leak.StartLine ? leak.StartLine.toString() : '—',
                   impact: 'Potential unauthorized access to systems or data.',
                   fix: 'Revoke this secret immediately and rotate the credentials.',
                   code: (leak.Secret || '').split('\n')
                 });
               });
               return;
            }
          } catch(e) {}

          const lines = f.raw_output.split('\n');
          let currentIssue = null;
          
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('Finding:') || trimmed.startsWith('RuleID:')) {
              if (currentIssue) parsedIssues.push(currentIssue);
              currentIssue = {
                title: 'Hardcoded secret detected',
                desc: 'Cloud credentials or secrets are embedded directly in source.',
                sev: 'critical',
                tool: 'Gitleaks',
                file: 'Unknown',
                line: '—',
                impact: 'Potential unauthorized access to systems or data.',
                fix: 'Revoke this secret immediately, rotate credentials, and rewrite git history if necessary.',
                code: []
              };
            }
            if (currentIssue) {
               if (trimmed.startsWith('File:')) currentIssue.file = cleanPath(trimmed.replace('File:', '').trim());
               if (trimmed.startsWith('Line:')) currentIssue.line = trimmed.replace('Line:', '').trim();
               if (trimmed.startsWith('Secret:')) currentIssue.code = [trimmed.replace('Secret:', '').trim()];
               if (trimmed.startsWith('RuleID:')) {
                 const ruleId = trimmed.replace('RuleID:', '').trim();
                 currentIssue.title = `Secret detected: ${ruleId}`;
                 currentIssue.desc = `A ${ruleId} was found embedded directly in the source code.`;
                 currentIssue.impact = `Unauthorized actors can extract this ${ruleId} to gain elevated access to connected services, environments, or sensitive data.`;
                 currentIssue.fix = `Revoke the ${ruleId} immediately in the provider's dashboard, issue a replacement, and purge the leaked credential from git history.`;
               }
            }
          });
          if (currentIssue) parsedIssues.push(currentIssue);

        } else if (f.scanner_type === 'semgrep') {
          try {
            const data = JSON.parse(f.raw_output);
            if (data.results) {
              data.results.forEach(res => {
                let desc = res.extra.message;
                if (desc.length > 80) desc = desc.split('.')[0] + '.';
                parsedIssues.push({
                  title: res.check_id.split('.').pop() || res.check_id,
                  desc: desc,
                  sev: res.extra.severity === 'ERROR' ? 'high' : 'medium',
                  tool: 'Semgrep',
                  file: cleanPath(res.path),
                  line: res.start ? res.start.line : '—',
                  impact: (res.extra.metadata && res.extra.metadata.cwe) ? (Array.isArray(res.extra.metadata.cwe) ? res.extra.metadata.cwe[0] : res.extra.metadata.cwe) : 'Security vulnerability or critical code quality issue.',
                  fix: res.extra.message,
                  code: (res.extra.lines || '').split('\n')
                });
              });
            }
          } catch (e) { }
        } else if (f.scanner_type === 'trivy') {
          try {
            const data = JSON.parse(f.raw_output);
            if (data.Results) {
              data.Results.forEach(res => {
                if (res.Vulnerabilities) {
                  res.Vulnerabilities.forEach(vuln => {
                    let cleanTitle = vuln.Title || 'Vulnerable dependency';
                    cleanTitle = cleanTitle.replace(new RegExp(`^${vuln.PkgName}:\\s*`, 'i'), '').trim();
                    cleanTitle = cleanTitle.replace(new RegExp(`^${vuln.PkgName}:\\s*`, 'i'), '').trim();
                    
                    parsedIssues.push({
                      title: `${vuln.VulnerabilityID} - ${vuln.PkgName}`,
                      desc: cleanTitle,
                      sev: (vuln.Severity || 'medium').toLowerCase(),
                      tool: 'Dependency Audit',
                      file: cleanPath(res.Target),
                      line: '—',
                      impact: vuln.Description || 'Known vulnerable dependency may expose the application.',
                      fix: vuln.FixedVersion ? `Upgrade ${vuln.PkgName} to version ${vuln.FixedVersion}.` : 'Monitor for patches or apply vendor mitigations.',
                      code: [`${vuln.PkgName} (Installed: ${vuln.InstalledVersion || 'unknown'})`],
                      pkgName: vuln.PkgName,
                      installedVersion: vuln.InstalledVersion,
                      fixedVersion: vuln.FixedVersion,
                      references: vuln.References || [],
                      targetFile: res.Target
                    });
                  });
                }
                if (res.Licenses) {
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
          } catch (e) { }
        }
      });
    }

    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    parsedIssues.forEach(f => {
      let s = f.sev;
      if (s === 'warning') s = 'medium';
      if (s === 'error') s = 'high';
      f.sev = s;
      if (counts[s] !== undefined) counts[s]++;
      else counts['info']++;
    });

    const total = parsedIssues.length;
    const highSev = counts.critical + counts.high;
    const score = Math.max(0, 100 - (counts.critical * 10) - (counts.high * 5) - (counts.medium * 2));

    const toolOrder = { 'Gitleaks': 1, 'Semgrep': 2, 'Dependency Audit': 3, 'Licensee': 4 };
    const sevOrder = { 'critical': 1, 'high': 2, 'warning': 3, 'medium': 3, 'low': 4, 'info': 5 };
    
    parsedIssues.sort((a, b) => {
      const toolDiff = (toolOrder[a.tool] || 99) - (toolOrder[b.tool] || 99);
      if (toolDiff !== 0) return toolDiff;
      return (sevOrder[a.sev] || 99) - (sevOrder[b.sev] || 99);
    });

    setIssues(parsedIssues);
    setMetrics({ total, high: highSev, time: ((Date.now() - start) / 1000).toFixed(1) + "s", score });
    setFilterLevel("all");
    setSelectedIssueIndex(null);
  };

  const exportReport = (type) => {
    if (type === 'html') {
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
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
          a.download = `report_${currentTaskId.substring(0, 8)}.docx`;
          a.click();
          URL.revokeObjectURL(a.href);
        })
        .catch(err => {
          toast("Failed to download DOCX report");
        });
    }
  };

  const displayIssues = issues.filter(x => {
    let matchesLevel = false;
    if (filterLevel === 'all') {
      matchesLevel = true;
    } else if (filterLevel === 'license') {
      matchesLevel = x.tool === 'Licensee';
    } else {
      matchesLevel = x.sev === filterLevel;
    }

    const matchesSearch = !searchQuery || 
      x.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      x.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.file.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });
  const selectedIssue = selectedIssueIndex !== null ? issues[selectedIssueIndex] : null;

  const scorecardStats = {
    secrets: issues.filter(i => i.tool === 'Gitleaks').length,
    sast: issues.filter(i => i.tool === 'Semgrep').length,
    deps: issues.filter(i => i.tool === 'Dependency Audit').length,
    license: issues.filter(i => i.tool === 'Licensee').length
  };

  return (
    <>
      <StartupLoader initStage={initStage} isAwake={isAwake} />

      <div className="shell">
        <header className="topbar">
          <div className="brand"><div className="mark">R</div>Repo<span>Lens</span></div>
          <div className="top-actions">
            <button className="btn" onClick={() => exportReport('html')}>Export HTML</button>
            <button className="btn" onClick={() => exportReport('pdf')}>Export PDF</button>
            <button className="btn primary" onClick={() => exportReport('docx')}>Export DOCX</button>
          </div>
        </header>

        <main className="container" style={{ opacity: initStage === 5 ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          <section className="hero">
            <div>
              <div className="eyebrow">Repository intelligence</div>
              <h1>Codebase analysis, without the noise.</h1>
              <p>Scan a Git repository, surface actionable issues, and trace every finding back to its exact source line.</p>
            </div>
          </section>

          <ScanForm url={url} setUrl={setUrl} isScanning={isScanning} handleScan={startScan} />

          {isScanning && (
            <section id="progress" className="progress active">
              <ScanProgress scanStage={progressText} scanProgress={progressPct} scanLogs={logs.split('\n').filter(l => l.trim())} />
            </section>
          )}

          {hasScanned && (
            <>
              <MetricCards metrics={metrics} />

              <SecurityScorecard scorecardStats={scorecardStats} metrics={metrics} issues={issues} />

              <section className="content">
                <FindingsList 
                  issues={issues}
                  displayIssues={displayIssues}
                  filterLevel={filterLevel}
                  setFilterLevel={setFilterLevel}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedIssueIndex={selectedIssueIndex}
                  handleSelectIssue={handleSelectIssue}
                  setLogModalOpen={setLogModalOpen}
                  exportDocx={() => exportReport('docx')}
                  currentTaskId={currentTaskId}
                />

                <IssueDetails 
                  selectedIssue={selectedIssue}
                  handleSelectIssue={handleSelectIssue}
                  aiExplanation={aiExplanation}
                  isExplaining={isExplaining}
                  handleExplain={handleExplain}
                  url={url}
                />
              </section>
            </>
          )}

          <div className="footer"><span>RepoLens · Active Scanning Engine</span><span><span>{currentTaskId ? "SCN-" + currentTaskId.substring(0, 8).toUpperCase() : ""}</span></span></div>
        </main>
      </div>

      <footer style={{ position: 'fixed', bottom: 0, left: 0, padding: '15px 0', borderTop: '1px solid var(--line)', textAlign: 'center', color: 'var(--muted)', fontSize: '12px', background: 'rgba(8,8,8,.94)', backdropFilter: 'blur(14px)', width: '100%', zIndex: 10 }}>
        <div className="container" style={{ padding: 0 }}>
          &copy; 2026 RepoLens AI. All rights reserved.<br />
          Enterprise Codebase Risk Intelligence Platform
        </div>
      </footer>

      {logModalOpen && (
        <div className="modal open" onClick={(e) => { if ((e.target as any).classList.contains('modal')) setLogModalOpen(false); }}>
          <div className="modal-box" style={{ maxWidth: '1000px', width: '95%' }}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2>Execution Logs</h2>
                <CopyButton textToCopy={logs} />
              </div>
              <button className="close" onClick={() => setLogModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body code" style={{ margin: 0, border: 0, borderRadius: 0, maxHeight: '70vh' }}>
              <pre style={{ color: '#a0a0a0', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: '11px', whiteSpace: 'pre-wrap', margin: 0 }}>{logs}</pre>
            </div>
          </div>
        </div>
      )}

      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
