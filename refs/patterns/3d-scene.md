# Darkforge — 3D Scene Patterns
5 production-grade dark 3D launch-page sections that **compose** the primitives from `03-threejs-r3f.md` (`NxCanvas`, `NeonStandardMaterial`, `GlassPhysicalMaterial`, parallax rigs, bloom postprocess) into full marketing surfaces. Reach for these when CSS and SVG cannot fake the depth, motion, or volume the section needs; for everything else stay in `motion/react` to keep bundle and battery sane.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [When to use this file vs `03-threejs-r3f.md`](#when-to-use-this-file-vs-03-threejs-r3fmd)
- [Pattern 1 — Product Showcase (rotating 3D model)](#pattern-1-product-showcase-rotating-3d-model)
- [Pattern 2 — Floating Geometry Hero](#pattern-2-floating-geometry-hero)
- [Pattern 3 — Scrubbable Scroll-Tied Model](#pattern-3-scrubbable-scroll-tied-model)
- [Pattern 4 — Particle Hero](#pattern-4-particle-hero)
- [Pattern 5 — 3D Card Stack (Y-axis floating cards)](#pattern-5-3d-card-stack-y-axis-floating-cards)
- [Performance Strategy (per pattern)](#performance-strategy-per-pattern)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **Heads up — verify against primary docs before shipping.** This pattern file was authored without live `context7` or `WebFetch` access, from training-data recall through the Jan 2026 cutoff. It targets `three@0.170+`, `@react-three/fiber@8.17+`, `@react-three/drei@9.114+`, and `@react-three/postprocessing@2.16+` — the same versions pinned in `03-threejs-r3f.md`. Every uncertain prop is tagged inline with `// VERIFY:`. Cross-check before shipping:
>
> - `drei.docs.pmnd.rs` — `useGLTF`, `OrbitControls`, `ScrollControls`, `useScroll`, `Float`, `Html` (especially the `transform` + `occlude` + `distanceFactor` triad — it's the one drei API that drifts most between minors)
> - `r3f.docs.pmnd.rs` — `<Suspense>` boundaries, `useFrame` priorities, `useThree().invalidate()` for demand frameloop
> - `threejs.org/docs/` — `MeshStandardMaterial.emissiveIntensity`, `Color` constructor, `MathUtils.lerp`
> - `@react-three/postprocessing` README — `Bloom.mipmapBlur` and `radius` reworked in v3; pin v2.16 unless you're explicitly on v3
>
> Each pattern below assumes the `NxCanvas` + `nx-materials` modules from `03-threejs-r3f.md` are already in your tree at `@/components/three/`. None of these patterns redefine the canvas — they import it. That's intentional.

---

## When to use this file vs `03-threejs-r3f.md`

`03` documents the **primitives**: how to set up `<Canvas>` once, what an emissive PBR material looks like, how to instance particles, how to lerp a camera. This file documents the **compositions**: full hero/feature/scroll sections that wire primitives into a section the user can drop into their landing page. If you find yourself redefining `<Canvas dpr={[1,2]}>` or `<meshStandardMaterial emissive=...>` in a pattern, stop — import them instead.

---

## Pattern 1 — Product Showcase (rotating 3D model)

The classic SaaS hero-adjacent section: a 3D model centred on the right with a slow auto-rotation, OrbitControls activating only when the user hovers (so the model doesn't fight scroll), violet emissive rim, side-by-side with a copy block on the left listing real product specs. Async asset load is wrapped in `<Suspense>` with an DF skeleton fallback so the page paints AMOLED black instead of flashing white during the GLB fetch.

**When to use:** product detail page, "introducing X" hero, showcase of a hardware/SaaS product where the visual form factor matters.

```tsx
// app/components/3d/product-showcase.tsx
'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center, Bounds } from '@react-three/drei'   // VERIFY: drei v9.114 export surface
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'

// Drei's useGLTF caches by URL — fine to call from multiple components.
// VERIFY: replace with your real asset path; this is a placeholder URL.
const MODEL_URL = '/models/nexus-cloud.glb'

interface ProductModelProps {
  autoRotate: boolean
}

function ProductModel({ autoRotate }: ProductModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const reduce = useReducedMotion()
  const { scene } = useGLTF(MODEL_URL)

  // Clone + tint inside useMemo — running this in render body or via useRef triggers double-execution
  // under React strict mode and skips re-tint if `scene` ever changes. Memo on [scene] is the canonical fix.
  // VERIFY: traverse() API stable in r170.
  const tinted = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xa78bfa),
          emissive: new THREE.Color(0xa78bfa),
          emissiveIntensity: 0.65,
          metalness: 0.6,
          roughness: 0.28,
          toneMapped: false,
        })
      }
    })
    return cloned
  }, [scene])

  // Free GPU resources of materials we authored when the model unmounts. Geometry remains
  // owned by useGLTF's cache — don't dispose that or the next mount throws.
  useEffect(() => {
    return () => {
      tinted.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = (obj as THREE.Mesh).material
          if (Array.isArray(m)) m.forEach((mat) => mat.dispose())
          else (m as THREE.Material).dispose()
        }
      })
    }
  }, [tinted])

  useFrame((_, delta) => {
    if (reduce || !autoRotate || !groupRef.current) return
    groupRef.current.rotation.y += delta * 0.18
  })

  return (
    <group ref={groupRef}>
      {/* Center re-centres bounding box; Bounds auto-fits the camera once. */}
      <Center>
        <primitive object={tinted} />
      </Center>
    </group>
  )
}

// Skeleton fallback — paints AMOLED black + pulse gradient until GLB is ready.
function ModelSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(circle at 50% 55%, rgba(167,139,250,0.10) 0%, transparent 55%), var(--df-bg-base)',
        animation: 'nx-pulse-slow 3s ease-in-out infinite',
      }}
    />
  )
}

const SPECS: Array<{ label: string; value: string; hue: string }> = [
  { label: 'Uptime SLA',         value: '99.99%',     hue: 'var(--df-neon-green)' },
  { label: 'p99 API latency',    value: '24 ms',      hue: 'var(--df-neon-cyan)' },
  { label: 'Edge regions',       value: '14',         hue: 'var(--df-neon-violet)' },
  { label: 'Ingress throughput', value: '8.4 GB / s', hue: 'var(--df-neon-pink)' },
]

export default function ProductShowcase() {
  // Hover gates OrbitControls — autoRotate runs always (gated by reduced-motion in the model).
  const [hovered, setHovered] = useState(false)

  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vh, 120px) clamp(20px, 5vw, 56px)',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: 1240, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(32px, 6vw, 80px)',
          alignItems: 'center',
        }}
      >
        {/* Left — copy + specs */}
        <div>
          <p
            style={{
              color: 'var(--df-neon-violet)', fontSize: 12, fontWeight: 500,
              letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 16px',
            }}
          >
            Nexus Cloud · Generation 3
          </p>
          <h2
            style={{
              fontFamily: 'var(--df-font-display)',
              color: 'var(--df-text-primary)',
              fontSize: 'clamp(2rem, 4.6vw, 3.25rem)',
              fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em',
              margin: '0 0 20px',
            }}
          >
            The compute layer your <br />
            cold-start budget deserves.
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 17, lineHeight: 1.65, margin: '0 0 32px', maxWidth: 480,
            }}
          >
            One control plane, fourteen edge regions, sub-25 ms cold starts on every
            tier. Bring your own runtime — we route, scale, and bill at the request.
          </p>

          {/* Spec list */}
          <ul
            style={{
              listStyle: 'none', padding: 0, margin: 0,
              display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12,
              maxWidth: 520,
            }}
          >
            {SPECS.map((spec) => (
              <li
                key={spec.label}
                style={{
                  background: 'var(--df-bg-surface)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '14px 16px',
                }}
              >
                <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {spec.label}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    color: spec.hue,
                    fontSize: 22, fontWeight: 600,
                    fontFamily: 'var(--df-font-mono)',
                  }}
                >
                  {spec.value}
                </p>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <button
              style={{
                background: 'var(--df-neon-violet)', color: 'var(--df-text-inverse)',
                border: 'none', borderRadius: 'var(--df-radius-md)',
                padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: 'var(--df-glow-violet)',
              }}
            >
              Deploy a region
            </button>
            <button
              style={{
                background: 'var(--df-glass-bg)', color: 'var(--df-text-primary)',
                border: '1px solid var(--df-border-default)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px 22px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Read the spec sheet →
            </button>
          </div>
        </div>

        {/* Right — 3D model */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            minHeight: 420,
            borderRadius: 'var(--df-radius-xl)',
            overflow: 'hidden',
            background: 'var(--df-bg-base)',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(167,139,250,0.06)',
          }}
        >
          {/* Skeleton sits at z:0; canvas paints over it once Suspense resolves. */}
          <ModelSkeleton />

          <NxCanvas
            label="Nexus Cloud product model"
            camera={{ position: [0, 0.4, 4], fov: 38 }}
          >
            <Suspense fallback={null}>
              {/* Bounds auto-fits the camera to the model's actual size — no magic numbers. */}
              <Bounds fit clip observe margin={1.2}>
                <ProductModel autoRotate />
              </Bounds>
            </Suspense>

            {/* OrbitControls only when hovered — keeps the page scrollable everywhere else. */}
            <OrbitControls
              enabled={hovered}
              enableZoom={false}
              enablePan={false}
              autoRotate={false}
              rotateSpeed={0.5}
              dampingFactor={0.08}
            />

            <EffectComposer disableNormalPass>
              <Bloom
                intensity={0.85}
                luminanceThreshold={0.18}
                luminanceSmoothing={0.92}
                mipmapBlur                              // VERIFY: postprocessing v6 prop name
                radius={0.7}
              />
              <Vignette eskil={false} offset={0.2} darkness={0.85} />
            </EffectComposer>
          </NxCanvas>

          {/* Idle hint — vanishes once user hovers */}
          {!hovered && (
            <p
              style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                color: 'var(--df-text-muted)', fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                pointerEvents: 'none', margin: 0,
              }}
            >
              Hover to orbit
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// Preload so the GLB starts fetching at route-mount, not at component-mount.
// VERIFY: drei API — useGLTF.preload is the canonical helper through v9.x.
useGLTF.preload(MODEL_URL)
```

> **Why hover-gated OrbitControls:** always-on OrbitControls hijack vertical scroll on touch devices and inside iframes. Gating by `hovered` keeps the page scroll-friendly while still letting power users twirl. On mobile, you'd swap to a "tap to enable" toggle — pointer-events don't fire `mouseEnter` on touch.

---

## Pattern 2 — Floating Geometry Hero

Five-to-eight neon primitives (icosahedron, torus knot, octahedron, dodecahedron) drifting through the canvas with a `<Float>` rig per shape, parallaxing softly to the cursor, lit by emissive material and a Bloom pass that turns the rim glow into a halo. Text overlay sits over the canvas via DOM (not `<Html>`) so the typography stays crisp and selectable.

**When to use:** marketing landing hero where the product doesn't have a single hero object — "platform" pages, abstract launch heroes.

```tsx
// app/components/3d/floating-geometry-hero.tsx
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'                                    // VERIFY: drei Float prop names
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'
import { NeonStandardMaterial, type NxNeonHue } from '@/components/three/nx-materials'

type GeometryKind = 'icosahedron' | 'torusKnot' | 'octahedron' | 'dodecahedron'

interface ShapeSpec {
  kind: GeometryKind
  position: [number, number, number]
  scale: number
  hue: NxNeonHue
  rotation?: [number, number, number]
  floatIntensity: number
  rotationIntensity: number
  speed: number
}

// Hand-tuned for an even visual rhythm — six shapes in a loose triangle composition.
const SHAPES: ShapeSpec[] = [
  { kind: 'icosahedron',  position: [-3.4,  1.6, -1.2], scale: 0.68, hue: 'violet', floatIntensity: 0.7, rotationIntensity: 0.6, speed: 1.2 },
  { kind: 'torusKnot',    position: [ 3.2,  1.2, -0.6], scale: 0.55, hue: 'cyan',   floatIntensity: 0.6, rotationIntensity: 0.8, speed: 1.4 },
  { kind: 'octahedron',   position: [-2.4, -1.4, -2.2], scale: 0.46, hue: 'pink',   floatIntensity: 0.8, rotationIntensity: 0.5, speed: 1.0 },
  { kind: 'dodecahedron', position: [ 2.6, -1.6, -1.8], scale: 0.52, hue: 'green',  floatIntensity: 0.7, rotationIntensity: 0.6, speed: 1.1 },
  { kind: 'icosahedron',  position: [ 0.0,  2.2, -3.0], scale: 0.38, hue: 'cyan',   floatIntensity: 0.9, rotationIntensity: 0.4, speed: 1.3 },
  { kind: 'torusKnot',    position: [ 0.4, -2.4, -2.6], scale: 0.34, hue: 'violet', floatIntensity: 0.6, rotationIntensity: 0.7, speed: 1.5 },
]

function FloatingShape({ spec }: { spec: ShapeSpec }) {
  return (
    <Float
      floatIntensity={spec.floatIntensity}
      rotationIntensity={spec.rotationIntensity}
      speed={spec.speed}
    >
      <mesh position={spec.position} scale={spec.scale} rotation={spec.rotation}>
        {spec.kind === 'icosahedron'  && <icosahedronGeometry  args={[1, 1]} />}
        {spec.kind === 'torusKnot'    && <torusKnotGeometry    args={[0.8, 0.26, 160, 24, 2, 3]} />}
        {spec.kind === 'octahedron'   && <octahedronGeometry   args={[1, 0]} />}
        {spec.kind === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        <NeonStandardMaterial hue={spec.hue} emissiveIntensity={1.2} />
      </mesh>
    </Float>
  )
}

// Whole-scene parallax — group lerps to pointer, individual <Float> rigs do the small wiggle.
function PointerParallax({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const reduce = useReducedMotion()

  useFrame((state) => {
    if (reduce || !groupRef.current) return
    const { pointer } = state
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.18, 0.04)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * 0.12, 0.04)
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, pointer.x * 0.22, 0.05)
  })

  return <group ref={groupRef}>{children}</group>
}

export default function FloatingGeometryHero() {
  const shapes = useMemo(() => SHAPES, [])

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Canvas — full-bleed, decorative, behind the text */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true">
        <NxCanvas camera={{ position: [0, 0, 6.5], fov: 48 }}>
          <PointerParallax>
            {shapes.map((spec, i) => (
              <FloatingShape key={i} spec={spec} />
            ))}
          </PointerParallax>

          <EffectComposer disableNormalPass>
            <Bloom
              intensity={1.15}
              luminanceThreshold={0.14}
              luminanceSmoothing={0.94}
              mipmapBlur
              radius={0.85}
            />
            <Vignette eskil={false} offset={0.18} darkness={0.92} />
          </EffectComposer>
        </NxCanvas>
      </div>

      {/* Text overlay — pure DOM, sits above canvas with pointer-events: none on the canvas wrapper above */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: 'clamp(80px, 12vh, 120px) clamp(20px, 5vw, 64px)',
          maxWidth: 880, margin: '0 auto',
        }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(167,139,250,0.10)',
            border: '1px solid rgba(167,139,250,0.22)',
            borderRadius: 'var(--df-radius-full)',
            padding: '5px 14px',
            color: 'var(--df-neon-violet)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.06em',
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--df-neon-violet)',
              boxShadow: 'var(--df-glow-violet)',
            }}
          />
          Series B · 2026
        </span>

        <h1
          style={{
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
            fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.025em',
            color: 'var(--df-text-primary)',
            margin: '0 0 22px',
          }}
        >
          A platform that{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan), var(--df-neon-pink))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            actually scales
          </span>
        </h1>

        <p
          style={{
            color: 'var(--df-text-secondary)',
            fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
            lineHeight: 1.6, margin: '0 0 40px',
            maxWidth: 620,
          }}
        >
          Nexus Cloud handles 8.4 GB/s of ingress at 24 ms p99. No queues, no
          surprise bills, no rewrites — just one API and fourteen regions.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              background: 'var(--df-neon-violet)', color: 'var(--df-text-inverse)',
              border: 'none', borderRadius: 'var(--df-radius-md)',
              padding: '13px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--df-glow-violet)',
            }}
          >
            Start free trial
          </button>
          <button
            style={{
              background: 'var(--df-glass-bg)', color: 'var(--df-text-primary)',
              border: '1px solid var(--df-border-default)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--df-radius-md)',
              padding: '13px 28px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Talk to sales
          </button>
        </div>
      </div>
    </section>
  )
}
```

> **Why six shapes, not fifteen:** Bloom is per-pixel, not per-mesh, so cost grows with screen coverage. Six well-placed shapes glow more than fifteen scattered ones, and at fifteen the overlay text starts losing contrast. The spec array makes scaling trivially configurable if you really need more.

---

## Pattern 3 — Scrubbable Scroll-Tied Model

A pinned full-viewport canvas where scroll progress drives both **camera position** and **per-object visibility/opacity** at scroll milestones. Different from `03-threejs-r3f.md`'s `ScrollControls` example — that scene only lerps the camera between four stops. This one uses drei's `useScroll().range(start, len)` to spawn, scale, and rotate individual objects at specific scroll percentages, then drives DOM caption fades from the same 0..1 progress.

**When to use:** "how it works" sections that benefit from scrubbable narrative — onboarding flows, multi-step product tours, story-driven feature walks.

```tsx
// app/components/3d/scroll-tied-tour.tsx
'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  ScrollControls,
  useScroll,
  Float,
} from '@react-three/drei'                                                    // VERIFY: drei v9.x
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'
import { type NxNeonHue } from '@/components/three/nx-materials'

// Camera path keyed by 0..1 progress. Four pages = three transitions.
const CAMERA_KEYS: Array<{ at: number; pos: [number, number, number] }> = [
  { at: 0.00, pos: [0,    0,   6   ] },
  { at: 0.33, pos: [3.0,  0.6, 4.4 ] },
  { at: 0.66, pos: [-2.8, 0.2, 4.6 ] },
  { at: 1.00, pos: [0,   -1.2, 8.5 ] },
]

const HUE_HEX: Record<NxNeonHue, number> = {
  violet: 0xa78bfa,
  cyan:   0x22d3ee,
  pink:   0xf472b6,
  green:  0x4ade80,
}

interface MilestoneProps {
  position: [number, number, number]
  hue: NxNeonHue
  /** scroll progress at which this object should be visible (0..1) */
  start: number
  /** length over which it fades in/out */
  len: number
}

function Milestone({ position, hue, start, len }: MilestoneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef  = useRef<THREE.MeshStandardMaterial>(null)
  const scroll  = useScroll()
  const reduce  = useReducedMotion()

  useFrame(() => {
    if (!meshRef.current || !matRef.current) return

    // .range returns 0..1 across the [start, start+len] window — outside it returns 0 or 1.
    const fadeIn  = scroll.range(start,                len * 0.5)
    const fadeOut = 1 - scroll.range(start + len * 0.5, len * 0.5)
    const visible = Math.min(fadeIn, fadeOut)                                  // ramp up, then ramp down

    const target = reduce ? 1 : visible
    matRef.current.opacity = target
    matRef.current.transparent = target < 0.999

    // Scale follows visibility — soft pop-in from 0.6 → 1.0
    const scale = 0.6 + 0.4 * visible
    meshRef.current.scale.setScalar(scale)

    // Slow autorotate while visible
    if (!reduce) meshRef.current.rotation.y += 0.005 * visible
  })

  const hex = HUE_HEX[hue]

  return (
    <Float floatIntensity={0.5} rotationIntensity={0.3} speed={1}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1.0, 2]} />
        {/* Inline material so we can ref it for opacity — the helper component returns its own JSX, harder to ref. */}
        <meshStandardMaterial
          ref={matRef}
          color={new THREE.Color(hex)}
          emissive={new THREE.Color(hex)}
          emissiveIntensity={1.4}
          metalness={0.3}
          roughness={0.3}
          toneMapped={false}
          transparent
        />
      </mesh>
    </Float>
  )
}

function ScrollCameraRig() {
  const scroll = useScroll()
  const target = useRef(new THREE.Vector3())
  const reduce = useReducedMotion()

  useFrame((state) => {
    const off = scroll.offset                                                  // 0..1 across pages
    // Find segment
    let i = 0
    while (i < CAMERA_KEYS.length - 1 && CAMERA_KEYS[i + 1].at < off) i++
    const a = CAMERA_KEYS[i]
    const b = CAMERA_KEYS[Math.min(i + 1, CAMERA_KEYS.length - 1)]
    const span = Math.max(b.at - a.at, 1e-4)
    const f = THREE.MathUtils.clamp((off - a.at) / span, 0, 1)

    target.current.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], f),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], f),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], f),
    )
    state.camera.position.lerp(target.current, reduce ? 1 : 0.08)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

function StoryContents() {
  return (
    <>
      <ScrollCameraRig />

      {/* Three milestones, each visible across its third of the scroll range. Windows overlap so
          the next object starts fading in before the previous one fades out. */}
      <Milestone position={[ 0,    0,    0   ]} hue="violet" start={0.00} len={0.42} />
      <Milestone position={[ 2.4,  0.4,  0   ]} hue="cyan"   start={0.30} len={0.42} />
      <Milestone position={[-2.0, -0.4, -0.6 ]} hue="pink"   start={0.62} len={0.42} />
    </>
  )
}

interface CaptionSpec {
  eyebrow: string
  title: string
  body: string
}

const CAPTIONS: CaptionSpec[] = [
  {
    eyebrow: 'Step 01 · Connect',
    title:   'Bring your runtime.',
    body:    'Point Nexus Cloud at any container, function, or static bundle. We detect the framework and provision an edge in 90 seconds.',
  },
  {
    eyebrow: 'Step 02 · Route',
    title:   '14 regions, one URL.',
    body:    'Requests land at the closest edge, route over our private backbone, and never hit a cold container — even at 3 AM in Sydney.',
  },
  {
    eyebrow: 'Step 03 · Scale',
    title:   'Bill at the request.',
    body:    'No reserved capacity, no idle charges. You pay for the 24 ms of CPU it took to answer — and nothing else.',
  },
]

export default function ScrollTiedTour() {
  return (
    // Outer height is the scroll length. 4 pages * 100vh.
    <div style={{ height: '400vh', position: 'relative', background: 'var(--df-bg-base)' }}>
      {/* Sticky stage — the canvas sticks while the user scrolls past 4 pages */}
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <NxCanvas
          label="Scroll-driven product tour"
          camera={{ position: [0, 0, 6], fov: 45 }}
        >
          <ScrollControls pages={4} damping={0.3} eps={0.0001}>
            <StoryContents />
          </ScrollControls>

          <EffectComposer disableNormalPass>
            <Bloom intensity={1.05} luminanceThreshold={0.16} luminanceSmoothing={0.92} mipmapBlur />
            <Vignette eskil={false} offset={0.22} darkness={0.9} />
          </EffectComposer>
        </NxCanvas>

        {/* Captions live OUTSIDE the canvas for crisp text. They fade via CSS scroll-driven animations
            (Chromium 115+) and gracefully fall back to all-visible elsewhere. */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          {CAPTIONS.map((cap, i) => (
            <div key={i} className={`nx-scroll-caption nx-cap-${i + 1}`}>
              <div style={{ maxWidth: 460 }}>
                <p style={{ color: 'var(--df-neon-violet)', fontSize: 12, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  {cap.eyebrow}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--df-font-display)',
                    color: 'var(--df-text-primary)',
                    fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                    fontWeight: 600, lineHeight: 1.15, margin: '0 0 14px',
                  }}
                >
                  {cap.title}
                </h3>
                <p style={{ color: 'var(--df-text-secondary)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
                  {cap.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .nx-scroll-caption {
            position: absolute; inset: 0;
            display: flex; align-items: center;
            padding: clamp(40px, 8vw, 96px);
            opacity: 0;
            transition: opacity 200ms var(--df-ease-out);
          }
          /* CSS scroll-driven animations — Chromium 115+; falls back to all-visible elsewhere */
          @supports (animation-timeline: view()) {
            .nx-scroll-caption { animation: nx-cap-fade linear both; animation-timeline: scroll(root); }
            .nx-cap-1 { animation-range: 0%   33%; }
            .nx-cap-2 { animation-range: 33%  66%; }
            .nx-cap-3 { animation-range: 66%  100%; }
          }
          @keyframes nx-cap-fade {
            0%   { opacity: 0; transform: translateY(18px); }
            20%  { opacity: 1; transform: translateY(0);    }
            80%  { opacity: 1; transform: translateY(0);    }
            100% { opacity: 0; transform: translateY(-18px);}
          }
          @media (prefers-reduced-motion: reduce) {
            .nx-scroll-caption { opacity: 1 !important; transform: none !important; animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
```

> **Two scroll sources, one timeline:** This pattern is unusual because it drives the **scene** off drei's `ScrollControls` (which proxies the page scroll) and the **captions** off CSS `animation-timeline: scroll()` (a 2024+ Chromium feature). Both read the same window scroll, so they stay in sync. If you need cross-browser parity for captions, swap to `motion/react`'s `useScroll({ target })` and animate caption opacity from JS — at the cost of the JS doing more work per frame. The other route is drei's `<Scroll html>` wrapper, which lifts DOM into ScrollControls' own proxy — it works but rasterises the captions and tends to soften the typography at high dpr. // VERIFY: drei `<Scroll html>` behaviour in your installed version.

---

## Pattern 4 — Particle Hero

Full-bleed hero with a viewport-adaptive particle field (1200 → 3500 instances based on screen width), each particle drifting on per-instance phase offsets and parallaxing softly to the cursor. Title sits over the canvas with the DF shimmer gradient. Density and dpr both clamp on mobile to keep the framerate honest.

**When to use:** maximum-impact landing hero for products where the visual itself is a feature (data, AI, network products). Heaviest of the five — read the perf notes below before shipping.

```tsx
// app/components/3d/particle-hero.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'

interface ParticleData {
  basePos: THREE.Vector3
  speed: number
  offset: number
  hue: number
  scaleBase: number
}

interface SwarmProps {
  count: number
}

function ParticleSwarm({ count }: SwarmProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy   = useMemo(() => new THREE.Object3D(), [])
  const reduce  = useReducedMotion()

  // Pre-generate particle bases — depends on count so memo invalidates when viewport changes.
  const particles = useMemo<ParticleData[]>(() => {
    const HUES = [0xa78bfa, 0x22d3ee, 0xf472b6]                                // violet, cyan, pink
    return Array.from({ length: count }, () => ({
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12 - 1,
      ),
      speed:     0.18 + Math.random() * 0.55,
      offset:    Math.random() * Math.PI * 2,
      hue:       HUES[Math.floor(Math.random() * HUES.length)],
      scaleBase: 0.018 + Math.random() * 0.022,
    }))
  }, [count])

  // Set per-instance colors once; setColorAt is the canonical API for InstancedMesh.
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const tmp = new THREE.Color()
    particles.forEach((p, i) => {
      tmp.setHex(p.hue)
      meshRef.current!.setColorAt(i, tmp)
    })
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [particles])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = reduce ? 0 : state.clock.elapsedTime
    const px = state.pointer.x
    const py = state.pointer.y

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const drift = Math.sin(t * p.speed + p.offset) * 0.32
      const sway  = Math.cos(t * p.speed * 0.7 + p.offset) * 0.22
      const wave  = Math.cos(t * 0.45 + p.offset) * 0.18

      dummy.position.set(
        p.basePos.x + drift + px * 0.55,
        p.basePos.y + sway  + py * 0.40,
        p.basePos.z + wave,
      )
      const pulse = 1 + Math.sin(t * 1.7 + p.offset) * 0.18
      dummy.scale.setScalar(p.scaleBase * pulse)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}                                                    // bounding sphere is wrong for instances
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  )
}

function useViewportParticleCount() {
  const [count, setCount] = useState(1800)
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth
      // Density curve — heavy machines get heavier counts, but never higher than 3500.
      setCount(w < 640 ? 1200 : w < 1024 ? 2000 : w < 1440 ? 2800 : 3500)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])
  return count
}

export default function ParticleHero() {
  const count = useViewportParticleCount()

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Canvas — full-bleed, decorative, behind the text */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true">
        <NxCanvas
          camera={{ position: [0, 0, 7.5], fov: 52 }}
          dpr={[1, 1.5]}                                                       // VERIFY: NxCanvas accepts dpr passthrough; otherwise pass via Canvas direct
        >
          <ParticleSwarm count={count} />

          <EffectComposer disableNormalPass>
            <Bloom
              intensity={1.4}
              luminanceThreshold={0.10}
              luminanceSmoothing={0.96}
              mipmapBlur
              radius={0.95}
            />
            <Vignette eskil={false} offset={0.25} darkness={0.95} />
          </EffectComposer>
        </NxCanvas>
      </div>

      {/* Subtle radial mask — keeps the title legible against the densest particle cluster */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 60%, var(--df-bg-base) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* DOM overlay — text */}
      <div
        style={{
          position: 'relative', zIndex: 2,
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: 'clamp(80px, 12vh, 120px) clamp(20px, 5vw, 64px)',
          maxWidth: 880, margin: '0 auto',
        }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,211,238,0.10)',
            border: '1px solid rgba(34,211,238,0.22)',
            borderRadius: 'var(--df-radius-full)',
            padding: '5px 14px',
            color: 'var(--df-neon-cyan)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.06em', marginBottom: 28,
          }}
        >
          Live · {count.toLocaleString()} synapses
        </span>

        <h1
          className="nx-text-shimmer"
          style={{
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(2.6rem, 7vw, 5rem)',
            fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.025em',
            margin: '0 0 22px',
          }}
        >
          Inference at the<br />speed of thought.
        </h1>

        <p
          style={{
            color: 'var(--df-text-secondary)',
            fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
            lineHeight: 1.6, margin: '0 0 40px', maxWidth: 620,
          }}
        >
          Nexus AI routes every prompt to the closest GPU pool, batches in 8 ms,
          and streams tokens before your competitors finish parsing JSON.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
              color: 'var(--df-text-inverse)',
              border: 'none', borderRadius: 'var(--df-radius-md)',
              padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: 'var(--df-glow-violet-lg)',
            }}
          >
            Get an API key
          </button>
          <button
            style={{
              background: 'var(--df-glass-bg)', color: 'var(--df-text-primary)',
              border: '1px solid var(--df-border-default)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--df-radius-md)',
              padding: '13px 28px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            See the playground
          </button>
        </div>
      </div>
    </section>
  )
}
```

> **dpr clamp is intentional, not a typo:** 3500 instanced sphere meshes at retina 2x dpr is roughly 28 million fragments per frame on a phone — enough to drop sustained framerate even on flagship Android. Capping dpr at 1.5 cuts that nearly in half without visible quality loss for particles smaller than 4 px on screen. If you want sharper particles on retina, drop the count to 2400 instead of raising dpr.

---

## Pattern 5 — 3D Card Stack (Y-axis floating cards)

Three holographic UI cards floating in 3D space with HTML content rendered into the scene via drei's `<Html transform>`. Each card lerps forward on hover (z-axis push) and brightens its violet emissive halo. The mesh carries the glow; the HTML carries the copy — best of both worlds, one accessible and selectable, the other actually 3D.

**When to use:** "three pillars" / "three plans" / "three workflows" sections where the information itself benefits from spatial separation — pricing trios, feature trios, integration showcases.

```tsx
// app/components/3d/card-stack.tsx
'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Float } from '@react-three/drei'                                // VERIFY: Html transform + occlude props
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'

interface CardSpec {
  id: string
  position: [number, number, number]
  hue: number                                                                  // hex literal — Three.js space, not CSS
  cssAccent: string                                                            // CSS token — for the HTML overlay
  eyebrow: string
  title: string
  metric: string
  metricUnit: string
  body: string
}

const CARDS: CardSpec[] = [
  {
    id: 'edge',
    position: [-2.6, 0, 0],
    hue: 0xa78bfa,
    cssAccent: 'var(--df-neon-violet)',
    eyebrow: 'Edge',
    title: 'Sub-25 ms anywhere',
    metric: '24',
    metricUnit: 'ms p99',
    body: 'Requests land at the nearest of 14 regions and route over a private backbone — never the public internet.',
  },
  {
    id: 'core',
    position: [0, 0, 0],
    hue: 0x22d3ee,
    cssAccent: 'var(--df-neon-cyan)',
    eyebrow: 'Core',
    title: 'Zero cold starts',
    metric: '0',
    metricUnit: 'ms boot',
    body: 'We pre-warm a worker pool for every revision so your first request is your fastest, not your slowest.',
  },
  {
    id: 'scale',
    position: [2.6, 0, 0],
    hue: 0xf472b6,
    cssAccent: 'var(--df-neon-pink)',
    eyebrow: 'Scale',
    title: 'Billed at the request',
    metric: '$0.00012',
    metricUnit: '/ req',
    body: 'No reserved capacity, no minimums, no surprise enterprise plan. The unit is the request, every time.',
  },
]

function FloatingCard({ spec }: { spec: CardSpec }) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef   = useRef<THREE.MeshPhysicalMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const reduce = useReducedMotion()

  useFrame(() => {
    if (!groupRef.current || !matRef.current) return

    // Z-lift on hover — 0.4 forward, with a soft lerp.
    const targetZ = hovered ? 0.4 : 0
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, reduce ? 1 : 0.10)

    // Subtle scale bump
    const targetScale = hovered ? 1.04 : 1.0
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, reduce ? 1 : 0.10)
    groupRef.current.scale.setScalar(s)

    // Emissive bump
    const targetEmissive = hovered ? 1.4 : 0.7
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity, targetEmissive, reduce ? 1 : 0.10
    )
  })

  return (
    <Float floatIntensity={0.4} rotationIntensity={0.15} speed={0.9}>
      <group
        ref={groupRef}
        position={spec.position}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer' }}
        onPointerOut={()    => { setHovered(false); document.body.style.cursor = '' }}
      >
        {/* Card body — thin emissive box. Hovered emissive driven by useFrame above. */}
        <mesh>
          <boxGeometry args={[2.0, 2.6, 0.08]} />
          <meshPhysicalMaterial
            ref={matRef}
            color={new THREE.Color(0x0a0a0a)}                                  // tinted black body
            emissive={new THREE.Color(spec.hue)}
            emissiveIntensity={0.7}
            metalness={0.55}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.1}
            toneMapped={false}
          />
        </mesh>

        {/* Soft glow disc behind the card — pure additive, sells the "halo" */}
        <mesh position={[0, 0, -0.12]}>
          <planeGeometry args={[3.2, 3.8]} />
          <meshBasicMaterial
            color={new THREE.Color(spec.hue)}
            transparent
            opacity={hovered ? 0.18 : 0.10}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* HTML content rides the card via drei <Html transform>. occlude="blending" hides it cleanly when behind other meshes. */}
        <Html
          transform
          position={[0, 0, 0.06]}
          distanceFactor={2.4}                                                 // VERIFY: tune per camera FOV — 38 → 2.4 reads balanced
          occlude="blending"
          wrapperClass="nx-card-html"
          style={{ pointerEvents: 'none' }}                                    // mesh handles hover; HTML stays inert
        >
          <div
            style={{
              width: 240,
              padding: '20px 22px',
              fontFamily: 'var(--df-font-sans)',
              color: 'var(--df-text-primary)',
            }}
          >
            <p
              style={{
                color: spec.cssAccent,
                fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                margin: '0 0 14px',
              }}
            >
              {spec.eyebrow}
            </p>
            <p
              style={{
                fontFamily: 'var(--df-font-display)',
                fontSize: 18, fontWeight: 600, lineHeight: 1.2,
                margin: '0 0 16px',
              }}
            >
              {spec.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 14px' }}>
              <span
                style={{
                  fontFamily: 'var(--df-font-mono)',
                  fontSize: 32, fontWeight: 600, lineHeight: 1,
                  color: spec.cssAccent,
                }}
              >
                {spec.metric}
              </span>
              <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>
                {spec.metricUnit}
              </span>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
              {spec.body}
            </p>
          </div>
        </Html>
      </group>
    </Float>
  )
}

export default function CardStack3D() {
  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vh, 120px) clamp(20px, 5vw, 56px)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', marginBottom: 56 }}>
        <p style={{ color: 'var(--df-neon-violet)', fontSize: 12, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          The Nexus runtime
        </p>
        <h2
          style={{
            fontFamily: 'var(--df-font-display)',
            color: 'var(--df-text-primary)',
            fontSize: 'clamp(2rem, 4.4vw, 3rem)',
            fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em',
            margin: '0 0 18px',
          }}
        >
          Three pillars. One platform.
        </h2>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: 17, lineHeight: 1.6, margin: 0, maxWidth: 620, marginInline: 'auto' }}>
          Edge routes, core executes, scale meters. Hover any card to lift it forward.
        </p>
      </div>

      <div style={{ height: 520, width: '100%' }}>
        <NxCanvas
          label="Three product pillars in 3D"
          camera={{ position: [0, 0, 5.5], fov: 38 }}
        >
          {CARDS.map((spec) => (
            <FloatingCard key={spec.id} spec={spec} />
          ))}

          <EffectComposer disableNormalPass>
            <Bloom intensity={0.95} luminanceThreshold={0.18} luminanceSmoothing={0.92} mipmapBlur radius={0.75} />
            <Vignette eskil={false} offset={0.20} darkness={0.88} />
          </EffectComposer>
        </NxCanvas>
      </div>
    </section>
  )
}
```

> **Why `<Html>` content is `pointerEvents: 'none'`:** the parent mesh handles hover via R3F raycasting. If the HTML also captured pointer events, the mesh would never receive `onPointerOut` (the cursor leaves the mesh into the HTML, not into empty space). Inert HTML keeps the hover region tied to the card volume itself. For a clickable CTA inside the card, set the inner button to `pointerEvents: 'auto'` while keeping the wrapper at `none`.

---

## Performance Strategy (per pattern)

These five patterns occupy very different cost tiers. Don't apply one perf recipe to all of them — match the strategy to the section.

| Pattern | dpr clamp | Suspense scope | Reduced-motion behavior | Low-end / mobile fallback |
|---|---|---|---|---|
| **1 — Product Showcase** | `[1, 2]` (NxCanvas default) | Wrap `<ProductModel>` in `<Suspense fallback={null}>` with the `ModelSkeleton` rendered behind the canvas | Freeze auto-rotate; keep OrbitControls usable on hover | If `prefers-reduced-data` or viewport `< 640`, swap the `<NxCanvas>` for a static `<img src="/og/nexus-cloud.webp" />` at the same aspect ratio — same frame, zero WebGL cost |
| **2 — Floating Geometry** | `[1, 2]` | None needed — geometries are inline | Freeze the parallax rig and `<Float>` (drei `<Float>` respects `useReducedMotion` inside its rig — verify against your version) | Drop to 4 shapes via `useMemo(() => SHAPES.slice(0, w < 640 ? 4 : 6))`. Disable `ChromaticAberration` if you stack one on top of Bloom |
| **3 — Scroll-Tied Tour** | `[1, 2]` | None — geometries inline | Skip the camera lerp (jump-cut to final stop), captions render fully visible | On viewports `< 768` you may want to swap for a vertical-stack accordion of the same three captions — scroll-tied 3D narratives are uncomfortable on small screens |
| **4 — Particle Hero** | `[1, 1.5]` (intentional cap) | None — particles inline | Set `t = 0` inside the `useFrame` so the swarm freezes; pointer parallax disabled | Density curve already steps down to 1200 at `< 640`. For `prefers-reduced-data`, swap the canvas for a CSS radial-gradient hero — no WebGL at all |
| **5 — 3D Card Stack** | `[1, 2]` | Wrap each `<FloatingCard>` only if you swap to GLB content; HTML/CSS in `<Html>` is sync | Freeze `<Float>`, freeze the hover lerp (still respects hover state, just snaps) | At `< 640`, hide the canvas entirely and render the same three cards as a vertical CSS grid — `<Html>` text is heavy on mobile and you lose the 3D parallax anyway |

**Universal rules** (apply to every pattern):

1. **Lazy-load the section.** In Next.js: `dynamic(() => import('./particle-hero'), { ssr: false, loading: () => <NxSkeleton height="100vh" /> })`. Three.js is ~150 kb gz — never on the LCP path.
2. **Single Canvas per section.** Browsers cap WebGL contexts at ~16 (Chrome), fewer in Safari. Patterns 2, 3, and 4 are full-bleed and cannot coexist on the same page without context exhaustion. If a page truly needs two of them, separate by full-viewport scroll regions and use `IntersectionObserver` to unmount whichever isn't visible.
3. **`prefers-reduced-motion` is non-negotiable.** Every `useFrame` in this file checks `useReducedMotion()` — that's the contract. The CSS captions in Pattern 3 also have an explicit `@media (prefers-reduced-motion: reduce)` override.
4. **`aria-hidden="true"` on decorative canvases.** Patterns 2, 4, 5 are decorative — the Canvas wrapper carries `aria-hidden`. Pattern 1's canvas is informational (the model *is* the product) and uses `label="Nexus Cloud product model"`.
5. **Bloom intensity scales with content density.** Heavy particle scenes can take `intensity={1.4}`; a single product model maxes out around `0.85` before halos eat the silhouette.

---

## Cross-References

- `references/00-dark-tokens.md` — every DF color, glow, radius, easing, and font variable referenced in the DOM overlays of all five patterns
- `references/03-threejs-r3f.md` — primitives this file composes: `NxCanvas`, `NeonStandardMaterial`, `GlassPhysicalMaterial`, `ParallaxRig`, raw `<Bloom>` setup. Read first if you're new to the stack
- `references/16-vanta-spline.md` — the lower-friction alternatives to Patterns 1, 2, and 4. If your team can't justify shipping ~150 kb of Three.js, Vanta's `WAVES` / `NET` / `HALO` effects approximate Patterns 2 and 4 in ~30 kb. Spline approximates Pattern 1 with a designer-driven scene
- `references/01-framer-motion.md` — the text-overlay entrance animations (badge fade-in, headline rise) on Patterns 1, 2, 4, 5 are all `motion/react` variants. Pair `useReducedMotion` from there with the R3F `frameloop="demand"` baked into `NxCanvas`
- `references/17-skeleton-system.md` — Pattern 1's `ModelSkeleton` is a one-off. For consistency across patterns, swap to the canonical `<NxSkeleton variant="canvas" height={420} />` from the skeleton system. Pattern 1's lazy-load fallback should also use it
- `references/patterns/hero.md` — Patterns 2 and 4 are 3D-augmented heroes; treat `hero.md` as the no-WebGL counterpart and pick whichever the user's stack and bundle budget allow
- `references/patterns/features.md` — Pattern 5 is a 3D version of the bento-grid pillar trio in `features.md`; choose 3D when the trio is the section's main visual moment, choose bento when it sits below a denser hero
