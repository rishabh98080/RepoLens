# RepoLens — Hackathon Improvement Plan

> **IMPORTANT: DO NOT PUSH ANY CHANGES TO GIT/GITHUB YET.**
>
> Work locally only while implementing and testing these improvements. Do not push, open a PR, or publish changes until explicitly instructed by the user.

## Objective

Improve the existing **RepoLens** repository for QuantumHacks without breaking the current working application.

The guiding principle is:

> **Extend, don't rewrite. Preserve all existing working behavior while adding higher-value capabilities around the current scan pipeline.**

RepoLens already contains a useful foundation:

```text
GitHub repository URL
        ↓
Clone repository
        ↓
Gitleaks
        ↓
Semgrep
        ↓
Trivy
        ↓
Persist findings
        ↓
Risk score
        ↓
Dashboard / report
```

Do **not** replace this architecture. Improve it incrementally.

---

# 1. Non-Negotiable Safety Rules

## 1.1 Preserve existing behavior

Before changing anything:

- Run the existing backend.
- Run the existing frontend.
- Perform at least one successful repository scan.
- Verify existing endpoints.
- Record the current response format.
- Record the current database schema.
- Record the current UI behavior.

Never remove an existing endpoint merely because a new implementation is better.

## 1.2 No destructive rewrites

Do not:

- rewrite the backend from scratch
- replace FastAPI
- replace SQLAlchemy
- replace the existing scanner pipeline
- replace the database
- replace the frontend framework
- remove existing scanner integrations
- remove the current risk-score endpoint
- rename public API routes without compatibility support

Prefer:

```text
existing feature
      +
new module
      +
new endpoint
      +
new UI component
```

instead of:

```text
existing feature
      ↓
delete
      ↓
rewrite
```

## 1.3 Git discipline

Create a dedicated branch:

```bash
git checkout -b hackathon/repolens-v2
```

Make small commits:

```text
feat: normalize security findings
feat: improve risk scoring
feat: add remediation explanations
feat: add repository security dashboard
feat: add report improvements
fix: preserve scan compatibility
```

After every meaningful change:

```bash
git status
git diff
```

Never commit secrets, API keys, `.env` files, database credentials, or private repository contents.

---

# 2. Current Product Positioning

Do not position RepoLens as:

> "An AI chatbot for code security."

Position it as:

> **RepoLens is an automated repository security intelligence platform that combines deterministic security scanners with explainable risk analysis and AI-assisted remediation.**

The distinction matters.

The scanners provide evidence.

The risk engine interprets evidence.

The AI explains evidence and suggests fixes.

The AI must NOT invent vulnerabilities.

---

# 3. Target Architecture

Preserve the existing pipeline and evolve it into:

```text
                         RepoLens
                            │
                  Repository URL
                            │
                            ▼
                    Repository Manager
                            │
                            ▼
                       Scan Worker
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    Gitleaks             Semgrep              Trivy
    Secrets              SAST                 CVEs
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  Finding Normalizer
                            │
                            ▼
                  Unified Finding Model
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
           Risk Engine            Evidence Store
                 │                     │
                 └──────────┬──────────┘
                            ▼
                  Security Intelligence
                            │
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
             Dashboard   AI Explain   Report
                            │
                            ▼
                       Remediation
```

The existing scanner commands remain the source of security evidence.

---

# 4. Phase 0 — Baseline Before Modification

Create a local baseline document:

```text
docs/BASELINE.md
```

Record:

- frontend startup command
- backend startup command
- environment variables
- database setup
- existing endpoints
- existing scanner commands
- sample scan
- current risk score behavior
- known errors
- screenshots

Example:

```text
Baseline scan:
Repository:
Scan status:
Scan duration:
Gitleaks findings:
Semgrep findings:
Trivy findings:
Risk score:
```

This becomes the comparison point after improvements.

---

# 5. Phase 1 — Unified Finding Model

This is the highest-value architectural improvement.

Currently scanner output is stored largely as raw output.

Add a normalized finding representation.

Example:

```python
class NormalizedFinding:
    id: str
    scanner: str
    category: str
    severity: str
    title: str
    description: str
    file_path: str | None
    line_start: int | None
    line_end: int | None
    package: str | None
    cve_id: str | None
    evidence: str | None
    remediation: str | None
    confidence: float | None
```

Do not delete raw scanner output.

Store:

```text
raw_output
+
normalized_findings
```

This allows future features without breaking existing reports.

---

# 6. Severity Normalization

Different scanners use different severity systems.

Normalize them:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Mapping should be deterministic and documented.

Example:

```text
Semgrep:
ERROR / WARNING / INFO
        ↓
CRITICAL / HIGH / INFO

Trivy:
CRITICAL / HIGH / MEDIUM / LOW
        ↓
same normalized scale

Gitleaks:
secret detected
        ↓
HIGH or CRITICAL depending on secret type
```

Never let the LLM decide severity when scanner evidence already provides severity.

---

# 7. Phase 2 — Better Risk Engine

## Current weakness

The existing ML risk model uses a very small synthetic training set.

Do not present this as sophisticated machine learning.

For the hackathon, an explainable deterministic risk engine is actually stronger.

## Proposed model

Calculate:

```text
Risk =
  Secret Risk
+ SAST Risk
+ Dependency Risk
+ Exposure Risk
+ Severity Weight
- Mitigation Factors
```

Example weights:

```text
CRITICAL = 25
HIGH     = 15
MEDIUM   = 7
LOW      = 2
INFO     = 0
```

Then cap the score at 100.

Example:

```text
2 critical findings
3 high findings
4 medium findings

2*25 + 3*15 + 4*7 = 123
Normalized = 100
```

Do not remove the existing ML module immediately.

Instead:

```text
risk_engine.py
```

can provide the new scoring algorithm while the old ML implementation remains available for compatibility/testing.

---

# 8. Explainable Risk Score

Do not only show:

```text
Risk Score: 82
```

Show:

```text
Risk Score
82 / 100
HIGH

Contributors

Secrets             +25
Critical SAST       +25
Dependency CVEs     +18
High SAST           +14
Mitigations          +0
                    ----
                     82
```

The UI should allow the user to click each contributor.

This directly improves:

- technical clarity
- explainability
- judge comprehension
- demo quality

---

# 9. Phase 3 — Repository Security Summary

Add a high-level summary immediately after scanning.

Example:

```text
Repository Security Summary

Risk: HIGH

Files scanned: 1,842
Dependencies: 127
Secrets: 2
Critical: 1
High: 6
Medium: 14
Low: 21

Top concern:
Hard-coded cloud credential detected in
backend/config.py:42

Recommended first action:
Rotate credential immediately.
```

The first screen should communicate value in under 10 seconds.

---

# 10. Phase 4 — AI Explanation Layer

Only after deterministic scanning works.

Add an optional AI service:

```text
backend/app/ai/
    __init__.py
    client.py
    prompts.py
    explainer.py
```

The AI receives structured evidence:

```json
{
  "scanner": "semgrep",
  "severity": "HIGH",
  "file": "src/auth.py",
  "line": 84,
  "rule": "sql-injection",
  "message": "...",
  "code_context": "..."
}
```

The AI should return structured JSON:

```json
{
  "summary": "...",
  "why_it_matters": "...",
  "attack_scenario": "...",
  "recommended_fix": "...",
  "verification_steps": "..."
}
```

Never allow free-form AI output to directly modify scan results.

---

# 11. AI Safety Rules

The AI layer must follow:

1. Never invent a vulnerability.
2. Never change scanner severity.
3. Never claim a vulnerability exists without evidence.
4. Explicitly state when evidence is insufficient.
5. Quote only the relevant code context.
6. Provide remediation suggestions separately from scanner findings.
7. Clearly label AI-generated content.

Use wording such as:

> "AI-assisted remediation"

rather than:

> "AI detected this vulnerability"

when the vulnerability actually came from Semgrep/Gitleaks/Trivy.

---

# 12. Phase 5 — Remediation View

For each important finding show:

```text
Finding
───────

SQL Injection

Severity:
HIGH

Location:
src/api/users.py:84

Evidence:
cursor.execute(query)

Why this matters:
User-controlled input may reach a SQL query.

Recommended fix:
Use parameterized queries.

Example:
cursor.execute(
    "SELECT ... WHERE id = ?",
    (user_id,)
)

Verification:
Run the affected test suite and repeat the scan.
```

This should be the strongest UI screen in the product.

---

# 13. Phase 6 — Repository Security Scorecard

Add:

```text
Security Scorecard

Secrets       ████████░░
Dependencies  ██████░░░░
SAST          ███████░░░
Code Risk     █████░░░░░
Licenses      █████████░
```

Avoid meaningless decorative charts.

Every visualization should answer:

> "What should I do next?"

---

# 14. Phase 7 — Scan Progress

The existing backend already exposes scan progress.

Improve the frontend into:

```text
Scanning repository...

✓ Repository cloned
✓ Secrets analysis
✓ Static analysis
● Dependency analysis
○ Risk calculation
○ Report generation
```

Show elapsed time.

Do not fake progress.

Only show stages actually reported by the backend.

---

# 15. Phase 8 — Report Generation

Keep the existing DOCX export.

Improve it with:

```text
Executive Summary
Risk Score
Severity Distribution
Top 10 Findings
Secrets
SAST
Dependencies
AI-assisted Remediation
Recommended Priority Actions
Scanner Metadata
Scan Timestamp
Repository Commit / Branch if available
```

Add JSON export only if it is low-risk to implement.

---

# 16. Phase 9 — Repository Comparison

If time permits, add:

```text
Compare scans
```

Example:

```text
Previous scan       Current scan

Risk: 74            Risk: 41

Critical: 3         Critical: 1
High: 8             High: 4
Medium: 12          Medium: 9
```

Then:

```text
Improved by 33 points

✓ 2 critical issues resolved
✓ 4 high issues resolved
⚠ 1 new dependency vulnerability
```

This creates a much stronger SaaS/product story.

---

# 17. Phase 10 — Security Trend

If multiple scans exist, show:

```text
Risk Score

100 ┤
 80 ┤ ●
 60 ┤   ●
 40 ┤      ●
 20 ┤          ●
    └────────────────
      Scan 1  2  3  4
```

This turns RepoLens from:

> scanner

into:

> continuous security intelligence.

---

# 18. What NOT to Build Before Submission

Do not spend hackathon time on:

- Kubernetes
- microservices
- custom LLM training
- building a custom vulnerability scanner
- blockchain
- complex knowledge graphs
- a huge ML dataset
- mobile application
- elaborate authentication
- billing
- multi-region deployment
- rewriting the frontend
- replacing FastAPI
- replacing SQLAlchemy
- replacing the database

These increase risk without improving the demo proportionally.

---

# 19. Priority Order

## P0 — Must have

1. Baseline existing application.
2. Preserve current scanner pipeline.
3. Normalize findings.
4. Improve risk calculation.
5. Build strong dashboard.
6. Show actionable finding details.
7. Ensure scan works reliably.
8. Create a polished demo repository.

## P1 — High value

9. AI-assisted explanations.
10. AI-assisted remediation.
11. Better DOCX report.
12. Scan progress UI.
13. Severity filtering/search.

## P2 — Only if time remains

14. Scan comparison.
15. Security trends.
16. JSON export.
17. Architecture visualization.
18. Dependency graph.

---

# 20. Recommended Final Demo

The demo should be approximately 3 minutes.

## 0:00–0:20 — Problem

Show:

> Modern repositories can contain vulnerable dependencies, insecure code, and leaked secrets.

## 0:20–0:35 — Input

Paste a GitHub repository URL.

## 0:35–1:10 — Scan

Show the real scanner pipeline:

```text
Gitleaks
Semgrep
Trivy
```

## 1:10–1:40 — Result

Show:

```text
Risk: 82 HIGH

2 Secrets
1 Critical
6 High
14 Medium
```

## 1:40–2:10 — Investigation

Open a critical finding.

Show:

- file
- line
- evidence
- explanation
- remediation

## 2:10–2:35 — AI

Click:

> Explain this vulnerability

Then:

> Suggest a safe remediation

Make clear that AI explains real scanner evidence.

## 2:35–2:50 — Report

Generate the security report.

## 2:50–3:00 — Architecture

Show:

```text
Repository
 ↓
Scanners
 ↓
Normalized Evidence
 ↓
Risk Engine
 ↓
AI Explanation
 ↓
Actionable Security Report
```

End with:

> **RepoLens — turn repository security scans into decisions developers can act on.**

---

# 21. Testing Strategy

After every feature:

```bash
# Backend
pytest

# Frontend
npm run build
```

If the repository does not yet have sufficient tests, add tests around:

- finding normalization
- severity mapping
- risk calculation
- API scan initiation
- scan retrieval
- report generation

At minimum create deterministic unit tests for the risk engine.

Example:

```text
0 findings → low risk
1 critical → high risk
multiple critical → critical risk
secrets → significant penalty
```

---

# 22. Backward Compatibility Checklist

Before merging:

- [ ] Existing `/health` works.
- [ ] Existing `/scan` works.
- [ ] Existing `/scans` works.
- [ ] Existing `/scan/{task_id}` works.
- [ ] Existing progress endpoint works.
- [ ] Existing DOCX export works.
- [ ] Existing database records remain readable.
- [ ] Existing frontend loads.
- [ ] Existing scan workflow completes.
- [ ] Existing scanner integrations still run.
- [ ] Existing environment variables still work.
- [ ] No secrets committed.

---

# 23. Final Product Principle

The final RepoLens should communicate this:

```text
                     REPOLENS

       Don't just find vulnerabilities.

             Understand them.
                  ↓
             Prioritize them.
                  ↓
             Fix them.
                  ↓
             Verify them.
```

The core differentiation should be:

```text
Traditional scanner
        ↓
Raw findings

RepoLens
        ↓
Evidence
        ↓
Risk
        ↓
Explanation
        ↓
Remediation
        ↓
Verification
```

That is the product direction.

---

# 24. Golden Rule

Before implementing any feature, ask:

> **Does this make RepoLens more useful to a developer who has just discovered a security problem?**

If the answer is no, defer it.

Do not sacrifice stability for feature count.

A smaller, reliable, polished RepoLens is substantially stronger for a hackathon than a large application with broken scanning, fake AI, or unfinished features.


---

# FINAL — DO NOT PUSH YET

> **IMPORTANT: DO NOT PUSH ANY CHANGES TO GIT/GITHUB YET.**
>
> At the end of this improvement process:
>
> - Keep all changes local.
> - Do not run `git push`.
> - Do not open a pull request.
> - Do not publish or deploy changes automatically.
> - Do not overwrite the remote repository.
> - Wait for explicit user approval before pushing anything to GitHub.
>
> **Implementation and testing first. Push later only when explicitly authorized.**
