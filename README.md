**Yes. This is significantly better.** I'd turn it into a **Codebase Risk Intelligence Platform** rather than just a security scanner.

The core idea:

> **Connect a Git repository → analyze its code, dependencies, configuration, secrets, licenses, and project documents → identify security, compliance, and legal risks → explain each finding with evidence and remediation.**

It gives you a real AI/ML component without making the project "yet another chatbot."

# Project 2 — CodeGuard / RepoSentinel

### What it does

A developer connects:

```text
GitHub repository
       ↓
Repository ingestion
       ↓
┌───────────────────────────────┐
│       Analysis Engine         │
├───────────────────────────────┤
│ Code Security                 │
│ Dependency Security           │
│ Secrets                        │
│ Configuration                 │
│ License / Legal               │
│ Architecture                  │
│ AI Risk Analysis              │
└───────────────────────────────┘
       ↓
Risk Engine
       ↓
Security / Legal Report
```

---

# 1. Security Analysis

Don't try to build your own vulnerability scanner.

Use established open-source scanners and **build the intelligence layer around them**.

### SAST

**Semgrep**

[Semgrep GitHub](https://github.com/semgrep/semgrep?utm_source=chatgpt.com)

Find things like:

```python
cursor.execute("SELECT * FROM users WHERE id=" + user_id)
```

→ potential SQL injection.

---

### Dependency vulnerabilities

**OSV-Scanner**

[OSV-Scanner GitHub](https://github.com/google/osv-scanner?utm_source=chatgpt.com)

Analyze:

```text
package.json
pom.xml
requirements.txt
go.mod
```

and identify vulnerable dependencies.

Example:

```text
Spring Framework 6.x
        ↓
CVE-XXXX
        ↓
Severity: HIGH
        ↓
Upgrade to 6.x.x
```

---

### Secrets

**Gitleaks**

[Gitleaks GitHub](https://github.com/gitleaks/gitleaks?utm_source=chatgpt.com)

Detect:

```text
AWS keys
API keys
JWT secrets
database passwords
private keys
```

This is particularly valuable because you've personally encountered secret-scanning issues with GitHub before.

---

# 2. Legal / License Analysis

This is where the project gets **much more unique**.

Analyze dependencies:

```text
Your project
      ↓
Dependencies
      ↓
License detection
      ↓
Compatibility analysis
```

For example:

```text
Your Project
│
├── React        MIT
├── Library A    Apache-2.0
├── Library B    GPL-3.0 ⚠️
└── Library C    AGPL-3.0 🚨
```

Then produce:

> **Potential license compliance issue:** Library B is GPL-3.0. Review whether its usage and distribution model is compatible with your project's licensing requirements.

### Tools

**ScanCode Toolkit**

[ScanCode Toolkit GitHub](https://github.com/aboutcode-org/scancode-toolkit?utm_source=chatgpt.com)

Can identify:

* licenses
* copyrights
* package metadata
* notices

You could combine it with **OSV** for vulnerabilities.

---

# 3. Code Architecture Analysis

This is where we can build our own ML/graph component.

Parse the repository.

```text
Repository
    ↓
AST
    ↓
Symbols
    ↓
Imports
    ↓
Function calls
    ↓
Dependency graph
```

Build:

```text
                AuthService
               /          \
              ↓            ↓
       UserRepository   TokenService
              ↓
          PostgreSQL
```

Then calculate:

* cyclomatic complexity
* coupling
* dependency depth
* circular dependencies
* highly privileged modules
* exposed endpoints
* dangerous data flows

---

# 4. AI Risk Analysis

Now bring in the **local LLM**.

No OpenAI/Gemini/Claude.

Use:

```text
Ollama
   ↓
Qwen / Llama / Mistral
```

The LLM doesn't scan the entire repository blindly.

Instead:

```text
Static Analysis
      ↓
Findings
      ↓
Relevant Code
      ↓
Local LLM
      ↓
Explanation
```

Example:

### Scanner

```text
Finding:
SQL injection

File:
UserRepository.java

Line:
84

Rule:
SQL concatenation
```

### AI layer

Produces:

> User-controlled input is concatenated directly into a SQL statement. An attacker may manipulate the `userId` parameter to alter the query. Use parameterized queries or Spring Data repository methods.

That's much more useful than simply dumping Semgrep output.

---

# 5. Risk Scoring

This can become your actual **ML component**.

Don't just say:

```text
HIGH
```

Create a risk model.

Example:

```text
Risk =
Severity
× Exploitability
× Exposure
× Business Impact
```

Features:

```text
CVSS
Internet exposure
Authentication required
Data sensitivity
Dependency age
Code complexity
Historical vulnerabilities
```

Then:

```text
Risk Score: 91/100

CRITICAL
```

---

# 6. Machine Learning

Here's where we make it genuinely ML rather than "LLM + scanners."

Build a dataset from:

* CVE/OSV data
* vulnerable package versions
* known vulnerability metadata
* code metrics

Features:

```text
dependency_age
cvss_score
severity
package_popularity
dependency_depth
code_complexity
exposure
```

Train:

```text
Random Forest
XGBoost
Logistic Regression
```

to predict:

> **Probability that a finding represents a high-priority risk.**

Then compare:

```text
Rule-based score
        vs
ML risk score
```

That gives you a legitimate machine-learning component.

---

# 7. Security Knowledge Graph

This is another place where the graph becomes useful.

```text
CVE
 │
 ├── affects → Spring Framework
 │
 ├── severity → HIGH
 │
 └── fixed_in → 6.x.x

Your Project
 │
 └── depends_on → Spring Framework
```

Now:

```text
Project
 ↓
Dependency
 ↓
Vulnerability
 ↓
Affected component
 ↓
Fix
```

You can query:

> "Which vulnerabilities affect internet-facing components?"

or:

> "What would be impacted if we upgrade this dependency?"

Use:

**Neo4j Community**

[Neo4j GitHub](https://github.com/neo4j/neo4j?utm_source=chatgpt.com)

---

# 8. Legal Risk

This needs careful wording.

Don't claim:

> ❌ "This project determines whether your software is legally compliant."

Instead:

> ✅ "This system identifies potential licensing and compliance risks for developer review."

That's both technically and legally more responsible.

It can flag:

```text
GPL dependency
AGPL dependency
Unknown license
Missing attribution
License conflict
Copyright notice
Potentially incompatible dependency
```

---

# 9. Dashboard

The frontend becomes quite impressive.

```text
┌─────────────────────────────────────────────┐
│ Repository Security                         │
├─────────────────────────────────────────────┤
│                                             │
│ Security Score       72 / 100               │
│ Legal Risk           Medium                 │
│ Dependencies         143                    │
│ Vulnerabilities      7                     │
│ Secrets              2 🔴                   │
│ License Issues       3 🟡                   │
│                                             │
├─────────────────────────────────────────────┤
│ Critical Findings                           │
│                                             │
│ 🔴 Hardcoded AWS Key                        │
│    backend/config.py:42                     │
│                                             │
│ 🔴 SQL Injection                            │
│    UserRepository.java:84                   │
│                                             │
│ 🟠 Vulnerable dependency                    │
│    spring-core 6.x.x                       │
│                                             │
│ 🟡 GPL-3.0 dependency                       │
│    library-x                                │
└─────────────────────────────────────────────┘
```

Click a finding:

```text
Finding
   ↓
Evidence
   ↓
Affected code
   ↓
Why it matters
   ↓
Risk score
   ↓
Suggested remediation
   ↓
Relevant CVE/license
```

---

# Stack I'd use

## Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy
PostgreSQL
Redis
```

## Security engines

```text
Semgrep
OSV-Scanner
Gitleaks
Trivy
```

## Legal

```text
ScanCode Toolkit
SPDX
CycloneDX
```

## Code analysis

```text
Tree-sitter
NetworkX
```

## Knowledge graph

```text
Neo4j
```

## ML

```text
Pandas
NumPy
Scikit-learn
XGBoost
```

## Local AI

```text
Ollama
Qwen / Llama / Mistral
```

## Observability

```text
OpenTelemetry
Prometheus
Grafana
```

## Frontend

```text
React
TypeScript
shadcn/ui
Recharts
```

## Infrastructure

```text
Docker
Docker Compose
GitHub Actions
```

---

# The architecture

```text
                         GitHub Repo
                              │
                              ▼
                     Repository Ingestion
                              │
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
        Code Analysis     Dependencies       Git History
        Tree-sitter       OSV/Trivy          Commits
            │                 │                 │
            ↓                 ↓                 ↓
         Semgrep          Vulnerabilities    Risk Signals
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ↓
                       Risk Intelligence
                              │
                ┌─────────────┼──────────────┐
                ↓             ↓              ↓
             Security       Legal           ML
                │             │              │
                └─────────────┼──────────────┘
                              ↓
                       Knowledge Graph
                              ↓
                         Local LLM
                              ↓
                     Explanation/Remediation
                              ↓
                         FastAPI
                              ↓
                         Dashboard
```

## Why I like this much more

Your three projects now tell a coherent story:

### Project 1

**Collaborative Coding Platform**

> Can he build complex software?

### Project 2

**Codebase Security & Risk Intelligence**

> Can he understand and apply AI/ML to a difficult engineering problem?

### Project 3

**Data Analytics / Intelligence**

> Can he work with data, statistics, ML and databases?

And Project #2 has a **very strong demo**:

> **Paste a GitHub URL → wait 30 seconds → receive a security + dependency + license + architecture risk report, with evidence and AI-generated explanations.**

That's something a recruiter can understand immediately, while the implementation underneath is deep enough to give you excellent technical interview material.
# RepoLens
