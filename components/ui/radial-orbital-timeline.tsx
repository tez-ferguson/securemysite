'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrbitalNode {
  id: number
  title: string
  description: string
  detail: string
  icon: React.ElementType
  relatedIds: number[]
  severity: 'critical' | 'high' | 'medium'
}

interface RadialOrbitalTimelineProps {
  nodes: OrbitalNode[]
}

const SEVERITY_STYLES: Record<OrbitalNode['severity'], string> = {
  critical: 'border-transparent bg-[#c0392b] text-white',
  high:     'border-[#e67e22] text-[#e67e22]',
  medium:   'border-[rgba(255,255,255,0.25)] text-white/60',
}

const SEVERITY_LABELS: Record<OrbitalNode['severity'], string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Common',
}

export default function RadialOrbitalTimeline({ nodes }: RadialOrbitalTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const [pulsingIds, setPulsingIds] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!autoRotate) return
    const id = setInterval(() => {
      setRotationAngle((a) => Number(((a + 0.25) % 360).toFixed(3)))
    }, 50)
    return () => clearInterval(id)
  }, [autoRotate])

  function toggleNode(id: number) {
    if (expandedId === id) {
      setExpandedId(null)
      setAutoRotate(true)
      setPulsingIds(new Set())
    } else {
      setExpandedId(id)
      setAutoRotate(false)
      const node = nodes.find((n) => n.id === id)
      setPulsingIds(new Set(node?.relatedIds ?? []))
      // Rotate so clicked node sits at top-front
      const idx = nodes.findIndex((n) => n.id === id)
      setRotationAngle(270 - (idx / nodes.length) * 360)
    }
  }

  function handleBgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === containerRef.current || (e.target as Element).classList.contains('orbit-bg')) {
      setExpandedId(null)
      setAutoRotate(true)
      setPulsingIds(new Set())
    }
  }

  function nodePosition(index: number) {
    const angle = ((index / nodes.length) * 360 + rotationAngle) % 360
    const rad = (angle * Math.PI) / 180
    const r = 200
    return {
      x: r * Math.cos(rad),
      y: r * Math.sin(rad),
      zIndex: Math.round(100 + 50 * Math.cos(rad)),
      opacity: Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(rad)) / 2))),
    }
  }

  return (
    <div
      ref={containerRef}
      className="orbit-bg w-full flex items-center justify-center overflow-hidden"
      style={{ height: '580px', background: '#0e0c0b' }}
      onClick={handleBgClick}
    >
      <div className="orbit-bg relative w-full max-w-4xl h-full flex items-center justify-center">
        {/* Orbit ring */}
        <div
          className="orbit-bg absolute pointer-events-none"
          style={{ width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(247,245,242,0.08)' }}
        />

        {/* Center orb — uses VibeSec crimson instead of purple gradients */}
        <div
          className="orbit-bg absolute flex items-center justify-center"
          style={{ width: 64, height: 64, zIndex: 10, pointerEvents: 'none' }}
        >
          <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(192,57,43,0.25)', animation: 'ping 1s ease-out infinite' }} />
          <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', border: '1px solid rgba(192,57,43,0.12)', animation: 'ping 1s ease-out infinite', animationDelay: '0.5s' }} />
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'radial-gradient(circle, #c0392b 0%, #7a1010 100%)', boxShadow: '0 0 24px rgba(192,57,43,0.5)' }} />
        </div>

        {/* Nodes */}
        {nodes.map((node, idx) => {
          const pos = nodePosition(idx)
          const isExpanded = expandedId === node.id
          const isPulsing = pulsingIds.has(node.id)
          const Icon = node.icon

          return (
            <div
              key={node.id}
              ref={(el) => { nodeRefs.current[node.id] = el }}
              style={{
                position: 'absolute',
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                zIndex: isExpanded ? 200 : pos.zIndex,
                opacity: isExpanded ? 1 : pos.opacity,
                transition: 'opacity 0.4s ease, z-index 0s',
                cursor: 'pointer',
              }}
              onClick={(e) => { e.stopPropagation(); toggleNode(node.id) }}
            >
              {/* Radial glow */}
              {isPulsing && (
                <div style={{ position: 'absolute', width: 56, height: 56, borderRadius: '50%', top: -8, left: -8, background: 'radial-gradient(circle, rgba(247,245,242,0.15) 0%, transparent 70%)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              )}

              {/* Node circle */}
              <div
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${isExpanded ? '#f7f5f2' : isPulsing ? 'rgba(247,245,242,0.7)' : 'rgba(247,245,242,0.3)'}`,
                  background: isExpanded ? '#f7f5f2' : isPulsing ? 'rgba(247,245,242,0.15)' : 'rgba(14,12,11,0.9)',
                  color: isExpanded ? '#111010' : '#f7f5f2',
                  transform: isExpanded ? 'scale(1.4)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: isExpanded ? '0 0 20px rgba(247,245,242,0.2)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon size={15} />
              </div>

              {/* Label */}
              <div
                style={{
                  position: 'absolute',
                  top: 46,
                  left: '50%',
                  transform: `translateX(-50%) ${isExpanded ? 'scale(1.15)' : 'scale(1)'}`,
                  whiteSpace: 'nowrap',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--sans)',
                  fontWeight: isExpanded ? 400 : 300,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: isExpanded ? '#f7f5f2' : 'rgba(247,245,242,0.55)',
                  transition: 'all 0.3s ease',
                }}
              >
                {node.title}
              </div>

              {/* Expanded card */}
              {isExpanded && (
                <Card
                  style={{
                    position: 'absolute',
                    top: 64,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 260,
                    background: 'rgba(14,12,11,0.95)',
                    border: '1px solid rgba(247,245,242,0.15)',
                    backdropFilter: 'blur(20px)',
                    animation: 'fadeUp 0.25s ease',
                  }}
                >
                  {/* Connector line */}
                  <div style={{ position: 'absolute', top: -12, left: '50%', width: 1, height: 12, background: 'rgba(247,245,242,0.3)' }} />

                  <CardHeader style={{ paddingBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Badge className={`px-2 text-xs border ${SEVERITY_STYLES[node.severity]}`}>
                        {SEVERITY_LABELS[node.severity]}
                      </Badge>
                    </div>
                    <CardTitle style={{ color: '#f7f5f2', fontSize: '0.9rem', fontFamily: 'var(--serif)', fontWeight: 400, letterSpacing: '-0.01em' }}>
                      {node.description}
                    </CardTitle>
                  </CardHeader>

                  <CardContent style={{ color: 'rgba(247,245,242,0.65)', fontSize: '0.78rem', lineHeight: 1.6, fontFamily: 'var(--sans)', fontWeight: 300 }}>
                    <p>{node.detail}</p>

                    {node.relatedIds.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(247,245,242,0.1)' }}>
                        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(247,245,242,0.35)', marginBottom: 8 }}>
                          Related vectors
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {node.relatedIds.map((rid) => {
                            const rel = nodes.find((n) => n.id === rid)
                            return (
                              <button
                                key={rid}
                                onClick={(e) => { e.stopPropagation(); toggleNode(rid) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: '1px solid rgba(247,245,242,0.15)', background: 'transparent', color: 'rgba(247,245,242,0.7)', fontSize: '0.7rem', fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(247,245,242,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f7f5f2' }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(247,245,242,0.7)' }}
                              >
                                {rel?.title}
                                <ArrowRight size={8} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
