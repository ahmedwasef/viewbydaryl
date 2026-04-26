import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import BookingCalendar from './BookingCalendar'
import Admin from './Admin'

const BASE = import.meta.env.BASE_URL
const FORMSPREE = 'https://formspree.io/f/mwvazzpq'

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
    const a = localStorage.getItem('vbd_admin_about')
    if (p) out.photos = JSON.parse(p)
    if (a) out.about  = JSON.parse(a)
    // Sessions are code-managed — localStorage override intentionally removed
  } catch {}
  return out
}

/* ─── Session label map (single source of truth) ─────────── */
const SESSION_LABELS = {
  portrait:  'Portrait',
  corpo:     'Événementiel Corporatif',
  branding:  'Branding & Mode',
  autre:     'Sur mesure',
}

/* ─── ICS calendar file generator ───────────────────────── */
function generateICS(form) {
  const title   = `Séance Photo viewbydaryl — ${SESSION_LABELS[form.session] || form.session}`
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
    'ORGANIZER;CN=DORILAS Daryl:mailto:vbdaryl17@viewbydaryl.com',
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

/* ─── Cart context ───────────────────────────────────────── */
const CartCtx = createContext(null)

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vbd_cart') || '[]') } catch { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try { sessionStorage.setItem('vbd_cart', JSON.stringify(items)) } catch {}
  }, [items])

  const add = (incoming) => setItems(prev => {
    const existing = prev.find(i => i.key === incoming.key)
    if (existing) return prev.map(i => i.key === incoming.key ? { ...i, qty: i.qty + 1 } : i)
    return [...prev, { ...incoming, qty: 1 }]
  })
  const remove = (key) => setItems(prev => prev.filter(i => i.key !== key))
  const setQty = (key, qty) => qty < 1 ? remove(key) : setItems(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
  const clear = () => setItems([])

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, open, setOpen, total, count }}>
      {children}
    </CartCtx.Provider>
  )
}
const useCart = () => useContext(CartCtx)

/* ─── Photo catalogue ─────────────────────────────────────── */
/* Categories: brand · corpo · event · mode                    */
const PHOTOS = [
  /* ── BRAND — MIYA KONES ──────────────────────────────────── */
  { id: 1,  file: 'p1410484.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones I',       slogan: "L'identité d'une marque commence par une image." },
  { id: 2,  file: 'p1410542.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones II',      slogan: "Chaque détail raconte une histoire." },
  { id: 3,  file: 'p1410568.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones III',     slogan: "La lumière révèle ce que l'ombre dissimule." },
  { id: 4,  file: 'p1410576.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones IV',      slogan: "Une image, mille possibilités." },
  { id: 5,  file: 'p1410579.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones V',       slogan: "Le style se vit avant de se voir." },
  { id: 6,  file: 'p1440506.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones VI',      slogan: "Capturer l'essence, figer le mouvement." },
  { id: 7,  file: 'p1440541.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones VII',     slogan: "La marque, c'est ce qu'on ressent avant ce qu'on voit." },
  { id: 8,  file: 'p1440614.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones VIII',    slogan: "Authenticité et précision." },
  { id: 9,  file: 'p1440732.jpg',  cat: 'brand', subcat: 'miya-kones',   client: 'Miya Kones',   title: 'Miya Kones IX',      slogan: "Là où l'art rencontre l'identité." },
  /* ── BRAND — PURPLE SEVEN ────────────────────────────────── */
  { id: 10, file: 'p1280093.webp', cat: 'brand', subcat: 'purple-seven', client: 'Purple Seven', title: 'Purple Seven I',     slogan: "La nuit appartient à ceux qui osent." },
  { id: 11, file: 'p1280127.webp', cat: 'brand', subcat: 'purple-seven', client: 'Purple Seven', title: 'Purple Seven II',    slogan: "Vision sans limite." },
  { id: 12, file: 'p1280145.webp', cat: 'brand', subcat: 'purple-seven', client: 'Purple Seven', title: 'Purple Seven III',   slogan: "L'image parle quand les mots se taisent." },
  { id: 13, file: 'p1280230.webp', cat: 'brand', subcat: 'purple-seven', client: 'Purple Seven', title: 'Purple Seven IV',    slogan: "Minimalisme, impact maximal." },
  /* ── BRAND — RICON ───────────────────────────────────────── */
  { id: 14, file: 'p1310609-avec-accentuation-bruit.webp', cat: 'brand', subcat: 'ricon', client: 'Ricon', title: 'Ricon I',    slogan: "L'âme d'une marque passe par ses visages." },
  { id: 15, file: 'p1310683.webp',                         cat: 'brand', subcat: 'ricon', client: 'Ricon', title: 'Ricon II',   slogan: "Chaque ville a ses propres légendes." },
  { id: 16, file: 'p1310766-avec-accentuation-bruit.webp', cat: 'brand', subcat: 'ricon', client: 'Ricon', title: 'Ricon III',  slogan: "S'arrêter, c'est déjà voyager." },
  { id: 17, file: 'p1310803.webp',                         cat: 'brand', subcat: 'ricon', client: 'Ricon', title: 'Ricon IV',   slogan: "L'espace entre les choses définit leur essence." },
  { id: 18, file: 'p1310819-avec-accentuation-bruit.webp', cat: 'brand', subcat: 'ricon', client: 'Ricon', title: 'Ricon V',    slogan: "Le visage est le reflet de l'intérieur." },
  { id: 19, file: 'p1310849.webp',                         cat: 'brand', subcat: 'ricon', client: 'Ricon', title: 'Ricon VI',   slogan: "L'équilibre parfait entre force et élégance." },
  /* ── BRAND — TOUKAN ──────────────────────────────────────── */
  { id: 20, file: 'p1320861.webp', cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan I',    slogan: "Les opposés se révèlent mutuellement." },
  { id: 21, file: 'p1320900.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan II',   slogan: "Une image vaut plus que mille mots." },
  { id: 22, file: 'p1320930.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan III',  slogan: "Le détail fait la différence." },
  { id: 23, file: 'p1380819.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan IV',   slogan: "L'élégance est une question de vision." },
  { id: 24, file: 'p1380823.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan V',    slogan: "Présence, caractère, authenticité." },
  { id: 25, file: 'p1380825.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan VI',   slogan: "La marque commence par une histoire." },
  { id: 26, file: 'p1380840.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan VII',  slogan: "Chaque angle révèle une nouvelle vérité." },
  { id: 27, file: 'p1380855.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan VIII', slogan: "L'image construit l'identité." },
  { id: 28, file: 'p1380857.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan IX',   slogan: "Force et raffinement." },
  { id: 29, file: 'p1380905.jpg',  cat: 'brand', subcat: 'toukan', client: 'Toukan', title: 'Toukan X',    slogan: "L'art de se distinguer." },
  /* ── CORPORATE ────────────────────────────────────────────── */
  { id: 30, file: 'p1340708-avec-accentuation-bruit.jpg',  cat: 'corpo', subcat: '', client: '', title: 'Corporate I',   slogan: "Le professionnalisme se voit avant de s'entendre." },
  { id: 31, file: 'p1340714-avec-accentuation-bruit.webp', cat: 'corpo', subcat: '', client: '', title: 'Corporate II',  slogan: "L'image d'une équipe reflète son ambition." },
  { id: 32, file: 'p1340718-avec-accentuation-bruit.jpg',  cat: 'corpo', subcat: '', client: '', title: 'Corporate III', slogan: "Chaque visage raconte le succès d'une entreprise." },
  /* ── ÉVÉNEMENT — GÉNÉRAL ─────────────────────────────────── */
  { id: 33, file: 'p1210815.jpg', cat: 'event', subcat: '', client: '', title: 'Baby Shower I',   slogan: "Chaque nouvelle vie mérite une ovation." },
  { id: 34, file: 'p1210830.jpg', cat: 'event', subcat: '', client: '', title: 'Baby Shower II',  slogan: "Les joies partagées se multiplient." },
  { id: 35, file: 'p1210836.jpg', cat: 'event', subcat: '', client: '', title: 'Baby Shower III', slogan: "La fête, c'est la vie qui se souvient d'elle-même." },
  { id: 36, file: 'p1430243.jpg', cat: 'event', subcat: '', client: '', title: 'Événement I',     slogan: "Les moments précieux méritent d'être immortalisés." },
  { id: 37, file: 'p1430259.jpg', cat: 'event', subcat: '', client: '', title: 'Événement II',    slogan: "Chaque instant compte." },
  { id: 38, file: 'p1430262.jpg', cat: 'event', subcat: '', client: '', title: 'Événement III',   slogan: "La mémoire commence par une photo." },
  { id: 39, file: 'p1450201.jpg', cat: 'event', subcat: '', client: '', title: 'Événement IV',    slogan: "L'émotion capturée dure pour toujours." },
  { id: 40, file: 'p1450208.jpg', cat: 'event', subcat: '', client: '', title: 'Événement V',     slogan: "Chaque regard dit plus que mille mots." },
  { id: 41, file: 'p1450279.jpg', cat: 'event', subcat: '', client: '', title: 'Événement VI',    slogan: "La vie est une série de moments parfaits." },
  { id: 42, file: 'dsc1744.jpg',  cat: 'event', subcat: '', client: '', title: 'Événement VII',   slogan: "Ce qui se vit ensemble se souvient ensemble." },
  { id: 43, file: 'dsc1745.jpg',  cat: 'event', subcat: '', client: '', title: 'Événement VIII',  slogan: "L'authenticité de l'instant, préservée." },
  /* ── ÉVÉNEMENT — SAYASPORA ───────────────────────────────── */
  { id: 44, file: 'p1410142.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora I',   slogan: "La diaspora célèbre, l'image garde mémoire." },
  { id: 45, file: 'p1410198.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora II',  slogan: "Ensemble, on crée l'histoire." },
  { id: 46, file: 'p1410201.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora III', slogan: "La culture se vit, la photo la perpétue." },
  { id: 47, file: 'p1410208.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora IV',  slogan: "Chaque visage, une histoire." },
  { id: 48, file: 'p1410212.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora V',   slogan: "La joie collective, figée pour l'éternité." },
  { id: 49, file: 'p1410216.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora VI',  slogan: "Racines et élégance." },
  { id: 50, file: 'p1410282.jpg', cat: 'event', subcat: 'sayaspora', client: 'Sayaspora', title: 'Sayaspora VII', slogan: "L'art de célébrer ensemble." },
  /* ── MODE & FASHION ──────────────────────────────────────── */
  { id: 51, file: 'p1150510.webp',                         cat: 'mode', subcat: '', client: '', title: 'Mode I',    slogan: "Le style, c'est refuser de disparaître." },
  { id: 52, file: 'p1150635.webp',                         cat: 'mode', subcat: '', client: '', title: 'Mode II',   slogan: "Les murs ont leurs propres histoires." },
  { id: 53, file: 'p1160024.webp',                         cat: 'mode', subcat: '', client: '', title: 'Mode III',  slogan: "La ville ne dort jamais vraiment." },
  { id: 54, file: 'p1250885.webp',                         cat: 'mode', subcat: '', client: '', title: 'Mode IV',   slogan: "Change d'angle, change de monde." },
  { id: 55, file: 'p1280858-avec-accentuation-bruit.webp', cat: 'mode', subcat: '', client: '', title: 'Mode V',    slogan: "Certains brûlent sans jamais se consumer." },
  { id: 56, file: 'p1280881-avec-accentuation-bruit.webp', cat: 'mode', subcat: '', client: '', title: 'Mode VI',   slogan: "La lumière derrière toi, l'avenir devant." },
  { id: 57, file: 'p1280951-avec-accentuation-bruit.webp', cat: 'mode', subcat: '', client: '', title: 'Mode VII',  slogan: "La perfection se cache dans l'imperfection." },
  { id: 58, file: 'p1290159-avec-accentuation-bruit.webp', cat: 'mode', subcat: '', client: '', title: 'Mode VIII', slogan: "Les yeux ne mentent jamais." },
  { id: 59, file: 'p1290299-avec-accentuation-bruit.webp', cat: 'mode', subcat: '', client: '', title: 'Mode IX',   slogan: "Le silence dit tout ce que les mots oublient." },
  { id: 60, file: 'p1290352.webp',                         cat: 'mode', subcat: '', client: '', title: 'Mode X',    slogan: "L'attitude est le vêtement qu'on ne retire jamais." },
  { id: 61, file: 'p1290650.webp',                         cat: 'mode', subcat: '', client: '', title: 'Mode XI',   slogan: "La façon de se tenir dit tout." },
  { id: 62, file: 'p1440908.jpg',                          cat: 'mode', subcat: '', client: '', title: 'Mode XII',  slogan: "La mode naît de l'audace." },
  { id: 63, file: 'p1440911.jpg',                          cat: 'mode', subcat: '', client: '', title: 'Mode XIII', slogan: "Chaque tissu a sa propre histoire." },
  { id: 64, file: 'p1440987.jpg',                          cat: 'mode', subcat: '', client: '', title: 'Mode XIV',  slogan: "La mode n'est belle qu'en mouvement." },
  { id: 65, file: 'p1440993.jpg',                          cat: 'mode', subcat: '', client: '', title: 'Mode XV',   slogan: "L'élégance est une forme de politesse." },
]

const SUBCATEGORIES = {
  brand: [
    { key: 'miya-kones',   label: 'Miya Kones' },
    { key: 'purple-seven', label: 'Purple Seven' },
    { key: 'ricon',        label: 'Ricon' },
    { key: 'toukan',       label: 'Toukan' },
  ],
  event: [
    { key: 'sayaspora', label: 'Sayaspora' },
  ],
}

const CATEGORIES = [
  { key: 'tout',  label: 'Tout' },
  { key: 'brand', label: 'Brand' },
  { key: 'corpo', label: 'Corporate' },
  { key: 'event', label: 'Événement' },
  { key: 'mode',  label: 'Mode & Fashion' },
]

/* ─── Shared animation variants ──────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

/* ─── Animated section wrapper ───────────────────────────── */
function Reveal({ children, delay = 0, className = '', style: styleProp }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={styleProp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Logo SVG (globe inspired by actual LOGO.png) ───────── */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="viewbydaryl logo">
      {/* Globe outer ring */}
      <circle cx="30" cy="30" r="25" stroke="#C4965A" strokeWidth="1.5"/>
      {/* Longitude lines */}
      <ellipse cx="30" cy="30" rx="10" ry="25" stroke="#C4965A" strokeWidth="0.9" opacity="0.55"/>
      <ellipse cx="30" cy="30" rx="19" ry="25" stroke="#C4965A" strokeWidth="0.7" opacity="0.3"/>
      {/* Equator */}
      <line x1="5" y1="30" x2="55" y2="30" stroke="#C4965A" strokeWidth="0.9" opacity="0.55"/>
      {/* Parallels */}
      <ellipse cx="30" cy="20" rx="22" ry="3.8" stroke="#C4965A" strokeWidth="0.7" opacity="0.3"/>
      <ellipse cx="30" cy="40" rx="22" ry="3.8" stroke="#C4965A" strokeWidth="0.7" opacity="0.3"/>
      {/* Viewfinder ticks outside globe */}
      <line x1="30" y1="1"  x2="30" y2="7"  stroke="#C4965A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="30" y1="53" x2="30" y2="59" stroke="#C4965A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="1"  y1="30" x2="7"  y2="30" stroke="#C4965A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="53" y1="30" x2="59" y2="30" stroke="#C4965A" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Center crosshair dot */}
      <circle cx="30" cy="30" r="2.5" fill="#C4965A"/>
    </svg>
  )
}

/* ─── Navbar ──────────────────────────────────────────────── */
function Navbar({ onNav }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { count, setOpen: openCart } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { id: 'about',        label: 'À Propos' },
    { id: 'portfolio',    label: 'Portfolio' },
    { id: 'sessions',     label: 'Sessions' },
    { id: 'boutique',     label: 'Boutique' },
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

        {/* Cart icon */}
        <button
          onClick={() => openCart(true)}
          style={{ background: 'none', border: '1px solid rgba(196,150,90,0.25)', cursor: 'pointer', color: '#C4965A', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', transition: 'border-color 0.2s' }}
          aria-label="Panier"
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(196,150,90,0.6)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(196,150,90,0.25)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {count > 0 && (
            <span style={{ background: '#C4965A', color: '#080808', fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{count}</span>
          )}
        </button>

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
    <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 5rem)', width: '100%' }}>
      <p style={{
        fontFamily: "'Inter'", fontWeight: 200, fontSize: '0.65rem',
        letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4965A',
        marginBottom: '1rem', textAlign: 'center',
      }}>
        {number} — {subtitle}
      </p>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
        fontWeight: 400, letterSpacing: '-0.01em', color: '#F5F0E8',
        margin: 0, textAlign: 'center',
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
  const [activeCat, setActiveCat]     = useState('tout')
  const [activeSubcat, setActiveSubcat] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [loaded, setLoaded] = useState({})
  const touchStartX = useRef(null)

  const subcats = activeCat !== 'tout' ? (SUBCATEGORIES[activeCat] || []) : []

  const filtered = useMemo(() => {
    if (activeCat === 'tout') return photos
    const byCat = photos.filter(p => p.cat === activeCat)
    return activeSubcat ? byCat.filter(p => p.subcat === activeSubcat) : byCat
  }, [photos, activeCat, activeSubcat])

  const handleCatChange = (key) => { setActiveCat(key); setActiveSubcat(null) }

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => handleCatChange(c.key)}
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
        {subcats.length > 0 && (
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setActiveSubcat(null)}
              style={{
                background: activeSubcat === null ? 'rgba(196,150,90,0.12)' : 'none',
                border: '1px solid rgba(196,150,90,0.3)', cursor: 'pointer',
                fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.6rem',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: activeSubcat === null ? '#C4965A' : '#5A5450',
                padding: '0.3rem 0.9rem', transition: 'all 0.2s',
              }}
            >
              Tout
            </button>
            {subcats.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSubcat(s.key)}
                style={{
                  background: activeSubcat === s.key ? 'rgba(196,150,90,0.12)' : 'none',
                  border: '1px solid rgba(196,150,90,0.3)', cursor: 'pointer',
                  fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.6rem',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: activeSubcat === s.key ? '#C4965A' : '#5A5450',
                  padding: '0.3rem 0.9rem', transition: 'all 0.2s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
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
                <p style={{ fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 300, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4965A', margin: '0 0 0.35rem' }}>{photo.client || photo.cat}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 500, color: '#F5F0E8', margin: 0, lineHeight: 1.2 }}>{photo.title}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.82rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(196,150,90,0.85)', margin: '0.3rem 0 0', lineHeight: 1.35 }}>{photo.slogan}</p>
              </div>

              <img
                src={`${BASE}photos/thumbs/${photo.file}`}
                alt={photo.title}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(l => ({ ...l, [photo.id]: true }))}
                style={{
                  width: '100%',
                  display: 'block',
                  transition: 'transform 0.5s ease, opacity 0.4s ease',
                  opacity: loaded[photo.id] ? 1 : 0,
                  background: '#111',
                  minHeight: loaded[photo.id] ? 'auto' : '180px',
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

/* ─── Boutique — tirage d'art ────────────────────────────── */
const PRINT_SIZES = [
  { label: '20 × 30 cm', price: 45 },
  { label: '30 × 45 cm', price: 85 },
  { label: '40 × 60 cm', price: 135 },
  { label: '50 × 75 cm', price: 195 },
]
const FRAME_OPTIONS = [
  { label: 'Sans cadre',   surcharge: 0  },
  { label: 'Cadre noir',   surcharge: 35 },
  { label: 'Cadre blanc',  surcharge: 35 },
  { label: 'Cadre bois',   surcharge: 45 },
]
const PRINTS = [
  { id: 'pr1', file: 'p1410484.jpg', title: 'Miya Kones I',   slogan: "L'identité d'une marque commence par une image." },
  { id: 'pr2', file: 'p1440541.jpg', title: 'Miya Kones VII', slogan: "La marque, c'est ce qu'on ressent avant ce qu'on voit." },
  { id: 'pr3', file: 'p1380823.jpg', title: 'Toukan V',       slogan: "Présence, caractère, authenticité." },
  { id: 'pr4', file: 'p1380840.jpg', title: 'Toukan VII',     slogan: "Chaque angle révèle une nouvelle vérité." },
  { id: 'pr5', file: 'p1440908.jpg', title: 'Mode XII',       slogan: "La mode naît de l'audace." },
  { id: 'pr6', file: 'p1440987.jpg', title: 'Mode XIV',       slogan: "La mode n'est belle qu'en mouvement." },
  { id: 'pr7', file: 'dsc1744.jpg',  title: 'Événement VII',  slogan: "Ce qui se vit ensemble se souvient ensemble." },
  { id: 'pr8', file: 'p1410142.jpg', title: 'Sayaspora I',    slogan: "La diaspora célèbre, l'image garde mémoire." },
]

/* ─── Sessions ───────────────────────────────────────────── */
const SESSIONS = [
  {
    key: 'portrait',
    icon: '◎',
    name: 'Portrait',
    duration: 'Studio ou extérieur',
    price: '250 $',
    priceNote: 'CAD · taxes incluses',
    studioNote: '+150 $ pour studio',
    desc: 'Une séance intime et personnalisée pour capturer votre authenticité. Idéal pour un portrait professionnel ou un shooting personnel, en extérieur ou en studio.',
    includes: ['5 photos retouchées', 'Galerie privée en ligne', 'Fichiers haute résolution', 'Retouche professionnelle', 'Livraison en 48h'],
    highlight: false,
  },
  {
    key: 'corpo',
    icon: '◈',
    name: 'Événementiel Corporatif',
    duration: '4h de présence sur site',
    price: '1 200 $',
    priceNote: 'CAD · taxes incluses',
    studioNote: null,
    desc: "Couverture complète de votre événement d'entreprise avec discrétion et professionnalisme. Idéal pour conférences, soirées corporatives et lancements.",
    includes: ['4h de prise de vues', '100+ photos retouchées', 'Galerie privée en ligne', 'Fichiers haute résolution', 'Livraison en 72h'],
    highlight: true,
  },
  {
    key: 'branding',
    icon: '◇',
    name: 'Branding & Mode',
    duration: 'Sur mesure',
    price: 'Sur devis',
    priceNote: '',
    studioNote: null,
    desc: "Campagnes de branding, lookbooks mode et projets fashion entièrement personnalisés. Chaque projet est unique — discutons ensemble de votre vision.",
    includes: ['Branding', 'Mode & Fashion', 'Direction artistique', 'Galerie privée en ligne', 'Fichiers haute résolution'],
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
            <SessionCard s={s} onBook={() => onBook(s.key || s.name)} />
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

      <div style={{ borderTop: '1px solid rgba(196,150,90,0.12)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#C4965A' }}>{s.price}</span>
            {s.priceNote && <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, color: '#5A5450', letterSpacing: '0.08em', margin: '0.15rem 0 0' }}>{s.priceNote}</p>}
            {s.studioNote && <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, color: 'rgba(196,150,90,0.6)', letterSpacing: '0.06em', margin: '0.1rem 0 0' }}>{s.studioNote}</p>}
          </div>
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
    </div>
  )
}

/* ─── Booking ────────────────────────────────────────────── */
/* ─── Google Calendar URL builder ───────────────────────── */
function buildCalendarUrl(form) {
  const title = encodeURIComponent(`📸 Séance Photo viewbydaryl — ${SESSION_LABELS[form.session] || form.session}`)
  const details = encodeURIComponent(
    `Séance photo avec DORILAS Daryl (viewbydaryl).\n\n` +
    `Client : ${form.nom}\n` +
    (form.message ? `Vision : ${form.message}\n\n` : '\n') +
    `Contact Daryl :\n• Email : vbdaryl17@viewbydaryl.com\n• WhatsApp : +1 579 372 3265\n• Instagram : @viewbydaryl__`
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

function Booking({ selectedSession, onSessionConsumed }) {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', session: '', date: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [bookedDates, setBookedDates] = useState(() => getBookedDates())
  const calendarRef = useRef(null)

  // Pre-select session type when arriving from a session card click
  useEffect(() => {
    if (!selectedSession) return
    setForm(f => ({ ...f, session: selectedSession }))
    setErrors(e => ({ ...e, session: undefined }))
    // Small delay so the section scroll finishes, then scroll to calendar
    const t = setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 500)
    onSessionConsumed?.()
    return () => clearTimeout(t)
  }, [selectedSession]) // eslint-disable-line

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
    // Send booking via Formspree
    try {
      await fetch(FORMSPREE, {
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

      <SectionHeader number="05" title="Réservation" subtitle="Votre Séance" />

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
                      {Object.entries(SESSION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div style={{ marginBottom: '1.2rem' }} ref={calendarRef}>
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
                href: 'https://www.instagram.com/viewbydaryl__/',
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
                label: 'Email', value: 'vbdaryl17@viewbydaryl.com',
                href: 'mailto:vbdaryl17@viewbydaryl.com',
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
            <a href="https://www.instagram.com/viewbydaryl__/" target="_blank" rel="noreferrer"
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
        {['Brand', 'Corporate', 'Événement', 'Mode'].map(t => (
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
              href: 'https://www.instagram.com/viewbydaryl__/',
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
              href: 'mailto:vbdaryl17@viewbydaryl.com',
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

/* SESSION_LABELS defined at module top */

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

/* ─── PrintCard ──────────────────────────────────────────── */
function PrintCard({ print }) {
  const { add } = useCart()
  const [size, setSize] = useState(0)
  const [frame, setFrame] = useState(0)
  const [added, setAdded] = useState(false)

  const price = PRINT_SIZES[size].price + FRAME_OPTIONS[frame].surcharge

  const handleAdd = () => {
    add({
      key: `${print.id}-${size}-${frame}`,
      file: print.file,
      title: print.title,
      size: PRINT_SIZES[size].label,
      frame: FRAME_OPTIONS[frame].label,
      price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const pillBase = { fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, padding: '0.25rem 0.6rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid' }

  return (
    <div style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflow: 'hidden', aspectRatio: '4/5', position: 'relative' }}>
        <img
          src={`${BASE}photos/thumbs/${print.file}`}
          alt={print.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        />
      </div>
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 500, color: '#F5F0E8', margin: '0 0 0.2rem' }}>{print.title}</h4>
        <p style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 300, color: '#5A5450', letterSpacing: '0.06em', margin: '0 0 1rem', fontStyle: 'italic', lineHeight: 1.5 }}>{print.slogan}</p>

        <p style={{ fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6A6460', margin: '0 0 0.4rem' }}>Format</p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          {PRINT_SIZES.map((s, i) => (
            <button key={i} onClick={() => setSize(i)} style={{
              ...pillBase,
              background: size === i ? '#C4965A' : 'transparent',
              borderColor: size === i ? '#C4965A' : 'rgba(196,150,90,0.25)',
              color: size === i ? '#080808' : '#C4965A',
              fontWeight: size === i ? 500 : 300,
            }}>{s.label}</button>
          ))}
        </div>

        <p style={{ fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6A6460', margin: '0 0 0.4rem' }}>Encadrement</p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {FRAME_OPTIONS.map((f, i) => (
            <button key={i} onClick={() => setFrame(i)} style={{
              ...pillBase,
              background: frame === i ? 'rgba(196,150,90,0.12)' : 'transparent',
              borderColor: frame === i ? '#C4965A' : 'rgba(196,150,90,0.15)',
              color: frame === i ? '#C4965A' : '#5A5450',
            }}>{f.label}{f.surcharge > 0 ? ` +${f.surcharge}$` : ''}</button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(196,150,90,0.1)', paddingTop: '1rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#C4965A' }}>{price} $<span style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, color: '#5A5450', marginLeft: '0.3rem' }}>CAD</span></span>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleAdd}
            style={{
              background: added ? 'rgba(196,150,90,0.15)' : 'transparent',
              border: `1px solid ${added ? '#C4965A' : 'rgba(196,150,90,0.35)'}`,
              color: '#C4965A',
              fontFamily: "'Inter'", fontSize: '0.62rem', fontWeight: 400,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              padding: '0.5rem 1rem', cursor: 'pointer', transition: 'all 0.3s',
            }}
          >
            {added ? '✓ Ajouté' : '+ Panier'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

/* ─── Shop ────────────────────────────────────────────────── */
function Shop() {
  return (
    <section id="boutique" style={{ background: '#080808', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 4rem)' }}>
      <SectionHeader number="04" title="Boutique" subtitle="Tirages d'Art" />
      <Reveal>
        <p style={{ textAlign: 'center', fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.85rem', color: '#7A7268', maxWidth: '540px', margin: '0 auto 3.5rem', lineHeight: 1.8, letterSpacing: '0.04em' }}>
          Chaque tirage est imprimé sur papier photo mat premium et expédié sous 7 à 10 jours ouvrables partout au Canada. Paiement par virement ou PayPal.
        </p>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '1.5px', maxWidth: '1200px', margin: '0 auto' }}>
        {PRINTS.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.07}>
            <PrintCard print={p} />
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.3}>
        <p style={{ textAlign: 'center', marginTop: '2.5rem', fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.72rem', color: '#3A3530', letterSpacing: '0.08em' }}>
          Livraison Canada · Impression sur papier Hahnemühle
        </p>
      </Reveal>
    </section>
  )
}

/* ─── CartDrawer ─────────────────────────────────────────── */
function CartDrawer() {
  const { items, remove, setQty, clear, open, setOpen, total, count } = useCart()
  const [view, setView] = useState('cart')
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', rue: '', ville: '', province: 'Québec', postal: '' })
  const [sending, setSending] = useState(false)
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open) { const t = setTimeout(() => { setView('cart'); setSending(false); setErrs({}) }, 350); return () => clearTimeout(t) }
  }, [open])

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 1
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 1
    if (!form.rue.trim()) e.rue = 1
    if (!form.ville.trim()) e.ville = 1
    if (!form.postal.trim()) e.postal = 1
    return e
  }

  const handleOrder = async (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrs(v); return }
    setSending(true)
    try {
      const lines = items.map(i => `${i.title} (${i.size} · ${i.frame}) × ${i.qty} — ${i.price * i.qty}$ CAD`).join('\n')
      await fetch(FORMSPREE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `🛒 Nouvelle commande viewbydaryl — ${form.nom}`,
          _replyto: form.email,
          nom: form.nom, email: form.email, telephone: form.telephone || 'n/a',
          adresse: `${form.rue}, ${form.ville}, ${form.province} ${form.postal}`,
          commande: lines,
          total: `${total}$ CAD`,
        }),
      })
    } catch {}
    setSending(false)
    setView('success')
    clear()
  }

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrs(er => ({ ...er, [k]: 0 })) }
  const drInput = (hasErr) => ({
    width: '100%', boxSizing: 'border-box',
    background: '#0E0E0E', border: `1px solid ${hasErr ? 'rgba(180,55,55,0.5)' : 'rgba(196,150,90,0.18)'}`,
    color: '#E8E0D0', fontFamily: "'Inter'", fontSize: '0.82rem', fontWeight: 300,
    padding: '0.65rem 0.9rem', outline: 'none',
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)',
              background: '#0A0A0A', borderLeft: '1px solid rgba(196,150,90,0.12)',
              zIndex: 201, display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(196,150,90,0.1)', flexShrink: 0 }}>
              {view === 'checkout' ? (
                <button onClick={() => setView('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4965A', fontFamily: "'Inter'", fontSize: '0.65rem', letterSpacing: '0.12em', padding: 0 }}>
                  ← Retour au panier
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', fontWeight: 500, color: '#F5F0E8' }}>
                    {view === 'success' ? 'Commande confirmée' : 'Panier'}
                  </span>
                  {count > 0 && view === 'cart' && (
                    <span style={{ background: '#C4965A', color: '#080808', fontFamily: "'Inter'", fontSize: '0.58rem', fontWeight: 600, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
                  )}
                </div>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(196,150,90,0.2)', color: '#C4965A', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {view === 'success' && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ fontSize: '2rem', color: '#C4965A', marginBottom: '1rem' }}>✓</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#F5F0E8', fontWeight: 500, margin: '0 0 1rem' }}>Commande reçue !</h3>
                  <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.8rem', color: '#7A7268', lineHeight: 1.8, margin: '0 0 2rem' }}>
                    Merci pour votre commande. Nous vous contacterons dans les 24h pour confirmer les détails de livraison et les instructions de paiement.
                  </p>
                  <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(196,150,90,0.35)', color: '#C4965A', fontFamily: "'Inter'", fontSize: '0.68rem', letterSpacing: '0.18em', padding: '0.7rem 2rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Fermer
                  </button>
                </div>
              )}

              {view === 'checkout' && (
                <form onSubmit={handleOrder}>
                  <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 500, color: '#F5F0E8', margin: '0 0 1.2rem' }}>Informations de livraison</h4>
                  {[
                    { k: 'nom',       label: 'Nom complet *',  ph: 'DORILAS Daryl',            type: 'text'  },
                    { k: 'email',     label: 'Email *',         ph: 'daryl@example.com',        type: 'email' },
                    { k: 'telephone', label: 'Téléphone',       ph: '+1 514 000 0000',           type: 'tel'   },
                    { k: 'rue',       label: 'Adresse *',       ph: '123 Rue Sainte-Catherine', type: 'text'  },
                    { k: 'ville',     label: 'Ville *',         ph: 'Montréal',                 type: 'text'  },
                    { k: 'province',  label: 'Province',        ph: 'Québec',                   type: 'text'  },
                    { k: 'postal',    label: 'Code postal *',   ph: 'H2X 1Y6',                  type: 'text'  },
                  ].map(({ k, label, ph, type }) => (
                    <div key={k} style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: errs[k] ? '#B43737' : '#5A5450', marginBottom: '0.3rem' }}>{label}</label>
                      <input type={type} placeholder={ph} value={form[k]} onChange={e => setF(k, e.target.value)} style={drInput(errs[k])} />
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid rgba(196,150,90,0.1)', paddingTop: '1rem', marginTop: '1.2rem' }}>
                    <p style={{ fontFamily: "'Inter'", fontSize: '0.55rem', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5A5450', margin: '0 0 0.7rem' }}>Récapitulatif</p>
                    {items.map(item => (
                      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: "'Inter'", fontSize: '0.72rem', fontWeight: 300, color: '#8A8278' }}>{item.title} × {item.qty}</span>
                        <span style={{ fontFamily: "'Inter'", fontSize: '0.72rem', fontWeight: 300, color: '#C4965A', flexShrink: 0, marginLeft: '0.5rem' }}>{item.price * item.qty}$</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(196,150,90,0.1)' }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 500, color: '#F5F0E8' }}>Total</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: '#C4965A' }}>{total}$ CAD</span>
                    </div>
                  </div>

                  <button type="submit" disabled={sending} style={{ width: '100%', marginTop: '1.5rem', background: '#C4965A', border: 'none', color: '#080808', fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.9rem', cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1, transition: 'opacity 0.3s' }}>
                    {sending ? 'Envoi en cours…' : 'Confirmer la commande'}
                  </button>
                  <p style={{ textAlign: 'center', fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, color: '#3A3530', marginTop: '0.8rem', lineHeight: 1.6, letterSpacing: '0.04em' }}>
                    Paiement par virement Interac ou PayPal — instructions envoyées par email.
                  </p>
                </form>
              )}

              {view === 'cart' && items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 400, color: '#3A3530', marginBottom: '0.5rem' }}>Votre panier est vide</p>
                  <p style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.72rem', color: '#2A2A2A', letterSpacing: '0.05em' }}>Ajoutez des tirages depuis la boutique</p>
                </div>
              )}

              {view === 'cart' && items.length > 0 && (
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div key={item.key} layout exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}
                      style={{ display: 'flex', gap: '0.9rem', marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid rgba(196,150,90,0.07)' }}
                    >
                      <img src={`${BASE}photos/thumbs/${item.file}`} alt={item.title} style={{ width: '64px', height: '80px', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 500, color: '#F5F0E8', margin: '0 0 0.15rem' }}>{item.title}</p>
                        <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 300, color: '#5A5450', margin: '0 0 0.6rem', letterSpacing: '0.06em' }}>{item.size} · {item.frame}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {[['−', item.qty - 1], ['+', item.qty + 1]].map(([lbl, qty], i) => (
                              <button key={i} onClick={() => setQty(item.key, qty)} style={{ background: 'none', border: '1px solid rgba(196,150,90,0.2)', color: '#C4965A', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                                {lbl}
                              </button>
                            ))}
                            <span style={{ fontFamily: "'Inter'", fontSize: '0.75rem', fontWeight: 300, color: '#E8E0D0', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                          </div>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: '#C4965A' }}>{item.price * item.qty}$</span>
                        </div>
                        <button onClick={() => remove(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3A3530', fontFamily: "'Inter'", fontSize: '0.58rem', letterSpacing: '0.08em', marginTop: '0.4rem', padding: 0, textDecoration: 'underline' }}>Retirer</button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {view === 'cart' && items.length > 0 && (
              <div style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid rgba(196,150,90,0.1)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                  <span style={{ fontFamily: "'Inter'", fontWeight: 300, fontSize: '0.7rem', color: '#5A5450', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Sous-total</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#C4965A' }}>{total}$ CAD</span>
                </div>
                <button
                  onClick={() => setView('checkout')}
                  style={{ width: '100%', background: '#C4965A', border: 'none', color: '#080808', fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.9rem', cursor: 'pointer' }}
                >
                  Commander
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [content, setContent] = useState(() =>
    loadAdminContent({ photos: PHOTOS, sessions: SESSIONS, about: null })
  )
  const [pendingSession, setPendingSession] = useState(null)

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

  const handleBookSession = (sessionKey) => {
    setPendingSession(sessionKey)
    scrollTo('booking')
  }

  return (
    <CartProvider>
      <Navbar onNav={scrollTo} />
      <Hero onCta={scrollTo} />
      <About about={content.about} />
      <Portfolio photos={content.photos} />
      <Sessions onBook={handleBookSession} sessions={content.sessions} />
      <Shop />
      <Booking
        selectedSession={pendingSession}
        onSessionConsumed={() => setPendingSession(null)}
      />
      <Reviews />
      <Contact />
      <Footer onAdminTrigger={() => setAdminOpen(true)} />
      <FloatingContact />
      <CartDrawer />

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
    </CartProvider>
  )
}
