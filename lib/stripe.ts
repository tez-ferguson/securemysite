import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PRICES = {
  report: process.env.STRIPE_REPORT_PRICE_ID!,      // $29
  agent_fix: process.env.STRIPE_AGENT_FIX_PRICE_ID!, // $149
} as const
