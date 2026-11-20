"use client";

import { useEffect, useState } from "react";

// Forex session clock. Hours are local to each financial centre, so daylight saving is handled
// by the time zone database instead of fixed UTC offsets.
const SESSIONS = [
  { name: "Sydney", tz: "Australia/Sydney", open: 7, close: 16, color: "#6ea8fe" },
  { name: "Tokyo", tz: "Asia/Tokyo", open: 9, close: 18, color: "#c38bff" },
  { name: "London", tz: "Europe/London", open: 8, close: 17, color: "#d9aa3c" },
  { name: "New York", tz: "America/New_York", open: 8, close: 17, color: "#22c27a" },
] as const;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Wall-clock parts of `ts` in time zone `tz`. */
function partsIn(ts: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(ts).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, weekday: p.weekday as string };
}

function offsetMs(ts: number, tz: string) {
  const p = partsIn(ts, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(ts / 60_000) * 60_000;
}

/** UTC timestamp of wall-clock time y-m-d h:00 in `tz`. */
function zoned(y: number, m: number, d: number, h: number, tz: string) {
  const guess = Date.UTC(y, m - 1, d, h);
  let ts = guess - offsetMs(guess, tz);
  ts = guess - offsetMs(ts, tz); // second pass settles DST edges
  return ts;
}

type Interval = { start: number; end: number };

/** Session instances on weekdays (in the centre's own time zone) around `now`. */
function instances(s: (typeof SESSIONS)[number], now: number): Interval[] {
  const out: Interval[] = [];
  for (let k = -2; k <= 4; k++) { // far enough ahead to reach Monday from a Friday
    const p = partsIn(now + k * DAY, s.tz);
    if (p.weekday === "Sat" || p.weekday === "Sun") continue;
    out.push({ start: zoned(p.y, p.m, p.d, s.open, s.tz), end: zoned(p.y, p.m, p.d, s.close, s.tz) });
  }
  return out;
}

const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDur = (ms: number) => {
  const m = Math.round(ms / 60_000);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
};

export default function SessionClock() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (now === null) {
    return <div className="card session-loading">Loading your local time…</div>;
  }

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dayStart = new Date(now).setHours(0, 0, 0, 0);
  const dayEnd = dayStart + DAY;
  const pct = (ts: number) => ((ts - dayStart) / DAY) * 100;

  const rows = SESSIONS.map((s) => {
    const all = instances(s, now);
    const current = all.find((i) => i.start <= now && now < i.end);
    const next = all.find((i) => i.start > now);
    const today = all
      .map((i) => ({ start: Math.max(i.start, dayStart), end: Math.min(i.end, dayEnd) }))
      .filter((i) => i.end > i.start);
    return { ...s, all, current, next, today };
  });

  const overlaps: { label: string; start: number; end: number }[] = [];
  for (let a = 0; a < rows.length; a++) {
    for (let b = a + 1; b < rows.length; b++) {
      for (const x of rows[a].today) {
        for (const y of rows[b].today) {
          const start = Math.max(x.start, y.start);
          const end = Math.min(x.end, y.end);
          if (end > start) overlaps.push({ label: `${rows[a].name} + ${rows[b].name}`, start, end });
        }
      }
    }
  }
  overlaps.sort((p, q) => p.start - q.start);
  const openCount = rows.filter((r) => r.current).length;

  return (
    <div className="sessions">
      <div className="sessions-head">
        <div>
          <div className="result-label">Your time ({localTz})</div>
          <div className="result-main">{fmtTime(now)}</div>
        </div>
        <span className={`badge ${openCount ? "badge-bullish" : "badge-neutral"}`}>
          <span className="dot" aria-hidden />
          {openCount === 0 ? "All sessions closed" : `${openCount} session${openCount > 1 ? "s" : ""} open`}
        </span>
      </div>

      <div className="grid grid-4 session-cards">
        {rows.map((r) => (
          <div key={r.name} className={`card session-card${r.current ? " is-open" : ""}`} style={{ borderTopColor: r.color }}>
            <h3>{r.name}</h3>
            <p className="session-status">{r.current ? "Open" : "Closed"}</p>
            <p className="muted small">
              {r.current
                ? `Closes in ${fmtDur(r.current.end - now)}`
                : r.next
                  ? `Opens in ${fmtDur(r.next.start - now)}`
                  : "Closed for the weekend"}
            </p>
            <p className="tiny muted">
              {(r.current ?? r.next) ? `${fmtTime((r.current ?? r.next)!.start)} – ${fmtTime((r.current ?? r.next)!.end)} your time` : ""}
            </p>
          </div>
        ))}
      </div>

      <div className="card timeline" aria-label="Today's sessions in your time zone">
        <div className="timeline-scale" aria-hidden>
          {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
            <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
              {String(h).padStart(2, "0")}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.name} className="timeline-row">
            <span className="timeline-label">{r.name}</span>
            <div className="timeline-track">
              {r.today.map((i) => (
                <span
                  key={i.start}
                  className="timeline-bar"
                  style={{ left: `${pct(i.start)}%`, width: `${pct(i.end) - pct(i.start)}%`, background: r.color }}
                  title={`${fmtTime(i.start)} – ${fmtTime(i.end)}`}
                />
              ))}
              <span className="timeline-now" style={{ left: `${pct(now)}%` }} />
            </div>
          </div>
        ))}
        <div className="timeline-row">
          <span className="timeline-label">Overlaps</span>
          <div className="timeline-track">
            {overlaps.map((o) => (
              <span
                key={o.label + o.start}
                className="timeline-bar overlap"
                style={{ left: `${pct(o.start)}%`, width: `${pct(o.end) - pct(o.start)}%` }}
                title={`${o.label}: ${fmtTime(o.start)} – ${fmtTime(o.end)}`}
              />
            ))}
            <span className="timeline-now" style={{ left: `${pct(now)}%` }} />
          </div>
        </div>
      </div>

      {overlaps.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Overlaps today (your time)</h3>
          <div className="result-list" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
            {overlaps.map((o) => (
              <div key={o.label + o.start}>
                <span>{o.label}</span>
                <span>
                  {fmtTime(o.start)} – {fmtTime(o.end)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
