# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Yes             |
| 1.x.x   | ❌ No (EOL)        |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

### Preferred Method: GitHub Security Advisories
1. Go to: https://github.com/casalenamajyestik/ai-trading-website/security/advisories/new
2. Fill in the vulnerability details
3. We'll acknowledge within 48 hours

### Alternative: Email
- **security@ai-trading-website.com**
- Include: description, steps to reproduce, impact assessment, suggested fix
- PGP Key: https://ai-trading-website.com/pgp-key.txt

### What to Include
- Type of vulnerability (XSS, CSRF, RCE, SQLi, Auth bypass, etc.)
- Affected component/endpoint
- Steps to reproduce
- Proof of concept (if safe to share)
- Impact assessment
- Suggested remediation

## Response Timeline

| Severity | Acknowledgment | Initial Assessment | Fix Target |
| -------- | -------------- | ------------------ | ---------- |
| Critical | 24 hours       | 72 hours           | 7 days     |
| High     | 48 hours       | 1 week             | 14 days    |
| Medium   | 72 hours       | 2 weeks            | 30 days    |
| Low      | 1 week         | 30 days            | 90 days    |

## Disclosure Policy

- **Coordinated Disclosure**: We request 90 days before public disclosure
- **Credit**: Researchers acknowledged in Hall of Fame (with permission)
- **Bounty**: No formal bounty program, but we recognize valuable contributions

## Security Measures Implemented

### Authentication & Authorization
- Supabase Auth with JWT tokens
- Auto-refresh tokens, secure session persistence
- OAuth 2.0 providers (Google, GitHub)
- Magic link passwordless authentication
- Email verification required

### Transport Security
- HSTS (1 year, includeSubDomains, preload)
- TLS 1.2+ only
- Secure cookies (HttpOnly, SameSite=Strict)
- CSP with nonce-based script execution

### Application Security
- CSRF protection (double-submit cookie pattern)
- XSS protection (HTML escaping, sanitization)
- Rate limiting (client + server-side)
- Password strength validation (12+ chars, complexity, breach check via HIBP)
- Session encryption (AES-GCM via Web Crypto API)

### Infrastructure
- Vercel Edge Network (DDoS protection)
- Environment variables for secrets
- No secrets in code/repository
- Dependency scanning (npm audit)
- Automated security headers

## Secure Development Practices

- Code review required for all changes
- Security linting in CI/CD
- Dependency updates via Dependabot
- Secrets scanning in PRs
- Branch protection rules

## Incident Response

1. **Detect**: Monitoring + reports
2. **Analyze**: Impact assessment
3. **Contain**: Immediate mitigation
4. **Eradicate**: Root cause fix
5. **Recover**: Deploy fix, verify
6. **Post-mortem**: Document lessons learned

## Contact

- **Security Team**: security@ai-trading-website.com
- **General**: hello@ai-trading-website.com
- **GitHub**: @casalenamajyestik

---

*Last updated: 2026-10-02*
*Version: 2.0*