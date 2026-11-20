import type { Broker } from "@/lib/data";
import { AFFILIATE_NOTE, RISK_WARNING } from "@/lib/site";

/** "Open an account" box for a broker review. Renders nothing until the broker has an active tracking link. */
export default function BrokerCta({ broker, name, brokers, from }: { broker: string; name: string; brokers: Broker[]; from: string }) {
  const b = brokers.find((x) => x.broker === broker && x.url);
  if (!b) return null;
  return (
    <div className="cta-box">
      <div>
        <h3>Open an account with {name}</h3>
        <p>Sign-up takes a few minutes. You can start on a free demo account.</p>
        <p className="cta-risk">
          {AFFILIATE_NOTE} {RISK_WARNING}
        </p>
      </div>
      <a className="btn btn-gold" href={`/go/${b.broker}?from=${encodeURIComponent(from)}`} rel="nofollow sponsored noopener" target="_blank">
        Visit {name}
      </a>
    </div>
  );
}
