import os
import subprocess
from pathlib import Path
import shutil
import asyncio
from datetime import datetime
from sqlalchemy.future import select
from .database import AsyncSessionLocal
from .models import Repository, ScanResult, Finding

REPOS_DIR = Path("/tmp/codeguard_repos")
REPOS_DIR.mkdir(exist_ok=True)

ACTIVE_SCANS_PROGRESS = {}

def run_blocking_scan(repo_url: str, task_id: str):
    ACTIVE_SCANS_PROGRESS[task_id] = "Initializing scan..."
    print(f"Starting scan for {repo_url} (Task ID: {task_id})")
    repo_name = repo_url.split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
    
    target_dir = REPOS_DIR / f"{task_id}_{repo_name}"
    
    try:
        ACTIVE_SCANS_PROGRESS[task_id] = "Cloning Repository..."
        print(f"Cloning {repo_url} into {target_dir}...")
        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"
        subprocess.run(["git", "clone", repo_url, str(target_dir)], check=True, capture_output=True, env=env, stdin=subprocess.DEVNULL, timeout=300)
        
        ACTIVE_SCANS_PROGRESS[task_id] = "Running Gitleaks (Secrets Analysis)..."
        print("Running Gitleaks...")
        gitleaks_output = "No leaks found (simulated)"
        try:
            res = subprocess.run(["gitleaks", "detect", "--source", str(target_dir), "-v"], capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=120)
            gitleaks_output = res.stdout
        except FileNotFoundError:
            gitleaks_output = ""
            print("Warning: Gitleaks not installed.")

        ACTIVE_SCANS_PROGRESS[task_id] = "Running Semgrep (SAST Engine)..."
        print("Running Semgrep...")
        semgrep_output = "No vulnerabilities found (simulated)"
        try:
            res = subprocess.run(["semgrep", "scan", "--config", "auto", "--json", str(target_dir)], capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=300)
            semgrep_output = res.stdout
        except FileNotFoundError:
            import json
            semgrep_output = json.dumps({"results": [], "errors": [{"message": "Semgrep not installed."}]})
            print("Warning: Semgrep not installed.")

        ACTIVE_SCANS_PROGRESS[task_id] = "Running Trivy (Dependencies & Legal)..."
        print("Running Trivy...")
        trivy_output = "Trivy not installed. Mocking results."
        try:
            res = subprocess.run(["trivy", "fs", "--scanners", "vuln,license", "--format", "json", "-q", str(target_dir)], capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=120)
            trivy_output = res.stdout
        except FileNotFoundError:
            import json
            trivy_output = json.dumps({"Results": []})
            print("Warning: Trivy not installed.")

        ACTIVE_SCANS_PROGRESS[task_id] = "Finalizing Results & Cleaning up..."
        print("Cleaning up...")
        shutil.rmtree(target_dir)

        return {
            "status": "completed",
            "findings": {
                "gitleaks": gitleaks_output,
                "semgrep": semgrep_output,
                "trivy": trivy_output
            }
        }
    except Exception as e:
        if target_dir.exists():
            shutil.rmtree(target_dir)
        import traceback
        error_msg = f"Analysis failed: {str(e)}"
        if isinstance(e, subprocess.CalledProcessError) and e.stderr:
            error_msg += f"\nGit Error Details:\n{e.stderr.decode('utf-8', errors='ignore')}"
        error_msg += f"\n{traceback.format_exc()}"
        with open("/tmp/worker_error.log", "w") as f:
            f.write(error_msg)
        print(error_msg)
        return {"status": "error", "message": error_msg}

async def process_scan(repo_url: str, task_id: str):
    try:
        # 1. DB Init
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Repository).where(Repository.url == repo_url))
            repo = result.scalars().first()
            if not repo:
                repo = Repository(url=repo_url, name=repo_url.split("/")[-1].replace(".git", ""))
                session.add(repo)
                await session.commit()
                await session.refresh(repo)
                
            scan = ScanResult(task_id=task_id, repository_id=repo.id, status="running")
            session.add(scan)
            await session.commit()
            
        # 2. Run blocking scan
        loop = asyncio.get_event_loop()
        scan_data = await loop.run_in_executor(None, run_blocking_scan, repo_url, task_id)
        
        # 3. Update DB with findings
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(ScanResult).where(ScanResult.task_id == task_id))
            scan = result.scalars().first()
            if scan:
                scan.status = scan_data["status"]
                scan.message = scan_data.get("message")
                scan.completed_at = datetime.utcnow()
                
                gitleaks_count = 0
                semgrep_count = 0
                
                if "findings" in scan_data:
                    for scanner, output in scan_data["findings"].items():
                        finding = Finding(
                            scan_id=scan.id,
                            scanner_type=scanner,
                            raw_output=output
                        )
                        session.add(finding)
                        
                        # Very basic simulated counting for ML model
                        if scanner == "gitleaks" and "No leaks found" not in output:
                            gitleaks_count += 1
                        if scanner == "semgrep" and "No vulnerabilities found" not in output:
                            semgrep_count += 1
                        if scanner == "trivy" and "Trivy not installed" not in output:
                            # Trivy json format checking will happen, but this just adds a slight penalty if it ran
                            semgrep_count += 1
                
                # ML Risk Scoring
                try:
                    from .ml import calculate_risk_score
                    risk_score = calculate_risk_score(gitleaks_count, semgrep_count, complexity=15)
                    scan.risk_score = int(risk_score)
                except Exception as ml_e:
                    print(f"ML Scoring failed: {ml_e}")
                    scan.risk_score = 0
                    if scan.status == "completed":
                        scan.message = (scan.message or "") + "\nWarning: Risk score calculation failed."
                
                await session.commit()
    except Exception as e:
        print(f"Uncaught error in process_scan: {e}")
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(ScanResult).where(ScanResult.task_id == task_id))
                scan = result.scalars().first()
                if scan:
                    scan.status = "error"
                    scan.message = f"Internal server error: {str(e)}"
                    scan.completed_at = datetime.utcnow()
                    await session.commit()
        except:
            pass
    finally:
        # Cleanup progress
        if task_id in ACTIVE_SCANS_PROGRESS:
            del ACTIVE_SCANS_PROGRESS[task_id]

