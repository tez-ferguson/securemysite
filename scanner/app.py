"""
VibeSec Scanner — runs on Modal
Triggered by POST from the Next.js API with scan parameters.
Never persists source code. Only sends findings JSON to the callback URL.
"""

import modal
import os
import json
import tempfile
import subprocess
import re
import httpx
import uuid
from pathlib import Path

# ─── Modal app and image ─────────────────────────────────────
app = modal.App("vibesec-scanner")

trigger_image = modal.Image.debian_slim().pip_install(["fastapi[standard]", "pydantic"])

scan_image = (
    modal.Image.debian_slim()
    .apt_install(["git", "curl", "wget"])
    .pip_install(["semgrep", "openai", "gitpython", "httpx"])
    .add_local_python_source("llm")
    .run_commands([
        # gitleaks for secrets
        "curl -sSfL https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz | tar -xz -C /usr/local/bin",
        # trivy for dependencies
        "curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
    ])
)


def run_gitleaks(repo_path: str) -> list[dict]:
    result = subprocess.run(
        ["gitleaks", "detect", "--source", repo_path, "--report-format", "json", "--report-path", "/tmp/gitleaks.json", "--no-banner"],
        capture_output=True, text=True
    )
    # gitleaks exits 1 when findings exist — that's ok
    try:
        with open("/tmp/gitleaks.json") as f:
            leaks = json.load(f)
    except:
        leaks = []

    findings = []
    for leak in leaks:
        # NEVER store actual secret value — truncate to 4 chars
        raw_secret = leak.get("Secret", "")
        truncated = raw_secret[:4] + "..." if len(raw_secret) > 4 else "***"
        snippet = leak.get("Match", "").replace(raw_secret, truncated) if raw_secret else leak.get("Match", "")

        findings.append({
            "type": "exposed_secret",
            "severity": "critical",
            "file": leak.get("File", "unknown"),
            "line": leak.get("StartLine", 0),
            "description": f"Exposed secret ({leak.get('RuleID', 'unknown')}): {leak.get('Description', '')}",
            "snippet": snippet,
            "raw_type": leak.get("RuleID", ""),
        })
    return findings


def run_semgrep(repo_path: str) -> list[dict]:
    result = subprocess.run(
        ["semgrep", "--config=auto", "--json", "--quiet", repo_path],
        capture_output=True, text=True, timeout=120
    )
    try:
        data = json.loads(result.stdout)
        results = data.get("results", [])
    except:
        results = []

    severity_map = {
        "ERROR": "high",
        "WARNING": "medium",
        "INFO": "low",
    }

    findings = []
    for r in results:
        findings.append({
            "type": "code_vulnerability",
            "severity": severity_map.get(r.get("extra", {}).get("severity", "INFO"), "low"),
            "file": r.get("path", "unknown").replace(repo_path + "/", ""),
            "line": r.get("start", {}).get("line", 0),
            "description": r.get("extra", {}).get("message", ""),
            "snippet": r.get("extra", {}).get("lines", "").strip()[:200],
            "raw_type": r.get("check_id", ""),
        })
    return findings


def run_trivy(repo_path: str) -> list[dict]:
    result = subprocess.run(
        ["trivy", "fs", "--format", "json", "--quiet", repo_path],
        capture_output=True, text=True, timeout=120
    )
    try:
        data = json.loads(result.stdout)
    except:
        return []

    severity_map = {"CRITICAL": "critical", "HIGH": "high", "MEDIUM": "medium", "LOW": "low"}
    findings = []

    for result_item in data.get("Results", []):
        for vuln in result_item.get("Vulnerabilities", []):
            sev = vuln.get("Severity", "LOW")
            findings.append({
                "type": "vulnerable_dependency",
                "severity": severity_map.get(sev, "low"),
                "file": result_item.get("Target", "package.json"),
                "line": 0,
                "description": f"{vuln.get('PkgName', '')}@{vuln.get('InstalledVersion', '')} — {vuln.get('Title', '')} ({vuln.get('VulnerabilityID', '')})",
                "snippet": f'"{vuln.get("PkgName", "")}" : "{vuln.get("InstalledVersion", "")}"',
                "raw_type": vuln.get("VulnerabilityID", ""),
            })
    return findings


def run_custom_checks(repo_path: str) -> list[dict]:
    findings = []

    # Walk all source files
    source_extensions = {'.js', '.ts', '.jsx', '.tsx', '.py', '.env', '.env.local', '.env.production'}

    for filepath in Path(repo_path).rglob('*'):
        if not filepath.is_file():
            continue
        if filepath.suffix not in source_extensions and filepath.name not in {'.env', '.env.local', '.env.production', '.env.development'}:
            continue

        try:
            content = filepath.read_text(encoding='utf-8', errors='ignore')
            rel_path = str(filepath).replace(repo_path + '/', '')
            lines = content.split('\n')
        except:
            continue

        # Check 1: Supabase service role key in client-side code
        if any(x in rel_path for x in ['components/', 'pages/', 'app/', 'src/']) and 'api/' not in rel_path:
            for i, line in enumerate(lines, 1):
                if 'service_role' in line.lower() or ('supabase' in line.lower() and 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' in line):
                    findings.append({
                        "type": "supabase_service_role_client_exposure",
                        "severity": "critical",
                        "file": rel_path,
                        "line": i,
                        "description": "Supabase service role key used in client-side code. This key bypasses all Row Level Security and grants full database access.",
                        "snippet": line.strip()[:150],
                        "raw_type": "supabase_service_role_client",
                    })

        # Check 2: RLS disabled in migration files
        if 'migration' in rel_path.lower() or rel_path.endswith('.sql'):
            if 'disable row level security' in content.lower() or 'rls' in content.lower() and 'disable' in content.lower():
                findings.append({
                    "type": "rls_disabled",
                    "severity": "high",
                    "file": rel_path,
                    "line": 1,
                    "description": "Row Level Security (RLS) is explicitly disabled in a migration file. All rows will be accessible to any authenticated user.",
                    "snippet": "DISABLE ROW LEVEL SECURITY",
                    "raw_type": "supabase_rls_disabled",
                })

        # Check 3: Stripe live keys in code (not env files)
        if not any(x in rel_path for x in ['.env', '.gitignore']):
            for i, line in enumerate(lines, 1):
                if re.search(r'sk_live_[A-Za-z0-9]{24,}', line) or re.search(r'pk_live_[A-Za-z0-9]{24,}', line):
                    match = re.search(r'(sk_live_|pk_live_)[A-Za-z0-9]{24,}', line)
                    truncated = match.group(0)[:8] + '...' if match else 'sk_live_...'
                    findings.append({
                        "type": "stripe_live_key_exposed",
                        "severity": "critical",
                        "file": rel_path,
                        "line": i,
                        "description": "Stripe live key hardcoded in source code. Any user who views your source can make charges to your account.",
                        "snippet": line.strip().replace(match.group(0), truncated) if match else line.strip()[:150],
                        "raw_type": "stripe_live_key",
                    })

        # Check 4: Firebase open rules patterns
        if 'firestore.rules' in rel_path or 'storage.rules' in rel_path:
            if 'allow read, write: if true' in content or 'allow read: if true' in content:
                findings.append({
                    "type": "firebase_open_rules",
                    "severity": "critical",
                    "file": rel_path,
                    "line": 1,
                    "description": "Firebase security rules allow unrestricted read/write access to all users including unauthenticated ones.",
                    "snippet": "allow read, write: if true",
                    "raw_type": "firebase_open_rules",
                })

    return findings


@app.function(
    image=scan_image,
    timeout=300,
    memory=1024,
    secrets=[
        modal.Secret.from_name("moonshot-key"),
        modal.Secret.from_name("app-callback-secret"),
    ]
)
def run_scan(
    scan_job_id: str,
    repo_url: str,
    github_installation_id: str,
    callback_url: str,
    callback_secret: str,
    github_token: str,  # Installation token passed in from Next.js
) -> dict:
    import git
    from llm import generate_fix_prompt

    with tempfile.TemporaryDirectory() as tmpdir:
        clone_url = repo_url.replace("https://github.com/", f"https://x-access-token:{github_token}@github.com/")
        repo = git.Repo.clone_from(clone_url, tmpdir)

        # Run all scanners
        all_findings = []
        all_findings.extend(run_gitleaks(tmpdir))
        all_findings.extend(run_semgrep(tmpdir))
        all_findings.extend(run_trivy(tmpdir))
        all_findings.extend(run_custom_checks(tmpdir))

        # Deduplicate by (file, line, type)
        seen = set()
        deduped = []
        for f in all_findings:
            key = (f['file'], f['line'], f['type'])
            if key not in seen:
                seen.add(key)
                deduped.append(f)

        # Stable ids for every finding (required for locked previews / DB)
        for finding in deduped:
            finding["id"] = str(uuid.uuid4())

        # Generate fix prompts (limit to first 20 to control API costs)
        for finding in deduped[:20]:
            finding["fix_prompt"] = generate_fix_prompt(finding, context="code")
        for finding in deduped[20:]:
            finding["fix_prompt"] = (
                f"Fix the following security issue in {finding['file']} at line {finding['line']}: "
                f"{finding['description']}. Apply security best practices."
            )

        # Count by severity
        counts = {
            'total': len(deduped),
            'critical': sum(1 for f in deduped if f['severity'] == 'critical'),
            'high': sum(1 for f in deduped if f['severity'] == 'high'),
            'medium': sum(1 for f in deduped if f['severity'] == 'medium'),
            'low': sum(1 for f in deduped if f['severity'] == 'low'),
        }

        # Send to callback (tempdir still exists at this point)
        response = httpx.post(
            callback_url,
            json={"findings": deduped, "counts": counts},
            headers={"x-scanner-secret": callback_secret},
            timeout=30,
        )
        response.raise_for_status()

        return {"ok": True, "counts": counts}


@app.function(
    image=trigger_image,
    secrets=[modal.Secret.from_name("app-callback-secret")],
)
@modal.asgi_app()
def trigger_scan():
    """HTTP entrypoint: validates shared secret, queues `run_scan` asynchronously."""
    from fastapi import FastAPI, Header, HTTPException
    from pydantic import BaseModel

    web = FastAPI()

    class TriggerBody(BaseModel):
        scan_job_id: str
        repo_url: str
        github_installation_id: str
        callback_url: str
        callback_secret: str
        github_token: str

    @web.post("/")
    def post_trigger(
        body: TriggerBody,
        x_trigger_secret: str | None = Header(default=None, alias="x-trigger-secret"),
    ):
        expected = os.environ.get("APP_CALLBACK_SECRET", "")
        if not x_trigger_secret or x_trigger_secret != expected:
            raise HTTPException(status_code=401, detail="Unauthorized")

        run_scan.spawn(
            scan_job_id=body.scan_job_id,
            repo_url=body.repo_url,
            github_installation_id=body.github_installation_id,
            callback_url=body.callback_url,
            callback_secret=body.callback_secret,
            github_token=body.github_token,
        )
        return {"queued": True}

    return web


@app.local_entrypoint()
def main():
    """Test the scanner locally with a public repo."""
    result = run_scan.remote(
        scan_job_id="test-123",
        repo_url="https://github.com/anthropics/anthropic-sdk-python",
        github_installation_id="test",
        callback_url="http://localhost:3000/api/scans/test-123/callback",
        callback_secret="test-secret",
        github_token="",
    )
    print(json.dumps(result, indent=2))
