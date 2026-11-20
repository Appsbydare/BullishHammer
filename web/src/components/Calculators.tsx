"use client";

import { useMemo, useState } from "react";
import { ACCOUNT_CURRENCIES, INSTRUMENTS, fmt, margin, pipValue, usdValues, type Instrument } from "@/lib/instruments";

type RatesProps = { rates: Record<string, number>; asOf: string | null };

function useUsd(rates: Record<string, number>) {
  return useMemo(() => usdValues(rates), [rates]);
}

function InstrumentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor="c-inst">Instrument</label>
      <select id="c-inst" className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {INSTRUMENTS.map((i) => (
          <option key={i.symbol} value={i.symbol}>
            {i.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AccountSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor="c-acct">Account currency</label>
      <select id="c-acct" className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {ACCOUNT_CURRENCIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField(props: { id: string; label: string; value: string; onChange: (v: string) => void; step?: string; suffix?: string }) {
  return (
    <div className="field">
      <label htmlFor={props.id}>
        {props.label}
        {props.suffix ? <span className="muted"> ({props.suffix})</span> : null}
      </label>
      <input
        id={props.id}
        className="input num"
        type="number"
        inputMode="decimal"
        min="0"
        step={props.step ?? "any"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}

function RatesNote({ asOf }: { asOf: string | null }) {
  return (
    <p className="tiny muted" style={{ marginTop: 16, marginBottom: 0 }}>
      Currency conversion uses indicative rates from our hourly update
      {asOf ? ` (${new Date(asOf).toUTCString().slice(5, 22)} UTC)` : ""}. Results are estimates; contract sizes vary by
      broker and account type.
    </p>
  );
}

const inst = (symbol: string): Instrument => INSTRUMENTS.find((i) => i.symbol === symbol) ?? INSTRUMENTS[0];
const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

export function PositionSizeCalculator({ rates, asOf }: RatesProps) {
  const usd = useUsd(rates);
  const [symbol, setSymbol] = useState("EURUSD");
  const [account, setAccount] = useState("USD");
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [sl, setSl] = useState("25");

  const i = inst(symbol);
  const riskAmount = (num(balance) * num(riskPct)) / 100;
  const pvLot = pipValue(i, 1, account, usd);
  const rawLots = riskAmount / (num(sl) * pvLot);
  const lots = Math.floor(rawLots * 100) / 100;

  return (
    <div className="calc">
      <div className="card calc-form">
        <div className="calc-row">
          <AccountSelect value={account} onChange={setAccount} />
          <NumberField id="c-bal" label="Account balance" value={balance} onChange={setBalance} />
        </div>
        <div className="calc-row">
          <NumberField id="c-risk" label="Risk" suffix="%" value={riskPct} onChange={setRiskPct} step="0.1" />
          <NumberField id="c-sl" label="Stop loss" suffix="pips" value={sl} onChange={setSl} step="0.1" />
        </div>
        <InstrumentSelect value={symbol} onChange={setSymbol} />
      </div>
      <div className="result" aria-live="polite">
        <div className="result-label">Position size</div>
        <div className="result-main">{Number.isFinite(lots) && lots >= 0 ? `${fmt(lots)} lots` : "—"}</div>
        <div className="result-list">
          <div>
            <span>Amount at risk</span>
            <span>
              {fmt(riskAmount)} {account}
            </span>
          </div>
          <div>
            <span>Pip value per 1.00 lot</span>
            <span>
              {fmt(pvLot)} {account}
            </span>
          </div>
          <div>
            <span>Units</span>
            <span>{Number.isFinite(lots) ? fmt(lots * i.contract, 0) : "—"}</span>
          </div>
          <div>
            <span>Exact size (before rounding down)</span>
            <span>{fmt(rawLots, 3)} lots</span>
          </div>
        </div>
        <RatesNote asOf={asOf} />
      </div>
    </div>
  );
}

export function PipValueCalculator({ rates, asOf }: RatesProps) {
  const usd = useUsd(rates);
  const [symbol, setSymbol] = useState("EURUSD");
  const [account, setAccount] = useState("USD");
  const [lots, setLots] = useState("1");
  const i = inst(symbol);
  const pv = pipValue(i, num(lots), account, usd);

  return (
    <div className="calc">
      <div className="card calc-form">
        <InstrumentSelect value={symbol} onChange={setSymbol} />
        <div className="calc-row">
          <NumberField id="c-lots" label="Position size" suffix="lots" value={lots} onChange={setLots} step="0.01" />
          <AccountSelect value={account} onChange={setAccount} />
        </div>
      </div>
      <div className="result" aria-live="polite">
        <div className="result-label">Value of one pip</div>
        <div className="result-main">
          {fmt(pv)} {account}
        </div>
        <div className="result-list">
          <div>
            <span>Pip size</span>
            <span>{i.pip}</span>
          </div>
          <div>
            <span>Standard lot (1.00)</span>
            <span>
              {fmt(pipValue(i, 1, account, usd))} {account}
            </span>
          </div>
          <div>
            <span>Mini lot (0.10)</span>
            <span>
              {fmt(pipValue(i, 0.1, account, usd))} {account}
            </span>
          </div>
          <div>
            <span>Micro lot (0.01)</span>
            <span>
              {fmt(pipValue(i, 0.01, account, usd), 3)} {account}
            </span>
          </div>
        </div>
        <RatesNote asOf={asOf} />
      </div>
    </div>
  );
}

const LEVERAGES = [1, 10, 20, 30, 50, 100, 200, 300, 400, 500, 1000];

export function MarginCalculator({ rates, asOf }: RatesProps) {
  const usd = useUsd(rates);
  const [symbol, setSymbol] = useState("EURUSD");
  const [account, setAccount] = useState("USD");
  const [lots, setLots] = useState("1");
  const [leverage, setLeverage] = useState("30");
  const i = inst(symbol);
  const m = margin(i, num(lots), Number(leverage), account, usd);
  const notional = margin(i, num(lots), 1, account, usd);

  return (
    <div className="calc">
      <div className="card calc-form">
        <InstrumentSelect value={symbol} onChange={setSymbol} />
        <div className="calc-row">
          <NumberField id="c-lots" label="Position size" suffix="lots" value={lots} onChange={setLots} step="0.01" />
          <div className="field">
            <label htmlFor="c-lev">Leverage</label>
            <select id="c-lev" className="input" value={leverage} onChange={(e) => setLeverage(e.target.value)}>
              {LEVERAGES.map((l) => (
                <option key={l} value={l}>
                  1:{l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <AccountSelect value={account} onChange={setAccount} />
      </div>
      <div className="result" aria-live="polite">
        <div className="result-label">Required margin</div>
        <div className="result-main">
          {fmt(m)} {account}
        </div>
        <div className="result-list">
          <div>
            <span>Position value</span>
            <span>
              {fmt(notional)} {account}
            </span>
          </div>
          <div>
            <span>Units</span>
            <span>{fmt(num(lots) * i.contract, 0)}</span>
          </div>
          <div>
            <span>Margin as % of position</span>
            <span>{fmt(100 / Number(leverage))}%</span>
          </div>
        </div>
        <RatesNote asOf={asOf} />
      </div>
    </div>
  );
}
