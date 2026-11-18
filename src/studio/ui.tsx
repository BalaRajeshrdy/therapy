import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Ban, CheckCircle2, CircleDot, Clock, LogIn, Printer, Sparkles, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ApptStatus } from './types'

export function Card({ children, className, as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article'; 'aria-labelledby'?: string; 'aria-label'?: string }) {
  return (
    <As className={cn('rounded-3xl bg-white p-5 shadow-soft ring-1 ring-forest/5 sm:p-6', className)} {...rest}>
      {children}
    </As>
  )
}

export function CardTitle({ children, id, action, className }: { children: ReactNode; id?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-3', className)}>
      <h2 id={id} className="font-sans text-lg font-bold text-forest">
        {children}
      </h2>
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, intro, actions }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta">{eyebrow}</p>}
        <h1 className="mt-1 font-serif text-3xl text-forest sm:text-[2.4rem] sm:leading-tight">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-charcoal-soft">{intro}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ value, label, hint, tone = 'ivory', icon: Icon }: { value: ReactNode; label: string; hint?: ReactNode; tone?: 'ivory' | 'forest' | 'peach' | 'sage' | 'lavender' | 'butter'; icon?: LucideIcon }) {
  const tones = {
    ivory: 'bg-white ring-1 ring-forest/5 text-forest',
    forest: 'bg-forest text-ivory',
    peach: 'bg-peach text-forest',
    sage: 'bg-sage-light text-forest',
    lavender: 'bg-lavender text-forest',
    butter: 'bg-butter text-forest',
  }
  return (
    <div className={cn('flex flex-col rounded-3xl p-5 shadow-soft', tones[tone])}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-[2.4rem] leading-none">{value}</p>
        {Icon && <Icon className="size-5 opacity-70" aria-hidden />}
      </div>
      <p className={cn('mt-3 text-sm font-semibold', tone === 'forest' ? 'text-ivory/85' : 'text-charcoal')}>{label}</p>
      {hint && <p className={cn('mt-1 text-xs', tone === 'forest' ? 'text-ivory/70' : 'text-charcoal-soft')}>{hint}</p>}
    </div>
  )
}

const statusStyle: Record<ApptStatus, { cls: string; icon: LucideIcon; label: string }> = {
  scheduled: { cls: 'bg-lavender text-forest', icon: Clock, label: 'Upcoming' },
  'checked-in': { cls: 'bg-butter text-[#5a4b17]', icon: LogIn, label: 'Checked in' },
  completed: { cls: 'bg-sage-light text-forest', icon: CheckCircle2, label: 'Completed' },
  'no-show': { cls: 'bg-peach text-[#8a3f27]', icon: XCircle, label: 'No-show' },
  'late-cancel': { cls: 'bg-peach text-[#8a3f27]', icon: AlertTriangle, label: 'Late cancel' },
  cancelled: { cls: 'bg-ivory text-charcoal-soft ring-1 ring-forest/10', icon: Ban, label: 'Cancelled' },
}

export function StatusPill({ status }: { status: ApptStatus }) {
  const st = statusStyle[status]
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', st.cls)}>
      <st.icon className="size-3.5" aria-hidden />
      {st.label}
    </span>
  )
}

export function Pill({ children, tone = 'sage', icon: Icon }: { children: ReactNode; tone?: 'sage' | 'peach' | 'lavender' | 'butter' | 'ivory' | 'forest' | 'alert'; icon?: LucideIcon }) {
  const tones = {
    sage: 'bg-sage-light text-forest',
    peach: 'bg-peach text-[#8a3f27]',
    lavender: 'bg-lavender text-forest',
    butter: 'bg-butter text-[#5a4b17]',
    ivory: 'bg-ivory text-charcoal-soft ring-1 ring-forest/10',
    forest: 'bg-forest text-ivory',
    alert: 'bg-[#FBE3DC] text-[#8a3f27] ring-1 ring-terracotta/30',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  )
}

export function AIBadge({ children = 'AI draft · review before use' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-1 text-xs font-semibold text-[#5a4b17]">
      <Sparkles className="size-3.5" aria-hidden /> {children}
    </span>
  )
}

export function Empty({ children, icon: Icon = CircleDot }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-forest/15 px-4 py-8 text-center text-sm text-charcoal-soft">
      <Icon className="size-6 text-sage-dark" aria-hidden />
      {children}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode; count?: number }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-print mb-5 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-soft ring-1 ring-forest/5">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            value === it.id ? 'bg-forest text-ivory' : 'text-charcoal-soft hover:bg-sage-light/60 hover:text-forest',
          )}
        >
          {it.label}
          {it.count != null && <span className={cn('rounded-full px-1.5 text-xs', value === it.id ? 'bg-ivory/20' : 'bg-sage-light')}>{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function PrintButton({ label = 'Print / save PDF' }: { label?: string }) {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer aria-hidden /> {label}
    </Button>
  )
}

export function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-forest/10 py-2.5 text-sm last:border-0">
      <dt className="text-charcoal-soft">{k}</dt>
      <dd className="text-right font-semibold text-charcoal">{v}</dd>
    </div>
  )
}

export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn('font-semibold text-forest underline-offset-4 hover:underline', className)}>
      {children}
    </Link>
  )
}

export function Notice({ children, tone = 'butter', icon: Icon = AlertTriangle }: { children: ReactNode; tone?: 'butter' | 'lavender' | 'peach' | 'sage'; icon?: LucideIcon }) {
  const tones = { butter: 'bg-butter/70', lavender: 'bg-lavender', peach: 'bg-peach', sage: 'bg-sage-light' }
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-charcoal', tones[tone])}>
      <Icon className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

/* ---------- Signature pad ---------- */

export function SignaturePad({ onChange, label = 'Signature' }: { onChange: (dataUrl: string | null) => void; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const id = useId()

  useEffect(() => {
    const c = canvas.current!
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1D3731'
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const down = (e: React.PointerEvent) => {
    drawing.current = true
    canvas.current!.setPointerCapture(e.pointerId)
    const ctx = canvas.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(...pos(e))
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvas.current!.getContext('2d')!
    ctx.lineTo(...pos(e))
    ctx.stroke()
    if (!hasInk) setHasInk(true)
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(canvas.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setHasInk(false)
    onChange(null)
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <p id={id} className="text-sm font-semibold text-forest">
          {label}
        </p>
        <button type="button" onClick={clear} className="text-xs font-semibold text-charcoal-soft underline-offset-4 hover:underline">
          Clear
        </button>
      </div>
      <canvas
        ref={canvas}
        aria-labelledby={id}
        role="img"
        aria-description="Draw your signature with a finger, stylus or mouse"
        className="mt-2 h-32 w-full touch-none rounded-2xl border-2 border-dashed border-forest/20 bg-ivory"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
      <p className="mt-1 text-xs text-charcoal-soft">{hasInk ? 'Signature captured.' : 'Sign above with a finger, stylus or mouse.'}</p>
    </div>
  )
}

/* ---------- Charts ---------- */

export interface Series {
  name: string
  color: string
  values: (number | null)[]
}

/** Multi-series line chart: thin lines, ringed markers, legend + direct end labels, hover crosshair, table view. */
export function LineChart({ title, labels, series, yMax = 5, yMin = 0, yTicks = [0, 1, 2, 3, 4, 5], height = 260, valueSuffix = '' }: { title: string; labels: string[]; series: Series[]; yMax?: number; yMin?: number; yTicks?: number[]; height?: number; valueSuffix?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const W = 640
  const pad = { l: 34, r: 120, t: 14, b: 30 }
  const iw = W - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const x = (i: number) => pad.l + (labels.length <= 1 ? iw / 2 : (iw * i) / (labels.length - 1))
  const y = (v: number) => pad.t + ih - ((v - yMin) / (yMax - yMin)) * ih
  // Direct-label placement with simple collision avoidance
  const ends = series
    .map((s) => {
      const lastIdx = s.values.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop() ?? 0
      return { s, y: y(s.values[lastIdx] ?? 0), x: x(lastIdx) }
    })
    .sort((a, b) => a.y - b.y)
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14

  return (
    <figure className="relative">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-serif text-lg text-forest">{title}</span>
        <button type="button" className="no-print text-xs font-semibold text-forest underline-offset-4 hover:underline" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'Show chart' : 'Show data table'}
        </button>
      </figcaption>
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal" aria-label="Legend">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} aria-hidden />
              <span className="inline-block size-2 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      {table ? (
        <DataTable columns={['', ...series.map((s) => s.name)]} rows={labels.map((l, i) => [l, ...series.map((s) => (s.values[i] == null ? '—' : `${s.values[i]}${valueSuffix}`))])} />
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={`${title}. ${series.map((s) => `${s.name}: from ${s.values.find((v) => v != null)} to ${[...s.values].reverse().find((v) => v != null)}`).join('; ')}`}>
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#303735" strokeOpacity={t === yMin ? 0.35 : 0.08} />
                <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5A6360">
                  {t}
                </text>
              </g>
            ))}
            {labels.map((l, i) => (
              <text key={l + i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="#5A6360">
                {l}
              </text>
            ))}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#303735" strokeOpacity="0.25" />}
            {series.map((s) => {
              const pts = s.values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean)
              return (
                <g key={s.name}>
                  <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {s.values.map((v, i) => (v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5.5 : 4} fill={s.color} stroke="#fff" strokeWidth="2" />))}
                </g>
              )
            })}
            {series.length <= 4 &&
              ends.map((e) => (
                <text key={e.s.name} x={e.x + 10} y={e.y + 4} fontSize="11" fill="#303735">
                  {(() => {
                    const short = e.s.name.includes(': ') ? e.s.name.split(': ')[1] : e.s.name
                    return short.length > 18 ? short.slice(0, 17) + '…' : short
                  })()}
                </text>
              ))}
            {labels.map((l, i) => (
              <rect key={'hit' + l + i} x={x(i) - iw / Math.max(1, labels.length - 1) / 2} y={pad.t} width={iw / Math.max(1, labels.length - 1)} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            ))}
          </svg>
          {hover != null && (
            <div className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-xl bg-white p-3 text-xs shadow-lift ring-1 ring-forest/10" style={{ left: `min(calc(${(x(hover) / W) * 100}% + 12px), calc(100% - 170px))` }}>
              <p className="mb-1 font-bold text-charcoal">{labels[hover]}</p>
              {series.map((s) => (
                <p key={s.name} className="flex items-center justify-between gap-3 text-charcoal">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <b>{s.values[hover] ?? '—'}{valueSuffix}</b>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  )
}

/** Single-series bar chart with rounded data ends, hover tooltip and a table view. */
export function BarChart({ title, data, color = '#2a78d6', height = 220, format = (v: number) => String(v), unit = '' }: { title: string; data: { label: string; value: number }[]; color?: string; height?: number; format?: (v: number) => string; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const W = 640
  const pad = { l: 44, r: 8, t: 12, b: 28 }
  const iw = W - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const max = Math.max(1, ...data.map((d) => d.value))
  const nice = (() => {
    const p = 10 ** Math.floor(Math.log10(max))
    const steps = [1, 2, 2.5, 5, 10].map((m) => m * p)
    const step = steps.find((st) => max / st <= 4) ?? p * 10
    return { step, top: Math.ceil(max / step) * step }
  })()
  const ticks = Array.from({ length: Math.round(nice.top / nice.step) + 1 }, (_, i) => i * nice.step)
  const bw = iw / data.length
  const barW = Math.min(44, bw - 6)
  const y = (v: number) => pad.t + ih - (v / nice.top) * ih
  return (
    <figure>
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-serif text-lg text-forest">{title}</span>
        <button type="button" className="no-print text-xs font-semibold text-forest underline-offset-4 hover:underline" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'Show chart' : 'Show data table'}
        </button>
      </figcaption>
      {table ? (
        <DataTable columns={['', unit || 'Value']} rows={data.map((d) => [d.label, format(d.value)])} />
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#303735" strokeOpacity={t === 0 ? 0.35 : 0.08} />
                <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5A6360">
                  {format(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = pad.l + bw * i + bw / 2
              const h = Math.max(0, pad.t + ih - y(d.value))
              const r = Math.min(4, h)
              const x0 = cx - barW / 2
              const top = y(d.value)
              const path = h > 0 ? `M ${x0} ${pad.t + ih} V ${top + r} Q ${x0} ${top} ${x0 + r} ${top} H ${x0 + barW - r} Q ${x0 + barW} ${top} ${x0 + barW} ${top + r} V ${pad.t + ih} Z` : ''
              return (
                <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={pad.l + bw * i} y={pad.t} width={bw} height={ih} fill="transparent" />
                  {path && <path d={path} fill={color} opacity={hover == null || hover === i ? 1 : 0.55} />}
                  <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="#5A6360">
                    {d.label}
                  </text>
                </g>
              )
            })}
          </svg>
          {hover != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-xl bg-white px-3 py-2 text-xs shadow-lift ring-1 ring-forest/10"
              style={{ left: `min(calc(${((pad.l + bw * hover + bw / 2) / W) * 100}% + 8px), calc(100% - 130px))` }}
            >
              <p className="font-bold text-charcoal">{data[hover].label}</p>
              <p className="text-charcoal">
                {format(data[hover].value)} {unit}
              </p>
            </div>
          )}
        </div>
      )}
    </figure>
  )
}

export function DataTable({ columns, rows, caption }: { columns: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-forest/10">
      <table className="w-full min-w-[420px] text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-ivory text-xs uppercase tracking-wider text-charcoal-soft">
          <tr>
            {columns.map((c, i) => (
              <th key={c + i} scope="col" className="px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-forest/5">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-charcoal">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const ms = Math.max(0, new Date(until).getTime() - now)
  const h = Math.floor(ms / 3600_000)
  const m = Math.floor((ms % 3600_000) / 60_000)
  const sec = Math.floor((ms % 60_000) / 1000)
  return (
    <span className="font-mono tabular-nums" aria-label={`${h} hours ${m} minutes left`}>
      {h}:{String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')}
    </span>
  )
}
