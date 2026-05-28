function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pct >= 80 ? "bg-(--success)" : pct >= 60 ? "bg-(--warning)" : "bg-(--text-secondary)";
  const pctColor =
    pct >= 80 ? "text-(--success)" : pct >= 60 ? "text-(--warning)" : "text-(--text-secondary)";

  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        <span className="text-[26px] font-semibold leading-none tracking-tight text-foreground">
          {score}
        </span>
        <span className="text-sm text-(--text-secondary)">/ {max}</span>
        <span className={["ml-auto text-[13px] font-semibold", pctColor].join(" ")}>
          {pct}%{pct >= 80 ? " · Strong" : pct >= 60 ? " · Conditional" : " · Weak"}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-(--surface-raised) relative overflow-visible">
        <div
          className={["absolute inset-0 rounded-full", barColor].join(" ")}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute -top-0.75 -bottom-0.75 w-px bg-border" style={{ left: "60%" }} />
        <div className="absolute -top-0.75 -bottom-0.75 w-px bg-border" style={{ left: "80%" }} />
      </div>
    </div>
  );
}

export default ScoreBar;
