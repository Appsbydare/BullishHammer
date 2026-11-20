import { requireAdmin } from "@/lib/auth";
import { FACTS, SECTIONS, getBrokerReviews } from "@/lib/brokers";
import BrokerForm from "./BrokerForm";

export default async function AdminBrokers() {
  await requireAdmin();
  const reviews = await getBrokerReviews();
  const facts = FACTS.map((f) => ({ key: f.key, label: f.label }));
  const sections = SECTIONS.map((s) => ({ key: s.key, label: s.label }));

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Broker reviews</h1>
          <p className="muted small">
            Content for /brokers, /brokers/xm and /brokers/ic-markets. The starter figures came from public sources;
            check each one on the broker&apos;s own site, then set the &quot;last checked&quot; date.
          </p>
        </div>
      </div>
      <div className="admin-grid-2" style={{ alignItems: "start" }}>
        {reviews.map((r) => (
          <BrokerForm
            key={r.page.broker}
            broker={r.page.broker}
            name={r.page.name}
            slug={r.page.slug}
            facts={facts}
            sections={sections}
            values={{ facts: r.facts, sections: r.sections, lastChecked: r.lastChecked }}
          />
        ))}
      </div>
    </>
  );
}
