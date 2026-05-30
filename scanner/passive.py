"""
VibeSec Passive Scanner — external URL checks without GitHub access.
Runs on Modal; triggered by Next.js POST; callbacks with findings JSON.
"""

import modal
import os
import json
import ssl
import socket
import uuid
import re
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx

app = modal.App("vibesec-passive-scanner")

trigger_image = modal.Image.debian_slim().pip_install(["fastapi[standard]", "pydantic"])

scan_image = (
    modal.Image.debian_slim()
    .pip_install([
        "httpx>=0.27.0",
        "cryptography>=42.0.0",
        "dnspython>=2.6.0",
        "openai>=1.40.0",
    ])
    .add_local_python_source("llm")
)


def _host_from_url(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return parsed.hostname or parsed.path.split("/")[0]


def _base_url(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    scheme = parsed.scheme or "https"
    host = parsed.hostname or ""
    port = f":{parsed.port}" if parsed.port else ""
    return f"{scheme}://{host}{port}"


def check_ssl(url: str) -> list[dict]:
    findings = []
    host = _host_from_url(url)
    if not host:
        return findings

    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert_bin = ssock.getpeercert(binary_form=True)
                from cryptography import x509
                from cryptography.hazmat.backends import default_backend

                cert = x509.load_der_x509_certificate(cert_bin, default_backend())
                not_after = cert.not_valid_after_utc
                days_left = (not_after - datetime.now(timezone.utc)).days
                if days_left < 0:
                    findings.append({
                        "type": "ssl_certificate",
                        "severity": "critical",
                        "file": "TLS",
                        "line": 0,
                        "description": f"SSL certificate expired {abs(days_left)} days ago",
                        "snippet": f"Not valid after: {not_after.isoformat()}",
                    })
                elif days_left < 14:
                    findings.append({
                        "type": "ssl_certificate",
                        "severity": "high",
                        "file": "TLS",
                        "line": 0,
                        "description": f"SSL certificate expires in {days_left} days",
                        "snippet": f"Not valid after: {not_after.isoformat()}",
                    })
    except ssl.SSLError as e:
        findings.append({
            "type": "ssl_certificate",
            "severity": "critical",
            "file": "TLS",
            "line": 0,
            "description": f"SSL/TLS handshake failed: {str(e)[:120]}",
            "snippet": host,
        })
    except Exception as e:
        findings.append({
            "type": "ssl_certificate",
            "severity": "high",
            "file": "TLS",
            "line": 0,
            "description": f"Could not verify SSL certificate: {str(e)[:120]}",
            "snippet": host,
        })
    return findings


def check_https_redirect(url: str) -> list[dict]:
    findings = []
    host = _host_from_url(url)
    if not host:
        return findings
    try:
        r = httpx.get(f"http://{host}", follow_redirects=False, timeout=12)
        loc = r.headers.get("location", "")
        if r.status_code not in (301, 302, 307, 308) or not loc.lower().startswith("https"):
            findings.append({
                "type": "no_https_redirect",
                "severity": "high",
                "file": "/",
                "line": 0,
                "description": "HTTP does not redirect to HTTPS",
                "snippet": f"GET http://{host} → {r.status_code}",
            })
    except Exception:
        pass
    return findings


SECURITY_HEADERS = [
    ("Content-Security-Policy", "critical"),
    ("Strict-Transport-Security", "high"),
    ("X-Frame-Options", "medium"),
    ("X-Content-Type-Options", "medium"),
    ("Referrer-Policy", "low"),
]


def check_security_headers(headers: httpx.Headers) -> list[dict]:
    findings = []
    for header, severity in SECURITY_HEADERS:
        if header.lower() not in {k.lower() for k in headers.keys()}:
            findings.append({
                "type": "missing_security_header",
                "severity": severity,
                "file": f"Header:{header}",
                "line": 0,
                "description": f"Missing security header: {header}",
                "snippet": "Not present in response",
            })
    return findings


def check_cookies(headers: httpx.Headers) -> list[dict]:
    findings = []
    raw = headers.get_list("set-cookie") if hasattr(headers, "get_list") else []
    if not raw:
        # httpx Headers may combine Set-Cookie
        sc = headers.get("set-cookie")
        if sc:
            raw = [sc]
    for cookie in raw:
        name = cookie.split("=", 1)[0].strip()
        lower = cookie.lower()
        issues = []
        if "httponly" not in lower:
            issues.append("HttpOnly")
        if "secure" not in lower:
            issues.append("Secure")
        if "samesite" not in lower:
            issues.append("SameSite")
        if issues:
            findings.append({
                "type": "insecure_cookie",
                "severity": "medium" if "Secure" in issues else "high",
                "file": f"Cookie:{name}",
                "line": 0,
                "description": f"Cookie '{name}' missing flags: {', '.join(issues)}",
                "snippet": cookie[:80] + ("..." if len(cookie) > 80 else ""),
            })
    return findings


def check_cors(base_url: str) -> list[dict]:
    findings = []
    try:
        r = httpx.get(
            base_url,
            headers={"Origin": "https://evil.example.com"},
            timeout=12,
            follow_redirects=True,
        )
        acao = r.headers.get("access-control-allow-origin", "")
        if acao == "*":
            findings.append({
                "type": "cors_misconfiguration",
                "severity": "high",
                "file": "CORS",
                "line": 0,
                "description": "Access-Control-Allow-Origin is wildcard (*)",
                "snippet": "ACAO: *",
            })
        elif acao == "https://evil.example.com":
            findings.append({
                "type": "cors_misconfiguration",
                "severity": "critical",
                "file": "CORS",
                "line": 0,
                "description": "Server reflects arbitrary Origin header in ACAO",
                "snippet": f"ACAO: {acao}",
            })
    except Exception:
        pass
    return findings


def check_server_leak(headers: httpx.Headers) -> list[dict]:
    findings = []
    for h in ("Server", "X-Powered-By", "X-AspNet-Version"):
        val = headers.get(h)
        if val:
            findings.append({
                "type": "server_info_leak",
                "severity": "low",
                "file": f"Header:{h}",
                "line": 0,
                "description": f"Server version disclosure via {h} header",
                "snippet": f"{h}: {val[:100]}",
            })
    return findings


EXPOSED_PATHS = [
    ("/.env", "critical"),
    ("/.git/HEAD", "critical"),
    ("/wp-config.php", "high"),
    ("/robots.txt", "low"),
    ("/.well-known/security.txt", "low"),
]


def check_exposed_files(base_url: str) -> list[dict]:
    findings = []
    for path, severity in EXPOSED_PATHS:
        try:
            r = httpx.get(f"{base_url.rstrip('/')}{path}", timeout=8, follow_redirects=False)
            if r.status_code == 200 and len(r.content) > 0:
                if path == "/robots.txt" and "disallow" not in r.text.lower():
                    continue
                snippet = r.text[:120].replace("\n", " ")
                findings.append({
                    "type": "exposed_file",
                    "severity": severity,
                    "file": path,
                    "line": 0,
                    "description": f"Sensitive path accessible: {path}",
                    "snippet": snippet,
                })
        except Exception:
            pass
    return findings


def check_dns(host: str) -> list[dict]:
    findings = []
    try:
        import dns.resolver

        for record_type, label, severity in [
            ("SPF", "v=spf1", "medium"),
            ("DMARC", "v=DMARC1", "high"),
            ("DKIM", "v=DKIM1", "medium"),
        ]:
            try:
                if record_type == "DMARC":
                    qname = f"_dmarc.{host}"
                    answers = dns.resolver.resolve(qname, "TXT")
                elif record_type == "DKIM":
                    # Common selector; best-effort
                    qname = f"default._domainkey.{host}"
                    answers = dns.resolver.resolve(qname, "TXT")
                else:
                    answers = dns.resolver.resolve(host, "TXT")
                found = any(label in str(r) for r in answers)
                if not found and record_type == "SPF":
                    txt = " ".join(str(r) for r in answers)
                    found = "spf1" in txt.lower()
                if not found:
                    findings.append({
                        "type": "dns_missing_record",
                        "severity": severity,
                        "file": f"DNS:{record_type}",
                        "line": 0,
                        "description": f"Missing or weak {record_type} DNS record for {host}",
                        "snippet": f"No {record_type} TXT record detected",
                    })
            except Exception:
                if record_type in ("SPF", "DMARC"):
                    findings.append({
                        "type": "dns_missing_record",
                        "severity": severity,
                        "file": f"DNS:{record_type}",
                        "line": 0,
                        "description": f"No {record_type} record found for {host}",
                        "snippet": f"Lookup failed for {record_type}",
                    })
    except Exception:
        pass
    return findings


def check_blacklist(url: str) -> list[dict]:
    findings = []
    api_key = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY", "")
    if not api_key:
        return findings
    try:
        r = httpx.post(
            f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}",
            json={
                "client": {"clientId": "vibesec", "clientVersion": "1.0"},
                "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}],
                },
            },
            timeout=15,
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("matches"):
                findings.append({
                    "type": "blacklisted",
                    "severity": "critical",
                    "file": "Reputation",
                    "line": 0,
                    "description": "Site flagged on Google Safe Browsing threat lists",
                    "snippet": json.dumps(data["matches"][:1])[:120],
                })
    except Exception:
        pass
    return findings


def check_basic_surface(base_url: str, html: str) -> list[dict]:
    findings = []
    forms = re.findall(r"<form[^>]*action=[\"']([^\"']*)[\"']", html, re.I)
    if forms:
        findings.append({
            "type": "form_surface",
            "severity": "low",
            "file": "/",
            "line": 0,
            "description": f"Found {len(forms)} HTML form(s) — manual injection testing recommended",
            "snippet": "Forms present on homepage",
        })
    if re.search(r"<script[^>]*>[^<]*document\.write", html, re.I):
        findings.append({
            "type": "xss_surface",
            "severity": "medium",
            "file": "/",
            "line": 0,
            "description": "Potential XSS surface: inline script patterns detected",
            "snippet": "document.write or similar in page",
        })
    return findings


def _template_fix(finding: dict) -> str:
    return (
        f"Fix the following security issue at {finding['file']}: "
        f"{finding['description']}. Apply hosting and HTTP security best practices."
    )


def _post_callback(
    callback_url: str,
    callback_secret: str,
    findings: list[dict],
    counts: dict,
    *,
    failed: bool = False,
    error_message: str | None = None,
) -> None:
    httpx.post(
        callback_url,
        json={
            "findings": findings,
            "counts": counts,
            "failed": failed,
            "error_message": error_message,
        },
        headers={"x-scanner-secret": callback_secret},
        timeout=30,
    ).raise_for_status()


@app.function(
    image=scan_image,
    timeout=180,
    memory=512,
    secrets=[
        modal.Secret.from_name("moonshot-key"),
        modal.Secret.from_name("app-callback-secret"),
    ],
)
def run_passive_scan(
    token: str,
    url: str,
    callback_url: str,
    callback_secret: str,
) -> dict:
    try:
        from llm import generate_fix_prompt
    except ImportError:
        def generate_fix_prompt(finding, context="passive"):  # type: ignore
            return _template_fix(finding)

    empty_counts = {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0}

    try:
        base = _base_url(url)
        host = _host_from_url(url)
        all_findings: list[dict] = []

        all_findings.extend(check_ssl(url))
        all_findings.extend(check_https_redirect(url))

        try:
            resp = httpx.get(base, timeout=20, follow_redirects=True)
            headers = resp.headers
            html = resp.text[:50000]
            all_findings.extend(check_security_headers(headers))
            all_findings.extend(check_cookies(headers))
            all_findings.extend(check_server_leak(headers))
            all_findings.extend(check_basic_surface(base, html))
        except Exception as e:
            all_findings.append({
                "type": "connection_error",
                "severity": "high",
                "file": "/",
                "line": 0,
                "description": f"Could not fetch site: {str(e)[:120]}",
                "snippet": base,
            })

        all_findings.extend(check_cors(base))
        all_findings.extend(check_exposed_files(base))
        if host:
            all_findings.extend(check_dns(host))
        all_findings.extend(check_blacklist(base))

        seen = set()
        deduped = []
        for f in all_findings:
            key = (f["file"], f["type"], f["description"][:60])
            if key not in seen:
                seen.add(key)
                deduped.append(f)

        for finding in deduped:
            finding["id"] = str(uuid.uuid4())
            finding["fix_prompt"] = _template_fix(finding)

        for finding in deduped[:3]:
            finding["fix_prompt"] = generate_fix_prompt(finding, context="passive")

        counts = {
            "total": len(deduped),
            "critical": sum(1 for f in deduped if f["severity"] == "critical"),
            "high": sum(1 for f in deduped if f["severity"] == "high"),
            "medium": sum(1 for f in deduped if f["severity"] == "medium"),
            "low": sum(1 for f in deduped if f["severity"] == "low"),
        }

        _post_callback(callback_url, callback_secret, deduped, counts)
        return {"ok": True, "counts": counts, "token": token}
    except Exception as e:
        err = str(e)[:500]
        print(f"Passive scan error: {err}")
        try:
            _post_callback(
                callback_url,
                callback_secret,
                [],
                empty_counts,
                failed=True,
                error_message=err,
            )
        except Exception as cb_err:
            print(f"Passive scan failed and callback failed: {cb_err}; scan error: {err}")
        raise


@app.function(
    image=trigger_image,
    secrets=[modal.Secret.from_name("app-callback-secret")],
)
@modal.asgi_app()
def trigger_passive_scan():
    from fastapi import FastAPI, Header, HTTPException
    from pydantic import BaseModel

    web = FastAPI()

    class TriggerBody(BaseModel):
        token: str
        url: str
        callback_url: str
        callback_secret: str

    @web.post("/")
    def post_trigger(
        body: TriggerBody,
        x_trigger_secret: str | None = Header(default=None, alias="x-trigger-secret"),
    ):
        expected = os.environ.get("APP_CALLBACK_SECRET", "")
        if not x_trigger_secret or x_trigger_secret != expected:
            raise HTTPException(status_code=401, detail="Unauthorized")

        run_passive_scan.spawn(
            token=body.token,
            url=body.url,
            callback_url=body.callback_url,
            callback_secret=body.callback_secret,
        )
        return {"queued": True}

    return web
