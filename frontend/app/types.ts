export interface ParsedIssue {
  title: string;
  desc: string;
  sev: 'critical' | 'high' | 'medium' | 'low' | 'info';
  tool: 'Semgrep' | 'Gitleaks' | 'Dependency Audit' | 'Licensee';
  file: string;
  line: string;
  impact?: string;
  fix?: string;
  code?: string[];
  pkgName?: string;
  installedVersion?: string;
  fixedVersion?: string;
  references?: string[];
  targetFile?: string;
}

export interface AIExplanation {
  summary: string;
  attack_scenario: string;
  verification_steps: string;
}

export interface ScanMetrics {
  total: number;
  high: number;
  time: string;
  score: number | null;
}

export interface ScorecardStats {
  secrets: number;
  sast: number;
  deps: number;
  license: number;
}
