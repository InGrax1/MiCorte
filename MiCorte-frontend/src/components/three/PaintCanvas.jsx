import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Fondo del hero: fotografia real del interior de la barberia con
 * PARALLAX DE PROFUNDIDAD ligado al scroll + reaccion sutil al cursor.
 *
 * Profundidad procedural: la parte baja de la escena (sillones, muebles)
 * se considera "cerca" y la parte alta (pared, espejos, lamparas) "lejos".
 * Al hacer scroll, lo cercano se desplaza mas rapido que lo lejano,
 * separando visualmente los muebles del fondo (pseudo-3D con una sola foto).
 *
 * Cursor: inclinacion de profundidad (depth tilt) + ondulacion muy sutil,
 * con un toque minimo de aberracion cromatica.
 *
 * Rendimiento:
 * - DPR limitado a 1.75
 * - Render pausado cuando el canvas sale del viewport (IntersectionObserver)
 * - Con prefers-reduced-motion se renderiza un solo frame estatico
 */
const IMG_SRC = '/img/landing/barberia-interior.jpg'

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
  uniform sampler2D uTex;
  uniform float uLoaded;     // 0 -> 1 cuando la textura esta lista
  uniform float uTime;
  uniform vec2  uMouse;      // 0..1, suavizado en JS
  uniform float uMouseVel;   // intensidad del movimiento del cursor
  uniform float uScroll;     // 0..1 progreso de scroll dentro del hero
  uniform vec2  uRes;
  uniform float uImgAspect;

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

  // Mapeo tipo object-fit: cover, con un zoom base para dejar margen al parallax
  vec2 coverUv(vec2 uv) {
    uv = (uv - 0.5) / 1.12 + 0.5;   // zoom 12% de margen
    float sA = uRes.x / uRes.y;
    if (sA > uImgAspect) {
      uv.y = (uv.y - 0.5) * (uImgAspect / sA) + 0.5;
    } else {
      uv.x = (uv.x - 0.5) * (sA / uImgAspect) + 0.5;
    }
    return uv;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);

    float d   = length(p - m);
    vec2  dir = normalize(p - m + 0.0001);

    // ── Mapa de profundidad procedural ──
    // 0 = lejos (pared/espejos arriba) .. 1 = cerca (sillones abajo)
    float depth = smoothstep(0.95, 0.08, vUv.y);
    // Los muebles ocupan el centro-bajo: refuerza la cercania ahi
    depth *= 0.7 + 0.3 * smoothstep(0.95, 0.4, abs(vUv.x - 0.5) * 2.0);

    // ── Parallax por scroll: lo cercano sube mas rapido ──
    float rise = uScroll * mix(0.015, 0.095, depth);
    // Empuje cinematografico: leve zoom al avanzar
    float zoom = 1.0 + uScroll * 0.05;

    // ── Cursor: inclinacion de profundidad (sutil y elegante) ──
    vec2 tilt = (uMouse - 0.5) * mix(0.003, 0.014, depth) * -1.0;

    // ── Ondulacion liquida minimalista ──
    float ring = sin(d * 18.0 - uTime * 2.0) * exp(-d * 5.5) * (0.10 + uMouseVel) * 0.006;
    float push = exp(-d * 3.5) * uMouseVel * 0.012;
    vec2 idle = (vec2(
      noise(p * 1.6 + uTime * 0.05),
      noise(p * 1.6 - uTime * 0.04 + 7.3)
    ) - 0.5) * 0.0025;

    vec2 texUv = coverUv(vUv);
    texUv = (texUv - 0.5) / zoom + 0.5;
    texUv.y -= rise;
    texUv += tilt + dir * (ring + push) + idle;

    // Aberracion cromatica apenas perceptible cerca del puntero
    float ca = exp(-d * 4.0) * (0.0015 + uMouseVel * 0.004);
    vec3 col;
    col.r = texture2D(uTex, texUv + dir * ca).r;
    col.g = texture2D(uTex, texUv).g;
    col.b = texture2D(uTex, texUv - dir * ca).b;

    // ── Gradacion de marca ──
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum), 0.30);                       // desaturar
    col *= 0.62;                                           // oscurecer base
    vec3 gold = vec3(0.788, 0.659, 0.298);                 // #C9A84C
    col += gold * pow(lum, 2.2) * 0.40;                    // dorar las luces
    col += gold * exp(-d * 5.0) * 0.035;                   // halo leve en cursor

    // Niebla dorada de profundidad: separa los muebles del fondo
    col = mix(col, col * 0.82 + gold * 0.045, (1.0 - depth) * 0.5);

    // Vineta
    float vig = smoothstep(1.3, 0.4, length(vUv - 0.5) * 1.65);
    col *= mix(0.5, 1.0, vig);

    // Grano de pelicula muy sutil
    col += (hash(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.02;

    // Fundido desde negro mientras carga la textura
    col *= uLoaded;

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
      uTex:       { value: new THREE.Texture() },
      uLoaded:    { value: 0 },
      uTime:      { value: 0 },
      uMouse:     { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel:  { value: 0 },
      uScroll:    { value: 0 },
      uRes:       { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      uImgAspect: { value: 1.5 },
    }

    const mat  = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    scene.add(quad)

    // Cargar la foto de la barberia y fundir su entrada
    let texture = null
    new THREE.TextureLoader().load(IMG_SRC, tex => {
      texture = tex
      tex.minFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      uniforms.uTex.value = tex
      uniforms.uImgAspect.value = tex.image.width / tex.image.height
      fadeIn()
      if (reduced) render()
    })

    let fadeRaf = 0
    function fadeIn() {
      const start = performance.now()
      const tick = now => {
        const t = Math.min(1, (now - start) / 900)
        uniforms.uLoaded.value = t * t * (3 - 2 * t)
        if (reduced) render()
        if (t < 1) fadeRaf = requestAnimationFrame(tick)
      }
      fadeRaf = requestAnimationFrame(tick)
    }

    // Mouse con interpolacion suave + velocidad
    const target  = { x: 0.5, y: 0.5 }
    const current = { x: 0.5, y: 0.5 }
    let vel = 0

    function onPointerMove(e) {
      const rect = mount.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = 1.0 - (e.clientY - rect.top) / rect.height
      vel = Math.min(1.0, vel + Math.hypot(nx - target.x, ny - target.y) * 3)
      target.x = nx
      target.y = ny
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    let raf = 0
    const clock = new THREE.Clock()

    function render() {
      const dt = clock.getDelta()
      uniforms.uTime.value = clock.elapsedTime

      // Mouse suavizado
      current.x += (target.x - current.x) * Math.min(1, dt * 3.5)
      current.y += (target.y - current.y) * Math.min(1, dt * 3.5)
      vel *= Math.max(0, 1 - dt * 2.4)
      uniforms.uMouse.value.set(current.x, current.y)
      uniforms.uMouseVel.value = vel

      // Progreso de scroll dentro del hero (suavizado para el parallax)
      const sc = Math.min(1, Math.max(0, window.scrollY / Math.max(1, mount.clientHeight)))
      uniforms.uScroll.value += (sc - uniforms.uScroll.value) * Math.min(1, dt * 6)

      renderer.render(scene, camera)
    }
    function loop() {
      render()
      raf = requestAnimationFrame(loop)
    }

    // Pausar cuando el hero no esta en pantalla
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf)
      if (entry.isIntersecting && !reduced) loop()
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

    if (!reduced) loop()

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(fadeRaf)
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      quad.geometry.dispose()
      mat.dispose()
      if (texture) texture.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={className} style={style} aria-hidden="true" />
}
