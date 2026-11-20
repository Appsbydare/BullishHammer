import type { Bar } from "@/lib/pattern-guides";

type Props = {
  bars: Bar[];
  patternBars: number;
  width?: number;
  height?: number;
  /** Compact glyph: drops the highlight band and dims context more. */
  compact?: boolean;
  title?: string;
};

/** Simple SVG candlestick illustration. Context candles are dimmed; pattern candles are highlighted. */
export default function PatternChart({ bars, patternBars, width = 320, height = 200, compact = false, title }: Props) {
  const pad = compact ? 2 : 14;
  const hi = Math.max(...bars.map((b) => b.h));
  const lo = Math.min(...bars.map((b) => b.l));
  const span = hi - lo || 1;
  const y = (v: number) => pad + ((hi - v) / span) * (height - pad * 2);
  const slot = (width - pad * 2) / bars.length;
  const bodyW = Math.max(3, slot * 0.56);
  const first = bars.length - patternBars;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title ?? "Candlestick pattern illustration"}
      style={{ display: "block", width: "100%", height: "auto", maxWidth: width }}
    >
      {!compact && (
        <rect
          x={pad + slot * first + 2}
          y={4}
          width={slot * patternBars - 4}
          height={height - 8}
          rx={8}
          fill="rgba(217,170,60,0.08)"
          stroke="rgba(217,170,60,0.35)"
          strokeDasharray="4 4"
        />
      )}
      {bars.map((b, i) => {
        const cx = pad + slot * i + slot / 2;
        const up = b.c >= b.o;
        const color = up ? "var(--bull)" : "var(--bear)";
        const top = y(Math.max(b.o, b.c));
        const bodyH = Math.max(1.5, Math.abs(y(b.o) - y(b.c)));
        const opacity = i < first ? (compact ? 0.35 : 0.6) : 1;
        return (
          <g key={i} opacity={opacity}>
            <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth={compact ? 1.2 : 2} strokeLinecap="round" />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bodyH} rx={compact ? 0.5 : 1.5} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
