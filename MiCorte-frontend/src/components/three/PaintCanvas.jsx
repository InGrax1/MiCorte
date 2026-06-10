import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Fondo Three.js de "textura pintada" (trazos dorados sobre oscuro)
 * que reacciona al cursor con una ondulacion fluida.
 *
 * Rendimiento:
 * - DPR limitado a 1.75
 * - El render se pausa cuando el canvas sale del viewport (IntersectionObserver)
 * - Con prefers-reduced-motion se renderiza un solo frame estatico
 */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;     // 0..1, suavizado en JS
  uniform float uMouseVel;  // intensidad del movimiento del cursor
  uniform vec2  uRes;

  // ── Noise (hash + value noise + fbm) ──
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.55;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = rot * p * 2.05;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uv = vUv;
    uv.x *= aspect;
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);

    // Onda alrededor del cursor — desplaza el campo de "pintura"
    float dMouse  = length(uv - m);
    float ripple  = exp(-dMouse * 3.2) * (0.35 + uMouseVel * 1.4);
    vec2  push    = normalize(uv - m + 0.0001) * ripple * 0.35;

    float t = uTime * 0.06;
    vec2 p = uv * 2.2 + push;

    // Dominio deformado: trazos organicos tipo pincelada
    float n1 = fbm(p + vec2(t, -t * 0.7));
    float n2 = fbm(p * 1.6 + vec2(n1 * 1.8, t * 0.5));
    float field = n1 * 0.62 + n2 * 0.38;

    // Vetas doradas: bandas finas del campo
    float bands = abs(fract(field * 3.0 - t * 0.4) - 0.5) * 2.0;
    float vein  = 1.0 - smoothstep(0.0, 0.16, bands);
    // Brillo extra de las vetas cerca del cursor
    vein *= 0.18 + 0.82 * exp(-dMouse * 1.9);

    // Paleta de marca
    vec3 dark  = vec3(0.058, 0.054, 0.043);   // #0F0E0B
    vec3 deep  = vec3(0.118, 0.094, 0.047);   // marron profundo
    vec3 gold  = vec3(0.788, 0.659, 0.298);   // #C9A84C
    vec3 amber = vec3(0.604, 0.486, 0.180);   // #9A7C2E

    vec3 col = mix(dark, deep, smoothstep(0.25, 0.85, field));
    col = mix(col, amber, vein * 0.55);
    col += gold * vein * vein * 0.85;

    // Halo suave dorado siguiendo el cursor
    col += gold * exp(-dMouse * 4.5) * 0.10;

    // Vineta para integrar con la seccion
    float vig = smoothstep(1.25, 0.35, length(vUv - 0.5) * 1.6);
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function PaintCanvas({ className, style }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uTime:     { value: 0 },
      uMouse:    { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel: { value: 0 },
      uRes:      { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
    }

    const mat  = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    scene.add(quad)

    // Mouse con interpolacion suave (lerp) + velocidad para la onda
    const target = { x: 0.5, y: 0.5 }
    const current = { x: 0.5, y: 0.5 }
    let vel = 0

    function onPointerMove(e) {
      const rect = mount.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = 1.0 - (e.clientY - rect.top) / rect.height
      vel = Math.min(1.5, vel + Math.hypot(nx - target.x, ny - target.y) * 4)
      target.x = nx
      target.y = ny
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    let raf = 0
    let visible = true
    const clock = new THREE.Clock()

    function render() {
      const dt = clock.getDelta()
      uniforms.uTime.value = clock.elapsedTime
      current.x += (target.x - current.x) * Math.min(1, dt * 4.5)
      current.y += (target.y - current.y) * Math.min(1, dt * 4.5)
      vel *= Math.max(0, 1 - dt * 2.2)
      uniforms.uMouse.value.set(current.x, current.y)
      uniforms.uMouseVel.value = vel
      renderer.render(scene, camera)
    }
    function loop() {
      render()
      raf = requestAnimationFrame(loop)
    }

    // Pausar cuando el hero no esta en pantalla
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(raf)
      if (visible && !reduced) loop()
    }, { threshold: 0 })
    io.observe(mount)

    function onResize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      uniforms.uRes.value.set(w, h)
      if (reduced) render()
    }
    window.addEventListener('resize', onResize)

    if (reduced) {
      render() // un solo frame estatico
    } else {
      loop()
    }

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      quad.geometry.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={className} style={style} aria-hidden="true" />
}
