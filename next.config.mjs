/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts + Stripe.js
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              // Supabase auth, Stripe, and same-origin API calls
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              // Styles: inline (Tailwind / CSS-in-JS) + fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Google Fonts, local fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Stripe embedded iframes
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // No object embeds
              "object-src 'none'",
              // Upgrade insecure requests in production
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
