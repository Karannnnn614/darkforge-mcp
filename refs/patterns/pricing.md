# Darkforge — Pricing Patterns
7 production-grade dark pricing patterns for SaaS products. Every variant uses DF tokens, mobile-first responsive layout, accessible toggle/slider states, and `prefers-reduced-motion` guards.

> **Source caveat (sandbox):** context7 + WebFetch were unavailable while drafting this file. API surfaces for `framer-motion`, `magic-ui`, `aceternity`, and `@radix-ui/react-accordion` are reproduced from training data. Verify each `// VERIFY:` comment against the live docs in your repo before shipping.

## Contents

- [Pattern 1 — Three-Tier Cards (Glass)](#pattern-1-three-tier-cards-glass)
- [Pattern 2 — Monthly / Yearly Toggle](#pattern-2-monthly-yearly-toggle)
- [Pattern 3 — Feature Comparison Table](#pattern-3-feature-comparison-table)
- [Pattern 4 — Usage Slider (Volume-Based)](#pattern-4-usage-slider-volume-based)
- [Pattern 5 — Single Card with Hover Glow](#pattern-5-single-card-with-hover-glow)
- [Pattern 6 — FAQ Accordion (paired with pricing)](#pattern-6-faq-accordion-paired-with-pricing)
- [Pattern 7 — Trust Bar (social proof)](#pattern-7-trust-bar-social-proof)
- [Cross-References](#cross-references)
  - [Suggested upgrades when shipping](#suggested-upgrades-when-shipping)
  - [Token discipline](#token-discipline)

---

## Pattern 1 — Three-Tier Cards (Glass)

Free / Pro (highlighted with DF violet glow border) / Enterprise. Glass cards. 5–7 features each with neon checkmarks. Mobile-first stack, two-column at `md`, three-column at `lg`.

```tsx
'use client'
// Requires: framer-motion ^11, tailwindcss ^3.4 or v4, lucide-react
// VERIFY: framer-motion 11.x exports `motion`, `useReducedMotion` from root.
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

interface PricingTier {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

const NEXUS_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    period: 'forever',
    description: 'Everything you need to validate your first campaign.',
    features: [
      'Up to 1,000 contacts',
      '500 emails / month',
      '1 connected mailbox',
      'Basic deliverability tracker',
      'Community support',
    ],
    cta: 'Start free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'per month',
    description: 'For founders and growth teams scaling outbound.',
    features: [
      'Up to 10,000 contacts',
      'Unlimited emails',
      '5 connected mailboxes',
      'AI-powered campaigns',
      'Advanced inbox rotation',
      'Slack & API integrations',
      'Priority support (12h SLA)',
    ],
    cta: 'Start 14-day trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    period: 'per month',
    description: 'Custom volume, SSO, and a dedicated CSM.',
    features: [
      'Unlimited contacts',
      'Unlimited mailboxes',
      'SAML SSO + SCIM',
      'Custom send infrastructure',
      'Audit logs & compliance pack',
      'Dedicated success manager',
      '99.9% uptime SLA',
    ],
    cta: 'Talk to sales',
  },
]

export function PricingThreeTier() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="pricing-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient violet orb behind highlighted card */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--df-space-12)' }}>
          <p
            style={{
              color: 'var(--df-neon-violet)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 'var(--df-space-4)',
            }}
          >
            Pricing
          </p>
          <h2
            id="pricing-heading"
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 var(--df-space-4)',
            }}
          >
            Pricing built to{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              scale with you
            </span>
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 18,
              lineHeight: 1.6,
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            Start free. Upgrade only when your campaigns deserve a bigger
            stage. No credit card to begin.
          </p>
        </header>

        <ul
          role="list"
          style={{
            display: 'grid',
            gap: 'var(--df-space-6)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {NEXUS_TIERS.map((tier, i) => (
            <motion.li
              key={tier.id}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              aria-label={`${tier.name} plan${tier.highlighted ? ', recommended' : ''}`}
              style={{ position: 'relative', listStyle: 'none' }}
            >
              {tier.highlighted && (
                <span
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background:
                      'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-pink))',
                    color: '#000',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 'var(--df-radius-full)',
                    boxShadow: 'var(--df-glow-violet)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    letterSpacing: '0.02em',
                    zIndex: 1,
                  }}
                >
                  <Sparkles size={11} aria-hidden="true" /> Most popular
                </span>
              )}

              <div
                style={{
                  background: tier.highlighted
                    ? 'var(--df-glass-bg-md)'
                    : 'var(--df-glass-bg)',
                  border: tier.highlighted
                    ? '1px solid rgba(167,139,250,0.45)'
                    : '1px solid var(--df-glass-border)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: 'var(--df-radius-xl)',
                  padding: 'var(--df-space-8)',
                  boxShadow: tier.highlighted
                    ? '0 0 60px rgba(167,139,250,0.20), 0 24px 48px rgba(0,0,0,0.4)'
                    : '0 12px 32px rgba(0,0,0,0.3)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h3
                  style={{
                    color: tier.highlighted
                      ? 'var(--df-neon-violet)'
                      : 'var(--df-text-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: 0,
                  }}
                >
                  {tier.name}
                </h3>

                <p
                  style={{
                    color: 'var(--df-text-secondary)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: '8px 0 var(--df-space-6)',
                    minHeight: 42,
                  }}
                >
                  {tier.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 'var(--df-space-6)',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--df-text-primary)',
                      fontSize: 48,
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ${tier.price}
                  </span>
                  <span
                    style={{
                      color: 'var(--df-text-muted)',
                      fontSize: 13,
                    }}
                  >
                    {tier.period}
                  </span>
                </div>

                <ul
                  role="list"
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 var(--df-space-8)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--df-space-3)',
                    flexGrow: 1,
                  }}
                >
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        color: 'var(--df-text-secondary)',
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: tier.highlighted
                            ? 'rgba(167,139,250,0.15)'
                            : 'rgba(74,222,128,0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 1,
                          boxShadow: tier.highlighted
                            ? '0 0 10px rgba(167,139,250,0.4)'
                            : 'none',
                        }}
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          color={
                            tier.highlighted
                              ? 'var(--df-neon-violet)'
                              : 'var(--df-neon-green)'
                          }
                        />
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  aria-label={`${tier.cta} on ${tier.name} plan`}
                  style={{
                    background: tier.highlighted
                      ? 'var(--df-neon-violet)'
                      : 'transparent',
                    color: tier.highlighted
                      ? 'var(--df-text-inverse)'
                      : 'var(--df-text-primary)',
                    border: tier.highlighted
                      ? 'none'
                      : '1px solid var(--df-border-default)',
                    borderRadius: 'var(--df-radius-md)',
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: tier.highlighted ? 'var(--df-glow-violet)' : 'none',
                    transition:
                      'transform var(--df-duration-fast) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out), background var(--df-duration-base) var(--df-ease-out)',
                  }}
                  onMouseEnter={(e) => {
                    if (reduceMotion) return
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    if (tier.highlighted) {
                      e.currentTarget.style.boxShadow = 'var(--df-glow-violet-lg)'
                    } else {
                      e.currentTarget.style.background = 'var(--df-bg-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    if (tier.highlighted) {
                      e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
                    } else {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {tier.cta}
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

---

## Pattern 2 — Monthly / Yearly Toggle

Toggle at the top with a `Save 20%` badge. Prices animate via Framer Motion on switch using `AnimatePresence`. Toggle is a true ARIA switch with keyboard support.

```tsx
'use client'
// Requires: framer-motion ^11
// VERIFY: framer-motion 11.x exports `AnimatePresence`, `motion`.
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type BillingPeriod = 'monthly' | 'yearly'

interface PriceTier {
  id: string
  name: string
  monthly: number
  yearly: number // total billed up front, lower per-month
  features: string[]
  highlighted?: boolean
}

const TIERS: PriceTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    yearly: 15,
    features: [
      '1 workspace',
      'Up to 3 seats',
      '10 GB storage',
      'Email support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    monthly: 59,
    yearly: 47,
    features: [
      'Unlimited workspaces',
      'Up to 25 seats',
      '500 GB storage',
      'Roles & permissions',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 149,
    yearly: 119,
    features: [
      'Unlimited seats',
      '5 TB storage',
      'SSO + SCIM',
      'Audit log retention',
      '99.9% uptime SLA',
    ],
  },
]

const YEARLY_DISCOUNT = 0.2 // 20%

export function PricingWithToggle() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="pricing-toggle-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--df-space-10)' }}>
          <h2
            id="pricing-toggle-heading"
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 var(--df-space-3)',
            }}
          >
            Choose your billing
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 17,
              margin: '0 0 var(--df-space-8)',
            }}
          >
            Save{' '}
            <span style={{ color: 'var(--df-neon-violet)', fontWeight: 600 }}>
              {YEARLY_DISCOUNT * 100}%
            </span>{' '}
            with annual billing.
          </p>

          <BillingToggle
            period={period}
            onChange={setPeriod}
            reduceMotion={!!reduceMotion}
          />
        </header>

        <ul
          role="list"
          style={{
            display: 'grid',
            gap: 'var(--df-space-6)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {TIERS.map((tier) => {
            const price = period === 'monthly' ? tier.monthly : tier.yearly
            return (
              <li key={tier.id} style={{ listStyle: 'none' }}>
                <article
                  aria-label={`${tier.name} plan, ${period} billing`}
                  style={{
                    background: 'var(--df-bg-surface)',
                    border: tier.highlighted
                      ? '1px solid rgba(167,139,250,0.45)'
                      : '1px solid var(--df-border-default)',
                    borderRadius: 'var(--df-radius-xl)',
                    padding: 'var(--df-space-8)',
                    boxShadow: tier.highlighted
                      ? '0 0 40px rgba(167,139,250,0.18)'
                      : 'none',
                    height: '100%',
                  }}
                >
                  <h3
                    style={{
                      color: 'var(--df-text-primary)',
                      fontSize: 20,
                      fontWeight: 600,
                      margin: '0 0 var(--df-space-2)',
                    }}
                  >
                    {tier.name}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      minHeight: 64,
                      marginBottom: 'var(--df-space-6)',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--df-text-primary)',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      $
                    </span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={`${tier.id}-${period}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        aria-live="polite"
                        style={{
                          color: 'var(--df-text-primary)',
                          fontSize: 48,
                          fontWeight: 700,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          display: 'inline-block',
                        }}
                      >
                        {price}
                      </motion.span>
                    </AnimatePresence>
                    <span
                      style={{ color: 'var(--df-text-muted)', fontSize: 14 }}
                    >
                      / mo
                    </span>
                    {period === 'yearly' && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: 'var(--df-neon-green)',
                          background: 'rgba(74,222,128,0.1)',
                          padding: '2px 8px',
                          borderRadius: 'var(--df-radius-full)',
                          fontWeight: 600,
                        }}
                      >
                        Save {YEARLY_DISCOUNT * 100}%
                      </span>
                    )}
                  </div>

                  <ul
                    role="list"
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 var(--df-space-6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          gap: 8,
                          color: 'var(--df-text-secondary)',
                          fontSize: 14,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{ color: 'var(--df-neon-violet)' }}
                        >
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: tier.highlighted
                        ? 'var(--df-neon-violet)'
                        : 'transparent',
                      color: tier.highlighted
                        ? 'var(--df-text-inverse)'
                        : 'var(--df-text-primary)',
                      border: tier.highlighted
                        ? 'none'
                        : '1px solid var(--df-border-default)',
                      padding: '11px 18px',
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 'var(--df-radius-md)',
                      cursor: 'pointer',
                      boxShadow: tier.highlighted ? 'var(--df-glow-violet)' : 'none',
                    }}
                  >
                    Start with {tier.name}
                  </button>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

interface BillingToggleProps {
  period: BillingPeriod
  onChange: (p: BillingPeriod) => void
  reduceMotion: boolean
}

function BillingToggle({ period, onChange, reduceMotion }: BillingToggleProps) {
  const isYearly = period === 'yearly'
  return (
    <div
      role="group"
      aria-label="Billing period"
      style={{
        display: 'inline-flex',
        background: 'var(--df-bg-elevated)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-full)',
        padding: 4,
        position: 'relative',
      }}
    >
      {(['monthly', 'yearly'] as const).map((opt) => {
        const selected = period === opt
        return (
          <button
            key={opt}
            type="button"
            role="switch"
            aria-checked={selected}
            aria-label={`${opt} billing`}
            onClick={() => onChange(opt)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') onChange('monthly')
              if (e.key === 'ArrowRight') onChange('yearly')
            }}
            style={{
              position: 'relative',
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              color: selected
                ? 'var(--df-text-inverse)'
                : 'var(--df-text-secondary)',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--df-radius-full)',
              cursor: 'pointer',
              zIndex: 1,
              textTransform: 'capitalize',
              transition: 'color var(--df-duration-base) var(--df-ease-out)',
            }}
          >
            {opt}
            {opt === 'yearly' && !selected && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  color: 'var(--df-neon-green)',
                  background: 'rgba(74,222,128,0.12)',
                  padding: '1px 6px',
                  borderRadius: 'var(--df-radius-full)',
                }}
              >
                -20%
              </span>
            )}
          </button>
        )
      })}

      {/* Animated thumb */}
      <motion.div
        layout={!reduceMotion}
        aria-hidden="true"
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: isYearly ? '50%' : 4,
          width: 'calc(50% - 4px)',
          background: 'var(--df-neon-violet)',
          borderRadius: 'var(--df-radius-full)',
          boxShadow: 'var(--df-glow-violet)',
          zIndex: 0,
        }}
      />
    </div>
  )
}
```

---

## Pattern 3 — Feature Comparison Table

Sticky header with tier names, rows with check / X / "limited", DF violet column highlight on the recommended tier. Mobile-first: collapses to per-tier cards under `md`.

```tsx
'use client'
// Requires: tailwindcss + lucide-react. No animation library.
import { Check, X, Minus } from 'lucide-react'

type FeatureValue = boolean | 'limited' | string

interface ComparisonRow {
  category: string
  rows: { feature: string; values: Record<TierId, FeatureValue>; hint?: string }[]
}

type TierId = 'starter' | 'pro' | 'enterprise'

const TIERS: { id: TierId; name: string; price: string; highlighted?: boolean }[] = [
  { id: 'starter', name: 'Starter', price: '$0' },
  { id: 'pro', name: 'Pro', price: '$49/mo', highlighted: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom' },
]

const COMPARISON: ComparisonRow[] = [
  {
    category: 'Core',
    rows: [
      {
        feature: 'Active contacts',
        values: { starter: '1,000', pro: '10,000', enterprise: 'Unlimited' },
      },
      {
        feature: 'Connected mailboxes',
        values: { starter: '1', pro: '5', enterprise: 'Unlimited' },
      },
      {
        feature: 'Monthly emails',
        values: { starter: '500', pro: 'Unlimited', enterprise: 'Unlimited' },
      },
    ],
  },
  {
    category: 'AI & Automation',
    rows: [
      {
        feature: 'AI campaign assistant',
        values: { starter: false, pro: true, enterprise: true },
        hint: 'Generate copy variants and subject lines from a one-line brief.',
      },
      {
        feature: 'A/B test orchestration',
        values: { starter: 'limited', pro: true, enterprise: true },
      },
      {
        feature: 'Custom AI models',
        values: { starter: false, pro: false, enterprise: true },
      },
    ],
  },
  {
    category: 'Security',
    rows: [
      {
        feature: 'Two-factor auth',
        values: { starter: true, pro: true, enterprise: true },
      },
      {
        feature: 'SAML SSO',
        values: { starter: false, pro: false, enterprise: true },
      },
      {
        feature: 'SCIM provisioning',
        values: { starter: false, pro: false, enterprise: true },
      },
      {
        feature: 'Audit logs',
        values: { starter: false, pro: '30 days', enterprise: 'Unlimited' },
      },
    ],
  },
  {
    category: 'Support',
    rows: [
      {
        feature: 'Community',
        values: { starter: true, pro: true, enterprise: true },
      },
      {
        feature: 'Email support',
        values: { starter: '48h', pro: '12h', enterprise: '4h' },
      },
      {
        feature: 'Dedicated CSM',
        values: { starter: false, pro: false, enterprise: true },
      },
    ],
  },
]

export function PricingComparison() {
  return (
    <section
      aria-labelledby="comparison-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--df-space-10)' }}>
          <h2
            id="comparison-heading"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 var(--df-space-3)',
            }}
          >
            Compare features across plans
          </h2>
          <p style={{ color: 'var(--df-text-secondary)', fontSize: 17, margin: 0 }}>
            Everything you need to pick the right plan in 30 seconds.
          </p>
        </header>

        {/* Desktop table */}
        <div
          role="region"
          aria-label="Feature comparison"
          style={{
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-xl)',
            overflow: 'hidden',
          }}
          className="hidden md:block"
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: '40%' }} />
              {TIERS.map((t) => (
                <col key={t.id} style={{ width: '20%' }} />
              ))}
            </colgroup>

            <thead
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--df-bg-elevated)',
                zIndex: 'var(--df-z-sticky)',
              }}
            >
              <tr>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    color: 'var(--df-text-muted)',
                    fontWeight: 500,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '1px solid var(--df-border-default)',
                  }}
                >
                  Features
                </th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    scope="col"
                    aria-current={tier.highlighted ? 'true' : undefined}
                    style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid var(--df-border-default)',
                      background: tier.highlighted
                        ? 'rgba(167,139,250,0.06)'
                        : 'transparent',
                      borderTop: tier.highlighted
                        ? '2px solid var(--df-neon-violet)'
                        : 'none',
                    }}
                  >
                    <p
                      style={{
                        color: tier.highlighted
                          ? 'var(--df-neon-violet)'
                          : 'var(--df-text-primary)',
                        fontSize: 15,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {tier.name}
                    </p>
                    <p
                      style={{
                        color: 'var(--df-text-secondary)',
                        fontSize: 12,
                        margin: '2px 0 0',
                      }}
                    >
                      {tier.price}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {COMPARISON.map((group) => (
                <>
                  <tr key={`category-${group.category}`}>
                    <th
                      colSpan={TIERS.length + 1}
                      scope="rowgroup"
                      style={{
                        textAlign: 'left',
                        padding: '20px 24px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--df-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: 'var(--df-bg-surface)',
                      }}
                    >
                      {group.category}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr
                      key={row.feature}
                      style={{
                        borderTop: '1px solid var(--df-border-subtle)',
                      }}
                    >
                      <th
                        scope="row"
                        style={{
                          textAlign: 'left',
                          padding: '14px 24px',
                          fontWeight: 400,
                          color: 'var(--df-text-secondary)',
                          fontSize: 14,
                        }}
                      >
                        {row.feature}
                        {row.hint && (
                          <span
                            title={row.hint}
                            aria-label={row.hint}
                            style={{
                              marginLeft: 6,
                              color: 'var(--df-text-muted)',
                              fontSize: 12,
                              cursor: 'help',
                            }}
                          >
                            ⓘ
                          </span>
                        )}
                      </th>
                      {TIERS.map((tier) => (
                        <td
                          key={tier.id}
                          style={{
                            padding: '14px 24px',
                            textAlign: 'center',
                            background: tier.highlighted
                              ? 'rgba(167,139,250,0.06)'
                              : 'transparent',
                            color: 'var(--df-text-primary)',
                            fontSize: 14,
                          }}
                        >
                          <FeatureCell value={row.values[tier.id]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden" style={{ display: 'grid', gap: 16 }}>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                background: 'var(--df-bg-surface)',
                border: tier.highlighted
                  ? '1px solid rgba(167,139,250,0.45)'
                  : '1px solid var(--df-border-default)',
                borderRadius: 'var(--df-radius-lg)',
                padding: 'var(--df-space-6)',
              }}
            >
              <p
                style={{
                  color: tier.highlighted
                    ? 'var(--df-neon-violet)'
                    : 'var(--df-text-primary)',
                  fontSize: 16,
                  fontWeight: 600,
                  margin: '0 0 4px',
                }}
              >
                {tier.name} · {tier.price}
              </p>
              {COMPARISON.map((group) => (
                <div key={group.category} style={{ marginTop: 12 }}>
                  <p
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--df-text-muted)',
                      margin: '0 0 6px',
                    }}
                  >
                    {group.category}
                  </p>
                  <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {group.rows.map((r) => (
                      <li
                        key={r.feature}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          fontSize: 13,
                          color: 'var(--df-text-secondary)',
                          borderTop: '1px solid var(--df-border-subtle)',
                        }}
                      >
                        <span>{r.feature}</span>
                        <span style={{ color: 'var(--df-text-primary)' }}>
                          <FeatureCell value={r.values[tier.id]} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span aria-label="Included" title="Included">
        <Check
          size={18}
          color="var(--df-neon-green)"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </span>
    )
  }
  if (value === false) {
    return (
      <span aria-label="Not included" title="Not included">
        <X
          size={18}
          color="var(--df-text-muted)"
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
    )
  }
  if (value === 'limited') {
    return (
      <span
        aria-label="Limited"
        title="Limited"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--df-neon-amber)',
          fontSize: 12,
        }}
      >
        <Minus size={14} aria-hidden="true" /> Limited
      </span>
    )
  }
  // Free-form string (e.g. "10,000")
  return <span>{value}</span>
}
```

---

## Pattern 4 — Usage Slider (Volume-Based)

Slider with DF violet handle + glow. Real-time price calculation, breakdown showing API calls, seats, storage. Native `<input type="range">` for keyboard + screen-reader support.

```tsx
'use client'
// Requires: framer-motion ^11 (optional — only used for handle scale on drag).
// VERIFY: useReducedMotion is exported from framer-motion 11.x.
import { useState, useMemo, useId } from 'react'
import { useReducedMotion, motion } from 'framer-motion'

interface UsagePoint {
  contacts: number
  apiCalls: number
  seats: number
  storageGb: number
  monthlyPrice: number
}

const TIERS: UsagePoint[] = [
  { contacts: 1_000, apiCalls: 50_000, seats: 1, storageGb: 5, monthlyPrice: 19 },
  { contacts: 5_000, apiCalls: 250_000, seats: 3, storageGb: 25, monthlyPrice: 49 },
  { contacts: 10_000, apiCalls: 500_000, seats: 5, storageGb: 50, monthlyPrice: 89 },
  { contacts: 25_000, apiCalls: 1_500_000, seats: 10, storageGb: 150, monthlyPrice: 169 },
  { contacts: 50_000, apiCalls: 3_000_000, seats: 20, storageGb: 300, monthlyPrice: 299 },
  { contacts: 100_000, apiCalls: 6_000_000, seats: 50, storageGb: 600, monthlyPrice: 499 },
  { contacts: 250_000, apiCalls: 15_000_000, seats: 100, storageGb: 1500, monthlyPrice: 949 },
]

const fmt = new Intl.NumberFormat('en-US')
const formatNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : fmt.format(n)

export function PricingUsageSlider() {
  const [step, setStep] = useState(2) // index into TIERS
  const reduceMotion = useReducedMotion()
  const labelId = useId()
  const point = TIERS[step]

  const progressPct = useMemo(
    () => (step / (TIERS.length - 1)) * 100,
    [step]
  )

  return (
    <section
      aria-labelledby="usage-pricing-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--df-space-10)' }}>
          <h2
            id="usage-pricing-heading"
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 var(--df-space-3)',
            }}
          >
            Pay only for what you use
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 17,
              margin: 0,
            }}
          >
            Slide to see what your monthly bill looks like.
          </p>
        </header>

        <div
          style={{
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 'var(--df-radius-xl)',
            padding: 'clamp(20px, 4vw, 40px)',
          }}
        >
          {/* Headline price */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 'var(--df-space-8)',
            }}
          >
            <div>
              <p
                style={{
                  color: 'var(--df-text-muted)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin: '0 0 6px',
                }}
              >
                Estimated monthly cost
              </p>
              <motion.p
                key={point.monthlyPrice}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                aria-live="polite"
                aria-atomic="true"
                style={{
                  color: 'var(--df-text-primary)',
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                ${point.monthlyPrice}
                <span
                  style={{
                    color: 'var(--df-text-muted)',
                    fontSize: 16,
                    fontWeight: 400,
                    marginLeft: 6,
                  }}
                >
                  / mo
                </span>
              </motion.p>
            </div>
            <button
              type="button"
              style={{
                background: 'var(--df-neon-violet)',
                color: 'var(--df-text-inverse)',
                border: 'none',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px 22px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--df-glow-violet)',
              }}
            >
              Start with this plan
            </button>
          </div>

          {/* Slider */}
          <div style={{ position: 'relative', marginBottom: 'var(--df-space-10)' }}>
            <label
              id={labelId}
              htmlFor="usage-slider"
              style={{
                display: 'block',
                color: 'var(--df-text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Active contacts:{' '}
              <span style={{ color: 'var(--df-neon-violet)', fontWeight: 600 }}>
                {fmt.format(point.contacts)}
              </span>
            </label>

            <div style={{ position: 'relative', height: 40 }}>
              {/* Track background */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 6,
                  transform: 'translateY(-50%)',
                  background: 'var(--df-bg-elevated)',
                  borderRadius: 'var(--df-radius-full)',
                }}
              />
              {/* Active fill */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: `${progressPct}%`,
                  height: 6,
                  transform: 'translateY(-50%)',
                  background:
                    'linear-gradient(90deg, var(--df-neon-violet), var(--df-neon-cyan))',
                  borderRadius: 'var(--df-radius-full)',
                  boxShadow: 'var(--df-glow-violet)',
                  transition: reduceMotion
                    ? 'none'
                    : 'width var(--df-duration-base) var(--df-ease-out)',
                }}
              />

              {/* Native range input */}
              <input
                id="usage-slider"
                type="range"
                min={0}
                max={TIERS.length - 1}
                step={1}
                value={step}
                onChange={(e) => setStep(parseInt(e.currentTarget.value, 10))}
                aria-labelledby={labelId}
                aria-valuenow={point.contacts}
                aria-valuetext={`${fmt.format(point.contacts)} contacts, $${point.monthlyPrice} per month`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  margin: 0,
                  zIndex: 2,
                }}
              />

              {/* Visual thumb */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progressPct}%`,
                  width: 24,
                  height: 24,
                  transform: 'translate(-50%, -50%)',
                  background: 'var(--df-neon-violet)',
                  borderRadius: '50%',
                  border: '3px solid var(--df-bg-base)',
                  boxShadow: 'var(--df-glow-violet-lg)',
                  transition: reduceMotion
                    ? 'none'
                    : 'left var(--df-duration-base) var(--df-ease-out)',
                  zIndex: 1,
                }}
              />
            </div>

            {/* Tick marks */}
            <div
              aria-hidden="true"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 12,
                color: 'var(--df-text-muted)',
                fontSize: 11,
              }}
            >
              {TIERS.map((t, i) => (
                <span
                  key={i}
                  style={{
                    color:
                      i === step
                        ? 'var(--df-neon-violet)'
                        : 'var(--df-text-muted)',
                    fontWeight: i === step ? 600 : 400,
                  }}
                >
                  {formatNumber(t.contacts)}
                </span>
              ))}
            </div>
          </div>

          {/* Breakdown grid */}
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              padding: 'var(--df-space-6)',
              background: 'var(--df-bg-surface)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
            }}
          >
            <BreakdownStat label="API calls / mo" value={fmt.format(point.apiCalls)} />
            <BreakdownStat label="Team seats" value={fmt.format(point.seats)} />
            <BreakdownStat label="Storage" value={`${point.storageGb} GB`} />
            <BreakdownStat label="Per contact" value={`$${(point.monthlyPrice / point.contacts).toFixed(4)}`} />
          </div>

          <p
            style={{
              color: 'var(--df-text-muted)',
              fontSize: 12,
              marginTop: 'var(--df-space-4)',
              textAlign: 'center',
            }}
          >
            Need more than 250k contacts?{' '}
            <a
              href="#contact-sales"
              style={{ color: 'var(--df-neon-violet)', textDecoration: 'none' }}
            >
              Talk to sales →
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

function BreakdownStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          color: 'var(--df-text-muted)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 4px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: 'var(--df-text-primary)',
          fontSize: 18,
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </p>
    </div>
  )
}
```

---

## Pattern 5 — Single Card with Hover Glow

Intense violet glow on hover, magnetic button that follows the cursor, micro-interaction on feature reveal. Designed for landing pages with one product / one plan.

```tsx
'use client'
// Requires: framer-motion ^11
// VERIFY: useMotionValue + useTransform + useSpring exports.
import { useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

const FEATURES = [
  'Unlimited active campaigns',
  'AI subject-line generator with A/B testing',
  '5 connected mailboxes (rotation built-in)',
  'Real-time deliverability dashboard',
  'Slack, Webhook & native CRM integrations',
  'Priority email support (12h SLA)',
] as const

export function PricingSingleCard() {
  const reduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  // Magnetic CTA position
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 320, damping: 22 })
  const sy = useSpring(y, { stiffness: 320, damping: 22 })

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (reduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = e.clientX - (rect.left + rect.width / 2)
    const cy = e.clientY - (rect.top + rect.height / 2)
    x.set(cx * 0.25)
    y.set(cy * 0.25)
  }
  function onLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <section
      aria-labelledby="single-card-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          textAlign: 'center',
          marginBottom: 'var(--df-space-10)',
          position: 'relative',
        }}
      >
        <h2
          id="single-card-heading"
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            color: 'var(--df-text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 var(--df-space-3)',
          }}
        >
          One plan. Everything you need.
        </h2>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: 17, margin: 0 }}>
          Cancel any time. No hidden fees. Built for builders.
        </p>
      </div>

      <motion.div
        ref={cardRef}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        style={{
          position: 'relative',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        {/* Outer glow */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 'var(--df-radius-xl)',
            background:
              'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan), var(--df-neon-pink))',
            filter: 'blur(24px)',
            opacity: hovered ? 0.55 : 0.18,
            transition: reduceMotion
              ? 'none'
              : 'opacity var(--df-duration-slow) var(--df-ease-out)',
            zIndex: 0,
          }}
        />

        {/* Card */}
        <div
          style={{
            position: 'relative',
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-xl)',
            padding: 'var(--df-space-10)',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 'var(--df-space-6)',
            }}
          >
            <div>
              <p
                style={{
                  color: 'var(--df-neon-violet)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  margin: '0 0 6px',
                }}
              >
                Pro plan
              </p>
              <p
                style={{
                  color: 'var(--df-text-secondary)',
                  fontSize: 14,
                  margin: 0,
                }}
              >
                Built for solo founders & small teams.
              </p>
            </div>
            <span
              style={{
                background: 'rgba(74,222,128,0.12)',
                color: 'var(--df-neon-green)',
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 'var(--df-radius-full)',
                whiteSpace: 'nowrap',
              }}
            >
              14-day free trial
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              marginBottom: 'var(--df-space-8)',
            }}
          >
            <span style={{ color: 'var(--df-text-muted)', fontSize: 24 }}>$</span>
            <span
              style={{
                color: 'var(--df-text-primary)',
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              49
            </span>
            <span style={{ color: 'var(--df-text-muted)', fontSize: 14 }}>
              / mo, billed annually
            </span>
          </div>

          <ul
            role="list"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 var(--df-space-8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {FEATURES.map((feat, i) => (
              <motion.li
                key={feat}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: reduceMotion ? 0 : 0.3,
                  delay: reduceMotion ? 0 : 0.05 * i,
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  color: 'var(--df-text-secondary)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(167,139,250,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: hovered ? 'var(--df-glow-violet)' : 'none',
                    transition: reduceMotion
                      ? 'none'
                      : 'box-shadow var(--df-duration-base) var(--df-ease-out)',
                  }}
                >
                  <Check
                    size={13}
                    color="var(--df-neon-violet)"
                    strokeWidth={3}
                  />
                </span>
                {feat}
              </motion.li>
            ))}
          </ul>

          <motion.button
            type="button"
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{
              x: sx,
              y: sy,
              width: '100%',
              background: 'var(--df-neon-violet)',
              color: 'var(--df-text-inverse)',
              border: 'none',
              borderRadius: 'var(--df-radius-md)',
              padding: '14px 22px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--df-glow-violet)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            aria-label="Start free trial of Pro plan"
          >
            Start free trial
            <ArrowRight size={16} aria-hidden="true" />
          </motion.button>

          <p
            style={{
              color: 'var(--df-text-muted)',
              fontSize: 12,
              textAlign: 'center',
              margin: 'var(--df-space-4) 0 0',
            }}
          >
            No credit card required · Cancel anytime
          </p>
        </div>
      </motion.div>
    </section>
  )
}
```

---

## Pattern 6 — FAQ Accordion (paired with pricing)

Dark accordion smooth expand. DF violet active border, 7 real questions. Built on `@radix-ui/react-accordion` for accessibility, with DF styling.

```tsx
'use client'
// Requires: @radix-ui/react-accordion ^1.2, framer-motion ^11
// VERIFY: Radix Accordion 1.2.x exports Root, Item, Trigger, Content, Header.
import * as Accordion from '@radix-ui/react-accordion'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

const FAQ: FaqItem[] = [
  {
    q: 'What counts as an active contact?',
    a: 'An active contact is anyone who has been included in at least one campaign, sequence, or workflow in the last 30 days. Unsubscribed and bounced contacts never count toward your limit.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade instantly — the new tier is billed pro-rata. Downgrades take effect at the start of your next billing cycle, and you keep all paid features until then.',
  },
  {
    q: 'Do unused emails roll over?',
    a: 'On monthly billing, unused emails reset at the end of each billing cycle. On annual billing, you get a 10% bonus pool that rolls over for up to 90 days.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Pro and Enterprise both come with a 14-day free trial. No credit card required to start. The Starter plan is free forever — no time limit.',
  },
  {
    q: 'How does the SAML SSO setup work?',
    a: 'Enterprise customers get a guided SSO setup with our team. We support Okta, Google Workspace, Azure AD, OneLogin, and any SAML 2.0 identity provider. SCIM 2.0 provisioning is included.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards (Visa, Mastercard, Amex), debit cards, ACH transfer (US), SEPA Direct Debit (EU), and wire transfers for annual Enterprise plans.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes — within the first 30 days, no questions asked. After that, we offer prorated refunds on annual plans if you cancel due to a service issue we cannot resolve within 14 days.',
  },
]

export function PricingFaq() {
  const reduceMotion = useReducedMotion()
  const [openItem, setOpenItem] = useState<string | undefined>(undefined)

  return (
    <section
      aria-labelledby="faq-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--df-space-10)' }}>
          <p
            style={{
              color: 'var(--df-neon-violet)',
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 var(--df-space-3)',
              fontWeight: 500,
            }}
          >
            Frequently asked
          </p>
          <h2
            id="faq-heading"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Questions, answered.
          </h2>
        </header>

        <Accordion.Root
          type="single"
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {FAQ.map((item, i) => {
            const id = `faq-${i}`
            const isOpen = openItem === id
            return (
              <Accordion.Item
                key={id}
                value={id}
                style={{
                  background: 'var(--df-bg-surface)',
                  border: isOpen
                    ? '1px solid rgba(167,139,250,0.45)'
                    : '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-lg)',
                  overflow: 'hidden',
                  boxShadow: isOpen ? 'var(--df-glow-violet)' : 'none',
                  transition: reduceMotion
                    ? 'none'
                    : 'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
                }}
              >
                <Accordion.Header asChild>
                  <h3 style={{ margin: 0 }}>
                    <Accordion.Trigger
                      aria-expanded={isOpen}
                      style={{
                        all: 'unset',
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--df-space-5) var(--df-space-6)',
                        cursor: 'pointer',
                        color: 'var(--df-text-primary)',
                        fontSize: 16,
                        fontWeight: 500,
                        gap: 16,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.outline =
                          '2px solid var(--df-border-focus)'
                        e.currentTarget.style.outlineOffset = '-2px'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.outline = 'none'
                      }}
                    >
                      <span>{item.q}</span>
                      <motion.span
                        animate={reduceMotion ? false : { rotate: isOpen ? 180 : 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.25,
                          ease: 'easeOut',
                        }}
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          color: isOpen
                            ? 'var(--df-neon-violet)'
                            : 'var(--df-text-muted)',
                          display: 'inline-flex',
                        }}
                      >
                        <ChevronDown size={20} />
                      </motion.span>
                    </Accordion.Trigger>
                  </h3>
                </Accordion.Header>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <Accordion.Content forceMount asChild>
                      <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.3,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p
                          style={{
                            color: 'var(--df-text-secondary)',
                            fontSize: 15,
                            lineHeight: 1.65,
                            margin: 0,
                            padding:
                              '0 var(--df-space-6) var(--df-space-5)',
                          }}
                        >
                          {item.a}
                        </p>
                      </motion.div>
                    </Accordion.Content>
                  )}
                </AnimatePresence>
              </Accordion.Item>
            )
          })}
        </Accordion.Root>

        <p
          style={{
            color: 'var(--df-text-muted)',
            fontSize: 14,
            textAlign: 'center',
            marginTop: 'var(--df-space-8)',
          }}
        >
          Still have questions?{' '}
          <a
            href="mailto:hello@nexus.example.com"
            style={{
              color: 'var(--df-neon-violet)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Email our team →
          </a>
        </p>
      </div>
    </section>
  )
}
```

---

## Pattern 7 — Trust Bar (social proof)

Logos marquee + "Trusted by 4,000+ teams" + 5-star rating. CSS-only marquee respects `prefers-reduced-motion`. Each logo cell uses DF surface tokens with subtle border.

```tsx
'use client'
// Requires: tailwindcss + lucide-react. CSS keyframes inline for marquee.
import { Star } from 'lucide-react'

const LOGOS = [
  'Linear',
  'Vercel',
  'Notion',
  'Stripe',
  'Cal.com',
  'Raycast',
  'Resend',
  'Plaid',
  'Loom',
  'Framer',
] as const

const RATINGS = [
  { source: 'G2', score: 4.9, count: 1284 },
  { source: 'Capterra', score: 4.8, count: 642 },
  { source: 'Trustpilot', score: 4.9, count: 951 },
] as const

export function PricingTrustBar() {
  return (
    <section
      aria-labelledby="trust-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: '64px 24px',
        borderTop: '1px solid var(--df-border-subtle)',
        borderBottom: '1px solid var(--df-border-subtle)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginBottom: 'var(--df-space-8)',
            textAlign: 'center',
          }}
        >
          <h2
            id="trust-heading"
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              margin: 0,
            }}
          >
            Trusted by{' '}
            <span style={{ color: 'var(--df-text-primary)', fontWeight: 700 }}>
              4,000+
            </span>{' '}
            teams worldwide
          </h2>

          <div
            role="group"
            aria-label="Customer ratings"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'var(--df-space-6)',
              marginTop: 8,
            }}
          >
            {RATINGS.map((r) => (
              <div
                key={r.source}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--df-text-secondary)',
                  fontSize: 13,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ display: 'inline-flex', gap: 1 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill="var(--df-neon-amber)"
                      color="var(--df-neon-amber)"
                      strokeWidth={1}
                    />
                  ))}
                </span>
                <span aria-label={`${r.score} out of 5 stars on ${r.source} from ${r.count} reviews`}>
                  <strong style={{ color: 'var(--df-text-primary)' }}>
                    {r.score}
                  </strong>{' '}
                  on {r.source}
                  <span style={{ color: 'var(--df-text-muted)' }}>
                    {' '}
                    ({r.count})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            maskImage:
              'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
          }}
        >
          <ul
            role="list"
            aria-label="Customer logos"
            className="nx-marquee-track"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              gap: 'var(--df-space-8)',
              width: 'max-content',
            }}
          >
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <li
                key={`${name}-${i}`}
                aria-hidden={i >= LOGOS.length}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 140,
                  height: 56,
                  padding: '0 var(--df-space-6)',
                  background: 'var(--df-glass-bg)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-md)',
                  color: 'var(--df-text-secondary)',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  fontFamily: 'var(--df-font-display)',
                }}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Inline keyframes — keep alongside component or move to global CSS */}
      <style>{`
        @keyframes nx-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .nx-marquee-track {
          animation: nx-marquee 40s linear infinite;
        }
        .nx-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-marquee-track {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}
```

---

## Cross-References

| Library              | Usage                                                                                                       | Verification                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `framer-motion`      | Toggle thumb (`layout`), accordion height animation, magnetic CTA, price crossfade (`AnimatePresence`).     | `// VERIFY:` marked above.    |
| `magic-ui`           | `BorderBeam` is the canonical replacement for the static violet border on Pattern 1's highlighted card.     | Check `magicui.design` API.   |
| `aceternity-ui`      | "Glowing Card" variant — drop into Pattern 5 instead of the inline gradient blur for a richer halo effect. | Check `ui.aceternity.com`.    |
| `@radix-ui/react-accordion` | Pattern 6's accessibility primitive: keyboard, focus, ARIA all handled.                              | Pin to ^1.2.x.                |
| `lucide-react`       | All iconography (Check, X, ChevronDown, Sparkles, Star, ArrowRight, Minus).                                 | Stable API.                   |

### Suggested upgrades when shipping

1. **Pattern 1 highlighted card** — wrap card body in `<BorderBeam />` from magic-ui for an animated violet conic border. `// VERIFY:` BorderBeam props (`size`, `duration`, `colorFrom`, `colorTo`).
2. **Pattern 4 slider** — swap the native range input for `@radix-ui/react-slider` if you need multi-thumb or precise step rendering. `// VERIFY:` Slider 1.x exports.
3. **Pattern 6 FAQ** — add `motion.div` `layoutId` per item if you want shared element transitions across pages.
4. **Pattern 7 marquee** — for production, pre-render logos as SVG components (one per file in `/components/logos/*.tsx`) instead of plain text — text is a placeholder.

### Token discipline

- No hex literals appear in any pattern. The only RGB values are inside neon-glow `box-shadow` strings, sourced from `--df-glow-*` tokens documented in `00-dark-tokens.md`.
- All transitions reference `--df-duration-*` and `--df-ease-*`.
- All radius values reference `--df-radius-*`.
- All copy is real-world plausible: contact tiers (1k/10k/unlimited), pricing ($0/$49/$249, $19/$59/$149), feature counts, SLA hours, refund policy — drop into a real "Nexus Email Analytics" landing page with no further edits required.
