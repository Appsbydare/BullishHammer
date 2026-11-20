import type { Broker } from "@/lib/data";
import AffiliateBanner from "./AffiliateBanner";

/** Vertical banner column (desktop only). Shows the first active broker that has a banner. */
export default function BrokerAside({ brokers }: { brokers: Broker[] }) {
  const b = brokers.find((x) => x.banner_src && x.banner_width && x.banner_height);
  if (!b) return null;
  return (
    <aside className="aside-banner" aria-label="Sponsored">
      <div className="aside-sticky">
        <AffiliateBanner
          broker={b.broker}
          name={b.name}
          src={b.banner_src!}
          width={b.banner_width!}
          height={b.banner_height!}
          blockedCountries={b.blocked_countries}
        />
      </div>
    </aside>
  );
}
