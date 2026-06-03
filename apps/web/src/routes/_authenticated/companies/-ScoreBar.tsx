interface Props {
  score: number;
  max: number;
  showLabels?: boolean;
  scoreSize?: "sm" | "lg";
}

function ScoreBar({ score, max, showLabels = false, scoreSize = "sm" }: Props) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pct >= 80 ? "bg-(--success)" : pct >= 60 ? "bg-(--warning)" : "bg-(--text-secondary)";
  const pctColor =
    pct >= 80 ? "text-(--success)" : pct >= 60 ? "text-(--warning)" : "text-(--text-secondary)";

  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        <span
          className={[
            "font-semibold leading-none tracking-tight text-foreground",
            scoreSize === "lg" ? "text-[32px]" : "text-[26px]",
          ].join(" ")}
        >
          {score}
        </span>
        <span className="text-sm text-(--text-secondary)">/ {max}</span>
        <span
          className={[
            "ml-auto font-semibold",
            scoreSize === "lg" ? "text-sm" : "text-[13px]",
            pctColor,
          ].join(" ")}
        >
          {pct}%
          {!showLabels && (pct >= 80 ? " · Strong" : pct >= 60 ? " · Conditional" : " · Weak")}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-(--surface-raised) relative overflow-visible">
        <div
          className={["absolute inset-0 rounded-full overflow-hidden", barColor].join(" ")}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute -top-0.75 -bottom-0.75 w-px bg-border left-[60%]" />
        <div className="absolute -top-0.75 -bottom-0.75 w-px bg-border left-[80%]" />
      </div>
      {showLabels && (
        <div className="flex justify-between text-[11px] font-medium text-(--text-secondary) mt-2">
          <span>Weak</span>
          <span>Conditional 60%</span>
          <span>Strong 80%</span>
        </div>
      )}
    </div>
  );
}

export default ScoreBar;
