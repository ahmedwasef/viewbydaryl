import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'

const BASE = import.meta.env.BASE_URL

/* ─── Photo catalogue ─────────────────────────────────────── */
const PHOTOS = [
  { id: 1,  file: 'p1270769-avec-accentuation-bruit.webp', cat: 'portrait',    title: 'Lumière Rouge' },
  { id: 2,  file: 'p1090055.webp',                          cat: 'portrait',    title: 'Sous la Pluie' },
  { id: 3,  file: 'p1320776.webp',                          cat: 'portrait',    title: 'Éclat Sombre' },
  { id: 4,  file: 'p1350171-1.webp',                        cat: 'portrait',    title: 'Lumière Naturelle' },
  { id: 5,  file: 'p1110401-2.webp',                        cat: 'portrait',    title: 'Cygnes au Crépuscule' },
  { id: 6,  file: 'p1270794-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Ombre & Lumière' },
  { id: 7,  file: 'p1270807-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Regard' },
  { id: 8,  file: 'p1280858-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Intensité' },
  { id: 9,  file: 'p1280881-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Contrejour' },
  { id: 10, file: 'p1280951-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Grain d\'Argent' },
  { id: 11, file: 'p1290159-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Profondeur' },
  { id: 12, file: 'p1290299-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Silence' },
  { id: 13, file: 'p1300771-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Mystère' },
  { id: 14, file: 'p1310419-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Détail' },
  { id: 15, file: 'p1310446-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Douceur' },
  { id: 16, file: 'p1310609-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Âme' },
  { id: 17, file: 'p1310766-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Contemplation' },
  { id: 18, file: 'p1310819-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Expression' },
  { id: 19, file: 'p1340714-avec-accentuation-bruit.webp',  cat: 'portrait',    title: 'Présence' },
  { id: 20, file: 'p1280127.webp',                          cat: 'portrait',    title: 'Vision' },
  { id: 21, file: 'p1280145.webp',                          cat: 'portrait',    title: 'Instant' },
  { id: 22, file: 'p1010953.webp',                          cat: 'mode',        title: 'Sommet' },
  { id: 23, file: 'p1150510.webp',                          cat: 'mode',        title: 'Damier' },
  { id: 24, file: 'p1290127.webp',                          cat: 'mode',        title: 'Rouge Passion' },
  { id: 25, file: 'p1300655.webp',                          cat: 'mode',        title: 'Béton Blanc' },
  { id: 26, file: 'p1280230.webp',                          cat: 'mode',        title: 'Minimalisme' },
  { id: 27, file: 'p1290352.webp',                          cat: 'mode',        title: 'Attitude' },
  { id: 28, file: 'p1290650.webp',                          cat: 'mode',        title: 'Posture' },
  { id: 29, file: 'p1300673.webp',                          cat: 'mode',        title: 'Ligne' },
  { id: 30, file: 'p1300715.webp',                          cat: 'mode',        title: 'Texture' },
  { id: 31, file: 'p1300865.webp',                          cat: 'mode',        title: 'Mouvement' },
  { id: 32, file: 'p1300900.webp',                          cat: 'mode',        title: 'Grâce' },
  { id: 33, file: 'p1310849.webp',                          cat: 'mode',        title: 'Équilibre' },
  { id: 34, file: 'p1310958.webp',                          cat: 'mode',        title: 'Forme' },
  { id: 35, file: 'p1320793.webp',                          cat: 'mode',        title: 'Caractère' },
  { id: 36, file: 'p1320861.webp',                          cat: 'mode',        title: 'Contraste' },
  { id: 37, file: 'p1350085.webp',                          cat: 'mode',        title: 'Couleur' },
  { id: 38, file: 'p1350052.webp',                          cat: 'mode',        title: 'Silhouette' },
  { id: 39, file: 'p1310803.webp',                          cat: 'mode',        title: 'Espace' },
  { id: 40, file: 'p1280093.webp',                          cat: 'urbaine',     title: 'Nuit Électrique' },
  { id: 41, file: 'p1310683.webp',                          cat: 'urbaine',     title: 'Lyon Fontaine' },
  { id: 42, file: 'p1140367.webp',                          cat: 'urbaine',     title: 'Rue' },
  { id: 43, file: 'p1150635.webp',                          cat: 'urbaine',     title: 'Architecture' },
  { id: 44, file: 'p1160024.webp',                          cat: 'urbaine',     title: 'Lumières de Ville' },
  { id: 45, file: 'p1240906.webp',                          cat: 'urbaine',     title: 'Passage' },
  { id: 46, file: 'p1250885.webp',                          cat: 'urbaine',     title: 'Angle' },
  { id: 47, file: 'p1240530.jpg',                           cat: 'urbaine',     title: 'Horizon' },
  { id: 48, file: 'p1210815.jpg',                           cat: 'evenement',   title: 'Baby Shower' },
  { id: 49, file: 'p1210830.jpg',                           cat: 'evenement',   title: 'Célébration' },
  { id: 50, file: 'p1210836.jpg',                           cat: 'evenement',   title: 'Joie Partagée' },
  { id: 51, file: 'p1230712.webp',                          cat: 'corporate',   title: 'Portrait Métier' },
  { id: 52, file: 'p1340822.webp',                          cat: 'corporate',   title: 'Innovation' },
]

const CATEGORIES = [
  { key: 'tout',       label: 'Tout' },
  { key: 'portrait',   label: 'Portrait' },
  { key: 'mode',       label: 'Mode' },
  { key: 'urbaine',    label: 'Urbaine' },
  { key: 'evenement',  label: 'Événement' },
  { key: 'corporate',  label: 'Corporate' },
]

/* ─── Shared animation variants ──────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

/* ─── Animated section wrapper ───────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Logo SVG ────────────────────────────────────────────── */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="viewbydaryl logo">
      <circle cx="30" cy="30" r="26" stroke="#C4965A" strokeWidth="2"/>
      <circle cx="30" cy="30" r="10" fill="#C4965A"/>
      <line x1="30" y1="4"  x2="30" y2="15" stroke="#C4965A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="30" y1="45" x2="30" y2="56" stroke="#C4965A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4"  y1="30" x2="15" y2="30" stroke="#C4965A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="45" y1="30" x2="56" y2="30" stroke="#C4965A" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

/* ─── Navbar ──────────────────────────────────────────────── */
function Navbar({ onNav }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { id: 'about',      label: 'À Propos' },
    { id: 'portfolio',  label: 'Portfolio' },
    { id: 'sessions',   label: 'Sessions' },
    { id: 'booking',    label: 'Réserver' },
    { id: 'contact',    label: 'Contact' },
  ]

  const nav = (id) => {
    setOpen(false)
    onNav(id)
  }

  return (
    <>
      <motion.nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 clamp(1.5rem, 5vw, 4rem)',
          height: scrolled ? '60px' : '76px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(196,150,90,0.1)' : 'none',
          transition: 'height 0.4s ease, background 0.4s ease, border-color 0.4s ease',
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        {/* Logo */}
        <button
          onClick={() => nav('hero')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Logo size={28} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 400, letterSpacing: '0.18em', color: '#E8E0D0' }}>
            <span style={{ fontWeight: 300 }}>view</span>
            <span style={{ color: '#C4965A', fontStyle: 'italic', fontSize: '0.75rem', letterSpacing: '0.1em' }}> by </span>
            <span style={{ fontWeight: 600, letterSpacing: '0.25em' }}>DARYL</span>
          </span>
        </button>

        {/* Desktop links */}
        <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0 }}
          className="nav-links-desktop">
          {links.map(l => (
            <li key={l.id}>
              <button
                onClick={() => nav(l.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: '0.75rem',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: l.id === 'booking' ? '#C4965A' : '#A09888',
                  transition: 'color 0.3s',
                  borderBottom: l.id === 'booking' ? '1px solid #C4965A' : 'none',
                  paddingBottom: '2px',
                }}
                onMouseEnter={e => { if (l.id !== 'booking') e.target.style.color = '#E8E0D0' }}
                onMouseLeave={e => { if (l.id !== 'booking') e.target.style.color = '#A09888' }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'none', flexDirection: 'column', gap: '5px', padding: '4px',
          }}
          aria-label="Menu"
        >
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              style={{ display: 'block', width: '22px', height: '1px', background: '#C4965A', transformOrigin: 'center' }}
              animate={open
                ? i === 0 ? { rotate: 45, y: 6 } : i === 2 ? { rotate: -45, y: -6 } : { opacity: 0 }
                : { rotate: 0, y: 0, opacity: 1 }
              }
              transition={{ duration: 0.3 }}
            />
          ))}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
              background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(196,150,90,0.15)',
              padding: '2rem clamp(1.5rem, 5vw, 4rem)',
              display: 'flex', flexDirection: 'column', gap: '1.5rem',
            }}
          >
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => nav(l.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', fontWeight: 400,
                  color: l.id === 'booking' ? '#C4965A' : '#E8E0D0',
                  letterSpacing: '0.05em',
                }}
              >
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}

/* ─── Hero ────────────────────────────────────────────────── */
function Hero({ onCta }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const titleWords = ['CAPTURER', "L'ESSENCE", 'DE VOTRE', 'HISTOIRE']

  return (
    <section ref={ref} id="hero" style={{ position: 'relative', height: '100svh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Parallax background */}
      <motion.div style={{ position: 'absolute', inset: '-15%', y }}>
        <img
          src={`${BASE}photos/p1270769-avec-accentuation-bruit.webp`}
          alt="viewbydaryl hero"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </motion.div>

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.4) 60%, rgba(8,8,8,0.2) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 40%)',
      }} />

      {/* Noise texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat', backgroundSize: '180px',
      }} />

      {/* Content */}
      <motion.div style={{ position: 'relative', zIndex: 2, opacity, maxWidth: '900px', padding: '0 clamp(1.5rem, 5vw, 4rem)', width: '100%' }}>
        {/* Brand label */}
        <motion.p
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 200, fontSize: '0.7rem',
            letterSpacing: '0.35em', textTransform: 'uppercase', color: '#C4965A',
            marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem',
          }}
        >
          <span style={{ display: 'inline-block', width: '2.5rem', height: '1px', background: '#C4965A' }} />
          DORILAS DARYL — PHOTOGRAPHE
        </motion.p>

        {/* Main title */}
        <motion.div variants={stagger} initial="hidden" animate="visible" transition={{ delayChildren: 1 }}>
          {titleWords.map((word, i) => (
            <div key={i} style={{ overflow: 'hidden', lineHeight: 1.05 }}>
              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(3rem, 8vw, 7rem)',
                  fontWeight: i % 2 === 0 ? 700 : 300,
                  color: '#F5F0E8',
                  fontStyle: i === 1 ? 'italic' : 'normal',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                {word}
              </motion.h1>
            </div>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
            color: '#9A9088', letterSpacing: '0.08em',
            marginTop: '1.8rem', maxWidth: '460px',
          }}
        >
          Portraits · Mode Urbaine · Événements · Corporate
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.1 }}
          style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}
        >
          <GoldButton onClick={() => onCta('portfolio')}>Voir mes travaux</GoldButton>
          <OutlineButton onClick={() => onCta('booking')}>Réserver une séance</OutlineButton>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8 }}
        style={{
          position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 2,
        }}
      >
        <span style={{ fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.25em', color: '#6A6460', textTransform: 'uppercase' }}>Défiler</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ width: '1px', height: '3rem', background: 'linear-gradient(to bottom, #C4965A, transparent)' }}
        />
      </motion.div>
    </section>
  )
}

/* ─── Button helpers ─────────────────────────────────────── */
function GoldButton({ children, onClick, type = 'button', fullWidth = false }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.72rem',
        letterSpacing: '0.22em', textTransform: 'uppercase',
        padding: '0.9rem 2.2rem',
        background: hov ? '#D4A86A' : '#C4965A',
        color: '#080808',
        border: 'none', cursor: 'pointer',
        transition: 'background 0.3s, transform 0.3s',
        transform: hov ? 'translateY(-2px)' : 'none',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </button>
  )
}

function OutlineButton({ children, onClick, type = 'button' }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: '0.72rem',
        letterSpacing: '0.22em', textTransform: 'uppercase',
        padding: '0.9rem 2.2rem',
        background: 'transparent',
        color: hov ? '#E8E0D0' : '#9A9088',
        border: `1px solid ${hov ? 'rgba(196,150,90,0.5)' : 'rgba(196,150,90,0.2)'}`,
        cursor: 'pointer',
        transition: 'color 0.3s, border-color 0.3s, transform 0.3s',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Section Header ─────────────────────────────────────── */
function SectionHeader({ number, title, subtitle }) {
  return (
    <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
      <p style={{
        fontFamily: "'Inter'", fontWeight: 200, fontSize: '0.65rem',
        letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4965A',
        marginBottom: '1rem',
      }}>
        {number} — {subtitle}
      </p>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
        fontWeight: 400, letterSpacing: '-0.01em', color: '#F5F0E8',
        margin: 0,
      }}>
        {title}
      </h2>
      <div style={{ width: '3rem', height: '1px', background: '#C4965A', margin: '1.5rem auto 0' }} />
    </Reveal>
  )
}

/* ─── About ───────────────────────────────────────────────── */
function About() {
  return (
    <section id="about" style={{ background: '#0A0A0A', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: 'clamp(3rem, 6vw, 6rem)', alignItems: 'center' }}>

        {/* Image */}
        <Reveal>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '-1.5rem', left: '-1.5rem', right: '1.5rem', bottom: '1.5rem',
              border: '1px solid rgba(196,150,90,0.2)', pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden', aspectRatio: '4/5' }}>
              <img
                src={`${BASE}photos/p1090055.webp`}
                alt="Daryl — Photographe"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s ease', display: 'block' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
            </div>
            {/* Watermark label */}
            <div style={{
              position: 'absolute', bottom: '-1rem', right: '-1rem', zIndex: 2,
              background: '#C4965A', padding: '0.6rem 1.2rem',
            }}>
              <span style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.25em', color: '#080808', textTransform: 'uppercase' }}>
                ©viewbydaryl
              </span>
            </div>
          </div>
        </Reveal>

        {/* Text */}
        <div>
          <SectionHeaderInline number="01" subtitle="Mon Histoire" title="À Propos" />

          <Reveal delay={0.15}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
              fontWeight: 300, fontStyle: 'italic',
              color: '#C4965A', lineHeight: 1.5,
              margin: '0 0 1.8rem',
            }}>
              « Si tu lis ceci, c'est que je suis certainement la personne qu'il te faut. »
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <p style={{
              fontFamily: "'Inter'", fontWeight: 300, fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)',
              lineHeight: 1.85, color: '#8A8278', marginBottom: '1.4rem',
            }}>
              Allo, je m'appelle <span style={{ color: '#E8E0D0', fontWeight: 400 }}>DORILAS Daryl</span>.
              Je suis photographe et je crois profondément que chaque être humain mérite d'être capturé
              sous sa plus belle lumière — celle qui révèle son essence, son histoire, sa singularité.
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <p style={{
              fontFamily: "'Inter'", fontWeight: 300, fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)',
              lineHeight: 1.85, color: '#8A8278', marginBottom: '2.5rem',
            }}>
              Prenons le temps de nous rencontrer et de parler de ton projet autour d'un café.
              Ensemble, transformons tes idées en images qui durent.
            </p>
          </Reveal>

          <Reveal delay={0.45}>
            <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem' }}>
              {[['52+', 'Sessions réalisées'], ['Lyon', 'Basé à'], ['∞', 'Univers créatifs']].map(([n, l]) => (
                <div key={l}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 600, color: '#C4965A', margin: 0 }}>{n}</p>
                  <p style={{ fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 300, letterSpacing: '0.12em', color: '#6A6460', marginTop: '0.2rem' }}>{l}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.55}>
            <OutlineButton onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
              Prendre contact
            </OutlineButton>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function SectionHeaderInline({ number, title, subtitle }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{ fontFamily: "'Inter'", fontWeight: 200, fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4965A', marginBottom: '0.5rem' }}>
        {number} — {subtitle}
      </p>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 400, color: '#F5F0E8', margin: 0 }}>
        {title}
      </h2>
      <div style={{ width: '2.5rem', height: '1px', background: '#C4965A', marginTop: '1rem' }} />
    </div>
  )
}

/* ─── Portfolio / Lightbox ───────────────────────────────── */
function Portfolio() {
  const [activeCat, setActiveCat] = useState('tout')
  const [lightbox, setLightbox] = useState(null)
  const [loaded, setLoaded] = useState({})

  const filtered = activeCat === 'tout' ? PHOTOS : PHOTOS.filter(p => p.cat === activeCat)

  const prev = useCallback(() => {
    if (!lightbox) return
    const idx = filtered.findIndex(p => p.id === lightbox.id)
    setLightbox(filtered[(idx - 1 + filtered.length) % filtered.length])
  }, [lightbox, filtered])

  const next = useCallback(() => {
    if (!lightbox) return
    const idx = filtered.findIndex(p => p.id === lightbox.id)
    setLightbox(filtered[(idx + 1) % filtered.length])
  }, [lightbox, filtered])

  useEffect(() => {
    const handler = (e) => {
      if (!lightbox) return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  return (
    <section id="portfolio" style={{ background: '#080808', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)' }}>
      <SectionHeader number="02" title="Portfolio" subtitle="Mes Travaux" />

      {/* Filter tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(0.5rem, 2vw, 1.5rem)', marginBottom: 'clamp(2.5rem, 5vw, 4rem)', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCat(c.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.72rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: activeCat === c.key ? '#C4965A' : '#5A5450',
              padding: '0.4rem 0',
              borderBottom: activeCat === c.key ? '1px solid #C4965A' : '1px solid transparent',
              transition: 'color 0.3s, border-color 0.3s',
            }}
            onMouseEnter={e => { if (activeCat !== c.key) e.target.style.color = '#9A9088' }}
            onMouseLeave={e => { if (activeCat !== c.key) e.target.style.color = '#5A5450' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <motion.div
        layout
        style={{
          columns: 'clamp(180px, 28vw, 340px)',
          columnGap: '0.8rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((photo, i) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
              onClick={() => setLightbox(photo)}
              style={{
                breakInside: 'avoid',
                marginBottom: '0.8rem',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'block',
              }}
              className="gallery-item"
            >
              {/* Hover overlay */}
              <div className="gallery-overlay" style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: 'linear-gradient(to top, rgba(8,8,8,0.8) 0%, transparent 60%)',
                opacity: 0, transition: 'opacity 0.4s',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: '1.2rem',
              }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 400, color: '#F5F0E8', margin: 0 }}>{photo.title}</p>
                <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C4965A', margin: '0.2rem 0 0' }}>{photo.cat}</p>
              </div>

              {!loaded[photo.id] && (
                <div style={{ aspectRatio: '2/3', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '20px', height: '20px', border: '1px solid #C4965A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
              <img
                src={`${BASE}photos/${photo.file}`}
                alt={photo.title}
                loading="lazy"
                onLoad={() => setLoaded(l => ({ ...l, [photo.id]: true }))}
                style={{
                  width: '100%',
                  display: loaded[photo.id] ? 'block' : 'none',
                  transition: 'transform 0.5s ease',
                }}
                className="gallery-img"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(4,4,4,0.96)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setLightbox(null)}
          >
            {/* Close */}
            <button
              style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                background: 'none', border: '1px solid rgba(196,150,90,0.3)',
                color: '#C4965A', cursor: 'pointer',
                width: '44px', height: '44px', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>

            {/* Prev */}
            <button
              style={{
                position: 'absolute', left: 'clamp(0.5rem, 2vw, 2rem)', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: '1px solid rgba(196,150,90,0.3)',
                color: '#C4965A', cursor: 'pointer',
                width: '48px', height: '48px', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
              }}
              onClick={e => { e.stopPropagation(); prev() }}
            >
              ‹
            </button>

            {/* Image */}
            <motion.div
              key={lightbox.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '88vh', position: 'relative' }}
            >
              <img
                src={`${BASE}photos/${lightbox.file}`}
                alt={lightbox.title}
                style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
              />
              <div style={{ padding: '1rem 0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 400, color: '#E8E0D0', margin: 0 }}>{lightbox.title}</p>
                <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C4965A', margin: 0 }}>{lightbox.cat}</p>
              </div>
            </motion.div>

            {/* Next */}
            <button
              style={{
                position: 'absolute', right: 'clamp(0.5rem, 2vw, 2rem)', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: '1px solid rgba(196,150,90,0.3)',
                color: '#C4965A', cursor: 'pointer',
                width: '48px', height: '48px', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
              }}
              onClick={e => { e.stopPropagation(); next() }}
            >
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .gallery-item:hover .gallery-overlay { opacity: 1; }
        .gallery-item:hover .gallery-img { transform: scale(1.04); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}

/* ─── Sessions ───────────────────────────────────────────── */
const SESSIONS = [
  {
    icon: '◎',
    name: 'Séance Portrait',
    duration: '1h — Studio ou extérieur',
    price: 'Sur devis',
    desc: 'Une séance intime dédiée à vous. Je capture votre personnalité, votre regard, votre authenticité. Idéal pour un portrait professionnel ou un shooting personnel.',
    includes: ['10 photos retouchées', 'Galerie privée en ligne', 'Fichiers haute résolution', 'Retouche professionnelle'],
    highlight: false,
  },
  {
    icon: '◈',
    name: 'Mode & Urbaine',
    duration: '2–3h — En ville',
    price: 'Sur devis',
    desc: 'La ville devient votre décor. Architectures, lumières urbaines, atmosphères… Chaque coin de rue devient une scène pour votre histoire de mode.',
    includes: ['20 photos retouchées', 'Repérage des lieux inclus', 'Galerie privée en ligne', 'Fichiers haute résolution', 'Direction artistique'],
    highlight: true,
  },
  {
    icon: '◇',
    name: 'Événement',
    duration: 'Demi-journée / Journée',
    price: 'Sur devis',
    desc: "Baby shower, anniversaire, mariage, événement d'entreprise… Je couvre votre moment précieux avec discrétion et sensibilité pour immortaliser chaque instant.",
    includes: ['Couverture complète', 'Galerie privée en ligne', 'Fichiers haute résolution', 'Retouche professionnelle', 'Livraison sous 7 jours'],
    highlight: false,
  },
]

function Sessions({ onBook }) {
  return (
    <section id="sessions" style={{ background: '#0C0C0C', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)' }}>
      <SectionHeader number="03" title="Nos Sessions" subtitle="Tarifs & Formules" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5px', maxWidth: '1100px', margin: '0 auto' }}>
        {SESSIONS.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.15}>
            <SessionCard s={s} onBook={onBook} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.4}>
        <p style={{
          textAlign: 'center', marginTop: '3rem',
          fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.8rem',
          color: '#5A5450', letterSpacing: '0.05em',
        }}>
          Toutes les formules sont personnalisables.{' '}
          <button
            onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4965A', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 400, textDecoration: 'underline', letterSpacing: 'inherit' }}
          >
            Contactez-moi
          </button>
          {' '}pour un devis sur mesure.
        </p>
      </Reveal>
    </section>
  )
}

function SessionCard({ s, onBook }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: s.highlight ? 'linear-gradient(135deg, #1A1208 0%, #0F0A04 100%)' : '#0E0E0E',
        border: s.highlight ? '1px solid rgba(196,150,90,0.4)' : '1px solid rgba(255,255,255,0.04)',
        padding: 'clamp(2rem, 4vw, 2.8rem)',
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.4s ease, border-color 0.4s',
        transform: hov ? 'translateY(-6px)' : 'none',
        borderColor: hov ? 'rgba(196,150,90,0.5)' : s.highlight ? 'rgba(196,150,90,0.4)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {s.highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(to right, transparent, #C4965A, transparent)',
        }} />
      )}
      {s.highlight && (
        <span style={{
          position: 'absolute', top: '1.2rem', right: '1.2rem',
          fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 400,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#080808', background: '#C4965A', padding: '0.25rem 0.7rem',
        }}>
          Populaire
        </span>
      )}

      <div style={{ fontSize: '1.4rem', color: '#C4965A', marginBottom: '1.5rem', fontWeight: 300 }}>{s.icon}</div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 500, color: '#F5F0E8', margin: '0 0 0.4rem' }}>{s.name}</h3>
      <p style={{ fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 300, letterSpacing: '0.1em', color: '#C4965A', margin: '0 0 1.4rem', textTransform: 'uppercase' }}>{s.duration}</p>
      <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.85rem', lineHeight: 1.8, color: '#7A7268', margin: '0 0 2rem' }}>{s.desc}</p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {s.includes.map(inc => (
          <li key={inc} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', fontFamily: "'Inter'", fontSize: '0.8rem', fontWeight: 300, color: '#8A8278' }}>
            <span style={{ color: '#C4965A', marginTop: '0.05rem', flexShrink: 0 }}>—</span>
            {inc}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(196,150,90,0.12)', paddingTop: '1.5rem' }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#C4965A' }}>{s.price}</span>
        <button
          onClick={onBook}
          style={{
            background: s.highlight ? '#C4965A' : 'transparent',
            border: `1px solid ${s.highlight ? '#C4965A' : 'rgba(196,150,90,0.35)'}`,
            color: s.highlight ? '#080808' : '#C4965A',
            fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 400,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '0.6rem 1.4rem', cursor: 'pointer',
            transition: 'background 0.3s, color 0.3s',
          }}
          onMouseEnter={e => {
            if (!s.highlight) { e.currentTarget.style.background = 'rgba(196,150,90,0.15)' }
          }}
          onMouseLeave={e => {
            if (!s.highlight) { e.currentTarget.style.background = 'transparent' }
          }}
        >
          Réserver
        </button>
      </div>
    </div>
  )
}

/* ─── Booking ────────────────────────────────────────────── */
function Booking() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', session: '', date: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Requis'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide'
    if (!form.session) e.session = 'Requis'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setSubmitted(true)
  }

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(er => ({ ...er, [field]: undefined }))
  }

  return (
    <section id="booking" style={{
      background: '#080808',
      padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* BG accent */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '70vw', maxWidth: '700px', maxHeight: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,150,90,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <SectionHeader number="04" title="Réservation" subtitle="Votre Séance" />

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSubmit}
            >
              <Reveal>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <FormField label="Prénom & Nom *" error={errors.nom}>
                    <input placeholder="DORILAS Daryl" value={form.nom} onChange={e => set('nom', e.target.value)} style={inputStyle(!!errors.nom)} />
                  </FormField>
                  <FormField label="Email *" error={errors.email}>
                    <input type="email" placeholder="daryl@example.com" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle(!!errors.email)} />
                  </FormField>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <FormField label="Téléphone">
                    <input placeholder="+33 6 00 00 00 00" value={form.telephone} onChange={e => set('telephone', e.target.value)} style={inputStyle(false)} />
                  </FormField>
                  <FormField label="Type de séance *" error={errors.session}>
                    <select value={form.session} onChange={e => set('session', e.target.value)} style={{ ...inputStyle(!!errors.session), appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Choisir une formule</option>
                      <option value="portrait">Séance Portrait</option>
                      <option value="mode">Mode & Urbaine</option>
                      <option value="evenement">Événement</option>
                      <option value="corporate">Corporate</option>
                      <option value="autre">Autre / Sur mesure</option>
                    </select>
                  </FormField>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <FormField label="Date souhaitée">
                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle(false)} />
                  </FormField>
                </div>
              </Reveal>

              <Reveal delay={0.3}>
                <div style={{ marginBottom: '2rem' }}>
                  <FormField label="Décrivez votre vision">
                    <textarea
                      placeholder="Parlez-moi de votre projet, votre ambiance souhaitée, vos inspirations…"
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                      rows={5}
                      style={{ ...inputStyle(false), resize: 'vertical', minHeight: '120px' }}
                    />
                  </FormField>
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <GoldButton type="submit" fullWidth>
                  Envoyer ma demande
                </GoldButton>
                <p style={{ textAlign: 'center', fontFamily: "'Inter'", fontSize: '0.72rem', fontWeight: 300, color: '#4A4440', marginTop: '1rem', letterSpacing: '0.05em' }}>
                  Je vous répondrai dans les 24h — 48h
                </p>
              </Reveal>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center', padding: 'clamp(3rem, 6vw, 5rem) 2rem' }}
            >
              <div style={{ width: '72px', height: '72px', border: '1px solid #C4965A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.8rem' }}>
                ✓
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: '#F5F0E8', margin: '0 0 1rem' }}>
                Demande envoyée !
              </h3>
              <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.9rem', color: '#7A7268', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 2rem' }}>
                Merci {form.nom.split(' ')[0]} ! Je vous reviens très vite pour organiser notre rencontre autour d'un café.
              </p>
              <OutlineButton onClick={() => { setSubmitted(false); setForm({ nom: '', email: '', telephone: '', session: '', date: '', message: '' }) }}>
                Nouvelle demande
              </OutlineButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '0.9rem 1rem',
  background: '#0E0E0E',
  border: `1px solid ${hasError ? 'rgba(220,80,80,0.5)' : 'rgba(196,150,90,0.15)'}`,
  color: '#E8E0D0',
  fontFamily: "'Inter', sans-serif",
  fontWeight: 300,
  fontSize: '0.88rem',
  outline: 'none',
  transition: 'border-color 0.3s',
  boxSizing: 'border-box',
})

function FormField({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: error ? 'rgba(220,80,80,0.8)' : '#5A5450' }}>
        {label}{error && <span style={{ marginLeft: '0.5rem', fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>{error}</span>}
      </label>
      {children}
    </div>
  )
}

/* ─── Contact ────────────────────────────────────────────── */
function Contact() {
  return (
    <section id="contact" style={{
      background: '#0A0A0A',
      padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)',
      borderTop: '1px solid rgba(196,150,90,0.08)',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <SectionHeader number="05" title="Contact" subtitle="Travaillons Ensemble" />

        <Reveal>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
            fontWeight: 300, fontStyle: 'italic', color: '#8A8278',
            maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.6,
          }}>
            « Prenons le temps de nous rencontrer et de parler de ton projet autour d'un café. »
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1.5rem, 4vw, 4rem)', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            {[
              { icon: '✉', label: 'Email', value: 'dorilas.daryl@gmail.com', href: 'mailto:dorilas.daryl@gmail.com' },
              { icon: '◎', label: 'Instagram', value: '@viewbydaryl', href: 'https://instagram.com/viewbydaryl' },
              { icon: '◈', label: 'Basé à', value: 'Lyon, France', href: null },
            ].map(c => (
              <div key={c.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#C4965A', marginBottom: '0.5rem' }}>{c.icon}</div>
                <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#5A5450', margin: '0 0 0.4rem' }}>{c.label}</p>
                {c.href ? (
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                    style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.9rem', color: '#C4965A', textDecoration: 'none', letterSpacing: '0.03em' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}
                  >
                    {c.value}
                  </a>
                ) : (
                  <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.9rem', color: '#8A8278', margin: 0 }}>{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Social follow */}
        <Reveal delay={0.3}>
          <a
            href="https://instagram.com/viewbydaryl"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
              fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.72rem',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#C4965A', textDecoration: 'none',
              border: '1px solid rgba(196,150,90,0.3)',
              padding: '0.9rem 2.2rem',
              transition: 'background 0.3s, color 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,150,90,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            Suivre sur Instagram
          </a>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      background: '#050505',
      borderTop: '1px solid rgba(196,150,90,0.08)',
      padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <Logo size={22} />
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.9rem', fontWeight: 300, letterSpacing: '0.2em', color: '#5A5450' }}>
          <span>view</span>
          <span style={{ color: '#C4965A', fontStyle: 'italic', fontSize: '0.7rem' }}> by </span>
          <span style={{ fontWeight: 600, letterSpacing: '0.25em' }}>DARYL</span>
        </span>
      </div>
      <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.7rem', letterSpacing: '0.1em', color: '#3A3530', margin: 0 }}>
        © {new Date().getFullYear()} DORILAS Daryl — Tous droits réservés
      </p>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {['Portrait', 'Mode', 'Événement'].map(t => (
          <span key={t} style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A3530' }}>{t}</span>
        ))}
      </div>
    </footer>
  )
}

/* ─── Floating contact bar (right side) ─────────────────── */
function FloatingContact() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          style={{
            position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 50, display: 'flex', flexDirection: 'column', gap: 0,
          }}
        >
          {[
            { icon: '✉', href: 'mailto:dorilas.daryl@gmail.com', label: 'Email' },
            { icon: '◎', href: 'https://instagram.com/viewbydaryl', label: 'Instagram' },
          ].map(c => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : '_self'}
              rel="noreferrer"
              title={c.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px',
                background: 'rgba(8,8,8,0.9)',
                borderLeft: '1px solid rgba(196,150,90,0.3)',
                borderTop: '1px solid rgba(196,150,90,0.1)',
                borderBottom: '1px solid rgba(196,150,90,0.1)',
                color: '#C4965A', fontFamily: "'Cormorant Garamond', serif",
                fontSize: '0.9rem', textDecoration: 'none',
                transition: 'background 0.3s',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,150,90,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,8,8,0.9)'}
            >
              {c.icon}
            </a>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar onNav={scrollTo} />
      <Hero onCta={scrollTo} />
      <About />
      <Portfolio />
      <Sessions onBook={() => scrollTo('booking')} />
      <Booking />
      <Contact />
      <Footer />
      <FloatingContact />
    </>
  )
}
