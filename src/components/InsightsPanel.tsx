"use client";

import {
  Banknote,
  Gauge,
  Scale,
  Skull,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type {
  ExpandedInsights,
  PricingBenchmark,
  RegulatoryFlag,
} from "@/lib/types";

function Card({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[color:var(--accent)]">{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ConfidencePill({
  confidence,
}: {
  confidence: "low" | "medium" | "high";
}) {
  const tone =
    confidence === "high"
      ? "bg-[color:var(--good)]/15 text-[color:var(--good)]"
      : confidence === "medium"
        ? "bg-[color:var(--warn)]/15 text-[color:var(--warn)]"
        : "bg-[color:var(--muted)]/15 text-[color:var(--muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium ${tone}`}
    >
      {confidence} confidence
    </span>
  );
}

function SeverityPill({
  severity,
}: {
  severity: RegulatoryFlag["severity"];
}) {
  const tone =
    severity === "high"
      ? "bg-[color:var(--bad)]/15 text-[color:var(--bad)]"
      : severity === "medium"
        ? "bg-[color:var(--warn)]/15 text-[color:var(--warn)]"
        : "bg-[color:var(--muted)]/15 text-[color:var(--muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium ${tone}`}
    >
      {severity}
    </span>
  );
}

function ModelPill({ model }: { model: PricingBenchmark["model"] }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted)]">
      {model}
    </span>
  );
}

export default function InsightsPanel({
  insights,
}: {
  insights: ExpandedInsights;
}) {
  const {
    marketSize,
    fundingSignal,
    graveyard,
    buildEffort,
    regulatoryFlags,
    pricingBenchmarks,
  } = insights;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card icon={<TrendingUp size={18} />} title="Market size">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-2xl font-semibold">{marketSize.range}</div>
            <ConfidencePill confidence={marketSize.confidence} />
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            {marketSize.reasoning}
          </p>
        </Card>

        <Card icon={<Gauge size={18} />} title="Build effort">
          <div className="text-2xl font-semibold mb-1">{buildEffort.bucket}</div>
          <div className="text-xs text-[color:var(--muted)] mb-3">
            {buildEffort.teamSize}
          </div>
          <div className="text-sm">
            <span className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium block mb-1">
              Headline risk
            </span>
            {buildEffort.headlineRisk}
          </div>
        </Card>

        <Card icon={<Scale size={18} />} title="Regulatory flags">
          {regulatoryFlags.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              No material regulatory burden identified for this idea.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {regulatoryFlags.map((flag, i) => (
                <li key={`${flag.domain}-${i}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">{flag.domain}</span>
                    <SeverityPill severity={flag.severity} />
                  </div>
                  <div className="text-[color:var(--muted)] text-xs">
                    {flag.note}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card icon={<Banknote size={18} />} title="Funding signal">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
          <div className="text-2xl font-semibold">
            {fundingSignal.totalRaisedInSpace}
          </div>
          <div className="text-sm text-[color:var(--muted)]">
            {fundingSignal.summary}
          </div>
        </div>
        {fundingSignal.notableRaises.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium text-left">
                  <th className="py-2 pr-3 font-medium">Company</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Stage</th>
                  <th className="py-2 pr-3 font-medium">Year</th>
                </tr>
              </thead>
              <tbody>
                {fundingSignal.notableRaises.map((raise, i) => (
                  <tr
                    key={`${raise.company}-${i}`}
                    className="border-t border-[color:var(--border)]"
                  >
                    <td className="py-2 pr-3 font-medium">{raise.company}</td>
                    <td className="py-2 pr-3">{raise.amount}</td>
                    <td className="py-2 pr-3 text-[color:var(--muted)]">
                      {raise.stage ?? "—"}
                    </td>
                    <td className="py-2 pr-3 text-[color:var(--muted)]">
                      {raise.year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {graveyard.length > 0 && (
        <Card icon={<Skull size={18} />} title="Graveyard">
          <p className="text-xs text-[color:var(--muted)] mb-3">
            Predecessors that tried something similar and didn&apos;t make it.
            Worth understanding before repeating their path.
          </p>
          <ul className="space-y-3">
            {graveyard.map((entry, i) => (
              <li
                key={`${entry.name}-${i}`}
                className="rounded-lg border border-[color:var(--border)] p-3"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{entry.name}</div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {entry.year}
                  </div>
                </div>
                <div className="text-sm text-[color:var(--muted)]">
                  {entry.reason}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {pricingBenchmarks.length > 0 && (
        <Card icon={<Wallet size={18} />} title="Pricing benchmarks">
          <p className="text-xs text-[color:var(--muted)] mb-3">
            What comparable tools charge today — useful when setting your own
            price.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium text-left">
                  <th className="py-2 pr-3 font-medium">Competitor</th>
                  <th className="py-2 pr-3 font-medium">Free tier</th>
                  <th className="py-2 pr-3 font-medium">Paid tier</th>
                  <th className="py-2 pr-3 font-medium">Model</th>
                </tr>
              </thead>
              <tbody>
                {pricingBenchmarks.map((row, i) => (
                  <tr
                    key={`${row.competitor}-${i}`}
                    className="border-t border-[color:var(--border)]"
                  >
                    <td className="py-2 pr-3 font-medium">{row.competitor}</td>
                    <td className="py-2 pr-3 text-[color:var(--muted)]">
                      {row.freeTier}
                    </td>
                    <td className="py-2 pr-3">{row.paidTier}</td>
                    <td className="py-2 pr-3">
                      <ModelPill model={row.model} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
