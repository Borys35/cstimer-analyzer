"use client";

interface ScoreboardHeroProps {
  headline: number | null;
  tier: string | null;
  subscores: {
    improvement: number | null;
    consistency: number | null;
    frequency: number | null;
  };
  weights: {
    improvement: string;
    consistency: string;
    frequency: string;
  };
  trendLabel: string | null;
}

const TIER_COLORS: Record<string, string> = {
  good: "var(--green)",
  decent: "var(--amber)",
  bad: "var(--cube-orange)",
  horrible: "var(--red)",
};

const TIER_LABELS: Record<string, string> = {
  good: "Good",
  decent: "Decent",
  bad: "Needs work",
  horrible: "Rough",
};

function GaugeRing({ score, color }: { score: number; color: string }) {
  const r = 82;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke="var(--track)"
        strokeWidth="10"
      />
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
      <text
        x="100"
        y="92"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "48px",
          fontWeight: 700,
          fill: "var(--text)",
        }}
      >
        {score}
      </text>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          fontWeight: 500,
          fill: "var(--text-dim)",
          letterSpacing: "0.05em",
        }}
      >
        / 100
      </text>
    </svg>
  );
}

function SubScoreBar({
  label,
  score,
  weight,
  color,
}: {
  label: string;
  score: number | null;
  weight: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium text-[var(--text)]">{label}</span>
        <span className="font-mono text-xs text-[var(--text-dim)]">
          {score != null ? score : "-"}/100
          <span className="ml-1 text-[var(--text-faint)]">({weight})</span>
        </span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: `${score ?? 0}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default function ScoreboardHero({
  headline,
  tier,
  subscores,
  weights,
  trendLabel,
}: ScoreboardHeroProps) {
  const score = headline ?? 0;
  const color = tier ? TIER_COLORS[tier] ?? "var(--amber)" : "var(--amber)";

  return (
    <div className="card score-hero">
      <div className="score-hero-gauge flex flex-col items-center gap-2">
        <GaugeRing score={score} color={color} />
        {tier && (
          <span className={`tier-pill tier-pill-${tier}`}>
            {TIER_LABELS[tier] ?? tier}
          </span>
        )}
        {trendLabel && (
          <span className="text-xs text-[var(--text-faint)]">{trendLabel}</span>
        )}
      </div>
      <div className="score-hero-bars space-y-4">
        <SubScoreBar
          label="Improvement"
          score={subscores.improvement}
          weight={weights.improvement}
          color="var(--cube-red)"
        />
        <SubScoreBar
          label="Consistency"
          score={subscores.consistency}
          weight={weights.consistency}
          color="var(--cube-blue)"
        />
        <SubScoreBar
          label="Frequency"
          score={subscores.frequency}
          weight={weights.frequency}
          color="var(--amber)"
        />
      </div>
    </div>
  );
}
