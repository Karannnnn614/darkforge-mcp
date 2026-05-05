# Darkforge — Three.js + React Three Fiber Dark Reference
`three` + `@react-three/fiber` + `@react-three/drei` is Darkforge's WebGL stack — declarative React scenes for hero orbs, particle fields, scroll-tied cameras, and shader backgrounds where CSS and SVG run out of dimensions. Reach for it only when motion, depth, or volume cannot be faked in 2D; everything else stays in `motion/react` or pure CSS for bundle and battery reasons.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Canvas Setup with AMOLED Background](#canvas-setup-with-amoled-background)
- [DF Neon Material Helpers](#nx-neon-material-helpers)
- [Scene: Floating Sphere with Bloom](#scene-floating-sphere-with-bloom)
- [Scene: Particle Field](#scene-particle-field)
- [Scene: Hero Geometry Rotating](#scene-hero-geometry-rotating)
- [Scene: Scroll-Tied Camera](#scene-scroll-tied-camera)
- [Scene: Shader Background (full-screen)](#scene-shader-background-full-screen)
- [Scene: Distorted Glass Card (3D in HTML)](#scene-distorted-glass-card-3d-in-html)
- [Postprocessing for Neon](#postprocessing-for-neon)
  - [1. Simple Bloom — the default](#1-simple-bloom-the-default)
  - [2. Bloom + Vignette + Chromatic Aberration — premium hero](#2-bloom-vignette-chromatic-aberration-premium-hero)
  - [3. Custom Pipeline with AO (no fabricated import)](#3-custom-pipeline-with-ao-no-fabricated-import)
- [Mouse Interaction Patterns](#mouse-interaction-patterns)
  - [1. Pointer parallax — depth feel without OrbitControls](#1-pointer-parallax-depth-feel-without-orbitcontrols)
  - [2. Hover-to-scale via raycasting (`onPointerOver`)](#2-hover-to-scale-via-raycasting-onpointerover)
- [Performance & Optimization](#performance-and-optimization)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **Heads up — verify against primary docs before shipping.** This reference targets `three@0.170+`, `@react-three/fiber@8.17+` (R3F v9 is in beta — extension namespacing changes; pin v8 unless you have explicit reason), `@react-three/drei@9.114+`, and `@react-three/postprocessing@2.16+`. Every uncertain prop is tagged inline with `// VERIFY:`. Always cross-check against:
>
> - `r3f.docs.pmnd.rs` — Canvas, useFrame, useThree, performance API
> - `drei.docs.pmnd.rs` — Html, ScrollControls, MeshDistortMaterial, MeshTransmissionMaterial prop tables (these shift between minors)
> - `threejs.org/docs/` — material/light/geometry parameters and the r170 color-space migration
> - `postprocessing` (vanilla) and `@react-three/postprocessing` README — the v3 rewrite reworks `Bloom` selection and dropped some passes; if you're on v3, expect prop drift
>
> Three's WebGPU renderer (`WebGPURenderer`) is not yet stable in R3F as of cutoff; stick to WebGL2 for production unless your audience is locked to evergreen Chrome.

---

## Install / Setup

```bash
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i -D @types/three
```

Optional but used below:

```bash
npm i motion          # for useReducedMotion + outer scroll wiring
npm i leva            # debug controls during development only
```

**SSR** — R3F is client-only. In Next.js App Router, every file using `<Canvas>`, `useFrame`, `useThree`, `useLoader` must start with `'use client'`. For framework-agnostic setups, lazy-load the scene wrapper:

```tsx
// app/page.tsx — server component
import dynamic from 'next/dynamic'

const HeroScene = dynamic(() => import('@/components/scenes/hero-orb-scene'), {
  ssr: false,
  loading: () => <div style={{ height: 560, background: 'var(--df-bg-base)' }} aria-hidden="true" />,
})

export default function Page() {
  return <HeroScene />
}
```

**Color space (r155+):** R3F sets `gl.outputColorSpace = THREE.SRGBColorSpace` and `gl.toneMapping = THREE.ACESFilmicToneMapping` as sane defaults. Don't reach for the legacy `outputEncoding` API — it's gone.

**Three's color system vs CSS:** `new THREE.Color('#a78bfa')` and emissive hex literals like `0xa78bfa` are intentional inside scene code — Three has its own color pipeline and CSS variables don't reach the GPU. Every DOM surface (`<Html>` children, captions, overlays) still uses `var(--df-*)` tokens.

---

## Canvas Setup with AMOLED Background

Drop this `NxCanvas` wrapper at `components/three/nx-canvas.tsx` and reuse it for every scene below. It enforces AMOLED black, fog, lights, dpr clamping, and reduced-motion frameloop in one place.

```tsx
'use client'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { Suspense, useMemo, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'

interface NxCanvasProps extends Omit<CanvasProps, 'children'> {
  children: ReactNode
  /** Aria label for the canvas region. Decorative scenes pass nothing — we apply aria-hidden. */
  label?: string
  /** Override the background color — defaults to AMOLED base. */
  bg?: string
  /** Disable fog for full-screen shader passes. */
  noFog?: boolean
}

export function NxCanvas({
  children,
  label,
  bg = '#000000',                      // matches var(--df-bg-base)
  noFog = false,
  camera,
  ...rest
}: NxCanvasProps) {
  const reduce = useReducedMotion()
  const dpr = useMemo<[number, number]>(() => [1, 2], [])     // clamp on retina

  return (
    <Canvas
      dpr={dpr}
      shadows={false}                                          // AMOLED scenes lean on emissive + bloom, not shadow maps
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 100, ...camera }}
      frameloop={reduce ? 'demand' : 'always'}                 // freeze useFrame loops for reduced-motion users
      aria-label={label}
      aria-hidden={label ? undefined : true}                   // decorative by default
      role={label ? 'img' : undefined}
      style={{ background: 'var(--df-bg-base)' }}              // CSS bg under the GL canvas
      {...rest}
    >
      <color attach="background" args={[bg]} />
      {!noFog && <fog attach="fog" args={[bg, 8, 24]} />}

      {/* Lighting rig — kept minimal; emissive materials carry the look */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={0.6}
        color={new THREE.Color('#ffffff')}
      />
      <pointLight
        position={[-4, -2, -2]}
        intensity={0.8}
        color={new THREE.Color('#a78bfa')}                     // violet rim light
        distance={20}
      />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
```

**Why these defaults:** `alpha: false` lets the GPU skip blending the canvas with the page — a real perf win on mobile. `shadows={false}` because AMOLED scenes look better with emissive + bloom than with shadow maps. `frameloop="demand"` under reduced-motion freezes the scene; you can manually `invalidate()` to redraw on user input.

---

## DF Neon Material Helpers

Three reusable typed materials at `components/three/nx-materials.tsx`. Every scene below pulls from this file.

```tsx
'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { extend, type ReactThreeFiber } from '@react-three/fiber'         // VERIFY: ReactThreeFiber namespace path in R3F v9
import { shaderMaterial } from '@react-three/drei'

export type NxNeonHue = 'violet' | 'cyan' | 'pink' | 'green'

const HUE_HEX: Record<NxNeonHue, number> = {
  violet: 0xa78bfa,
  cyan:   0x22d3ee,
  pink:   0xf472b6,
  green:  0x4ade80,
}

/** ---------- 1. NeonStandardMaterial — workhorse emissive PBR ---------- */
interface NeonStandardProps {
  hue?: NxNeonHue
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
}

export function NeonStandardMaterial({
  hue = 'violet',
  emissiveIntensity = 1.4,
  metalness = 0.2,
  roughness = 0.35,
}: NeonStandardProps) {
  const hex = HUE_HEX[hue]
  return (
    <meshStandardMaterial
      color={new THREE.Color(hex)}
      emissive={new THREE.Color(hex)}
      emissiveIntensity={emissiveIntensity}
      metalness={metalness}
      roughness={roughness}
      toneMapped={false}                              // keep neon hot for bloom
    />
  )
}

/** ---------- 2. GlassPhysicalMaterial — dark frosted glass ---------- */
interface GlassPhysicalProps {
  thickness?: number
  roughness?: number
  iridescence?: number
}

export function GlassPhysicalMaterial({
  thickness = 0.6,
  roughness = 0.08,
  iridescence = 0.4,
}: GlassPhysicalProps) {
  return (
    <meshPhysicalMaterial
      transmission={1}
      thickness={thickness}
      roughness={roughness}
      ior={1.45}
      iridescence={iridescence}                       // VERIFY: iridescence added in three r140; safe in r170
      iridescenceIOR={1.3}
      color={new THREE.Color(0x0a0a0a)}               // tinted black — keeps the glass dark
      attenuationColor={new THREE.Color(0xa78bfa)}    // violet absorption tint
      attenuationDistance={2.4}
      transparent
      toneMapped
    />
  )
}

/** ---------- 3. NeonShaderMaterial — custom DF gradient via drei.shaderMaterial ---------- */
const NxGradientShaderImpl = shaderMaterial(
  {
    uTime: 0,
    uHueA: new THREE.Color(0xa78bfa),
    uHueB: new THREE.Color(0x22d3ee),
    uIntensity: 1.2,
  },
  // vertex
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  /* glsl */ `
    uniform float uTime;
    uniform vec3  uHueA;
    uniform vec3  uHueB;
    uniform float uIntensity;
    varying vec2  vUv;
    varying vec3  vNormal;
    void main() {
      float t = 0.5 + 0.5 * sin(uTime * 0.6 + vUv.y * 6.28);
      vec3 grad = mix(uHueA, uHueB, t);
      float fres = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
      gl_FragColor = vec4(grad * uIntensity + fres * 0.6, 1.0);
    }
  `,
)

extend({ NxGradientShaderImpl })

// JSX namespace augmentation so <nxGradientShaderImpl /> typechecks. Without this
// the tag works at runtime (extend is global) but TS infers `any` on every prop.
declare module '@react-three/fiber' {
  interface ThreeElements {
    nxGradientShaderImpl: ReactThreeFiber.MaterialNode<
      THREE.ShaderMaterial & { uTime: number; uHueA: THREE.Color; uHueB: THREE.Color; uIntensity: number },
      typeof NxGradientShaderImpl
    >
  }
}

export interface NeonShaderMaterialProps {
  hueA?: NxNeonHue
  hueB?: NxNeonHue
  intensity?: number
}

export function NeonShaderMaterial({
  hueA = 'violet',
  hueB = 'cyan',
  intensity = 1.2,
}: NeonShaderMaterialProps) {
  const a = useMemo(() => new THREE.Color(HUE_HEX[hueA]), [hueA])
  const b = useMemo(() => new THREE.Color(HUE_HEX[hueB]), [hueB])
  return <nxGradientShaderImpl uHueA={a} uHueB={b} uIntensity={intensity} />
}
```

> **Note on `extend` typings:** the JSX module augmentation above uses the legacy `ReactThreeFiber.MaterialNode` shape. R3F v9 changes this to a string-keyed `ThreeElements` map — pin to v8 or update the augmentation. // VERIFY: R3F v9 release notes.

---

## Scene: Floating Sphere with Bloom

Hero-class: a softly distorted orb in violet emissive, slow rotation, a parallax to mouse, point light pulse, and a bloom pass that turns emissive pixels into halo. This is the canonical Darkforge hero orb.

```tsx
// components/scenes/hero-orb-scene.tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'                    // VERIFY: prop names below
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'

function HeroOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  const reduce = useReducedMotion()

  useFrame((state, delta) => {
    if (reduce || !meshRef.current) return
    meshRef.current.rotation.y += delta * 0.18
    meshRef.current.rotation.x += delta * 0.06

    // pointer parallax — pointer is normalised -1..1
    const targetX = state.pointer.x * 0.4
    const targetY = state.pointer.y * 0.3
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.06
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.06
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1.4, 6]} />
      {/* MeshDistortMaterial wraps MeshPhysicalMaterial under the hood */}
      <MeshDistortMaterial
        color={new THREE.Color(0xa78bfa)}
        emissive={new THREE.Color(0xa78bfa)}
        emissiveIntensity={1.6}
        roughness={0.15}
        metalness={0.4}
        distort={0.36}                                                     // VERIFY: drei MeshDistortMaterial props
        speed={1.6}
        toneMapped={false}
      />
    </mesh>
  )
}

function PulseLight() {
  const lightRef = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    if (!lightRef.current) return
    lightRef.current.intensity = 1.4 + Math.sin(state.clock.elapsedTime * 1.2) * 0.6
  })
  return <pointLight ref={lightRef} position={[0, 0, 3]} color={0xa78bfa} distance={12} />
}

export default function HeroOrbScene() {
  return (
    <div style={{ position: 'relative', height: 560, width: '100%', background: 'var(--df-bg-base)' }}>
      <NxCanvas label="Floating product orb">
        <HeroOrb />
        <PulseLight />
        <EffectComposer disableNormalPass>
          <Bloom
            intensity={1.1}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur                                                     // VERIFY: mipmapBlur in postprocessing v6 / r3f-postprocessing v2.16+
          />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      </NxCanvas>

      {/* DOM overlay — uses CSS tokens, not Three colors */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: 'var(--df-space-12)', pointerEvents: 'none',
      }}>
        <p style={{ color: 'var(--df-neon-violet)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', margin: 0 }}>
          DELIVERABILITY ENGINE
        </p>
        <h1 style={{
          fontFamily: 'var(--df-font-display)', color: 'var(--df-text-primary)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, margin: '8px 0 0', lineHeight: 1.05,
        }}>
          Inbox placement, in real time.
        </h1>
      </div>
    </div>
  )
}
```

---

## Scene: Particle Field

Instanced points drifting in a violet/cyan haze, count-tuned per viewport. Perfect as a section backdrop or behind a hero card.

```tsx
// components/scenes/particle-field-scene.tsx
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'

interface ParticleSwarmProps { count: number }

function ParticleSwarm({ count }: ParticleSwarmProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const reduce = useReducedMotion()

  // Pre-compute per-particle base data
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
      speed:  0.2 + Math.random() * 0.6,
      offset: Math.random() * Math.PI * 2,
      hue:    Math.random() > 0.7 ? 0x22d3ee : 0xa78bfa,
    }))
  }, [count])

  // Per-instance color via setColorAt — the correct InstancedMesh API.
  // Attaching to geometry would set per-vertex colors, not per-instance.
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

    particles.forEach((p, i) => {
      const drift = Math.sin(t * p.speed + p.offset) * 0.3
      const sway = Math.cos(t * p.speed * 0.7 + p.offset) * 0.2

      dummy.position.set(
        p.basePos.x + drift + px * 0.4,
        p.basePos.y + sway  + py * 0.3,
        p.basePos.z + Math.cos(t * 0.4 + p.offset) * 0.2,
      )
      dummy.scale.setScalar(0.025 + Math.sin(t * 2 + p.offset) * 0.012)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      {/* vertexColors lets the material multiply by per-instance instanceColor (set via setColorAt). */}
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  )
}

export default function ParticleFieldScene() {
  // Mobile-first count clamp — fewer particles on small viewports
  const [count, setCount] = useState(800)
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth
      setCount(w < 640 ? 800 : w < 1280 ? 1600 : 2400)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  return (
    <div style={{ height: 480, width: '100%' }}>
      <NxCanvas
        label="Animated particle field"
        camera={{ position: [0, 0, 7], fov: 50 }}
      >
        <ParticleSwarm count={count} />
      </NxCanvas>
    </div>
  )
}
```

---

## Scene: Hero Geometry Rotating

A torus knot with neon edge highlight via `<lineSegments>` overlay, rotating slowly with cursor-driven camera orbit. Reads as "premium product mark" without needing a model file.

```tsx
// components/scenes/torus-mark-scene.tsx
'use client'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'
import { NeonStandardMaterial } from '@/components/three/nx-materials'

function TorusMark() {
  const groupRef = useRef<THREE.Group>(null)
  const reduce = useReducedMotion()

  // useMemo (not useRef) so we evaluate `new TorusKnotGeometry(...)` once, not every render.
  const geometry = useMemo(() => new THREE.TorusKnotGeometry(1, 0.32, 220, 32, 2, 3), [])
  const edges    = useMemo(() => new THREE.EdgesGeometry(geometry, 12), [geometry])

  // Manual dispose — anything you `new`'d outside JSX is yours to free.
  useEffect(() => {
    return () => {
      geometry.dispose()
      edges.dispose()
    }
  }, [geometry, edges])

  useFrame((_, delta) => {
    if (reduce || !groupRef.current) return
    groupRef.current.rotation.x += delta * 0.12
    groupRef.current.rotation.y += delta * 0.18
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <NeonStandardMaterial hue="violet" emissiveIntensity={0.9} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={new THREE.Color(0x22d3ee)} toneMapped={false} />
      </lineSegments>
    </group>
  )
}

function CursorOrbit() {
  const reduce = useReducedMotion()
  const target = useRef(new THREE.Vector3(0, 0, 5))
  useFrame((state) => {
    if (reduce) return
    const { pointer, camera } = state
    target.current.x = pointer.x * 1.6
    target.current.y = pointer.y * 0.8
    target.current.z = 5
    camera.position.lerp(target.current, 0.04)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function TorusMarkScene() {
  return (
    <div style={{ height: 520, width: '100%' }}>
      <NxCanvas label="Rotating brand mark" camera={{ position: [0, 0, 5], fov: 42 }}>
        <TorusMark />
        <CursorOrbit />
      </NxCanvas>
    </div>
  )
}
```

---

## Scene: Scroll-Tied Camera

Drei's `<ScrollControls>` hijacks the page scroll inside the canvas and exposes a 0..1 progress value via the `useScroll` hook (the drei one — not motion's). We pull the camera along a curve and trigger child animations off the same scroll value.

```tsx
// components/scenes/scroll-camera-scene.tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ScrollControls, useScroll, Float } from '@react-three/drei'      // VERIFY: import path; drei v9.x
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'
import { NeonStandardMaterial } from '@/components/three/nx-materials'

const STOPS: Array<[number, number, number]> = [
  [0,  0,  6],     // intro
  [3,  1,  4],     // pivot right
  [-3, 0,  4],     // pivot left
  [0, -1.5, 9],    // pull back
]

function CameraRig() {
  const scroll = useScroll()
  const tmp = useRef(new THREE.Vector3())

  useFrame((state) => {
    const offset = scroll.offset                                            // 0..1 across all pages
    const segment = offset * (STOPS.length - 1)
    const i = Math.floor(segment)
    const f = segment - i
    const a = STOPS[i]
    const b = STOPS[Math.min(i + 1, STOPS.length - 1)]

    tmp.current.set(
      THREE.MathUtils.lerp(a[0], b[0], f),
      THREE.MathUtils.lerp(a[1], b[1], f),
      THREE.MathUtils.lerp(a[2], b[2], f),
    )
    state.camera.position.lerp(tmp.current, 0.08)
    state.camera.lookAt(0, 0, 0)
  })

  return null
}

function FeaturePillar({ position, hue, label }: {
  position: [number, number, number]
  hue: 'violet' | 'cyan' | 'pink'
  label: string
}) {
  return (
    <Float floatIntensity={0.6} rotationIntensity={0.4} speed={1.2}>
      <mesh position={position}>
        <cylinderGeometry args={[0.6, 0.6, 2.2, 64]} />
        <NeonStandardMaterial hue={hue} emissiveIntensity={1.1} />
      </mesh>
    </Float>
  )
}

export default function ScrollCameraScene() {
  return (
    // Outer wrapper height drives the scroll length — pages * vh
    <div style={{ height: '400vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <NxCanvas label="Scroll-driven feature tour" camera={{ position: [0, 0, 6], fov: 45 }}>
          <ScrollControls pages={4} damping={0.3} eps={0.0001}>
            <CameraRig />
            <FeaturePillar position={[-2, 0, 0]} hue="violet" label="Warm-up" />
            <FeaturePillar position={[ 0, 0, 0]} hue="cyan"   label="Send" />
            <FeaturePillar position={[ 2, 0, 0]} hue="pink"   label="Track" />
          </ScrollControls>
        </NxCanvas>
      </div>
    </div>
  )
}
```

> **Layout caveat:** `<ScrollControls>` mounts its own scroll proxy inside the Canvas. Don't nest it under another scrolling container — the page itself must be the scroller, or you must pass `horizontal` and a scrollable host. // VERIFY: drei ScrollControls README.

---

## Scene: Shader Background (full-screen)

A full-viewport plane running a custom GLSL fragment that paints animated DF-color noise. Use as a section backdrop — costs ~one fragment per pixel but no geometry overhead.

```tsx
// components/scenes/shader-bg-scene.tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);            // already in NDC — no MVP transform
  }
`

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec2  uResolution;
  varying vec2  vUv;

  // Cheap value noise
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    float n = noise(p * 2.4 + vec2(uTime * 0.05, uTime * 0.03));
    float n2 = noise(p * 5.0 - vec2(uTime * 0.07, 0.0));

    // DF palette — violet, cyan, pink
    vec3 violet = vec3(0.655, 0.545, 0.980);    // #a78bfa
    vec3 cyan   = vec3(0.133, 0.827, 0.933);    // #22d3ee
    vec3 pink   = vec3(0.957, 0.447, 0.714);    // #f472b6
    vec3 base   = vec3(0.0);                    // AMOLED black

    vec3 col = mix(violet, cyan, smoothstep(0.3, 0.7, n));
    col = mix(col, pink, smoothstep(0.55, 0.95, n2) * 0.6);

    // Heavy darkening — keeps the background subtle, not chromatic vomit
    col = mix(base, col, 0.18);

    gl_FragColor = vec4(col, 1.0);
  }
`

function FullScreenShader() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const reduce = useReducedMotion()

  const uniforms = useRef({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  })

  useFrame((state, delta) => {
    if (!matRef.current) return
    if (!reduce) uniforms.current.uTime.value += delta
    uniforms.current.uResolution.value.set(state.size.width, state.size.height)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms.current}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function ShaderBackgroundScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true">
      <NxCanvas noFog camera={{ position: [0, 0, 1], fov: 75 }}>
        <FullScreenShader />
      </NxCanvas>
    </div>
  )
}
```

Use it like:

```tsx
<section style={{ position: 'relative', minHeight: '100vh', background: 'var(--df-bg-base)' }}>
  <ShaderBackgroundScene />
  <div style={{ position: 'relative', zIndex: 1, padding: 'var(--df-space-16)' }}>
    {/* DOM content here */}
  </div>
</section>
```

---

## Scene: Distorted Glass Card (3D in HTML)

The hybrid pattern: a 3D glass plane behind real HTML content via drei's `<Html>`. Lets you keep accessible, text-selectable copy while still getting volumetric refraction.

```tsx
// components/scenes/glass-card-scene.tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'                                   // VERIFY: Html prop names below
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'
import { GlassPhysicalMaterial } from '@/components/three/nx-materials'

function GlassPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const reduce = useReducedMotion()

  useFrame((state) => {
    if (reduce || !meshRef.current) return
    const px = state.pointer.x
    const py = state.pointer.y
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, px * 0.18, 0.05)
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -py * 0.12, 0.05)
  })

  return (
    <group>
      {/* Glow disc behind the glass */}
      <mesh position={[0, 0, -0.4]}>
        <circleGeometry args={[2.4, 64]} />
        <meshBasicMaterial color={new THREE.Color(0xa78bfa)} transparent opacity={0.18} toneMapped={false} />
      </mesh>

      <mesh ref={meshRef}>
        <boxGeometry args={[3.6, 2.2, 0.12]} />
        <GlassPhysicalMaterial thickness={0.4} roughness={0.08} iridescence={0.5} />
      </mesh>

      {/* HTML overlay — positioned in 3D space, but rendered as DOM. occlude makes it hide when behind geometry. */}
      <Html
        transform
        position={[0, 0, 0.08]}
        distanceFactor={3.6}                                               // VERIFY: tune to match camera FOV
        occlude="blending"
        wrapperClass="nx-html-wrapper"
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{
          width: 320, padding: '20px 24px',
          color: 'var(--df-text-primary)',
          fontFamily: 'var(--df-font-sans)',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, color: 'var(--df-neon-cyan)', fontSize: 12, letterSpacing: '0.08em', fontWeight: 500 }}>
            INBOX SCORE
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 56, fontWeight: 600, fontFamily: 'var(--df-font-display)', lineHeight: 1 }}>
            94<span style={{ color: 'var(--df-text-muted)', fontSize: 28 }}>/100</span>
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--df-text-secondary)', fontSize: 13 }}>
            Across 14 mailbox providers
          </p>
        </div>
      </Html>
    </group>
  )
}

export default function GlassCardScene() {
  return (
    <div style={{ height: 480, width: '100%' }}>
      <NxCanvas label="Inbox score card" camera={{ position: [0, 0, 5], fov: 38 }}>
        <GlassPlane />
      </NxCanvas>
    </div>
  )
}
```

---

## Postprocessing for Neon

DF's signature glow lives in postprocessing. Three setups, each at increasing cost.

### 1. Simple Bloom — the default

```tsx
'use client'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function NxBloomBasic() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur                                                         // VERIFY: prop in postprocessing v6
        radius={0.7}
      />
    </EffectComposer>
  )
}
```

### 2. Bloom + Vignette + Chromatic Aberration — premium hero

```tsx
'use client'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'                             // VERIFY: re-exported from @react-three/postprocessing in some versions
import { Vector2 } from 'three'

export function NxBloomPremium() {
  return (
    <EffectComposer disableNormalPass multisampling={4}>
      <Bloom
        intensity={1.25}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.95}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.0008, 0.0008)}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.9} />
    </EffectComposer>
  )
}
```

### 3. Custom Pipeline with AO (no fabricated import)

The N8AO post pass ships in its own package on some setups; if you don't have it, this CA + DoF + Bloom stack reads as "expensive" without depending on a possibly-missing import. Drop in Bokeh DoF for foreground emphasis.

```tsx
'use client'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing'
import { Vector2 } from 'three'

export function NxBloomCinematic() {
  return (
    <EffectComposer disableNormalPass multisampling={2}>
      <DepthOfField focusDistance={0.02} focalLength={0.04} bokehScale={3} />
      <Bloom intensity={1.4} luminanceThreshold={0.1} luminanceSmoothing={0.95} mipmapBlur radius={0.85} />
      <ChromaticAberration
        offset={new Vector2(0.0006, 0.0012)}
        radialModulation
        modulationOffset={0.5}
      />
      <Vignette eskil={false} offset={0.22} darkness={0.95} />
    </EffectComposer>
  )
}
```

> **`ChromaticAberration` offset prop:** accepts a `Vector2` directly in current `@react-three/postprocessing` types. Older versions sometimes typed it as `[number, number]` — if your build complains, swap to a tuple `[0.0008, 0.0008]`. // VERIFY: types in your installed version.

---

## Mouse Interaction Patterns

### 1. Pointer parallax — depth feel without OrbitControls

```tsx
// components/three/parallax-rig.tsx
'use client'
import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'

export function ParallaxRig({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const reduce = useReducedMotion()

  useFrame((state) => {
    if (reduce || !groupRef.current) return
    const { pointer } = state
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * strength, 0.05)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * strength * 0.7, 0.05)
  })

  return <group ref={groupRef}>{children}</group>
}
```

Usage: `<NxCanvas><ParallaxRig><HeroOrb /></ParallaxRig></NxCanvas>`.

### 2. Hover-to-scale via raycasting (`onPointerOver`)

R3F handles raycasting for you — every mesh accepts pointer event props.

```tsx
// components/scenes/feature-tile-scene.tsx
'use client'
import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { NxCanvas } from '@/components/three/nx-canvas'
import { NeonStandardMaterial } from '@/components/three/nx-materials'

interface TileProps {
  position: [number, number, number]
  hue: 'violet' | 'cyan' | 'pink'
  label: string
}

function HoverTile({ position, hue, label }: TileProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    setHovered(false)
    document.body.style.cursor = ''
  }

  useFrame(() => {
    if (!meshRef.current) return
    const target = hovered ? 1.18 : 1.0
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, target, 0.12)
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, target, 0.12)
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, target, 0.12)
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={onOver}
      onPointerOut={onOut}
      castShadow={false}
    >
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <NeonStandardMaterial hue={hue} emissiveIntensity={hovered ? 1.6 : 0.9} />
    </mesh>
  )
}

export default function FeatureTileScene() {
  return (
    <div style={{ height: 420, width: '100%' }}>
      <NxCanvas label="Feature tiles">
        <HoverTile position={[-2.4, 0, 0]} hue="violet" label="Warm-up" />
        <HoverTile position={[ 0,    0, 0]} hue="cyan"   label="Send" />
        <HoverTile position={[ 2.4,  0, 0]} hue="pink"   label="Track" />
      </NxCanvas>
    </div>
  )
}
```

> **Cursor reset:** always pair `onPointerOver` cursor mutations with `onPointerOut` resets — components that unmount mid-hover leave the page stuck on `pointer`.

---

## Performance & Optimization

- **Instance, don't multiply.** 500 cubes? `<instancedMesh>` once. Iterating geometry+material per child blows the draw-call budget; instances ship as a single draw.
- **Frustum cull cheaply, but don't lie.** R3F sets `frustumCulled` on by default. For full-screen shaders and instanced clouds set `frustumCulled={false}` because the bounding sphere is wrong; for ordinary meshes leave it on so off-screen objects skip the GPU.
- **Cap dpr on mobile.** `dpr={[1, 2]}` lets retina hit 2x but never higher. On low-end Android, drop to `[1, 1.5]` behind a feature flag.
- **`<Suspense>` everything async.** Models, textures, fonts — wrap them so the page paints AMOLED black instead of flashing white during load.
- **`useMemo` geometries and curves.** A new `TorusKnotGeometry(...)` every render allocates GPU buffers. Build once at module scope or with `useMemo([] )`.
- **Dispose on unmount.** Custom geometries, materials, render targets, and shader uniforms with textures must be `.dispose()`d in a `useEffect` cleanup. R3F auto-disposes children of unmounted JSX nodes, but anything you `new`'d yourself is yours to free.
- **Lazy-load the Canvas.** A `<Canvas>` pulls in three.js (~150kb gz). `next/dynamic({ ssr: false })` keeps the LCP path lean.
- **Throttle heavy `useFrame` work.** If you only need to update once per second (charts, counters), gate by `state.clock.elapsedTime % 0.1` or use `useFrame(() => ..., -1)` priorities to defer behind core renders.
- **Avoid setState inside `useFrame`.** Every set triggers a React render. Mutate refs (`mesh.position.x = ...`) directly — the renderer reads from the scene graph, not your virtual DOM.
- **`frameloop="demand"`** for static or interaction-only scenes. Combined with `invalidate()` from `useThree`, you redraw only when needed — saves 60 fps of GPU on idle pages.

---

## Common Gotchas

- **`'use client'` on every R3F file.** `Canvas`, `useFrame`, `useThree`, `useLoader` all run in the browser. Without the directive, Next.js compiles a server component that throws at hydration. The `motion/react-client` trick doesn't apply — R3F has no equivalent pre-flagged entry. // VERIFY: R3F SSR docs for any new entry points.
- **`useFrame` outside a `<Canvas>` errors.** Hook lookups read the R3F context; calling them from a parent of the Canvas throws "R3F: Hooks can only be used within the Canvas component". Lift the hook into a child component, or call `extend`/imperative APIs only.
- **Memory leaks from missing dispose.** Spawning geometries inside `useMemo` is fine because R3F walks the JSX tree on unmount. Spawning them in a `useEffect` and assigning to a ref is **not** auto-disposed — you must call `.dispose()` in cleanup, otherwise the GPU buffer leaks.
- **GL context limits.** Browsers cap WebGL contexts (Chrome ~16, Safari fewer). Multiple `<Canvas>` per page burns through them — prefer one Canvas with several scenes positioned in 3D space, or use `frameloop="never"` and manual rendering for off-screen ones.
- **Z-fighting on transparent materials.** Two transparent meshes at the same depth flicker. Fix: nudge `polygonOffset` on one, or sort manually with `renderOrder` and `depthWrite={false}` on the rear surface.
- **Pointer events vanish over the canvas.** A full-bleed `<Canvas>` swallows clicks meant for DOM siblings. Use `style={{ pointerEvents: 'none' }}` on the canvas wrapper and put interactive overlays above with `pointerEvents: 'auto'`, or set `pointerEvents="none"` on the Canvas itself when no scene picking is needed.
- **`useScroll` collisions.** drei's `useScroll` (page-scroll inside ScrollControls) and `motion/react`'s `useScroll` (DOM scroll progress) share a name. Always alias: `import { useScroll as useDreiScroll } from '@react-three/drei'`.
- **`<Html>` blurs your typography.** `transform` mode rasterises the DOM into the 3D scene at the canvas's effective pixel ratio. Bump `distanceFactor` lower or drop `transform` entirely (positioned-absolute mode) for crisp body copy. // VERIFY: drei Html docs for current behaviour.
- **`extend` is global, but typings are per-module.** When you `extend({ MyMaterial })`, the JSX tag is available everywhere — but TS won't know about it until you augment `ThreeElements` (R3F v9) or `JSX.IntrinsicElements` (v8). Forgetting this gives you `any` on every prop.
- **`MeshDistortMaterial` and `MeshTransmissionMaterial` props rename across drei minors.** Always pin a specific drei version and read its README — `distort`, `speed`, `factor`, `chromaticAberration` are common, but order and defaults shift. // VERIFY: installed drei version.

---

## Cross-References

- `references/00-dark-tokens.md` — every DF color, glow, radius, and easing variable used in the DOM overlays above
- `references/01-framer-motion.md` — pair `useReducedMotion` with R3F's `frameloop="demand"`; chain `motion/react` `useScroll` with drei's for hybrid scroll choreography
- `references/02-gsap.md` — when scroll-tied scenes need scrub timelines (e.g. blend two scenes via shared progress), GSAP ScrollTrigger drives the `useScroll` proxy values from outside the Canvas
- `references/patterns/hero.md` — the `HeroOrb` + `Bloom` + `ParallaxRig` combo is the default hero scene template; pair with `SequentialReveal` from framer-motion for the headline copy
- `references/patterns/product-showcase.md` — `TorusMark`, `GlassCard`, and `FeatureTile` scenes compose a three-section product page with shared DF materials
- `references/patterns/scroll-story.md` — `ScrollControls` + `CameraRig` is the scroll-story baseline; layer DOM captions via `<Html>` or absolute-positioned overlays
- `references/17-skeleton-system.md` — fall back to `Skeleton height="560px"` while the dynamically-imported scene loads
