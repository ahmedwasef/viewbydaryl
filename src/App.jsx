import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import BookingCalendar from './BookingCalendar'
import Admin from './Admin'

const BASE = import.meta.env.BASE_URL

/* ─── Bookings (availability) helpers ───────────────────── */
const BOOKINGS_KEY = 'vbd_bookings_v1'
function loadBookings() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]') } catch { return [] }
}
function saveBooking(booking) {
  const arr = loadBookings()
  arr.push({ ...booking, id: `bk_${Date.now()}` })
  try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(arr)) } catch {}
}
function getBookedDates() {
  return loadBookings().map(b => b.date).filter(Boolean)
}

/* ─── Admin content overrides ───────────────────────────── */
function loadAdminContent(defaults) {
  const out = { ...defaults }
  try {
    const p = localStorage.getItem('vbd_admin_photos')
    const s = localStorage.getItem('vbd_admin_sessions')
    const a = localStorage.getItem('vbd_admin_about')
    if (p) out.photos   = JSON.parse(p)
    if (s) out.sessions = JSON.parse(s)
    if (a) out.about    = JSON.parse(a)
  } catch {}
  return out
}

/* ─── ICS calendar file generator ───────────────────────── */
function generateICS(form) {
  const SESSION_LABELS_ICS = {
    portrait: 'Séance Portrait', mode: 'Mode & Urbaine',
    evenement: 'Événement', corporate: 'Corporate', autre: 'Sur mesure',
  }
  const title   = `Séance Photo viewbydaryl — ${SESSION_LABELS_ICS[form.session] || form.session}`
  const dtStart = form.date ? form.date.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const nextDay = (() => {
    const d = new Date((form.date || new Date().toISOString().slice(0, 10)) + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10).replace(/-/g, '')
  })()
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//viewbydaryl//FR', 'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@viewbydaryl`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${nextDay}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Client: ${form.nom}\\nEmail: ${form.email}\\nTél: ${form.telephone || 'n/a'}\\n\\n${form.message || ''}`,
    'LOCATION:Montréal\\, QC\\, Canada',
    'ORGANIZER;CN=DORILAS Daryl:mailto:Vbdaryl17@outlook.fr',
    `ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${form.email}`,
    'STATUS:TENTATIVE',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}
function downloadICS(form) {
  const blob = new Blob([generateICS(form)], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'seance-viewbydaryl.ics' })
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

/* ─── Photo catalogue ─────────────────────────────────────── */
/* Categories: regards · style · cites · instants · terrains  */
const PHOTOS = [
  /* ── REGARDS ─────────────────────────────────────────────── */
  { id: 1,  file: 'p1270769-avec-accentuation-bruit.webp', cat: 'regards',   title: 'Lumière Rouge',          slogan: "Quand l'ombre devient lumière." },
  { id: 2,  file: 'p1090055.webp',                          cat: 'regards',   title: 'Sous la Pluie',          slogan: "Les âmes libres ne craignent pas la tempête." },
  { id: 3,  file: 'p1320776.webp',                          cat: 'regards',   title: 'Éclat Sombre',           slogan: "L'obscurité révèle ce que la lumière cache." },
  { id: 4,  file: 'p1350171-1.webp',                        cat: 'regards',   title: 'Lumière Naturelle',      slogan: "Entre deux mondes, un regard suspendu." },
  { id: 5,  file: 'p1110401-2.webp',                        cat: 'regards',   title: 'Cygnes au Crépuscule',   slogan: "La paix n'est jamais là où on la cherche." },
  { id: 6,  file: 'p1270794-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Ombre & Lumière',        slogan: "Le contraste est la signature des âmes fortes." },
  { id: 7,  file: 'p1270807-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Regard',                 slogan: "Un regard vaut mille silences." },
  { id: 8,  file: 'p1280858-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Intensité',              slogan: "Certains brûlent sans jamais se consumer." },
  { id: 9,  file: 'p1280881-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Contrejour',             slogan: "La lumière derrière toi, l'avenir devant." },
  { id: 10, file: 'p1280951-avec-accentuation-bruit.webp',  cat: 'regards',   title: "Grain d'Argent",         slogan: "La perfection se cache dans l'imperfection." },
  { id: 11, file: 'p1290159-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Profondeur',             slogan: "Les yeux ne mentent jamais." },
  { id: 12, file: 'p1290299-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Silence',                slogan: "Le silence dit tout ce que les mots oublient." },
  { id: 13, file: 'p1300771-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Mystère',                slogan: "Tout ce qui se cache mérite d'être révélé." },
  { id: 14, file: 'p1310419-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Détail',                 slogan: "C'est dans les détails que réside la vérité." },
  { id: 15, file: 'p1310446-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Douceur',                slogan: "La douceur est la force des âmes profondes." },
  { id: 16, file: 'p1310609-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Âme',                    slogan: "Chaque âme porte un univers entier." },
  { id: 17, file: 'p1310766-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Contemplation',          slogan: "S'arrêter, c'est déjà voyager." },
  { id: 18, file: 'p1310819-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Expression',             slogan: "Le visage est le reflet de l'intérieur." },
  { id: 19, file: 'p1340714-avec-accentuation-bruit.webp',  cat: 'regards',   title: 'Présence',               slogan: "Être là, vraiment — c'est déjà un art." },
  { id: 20, file: 'p1280127.webp',                          cat: 'regards',   title: 'Vision',                 slogan: "Ce que tu vois dit qui tu es." },
  { id: 21, file: 'p1280145.webp',                          cat: 'regards',   title: 'Instant',                slogan: "L'instant parfait n'attend pas." },
  /* ── STYLE ───────────────────────────────────────────────── */
  { id: 22, file: 'p1010953.webp',                          cat: 'style',     title: 'Sommet',                 slogan: "Chaque hauteur a son propre silence." },
  { id: 23, file: 'p1150510.webp',                          cat: 'style',     title: 'Damier',                 slogan: "Le style, c'est refuser de disparaître." },
  { id: 24, file: 'p1290127.webp',                          cat: 'style',     title: 'Rouge Passion',          slogan: "La passion n'a pas de couleur neutre." },
  { id: 25, file: 'p1300655.webp',                          cat: 'style',     title: 'Béton Blanc',            slogan: "La ville est ta plus belle toile." },
  { id: 26, file: 'p1280230.webp',                          cat: 'style',     title: 'Minimalisme',            slogan: "Moins de bruit, plus de présence." },
  { id: 27, file: 'p1290352.webp',                          cat: 'style',     title: 'Attitude',               slogan: "L'attitude est le vêtement qu'on ne retire jamais." },
  { id: 28, file: 'p1290650.webp',                          cat: 'style',     title: 'Posture',                slogan: "La façon de se tenir dit tout." },
  { id: 29, file: 'p1300673.webp',                          cat: 'style',     title: 'Ligne',                  slogan: "La droiture est aussi un style." },
  { id: 30, file: 'p1300715.webp',                          cat: 'style',     title: 'Texture',                slogan: "Chaque tissu a sa propre histoire." },
  { id: 31, file: 'p1300865.webp',                          cat: 'style',     title: 'Mouvement',              slogan: "La mode n'est belle qu'en mouvement." },
  { id: 32, file: 'p1300900.webp',                          cat: 'style',     title: 'Grâce',                  slogan: "La grâce ne s'apprend pas, elle se révèle." },
  { id: 33, file: 'p1310849.webp',                          cat: 'style',     title: 'Équilibre',              slogan: "Le vrai style naît de l'équilibre parfait." },
  { id: 34, file: 'p1310958.webp',                          cat: 'style',     title: 'Forme',                  slogan: "La forme suit l'intention." },
  { id: 35, file: 'p1320793.webp',                          cat: 'style',     title: 'Caractère',              slogan: "Sans caractère, pas de style." },
  { id: 36, file: 'p1320861.webp',                          cat: 'style',     title: 'Contraste',              slogan: "Les opposés se révèlent mutuellement." },
  { id: 37, file: 'p1350085.webp',                          cat: 'style',     title: 'Couleur',                slogan: "La couleur est la langue de l'âme." },
  { id: 38, file: 'p1350052.webp',                          cat: 'style',     title: 'Silhouette',             slogan: "Une silhouette peut changer une pièce entière." },
  { id: 39, file: 'p1310803.webp',                          cat: 'style',     title: 'Espace',                 slogan: "L'espace entre les choses définit leur essence." },
  /* ── CITÉS ───────────────────────────────────────────────── */
  { id: 40, file: 'p1280093.webp',                          cat: 'cites',     title: 'Nuit Électrique',        slogan: "La nuit appartient à ceux qui osent." },
  { id: 41, file: 'p1310683.webp',                          cat: 'cites',     title: 'Lyon Fontaine',          slogan: "Chaque ville a ses propres légendes." },
  { id: 42, file: 'p1140367.webp',                          cat: 'cites',     title: 'La Rue',                 slogan: "La rue est le plus grand des studios." },
  { id: 43, file: 'p1150635.webp',                          cat: 'cites',     title: 'Architecture',           slogan: "Les murs ont leurs propres histoires." },
  { id: 44, file: 'p1160024.webp',                          cat: 'cites',     title: 'Lumières de Ville',      slogan: "La ville ne dort jamais vraiment." },
  { id: 45, file: 'p1240906.webp',                          cat: 'cites',     title: 'Passage',                slogan: "Tout chemin mène quelque part." },
  { id: 46, file: 'p1250885.webp',                          cat: 'cites',     title: 'Angle',                  slogan: "Change d'angle, change de monde." },
  { id: 47, file: 'p1240530.jpg',                           cat: 'cites',     title: 'Horizon',                slogan: "L'horizon ne disparaît jamais." },
  /* ── INSTANTS ────────────────────────────────────────────── */
  { id: 48, file: 'p1210815.jpg',                           cat: 'instants',  title: 'Baby Shower',            slogan: "Chaque nouvelle vie mérite une ovation." },
  { id: 49, file: 'p1210830.jpg',                           cat: 'instants',  title: 'Célébration',            slogan: "Les joies partagées se multiplient." },
  { id: 50, file: 'p1210836.jpg',                           cat: 'instants',  title: 'Joie Partagée',          slogan: "La fête, c'est la vie qui se souvient d'elle-même." },
  /* ── TERRAINS ────────────────────────────────────────────── */
  { id: 51, file: 'p1230712.webp',                          cat: 'terrains',  title: "L'Artisan",              slogan: "Les mains qui créent racontent plus que les mots." },
  { id: 52, file: 'p1340822.webp',                          cat: 'terrains',  title: 'Étincelles',             slogan: "L'excellence se forge dans les épreuves." },
]

const CATEGORIES = [
  { key: 'tout',      label: 'Tout' },
  { key: 'regards',   label: 'Regards' },
  { key: 'style',     label: 'Style' },
  { key: 'cites',     label: 'Cités' },
  { key: 'instants',  label: 'Instants' },
  { key: 'terrains',  label: 'Terrains' },
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
    { id: 'about',        label: 'À Propos' },
    { id: 'portfolio',    label: 'Portfolio' },
    { id: 'sessions',     label: 'Sessions' },
    { id: 'temoignages',  label: 'Avis' },
    { id: 'booking',      label: 'Réserver' },
    { id: 'contact',      label: 'Contact' },
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
function GoldButton({ children, onClick, type = 'button', fullWidth = false, disabled = false }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.72rem',
        letterSpacing: '0.22em', textTransform: 'uppercase',
        padding: '0.9rem 2.2rem',
        background: disabled ? '#5A5050' : hov ? '#D4A86A' : '#C4965A',
        color: '#080808',
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.3s, transform 0.3s',
        transform: hov && !disabled ? 'translateY(-2px)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
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
function About({ about }) {
  const quote = about?.quote ?? "« Si tu lis ceci, c'est que je suis certainement la personne qu'il te faut. »"
  const para1 = about?.para1 ?? "Allo, je m'appelle DORILAS Daryl. Je suis photographe et je crois profondément que chaque être humain mérite d'être capturé sous sa plus belle lumière — celle qui révèle son essence, son histoire, sa singularité."
  const para2 = about?.para2 ?? "Prenons le temps de nous rencontrer et de parler de ton projet autour d'un café. Ensemble, transformons tes idées en images qui durent."
  const stats = about?.stats ?? [['52+', 'Sessions réalisées'], ['Montréal', 'Basé à'], ['∞', 'Univers créatifs']]
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
              {quote}
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <p style={{
              fontFamily: "'Inter'", fontWeight: 300, fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)',
              lineHeight: 1.85, color: '#8A8278', marginBottom: '1.4rem',
            }}>
              {para1}
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <p style={{
              fontFamily: "'Inter'", fontWeight: 300, fontSize: 'clamp(0.88rem, 1.4vw, 0.95rem)',
              lineHeight: 1.85, color: '#8A8278', marginBottom: '2.5rem',
            }}>
              {para2}
            </p>
          </Reveal>

          <Reveal delay={0.45}>
            <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem' }}>
              {stats.map(([n, l]) => (
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
function Portfolio({ photos: photosProp }) {
  const photos = photosProp || PHOTOS
  const [activeCat, setActiveCat] = useState('tout')
  const [lightbox, setLightbox] = useState(null)
  const [loaded, setLoaded] = useState({})
  // Touch swipe state
  const touchStartX = useRef(null)

  const filtered = activeCat === 'tout' ? photos : photos.filter(p => p.cat === activeCat)

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
                background: 'linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.2) 55%, transparent 100%)',
                opacity: 0, transition: 'opacity 0.4s',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: '1.2rem',
              }}>
                <p style={{ fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 300, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4965A', margin: '0 0 0.35rem' }}>{photo.cat}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 500, color: '#F5F0E8', margin: 0, lineHeight: 1.2 }}>{photo.title}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.82rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(196,150,90,0.85)', margin: '0.3rem 0 0', lineHeight: 1.35 }}>{photo.slogan}</p>
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
        {lightbox && (() => {
          const currentIdx = filtered.findIndex(p => p.id === lightbox.id)
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(4,4,4,0.97)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setLightbox(null)}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={e => {
                if (touchStartX.current === null) return
                const dx = e.changedTouches[0].clientX - touchStartX.current
                if (dx < -50) next()
                else if (dx > 50) prev()
                touchStartX.current = null
              }}
            >
              {/* Top bar: counter + close */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                background: 'linear-gradient(to bottom, rgba(4,4,4,0.8), transparent)',
                zIndex: 10,
              }}
                onClick={e => e.stopPropagation()}
              >
                {/* Category + counter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 300, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C4965A', background: 'rgba(196,150,90,0.1)', padding: '0.25rem 0.7rem', border: '1px solid rgba(196,150,90,0.2)' }}>
                    {lightbox.cat}
                  </span>
                  <span style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 300, color: '#5A5450', letterSpacing: '0.1em' }}>
                    {currentIdx + 1} / {filtered.length}
                  </span>
                </div>
                <button
                  style={{
                    background: 'none', border: '1px solid rgba(196,150,90,0.3)',
                    color: '#C4965A', cursor: 'pointer',
                    width: '44px', height: '44px', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => setLightbox(null)}
                >
                  ✕
                </button>
              </div>

              {/* Prev */}
              <button
                style={{
                  position: 'absolute', left: 'clamp(0.5rem, 2vw, 2rem)', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(8,8,8,0.6)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(196,150,90,0.3)',
                  color: '#C4965A', cursor: 'pointer',
                  width: '48px', height: '48px', fontSize: '1.4rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10,
                }}
                onClick={e => { e.stopPropagation(); prev() }}
              >
                ‹
              </button>

              {/* Image + caption */}
              <motion.div
                key={lightbox.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32 }}
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  maxWidth: 'min(90vw, calc(100vh * 0.75))', width: '100%',
                  padding: '0 3.5rem',
                  boxSizing: 'border-box',
                }}
              >
                <img
                  src={`${BASE}photos/${lightbox.file}`}
                  alt={lightbox.title}
                  style={{
                    maxWidth: '100%', maxHeight: '75vh',
                    objectFit: 'contain', display: 'block',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                />

                {/* Caption panel */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  style={{
                    width: '100%', padding: '1rem 0.5rem 0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem',
                  }}
                >
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 500, color: '#E8E0D0', margin: 0, lineHeight: 1.2 }}>
                      {lightbox.title}
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(0.8rem, 1.8vw, 0.92rem)', fontWeight: 300, fontStyle: 'italic', color: 'rgba(196,150,90,0.8)', margin: '0.3rem 0 0' }}>
                      {lightbox.slogan}
                    </p>
                  </div>
                  {/* Swipe hint on mobile */}
                  <p style={{ fontFamily: "'Inter'", fontSize: '0.58rem', fontWeight: 300, color: '#3A3530', letterSpacing: '0.08em', textAlign: 'right', flexShrink: 0 }}>
                    ← →
                  </p>
                </motion.div>
              </motion.div>

              {/* Next */}
              <button
                style={{
                  position: 'absolute', right: 'clamp(0.5rem, 2vw, 2rem)', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(8,8,8,0.6)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(196,150,90,0.3)',
                  color: '#C4965A', cursor: 'pointer',
                  width: '48px', height: '48px', fontSize: '1.4rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10,
                }}
                onClick={e => { e.stopPropagation(); next() }}
              >
                ›
              </button>
            </motion.div>
          )
        })()}
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

function Sessions({ onBook, sessions: sessionsProp }) {
  const sessions = sessionsProp || SESSIONS
  return (
    <section id="sessions" style={{ background: '#0C0C0C', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)' }}>
      <SectionHeader number="03" title="Nos Sessions" subtitle="Tarifs & Formules" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5px', maxWidth: '1100px', margin: '0 auto' }}>
        {sessions.map((s, i) => (
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
/* ─── Google Calendar URL builder ───────────────────────── */
function buildCalendarUrl(form) {
  const sessionLabels = {
    portrait: 'Séance Portrait',
    mode: 'Mode & Urbaine',
    evenement: 'Événement',
    corporate: 'Corporate',
    autre: 'Sur mesure',
  }
  const title = encodeURIComponent(`📸 Séance Photo viewbydaryl — ${sessionLabels[form.session] || form.session}`)
  const details = encodeURIComponent(
    `Séance photo avec DORILAS Daryl (viewbydaryl).\n\n` +
    `Client : ${form.nom}\n` +
    (form.message ? `Vision : ${form.message}\n\n` : '\n') +
    `Contact Daryl :\n• Email : Vbdaryl17@outlook.fr\n• WhatsApp : +1 579 372 3265\n• Instagram : @viewbydaryl__`
  )
  const location = encodeURIComponent('Montréal, QC, Canada')

  let dates
  if (form.date) {
    // All-day event: YYYYMMDD — end is next day
    const d = new Date(form.date + 'T12:00:00')
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const fmt = dt => dt.toISOString().slice(0, 10).replace(/-/g, '')
    dates = `${fmt(d)}/${fmt(next)}`
  } else {
    // Default: 2-hour block starting at 10:00 UTC today
    const now = new Date()
    now.setUTCHours(10, 0, 0, 0)
    const end = new Date(now)
    end.setUTCHours(12, 0, 0, 0)
    const fmt = dt => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    dates = `${fmt(now)}/${fmt(end)}`
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`
}

function Booking() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', session: '', date: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [bookedDates, setBookedDates] = useState(() => getBookedDates())

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Requis'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide'
    if (!form.session) e.session = 'Requis'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setSending(true)
    // Save booking locally (blocks the date)
    saveBooking({ nom: form.nom, email: form.email, telephone: form.telephone, session: form.session, date: form.date, message: form.message })
    setBookedDates(getBookedDates())
    // Try Formspree if configured
    try {
      const settings = JSON.parse(localStorage.getItem('vbd_admin_settings') || '{}')
      if (settings.formspreeId) {
        await fetch(`https://formspree.io/f/${settings.formspreeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `📸 Nouvelle réservation viewbydaryl — ${form.session}`,
            _replyto: form.email,
            nom: form.nom, email: form.email, telephone: form.telephone || 'n/a',
            session: form.session, date: form.date || 'non précisée',
            message: form.message || '—',
          }),
        })
      }
    } catch {}
    setSending(false)
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
                    <BookingCalendar
                      selectedDate={form.date}
                      onChange={d => set('date', d)}
                      bookedDates={bookedDates}
                    />
                    {form.date && (
                      <p style={{ fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 300, color: '#C4965A', margin: '0.4rem 0 0', letterSpacing: '0.06em' }}>
                        Date choisie : {new Date(form.date + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
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
                <GoldButton type="submit" fullWidth disabled={sending}>
                  {sending ? 'Envoi en cours…' : 'Envoyer ma demande'}
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
              {/* Check circle */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ width: '72px', height: '72px', border: '1px solid #C4965A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.8rem', color: '#C4965A' }}
              >
                ✓
              </motion.div>

              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: '#F5F0E8', margin: '0 0 1rem' }}>
                Demande envoyée !
              </h3>
              <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.9rem', color: '#7A7268', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                Merci <span style={{ color: '#C4965A' }}>{form.nom.split(' ')[0]}</span> !{' '}
                {form.date ? <>La date du <span style={{ color: '#C4965A' }}>{new Date(form.date + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</span> est réservée.</> : 'Je vous reviens très vite.'}
              </p>

              {/* Calendar actions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center', marginBottom: '1.8rem' }}
              >
                {/* ICS download (works with Apple Calendar, Outlook, Google) */}
                <button
                  onClick={() => downloadICS(form)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
                    fontFamily: "'Inter'", fontWeight: 400, fontSize: '0.75rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    background: '#C4965A', color: '#080808',
                    padding: '0.9rem 2rem', border: 'none', cursor: 'pointer',
                    transition: 'background 0.3s', width: '100%', maxWidth: '320px', justifyContent: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#D4A86A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C4965A'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Télécharger l'invitation .ics
                </button>

                {/* Google Calendar fallback */}
                <a
                  href={buildCalendarUrl(form)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
                    fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.68rem',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#C4965A', textDecoration: 'none',
                    border: '1px solid rgba(196,150,90,0.3)',
                    padding: '0.7rem 1.8rem', transition: 'background 0.3s',
                    width: '100%', maxWidth: '320px', justifyContent: 'center', boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,150,90,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Ouvrir dans Google Calendar
                </a>
              </motion.div>

              <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.68rem', color: '#3A3530', marginBottom: '2rem', letterSpacing: '0.05em' }}>
                Le fichier .ics est compatible Outlook, Apple Calendar et Google Calendar
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1.2rem, 3.5vw, 3.5rem)', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>,
                label: 'Instagram', value: '@viewbydaryl__',
                href: 'https://www.instagram.com/viewbydaryl__?igsh=MWtucDc2ZXh3OHBlOA==',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                label: 'LinkedIn', value: 'Daryl Dorilas',
                href: 'https://www.linkedin.com/in/daryl-dorilas-13566223a?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
                label: 'WhatsApp', value: '+1 579 372 3265',
                href: 'https://wa.me/15793723265',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                label: 'Email', value: 'Vbdaryl17@outlook.fr',
                href: 'mailto:Vbdaryl17@outlook.fr',
              },
            ].map(c => (
              <div key={c.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#C4965A', marginBottom: '0.6rem', display: 'flex', justifyContent: 'center' }}>{c.icon}</div>
                <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#5A5450', margin: '0 0 0.4rem' }}>{c.label}</p>
                <a href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                  style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.85rem', color: '#C4965A', textDecoration: 'none', letterSpacing: '0.02em', display: 'block', maxWidth: '180px' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {c.value}
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Social buttons row */}
        <Reveal delay={0.3}>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://www.instagram.com/viewbydaryl__?igsh=MWtucDc2ZXh3OHBlOA==" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C4965A', textDecoration: 'none', border: '1px solid rgba(196,150,90,0.3)', padding: '0.75rem 1.6rem', transition: 'background 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,150,90,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>
              Instagram
            </a>
            <a href="https://www.linkedin.com/in/daryl-dorilas-13566223a?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C4965A', textDecoration: 'none', border: '1px solid rgba(196,150,90,0.3)', padding: '0.75rem 1.6rem', transition: 'background 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,150,90,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <a href="https://wa.me/15793723265" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C4965A', textDecoration: 'none', border: '1px solid rgba(196,150,90,0.3)', padding: '0.75rem 1.6rem', transition: 'background 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,150,90,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer({ onAdminTrigger }) {
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  const handleCopyrightClick = () => {
    clickCount.current += 1
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 600)
    if (clickCount.current >= 3) { clickCount.current = 0; onAdminTrigger() }
  }

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
      {/* Triple-click to open admin */}
      <p
        onClick={handleCopyrightClick}
        style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.7rem', letterSpacing: '0.1em', color: '#3A3530', margin: 0, userSelect: 'none', cursor: 'default' }}
        title="viewbydaryl"
      >
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
            {
              label: 'Instagram',
              href: 'https://www.instagram.com/viewbydaryl__?igsh=MWtucDc2ZXh3OHBlOA==',
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>,
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/in/daryl-dorilas-13566223a?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
            },
            {
              label: 'WhatsApp',
              href: 'https://wa.me/15793723265',
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
            },
            {
              label: 'Email',
              href: 'mailto:Vbdaryl17@outlook.fr',
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
            },
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
                color: '#C4965A', textDecoration: 'none',
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

/* ═══════════════════════════════════════════════════════════
   REVIEWS — localStorage-backed, one-per-device, photo upload
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY  = 'vbd_reviews_v1'
const DEVICE_KEY   = 'vbd_has_reviewed'

/* Seeded starter reviews so the wall is never empty */
const SEED_REVIEWS = [
  {
    id: 'seed1', name: 'Sophie L.', session: 'portrait', stars: 5,
    text: "Daryl a su capturer exactement ce que je voulais transmettre. Les photos sont d'une qualité impressionnante, je recommande sans hésiter !",
    date: '2025-11-14', photo: null, verified: true,
  },
  {
    id: 'seed2', name: 'Marcus D.', session: 'mode', stars: 5,
    text: "Séance mode & urbaine incroyable. Daryl connaît Lyon — pardon, Montréal — comme sa poche. Chaque décor était parfait, l'ambiance détendue et le résultat professionnel.",
    date: '2025-12-03', photo: null, verified: true,
  },
  {
    id: 'seed3', name: 'Amira K.', session: 'evenement', stars: 5,
    text: "Il a couvert notre baby shower avec une discrétion et une sensibilité rares. Les souvenirs sont magnifiques, toute la famille est conquise.",
    date: '2026-01-21', photo: null, verified: true,
  },
  {
    id: 'seed4', name: 'Thomas R.', session: 'portrait', stars: 4,
    text: "Très bonne expérience. Daryl met vraiment à l'aise devant l'objectif. Je referais sans hésiter.",
    date: '2026-02-08', photo: null, verified: true,
  },
]

const SESSION_LABELS = {
  portrait:  'Portrait',
  mode:      'Mode & Urbaine',
  evenement: 'Événement',
  corporate: 'Corporate',
  autre:     'Autre',
}

/* ── helpers ── */
function loadReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : [...SEED_REVIEWS]
  } catch { return [...SEED_REVIEWS] }
}
function saveReviews(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) } catch {}
}
function hasReviewed() {
  try { return !!localStorage.getItem(DEVICE_KEY) } catch { return false }
}
function markReviewed() {
  try { localStorage.setItem(DEVICE_KEY, '1') } catch {}
}
function avgStars(reviews) {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + r.stars, 0) / reviews.length
}
function starBreakdown(reviews) {
  const counts = [0, 0, 0, 0, 0]
  reviews.forEach(r => { if (r.stars >= 1 && r.stars <= 5) counts[r.stars - 1]++ })
  return counts.reverse() // [5★, 4★, 3★, 2★, 1★]
}

/* ── Star display ── */
function Stars({ value, size = 16, interactive = false, onChange }) {
  const [hover, setHover] = useState(0)
  const display = interactive ? (hover || value) : value
  return (
    <div style={{ display: 'flex', gap: '2px', cursor: interactive ? 'pointer' : 'default' }}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= display
        return (
          <motion.span
            key={n}
            whileHover={interactive ? { scale: 1.25 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange && onChange(n)}
            style={{
              display: 'inline-block', fontSize: size, lineHeight: 1,
              color: filled ? '#C4965A' : 'rgba(196,150,90,0.22)',
              transition: 'color 0.15s',
            }}
          >
            ★
          </motion.span>
        )
      })}
    </div>
  )
}

/* ── Single review card ── */
function ReviewCard({ review, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [expanded, setExpanded] = useState(false)
  const [imgOpen, setImgOpen]   = useState(false)

  const dateStr = new Date(review.date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: index * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: '#0E0E0E',
          border: '1px solid rgba(196,150,90,0.1)',
          padding: 'clamp(1.4rem,3vw,2rem)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: '0.9rem',
          transition: 'border-color 0.3s, transform 0.3s',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,150,90,0.35)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,150,90,0.1)';  e.currentTarget.style.transform = 'none' }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, #C4965A ${(review.stars / 5) * 100}%, transparent ${(review.stars / 5) * 100}%)` }} />

        {/* Verified badge */}
        {review.verified && (
          <div style={{ position: 'absolute', top: '0.9rem', right: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.55rem', fontFamily: "'Inter'", fontWeight: 400, letterSpacing: '0.15em', color: '#C4965A', textTransform: 'uppercase' }}>✓ Vérifié</span>
          </div>
        )}

        {/* Stars */}
        <Stars value={review.stars} size={14} />

        {/* Review text */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: 'clamp(0.95rem,1.5vw,1.08rem)',
          fontWeight: 300, color: '#C8C0B0', lineHeight: 1.65, margin: 0,
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden',
        }}>
          «&thinsp;{review.text}&thinsp;»
        </p>

        {/* Photo thumbnail */}
        {review.photo && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <img
                  src={review.photo} alt="Photo client"
                  onClick={e => { e.stopPropagation(); setImgOpen(true) }}
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block', marginTop: '0.4rem', cursor: 'zoom-in' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(196,150,90,0.07)' }}>
          <div>
            <p style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: '0.8rem', color: '#E8E0D0', margin: 0 }}>{review.name}</p>
            <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.65rem', color: '#5A5450', margin: '0.15rem 0 0', letterSpacing: '0.05em' }}>
              {SESSION_LABELS[review.session] || review.session} · {dateStr}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {review.photo && !expanded && (
              <span style={{ fontSize: '0.6rem', fontFamily: "'Inter'", color: '#5A5450' }}>📷</span>
            )}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: '0.7rem', color: '#C4965A', display: 'inline-block' }}
            >
              ▾
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Full-screen photo */}
      <AnimatePresence>
        {imgOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setImgOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(4,4,4,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img src={review.photo} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain' }} />
            <button onClick={() => setImgOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: '1px solid rgba(196,150,90,0.3)', color: '#C4965A', width: '44px', height: '44px', fontSize: '1.1rem' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Review submission modal ── */
function ReviewModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', session: '', stars: 0, text: '', photo: null })
  const [err, setErr]   = useState({})
  const [photoPreview, setPhotoPreview] = useState(null)
  const [step, setStep] = useState(1) // 1 = form, 2 = success
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileRef = useRef(null)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(e => ({ ...e, [k]: undefined })) }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErr(er => ({ ...er, photo: 'Max 5 MB' })); return }
    setPhotoLoading(true)
    const reader = new FileReader()
    reader.onload = ev => {
      // Compress via canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 800
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX }
        else if (h > w && h > MAX) { w = (w * MAX) / h; h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.72)
        setPhotoPreview(compressed)
        set('photo', compressed)
        setPhotoLoading(false)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Requis'
    if (!form.session) e.session = 'Requis'
    if (!form.stars) e.stars = 'Notez la séance'
    if (!form.text.trim() || form.text.trim().length < 20) e.text = 'Minimum 20 caractères'
    return e
  }

  const submit = (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErr(v); return }
    onSubmit({
      id: `r_${Date.now()}`,
      name: form.name.trim(),
      session: form.session,
      stars: form.stars,
      text: form.text.trim(),
      date: new Date().toISOString().slice(0, 10),
      photo: form.photo || null,
      verified: true,
    })
    setStep(2)
  }

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const inp = (hasErr) => ({
    width: '100%', padding: '0.85rem 1rem',
    background: '#111', border: `1px solid ${hasErr ? 'rgba(220,80,80,0.5)' : 'rgba(196,150,90,0.15)'}`,
    color: '#E8E0D0', fontFamily: "'Inter',sans-serif", fontWeight: 300, fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.3s',
    borderRadius: 0,
  })

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,4,4,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: '#0C0C0C', border: '1px solid rgba(196,150,90,0.2)', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: 'clamp(1.5rem,3vw,2.2rem)', borderBottom: '1px solid rgba(196,150,90,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0C0C0C', zIndex: 2 }}>
          <div>
            <p style={{ fontFamily: "'Inter'", fontWeight: 200, fontSize: '0.62rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#C4965A', margin: 0 }}>viewbydaryl</p>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 400, color: '#F5F0E8', margin: '0.2rem 0 0' }}>
              {step === 1 ? 'Partagez votre expérience' : 'Merci pour votre avis !'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(196,150,90,0.2)', color: '#C4965A', width: '40px', height: '40px', fontSize: '1rem', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: 'clamp(1.5rem,3vw,2.2rem)' }}>
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} onSubmit={submit}>

                {/* Name + Session */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.9rem', marginBottom: '0.9rem' }}>
                  <div>
                    <label style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: err.name ? 'rgba(220,80,80,0.8)' : '#5A5450', display: 'block', marginBottom: '0.4rem' }}>
                      Votre prénom {err.name && <span style={{ textTransform: 'none', letterSpacing: 0 }}>— {err.name}</span>}
                    </label>
                    <input placeholder="Sophie" value={form.name} onChange={e => set('name', e.target.value)} style={inp(!!err.name)} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: err.session ? 'rgba(220,80,80,0.8)' : '#5A5450', display: 'block', marginBottom: '0.4rem' }}>
                      Type de séance {err.session && <span style={{ textTransform: 'none', letterSpacing: 0 }}>— {err.session}</span>}
                    </label>
                    <select value={form.session} onChange={e => set('session', e.target.value)} style={{ ...inp(!!err.session), appearance: 'none' }}>
                      <option value="">Choisir…</option>
                      <option value="portrait">Portrait</option>
                      <option value="mode">Mode & Urbaine</option>
                      <option value="evenement">Événement</option>
                      <option value="corporate">Corporate</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                {/* Stars */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <label style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: err.stars ? 'rgba(220,80,80,0.8)' : '#5A5450', display: 'block', marginBottom: '0.6rem' }}>
                    Note globale {err.stars && <span style={{ textTransform: 'none', letterSpacing: 0 }}>— {err.stars}</span>}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Stars value={form.stars} size={30} interactive onChange={v => set('stars', v)} />
                    {form.stars > 0 && (
                      <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontStyle: 'italic', color: '#C4965A' }}>
                        {['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent !'][form.stars]}
                      </motion.span>
                    )}
                  </div>
                </div>

                {/* Text */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <label style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: err.text ? 'rgba(220,80,80,0.8)' : '#5A5450', display: 'block', marginBottom: '0.4rem' }}>
                    Votre expérience {err.text && <span style={{ textTransform: 'none', letterSpacing: 0 }}>— {err.text}</span>}
                  </label>
                  <textarea
                    placeholder="Décrivez votre séance, l'ambiance, le résultat… (min. 20 caractères)"
                    value={form.text} onChange={e => set('text', e.target.value)}
                    rows={4} style={{ ...inp(!!err.text), resize: 'vertical', minHeight: '100px' }}
                  />
                  <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', color: '#3A3530', marginTop: '0.3rem', textAlign: 'right' }}>{form.text.length} / 500</p>
                </div>

                {/* Photo upload */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: err.photo ? 'rgba(220,80,80,0.8)' : '#5A5450', display: 'block', marginBottom: '0.4rem' }}>
                    Photo (optionnel) {err.photo && <span style={{ textTransform: 'none', letterSpacing: 0 }}>— {err.photo}</span>}
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  {!photoPreview ? (
                    <button type="button" onClick={() => fileRef.current.click()}
                      style={{ width: '100%', padding: '1.2rem', border: '1px dashed rgba(196,150,90,0.25)', background: 'transparent', color: '#5A5450', fontFamily: "'Inter'", fontSize: '0.78rem', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', transition: 'border-color 0.3s, color 0.3s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,150,90,0.5)'; e.currentTarget.style.color = '#C4965A' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,150,90,0.25)'; e.currentTarget.style.color = '#5A5450' }}
                    >
                      {photoLoading ? '⏳ Chargement…' : '📷 Ajouter une photo de votre séance'}
                    </button>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <img src={photoPreview} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                      <button type="button" onClick={() => { setPhotoPreview(null); set('photo', null) }}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(8,8,8,0.85)', border: '1px solid rgba(196,150,90,0.3)', color: '#C4965A', width: '32px', height: '32px', fontSize: '0.85rem' }}>✕</button>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button type="submit"
                  style={{ width: '100%', padding: '0.95rem', background: '#C4965A', color: '#080808', border: 'none', fontFamily: "'Inter'", fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', transition: 'background 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#D4A86A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C4965A'}
                >
                  Publier mon avis
                </button>

                <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.68rem', color: '#3A3530', textAlign: 'center', marginTop: '0.8rem', letterSpacing: '0.04em' }}>
                  Un seul avis par appareil · votre prénom sera affiché publiquement
                </p>
              </motion.form>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  style={{ width: '72px', height: '72px', border: '1px solid #C4965A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.8rem', color: '#C4965A' }}>
                  ✓
                </motion.div>
                <h4 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', fontWeight: 400, color: '#F5F0E8', margin: '0 0 0.8rem' }}>Avis publié !</h4>
                <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.85rem', color: '#7A7268', lineHeight: 1.7, maxWidth: '320px', margin: '0 auto 1.8rem' }}>
                  Merci {form.name} ! Votre témoignage est précieux et aide d'autres clients à découvrir le travail de Daryl.
                </p>
                <Stars value={form.stars} size={22} />
                <button onClick={onClose}
                  style={{ marginTop: '1.8rem', background: 'none', border: '1px solid rgba(196,150,90,0.3)', color: '#C4965A', padding: '0.8rem 2rem', fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Fermer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Main Reviews section ── */
function Reviews() {
  const [reviews, setReviews] = useState(() => loadReviews())
  const [alreadyReviewed, setAlreadyReviewed] = useState(() => hasReviewed())
  const [showModal, setShowModal] = useState(false)
  const [visible, setVisible] = useState(6) // pagination

  const avg   = avgStars(reviews)
  const total = reviews.length
  const breakdown = starBreakdown(reviews)

  const handleSubmit = (review) => {
    const updated = [review, ...reviews]
    setReviews(updated)
    saveReviews(updated)
    markReviewed()
    setAlreadyReviewed(true)
  }

  return (
    <section id="temoignages" style={{ background: '#080808', padding: 'clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,4rem)', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle BG glow */}
      <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '40vw', height: '40vw', maxWidth: '500px', maxHeight: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,150,90,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── Section header ── */}
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: 'clamp(3rem,5vw,4.5rem)' }}>
            <div>
              <p style={{ fontFamily: "'Inter'", fontWeight: 200, fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4965A', margin: '0 0 0.5rem' }}>06 — Témoignages</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 400, color: '#F5F0E8', margin: 0 }}>
                Ce qu'ils <span style={{ fontStyle: 'italic', color: '#C4965A' }}>disent</span>
              </h2>
            </div>
            {!alreadyReviewed && (
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                style={{ background: '#C4965A', color: '#080808', border: 'none', padding: '0.9rem 2rem', fontFamily: "'Inter'", fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}
              >
                <span>✦</span> Laisser un avis
              </motion.button>
            )}
          </div>
        </Reveal>

        {/* ── Score dashboard ── */}
        <Reveal delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(2rem,4vw,4rem)', alignItems: 'center', marginBottom: 'clamp(3rem,5vw,4.5rem)', padding: 'clamp(1.5rem,3vw,2.5rem)', border: '1px solid rgba(196,150,90,0.12)', background: '#0C0C0C' }}>
            {/* Big score */}
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(3.5rem,6vw,5.5rem)', fontWeight: 700, color: '#C4965A', margin: 0, lineHeight: 1 }}>
                {avg.toFixed(1)}
              </p>
              <Stars value={Math.round(avg)} size={18} />
              <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.7rem', color: '#5A5450', margin: '0.5rem 0 0', letterSpacing: '0.08em' }}>
                {total} avis
              </p>
            </div>
            {/* Breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {breakdown.map((count, i) => {
                const starVal = 5 - i
                const pct = total ? (count / total) * 100 : 0
                return (
                  <div key={starVal} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 300, color: '#5A5450', width: '16px', textAlign: 'right', flexShrink: 0 }}>{starVal}</span>
                    <span style={{ color: '#C4965A', fontSize: '0.7rem', flexShrink: 0 }}>★</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(196,150,90,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                        style={{ height: '100%', background: '#C4965A', borderRadius: '2px' }}
                      />
                    </div>
                    <span style={{ fontFamily: "'Inter'", fontSize: '0.62rem', fontWeight: 300, color: '#5A5450', width: '24px', flexShrink: 0 }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* ── Review cards grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1px' }}>
          {reviews.slice(0, visible).map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} />
          ))}
        </div>

        {/* ── Load more ── */}
        {visible < reviews.length && (
          <Reveal delay={0.1}>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <OutlineButton onClick={() => setVisible(v => v + 6)}>
                Voir plus · {reviews.length - visible} avis
              </OutlineButton>
            </div>
          </Reveal>
        )}

        {/* ── Already reviewed notice ── */}
        {alreadyReviewed && (
          <Reveal delay={0.2}>
            <p style={{ textAlign: 'center', fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.72rem', color: '#3A3530', marginTop: '2.5rem', letterSpacing: '0.08em' }}>
              ✓ Vous avez déjà partagé un avis — merci pour votre confiance.
            </p>
          </Reveal>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ReviewModal
            onClose={() => setShowModal(false)}
            onSubmit={(r) => { handleSubmit(r); }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [content, setContent] = useState(() =>
    loadAdminContent({ photos: PHOTOS, sessions: SESSIONS, about: null })
  )

  // Ctrl+Shift+A keyboard shortcut to open admin
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') setAdminOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleContentChange = useCallback((newContent) => {
    setContent(c => ({ ...c, ...newContent }))
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar onNav={scrollTo} />
      <Hero onCta={scrollTo} />
      <About about={content.about} />
      <Portfolio photos={content.photos} />
      <Sessions onBook={() => scrollTo('booking')} sessions={content.sessions} />
      <Booking />
      <Reviews />
      <Contact />
      <Footer onAdminTrigger={() => setAdminOpen(true)} />
      <FloatingContact />

      {/* Admin dashboard overlay */}
      <AnimatePresence>
        {adminOpen && (
          <Admin
            defaultPhotos={PHOTOS}
            defaultSessions={SESSIONS}
            defaultAbout={{
              quote: "« Si tu lis ceci, c'est que je suis certainement la personne qu'il te faut. »",
              para1: "Allo, je m'appelle DORILAS Daryl. Je suis photographe et je crois profondément que chaque être humain mérite d'être capturé sous sa plus belle lumière — celle qui révèle son essence, son histoire, sa singularité.",
              para2: "Prenons le temps de nous rencontrer et de parler de ton projet autour d'un café. Ensemble, transformons tes idées en images qui durent.",
              stats: [['52+', 'Sessions réalisées'], ['Montréal', 'Basé à'], ['∞', 'Univers créatifs']],
            }}
            onClose={() => setAdminOpen(false)}
            onContentChange={handleContentChange}
          />
        )}
      </AnimatePresence>
    </>
  )
}
