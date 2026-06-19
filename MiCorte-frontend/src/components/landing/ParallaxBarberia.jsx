import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Escena parallax por capas de la barberia (estilo parallax-js-vainilla).
 *
 * Las 4 capas provienen del MISMO lienzo (1376x768) y se superponen
 * registradas con object-cover identico; solo los factores de movimiento
 * las separan:
 *
 *   fondo (sala)  ->  cuadros (paredes)  ->  lamparas  ->  sillones
 *      lejos                                                 cerca
 *
 * - Scroll: cada capa se desplaza a velocidad distinta (GSAP ScrollTrigger, scrub)
 * - Mouse: cada capa se inclina segun su profundidad (lerp suave en rAF)
 *
 * Estructura por capa: wrapper exterior [data-scroll] movido por GSAP,
 * wrapper interior [data-mousex/y] movido por el cursor — sin pelearse el transform.
 *
 * Rendimiento: solo transforms (GPU), rAF pausado fuera del viewport,
 * sin animacion con prefers-reduced-motion.
 */
// Movimiento asimetrico por capa:
// - `mouseX` / `mouseY`: px de desplazamiento por eje. El SIGNO define la
//   direccion: positivo acompana al cursor, negativo se le opone. Cada capa
//   se mueve hacia un lado distinto (mouse a la derecha -> sillas a la
//   izquierda y fondo a la derecha; mouse abajo -> lamparas arriba...).
// - `lagScroll` (seg de scrub) y `lagMouse` (velocidad de lerp): cada capa
//   responde ademas con su propio retardo.
const LAYERS = [
  // El fondo acompana levemente al cursor — ancla la escena
  { src: '/img/landing/parallax/fondo.webp',          scroll: 8,   mouseX: 8,   mouseY: 6,   lagScroll: 0.35, lagMouse: 1.6, filter: 'brightness(0.55) saturate(0.85)' },
  // Los cuadros se oponen sobre todo en HORIZONTAL (mouse izquierda -> cuadros derecha)
  { src: '/img/landing/parallax/cuadros-alpha.webp',  scroll: -5,  mouseX: -16, mouseY: -5,  lagScroll: 0.7,  lagMouse: 2.6, filter: 'brightness(0.62)' },
  // Las lamparas se oponen sobre todo en VERTICAL (mouse abajo -> lamparas arriba)
  // Ocultas en moviles: el recorte vertical las agranda sobre el titular
  { src: '/img/landing/parallax/lamparas-alpha.webp', scroll: -24, mouseX: -7,  mouseY: -26, lagScroll: 1.15, lagMouse: 3.6, filter: 'brightness(0.95) drop-shadow(0 14px 38px rgba(201,168,76,0.18))', soloDesktop: true },
  // Las sillas se oponen fuerte en HORIZONTAL (mouse derecha -> sillas izquierda)
  { src: '/img/landing/parallax/sillas-alpha.webp',   scroll: -16, mouseX: -28, mouseY: -9,  lagScroll: 0.9,  lagMouse: 4.8, filter: 'brightness(0.78) drop-shadow(0 18px 26px rgba(0,0,0,0.5))' },
]
export default function ParallaxBarberia({ className, style }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const mouseLayers  = Array.from(root.querySelectorAll('[data-mousex]'))
    const scrollLayers = Array.from(root.querySelectorAll('[data-scroll]'))

    // ── Parallax de scroll: capas cercanas suben mas rapido ──
    // scrub numerico = segundos que tarda la capa en alcanzar el scroll;
    // cada capa usa el suyo, asi el movimiento es asimetrico entre capas
    const ctx = gsap.context(() => {
      scrollLayers.forEach(el => {
        gsap.to(el, {
          yPercent: parseFloat(el.dataset.scroll),
          ease: 'none',
          scrollTrigger: {
            trigger: root, start: 'top top', end: 'bottom top',
            scrub: parseFloat(el.dataset.lagscroll) || true,
          },
        })
      })
    }, root)

    // ── Parallax de mouse: inclinacion por profundidad con lerp ──
    const target = { x: 0, y: 0 }
    const state  = new Map(mouseLayers.map(el => [el, { x: 0, y: 0 }]))

    function onMove(e) {
      const r = root.getBoundingClientRect()
      target.x = ((e.clientX - r.left) / r.width  - 0.5) * 2  // -1..1
      target.y = ((e.clientY - r.top)  / r.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    let last = performance.now()
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      for (const [el, c] of state) {
        const fx    = parseFloat(el.dataset.mousex)
        const fy    = parseFloat(el.dataset.mousey)
        const speed = parseFloat(el.dataset.lagmouse) || 4
        c.x += (target.x * fx - c.x) * Math.min(1, dt * speed)
        c.y += (target.y * fy - c.y) * Math.min(1, dt * speed)
        el.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Pausar el rAF cuando la escena no esta en pantalla
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf)
      if (entry.isIntersecting) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }, { threshold: 0 })
    io.observe(root)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      ctx.revert()
    }
  }, [])

  return (
    <div ref={rootRef} className={className} style={{ ...style, overflow: 'hidden' }} aria-hidden="true">
      {/* Capas registradas: misma geometria full-bleed, el margen extra
          (inset negativo) da espacio al movimiento sin revelar bordes */}
      {LAYERS.map((l, i) => (
        <div key={l.src} data-scroll={l.scroll} data-lagscroll={l.lagScroll}
          className={l.soloDesktop ? 'hidden md:block absolute' : 'absolute'}
          style={{ inset: '-9% -4%' }}>
          <div data-mousex={l.mouseX} data-mousey={l.mouseY} data-lagmouse={l.lagMouse} style={{ width: '100%', height: '100%' }}>
            {/* La primera capa (fondo) es la candidata a LCP: priorizar su carga */}
            <img src={l.src} alt=""
              fetchPriority={i === 0 ? 'high' : undefined}
              decoding="async"
              className="w-full h-full object-cover"
              style={{ filter: l.filter }} />
          </div>
        </div>
      ))}
    </div>
  )
}
