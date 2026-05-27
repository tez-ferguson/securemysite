'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import FindingCard from '../../components/FindingCard'
import { CountUp } from '../../components/motion/CountUp'
import type { Finding } from '../../types'

const EASE = [0.16, 1, 0.3, 1] as const

const demoFindings: Finding[] = [
  {
    id: '1',
    type: 'Exposed Secret',
    severity: 'critical',
    file: 'src/lib/supabase.js',
    line: 14,
    description: 'Supabase service role key hardcoded in client bundle. This key bypasses Row Level Security and grants full database access.',
    snippet: "const supabase = createClient(url, 'eyJh...')",
    fix_prompt: 'Remove the hardcoded Supabase service role key from src/lib/supabase.js. Move it to an environment variable called SUPABASE_SERVICE_ROLE_KEY and access it via process.env.SUPABASE_SERVICE_ROLE_KEY on the server only. Use the anon key for client-side Supabase calls instead.',
  },
  {
    id: '2',
    type: 'Missing Authentication',
    severity: 'high',
    file: 'app/api/admin/users/route.ts',
    line: 3,
    description: 'Admin API route has no authentication check. Any unauthenticated request can list and delete all users.',
    snippet: "export async function GET() {\n  const users = await db.users.findAll()\n  return Response.json(users)\n}",
    fix_prompt: 'Add authentication to app/api/admin/users/route.ts. Import auth from @clerk/nextjs/server and call const { userId } = auth() at the top of your handler. Return a 401 if userId is null. Add admin role checking before returning sensitive data.',
  },
  {
    id: '3',
    type: 'SQL Injection',
    severity: 'high',
    file: 'lib/db.ts',
    line: 47,
    description: 'Raw SQL query built with string concatenation allows SQL injection attacks.',
    snippet: "const query = `SELECT * FROM users WHERE email = '${email}'`",
    fix_prompt: 'Replace the string-concatenated SQL query in lib/db.ts line 47 with a parameterised query. Use db.query("SELECT * FROM users WHERE email = $1", [email]) instead. Never interpolate user input directly into SQL strings.',
  },
  {
    id: '4',
    type: 'Open CORS',
    severity: 'medium',
    file: 'app/api/data/route.ts',
    line: 8,
    description: "Access-Control-Allow-Origin set to wildcard (*) allows any origin to call this API.",
    snippet: "headers.set('Access-Control-Allow-Origin', '*')",
    fix_prompt: "Replace the wildcard CORS header in app/api/data/route.ts with your specific allowed origin. Change headers.set('Access-Control-Allow-Origin', '*') to headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com'). For multiple allowed origins, implement origin checking logic.",
  },
  {
    id: '5',
    type: 'Vulnerable Dependency',
    severity: 'medium',
    file: 'package.json',
    line: 23,
    description: 'lodash@4.17.15 has a known prototype pollution vulnerability (CVE-2021-23337).',
    snippet: '"lodash": "4.17.15"',
    fix_prompt: 'Update lodash to the latest version in package.json. Run: npm install lodash@latest. Then run npm audit to check for any remaining vulnerabilities. Consider replacing lodash utility functions with native JavaScript equivalents to reduce dependency surface.',
  },
]

const SEVERITY_STATS = [
  { label: 'Critical', count: demoFindings.filter(f => f.severity === 'critical').length, color: '#c0392b' },
  { label: 'High',     count: demoFindings.filter(f => f.severity === 'high').length,     color: '#e67e22' },
  { label: 'Medium',   count: demoFindings.filter(f => f.severity === 'medium').length,   color: '#856404' },
  { label: 'Low',      count: demoFindings.filter(f => f.severity === 'low').length,      color: '#5a9e6f' },
]

export default function DemoPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--white)', padding: '0 40px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', textDecoration: 'none' }}>VibeSec</Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ color: 'var(--ink2)', fontSize: '0.88rem', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/sign-up" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: '8px 18px', fontSize: '0.88rem', textDecoration: 'none' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Demo banner — slides in from top */}
      <motion.div
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
        style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}
      >
        <span style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.88rem' }}>
          This is a demo report. Scan your own app to see real results.
        </span>
        <Link href="/" style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.88rem', color: '#fff', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
          Scan my app →
        </Link>
      </motion.div>

      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '48px 24px 96px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '2.2rem', color: 'var(--ink)', margin: 0, lineHeight: '1.15' }}>
              demo-app / my-next-project
            </h1>
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.35, ease: EASE }}
              style={{ backgroundColor: '#c0392b', color: '#fff', border: '1px solid #c0392b', display: 'inline-block', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '5px 14px' }}
            >
              Critical risk
            </motion.span>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink3)' }}>https://my-next-project.vercel.app</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink3)' }}>Scanned May 27, 2026 at 3:42 PM</span>
          </div>
        </motion.div>

        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: EASE }}
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--white)', display: 'flex', marginBottom: '40px' }}
        >
          {SEVERITY_STATS.map((item, i) => (
            <div key={item.label} style={{ flex: 1, padding: '20px 24px', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', color: item.count > 0 ? item.color : '#bbb8b4', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>
                <CountUp to={item.count} duration={0.9} />
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink3)' }}>
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Findings */}
        <p style={{ fontSize: '0.82rem', color: 'var(--ink3)', fontWeight: 300, marginBottom: '20px' }}>
          {demoFindings.length} vulnerabilities found
        </p>
        {demoFindings.map((finding, i) => (
          <FindingCard key={finding.id} finding={finding} delay={i * 0.07} />
        ))}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.6, ease: EASE }}
          style={{ marginTop: '56px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', padding: '40px', textAlign: 'center' }}
        >
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.7rem', color: 'var(--ink)', margin: '0 0 12px 0' }}>
            See what&apos;s hiding in your codebase
          </h2>
          <p style={{ fontWeight: 300, fontSize: '0.9rem', color: 'var(--ink3)', margin: '0 0 28px 0', lineHeight: '1.6' }}>
            Paste your GitHub URL or deployed site. Results in under 60 seconds.
          </p>
          <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
            <motion.div
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.28, ease: EASE }}
              style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
            />
            <Link
              href="/"
              style={{ position: 'relative', zIndex: 1, display: 'inline-block', backgroundColor: 'var(--ink)', color: '#fff', padding: '14px 32px', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.95rem', textDecoration: 'none' }}
            >
              Scan my app →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
