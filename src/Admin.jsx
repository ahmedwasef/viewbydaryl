/**
 * viewbydaryl — Admin Dashboard
 *
 * Access : double-click the footer copyright text, or press Ctrl+Shift+A
 * PIN    : 4-digit, set on first access, stored hashed in localStorage
 * Data   : stored in localStorage key 'vbd_admin_content'
 * Publish: PUT to GitHub API → triggers GitHub Actions rebuild
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Storage keys ────────────────────────────────────────── */
const CONTENT_KEY   = 'vbd_admin_content'
const PIN_KEY       = 'vbd_admin_pin'
const SETTINGS_KEY  = 'vbd_admin_settings'
const BOOKINGS_KEY  = 'vbd_bookings_v1'

/* ─── Simple hash (not cryptographic — just obfuscation) ── */
function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0
  }
  return String(h)
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  catch { return {} }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch {}
}
function loadBookings() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]') }
  catch { return [] }
}

/* ─── Tiny UI primitives ─────────────────────────────────── */
const IA = ({ style, ...p }) => (
  <input
    {...p}
    style={{
      width: '100%', padding: '0.65rem 0.85rem',
      background: '#111', border: '1px solid rgba(196,150,90,0.2)',
      color: '#E8E0D0', fontFamily: "'Inter', sans-serif",
      fontSize: '0.82rem', fontWeight: 300, outline: 'none',
      boxSizing: 'border-box', ...style,
    }}
  />
)
const TA = ({ style, ...p }) => (
  <textarea
    {...p}
    style={{
      width: '100%', padding: '0.65rem 0.85rem',
      background: '#111', border: '1px solid rgba(196,150,90,0.2)',
      color: '#E8E0D0', fontFamily: "'Inter', sans-serif",
      fontSize: '0.82rem', fontWeight: 300, outline: 'none',
      boxSizing: 'border-box', resize: 'vertical', minHeight: '80px', ...style,
    }}
  />
)
const Label = ({ children }) => (
  <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6A6460', marginBottom: '0.35rem', marginTop: 0 }}>
    {children}
  </p>
)
const FieldRow = ({ children }) => (
  <div style={{ marginBottom: '1rem' }}>{children}</div>
)
const SectionTitle = ({ children }) => (
  <div style={{ borderBottom: '1px solid rgba(196,150,90,0.12)', paddingBottom: '0.6rem', marginBottom: '1.4rem' }}>
    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 400, color: '#C4965A', margin: 0 }}>
      {children}
    </h3>
  </div>
)
const Btn = ({ children, onClick, variant = 'outline', disabled, style: s }) => {
  const base = {
    fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 400,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    padding: '0.55rem 1.4rem', cursor: disabled ? 'default' : 'pointer',
    border: 'none', transition: 'all 0.2s', opacity: disabled ? 0.4 : 1, ...s,
  }
  const variants = {
    gold:    { background: '#C4965A', color: '#080808' },
    outline: { background: 'transparent', color: '#C4965A', border: '1px solid rgba(196,150,90,0.4)' },
    danger:  { background: 'rgba(180,55,55,0.2)', color: '#C05050', border: '1px solid rgba(180,55,55,0.35)' },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

/* ─── PIN screen ─────────────────────────────────────────── */
function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const stored = localStorage.getItem(PIN_KEY)
  const isSetup = !stored

  const submit = () => {
    if (pin.length < 4) { setError('Minimum 4 chiffres'); return }
    if (isSetup) {
      if (pin !== confirm) { setError('Les PINs ne correspondent pas'); return }
      localStorage.setItem(PIN_KEY, hashPin(pin))
      onSuccess()
    } else {
      if (hashPin(pin) !== stored) { setError('PIN incorrect'); setPin(''); return }
      onSuccess()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C4965A', marginBottom: '0.8rem' }}>
          {isSetup ? 'Créer votre PIN admin' : 'Connexion admin'}
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, color: '#F5F0E8', margin: 0 }}>
          viewbydaryl <span style={{ color: '#C4965A', fontStyle: 'italic', fontSize: '1.2rem' }}>admin</span>
        </h2>
      </div>

      <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN (4 chiffres min.)"
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          maxLength={8}
          style={{
            padding: '0.9rem 1rem', background: '#111',
            border: `1px solid ${error ? 'rgba(200,80,80,0.5)' : 'rgba(196,150,90,0.25)'}`,
            color: '#E8E0D0', fontFamily: "'Inter'", fontSize: '1.2rem',
            letterSpacing: '0.4em', textAlign: 'center', outline: 'none', width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {isSetup && (
          <input
            type="password"
            inputMode="numeric"
            placeholder="Confirmer le PIN"
            value={confirm}
            onChange={e => { setConfirm(e.target.value.replace(/\D/g, '')); setError('') }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            maxLength={8}
            style={{
              padding: '0.9rem 1rem', background: '#111',
              border: '1px solid rgba(196,150,90,0.25)',
              color: '#E8E0D0', fontFamily: "'Inter'", fontSize: '1.2rem',
              letterSpacing: '0.4em', textAlign: 'center', outline: 'none', width: '100%',
              boxSizing: 'border-box',
            }}
          />
        )}
        {error && <p style={{ fontFamily: "'Inter'", fontSize: '0.75rem', color: '#C05050', textAlign: 'center', margin: 0 }}>{error}</p>}
        <Btn variant="gold" onClick={submit}>
          {isSetup ? 'Créer le PIN' : 'Accéder'}
        </Btn>
      </div>
    </motion.div>
  )
}

/* ─── Tab: Photos ─────────────────────────────────────────── */
function PhotosTab({ photos, onChange }) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? photos.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.cat.includes(search.toLowerCase()))
    : photos

  const update = (id, field, val) => {
    onChange(photos.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  return (
    <div>
      <SectionTitle>Photos ({photos.length})</SectionTitle>
      <FieldRow>
        <IA
          placeholder="Rechercher par titre ou catégorie…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </FieldRow>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {filtered.map(p => (
          <details key={p.id} style={{ background: '#0E0E0E', border: '1px solid rgba(196,150,90,0.08)' }}>
            <summary style={{
              padding: '0.75rem 1rem', cursor: 'pointer', listStyle: 'none',
              display: 'flex', alignItems: 'center', gap: '0.8rem',
              fontFamily: "'Inter'", fontSize: '0.8rem', fontWeight: 300, color: '#A09888',
            }}>
              <span style={{ color: '#C4965A', fontFamily: "'Inter'", fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(196,150,90,0.1)', padding: '2px 6px' }}>
                {p.cat}
              </span>
              <span style={{ color: '#E8E0D0', fontWeight: 400 }}>{p.title}</span>
              <span style={{ color: '#4A4440', fontSize: '0.7rem', marginLeft: 'auto', fontStyle: 'italic' }}>{p.slogan.slice(0, 40)}…</span>
            </summary>
            <div style={{ padding: '0.8rem 1rem 1.2rem', borderTop: '1px solid rgba(196,150,90,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
              <div>
                <Label>Titre</Label>
                <IA value={p.title} onChange={e => update(p.id, 'title', e.target.value)} />
              </div>
              <div>
                <Label>Catégorie</Label>
                <select
                  value={p.cat}
                  onChange={e => update(p.id, 'cat', e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#111', border: '1px solid rgba(196,150,90,0.2)', color: '#E8E0D0', fontFamily: "'Inter'", fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
                >
                  {['regards','style','cites','instants','terrains'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Label>Slogan</Label>
                <IA value={p.slogan} onChange={e => update(p.id, 'slogan', e.target.value)} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab: Sessions ──────────────────────────────────────── */
function SessionsTab({ sessions, onChange }) {
  const update = (i, field, val) => {
    onChange(sessions.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }
  const updateInclude = (si, ii, val) => {
    const arr = [...sessions[si].includes]
    arr[ii] = val
    update(si, 'includes', arr)
  }
  const addInclude  = (si) => update(si, 'includes', [...sessions[si].includes, ''])
  const rmInclude   = (si, ii) => update(si, 'includes', sessions[si].includes.filter((_, idx) => idx !== ii))

  return (
    <div>
      <SectionTitle>Formules ({sessions.length})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sessions.map((s, i) => (
          <div key={i} style={{ background: '#0E0E0E', border: '1px solid rgba(196,150,90,0.12)', padding: '1.4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div>
                <Label>Nom</Label>
                <IA value={s.name} onChange={e => update(i, 'name', e.target.value)} />
              </div>
              <div>
                <Label>Durée</Label>
                <IA value={s.duration} onChange={e => update(i, 'duration', e.target.value)} />
              </div>
              <div>
                <Label>Tarif</Label>
                <IA value={s.price} onChange={e => update(i, 'price', e.target.value)} />
              </div>
              <div>
                <Label>Populaire</Label>
                <select
                  value={s.highlight ? 'oui' : 'non'}
                  onChange={e => update(i, 'highlight', e.target.value === 'oui')}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#111', border: '1px solid rgba(196,150,90,0.2)', color: '#E8E0D0', fontFamily: "'Inter'", fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <Label>Description</Label>
              <TA value={s.desc} onChange={e => update(i, 'desc', e.target.value)} style={{ minHeight: '80px' }} />
            </div>
            <div>
              <Label>Inclus dans la formule</Label>
              {s.includes.map((inc, ii) => (
                <div key={ii} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <IA value={inc} onChange={e => updateInclude(i, ii, e.target.value)} style={{ flex: 1 }} />
                  <button onClick={() => rmInclude(i, ii)} style={{ background: 'rgba(180,55,55,0.15)', border: '1px solid rgba(180,55,55,0.3)', color: '#C05050', cursor: 'pointer', padding: '0 0.7rem', flexShrink: 0 }}>×</button>
                </div>
              ))}
              <Btn onClick={() => addInclude(i)} variant="outline" style={{ marginTop: '0.3rem', fontSize: '0.58rem' }}>+ Ajouter</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab: About ─────────────────────────────────────────── */
function AboutTab({ about, onChange }) {
  return (
    <div>
      <SectionTitle>À Propos</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FieldRow>
          <Label>Citation d'accroche</Label>
          <TA value={about.quote} onChange={e => onChange({ ...about, quote: e.target.value })} style={{ minHeight: '60px' }} />
        </FieldRow>
        <FieldRow>
          <Label>Paragraphe 1</Label>
          <TA value={about.para1} onChange={e => onChange({ ...about, para1: e.target.value })} />
        </FieldRow>
        <FieldRow>
          <Label>Paragraphe 2</Label>
          <TA value={about.para2} onChange={e => onChange({ ...about, para2: e.target.value })} />
        </FieldRow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
          {about.stats.map((stat, i) => (
            <div key={i}>
              <Label>Stat {i+1} — Valeur</Label>
              <IA value={stat[0]} onChange={e => {
                const s = [...about.stats]; s[i] = [e.target.value, stat[1]]; onChange({ ...about, stats: s })
              }} style={{ marginBottom: '0.3rem' }} />
              <Label>Stat {i+1} — Libellé</Label>
              <IA value={stat[1]} onChange={e => {
                const s = [...about.stats]; s[i] = [stat[0], e.target.value]; onChange({ ...about, stats: s })
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Tab: Réservations ──────────────────────────────────── */
function BookingsTab() {
  const [bookings, setBookings] = useState(loadBookings)
  const remove = (id) => {
    const updated = bookings.filter(b => b.id !== id)
    setBookings(updated)
    try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated)) } catch {}
  }

  if (!bookings.length) {
    return (
      <div>
        <SectionTitle>Réservations</SectionTitle>
        <p style={{ fontFamily: "'Inter'", fontSize: '0.82rem', color: '#5A5450' }}>Aucune réservation pour l'instant.</p>
      </div>
    )
  }

  return (
    <div>
      <SectionTitle>Réservations ({bookings.length})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {[...bookings].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(b => (
          <div key={b.id} style={{
            background: '#0E0E0E', border: '1px solid rgba(196,150,90,0.08)',
            padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ background: 'rgba(196,150,90,0.1)', padding: '0.3rem 0.7rem', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', color: '#C4965A' }}>
                {b.date || '—'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <p style={{ fontFamily: "'Inter'", fontSize: '0.82rem', fontWeight: 400, color: '#E8E0D0', margin: '0 0 0.2rem' }}>{b.nom}</p>
              <p style={{ fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 300, color: '#7A7268', margin: 0 }}>
                {b.email} {b.telephone ? `· ${b.telephone}` : ''}
              </p>
            </div>
            <span style={{
              fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#C4965A',
              background: 'rgba(196,150,90,0.08)', padding: '0.25rem 0.6rem',
            }}>
              {b.session}
            </span>
            {b.message && (
              <span style={{ fontFamily: "'Inter'", fontSize: '0.75rem', fontStyle: 'italic', color: '#5A5450', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                "{b.message}"
              </span>
            )}
            <button
              onClick={() => remove(b.id)}
              title="Supprimer"
              style={{
                background: 'rgba(180,55,55,0.1)', border: '1px solid rgba(180,55,55,0.25)',
                color: '#C05050', cursor: 'pointer', padding: '0.3rem 0.7rem',
                fontFamily: "'Inter'", fontSize: '0.65rem', flexShrink: 0,
              }}
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab: Paramètres ────────────────────────────────────── */
function SettingsTab() {
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  const save = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const changePin = () => {
    localStorage.removeItem(PIN_KEY)
    alert('PIN réinitialisé. Rechargez la page pour en créer un nouveau.')
  }

  const publishToGitHub = async () => {
    const { ghToken, ghOwner, ghRepo, ghBranch } = settings
    if (!ghToken || !ghOwner || !ghRepo) {
      setPublishMsg('Remplissez Token, Owner et Repo avant de publier.')
      return
    }

    setPublishing(true)
    setPublishMsg('')

    try {
      const branch = ghBranch || 'main'
      const path   = 'public/data/content.json'

      // Get current file SHA (needed for update)
      const headRes = await fetch(
        `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/${path}?ref=${branch}`,
        { headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github.v3+json' } }
      )
      let sha = undefined
      if (headRes.ok) {
        const headData = await headRes.json()
        sha = headData.sha
      }

      // Build content object
      const content = {
        photos:   JSON.parse(localStorage.getItem('vbd_admin_photos') || 'null'),
        sessions: JSON.parse(localStorage.getItem('vbd_admin_sessions') || 'null'),
        about:    JSON.parse(localStorage.getItem('vbd_admin_about') || 'null'),
        formspreeId: settings.formspreeId || '',
        publishedAt: new Date().toISOString(),
      }

      const body = { message: 'Admin: update content', content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))), branch }
      if (sha) body.sha = sha

      const putRes = await fetch(
        `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/${path}`,
        {
          method:  'PUT',
          headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        }
      )

      if (putRes.ok) {
        setPublishMsg('✓ Publié ! GitHub Actions reconstruit le site (env. 60s).')
      } else {
        const err = await putRes.json()
        setPublishMsg(`Erreur GitHub : ${err.message}`)
      }
    } catch (e) {
      setPublishMsg(`Erreur réseau : ${e.message}`)
    }

    setPublishing(false)
  }

  return (
    <div>
      <SectionTitle>Paramètres</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
        {/* Formspree */}
        <div style={{ background: '#0E0E0E', border: '1px solid rgba(196,150,90,0.08)', padding: '1.2rem' }}>
          <p style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C4965A', marginBottom: '0.8rem', marginTop: 0 }}>
            📧 Notifications email (Formspree)
          </p>
          <p style={{ fontFamily: "'Inter'", fontSize: '0.75rem', fontWeight: 300, color: '#6A6460', lineHeight: 1.6, marginBottom: '0.8rem', marginTop: 0 }}>
            Créez un compte gratuit sur <a href="https://formspree.io" target="_blank" rel="noreferrer" style={{ color: '#C4965A' }}>formspree.io</a>, créez un formulaire → copiez l'ID (ex: <code style={{ color: '#C4965A' }}>xpwzabcd</code>).
            Chaque réservation vous enverra un email à <strong style={{ color: '#E8E0D0' }}>Vbdaryl17@outlook.fr</strong>.
          </p>
          <Label>ID Formspree</Label>
          <IA placeholder="ex: xpwzabcd" value={settings.formspreeId || ''} onChange={e => set('formspreeId', e.target.value)} />
        </div>

        {/* GitHub publish */}
        <div style={{ background: '#0E0E0E', border: '1px solid rgba(196,150,90,0.08)', padding: '1.2rem' }}>
          <p style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C4965A', marginBottom: '0.8rem', marginTop: 0 }}>
            🚀 Publier sur GitHub Pages
          </p>
          <p style={{ fontFamily: "'Inter'", fontSize: '0.75rem', fontWeight: 300, color: '#6A6460', lineHeight: 1.6, marginBottom: '0.8rem', marginTop: 0 }}>
            Allez sur <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" style={{ color: '#C4965A' }}>github.com/settings/tokens</a> → créez un token avec permission <code style={{ color: '#C4965A' }}>repo</code>. Le token est stocké localement sur cet appareil.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <div><Label>GitHub Owner (username)</Label><IA placeholder="ahmedwasef" value={settings.ghOwner || ''} onChange={e => set('ghOwner', e.target.value)} /></div>
            <div><Label>Repo</Label><IA placeholder="viewbydaryl" value={settings.ghRepo || ''} onChange={e => set('ghRepo', e.target.value)} /></div>
            <div><Label>Branche</Label><IA placeholder="main" value={settings.ghBranch || ''} onChange={e => set('ghBranch', e.target.value)} /></div>
          </div>
          <Label>Personal Access Token</Label>
          <IA type="password" placeholder="ghp_xxxxxxxxxxxx" value={settings.ghToken || ''} onChange={e => set('ghToken', e.target.value)} style={{ marginBottom: '0.8rem' }} />

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Btn variant="gold" onClick={publishToGitHub} disabled={publishing}>
              {publishing ? 'Publication…' : '🚀 Publier sur GitHub'}
            </Btn>
            {publishMsg && (
              <span style={{ fontFamily: "'Inter'", fontSize: '0.75rem', color: publishMsg.startsWith('✓') ? '#6AAA6A' : '#C05050' }}>
                {publishMsg}
              </span>
            )}
          </div>
        </div>

        {/* PIN */}
        <div style={{ background: '#0E0E0E', border: '1px solid rgba(196,150,90,0.08)', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: "'Inter'", fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C4965A', marginBottom: '0.3rem', marginTop: 0 }}>
              🔒 Sécurité
            </p>
            <p style={{ fontFamily: "'Inter'", fontSize: '0.75rem', fontWeight: 300, color: '#6A6460', margin: 0 }}>Réinitialiser le PIN admin</p>
          </div>
          <Btn variant="danger" onClick={changePin}>Réinitialiser PIN</Btn>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Btn variant="gold" onClick={save}>Enregistrer</Btn>
        {saved && <span style={{ fontFamily: "'Inter'", fontSize: '0.75rem', color: '#6AAA6A' }}>✓ Enregistré</span>}
      </div>
    </div>
  )
}

/* ─── Main Admin component ───────────────────────────────── */
export default function Admin({ defaultPhotos, defaultSessions, defaultAbout, onClose, onContentChange }) {
  const [authed,  setAuthed]  = useState(false)
  const [tab,     setTab]     = useState('photos')
  const [saved,   setSaved]   = useState(false)

  // Working copies (local to admin, merged into app on save)
  const [photos,   setPhotos]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('vbd_admin_photos') || 'null') || defaultPhotos }
    catch { return defaultPhotos }
  })
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vbd_admin_sessions') || 'null') || defaultSessions }
    catch { return defaultSessions }
  })
  const [about,    setAbout]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('vbd_admin_about') || 'null') || defaultAbout }
    catch { return defaultAbout }
  })

  // Keyboard shortcut to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const saveAll = () => {
    try {
      localStorage.setItem('vbd_admin_photos',   JSON.stringify(photos))
      localStorage.setItem('vbd_admin_sessions', JSON.stringify(sessions))
      localStorage.setItem('vbd_admin_about',    JSON.stringify(about))
    } catch {}
    onContentChange({ photos, sessions, about })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const resetAll = () => {
    if (!confirm('Réinitialiser tout le contenu aux valeurs par défaut ?')) return
    localStorage.removeItem('vbd_admin_photos')
    localStorage.removeItem('vbd_admin_sessions')
    localStorage.removeItem('vbd_admin_about')
    setPhotos(defaultPhotos)
    setSessions(defaultSessions)
    setAbout(defaultAbout)
    onContentChange({ photos: defaultPhotos, sessions: defaultSessions, about: defaultAbout })
  }

  const TABS = [
    { id: 'photos',    label: 'Photos'        },
    { id: 'sessions',  label: 'Formules'      },
    { id: 'about',     label: 'À Propos'      },
    { id: 'bookings',  label: 'Réservations'  },
    { id: 'settings',  label: 'Paramètres'    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: '#080808', overflowY: 'auto',
      }}
    >
      {!authed ? (
        <PinScreen onSuccess={() => setAuthed(true)} />
      ) : (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
          {/* ── Top bar ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: "'Inter'", fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C4965A', margin: '0 0 0.3rem' }}>
                Tableau de bord
              </p>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 400, color: '#F5F0E8', margin: 0 }}>
                viewbydaryl <span style={{ color: '#C4965A', fontStyle: 'italic' }}>admin</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {saved && <span style={{ fontFamily: "'Inter'", fontSize: '0.75rem', color: '#6AAA6A' }}>✓ Modifications enregistrées</span>}
              <Btn variant="outline" onClick={resetAll}>Réinitialiser</Btn>
              <Btn variant="gold"    onClick={saveAll}>Enregistrer & Appliquer</Btn>
              <button
                onClick={onClose}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#5A5450', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(196,150,90,0.1)', marginBottom: '2rem', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #C4965A' : '2px solid transparent',
                  color: tab === t.id ? '#C4965A' : '#5A5450', cursor: 'pointer',
                  fontFamily: "'Inter'", fontSize: '0.68rem', fontWeight: 300, letterSpacing: '0.18em',
                  textTransform: 'uppercase', padding: '0.75rem 1.2rem', flexShrink: 0,
                  transition: 'color 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'photos'   && <PhotosTab   photos={photos}     onChange={setPhotos}   />}
              {tab === 'sessions' && <SessionsTab sessions={sessions} onChange={setSessions} />}
              {tab === 'about'    && <AboutTab    about={about}       onChange={setAbout}    />}
              {tab === 'bookings' && <BookingsTab />}
              {tab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>

          {/* ── Bottom save ── */}
          {tab !== 'settings' && tab !== 'bookings' && (
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,150,90,0.08)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Btn variant="gold" onClick={saveAll}>Enregistrer & Appliquer</Btn>
              <span style={{ fontFamily: "'Inter'", fontSize: '0.7rem', fontWeight: 300, color: '#4A4440' }}>
                Les modifications s'appliquent immédiatement sur le site. Pour les rendre permanentes, cliquez «&nbsp;Publier sur GitHub&nbsp;» dans les Paramètres.
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
