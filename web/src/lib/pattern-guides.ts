// Long-form pattern guide content (static SEO copy) and illustration data.
// Pattern names/directions live in the `patterns` table; this file only adds the guide text.

export type Bar = { o: number; h: number; l: number; c: number };
export type Guide = {
  summary: string;
  identify: string[];
  meaning: string;
  howTradersUseIt: string;
  scannerRule: string;
  faq: { q: string; a: string }[];
  /** Illustration: context candles followed by the pattern candles (last `patternBars`). */
  bars: Bar[];
  patternBars: number;
};

const DOWN: Bar[] = [
  { o: 80, c: 72, h: 83, l: 70 },
  { o: 72, c: 64, h: 74, l: 62 },
  { o: 64, c: 57, h: 66, l: 55 },
  { o: 57, c: 50, h: 59, l: 48 },
];
const UP: Bar[] = [
  { o: 20, c: 28, h: 30, l: 18 },
  { o: 28, c: 36, h: 38, l: 26 },
  { o: 36, c: 43, h: 45, l: 34 },
  { o: 43, c: 50, h: 52, l: 41 },
];
const RANGE: Bar[] = [
  { o: 50, c: 56, h: 58, l: 48 },
  { o: 56, c: 52, h: 58, l: 50 },
  { o: 52, c: 57, h: 59, l: 51 },
  { o: 57, c: 54, h: 60, l: 53 },
];

const CONFIRM =
  "Most traders wait for the next candle to confirm the move before acting, and place a stop beyond the pattern's extreme.";

export const GUIDES: Record<string, Guide> = {
  "bullish-hammer": {
    summary:
      "The bullish hammer is a single-candle reversal pattern that forms after a decline. Price falls sharply during the session, buyers step in, and the candle closes near its high, leaving a long lower wick.",
    identify: [
      "Appears after a short-term downtrend.",
      "Small body in the upper part of the candle (colour does not matter).",
      "Lower wick at least twice the length of the body.",
      "Little or no upper wick.",
    ],
    meaning:
      "The long lower wick shows that sellers were in control early but could not hold lower prices. Buyers absorbed the selling and pushed price back up, which can signal that the decline is losing momentum.",
    howTradersUseIt: `Traders look for hammers at support levels, round numbers or after an extended fall. ${CONFIRM} A hammer below a falling 50 EMA is a counter-trend signal, so many traders treat it with extra caution.`,
    scannerRule:
      "Body larger than 10% of the range, lower wick ≥ 2× body, upper wick ≤ 10% of the range, candle range at least 80% of the 10-candle average, and a prior 5-candle decline.",
    faq: [
      { q: "Is a red hammer still bullish?", a: "Yes. The shape matters more than the colour. A green hammer is slightly stronger because it closed above its open, but both show lower prices being rejected." },
      { q: "What is the difference between a hammer and a hanging man?", a: "They have the same shape. A hammer forms after a decline and is bullish; a hanging man forms after a rise and is bearish." },
    ],
    bars: [...DOWN, { o: 47, c: 50, h: 51, l: 30 }],
    patternBars: 1,
  },
  "inverted-hammer": {
    summary:
      "The inverted hammer forms after a decline and has a small body near the low with a long upper wick. It shows buyers testing higher prices for the first time in a while.",
    identify: [
      "Appears after a short-term downtrend.",
      "Small body in the lower part of the candle.",
      "Upper wick at least twice the length of the body.",
      "Little or no lower wick.",
    ],
    meaning:
      "Buyers pushed price well above the open. Sellers brought it back down before the close, but the attempt itself suggests selling pressure is fading.",
    howTradersUseIt: `The inverted hammer is weaker than a regular hammer, so confirmation matters more. ${CONFIRM}`,
    scannerRule:
      "Body larger than 10% of the range, upper wick ≥ 2× body, lower wick ≤ 10% of the range, range at least 80% of the 10-candle average, and a prior 5-candle decline.",
    faq: [
      { q: "Is an inverted hammer bullish or bearish?", a: "Bullish, because it appears after a decline. The same shape after a rise is a shooting star, which is bearish." },
      { q: "How reliable is the inverted hammer?", a: "On its own it is a weak signal. It is more useful at a clear support level and when the next candle closes higher." },
    ],
    bars: [...DOWN, { o: 48, c: 50, h: 66, l: 47 }],
    patternBars: 1,
  },
  "hanging-man": {
    summary:
      "The hanging man has the same shape as a hammer but forms after a rise. The long lower wick shows that sellers were able to push price down sharply during the session.",
    identify: [
      "Appears after a short-term uptrend.",
      "Small body in the upper part of the candle.",
      "Lower wick at least twice the length of the body.",
      "Little or no upper wick.",
    ],
    meaning:
      "Even though price recovered, the deep sell-off inside the candle is a warning that buyers may be running out of strength near the top of the move.",
    howTradersUseIt: `A hanging man is a warning rather than a signal on its own. ${CONFIRM} A bearish close on the next candle strengthens it.`,
    scannerRule:
      "Same shape rules as the hammer (lower wick ≥ 2× body, tiny upper wick, above-average range) with a prior 5-candle rise.",
    faq: [
      { q: "Why is the hanging man bearish if it closes near the high?", a: "Because of where it appears. After a rise, a deep intraday drop shows that sellers are becoming active at higher prices." },
      { q: "Does the hanging man need confirmation?", a: "Yes. Most traders wait for the next candle to close below the hanging man's body." },
    ],
    bars: [...UP, { o: 53, c: 50, h: 54, l: 34 }],
    patternBars: 1,
  },
  "shooting-star": {
    summary:
      "The shooting star forms after a rise. Price spikes higher, sellers reject the move, and the candle closes near its low, leaving a long upper wick.",
    identify: [
      "Appears after a short-term uptrend.",
      "Small body in the lower part of the candle.",
      "Upper wick at least twice the length of the body.",
      "Little or no lower wick.",
    ],
    meaning:
      "Buyers tried to extend the rally but could not hold the gains. The rejection from the high suggests the uptrend may be stalling.",
    howTradersUseIt: `Shooting stars at resistance or after a long rally get the most attention. ${CONFIRM}`,
    scannerRule:
      "Upper wick ≥ 2× body, lower wick ≤ 10% of the range, range at least 80% of the 10-candle average, and a prior 5-candle rise.",
    faq: [
      { q: "Is a shooting star the same as an inverted hammer?", a: "Same shape, opposite context. After a rise it is a bearish shooting star; after a decline it is a bullish inverted hammer." },
      { q: "Does the colour of a shooting star matter?", a: "A red (bearish) body is slightly stronger, but the long upper wick is what defines the pattern." },
    ],
    bars: [...UP, { o: 51, c: 49, h: 68, l: 48 }],
    patternBars: 1,
  },
  "bullish-engulfing": {
    summary:
      "A bullish engulfing pattern is a two-candle reversal: a bearish candle followed by a larger bullish candle whose body completely covers the previous body.",
    identify: [
      "Appears after a short-term downtrend.",
      "First candle is bearish.",
      "Second candle is bullish and its body covers the first candle's body.",
      "The second body is clearly larger than the first.",
    ],
    meaning:
      "Buyers did more than stop the decline: they erased the previous session's losses and closed higher. It shows a clear shift in control.",
    howTradersUseIt: `Engulfing candles are among the most-watched reversal patterns. The larger the engulfing body relative to recent candles, the stronger the signal. ${CONFIRM}`,
    scannerRule:
      "Bearish candle then bullish candle, second body covers the first and is larger, second body ≥ 60% of the 10-candle average body, prior 5-candle decline.",
    faq: [
      { q: "Do the wicks need to be engulfed too?", a: "No. The standard definition only requires the body to be engulfed. Engulfing the wicks as well makes the pattern stronger." },
      { q: "Why are engulfing patterns rarer in forex?", a: "Forex trades almost continuously, so the next candle usually opens at the previous close. The pattern still forms, it just has no gap." },
    ],
    bars: [...DOWN, { o: 50, c: 45, h: 51, l: 44 }, { o: 44.5, c: 56, h: 57, l: 43 }],
    patternBars: 2,
  },
  "bearish-engulfing": {
    summary:
      "A bearish engulfing pattern is a bullish candle followed by a larger bearish candle whose body completely covers the previous body, at the top of a rise.",
    identify: [
      "Appears after a short-term uptrend.",
      "First candle is bullish.",
      "Second candle is bearish and its body covers the first candle's body.",
      "The second body is clearly larger than the first.",
    ],
    meaning:
      "Sellers wiped out the previous session's gains and closed lower. It suggests buyers have lost control, at least for now.",
    howTradersUseIt: `Traders watch for bearish engulfing candles at resistance or after an extended rally. ${CONFIRM}`,
    scannerRule:
      "Bullish candle then bearish candle, second body covers the first and is larger, second body ≥ 60% of the 10-candle average body, prior 5-candle rise.",
    faq: [
      { q: "Is a bearish engulfing a sell signal?", a: "It is a sign of a possible reversal, not a signal on its own. Context such as resistance levels and the wider trend matters." },
      { q: "Which timeframe is best for engulfing patterns?", a: "Higher timeframes such as H4 and D1 tend to produce more meaningful engulfing patterns than H1." },
    ],
    bars: [...UP, { o: 50, c: 55, h: 56, l: 49 }, { o: 55.5, c: 44, h: 57, l: 43 }],
    patternBars: 2,
  },
  doji: {
    summary:
      "A doji is a candle where the open and close are almost the same, giving it a very thin body. It shows indecision between buyers and sellers.",
    identify: [
      "Body is 10% of the candle's range or less.",
      "Wicks on both sides (otherwise it is a dragonfly or gravestone doji).",
      "Range is reasonably large, so the candle reflects real two-way trading.",
    ],
    meaning:
      "Neither side won the session. After a strong move, a doji can signal that momentum is fading; inside a range it often means very little.",
    howTradersUseIt:
      "A doji is a neutral pattern. Traders use it as an early warning after a strong trend and look to the next candle for direction.",
    scannerRule: "Body ≤ 10% of the range and range at least 50% of the 10-candle average. Candles with one-sided wicks are classed as dragonfly or gravestone dojis instead.",
    faq: [
      { q: "Is a doji bullish or bearish?", a: "Neither. It shows indecision. Its meaning depends on the trend before it and the candle after it." },
      { q: "Why does the scanner find so many dojis?", a: "Dojis are common, especially on H1. The scanner filters out tiny candles, but dojis are still the most frequent pattern." },
    ],
    bars: [...RANGE, { o: 55, c: 55.4, h: 62, l: 48 }],
    patternBars: 1,
  },
  "dragonfly-doji": {
    summary:
      "A dragonfly doji opens, trades sharply lower and closes back at the open, leaving a long lower wick and no upper wick. It looks like a 'T'.",
    identify: [
      "Open and close at or near the high of the candle.",
      "Long lower wick (70% or more of the range).",
      "Little or no upper wick.",
    ],
    meaning:
      "Sellers pushed price down hard, but buyers took it all the way back. After a decline it suggests lower prices are being rejected.",
    howTradersUseIt: `It is treated like a stronger form of the hammer when it appears at support. ${CONFIRM}`,
    scannerRule: "Body ≤ 10% of the range, upper wick ≤ 10% of the range, lower wick ≥ 70% of the range, range at least 50% of the 10-candle average.",
    faq: [
      { q: "Is a dragonfly doji bullish?", a: "It leans bullish, especially after a decline. At the top of a rise it is a warning sign instead." },
      { q: "How is it different from a hammer?", a: "A hammer has a small but visible body. A dragonfly doji has almost no body at all." },
    ],
    bars: [...DOWN, { o: 50, c: 50.3, h: 50.6, l: 36 }],
    patternBars: 1,
  },
  "gravestone-doji": {
    summary:
      "A gravestone doji opens, rallies strongly and closes back at the open, leaving a long upper wick and no lower wick. It looks like an upside-down 'T'.",
    identify: [
      "Open and close at or near the low of the candle.",
      "Long upper wick (70% or more of the range).",
      "Little or no lower wick.",
    ],
    meaning:
      "Buyers pushed price up but sellers drove it all the way back. After a rise it shows that higher prices are being rejected.",
    howTradersUseIt: `It is treated like a stronger form of the shooting star at resistance. ${CONFIRM}`,
    scannerRule: "Body ≤ 10% of the range, lower wick ≤ 10% of the range, upper wick ≥ 70% of the range, range at least 50% of the 10-candle average.",
    faq: [
      { q: "Is a gravestone doji always bearish?", a: "It leans bearish, especially after a rise. Without a prior trend it mainly shows indecision." },
      { q: "What confirms a gravestone doji?", a: "A bearish candle that closes below the doji's low is the most common confirmation." },
    ],
    bars: [...UP, { o: 50, c: 50.3, h: 65, l: 49.7 }],
    patternBars: 1,
  },
  "morning-star": {
    summary:
      "The morning star is a three-candle bottom reversal: a long bearish candle, a small indecisive candle, then a strong bullish candle that closes well into the first candle's body.",
    identify: [
      "Appears after a short-term downtrend.",
      "Candle 1: long bearish body.",
      "Candle 2: small body (30% of candle 1's body or less), either colour.",
      "Candle 3: bullish, closing above the midpoint of candle 1's body.",
    ],
    meaning:
      "The first candle shows sellers in control, the second shows the selling pausing, and the third shows buyers taking over.",
    howTradersUseIt:
      "Because the pattern already includes its own confirmation candle, many traders act on the close of the third candle and place a stop below the pattern's low.",
    scannerRule:
      "Bearish candle 1 with body ≥ 10-candle average, candle 2 body ≤ 30% of candle 1, bullish candle 3 with body ≥ 50% of average closing above candle 1's midpoint, prior decline.",
    faq: [
      { q: "Does a morning star need a gap?", a: "In stocks the middle candle often gaps lower. Forex rarely gaps, so the scanner does not require one." },
      { q: "Is the morning star reliable?", a: "It is one of the more reliable reversal patterns, especially on H4 and D1 near support." },
    ],
    bars: [...DOWN, { o: 50, c: 38, h: 51, l: 37 }, { o: 38, c: 37, h: 40, l: 34 }, { o: 37, c: 48, h: 49, l: 36 }],
    patternBars: 3,
  },
  "evening-star": {
    summary:
      "The evening star is a three-candle top reversal: a long bullish candle, a small indecisive candle, then a strong bearish candle that closes well into the first candle's body.",
    identify: [
      "Appears after a short-term uptrend.",
      "Candle 1: long bullish body.",
      "Candle 2: small body (30% of candle 1's body or less), either colour.",
      "Candle 3: bearish, closing below the midpoint of candle 1's body.",
    ],
    meaning:
      "Buyers were in control, then stalled, then sellers took over. It is the bearish mirror of the morning star.",
    howTradersUseIt:
      "Traders often act on the close of the third candle and place a stop above the pattern's high.",
    scannerRule:
      "Bullish candle 1 with body ≥ 10-candle average, candle 2 body ≤ 30% of candle 1, bearish candle 3 with body ≥ 50% of average closing below candle 1's midpoint, prior rise.",
    faq: [
      { q: "What is the opposite of an evening star?", a: "The morning star, which forms at the bottom of a decline." },
      { q: "Can the middle candle be a doji?", a: "Yes. A doji in the middle (an 'evening doji star') is often considered stronger." },
    ],
    bars: [...UP, { o: 50, c: 62, h: 63, l: 49 }, { o: 62, c: 63, h: 66, l: 61 }, { o: 63, c: 52, h: 64, l: 51 }],
    patternBars: 3,
  },
  "bullish-harami": {
    summary:
      "A bullish harami is a long bearish candle followed by a small bullish candle that sits entirely inside the first candle's body.",
    identify: [
      "Appears after a short-term downtrend.",
      "Candle 1: long bearish body.",
      "Candle 2: bullish, with a body inside candle 1's body.",
      "Candle 2's body is half of candle 1's body or less.",
    ],
    meaning:
      "The strong selling of the first candle did not continue. The small inside candle shows the market pausing, which can come before a reversal.",
    howTradersUseIt: `The harami is a softer signal than an engulfing pattern. ${CONFIRM}`,
    scannerRule:
      "Bearish candle 1 with body ≥ 10-candle average, bullish candle 2 with body inside candle 1 and ≤ 50% of its size, prior decline.",
    faq: [
      { q: "What does 'harami' mean?", a: "It is Japanese for 'pregnant'. The small candle sits inside the large one like a baby inside its mother." },
      { q: "Harami vs engulfing: which is stronger?", a: "Engulfing patterns are generally stronger. A harami only shows a pause; an engulfing candle shows a full reversal of the previous session." },
    ],
    bars: [...DOWN, { o: 52, c: 38, h: 53, l: 37 }, { o: 41, c: 46, h: 47, l: 40 }],
    patternBars: 2,
  },
  "bearish-harami": {
    summary:
      "A bearish harami is a long bullish candle followed by a small bearish candle that sits entirely inside the first candle's body.",
    identify: [
      "Appears after a short-term uptrend.",
      "Candle 1: long bullish body.",
      "Candle 2: bearish, with a body inside candle 1's body.",
      "Candle 2's body is half of candle 1's body or less.",
    ],
    meaning: "The rally paused. The small inside candle shows buyers are no longer pushing, which can come before a reversal.",
    howTradersUseIt: `Treat it as a warning rather than a signal on its own. ${CONFIRM}`,
    scannerRule:
      "Bullish candle 1 with body ≥ 10-candle average, bearish candle 2 with body inside candle 1 and ≤ 50% of its size, prior rise.",
    faq: [
      { q: "Is a bearish harami a sell signal?", a: "Not on its own. It shows momentum slowing. Many traders wait for a close below the harami's low." },
      { q: "What is a harami cross?", a: "A harami where the second candle is a doji. It is often considered a stronger version." },
    ],
    bars: [...UP, { o: 48, c: 62, h: 63, l: 47 }, { o: 59, c: 54, h: 60, l: 53 }],
    patternBars: 2,
  },
  "tweezer-top": {
    summary:
      "A tweezer top is two candles with matching highs at the top of a rise: a bullish candle followed by a bearish one. The same price level is rejected twice.",
    identify: [
      "Appears after a short-term uptrend, at a fresh recent high.",
      "Candle 1 is bullish, candle 2 is bearish.",
      "Both highs are at almost the same price.",
    ],
    meaning: "Buyers failed to break the same level twice in a row, which suggests resistance and a possible turn lower.",
    howTradersUseIt: `The matching highs give a clear level for a stop. ${CONFIRM}`,
    scannerRule:
      "Bullish then bearish candle, highs within 5% of the average range, both candles at least half the average range, highs at a 5-candle high, prior rise.",
    faq: [
      { q: "How close do the highs need to be?", a: "Ideally identical. The scanner allows a small tolerance (5% of the average candle range) because prices rarely match to the last decimal." },
      { q: "Is a tweezer top a strong pattern?", a: "It is moderate. It is more meaningful on H4 and D1, and at known resistance." },
    ],
    bars: [...UP, { o: 50, c: 58, h: 62, l: 49 }, { o: 58, c: 51, h: 62, l: 50 }],
    patternBars: 2,
  },
  "tweezer-bottom": {
    summary:
      "A tweezer bottom is two candles with matching lows at the bottom of a decline: a bearish candle followed by a bullish one. The same price level holds twice.",
    identify: [
      "Appears after a short-term downtrend, at a fresh recent low.",
      "Candle 1 is bearish, candle 2 is bullish.",
      "Both lows are at almost the same price.",
    ],
    meaning: "Sellers failed to break the same level twice, which suggests support and a possible turn higher.",
    howTradersUseIt: `The matching lows give a clear level for a stop. ${CONFIRM}`,
    scannerRule:
      "Bearish then bullish candle, lows within 5% of the average range, both candles at least half the average range, lows at a 5-candle low, prior decline.",
    faq: [
      { q: "What is the opposite of a tweezer bottom?", a: "The tweezer top, which forms at the top of a rise with matching highs." },
      { q: "Can a tweezer bottom also be another pattern?", a: "Yes. The second candle is sometimes also a bullish engulfing or a hammer, which strengthens the signal. The scanner lists each pattern separately." },
    ],
    bars: [...DOWN, { o: 50, c: 42, h: 51, l: 38 }, { o: 42, c: 49, h: 50, l: 38 }],
    patternBars: 2,
  },
};
