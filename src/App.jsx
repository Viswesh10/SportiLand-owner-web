import { useEffect, useMemo, useRef, useState } from 'react'
import { ownerApi, backendOwnerLogin, backendOwnerRegister } from './services/sharedContentApi'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  Activity, ArrowRight, BellRing, Calendar, CalendarCheck, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, Edit3, Eye,
  EyeOff, LayoutDashboard, LogOut, MapPin, Menu, Plus, Save, Search,
  ShieldCheck, TrendingUp, Users, Wallet, X, Ban, Building2, CircleHelp,
  Trophy, UserRound, ClipboardList, Images, Upload, Trash2, Gamepad2, Video, FileImage, Camera,
  Mountain, Flag, UserCheck, Ticket, QrCode, ScanLine, RotateCcw, AlertTriangle, FileText,
} from 'lucide-react'

const STORE = {
  accounts: 'ff-owner-demo-accounts-v1',
  bookings: 'ff-owner-demo-bookings-v1',
  slots: 'ff-owner-demo-slots-v1',
  events: 'ff-owner-events-v1',
  checkIns: 'ff-owner-demo-checkins-v1'
}
// Keep authentication in this browser tab, and use a fresh key so older demo
// sessions cannot silently bypass the required login screen.
const SESSION_KEY = 'ff-owner-tab-session-v3'
const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'
const readTabSession = () => {
  try { const value = sessionStorage.getItem(SESSION_KEY); return value ? JSON.parse(value) : null }
  catch { return null }
}
const writeTabSession = value => {
  try { if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); else sessionStorage.removeItem(SESSION_KEY) }
  catch { /* Session persistence is optional in restricted browser modes. */ }
}

const today = () => {
  const d = new Date()
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
const addDays = (date, amount) => {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + amount)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const dayName = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const paidAmount = booking => Number(booking?.amountPaid ?? (booking?.payment === 'Paid' ? booking?.amount : 0)) || 0
const timeLabel = value => {
  const [h, m] = value.split(':').map(Number)
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}


function CustomDateField({ value, onChange, min, ariaLabel = 'Choose date', compact = false }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const source = value ? new Date(`${value}T12:00:00`) : new Date()
    return { year: source.getFullYear(), month: source.getMonth() }
  })
  const rootRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const key = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key) }
  }, [open])
  useEffect(() => {
    if (!open || !value) return
    const parsed = new Date(`${value}T12:00:00`)
    if (!Number.isNaN(parsed.getTime())) setView({ year: parsed.getFullYear(), month: parsed.getMonth() })
  }, [open, value])
  const first = new Date(view.year, view.month, 1).getDay()
  const count = new Date(view.year, view.month + 1, 0).getDate()
  const minDate = min ? new Date(`${min}T00:00:00`) : null
  const monthTitle = new Date(view.year, view.month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const shiftMonth = amount => {
    const next = new Date(view.year, view.month + amount, 1)
    setView({ year: next.getFullYear(), month: next.getMonth() })
  }
  const iso = day => `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const todayValue = today()
  const display = value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select a date'
  return <div className={`ff-date-field ${compact ? 'compact' : ''}`} ref={rootRef}>
    <button type="button" className="ff-picker-trigger" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen(previous => !previous)}>
      {!compact && <CalendarDays size={16}/>}<strong>{display}</strong><ChevronDown size={15}/>
    </button>
    {open && <div className="ff-date-popover" role="dialog" aria-label="Choose a date">
      <div className="ff-date-popover-head"><button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={17}/></button><strong>{monthTitle}</strong><button type="button" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={17}/></button></div>
      <div className="ff-calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="ff-calendar-days">{Array.from({ length: first }, (_, index) => <span className="empty" key={`blank-${index}`}/>)}{Array.from({ length: count }, (_, index) => {
        const day = index + 1, dateValue = iso(day), dateObject = new Date(`${dateValue}T12:00:00`)
        const disabled = minDate && dateObject < minDate
        return <button key={dateValue} type="button" disabled={Boolean(disabled)} className={`${value === dateValue ? 'selected' : ''} ${todayValue === dateValue ? 'today' : ''}`} onClick={() => { onChange(dateValue); setOpen(false) }}>{day}</button>
      })}</div>
      <div className="ff-date-popover-foot"><button type="button" onClick={() => { onChange(todayValue); setOpen(false); const now = new Date(); setView({ year: now.getFullYear(), month: now.getMonth() }) }}>Today</button><button type="button" onClick={() => setOpen(false)}>Done</button></div>
    </div>}
  </div>
}

function CustomTimeField({ value, onChange, ariaLabel = 'Choose time' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const [hourText, minuteText] = (value || '06:00').split(':')
  const hour24 = Number(hourText) || 0
  const hour12 = ((hour24 + 11) % 12) + 1
  const minute = Number(minuteText) || 0
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const commit = (hour, minutesValue, meridiem) => {
    const converted = meridiem === 'AM' ? hour % 12 : (hour % 12) + 12
    onChange(`${String(converted).padStart(2, '0')}:${String(minutesValue).padStart(2, '0')}`)
  }
  useEffect(() => {
    if (!open) return undefined
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const key = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key) }
  }, [open])
  return <div className="ff-time-field" ref={rootRef}>
    <button type="button" className="ff-picker-trigger" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen(previous => !previous)}>
      <Clock3 size={16}/><strong>{timeLabel(value || '06:00')}</strong><ChevronDown size={15}/>
    </button>
    {open && <div className="ff-time-popover" role="dialog" aria-label="Choose a start time">
      <div className="ff-time-columns">
        <div className="ff-time-column"><small>HOUR</small><div>{Array.from({ length: 12 }, (_, index) => index + 1).map(hour => <button type="button" key={hour} className={hour === hour12 ? 'selected' : ''} onClick={() => commit(hour, minute, period)}>{String(hour).padStart(2, '0')}</button>)}</div></div>
        <div className="ff-time-column"><small>MIN</small><div>{Array.from({ length: 60 }, (_, index) => index).map(minuteOption => <button type="button" key={minuteOption} className={minuteOption === minute ? 'selected' : ''} onClick={() => commit(hour12, minuteOption, period)}>{String(minuteOption).padStart(2, '0')}</button>)}</div></div>
        <div className="ff-time-column period"><small>PERIOD</small><div>{['AM','PM'].map(item => <button type="button" key={item} className={item === period ? 'selected' : ''} onClick={() => commit(hour12, minute, item)}>{item}</button>)}</div></div>
      </div>
      <div className="ff-time-popover-foot"><span>Selected time</span><strong>{timeLabel(value || '06:00')}</strong><button type="button" onClick={() => setOpen(false)}>Done</button></div>
    </div>}
  </div>
}
const plusMinutes = (value, mins) => {
  const [h, m] = value.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
const minutes = value => {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}
const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const slug = value => String(value || 'my-turf').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const defaultTurf = {
  id: 'jaypal-sports-center',
  name: 'Jaypal Sports Center',
  area: 'Madurai',
  address: 'Madurai, Tamil Nadu',
  sports: ['Football', 'Cricket'],
  hourlyRate: 800,
  contactNumber: '9876543210',
  photoUrl: '/assets/venues/jaypal-sports-center.webp'
}

const demoOwner = {
  id: 'owner-demo',
  ownerName: 'Demo Owner',
  email: 'owner@sportiland.demo',
  contactNumber: '9876543210',
  password: 'Owner@123',
  createdAt: today(),
  turf: defaultTurf
}

const SPORT_CATALOG = [
  'Football', 'Cricket', 'Badminton', 'Running', 'Pickleball', 'Paintball', 'Boxing',
  'Basketball', 'Tennis', 'Volleyball', 'Table Tennis', 'Squash', 'Swimming',
  'Kabaddi', 'Hockey', 'Futsal', 'Rugby', 'Archery', 'Martial Arts', 'Skating', 'Athletics'
]

function seedOwnerEvents() {
  const eventDate = addDays(today(), 14)
  const registeredAt = new Date().toISOString()
  return [{
    id: 'demo-jaypal-trek', ownerId: 'owner-demo', isDemo: true,
    title: 'Jaypal Weekend Nature Trek', type: 'Trekking',
    description: 'A guided day outing created to demonstrate the owner event and registration workflow.',
    location: 'Samanar Hills, Madurai', startDate: eventDate, endDate: eventDate,
    startTime: '06:00', durationDays: 1, registrationFee: 499, capacity: 20,
    packages: ['Standard Trail – ₹499 – Guided trek and refreshments', 'Trail Plus – ₹799 – Guided trek, breakfast and lunch'],
    itinerary: ['06:00 AM – Meet at the venue and check-in', '06:30 AM – Safety briefing and warm-up', '07:00 AM – Guided trail begins', '09:00 AM – Scenic break and refreshments', '10:00 AM – Guided return walk', '11:30 AM – Wrap-up and departure'],
    registrations: [
      { id: 'JTR-1001', name: 'Arun Kumar', phone: '9876543211', email: 'arun.demo@example.com', package: 'Standard Trail', participants: 2, registeredAt, status: 'Confirmed', isDemo: true },
      { id: 'JTR-1002', name: 'Karthik S', phone: '9876543212', email: 'karthik.demo@example.com', package: 'Trail Plus', participants: 1, registeredAt, status: 'Confirmed', isDemo: true }
    ], createdAt: registeredAt
  }]
}

function seedBookings() {
  const dates = [addDays(today(), -2), addDays(today(), -1), today(), today(), addDays(today(), 1), addDays(today(), 2), addDays(today(), 4)]
  return [
    { id: 'FF-2401', ownerId: 'owner-demo', customer: 'Arun Kumar', email: 'arun.demo@example.com', phone: '9876543211', sport: 'Football', date: dates[0], start: '06:00', duration: 60, amount: 800, payment: 'Paid', status: 'Confirmed', createdAt: new Date().toISOString() },
    { id: 'FF-2402', ownerId: 'owner-demo', customer: 'Karthik S', email: 'karthik.demo@example.com', phone: '9876543212', sport: 'Cricket', date: dates[1], start: '08:00', duration: 120, amount: 1600, payment: 'Paid', status: 'Confirmed', createdAt: new Date().toISOString() },
    { id: 'FF-2403', ownerId: 'owner-demo', customer: 'Vignesh R', email: 'vignesh.demo@example.com', phone: '9876543213', sport: 'Football', date: dates[2], start: '17:00', duration: 90, amount: 1200, payment: 'Pending', status: 'Pending', createdAt: new Date().toISOString() },
    { id: 'FF-2404', ownerId: 'owner-demo', customer: 'Praveen M', email: 'praveen.demo@example.com', phone: '9876543214', sport: 'Football', date: dates[2], start: '19:00', duration: 60, amount: 800, payment: 'Paid', status: 'Confirmed', createdAt: new Date().toISOString() },
    { id: 'FF-2405', ownerId: 'owner-demo', customer: 'Sanjay K', email: 'sanjay.demo@example.com', phone: '9876543215', sport: 'Cricket', date: dates[4], start: '06:00', duration: 120, amount: 1600, payment: 'Pending', status: 'Pending', createdAt: new Date().toISOString() },
    { id: 'FF-2406', ownerId: 'owner-demo', customer: 'Hari P', email: 'hari.demo@example.com', phone: '9876543216', sport: 'Football', date: dates[5], start: '18:00', duration: 90, amount: 1200, payment: 'Paid', status: 'Confirmed', createdAt: new Date().toISOString() },
    { id: 'FF-2407', ownerId: 'owner-demo', customer: 'Madhan V', email: 'madhan.demo@example.com', phone: '9876543217', sport: 'Football', date: dates[6], start: '07:00', duration: 60, amount: 800, payment: 'Pending', status: 'Rejected', createdAt: new Date().toISOString() }
  ]
}

function seedSlots() {
  const result = []
  for (let offset = -1; offset <= 8; offset += 1) {
    const date = addDays(today(), offset)
    const rows = [
      ['06:00', 60, 'Available'],
      ['07:30', 60, 'Available'],
      ['09:00', 120, offset === 0 ? 'Blocked' : 'Available'],
      ['16:00', 60, 'Available'],
      ['17:00', 90, offset === 0 ? 'Booked' : 'Available'],
      ['19:00', 60, offset === 0 ? 'Booked' : 'Available'],
      ['20:30', 90, 'Available']
    ]
    rows.forEach(([start, duration, status], index) => {
      let finalStatus = status
      let bookingId = ''
      let customer = ''
      if (offset === 0 && start === '17:00') { bookingId = 'FF-2403'; customer = 'Vignesh R' }
      if (offset === 0 && start === '19:00') { bookingId = 'FF-2404'; customer = 'Praveen M' }
      result.push({
        id: `slot-${date}-${index}`,
        ownerId: 'owner-demo',
        date,
        start,
        duration,
        pricePerHour: 800,
        status: finalStatus,
        bookingId,
        customer
      })
    })
  }
  return result
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'availability', label: 'Availability', icon: CalendarDays },
  { id: 'bookings', label: 'Bookings', icon: ClipboardList },
  { id: 'scanner', label: 'Scan booking QR', icon: QrCode },
  { id: 'revenue', label: 'Revenue', icon: Wallet },
  { id: 'showcase', label: 'Showcase & games', icon: Images },
  { id: 'events', label: 'Events & treks', icon: CalendarDays },
  { id: 'profile', label: 'Turf profile', icon: Building2 }
]

function mapOnlineOwnerBooking(item, ownerId) {
  const statusMap = { PENDING_OWNER_CONFIRMATION: 'Pending', CONFIRMED: 'Confirmed', REJECTED: 'Rejected', CANCELLED: 'Rejected' }
  const rawStatus = String(item.status || '').toUpperCase()
  const rawPayment = String(item.paymentStatus || '').toUpperCase()
  const amount = Number(item.amountDue || 0)
  const amountPaid = Number(item.amountPaid || 0)
  const durationMinutes = Number(item.durationMinutes || 60)
  return {
    id: item.bookingId, ownerId, customer: item.customerName || 'Customer',
    email: item.customerEmail || '', phone: item.customerPhone || '',
    sport: item.sport || 'Sports booking', date: item.bookingDate,
    start: item.startTime || '06:00', duration: durationMinutes,
    amount, amountPaid, payment: rawPayment === 'CAPTURED' ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending',
    status: statusMap[rawStatus] || item.status || 'Pending',
    source: 'Online', notes: '', createdAt: item.createdAt || new Date().toISOString(), backend: true
  }
}

export default function App() {
  const [accounts, setAccounts] = useState(() => {
    const stored = readStore(STORE.accounts, null)
    if (Array.isArray(stored)) return DEMO_MODE ? [demoOwner, ...stored.filter(item => item.id !== demoOwner.id)] : stored.filter(item => item.id !== demoOwner.id)
    return DEMO_MODE ? [demoOwner] : []
  })
  const [session, setSession] = useState(() => readTabSession())
  const [bookings, setBookings] = useState(() => readStore(STORE.bookings, seedBookings()))
  const [checkedInPasses, setCheckedInPasses] = useState(() => readStore(STORE.checkIns, []))
  const [slots, setSlots] = useState(() => readStore(STORE.slots, seedSlots()))
  const [ownerEvents, setOwnerEvents] = useState(() => readStore(STORE.events, seedOwnerEvents()))
  const [page, setPage] = useState('overview')
  const [selectedDate, setSelectedDate] = useState(today())
  const [calendarMode, setCalendarMode] = useState('daily')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [bookingFilter, setBookingFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [editSlot, setEditSlot] = useState(null)
  const [slotForm, setSlotForm] = useState({ start: '06:00', duration: 60, pricePerHour: 800, date: today() })
  const [slotError, setSlotError] = useState('')
  const [walkInSlot, setWalkInSlot] = useState(null)
  const [walkInForm, setWalkInForm] = useState({ customer: '', phone: '', email: '', amountPaid: '', notes: '' })
  const [walkInError, setWalkInError] = useState('')
  const [profileForm, setProfileForm] = useState(null)
  const [publishedMedia, setPublishedMedia] = useState([])
  const [publishedSports, setPublishedSports] = useState([])
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState('')
  const remoteBookingIdsRef = useRef(new Set())
  const bookingPollReadyRef = useRef(false)
  const account = accounts.find(item => item.id === session?.ownerId) || null
  const turf = account?.turf || null

  useEffect(() => writeStore(STORE.accounts, accounts), [accounts])
  useEffect(() => writeStore(STORE.bookings, bookings), [bookings])
  useEffect(() => writeStore(STORE.checkIns, checkedInPasses), [checkedInPasses])
  useEffect(() => writeStore(STORE.slots, slots), [slots])
  useEffect(() => writeStore(STORE.events, ownerEvents), [ownerEvents])
  useEffect(() => writeTabSession(session), [session])
  useEffect(() => {
    if (!session?.backend || !account) return
    let active = true
    setContentLoading(true)
    ownerApi('/api/owner/content').then(content => {
      if (!active) return
      setPublishedMedia(content.media || [])
      setPublishedSports(content.sports || account.turf?.sports || [])
      setContentError('')
    }).catch(error => { if (active) setContentError(error.message) })
      .finally(() => { if (active) setContentLoading(false) })
    return () => { active = false }
  }, [session?.backend, account?.id])
  useEffect(() => {
    if (!session?.backend || !account) {
      remoteBookingIdsRef.current = new Set()
      bookingPollReadyRef.current = false
      return undefined
    }
    let active = true
    remoteBookingIdsRef.current = new Set()
    bookingPollReadyRef.current = false
    const refreshOwnerBookings = async () => {
      try {
        const rows = await ownerApi('/api/owner/bookings')
        if (!active) return
        const remote = (Array.isArray(rows) ? rows : []).map(item => mapOnlineOwnerBooking(item, account.id))
        const newRequests = bookingPollReadyRef.current
          ? remote.filter(item => item.status === 'Pending' && !remoteBookingIdsRef.current.has(item.id))
          : []
        remote.forEach(item => remoteBookingIdsRef.current.add(item.id))
        setBookings(previous => [...remote, ...previous.filter(item => !item.backend)])
        if (newRequests.length) {
          const first = newRequests[0]
          notify(newRequests.length === 1
            ? `New online booking from ${first.customer} · ${formatDate(first.date)} at ${timeLabel(first.start)}.`
            : `${newRequests.length} new online booking requests received.`)
        }
        bookingPollReadyRef.current = true
      } catch (error) {
        // Keep the last known booking snapshot visible during temporary network interruptions.
      }
    }
    refreshOwnerBookings()
    const timer = window.setInterval(refreshOwnerBookings, 8000)
    const onFocus = () => refreshOwnerBookings()
    window.addEventListener('focus', onFocus)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [session?.backend, account?.id])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  // Every workspace section opens at its own top edge; this prevents old scroll
  // offsets from clipping headings when an owner switches sections.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  // Scroll reveals intentionally toggle in both directions. When a card or
  // panel leaves the viewport it resets, so it animates again on re-entry.
  useEffect(() => {
    const selector = [
      '.auth-screen [data-owner-reveal]',
      '.owner-app .main-content .page-heading',
      '.owner-app .main-content .owner-ad-marquee',
      '.owner-app .main-content .owner-venue-banner',
      '.owner-app .main-content .stat-card',
      '.owner-app .main-content .panel',
      '.owner-app .main-content .slot-card',
      '.owner-app .main-content .week-day',
      '.owner-app .main-content .owner-media-card',
      '.owner-app .main-content .profile-main',
      '.owner-app .main-content .showcase-status-panel',
      '.owner-app .main-content .showcase-games-panel',
      '.owner-app .main-content .showcase-upload-panel'
    ].join(',')
    const nodes = Array.from(document.querySelectorAll(selector))
    if (!nodes.length) return undefined
    nodes.forEach(node => node.classList.add('owner-reveal-pending'))
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(node => node.classList.add('owner-revealed'))
      return undefined
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('owner-revealed', entry.isIntersecting)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [page, account?.id, publishedMedia.length, bookings.length, slots.length])

  const myBookings = useMemo(() => bookings.filter(item => item.ownerId === account?.id), [bookings, account?.id])
  const mySlots = useMemo(() => slots.filter(item => item.ownerId === account?.id), [slots, account?.id])
  const myEvents = useMemo(() => ownerEvents.filter(item => item.ownerId === account?.id), [ownerEvents, account?.id])
  const dateSlots = mySlots.filter(item => item.date === selectedDate).sort((a, b) => a.start.localeCompare(b.start))
  const todayBookings = myBookings.filter(item => item.date === today())
  const pendingBookings = myBookings.filter(item => item.status === 'Pending')
  const confirmedBookings = myBookings.filter(item => item.status === 'Confirmed')
  const paidRevenue = myBookings.filter(item => item.status !== 'Rejected').reduce((sum, item) => sum + paidAmount(item), 0)
  const pendingRevenue = myBookings.filter(item => item.status !== 'Rejected').reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - paidAmount(item)), 0)

  function notify(message) { setToast(message) }
  function signIn(owner, backendConnected = false) {
    setSession({ ownerId: owner.id, backend: backendConnected, signedInAt: new Date().toISOString() })
    setPage('overview')
    setSelectedDate(today())
    setProfileForm({ ...owner, turf: { ...owner.turf } })
    setPublishedSports(owner.turf?.sports || [])
  }
  function logout() {
    if (session?.backend) ownerApi('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setSession(null)
    setPage('overview')
    setProfileForm(null)
  }
  function markDemoCheckIn(pass) {
    if (!pass?.token) return
    const normalizeVenue = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (normalizeVenue(pass.venue) !== normalizeVenue(turf?.name)) {
      notify('This booking pass belongs to a different venue.')
      return
    }
    if (/cancel|reject/i.test(String(pass.bookingStatus || ''))) {
      notify('Cancelled or rejected bookings cannot be checked in.')
      return
    }
    if (checkedInPasses.some(item => item.token === pass.token)) {
      notify('This QR pass has already been checked in on this browser.')
      return
    }
    setCheckedInPasses(previous => [{ token: pass.token, bookingId: pass.bookingId, checkedInAt: new Date().toISOString(), turfId: turf?.id || '' }, ...previous])
    notify('Demo check-in recorded in this browser only. Live verification needs a shared backend.')
  }

  async function updateBooking(id, status) {
    const target = bookings.find(item => item.id === id)
    if (target?.backend && session?.backend) {
      try {
        await ownerApi(`/api/owner/bookings/${encodeURIComponent(id)}/status`, {
          method: 'PATCH', body: { status: status.toUpperCase() }
        })
      } catch (error) {
        notify(error.message || 'Unable to update this online booking. Please retry.')
        return
      }
    }
    setBookings(previous => previous.map(item => item.id === id ? { ...item, status } : item))
    if (target && status === 'Rejected') {
      setSlots(previous => previous.map(slot => slot.bookingId === id ? { ...slot, status: 'Available', bookingId: '', customer: '', customerPhone: '', amountPaid: 0 } : slot))
    }
    notify(`Booking ${status.toLowerCase()}.`)
  }
  function openNewSlot(date = selectedDate) {
    const targetDate = typeof date === 'string' ? date : selectedDate
    setEditSlot('new')
    setSlotError('')
    setSlotForm({ start: '06:00', duration: 60, pricePerHour: Number(turf?.hourlyRate || 800), date: targetDate })
  }
  function openEditSlot(slot) {
    if (slot.status === 'Booked') { notify('Booked slots cannot be edited. Update the booking record instead.'); return }
    setEditSlot(slot.id)
    setSlotError('')
    setSlotForm({ start: slot.start, duration: slot.duration, pricePerHour: slot.pricePerHour, date: slot.date })
  }
  function saveSlot(event) {
    event.preventDefault()
    if (!account) return
    const start = slotForm.start
    const duration = Number(slotForm.duration)
    const rate = Number(slotForm.pricePerHour)
    if (!start || !slotForm.date || duration < 30 || !Number.isFinite(rate) || rate <= 0) {
      setSlotError('Enter a valid date, time, duration and hourly price.')
      return
    }
    const startMin = minutes(start)
    const overlap = mySlots.find(item => item.date === slotForm.date && item.id !== editSlot &&
      startMin < minutes(item.start) + Number(item.duration) && minutes(item.start) < startMin + duration)
    if (overlap) {
      setSlotError(`This slot overlaps ${timeLabel(overlap.start)} (${overlap.duration} minutes).`)
      return
    }
    if (editSlot && editSlot !== 'new') {
      setSlots(previous => previous.map(item => item.id === editSlot ? { ...item, ...slotForm, duration, pricePerHour: rate } : item))
      notify('Slot updated successfully.')
    } else {
      const newSlot = { id: uid('slot'), ownerId: account.id, date: slotForm.date, start, duration, pricePerHour: rate, status: 'Available', bookingId: '', customer: '' }
      setSlots(previous => [...previous, newSlot])
      notify('New slot added to your calendar.')
    }
    setEditSlot(null)
    setSlotError('')
  }
  function changeSlotStatus(slot, status) {
    if (slot.status === 'Booked') {
      notify('A booked slot cannot be blocked or reopened from this action.')
      return
    }
    setSlots(previous => previous.map(item => item.id === slot.id ? { ...item, status } : item))
    notify(status === 'Blocked' ? 'Slot blocked.' : 'Slot is available again.')
  }
  function openWalkInBooking(slot) {
    if (!slot || slot.status !== 'Available') return
    const total = Math.round((Number(slot.duration) / 60) * Number(slot.pricePerHour))
    setWalkInSlot(slot)
    setWalkInForm({ customer: '', phone: '', email: '', amountPaid: String(total), notes: '' })
    setWalkInError('')
  }

  function saveWalkInBooking(event) {
    event.preventDefault()
    if (!account || !walkInSlot) return
    const currentSlot = slots.find(item => item.id === walkInSlot.id && item.ownerId === account.id)
    if (!currentSlot || currentSlot.status !== 'Available') { setWalkInError('This slot is no longer available. Refresh the calendar and choose another slot.'); return }
    const customer = walkInForm.customer.trim()
    const phone = walkInForm.phone.trim()
    const email = walkInForm.email.trim()
    const total = Math.round((Number(walkInSlot.duration) / 60) * Number(walkInSlot.pricePerHour))
    const received = Number(walkInForm.amountPaid)
    if (customer.length < 2) { setWalkInError('Enter the customer name.'); return }
    if (!/^[+0-9\s-]{8,16}$/.test(phone)) { setWalkInError('Enter a valid customer phone number.'); return }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setWalkInError('Enter a valid email address or leave it blank.'); return }
    if (!Number.isFinite(received) || received < 0 || received > total) { setWalkInError(`Amount received must be between ₹0 and ${money(total)}.`); return }
    const payment = received >= total ? 'Paid' : received > 0 ? 'Partial' : 'Pending'
    const bookingId = `FF-WI-${Date.now().toString().slice(-7)}`
    const booking = {
      id: bookingId, ownerId: account.id, customer, email, phone, sport: (turf?.sports || ['Football'])[0],
      date: walkInSlot.date, start: walkInSlot.start, duration: Number(walkInSlot.duration), amount: total,
      amountPaid: received, payment, status: 'Confirmed', source: 'Walk-in', notes: walkInForm.notes.trim(),
      createdAt: new Date().toISOString()
    }
    setBookings(previous => [booking, ...previous])
    setSlots(previous => previous.map(item => item.id === walkInSlot.id ? {
      ...item, status: 'Booked', bookingId, customer, customerPhone: phone, amountPaid: received, bookingSource: 'Walk-in'
    } : item))
    setWalkInSlot(null)
    setWalkInError('')
    notify(`Walk-in booking recorded for ${customer}. Slot is now marked booked.`)
  }
  async function saveGames(sports) {
    if (!account) return
    if (!session?.backend) {
      setPublishedSports(sports)
      setAccounts(previous => previous.map(item => item.id === account.id ? { ...item, turf: { ...item.turf, sports } } : item))
      notify('Games saved to this demo owner profile. Backend publishing can be connected later.')
      return
    }
    try {
      const result = await ownerApi('/api/owner/content/sports', { method: 'PUT', body: { sports } })
      setPublishedSports(result || sports)
      setAccounts(previous => previous.map(item => item.id === account.id ? { ...item, turf: { ...item.turf, sports: result || sports } } : item))
      notify('Games published to the customer website.')
    } catch (error) { setContentError(error.message); notify(error.message) }
  }

  function createOwnerEvent(eventData) {
    if (!account) return
    const created = { ...eventData, id: uid('event'), ownerId: account.id, registrations: [], createdAt: new Date().toISOString(), isDemo: !session?.backend }
    setOwnerEvents(previous => [created, ...previous])
    notify('Event created in your owner workspace.')
    return created.id
  }

  async function uploadShowcaseFiles(files, caption) {
    if (!session?.backend) { notify('Sign in with an owner account registered through the shared backend to publish photos and videos.'); return }
    for (const file of Array.from(files || [])) {
      const form = new FormData(); form.append('file', file); form.append('caption', caption || '')
      try {
        const media = await ownerApi('/api/owner/content/media', { method: 'POST', body: form })
        setPublishedMedia(previous => [media, ...previous])
      } catch (error) { setContentError(error.message); notify(error.message); return }
    }
    notify('Venue media uploaded and published.')
  }

  async function removeShowcaseMedia(mediaId) {
    if (!session?.backend) return
    try {
      await ownerApi(`/api/owner/content/media/${mediaId}`, { method: 'DELETE' })
      setPublishedMedia(previous => previous.filter(item => item.id !== mediaId))
      notify('Media removed from the customer website.')
    } catch (error) { notify(error.message) }
  }

  async function saveProfile(event) {
    event.preventDefault()
    if (!account || !profileForm) return
    const updated = {
      ...account,
      ownerName: profileForm.ownerName.trim(),
      email: profileForm.email.trim().toLowerCase(),
      contactNumber: profileForm.contactNumber.trim(),
      turf: {
        ...account.turf,
        name: profileForm.turf.name.trim(),
        area: profileForm.turf.area.trim(),
        address: profileForm.turf.address.trim(),
        sports: profileForm.turf.sports,
        hourlyRate: Number(profileForm.turf.hourlyRate)
      }
    }
    if (!updated.turf.sports.length) { notify('Select at least one game for your turf.'); return }
    if (session?.backend) {
      try {
        const result = await ownerApi('/api/owner/content/sports', { method: 'PUT', body: { sports: updated.turf.sports } })
        updated.turf.sports = result || updated.turf.sports
        setPublishedSports(updated.turf.sports)
      } catch (error) { notify(`Profile was not saved: ${error.message}`); return }
    }
    setAccounts(previous => previous.map(item => item.id === account.id ? updated : item))
    notify(session?.backend ? 'Profile details saved in this browser; game selections were published to customers.' : 'Your owner and turf profile has been updated in this browser.')
  }

  if (!account) {
    return <AuthScreen accounts={accounts} onAccounts={setAccounts} onSignIn={signIn} />
  }

  const filteredBookings = myBookings
    .filter(item => bookingFilter === 'All' || item.status === bookingFilter)
    .filter(item => {
      const query = search.trim().toLowerCase()
      return !query || `${item.customer} ${item.email} ${item.id} ${item.sport}`.toLowerCase().includes(query)
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start))

  const ownerLabel = account.ownerName || 'Turf Owner'
  const currentNav = page === 'terms' ? 'Terms & Conditions' : (navItems.find(item => item.id === page)?.label || 'Overview')

  return (
    <div className="owner-app">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(value => !value)} aria-label="Open navigation"><Menu size={20} /></button>
        <button className="brand" onClick={() => setPage('overview')}>
          <span className="brand-mark"><Trophy size={20} /></span>
          <span>SportiLand<span className="brand-dot">.</span><small>OWNER WORKSPACE</small></span>
        </button>
        <div className="topbar-actions">
          <span className="environment-pill"><i /> {session?.backend ? 'SHARED PUBLISHING' : 'DEMO WORKSPACE'}</span>
          <button type="button" className="owner-notification-button" onClick={() => setPage('bookings')} aria-label={`${pendingBookings.length} pending booking notifications`} title="Online booking requests">
            <BellRing size={18}/><span>Notifications</span>{pendingBookings.length > 0 && <b>{pendingBookings.length > 99 ? '99+' : pendingBookings.length}</b>}
          </button>
          <div className="dropdown owner-account-dropdown">
            <button className="profile-chip dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="avatar">{ownerLabel.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>
              <span className="profile-chip-text"><strong>{ownerLabel}</strong><small>{turf?.name}</small></span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><button className="dropdown-item" type="button" onClick={() => setPage('profile')}>Turf profile</button></li>
              <li><button className="dropdown-item" type="button" onClick={() => setPage('showcase')}>Showcase & games</button></li>
              <li><button className="dropdown-item" type="button" onClick={() => setPage('events')}>Events & treks</button></li>
              <li><button className="dropdown-item" type="button" onClick={() => { setPage('terms'); window.scrollTo(0, 0) }}><FileText size={15} className="me-2" />Terms & Conditions</button></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item text-danger" type="button" onClick={logout}>Sign out</button></li>
            </ul>
          </div>
        </div>
      </header>

      <div className="owner-layout">
        <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
          <div className="workspace-label">OWNER WORKSPACE</div>
          <div className="turf-mini-card">
            <span className="turf-mini-photo"><img src={turf?.photoUrl || '/assets/venues/jaypal-sports-center.webp'} alt={turf?.name || 'Turf'} onError={event => { event.currentTarget.style.display = 'none' }} /></span>
            <span><strong>{turf?.name}</strong><small>{turf?.area || 'Location not set'}</small></span>
            <span className="owner-lock"><ShieldCheck size={15} /></span>
          </div>
          <div className="nav-caption">MANAGE YOUR TURF</div>
          <nav>
            {navItems.map(item => {
              const Icon = item.icon
              return <button key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false); window.scrollTo(0, 0) }}>
                <Icon size={18} /><span>{item.label}</span>
                {item.id === 'bookings' && pendingBookings.length > 0 && <b className="nav-count">{pendingBookings.length}</b>}
              </button>
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card"><CircleHelp size={18} /><strong>Need a hand?</strong><p>{session?.backend ? 'Your published games and media are shared with customers.' : 'Sample data is stored in this browser. Connect a backend owner account to publish content.'}</p><button onClick={() => setPage('showcase')}>Manage showcase <ArrowRight size={14} /></button></div>
            <button className="nav-link logout-link" onClick={logout}><LogOut size={18} /><span>Log out</span></button>
            <div className="sidebar-foot">SportiLand · OWNER WORKSPACE</div>
          </div>
        </aside>

        <main className="main-content">
          <div className="breadcrumb"><span>SportiLand</span><span>/</span><strong>{currentNav}</strong></div>
          {page === 'overview' && <OwnerAnnouncementMarquee turf={turf} />}
          {page === 'overview' && <Overview
            account={account} turf={turf} bookings={myBookings} slots={mySlots}
            todayBookings={todayBookings} pendingBookings={pendingBookings}
            confirmedBookings={confirmedBookings} paidRevenue={paidRevenue}
            pendingRevenue={pendingRevenue} selectedDate={selectedDate}
            onDateChange={setSelectedDate} onNavigate={setPage}
            onNotify={notify} onBookingUpdate={updateBooking}
          />}
          {page === 'availability' && <Availability
            selectedDate={selectedDate} onDateChange={setSelectedDate}
            slots={mySlots} bookings={myBookings} onAdd={openNewSlot} onEdit={openEditSlot}
            onStatusChange={changeSlotStatus} onWalkIn={openWalkInBooking} mode={calendarMode}
            onModeChange={setCalendarMode} slotForm={slotForm}
            setSlotForm={setSlotForm} editing={editSlot}
            onSave={saveSlot} onCancelEdit={() => setEditSlot(null)}
            error={slotError} turf={turf}
          />}
          {page === 'scanner' && <BookingQrScanner onCheckIn={markDemoCheckIn} checkedInPasses={checkedInPasses} turf={turf} />}
          {page === 'bookings' && <Bookings
            bookings={filteredBookings} filter={bookingFilter}
            onFilter={setBookingFilter} search={search} onSearch={setSearch}
            onUpdate={updateBooking}
          />}
          {page === 'revenue' && <Revenue bookings={myBookings} paid={paidRevenue} pending={pendingRevenue} />}
          {page === 'events' && <OwnerEventsPage events={myEvents} onCreate={createOwnerEvent} onNotify={notify} />}
          {page === 'showcase' && <ShowcasePage
            turf={turf} sports={publishedSports.length ? publishedSports : (turf?.sports || [])}
            media={publishedMedia} loading={contentLoading} error={contentError}
            live={Boolean(session?.backend)} onSaveGames={saveGames}
            onUpload={uploadShowcaseFiles} onDelete={removeShowcaseMedia}
          />}
          {page === 'profile' && <Profile
            profile={profileForm || { ...account, turf: { ...account.turf } }}
            onChange={setProfileForm} onSave={saveProfile}
            onNotify={notify}
          />}
          {page === 'terms' && <OwnerTermsConditionsPage />}
          <footer className="main-footer"><span>© {new Date().getFullYear()} SportiLand</span><span>Owner workspace · {session?.backend ? 'Shared content publishing active' : 'Browser demo data'}</span></footer>
        </main>
      </div>
      {walkInSlot && <WalkInBookingModal slot={walkInSlot} form={walkInForm} setForm={setWalkInForm} error={walkInError} onClose={() => setWalkInSlot(null)} onSubmit={saveWalkInBooking} />}
      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function OwnerTermsConditionsPage() {
  return <div className="owner-terms-page" id="terms-and-conditions">
    <PageHeading eyebrow="SPORTILAND POLICIES" title="Terms & Conditions" description="The rain and weather refund rules applied to customer bookings at SportiLand venues." />
    <article className="owner-terms-card">
      <span className="owner-terms-kicker">SPORTILAND · BOOKING POLICY</span>
      <h2>Rain & Weather Refund Policy</h2>
      <p>At SportiLand, we understand that weather conditions can sometimes affect scheduled sports activities. To ensure fairness for both customers and turf owners, the following refund policy applies to bookings affected by rainfall.</p>
      <section><h3>1. Non-Roofed Turfs</h3><ul><li>If it rains during the scheduled booking and the non-roofed turf becomes unsuitable for playing, the customer will be eligible for a <strong>50% refund of the booking amount</strong>.</li><li>The remaining 50% will be retained to cover operational costs and the reservation of the facility.</li><li>Refund eligibility applies only when rainfall genuinely affects the usability of the turf.</li></ul></section>
      <section><h3>2. Roofed / Covered Turfs</h3><ul><li>Bookings made at roofed or covered turfs are <strong>not eligible for a rain-related refund</strong>.</li><li>Since these facilities provide protection from rainfall, bookings will remain valid even during rainy weather.</li><li>Customers are expected to proceed with their scheduled booking unless the turf owner declares the facility unsafe or unavailable.</li></ul></section>
      <section><h3>3. Rain Before the Booking Time</h3><ul><li>If rain occurs before the scheduled booking, the turf owner will assess the ground conditions.</li><li>If a non-roofed turf is declared unsuitable for playing, the customer will be eligible for a 50% refund.</li><li>If the turf remains playable, the booking will proceed as scheduled.</li></ul></section>
      <section><h3>4. Rain During the Booking</h3><ul><li>If rainfall begins during an active booking and makes a non-roofed turf unplayable, the customer will be eligible for a 50% refund of the total booking amount.</li><li>If the rain does not affect the playing conditions, no refund will be applicable.</li></ul></section>
      <section><h3>5. Refund Processing</h3><ul><li>Eligible refunds will be processed through the original payment method wherever possible.</li><li>Refund processing time may vary depending on the payment provider or bank.</li><li>Customers may be required to contact customer support or the turf owner to initiate a refund request.</li></ul></section>
      <section><h3>6. Verification and Final Decision</h3><ul><li>Rain-related refund claims must be verified by the respective turf owner or SportiLand administration.</li><li>Refunds will only be approved when weather conditions genuinely prevent the customer from using the facility.</li><li>SportiLand reserves the right to review and resolve refund disputes based on the booking details and confirmation from the turf owner.</li></ul></section>
      <section><h3>7. Customer Agreement</h3><p>By completing a booking on SportiLand, customers acknowledge and agree to this Rain & Weather Refund Policy.</p></section>
      <aside className="owner-terms-important"><strong>Important:</strong> A 50% refund applies to eligible rain-affected bookings at non-roofed turfs only. Roofed or covered turf bookings are not eligible for refunds solely due to rainfall.</aside>
      <p className="owner-terms-footnote">Venue roofing information is shown in booking details. Where the roof type has not been confirmed by the venue, SportiLand displays “Not confirmed” and the rain-refund percentage remains pending confirmation.</p>
    </article>
  </div>
}

function AuthScreen({ accounts, onAccounts, onSignIn }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ ownerName: '', turfName: '', contactNumber: '', email: '', password: '', area: '', address: '', sport: 'Football' })
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    const name = form.ownerName.trim()
    const password = form.password
    if (mode === 'login') {
      const demoMatch = DEMO_MODE ? accounts.find(item => item.id === demoOwner.id && item.ownerName.toLowerCase() === name.toLowerCase() && item.password === password) : null
      if (demoMatch) { onSignIn(demoMatch, false); return }
      try {
        const result = await backendOwnerLogin(name, password)
        const backendOwner = mapBackendOwner(result.user, result.turf, form)
        onAccounts(previous => previous.some(item => item.id === backendOwner.id) ? previous.map(item => item.id === backendOwner.id ? backendOwner : item) : [...previous, backendOwner])
        onSignIn(backendOwner, true)
        return
      } catch (backendError) {
        const found = DEMO_MODE ? accounts.find(item => item.ownerName.toLowerCase() === name.toLowerCase() && item.password === password) : null
        if (found) { onSignIn(found, false); return }
        setError(`${backendError.message}. Demo login is still available below when using the demo credentials.`)
        return
      }
    }

    if (!name || !form.turfName.trim() || !form.email.trim() || !form.contactNumber.trim()) {
      setError('Complete all required owner and turf details.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!/^[+0-9\s-]{8,16}$/.test(form.contactNumber.trim())) {
      setError('Enter a valid contact number.')
      return
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }
    if (accounts.some(item => item.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setError('An owner account already uses this email address in this browser.')
      return
    }
    setLoading(true)
    try {
      const result = await backendOwnerRegister(form)
      const backendOwner = mapBackendOwner(result.user, result.turf, form)
      onAccounts(previous => [...previous, backendOwner])
      onSignIn(backendOwner, true)
    } catch (backendError) {
      if (!DEMO_MODE) {
        setError(`Registration service is unavailable. Please try again when the server is online. ${backendError.message}`)
        return
      }
      // Offline registration is available only in demo/development mode.
      const turf = {
        id: slug(form.turfName), name: form.turfName.trim(), area: form.area.trim() || 'Madurai',
        address: form.address.trim() || form.area.trim() || 'Madurai, Tamil Nadu',
        sports: [form.sport], hourlyRate: 800, contactNumber: form.contactNumber.trim(),
        photoUrl: '/assets/venue-illustrations/multisport.svg'
      }
      const owner = { id: uid('owner'), ownerName: name, email: form.email.trim().toLowerCase(), contactNumber: form.contactNumber.trim(), password, createdAt: today(), turf }
      onAccounts([...accounts, owner])
      onSignIn(owner, false)
      setError('')
      window.setTimeout(() => window.alert(`Demo account created locally. Shared publishing is unavailable because the backend registration failed: ${backendError.message}`), 100)
    } finally { setLoading(false) }
  }

  function mapBackendOwner(user, turf, formValues) {
    return {
      id: `backend-${user.id}`, backendId: user.id, ownerName: user.name || formValues.ownerName,
      email: user.email || formValues.email, contactNumber: turf.contactNumber || formValues.contactNumber,
      createdAt: today(), backend: true,
      turf: {
        id: `server-${turf.id}`, backendId: turf.id, name: turf.turfName,
        area: turf.area || formValues.area || 'Madurai', address: turf.address || formValues.address || 'Madurai, Tamil Nadu',
        sports: turf.sports?.length ? turf.sports : [formValues.sport || 'Football'],
        hourlyRate: turf.hourlyRate || 800, contactNumber: turf.contactNumber,
        photoUrl: '/assets/venue-illustrations/multisport.svg'
      }
    }
  }

  return (
    <div className="auth-screen" data-auth-mode={mode}>
      <div className="auth-left">
        <div className="auth-brand"><span className="brand-mark"><Trophy size={22} /></span><span>SportiLand<span className="brand-dot">.</span><small>OWNER WORKSPACE</small></span></div>
        <div className="auth-intro">
          <span className="eyebrow">BUILT FOR TURF OPERATORS</span>
          <h1>Your venue.<br /><em>Your schedule.</em><br />Your business.</h1>
          <p>Manage daily slots, customer bookings and venue performance from one dedicated workspace.</p>
          <div className="auth-feature-list">
            <span><CalendarDays size={17} /> Availability calendar</span>
            <span><Users size={17} /> Customer booking management</span>
            <span><Activity size={17} /> Revenue overview</span>
          </div>
          <div className="auth-sports-scene" aria-label="Sports facilities and game-day atmosphere">
            <div className="auth-sports-photo auth-sports-photo-main"><img src="/assets/venues/golazo-turf.webp" alt="Football turf" /><span>GAME DAY</span></div>
            <div className="auth-sports-photo auth-sports-photo-side"><img src="/assets/venues/cricket-box.jpg" alt="Indoor cricket facility" /><span>PLAY MORE</span></div>
            <div className="auth-sports-orbit" aria-hidden="true"><Trophy size={22}/></div>
          </div>
        </div>
        <div className="auth-left-foot">SportiLand · TURF OWNER PORTAL</div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-icon"><Building2 size={22} /></span>
            <span className="eyebrow">TURF OWNER ACCOUNT</span>
            <h2>{mode === 'login' ? 'Welcome back' : 'Register your turf'}</h2>
            <p>{mode === 'login' ? 'Sign in to manage your venue operations.' : 'Create your owner account and add your turf details.'}</p>
          </div>
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Login</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Register</button>
          </div>
          <form onSubmit={submit} className="auth-form">
            <label>Turf owner name<input value={form.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder="Enter your full name" autoComplete="username" maxLength={80} /></label>
            {mode === 'register' && <>
              <label>Turf name<input value={form.turfName} onChange={e => update('turfName', e.target.value)} placeholder="e.g. Jaypal Sports Center" maxLength={100} /></label>
              <label>Contact number<input value={form.contactNumber} onChange={e => update('contactNumber', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" maxLength={16} /></label>
              <label>Email address<input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="owner@example.com" autoComplete="email" /></label>
              <div className="form-two">
                <label>Area<input value={form.area} onChange={e => update('area', e.target.value)} placeholder="Area / locality" /></label>
                <label>Primary sport<select value={form.sport} onChange={e => update('sport', e.target.value)}><option>Football</option><option>Cricket</option><option>Badminton</option><option>Running</option><option>Pickleball</option><option>Paintball</option><option>Boxing</option></select></label>
              </div>
              <label>Venue address<input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street, locality, city" /></label>
            </>}
            <label>Password<span className="password-input"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (8+ characters)'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button full-button" type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in to owner portal' : 'Create owner account'}<ArrowRight size={17} /></button>
          </form>
          {mode === 'login' && DEMO_MODE && <div className="demo-credentials"><strong>Demo owner credentials</strong><span>Owner name: Demo Owner</span><span>Password: Owner@123</span></div>}
          <p className="auth-disclaimer">Backend owner accounts can publish games, photos and videos to the customer site. Demo credentials remain browser-only.</p>
        </div>
      </div>
    </div>
  )
}

function BookingQrScanner({ onCheckIn, checkedInPasses, turf }) {
  const [scanVersion, setScanVersion] = useState(0)
  const [pass, setPass] = useState(null)
  const [manualValue, setManualValue] = useState('')
  const [error, setError] = useState('')
  const alreadyCheckedIn = pass && checkedInPasses.some(item => item.token === pass.token)
  const normalizeVenue = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const venueMatches = pass && normalizeVenue(pass.venue) === normalizeVenue(turf?.name)
  const cancelledPass = pass && /cancel|reject/i.test(String(pass.bookingStatus || ''))
  const canCheckIn = Boolean(pass && !alreadyCheckedIn && venueMatches && !cancelledPass)

  useEffect(() => {
    if (pass) return undefined
    let active = true
    let scanner
    const timer = window.setTimeout(() => {
      if (!active) return
      try {
        scanner = new Html5QrcodeScanner('sportiland-booking-qr-reader', {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1,
          rememberLastUsedCamera: true
        }, false)
        scanner.render(decodedText => {
          if (!active) return
          try {
            const data = JSON.parse(decodedText)
            validateSportiLandPass(data)
            setPass(data)
            setError('')
            scanner?.clear().catch(() => {})
          } catch (scanError) {
            setError(scanError.message || 'This QR code is not a recognised SportiLand booking pass.')
          }
        }, () => {})
      } catch (scannerError) {
        setError('Camera scanner could not start. Use the paste field below to test a booking pass.')
      }
    }, 100)
    return () => {
      active = false
      window.clearTimeout(timer)
      if (scanner) scanner.clear().catch(() => {})
    }
  }, [scanVersion, pass])

  function readManualPass(event) {
    event.preventDefault()
    try {
      const data = JSON.parse(manualValue)
      validateSportiLandPass(data)
      setPass(data)
      setError('')
    } catch (scanError) {
      setError(scanError.message || 'Paste the complete SportiLand QR data.')
    }
  }

  function resetScanner() {
    setPass(null)
    setManualValue('')
    setError('')
    setScanVersion(value => value + 1)
  }

  return <>
    <PageHeading eyebrow="VENUE CHECK-IN" title="Scan booking QR" description="Read a customer's SportiLand pass before they enter the court." action={<span className="count-pill"><ScanLine size={14}/> QR check-in</span>} />
    <div className="ff-scanner-demo-alert"><AlertTriangle size={17}/><span><strong>Frontend demo only</strong><small>This screen reads the QR data in the browser. It cannot confirm a live booking, payment or owner allocation until a shared backend is connected.</small></span></div>
    <div className="ff-scanner-layout">
      <section className="panel ff-scanner-panel">
        <div className="panel-heading"><div><h3><QrCode size={18}/> Booking pass scanner</h3><p>Allow camera access and hold the QR code inside the frame.</p></div><span className="ff-scanner-live-dot">CAMERA</span></div>
        {!pass && <div id="sportiland-booking-qr-reader" className="ff-qr-reader" />}
        {!pass && <div className="ff-scanner-help"><Camera size={16}/><span>Camera access works on localhost or an HTTPS deployment. On a phone, use the rear camera for clearer scans.</span></div>}
        {error && <div className="ff-scanner-error">{error}</div>}
        <div className="ff-scanner-manual"><strong>Test without a camera</strong><p>Paste the QR contents from a SportiLand pass to preview the owner verification screen.</p><form onSubmit={readManualPass}><textarea value={manualValue} onChange={event => setManualValue(event.target.value)} rows={3} placeholder='Paste QR JSON data here…'/><button type="submit" className="primary-button"><ScanLine size={15}/> Read pass data</button></form></div>
      </section>
      <section className="panel ff-pass-result-panel">
        {pass ? <>
          <div className={`ff-pass-result-state ${alreadyCheckedIn || !venueMatches || cancelledPass ? 'used' : 'read'}`}><CheckCircle2 size={20}/><div><strong>{alreadyCheckedIn ? 'Already checked in on this browser' : !venueMatches ? 'This pass is for a different venue' : cancelledPass ? 'This booking is cancelled or rejected' : 'QR pass successfully read'}</strong><small>{alreadyCheckedIn ? 'This demo pass token was previously used here.' : !venueMatches ? `Pass venue: ${pass.venue || 'Not provided'}. Current venue: ${turf?.name || 'Not set'}.` : cancelledPass ? 'Do not check in a cancelled or rejected booking.' : 'The pass venue matches. Check the booking and payment details with the customer.'}</small></div></div>
          <div className="ff-pass-result-head"><span>BOOKING REFERENCE</span><strong>{pass.bookingId}</strong></div>
          <div className="ff-pass-result-grid">
            <div><small>CUSTOMER</small><strong>{pass.customer}</strong></div>
            <div><small>VENUE</small><strong>{pass.venue}</strong></div>
            <div><small>SPORT</small><strong>{pass.sport}</strong></div>
            <div><small>DATE</small><strong>{formatDate(pass.date)}</strong></div>
            <div><small>TIME</small><strong>{timeLabel(pass.time)}</strong></div>
            <div><small>DURATION</small><strong>{pass.durationHours} hour(s)</strong></div>
            <div><small>BOOKING AMOUNT</small><strong>{money(pass.amount)}</strong></div>
            <div><small>PAYMENT STATUS</small><strong>{pass.paymentStatus}</strong></div>
            <div><small>BOOKING STATUS</small><strong>{pass.bookingStatus}</strong></div>
          </div>
          <div className="ff-pass-token-display"><small>PASS TOKEN</small><code>{pass.token}</code></div>
          {!venueMatches && <div className="ff-pass-used-note">Venue mismatch: this QR pass should only be presented at the venue printed on the pass.</div>}
          {cancelledPass && <div className="ff-pass-used-note">This booking is marked {pass.bookingStatus}. Check-in is disabled for this pass.</div>}
          {alreadyCheckedIn ? <div className="ff-pass-used-note">This token is already marked as checked in in this browser's local demo history.</div> : canCheckIn ? <button className="primary-button ff-checkin-button" onClick={() => onCheckIn(pass)}><CheckCircle2 size={16}/> Mark checked in (demo)</button> : null}
          <button type="button" className="outline-button full-button" onClick={resetScanner}><RotateCcw size={15}/> Scan another pass</button>
        </> : <div className="ff-pass-empty"><span><QrCode size={28}/></span><h3>Waiting for a booking pass</h3><p>When a customer shows their QR code, the booking details will appear here.</p><div className="ff-pass-empty-mini"><span>Customer name</span><span>Booking ID</span><span>Slot & payment info</span></div></div>}
        <div className="ff-scanner-venue-label"><ShieldCheck size={14}/> {turf?.name || 'Your turf'} · Demo verification</div>
      </section>
    </div>
  </>
}

function validateSportiLandPass(data) {
  if (!data || data.type !== 'SPORTILAND_BOOKING_PASS' || data.version !== 1) throw new Error('This is not a SportiLand booking QR.')
  // Keep these field names aligned with Customer V8 BookingPassModal.
  const required = ['bookingId', 'token', 'customer', 'venue', 'sport', 'date', 'time', 'durationHours', 'amount', 'paymentStatus', 'bookingStatus']
  const missing = required.filter(key => data[key] === undefined || data[key] === null || data[key] === '')
  if (missing.length) throw new Error(`QR pass is missing required details: ${missing.join(', ')}.`)
  if (!Number.isFinite(Number(data.durationHours)) || !Number.isFinite(Number(data.amount))) throw new Error('The QR pass has invalid duration or amount details.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date)) || !/^\d{2}:\d{2}$/.test(String(data.time))) throw new Error('The QR pass contains an invalid date or time.')
  return true
}

function PageHeading({ eyebrow = 'OWNER WORKSPACE', title, description, action, className = '' }) {
  return <div className={`page-heading ${className}`.trim()}><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>
}

function StatCard({ label, value, change, icon: Icon, tone = 'green' }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={19} /></span></div><div className="stat-value">{value}</div><div className="stat-change">{change}</div></div>
}

function Status({ value }) {
  const cls = value === 'Confirmed' || value === 'Paid' || value === 'Available' ? 'green' : value === 'Rejected' || value === 'Blocked' ? 'red' : 'amber'
  return <span className={`status ${cls}`}><i />{value}</span>
}

function Overview({ account, turf, bookings, slots, todayBookings, pendingBookings, confirmedBookings, paidRevenue, pendingRevenue, selectedDate, onDateChange, onNavigate, onNotify, onBookingUpdate }) {
  const todaysSlots = slots.filter(item => item.date === selectedDate).sort((a, b) => a.start.localeCompare(b.start))
  const recent = [...bookings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  return <>
    <PageHeading eyebrow="TURF OWNER DASHBOARD" title={`Welcome back, ${account.ownerName.split(' ')[0]}`} description="Here is what is happening at your venue." action={<span className="live-indicator"><i /> OWNER WORKSPACE</span>} />
    <div className="owner-venue-banner">
      <div className="owner-venue-copy"><p className="eyebrow">YOUR REGISTERED TURF</p><h2>{turf.name}</h2><p className="venue-address"><MapPin size={15} />{turf.area}{turf.address ? ` · ${turf.address}` : ''}</p><div className="banner-tags">{(turf.sports || []).map(sport => <span key={sport}>{sport}</span>)}</div></div>
      <div className="owner-venue-photo"><img src={turf.photoUrl || '/assets/venues/jaypal-sports-center.webp'} alt={`${turf.name} venue`} onError={event => { event.currentTarget.src = '/assets/venues/jaypal-sports-center.webp' }} /><span>VENUE PREVIEW</span></div>
    </div>
    <div className="stats-grid">
      <StatCard label="Total bookings" value={bookings.length} change="All time in this demo" icon={CalendarCheck} />
      <StatCard label="Pending requests" value={pendingBookings.length} change="Need your response" icon={Clock3} tone="amber" />
      <StatCard label="Confirmed bookings" value={confirmedBookings.length} change="Accepted reservations" icon={CheckCircle2} />
      <StatCard label="Paid revenue" value={money(paidRevenue)} change={`${money(pendingRevenue)} pending`} icon={Wallet} />
    </div>
    <div className="dashboard-grid">
      <section className="panel">
        <div className="panel-heading"><div><h3>Daily schedule</h3><p>Review the slots for your selected date.</p></div><button className="text-link" onClick={() => onNavigate('availability')}>Full calendar <ArrowRight size={14} /></button></div>
        <div className="inline-date"><Calendar size={16} /><CustomDateField compact value={selectedDate} onChange={onDateChange} ariaLabel="Choose overview date" /></div>
        {todaysSlots.length ? <div className="mini-slot-list">{todaysSlots.slice(0, 6).map(slot => <div key={slot.id}><span className="mini-time">{timeLabel(slot.start)}</span><span className="mini-slot-main"><strong>{slot.status === 'Booked' ? slot.customer || 'Booked slot' : `${slot.duration} min slot`}</strong><small>{slot.duration} min · {money((slot.duration / 60) * slot.pricePerHour)}</small></span><Status value={slot.status} /></div>)}</div> : <EmptyState title="No slots for this date" detail="Add availability to start taking bookings." action={() => onNavigate('availability')} actionLabel="Manage availability" />}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h3>Booking requests</h3><p>Requests waiting for your decision.</p></div><span className="count-pill">{pendingBookings.length} pending</span></div>
        {pendingBookings.slice(0, 4).length ? <div className="request-list">{pendingBookings.slice(0, 4).map(booking => <div className="request-item" key={booking.id}><span className="request-avatar">{booking.customer.split(' ').map(s => s[0]).slice(0, 2).join('')}</span><span className="request-main"><strong>{booking.customer}</strong><small>{formatDate(booking.date)} · {timeLabel(booking.start)} · {booking.duration} min</small></span><span className="request-actions"><button title="Confirm" onClick={() => onBookingUpdate(booking.id, 'Confirmed')}><Check size={15} /></button><button title="Reject" onClick={() => onBookingUpdate(booking.id, 'Rejected')}><X size={15} /></button></span></div>)}</div> : <EmptyState title="You're all caught up" detail="New booking requests will appear here." />}
        <button className="outline-button full-button" onClick={() => onNavigate('bookings')}>View all bookings <ArrowRight size={15} /></button>
      </section>
    </div>
    <section className="panel">
      <div className="panel-heading"><div><h3>Recent bookings</h3><p>Latest activity for {turf.name}.</p></div><button className="text-link" onClick={() => onNavigate('bookings')}>View history <ArrowRight size={14} /></button></div>
      <BookingTable bookings={recent} compact />
    </section>
  </>
}

function EmptyState({ title, detail, action, actionLabel }) {
  return <div className="empty-state"><span><CalendarDays size={22} /></span><strong>{title}</strong><p>{detail}</p>{action && <button className="text-link" onClick={action}>{actionLabel || 'Continue'} <ArrowRight size={14} /></button>}</div>
}

function Availability({ selectedDate, onDateChange, slots, bookings, onAdd, onEdit, onStatusChange, onWalkIn, mode, onModeChange, slotForm, setSlotForm, editing, onSave, onCancelEdit, error, turf }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index))
  const daily = slots.filter(item => item.date === selectedDate).sort((a, b) => a.start.localeCompare(b.start))
  const slotForDate = date => slots.filter(item => item.date === date).sort((a, b) => a.start.localeCompare(b.start))
  const updateForm = (key, value) => setSlotForm(previous => ({ ...previous, [key]: value }))
  return <>
    <PageHeading className="availability-page-heading" eyebrow="VENUE OPERATIONS" title="Slot availability" description="Build your daily schedule, set rates and keep unavailable times blocked." action={<button className="primary-button" onClick={onAdd}><Plus size={17} /> Add slot</button>} />
    <div className="calendar-toolbar panel">
      <div className="date-nav"><button className="icon-button" onClick={() => onDateChange(addDays(selectedDate, mode === 'weekly' ? -7 : -1))}><ChevronLeft size={18} /></button><div><strong>{formatDate(selectedDate)}</strong><small>{mode === 'weekly' ? 'Weekly view starting from selected date' : 'Daily availability'}</small></div><button className="icon-button" onClick={() => onDateChange(addDays(selectedDate, mode === 'weekly' ? 7 : 1))}><ChevronRight size={18} /></button><button className="today-button" onClick={() => onDateChange(today())}>Today</button></div>
      <div className="calendar-controls"><div className="date-input"><Calendar size={15} /><CustomDateField compact value={selectedDate} onChange={onDateChange} ariaLabel="Choose availability date" /></div><div className="segmented"><button className={mode === 'daily' ? 'active' : ''} onClick={() => onModeChange('daily')}>Daily</button><button className={mode === 'weekly' ? 'active' : ''} onClick={() => onModeChange('weekly')}>Weekly</button></div></div>
    </div>
    {editing !== null && <form className="slot-editor panel" onSubmit={onSave}>
      <div className="slot-editor-heading"><div><h3>{editing && editing !== 'new' ? 'Edit availability slot' : 'Add new availability'}</h3><p>Set start time, duration and your hourly rate.</p></div><button type="button" className="icon-button" onClick={onCancelEdit}><X size={18} /></button></div>
      <div className="slot-editor-grid">
        <div className="slot-picker-field"><span>Date</span><CustomDateField value={slotForm.date} onChange={value => updateForm('date', value)} /></div>
        <div className="slot-picker-field"><span>Start time</span><CustomTimeField value={slotForm.start} onChange={value => updateForm('start', value)} /></div>
        <label>Duration<select value={slotForm.duration} onChange={e => updateForm('duration', Number(e.target.value))}><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option><option value={150}>2.5 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option></select></label>
        <label>Price per hour (₹)<input type="number" min="1" step="50" value={slotForm.pricePerHour} onChange={e => updateForm('pricePerHour', e.target.value)} required /></label>
      </div>
      <div className="slot-price-preview"><span>Customer price for this slot</span><strong>{money((Number(slotForm.duration) / 60) * Number(slotForm.pricePerHour || 0))}</strong></div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button type="button" className="outline-button" onClick={onCancelEdit}>Cancel</button><button className="primary-button" type="submit"><Save size={16} /> {editing && editing !== 'new' ? 'Save changes' : 'Add slot'}</button></div>
    </form>}
    {mode === 'daily' ? <section className="panel calendar-section"><div className="panel-heading"><div><h3>{dayName(selectedDate)}, {formatDate(selectedDate)}</h3><p>{daily.length} slots configured</p></div><span className="count-pill">{daily.filter(s => s.status === 'Available').length} available</span></div>
      {daily.length ? <div className="availability-grid">{daily.map(slot => <SlotCard key={slot.id} slot={slot} booking={bookings.find(item => item.id === slot.bookingId)} onEdit={onEdit} onStatusChange={onStatusChange} onWalkIn={onWalkIn} />)}</div> : <EmptyState title="No slots added for this date" detail="Create an availability slot to let customers request this time." action={onAdd} actionLabel="Add first slot" />}
    </section> : <section className="weekly-grid">{days.map(date => {
      const daySlots = slotForDate(date)
      return <div className={`week-day ${date === selectedDate ? 'selected' : ''}`} key={date}><button className="week-day-head" onClick={() => onDateChange(date)}><span>{dayName(date)}</span><strong>{date.slice(-2)}</strong><small>{daySlots.length} slots</small></button><div className="week-day-slots">{daySlots.length ? daySlots.map(slot => <div className={`week-slot ${slot.status.toLowerCase()}`} key={slot.id}><strong>{timeLabel(slot.start)}</strong><span>{slot.duration}m</span><Status value={slot.status} /><div className="week-slot-actions"><button title="Edit slot" disabled={slot.status === 'Booked'} onClick={() => { onDateChange(date); onEdit(slot); onModeChange('daily') }}><Edit3 size={13} /></button>{slot.status === 'Available' && <button title="Book in person" onClick={() => onWalkIn(slot)}><UserCheck size={13}/></button>}{slot.status === 'Available' && <button title="Block slot" onClick={() => onStatusChange(slot, 'Blocked')}><Ban size={13}/></button>}{slot.status === 'Blocked' && <button title="Reopen slot" onClick={() => onStatusChange(slot, 'Available')}><Check size={13}/></button>}</div></div>) : <small className="no-slots">No slots</small>}</div><button className="add-day-slot" onClick={() => { onDateChange(date); onAdd() }}><Plus size={13} /> Add slot</button></div>
    })}</section>}
    <div className="legend-row"><span><i className="dot available" />Available</span><span><i className="dot booked" />Booked</span><span><i className="dot blocked" />Blocked</span></div>
    <p className="demo-footnote">Demo calendar: changes are saved in this browser only. They are not yet synchronized with the Customer Web App.</p>
  </>
}

function SlotCard({ slot, booking, onEdit, onStatusChange, onWalkIn }) {
  const end = plusMinutes(slot.start, slot.duration)
  const total = Math.round((Number(slot.duration) / 60) * Number(slot.pricePerHour))
  const received = booking ? paidAmount(booking) : Number(slot.amountPaid || 0)
  return <article className={`slot-card ${slot.status.toLowerCase()}`}>
    <div className="slot-card-top"><span className="slot-time">{timeLabel(slot.start)}</span><Status value={slot.status} /></div>
    <strong className="slot-range">{timeLabel(slot.start)} – {timeLabel(end)}</strong>
    <span className="slot-sub">{slot.duration} minute slot · {money(total)}</span>
    {slot.status === 'Booked' ? <div className="slot-booked-details">
      <div className="slot-booked"><Users size={15} /><span><strong>{booking?.customer || slot.customer || 'Customer booking'}</strong><small>{booking?.id || slot.bookingId || 'Booking record'} · {booking?.source || slot.bookingSource || 'Online'}</small></span></div>
      <div className="slot-customer-facts"><span><small>Contact</small><strong>{booking?.phone || slot.customerPhone || 'Not provided'}</strong></span><span><small>Amount paid</small><strong>{money(received)} / {money(booking?.amount ?? total)}</strong></span><span><small>Payment</small><strong>{booking?.payment || (received >= total ? 'Paid' : received > 0 ? 'Partial' : 'Pending')}</strong></span></div>
      {booking?.email && <small className="slot-customer-email">{booking.email}</small>}
      {booking?.notes && <small className="slot-customer-email">Note: {booking.notes}</small>}
    </div> : <div className="slot-actions">
      <button onClick={() => onEdit(slot)}><Edit3 size={14} /> Edit</button>
      {slot.status === 'Blocked' ? <button onClick={() => onStatusChange(slot, 'Available')}><Check size={14} /> Reopen</button> : <>
        <button className="walkin-action" onClick={() => onWalkIn(slot)}><UserCheck size={14} /> Book in person</button>
        <button className="block-action" onClick={() => onStatusChange(slot, 'Blocked')}><Ban size={14} /> Block</button>
      </>}
    </div>}
  </article>
}

function WalkInBookingModal({ slot, form, setForm, error, onClose, onSubmit }) {
  const total = Math.round((Number(slot.duration) / 60) * Number(slot.pricePerHour))
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="owner-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="owner-modal walkin-modal" role="dialog" aria-modal="true" aria-labelledby="walkin-title">
      <div className="owner-modal-heading"><div><span className="eyebrow">OFFLINE / COUNTER BOOKING</span><h2 id="walkin-title">Book this slot in person</h2><p>{formatDate(slot.date)} · {timeLabel(slot.start)} – {timeLabel(plusMinutes(slot.start, slot.duration))}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
      <div className="walkin-price-strip"><span>Booking total</span><strong>{money(total)}</strong><small>Slot will be marked as booked after saving.</small></div>
      <form onSubmit={onSubmit} className="walkin-form">
        <label>Customer name<input autoFocus value={form.customer} onChange={event => update('customer', event.target.value)} placeholder="Enter customer name" required maxLength={80}/></label>
        <div className="walkin-form-grid"><label>Mobile number<input value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="10-digit phone number" required inputMode="tel" maxLength={16}/></label><label>Email (optional)<input type="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="customer@example.com"/></label></div>
        <label>Amount received (₹)<input type="number" min="0" max={total} step="1" value={form.amountPaid} onChange={event => update('amountPaid', event.target.value)} required/><small>Enter the amount collected now. The remaining amount will be tracked as pending.</small></label>
        <label>Booking note (optional)<textarea rows="2" value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Any special notes for this booking" maxLength={250}/></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><CheckCircle2 size={16}/> Confirm in-person booking</button></div>
      </form>
    </section>
  </div>
}

function Bookings({ bookings, filter, onFilter, search, onSearch, onUpdate }) {
  const filters = ['All', 'Pending', 'Confirmed', 'Rejected']
  return <>
    <PageHeading eyebrow="CUSTOMER MANAGEMENT" title="Bookings" description="Online customer requests refresh automatically. Review customer contacts, slot details and confirmations here." action={<span className="count-pill">{bookings.length} records</span>} />
    <div className="booking-toolbar panel"><div className="search-field"><Search size={17} /><input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search customer, email or booking ID" /></div><div className="filter-chips">{filters.map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => onFilter(value)}>{value}</button>)}</div></div>
    <section className="panel table-panel"><div className="panel-heading"><div><h3>Booking requests & history</h3><p>Customer details, date, duration, amount and payment status.</p></div><Download size={18} className="muted-icon" /></div><BookingTable bookings={bookings} onUpdate={onUpdate} /></section>
  </>
}

function BookingTable({ bookings, onUpdate, compact = false }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>BOOKING</th><th>SOURCE</th><th>CUSTOMER</th><th>DATE & TIME</th><th>DURATION</th><th>AMOUNT</th><th>PAYMENT</th><th>STATUS</th>{!compact && <th>ACTION</th>}</tr></thead><tbody>
    {bookings.length ? bookings.map(item => <tr key={item.id}><td><strong className="booking-id">{item.id}</strong><small>{item.sport}</small></td><td><Status value={item.source || 'Online'} /></td><td><strong>{item.customer}</strong><small>{item.email}{item.phone ? ` · ${item.phone}` : ''}</small></td><td><strong>{formatDate(item.date)}</strong><small>{timeLabel(item.start)}</small></td><td>{item.duration} min</td><td><strong>{money(item.amount)}</strong><small>{money(paidAmount(item))} received</small></td><td><Status value={item.payment} /></td><td><Status value={item.status} /></td>{!compact && <td>{item.status === 'Pending' ? <div className="table-actions"><button className="accept-button" onClick={() => onUpdate(item.id, 'Confirmed')} title="Confirm"><Check size={15} /></button><button className="reject-button" onClick={() => onUpdate(item.id, 'Rejected')} title="Reject"><X size={15} /></button></div> : <span className="muted-cell">—</span>}</td>}</tr>) : <tr><td colSpan={compact ? 8 : 9} className="empty-cell">No bookings match your filters.</td></tr>}
  </tbody></table></div>
}


function RevenueLineChart({ buckets, axisValues, axisMax, money, formatValue, period }) {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, buckets.length - 1))
  useEffect(() => { setSelectedIndex(Math.max(0, buckets.length - 1)) }, [period, buckets.length])
  const width = 1000
  const height = 420
  const plot = { left: 92, right: 940, top: 48, bottom: 326 }
  const safeMax = Math.max(1, axisMax)
  const span = Math.max(1, buckets.length - 1)
  const points = buckets.map((bucket, index) => ({
    x: plot.left + ((plot.right - plot.left) * index / span),
    y: plot.bottom - (Math.max(0, bucket.value) / safeMax) * (plot.bottom - plot.top),
    ...bucket
  }))
  const activeIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, points.length - 1))
  const active = points[activeIndex]
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const dx = point.x - previous.x
    return `${path} C ${previous.x + dx * .42} ${previous.y}, ${point.x - dx * .42} ${point.y}, ${point.x} ${point.y}`
  }, '')
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${plot.bottom} L ${points[0].x} ${plot.bottom} Z` : ''
  const chooseAtPointer = event => {
    if (!points.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * width
    const relative = Math.max(0, Math.min(1, (x - plot.left) / (plot.right - plot.left)))
    setSelectedIndex(Math.round(relative * span))
  }
  const chooseWithKeyboard = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    setSelectedIndex(index => event.key === 'Home' ? 0 : event.key === 'End' ? Math.max(0, buckets.length - 1) : Math.max(0, Math.min(buckets.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1))))
  }
  const dataSignature = buckets.map(bucket => `${bucket.key}:${bucket.value}:${bucket.count}`).join('|')
  const tooltipX = active ? Math.max(110, Math.min(width - 110, active.x)) : width / 2
  const tooltipY = active ? Math.max(24, active.y - 54) : 24
  const ticks = axisValues.map((value, index) => ({
    value,
    y: plot.top + ((plot.bottom - plot.top) * index / Math.max(1, axisValues.length - 1))
  }))

  return <div className="revenue-line-chart-shell" onPointerMove={chooseAtPointer} onPointerDown={chooseAtPointer} onKeyDown={chooseWithKeyboard} tabIndex={0} role="slider" aria-valuemin={0} aria-valuemax={Math.max(0, buckets.length - 1)} aria-valuenow={activeIndex} aria-valuetext={active ? `${active.tooltip}, ${money(active.value)}` : 'No data'} aria-label={`${period} paid revenue line chart. Use arrow keys or touch the chart to inspect each period.`}>
    <svg className="revenue-line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="revenue-line-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#73c9dc" stopOpacity=".28" />
          <stop offset="100%" stopColor="#73c9dc" stopOpacity=".015" />
        </linearGradient>
        <filter id="revenue-line-shadow" x="-20%" y="-30%" width="140%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#17333a" floodOpacity=".12" />
        </filter>
      </defs>
      {ticks.map((tick, index) => <g key={`tick-${index}`}>
        <line x1={plot.left} x2={plot.right} y1={tick.y} y2={tick.y} className="revenue-line-gridline" />
        <text x="22" y={tick.y + 5} className="revenue-line-axis-label">{formatValue(tick.value)}</text>
      </g>)}
      {areaPath && <path d={areaPath} fill="url(#revenue-line-area)" className="revenue-line-area" />}
      {active && <line x1={active.x} x2={active.x} y1={plot.top} y2={plot.bottom} className="revenue-line-guide" />}
      {linePath && <path key={dataSignature} d={linePath} className="revenue-line-path" filter="url(#revenue-line-shadow)" />}
      {active && <g className="revenue-line-active-point">
        <circle cx={active.x} cy={active.y} r="13" className="revenue-line-point-halo" />
        <circle cx={active.x} cy={active.y} r="6.5" className="revenue-line-point" />
        <rect x={tooltipX - 66} y={tooltipY - 24} width="132" height="34" rx="9" className="revenue-line-tooltip-bg" />
        <text x={tooltipX} y={tooltipY - 2} textAnchor="middle" className="revenue-line-tooltip-text">{money(active.value)}</text>
      </g>}
      {points.map((point, index) => <g key={point.key} className={`revenue-line-x-label ${index === activeIndex ? 'active' : ''}`}>
        <text x={point.x} y="365" textAnchor="middle" className="revenue-line-x-main">{point.label}</text>
        <text x={point.x} y="388" textAnchor="middle" className="revenue-line-x-sub">{point.subLabel}</text>
        <circle cx={point.x} cy={plot.bottom} r="18" fill="transparent" />
      </g>)}
    </svg>
    <div className="revenue-line-live-value" aria-live="polite">
      <span>{active?.tooltip || 'Selected period'}</span>
      <strong>{active ? money(active.value) : money(0)}</strong>
      <small>{active?.count || 0} paid booking{active?.count === 1 ? '' : 's'}</small>
    </div>
  </div>
}

function Revenue({ bookings, paid, pending }) {
  const [range, setRange] = useState('weekly')
  const [anchorDate, setAnchorDate] = useState(today())
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7))
  const rangeConfig = {
    daily: { subtitle: 'Daily paid booking value for the 7-day window ending on your selected date.', count: 7 },
    weekly: { subtitle: 'Daily paid booking value for the specific week you select.', count: 7 },
    monthly: { subtitle: 'Weekly paid booking value for the specific month you select.', count: 5 }
  }
  const config = rangeConfig[range]
  const toIso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const parseIso = value => new Date(`${value}T12:00:00`)
  const mondayOf = date => {
    const start = new Date(date)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return start
  }
  const shiftSelection = amount => {
    if (range === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number)
      const next = new Date(year, month - 1 + amount, 1, 12)
      setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`)
    } else {
      setAnchorDate(value => toIso(new Date(parseIso(value).getTime() + amount * (range === 'weekly' ? 7 : 1) * 86400000)))
    }
  }

  const buckets = useMemo(() => {
    let definitions = []
    if (range === 'daily') {
      const anchor = parseIso(anchorDate)
      definitions = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(anchor)
        date.setDate(date.getDate() - (6 - index))
        const iso = toIso(date)
        return { key: iso, start: iso, end: iso, label: dayName(iso), subLabel: String(date.getDate()), tooltip: formatDate(iso) }
      })
    } else if (range === 'weekly') {
      const startOfWeek = mondayOf(parseIso(anchorDate))
      definitions = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek)
        date.setDate(date.getDate() + index)
        const iso = toIso(date)
        return { key: iso, start: iso, end: iso, label: dayName(iso), subLabel: String(date.getDate()), tooltip: formatDate(iso) }
      })
    } else {
      const [year, month] = selectedMonth.split('-').map(Number)
      const firstOfMonth = new Date(year, month - 1, 1, 12)
      const lastOfMonth = new Date(year, month, 0, 12)
      const firstMonday = mondayOf(firstOfMonth)
      let week = 0
      for (let cursor = new Date(firstMonday); cursor <= lastOfMonth; cursor.setDate(cursor.getDate() + 7)) {
        const weekStart = new Date(cursor)
        const weekEnd = new Date(cursor)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const visibleStart = weekStart < firstOfMonth ? firstOfMonth : weekStart
        const visibleEnd = weekEnd > lastOfMonth ? lastOfMonth : weekEnd
        const startIso = toIso(visibleStart)
        const endIso = toIso(visibleEnd)
        week += 1
        definitions.push({
          key: `${selectedMonth}-week-${week}`,
          start: startIso,
          end: endIso,
          label: `W${week}`,
          subLabel: `${visibleStart.getDate()}–${visibleEnd.getDate()}`,
          tooltip: `${formatDate(startIso)} – ${formatDate(endIso)}`
        })
      }
    }
    return definitions.map(bucket => {
      const matching = bookings.filter(item => item.status !== 'Rejected' && item.date >= bucket.start && item.date <= bucket.end && paidAmount(item) > 0)
      return { ...bucket, value: matching.reduce((sum, item) => sum + paidAmount(item), 0), count: matching.length }
    })
  }, [bookings, range, anchorDate, selectedMonth])

  const values = buckets.map(bucket => bucket.value)
  const rangeTotal = values.reduce((sum, value) => sum + value, 0)
  const rangePaidBookings = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const totalBookings = bookings.filter(item => item.status !== 'Rejected').length
  const average = totalBookings ? bookings.filter(item => item.status !== 'Rejected').reduce((sum, item) => sum + Number(item.amount || 0), 0) / totalBookings : 0
  const peak = Math.max(...values, 0)
  const peakBucket = buckets[values.indexOf(peak)]
  const axisMax = Math.max(500, Math.ceil(peak / 500) * 500)
  const axisValues = [axisMax, Math.round(axisMax * .75), Math.round(axisMax * .5), Math.round(axisMax * .25), 0]
  const formatBarValue = value => value >= 10000 ? `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}` : money(value)
  const weekStart = mondayOf(parseIso(anchorDate))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const selectedLabel = range === 'monthly'
    ? parseIso(`${selectedMonth}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : range === 'weekly'
      ? `${formatDate(toIso(weekStart))} – ${formatDate(toIso(weekEnd))}`
      : `7 days ending ${formatDate(anchorDate)}`
  const title = range === 'monthly' ? selectedLabel : range === 'weekly' ? `Week of ${formatDate(toIso(weekStart))}` : selectedLabel
  const prev = () => shiftSelection(-1)
  const next = () => shiftSelection(1)

  return <>
    <PageHeading eyebrow="BUSINESS PERFORMANCE" title="Revenue overview" description="Explore paid booking trends by day, week or month. Select a specific period to inspect its performance." />
    <div className="stats-grid revenue-stats">
      <StatCard label="Paid revenue" value={money(paid)} change="Paid bookings · all time" icon={Wallet} />
      <StatCard label="Pending amount" value={money(pending)} change="Awaiting payment" icon={Clock3} tone="amber" />
      <StatCard label="Bookings" value={totalBookings} change="Excluding rejected requests" icon={CalendarCheck} />
      <StatCard label="Average booking" value={money(average)} change="Per non-rejected booking" icon={TrendingUp} />
    </div>
    <section className="panel revenue-chart-panel">
      <div className="revenue-chart-header">
        <div className="revenue-chart-title-block">
          <span className="eyebrow">REVENUE PERFORMANCE</span>
          <h3>{title}</h3>
          <p>{config.subtitle}</p>
        </div>
        <div className="revenue-chart-tools">
          <div className="revenue-period-tabs" role="tablist" aria-label="Revenue analytics range">
            {[['daily', '7 days'], ['weekly', 'Week'], ['monthly', 'Month']].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={range === key} className={range === key ? 'active' : ''} onClick={() => setRange(key)}>{label}</button>)}
          </div>
          <div className="revenue-peak"><small>Highest {range === 'monthly' ? 'week' : 'day'}</small><strong>{money(peak)}</strong><span><i /> {peakBucket ? peakBucket.label : 'No paid periods yet'}</span></div>
        </div>
      </div>
      <div className="revenue-date-toolbar">
        <div className="revenue-date-caption"><CalendarDays size={16}/><span>{range === 'monthly' ? 'Select month' : range === 'weekly' ? 'Choose any date in the week' : 'Choose the ending date'}</span></div>
        <div className="revenue-date-picker-control">
          <button type="button" className="revenue-date-shift" onClick={prev} aria-label="Previous period"><ChevronLeft size={17}/></button>
          {range === 'monthly'
            ? <label className="revenue-month-picker"><CalendarDays size={16}/><input aria-label="Choose revenue month" type="month" value={selectedMonth} onChange={event => event.target.value && setSelectedMonth(event.target.value)}/><ChevronDown size={15}/></label>
            : <div className="revenue-specific-date"><CustomDateField compact value={anchorDate} onChange={setAnchorDate} ariaLabel={range === 'weekly' ? 'Choose a date in the week to analyse' : 'Choose the ending date for daily analysis'}/></div>}
          <button type="button" className="revenue-date-shift" onClick={next} aria-label="Next period"><ChevronRight size={17}/></button>
          <button type="button" className="revenue-date-today" onClick={() => { setAnchorDate(today()); setSelectedMonth(today().slice(0, 7)) }}>Today</button>
        </div>
        <span className="revenue-selected-range">{selectedLabel}</span>
      </div>
      <div className="revenue-range-summary">
        <span><strong>{money(rangeTotal)}</strong> paid in this range</span>
        <span>{rangePaidBookings} paid booking{rangePaidBookings === 1 ? '' : 's'}</span>
      </div>
      <RevenueLineChart buckets={buckets} axisValues={axisValues} axisMax={axisMax} money={money} formatValue={formatBarValue} period={range} />
      <div className="revenue-chart-footer"><span><i className="revenue-legend-dot" /> Paid bookings</span><span>{money(rangeTotal)} total · {range === 'monthly' ? 'weekly totals for selected month' : range === 'weekly' ? 'daily totals for selected week' : 'daily totals for selected 7-day window'}</span></div>
    </section>
    <section className="panel table-panel"><div className="panel-heading"><div><h3>Revenue transactions</h3><p>Booking-wise payment summary.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>BOOKING</th><th>DATE</th><th>CUSTOMER</th><th>BOOKING AMOUNT</th><th>PAYMENT</th></tr></thead><tbody>{bookings.filter(item => item.status !== 'Rejected').sort((a, b) => b.date.localeCompare(a.date)).map(item => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{formatDate(item.date)}</td><td>{item.customer}</td><td><strong>{money(item.amount)}</strong><small>{money(paidAmount(item))} received</small></td><td><Status value={item.payment} /></td></tr>)}</tbody></table></div></section>
  </>
}

function OwnerAnnouncementMarquee({ turf }) {
  const items = [
    `FEATURE YOUR TURF · ${turf?.name || 'Your venue'} · Add photos and videos for customer previews`,
    'TOURNAMENT · Madurai Football Cup · Football · Community turf · Madurai',
    'MARATHON · Madurai City Run · 5K / 10K / Half Marathon · Madurai',
    'TREKKING · Western Ghats Day Trek · Guided trail booking · Dindigul',
    'NEW GAMES · Pickleball · Paintball · Boxing · Publish the sports you offer'
  ]
  return <div className="owner-ad-marquee" aria-label="Owner tips and customer showcase announcements"><div className="owner-ad-track">{[...items, ...items].map((item, index) => <span key={`${item}-${index}`}><i />{item}</span>)}</div></div>
}

function ShowcasePage({ turf, sports, media, loading, error, live, onSaveGames, onUpload, onDelete }) {
  const [selected, setSelected] = useState(sports || [])
  const [gameToAdd, setGameToAdd] = useState('')
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState([])
  const availableGames = SPORT_CATALOG.filter(game => !selected.includes(game))
  useEffect(() => setSelected(sports || []), [sports.join('|')])
  const removeGame = game => setSelected(previous => previous.filter(item => item !== game))
  const addGame = () => {
    if (!gameToAdd || selected.includes(gameToAdd)) return
    setSelected(previous => [...previous, gameToAdd])
    setGameToAdd('')
  }
  const submitUpload = async event => { event.preventDefault(); if (!files.length) return; await onUpload(files, caption); setFiles([]); setCaption(''); event.target.reset() }
  return <>
    <PageHeading eyebrow="CUSTOMER DISCOVERY" title="Showcase & games" description={`Manage the games and venue media customers see on the ${turf?.name || 'your turf'} listing.`} />
    <section className="panel showcase-status-panel"><div><span className="live-indicator"><i />{live ? 'SHARED PUBLISHING CONNECTED' : 'LOCAL DEMO MODE'}</span><h3>{live ? 'Your changes can reach customer listings' : 'Your showcase is saved in this demo workspace'}</h3><p>{live ? 'Changes are stored by the shared SportiLand backend. Customer pages refresh published venue information periodically.' : 'Game selections and event details are saved in this browser for now. Cross-app publishing can be connected when the customer event section is updated.'}</p></div><span className="showcase-lock"><ShieldCheck size={22}/></span></section>
    <section className="panel showcase-games-panel"><div className="panel-heading"><div><h3><Gamepad2 size={19}/> Games available at your turf</h3><p>Add the sports your venue offers. Games already selected will be removed from the add menu.</p></div><span className="muted-icon">{selected.length} selected</span></div>
      <div className="game-add-row"><label htmlFor="add-owner-game">Add a new game<select id="add-owner-game" value={gameToAdd} onChange={event => setGameToAdd(event.target.value)}><option value="">Choose a game to add</option>{availableGames.map(game => <option key={game} value={game}>{game}</option>)}</select></label><button className="primary-button" type="button" disabled={!gameToAdd} onClick={addGame}><Plus size={16}/> Add game</button></div>
      <div className="game-option-grid">{selected.map(game => <div key={game} className="game-option selected"><span><Check size={14}/>{game}</span><button type="button" onClick={() => removeGame(game)} aria-label={`Remove ${game}`} title={`Remove ${game}`}><X size={14}/></button></div>)}</div>
      <div className="showcase-actions"><small>{selected.length ? `${selected.length} games selected for ${turf?.name || 'your turf'}.` : 'Add at least one game to publish your venue activities.'}</small><button className="primary-button" type="button" disabled={!selected.length} onClick={() => onSaveGames(selected)}><Gamepad2 size={16}/> {live ? 'Publish games' : 'Save games'}</button></div>
    </section>
    <section className="panel showcase-upload-panel"><div className="panel-heading"><div><h3><Images size={19}/> Venue photos & videos</h3><p>Upload real photos and short videos to help customers preview the space.</p></div><span className="media-count">{media.length} published</span></div><form onSubmit={submitUpload} className="showcase-upload-form"><label className="upload-dropzone"><Upload size={25}/><strong>Choose photos or videos</strong><span>JPG, PNG, WEBP, GIF, MP4, WEBM or MOV · up to 100 MB per file</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={event => setFiles(Array.from(event.target.files || []))}/></label><label className="showcase-caption-field">Caption <input value={caption} onChange={event => setCaption(event.target.value)} placeholder="e.g. Evening football turf and floodlights" maxLength={180}/></label><div className="showcase-upload-footer"><span>{files.length ? `${files.length} file(s) selected` : 'No files selected'}</span><button className="primary-button" disabled={!live || !files.length} type="submit"><Upload size={15}/> Upload & publish</button></div></form>{error && <div className="form-error">{error}</div>}{loading && <p className="content-loading">Loading published media…</p>}<div className="owner-media-grid">{media.map(item => <article className="owner-media-card" key={item.id}>{item.type === 'VIDEO' ? <video src={item.url?.startsWith('http') ? item.url : `${window.location.protocol}//${window.location.hostname}:8080${item.url}`} controls preload="metadata"/> : <img src={item.url?.startsWith('http') ? item.url : `${window.location.protocol}//${window.location.hostname}:8080${item.url}`} alt={item.caption || turf?.name || 'Turf media'}/>}<div><span>{item.type === 'VIDEO' ? <Video size={13}/> : <FileImage size={13}/>} {item.type}</span><p>{item.caption || item.fileName || 'Venue showcase'}</p><button type="button" className="media-delete" disabled={!live} onClick={() => onDelete(item.id)}><Trash2 size={14}/> Remove</button></div></article>)}</div>{!media.length && <div className="showcase-empty"><Images size={28}/><strong>No published media yet</strong><span>Your customer gallery will appear here after upload.</span></div>}</section>
  </>
}

function OwnerEventsPage({ events, onCreate, onNotify }) {
  const initialForm = { title: '', type: 'Trekking', description: '', location: '', startDate: addDays(today(), 7), endDate: addDays(today(), 7), startTime: '06:00', durationDays: 1, registrationFee: 0, capacity: 20, packagesText: '', itineraryText: '' }
  const [form, setForm] = useState(initialForm)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(events[0]?.id || '')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!events.some(event => event.id === selectedId)) setSelectedId(events[0]?.id || '')
  }, [events, selectedId])
  const selected = events.find(event => event.id === selectedId) || null
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  const submit = event => {
    event.preventDefault(); setError('')
    if (!form.title.trim() || !form.location.trim() || !form.startDate || !form.endDate) { setError('Enter an event name, location and dates.'); return }
    if (form.endDate < form.startDate) { setError('End date cannot be before the start date.'); return }
    if (Number(form.durationDays) < 1 || Number(form.capacity) < 1 || Number(form.registrationFee) < 0) { setError('Check the duration, capacity and registration fee.'); return }
    const created = onCreate({
      title: form.title.trim(), type: form.type, description: form.description.trim(), location: form.location.trim(),
      startDate: form.startDate, endDate: form.endDate, startTime: form.startTime, durationDays: Number(form.durationDays),
      registrationFee: Number(form.registrationFee), capacity: Number(form.capacity),
      packages: form.packagesText.split('\n').map(value => value.trim()).filter(Boolean),
      itinerary: form.itineraryText.split('\n').map(value => value.trim()).filter(Boolean)
    })
    setSelectedId(created); setForm(initialForm); setFormOpen(false); onNotify('Your event is now listed in the Owner workspace.')
  }
  const dateText = event => event.startDate === event.endDate ? formatDate(event.startDate) : `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
  return <>
    <PageHeading eyebrow="OWNER-GENERATED EXPERIENCES" title="Events & treks" description="Create local events, guided treks and tournaments, then review their participant registrations." action={<button className="primary-button" onClick={() => setFormOpen(value => !value)}><Plus size={17}/>{formOpen ? 'Close form' : 'Create event'}</button>} />
    <div className="event-owner-note"><Flag size={18}/><div><strong>Owner event workspace</strong><span>Create the event details customers will see later. Registrations added by the Customer website will appear in the roster once shared event publishing is connected. This build stores event drafts in this browser.</span></div></div>
    {formOpen && <form className="panel event-create-panel" onSubmit={submit}>
      <div className="event-create-hero"><span className="event-create-hero-icon"><Mountain size={23}/></span><div><span className="eyebrow">PLAN SOMETHING MEMORABLE</span><h3>Create an event or trek</h3><p>Add the trip details, package options and activities planned for your participants.</p></div><span className="event-create-counter">NEW<br/>LISTING</span></div>
      <div className="event-form-grid">
        <label>Event / trip name<input value={form.title} onChange={event => update('title', event.target.value)} placeholder="e.g. Jaypal Weekend Trek" required maxLength={100}/></label>
        <label>Event type<select value={form.type} onChange={event => update('type', event.target.value)}><option>Trekking</option><option>Tournament</option><option>Marathon</option><option>Sports event</option><option>Workshop / Camp</option></select></label>
        <label className="event-field-wide">Short description<textarea rows="2" value={form.description} onChange={event => update('description', event.target.value)} placeholder="Describe the experience and who can join." maxLength={600}/></label>
        <label>Location / meeting point<input value={form.location} onChange={event => update('location', event.target.value)} placeholder="Area, city or trailhead" required/></label>
        <div className="event-picker-field"><span>Start time</span><CustomTimeField value={form.startTime} onChange={value => update('startTime', value)}/></div>
        <div className="event-picker-field"><span>Start date</span><CustomDateField value={form.startDate} onChange={value => { update('startDate', value); if (form.endDate < value) update('endDate', value) }}/></div>
        <div className="event-picker-field"><span>End date</span><CustomDateField value={form.endDate} min={form.startDate} onChange={value => update('endDate', value)}/></div>
        <label>Number of days<input type="number" min="1" max="30" value={form.durationDays} onChange={event => update('durationDays', event.target.value)}/></label>
        <label>Registration fee (₹)<input type="number" min="0" step="50" value={form.registrationFee} onChange={event => update('registrationFee', event.target.value)}/></label>
        <label>Participant capacity<input type="number" min="1" value={form.capacity} onChange={event => update('capacity', event.target.value)}/></label>
        <label className="event-field-wide">Packages / inclusions<textarea rows="3" value={form.packagesText} onChange={event => update('packagesText', event.target.value)} placeholder={'Standard – ₹499 – Guided trail and refreshments\nPlus – ₹799 – Trail, meals and transport'}/><small>Enter one package per line.</small></label>
        <label className="event-field-wide">Itinerary / programs<textarea rows="4" value={form.itineraryText} onChange={event => update('itineraryText', event.target.value)} placeholder={'06:00 AM – Meet-up and check-in\n06:30 AM – Safety briefing\n07:00 AM – Trek begins'}/><small>Enter each program or activity on a new line.</small></label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button className="outline-button" type="button" onClick={() => { setFormOpen(false); setError('') }}>Cancel</button><button className="primary-button" type="submit"><Save size={16}/> Save event</button></div>
    </form>}
    <section className="owner-events-layout">
      <div className="owner-event-list-panel panel"><div className="panel-heading"><div><h3>Your events</h3><p>{events.length} event listing{events.length === 1 ? '' : 's'} in this workspace.</p></div><span className="count-pill">{events.length} TOTAL</span></div>
        {events.length ? <div className="owner-event-list">{events.map(event => <button key={event.id} className={`owner-event-card ${selectedId === event.id ? 'active' : ''}`} onClick={() => setSelectedId(event.id)}><span className="owner-event-icon">{event.type === 'Trekking' ? <Mountain size={19}/> : event.type === 'Tournament' ? <Trophy size={19}/> : <CalendarDays size={19}/>}</span><span className="owner-event-card-copy"><small>{event.type}{event.isDemo ? ' · DEMO SAMPLE' : ''}</small><strong>{event.title}</strong><span><MapPin size={12}/>{event.location}</span><span><CalendarDays size={12}/>{dateText(event)}</span></span><span className="owner-event-card-count"><strong>{event.registrations?.length || 0}</strong><small>registered</small></span></button>)}</div> : <EmptyState title="No events created yet" detail="Create your first event or guided trek to get started." action={() => setFormOpen(true)} actionLabel="Create an event"/>}
      </div>
      <div className="owner-event-detail panel">{selected ? <>
        <div className="event-detail-hero">
        <div className="panel-heading"><div><span className="event-type-badge">{selected.type}</span><h3>{selected.title}</h3><p>{selected.description || 'No event description added.'}</p></div><span className="event-capacity">{selected.registrations?.length || 0} / {selected.capacity || '—'}</span></div>
        </div>
        <div className="event-facts-grid"><div><MapPin size={16}/><span><small>Location</small><strong>{selected.location}</strong></span></div><div><CalendarDays size={16}/><span><small>Dates</small><strong>{dateText(selected)}</strong></span></div><div><Clock3 size={16}/><span><small>Duration</small><strong>{selected.durationDays} day{Number(selected.durationDays) === 1 ? '' : 's'} · {timeLabel(selected.startTime || '06:00')}</strong></span></div><div><Ticket size={16}/><span><small>Registration fee</small><strong>{money(selected.registrationFee)}</strong></span></div></div>
        {selected.packages?.length > 0 && <div className="event-detail-section"><h4>Packages & inclusions</h4><ul>{selected.packages.map((value, index) => <li key={index}>{value}</li>)}</ul></div>}
        {selected.itinerary?.length > 0 && <div className="event-detail-section"><h4>Trip itinerary / programs</h4><ol>{selected.itinerary.map((value, index) => <li key={index}>{value}</li>)}</ol></div>}
        <div className="event-registrants"><div className="panel-heading"><div><h3><UserCheck size={17}/> Registration roster</h3><p>People registered for this event.</p></div><span className="count-pill">{selected.registrations?.length || 0} PEOPLE</span></div>
          {selected.isDemo && <p className="demo-footnote">Sample attendee records for preview only. Real customer registrations will be synced when the customer event workflow is connected.</p>}
          {selected.registrations?.length ? <div className="table-scroll"><table className="data-table event-roster-table"><thead><tr><th>PARTICIPANT</th><th>CONTACT</th><th>PACKAGE</th><th>PEOPLE</th><th>STATUS</th></tr></thead><tbody>{selected.registrations.map(registration => <tr key={registration.id}><td><strong>{registration.name}</strong><small>{registration.id}{registration.isDemo ? ' · demo' : ''}</small></td><td><strong>{registration.phone || '—'}</strong><small>{registration.email || '—'}</small></td><td>{registration.package || 'Standard'}</td><td>{registration.participants || 1}</td><td><Status value={registration.status || 'Registered'}/></td></tr>)}</tbody></table></div> : <EmptyState title="No registrations yet" detail="Customer sign-ups will appear here when this event is published and the registration flow is connected."/>}
        </div>
      </> : <EmptyState title="Select an event" detail="Choose an event from the list to view its packages, itinerary and registration roster."/>}</div>
    </section>
  </>
}

function Profile({ profile, onChange, onSave, onNotify }) {
  if (!profile) return null
  const update = (key, value) => onChange(previous => ({ ...profile, ...(previous || {}), [key]: value }))
  const updateTurf = (key, value) => onChange(previous => {
    const base = { ...profile, ...(previous || {}) }
    return { ...base, turf: { ...profile.turf, ...(previous?.turf || {}), [key]: value } }
  })
  const toggleSport = sport => {
    const current = profile.turf.sports || []
    updateTurf('sports', current.includes(sport) ? current.filter(item => item !== sport) : [...current, sport])
  }
  return <>
    <PageHeading eyebrow="OWNER SETTINGS" title="Turf profile" description="Keep your owner contact details and registered turf information up to date." />
    <form className="profile-grid" onSubmit={onSave}>
      <section className="panel profile-main"><div className="panel-heading"><div><h3>Owner information</h3><p>Your account contact details.</p></div><UserRound size={20} className="muted-icon" /></div>
        <div className="profile-fields"><label>Owner name<input value={profile.ownerName || ''} onChange={e => update('ownerName', e.target.value)} required /></label><label>Email address<input type="email" value={profile.email || ''} onChange={e => update('email', e.target.value)} required /></label><label>Contact number<input value={profile.contactNumber || ''} onChange={e => update('contactNumber', e.target.value)} required /></label></div>
      </section>
      <section className="panel profile-main"><div className="panel-heading"><div><h3>Registered turf details</h3><p>Information customers use to identify your venue.</p></div><Building2 size={20} className="muted-icon" /></div>
        <div className="profile-fields"><label>Turf name<input value={profile.turf.name || ''} onChange={e => updateTurf('name', e.target.value)} required /></label><label>Area / locality<input value={profile.turf.area || ''} onChange={e => updateTurf('area', e.target.value)} required /></label><label className="span-two">Full address<textarea rows="3" value={profile.turf.address || ''} onChange={e => updateTurf('address', e.target.value)} /></label><label>Hourly price (₹)<input type="number" min="1" value={profile.turf.hourlyRate || 800} onChange={e => updateTurf('hourlyRate', Number(e.target.value))} /></label></div>
        <div className="sport-picker"><strong>Sports available</strong><div>{SPORT_CATALOG.map(sport => <button type="button" key={sport} className={(profile.turf.sports || []).includes(sport) ? 'selected' : ''} onClick={() => toggleSport(sport)}>{(profile.turf.sports || []).includes(sport) && <Check size={13} />}{sport}</button>)}</div></div>
      </section>
      <div className="profile-actions"><span>Changes are stored in this browser demo.</span><button className="primary-button" type="submit"><Save size={16} /> Save profile</button></div>
    </form>
  </>
}
