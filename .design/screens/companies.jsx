// companies.jsx — list + detail variants (mobile + desktop)

/* ============================================================
   Mobile — /companies list
   ============================================================ */
function CompanyListRow({ co }) {
  return (
    <a className="m-row">
      <Avatar name={co.name} sz="md" />
      <div className="col grow" style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="name">{co.name}</span>
          {co.ethics && <Icon name="warning" size={13} color="var(--warning)" />}
        </div>
        <span className="meta">
          {co.industry} · {co.size}
        </span>
      </div>
      <div className="right">
        <Badge fit={co.fitBand} sm />
        <span className="meta">
          {co.score}/{co.max}
        </span>
      </div>
      <Icon name="chevR" size={16} color="var(--text-muted)" className="chev" />
    </a>
  );
}

const MobileCompanies = () => (
  <MShell
    tabbar={<MTabBar active="companies" />}
    fab={
      <button className="m-fab">
        <Icon name="plus" size={22} color="#fff" />
      </button>
    }
  >
    <div className="m-header">
      <div className="title">Companies</div>
      <button className="ico-btn">
        <Icon name="search" size={18} />
      </button>
      <button className="ico-btn">
        <Icon name="filter" size={18} />
      </button>
    </div>

    <div className="m-chips">
      <button className="m-chip active">
        All <span className="count">10</span>
      </button>
      <button className="m-chip">
        Needs review <span className="count">3</span>
      </button>
      <button className="m-chip">
        Strong fit <span className="count">6</span>
      </button>
      <button className="m-chip">Accepted</button>
      <button className="m-chip">Contacts added</button>
      <button className="m-chip">Disqualified</button>
    </div>

    <div className="m-body surface" style={{ background: "var(--surface)" }}>
      <div
        style={{
          padding: "12px 16px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          Needs review <span className="count">3</span>
        </div>
        <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--text-muted)" }}>
          Sort: Updated
        </span>
      </div>
      {COMPANIES.filter((c) => c.status === "waiting_human").map((co) => (
        <CompanyListRow key={co.id} co={co} />
      ))}

      <div style={{ padding: "20px 16px 6px" }}>
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          In progress <span className="count">7</span>
        </div>
      </div>
      {COMPANIES.filter((c) => c.status !== "waiting_human")
        .slice(0, 6)
        .map((co) => (
          <CompanyListRow key={co.id} co={co} />
        ))}
    </div>
  </MShell>
);

/* ============================================================
   Mobile — /companies/[id] detail (scoring inline editable)
   ============================================================ */
function CompanyDetailBase({ company, ethics = false }) {
  const scores = ethics ? SAMPLE_FIT_SCORES_ETHICS : SAMPLE_FIT_SCORES;
  const total = computeScore(scores);
  const max = computeMax(scores);
  const pct = Math.round((total / max) * 100);
  const fitBand = pct >= 80 ? "strong_fit" : pct >= 60 ? "conditional_fit" : "weak_fit";

  return (
    <MShell>
      <div className="m-header">
        <button className="ico-btn back">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="col grow" style={{ minWidth: 0 }}>
          <div className="title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {company.name}
            {ethics && <Icon name="warning" size={15} color="var(--warning)" />}
          </div>
          <div className="sub">
            {company.industry} · {company.size}
          </div>
        </div>
        <button className="ico-btn">
          <Icon name="more" size={18} />
        </button>
      </div>

      <div className="m-body">
        {/* Header card */}
        <div className="m-section" style={{ paddingTop: 12 }}>
          <div
            className="m-card"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}
          >
            <Avatar name={company.name} sz="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Badge fit={fitBand} />
                <Badge status="waiting_human" sm />
              </div>
              <div
                style={{
                  font: "400 12px/1.4 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 8,
                }}
              >
                <a href="#" style={{ color: "var(--accent-text)" }}>
                  {company.website}
                </a>{" "}
                · {company.location || "Bengaluru"}
              </div>
            </div>
          </div>
        </div>

        {/* Score summary */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  font: "600 32px/1 var(--font-sans)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {total}
              </span>
              <span style={{ font: "400 14px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                / {max}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  font: "600 14px/1 var(--font-sans)",
                  color:
                    pct >= 80
                      ? "var(--success)"
                      : pct >= 60
                        ? "var(--warning)"
                        : "var(--text-secondary)",
                }}
              >
                {pct}%
              </span>
            </div>
            <div
              style={{
                marginTop: 10,
                height: 6,
                borderRadius: 3,
                background: "var(--surface-2)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: pct + "%",
                  background:
                    pct >= 80
                      ? "var(--success)"
                      : pct >= 60
                        ? "var(--warning)"
                        : "var(--text-secondary)",
                }}
              />
              {/* threshold markers */}
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  bottom: -3,
                  left: "60%",
                  width: 1,
                  background: "var(--border-strong)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  bottom: -3,
                  left: "80%",
                  width: 1,
                  background: "var(--border-strong)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                font: "500 11px/1 var(--font-sans)",
                color: "var(--text-muted)",
                marginTop: 8,
              }}
            >
              <span>Weak</span>
              <span>Conditional 60%</span>
              <span>Strong 80%</span>
            </div>
          </div>
        </div>

        {/* User context */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-card" style={{ padding: 16 }}>
            <div className="m-section-label" style={{ marginBottom: 8 }}>
              Your context for AI
            </div>
            <textarea
              className="m-textarea"
              defaultValue="Met a Razorpay PM at a hackathon in March. They were rebuilding the merchant onboarding flow and emphasised 'no surveillance, ever' in product. Worth raising in interview."
              placeholder="Anything you know about this company (injected into AI scoring)."
              rows={3}
            />
          </div>
        </div>

        {/* Ethics callout */}
        {ethics && (
          <div className="m-section" style={{ paddingTop: 0 }}>
            <div className="m-callout danger">
              <strong style={{ color: "var(--danger-text)" }}>Ethics flag.</strong> CRED has 4
              Glassdoor reviews citing "growth at any cost" culture and one regulatory probe (2024)
              into rewards-card data sharing. Does not auto-disqualify — confirm before accepting.
            </div>
          </div>
        )}

        {/* Pre-filters */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">Stage 1 · Pre-filters</div>
          <div className="m-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Icon name="ok" size={16} color="var(--success)" />
              <div
                style={{
                  flex: 1,
                  font: "500 13px/1.3 var(--font-sans)",
                  color: "var(--text-primary)",
                }}
              >
                Salary band
              </div>
              <span className="m-badge success sm">Pass</span>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="ok" size={16} color="var(--success)" />
              <div style={{ flex: 1 }}>
                <div
                  style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}
                >
                  Location
                </div>
                <div
                  style={{
                    font: "400 11.5px/1.3 var(--font-sans)",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Bengaluru + Remote India
                </div>
              </div>
              <span className="m-badge success sm">Pass</span>
            </div>
          </div>
        </div>

        {/* AI summary */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">
            <span className="spark">✦</span> AI research summary
          </div>
          <div className="m-ai-box">
            {ethics
              ? "CRED is well-funded (Series F, 2022) and has shipped notable engineering at scale. However, repeated culture flags on Glassdoor cite long hours and aggressive growth targets. 2024 RBI probe into rewards-card data-sharing remains unresolved. Strong technical environment, weak culture/ethics signals."
              : "Razorpay's payments infrastructure team has been one of India's most stable engineering shops since 2020. Average tenure on the LinkedIn payments team is 3.1 years (vs. 1.8 industry median). Glassdoor WLB 4.0. Eng blog active. Recent layoff news from Q3 2024 was non-engineering only. Confidence: high."}
          </div>
        </div>

        {/* Scored criteria — inline stepper */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">
            Stage 3 · Scored criteria
            <span className="right">Tap to edit</span>
          </div>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {scores.map((s, i) => (
              <div
                key={s.name}
                className="m-score-row"
                style={i === scores.length - 1 ? { borderBottom: "none" } : {}}
              >
                <div>
                  <div className="crit">
                    {s.name}
                    <span className="weight">· w{s.weight}</span>
                  </div>
                  <div className={`confidence ${s.confidence === "low" ? "low" : ""}`}>
                    {s.confidence === "low" && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          background: "var(--amber)",
                          marginRight: 4,
                        }}
                      />
                    )}
                    {s.confidence === "high"
                      ? "High confidence"
                      : s.confidence === "medium"
                        ? "Medium confidence"
                        : "Low confidence — limited signals"}
                  </div>
                </div>
                <div className="m-stepper">
                  <button>
                    <Icon name="minus" size={14} />
                  </button>
                  <span className="val">{s.score}</span>
                  <button>
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="m-actionbar">
        <button className="m-btn danger">Reject</button>
        <button className="m-btn primary full">Accept · find contacts</button>
      </div>
    </MShell>
  );
}

const MobileCompanyDetail = () => (
  <CompanyDetailBase company={COMPANIES.find((c) => c.id === "co1")} />
);
const MobileCompanyEthics = () => (
  <CompanyDetailBase company={COMPANIES.find((c) => c.id === "co3")} ethics />
);

/* ============================================================
   /companies/[id]/contacts — linked contacts subpage
   ============================================================ */
const MobileCompanyContacts = () => {
  const co = COMPANIES.find((c) => c.id === "co1");
  const cos = CONTACTS.filter((c) => c.companyId === "co1");
  return (
    <MShell>
      <div className="m-header">
        <button className="ico-btn back">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="col grow" style={{ minWidth: 0 }}>
          <div className="title">Contacts at {co.name}</div>
          <div className="sub">
            {cos.length} people · {cos.filter((c) => c.status !== "not_started").length} in pipeline
          </div>
        </div>
        <button className="ico-btn">
          <Icon name="plus" size={20} />
        </button>
      </div>

      <div className="m-body surface" style={{ background: "var(--surface)" }}>
        <div style={{ padding: "12px 16px 6px" }}>
          <div className="m-section-label" style={{ marginBottom: 0 }}>
            Found via Apollo <span className="count">{cos.length}</span>
          </div>
        </div>
        {cos.map((c) => (
          <a key={c.id} className="m-row">
            <Avatar name={c.name} sz="md" warm={c.status === "draft_ready"} />
            <div className="col grow" style={{ minWidth: 0 }}>
              <div className="name">{c.name}</div>
              <div className="meta">{c.designation}</div>
            </div>
            <div className="right">
              <Badge status={c.status} sm />
              {c.touch > 0 && <span className="meta">Touch {c.touch}</span>}
            </div>
            <Icon name="chevR" size={16} color="var(--text-muted)" className="chev" />
          </a>
        ))}

        <div className="m-section">
          <button className="m-btn secondary full">
            <Icon name="plus" size={16} /> Add contact manually
          </button>
        </div>

        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">Apollo enrichment log</div>
          <div className="m-card" style={{ padding: 14, background: "var(--surface-2)" }}>
            <div style={{ font: "400 12px/1.7 var(--font-sans)", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Stubs returned</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>5</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Skipped pre-dedup</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>1</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Enriched</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>4</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Dedup by LinkedIn URL</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>2</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Apollo credits used</span>
                <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MShell>
  );
};

/* ============================================================
   DESKTOP — /companies (table + side panel)
   ============================================================ */
const DesktopCompanies = () => {
  const company = COMPANIES.find((c) => c.id === "co2");
  const scores = SAMPLE_FIT_SCORES.map((s) => ({
    ...s,
    score: s.name === "Manager Quality & Role Clarity" ? 3 : s.score,
  }));
  const total = computeScore(scores);
  const max = computeMax(scores);
  const pct = Math.round((total / max) * 100);

  return (
    <div className="iso-screen">
      <div className="d-screen">
        <DSidebar active="companies" />
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* LEFT */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRight: "1px solid var(--border)",
            }}
          >
            <header className="d-topbar">
              <div className="title">Companies</div>
              <div className="right">
                <button className="d-btn ghost">
                  <Icon name="search" size={14} />
                </button>
                <button className="d-btn secondary">
                  <Icon name="plus" size={13} /> Add company
                </button>
              </div>
            </header>
            <div className="d-filters">
              <button className="d-chip">
                <span className="lbl">Status:</span> <span className="val">Needs review</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Fit:</span> <span className="val">All bands</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Updated:</span> <span className="val">Anytime</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                {COMPANIES.length} companies
              </span>
            </div>
            <div style={{ overflow: "auto", flex: 1, background: "var(--bg)" }}>
              <div
                className="d-thead"
                style={{ gridTemplateColumns: "2fr 1.4fr 100px 110px 110px 90px" }}
              >
                <div>Name</div>
                <div>Industry</div>
                <div>Fit</div>
                <div>Score</div>
                <div>Status</div>
                <div>Updated</div>
              </div>
              {COMPANIES.map((co) => (
                <div
                  key={co.id}
                  className={`d-trow ${co.id === company.id ? "active" : ""}`}
                  style={{ gridTemplateColumns: "2fr 1.4fr 100px 110px 110px 90px" }}
                >
                  <div>
                    <div
                      className="d-cell-name"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {co.name}
                      {co.ethics && <Icon name="warning" size={13} color="var(--warning)" />}
                    </div>
                    <div className="d-cell-sub">{co.website}</div>
                  </div>
                  <div>
                    <div
                      className="d-cell-name"
                      style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)" }}
                    >
                      {co.industry}
                    </div>
                    <div className="d-cell-sub">{co.size}</div>
                  </div>
                  <div>
                    <Badge fit={co.fitBand} sm />
                  </div>
                  <div>
                    <div className="d-cell-accent">
                      {co.score}
                      <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>/{co.max}</span>
                    </div>
                    <div className="d-cell-sub">{Math.round((co.score / co.max) * 100)}%</div>
                  </div>
                  <div>
                    <Badge status={co.status} sm />
                  </div>
                  <div className="d-cell-meta">{co.updated}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: full-height panel */}
          <aside
            className="d-panel"
            style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div className="head" style={{ flexShrink: 0 }}>
              <div className="head-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={company.name} sz="md" />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{company.name}</div>
                    <div className="sub">
                      <a href="#" style={{ color: "var(--accent-text)" }}>
                        {company.website}
                      </a>{" "}
                      · {company.industry}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <button className="d-icon-btn" style={{ fontSize: 14 }}>
                    ⛶
                  </button>
                  <button className="d-icon-btn" style={{ fontSize: 14 }}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="meta-row">
                <Badge status={company.status} />
                <Badge fit={company.fitBand} />
                <span
                  style={{
                    marginLeft: "auto",
                    font: "400 11px/1 var(--font-sans)",
                    color: "var(--text-muted)",
                  }}
                >
                  Updated {company.updated}
                </span>
              </div>
            </div>
            <div className="body" style={{ flex: 1, overflow: "auto" }}>
              <div className="section">
                <div className="sl">Your context for AI</div>
                <textarea
                  className="d-input d-textarea"
                  defaultValue="Saw a leaked screenshot of their hiring rubric — they care a lot about correctness on first commit."
                  rows={3}
                />
              </div>
              <div className="section">
                <div className="sl">Score</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ font: "600 26px/1 var(--font-sans)", letterSpacing: "-0.02em" }}>
                    {total}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>/ {max}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      font: "600 13px/1 var(--font-sans)",
                      color: "var(--warning-text)",
                    }}
                  >
                    {pct}% · Conditional
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--surface-2)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: pct + "%",
                      borderRadius: 3,
                      background: "var(--warning)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -3,
                      bottom: -3,
                      left: "60%",
                      width: 1,
                      background: "var(--border-strong)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -3,
                      bottom: -3,
                      left: "80%",
                      width: 1,
                      background: "var(--border-strong)",
                    }}
                  />
                </div>
              </div>
              <div className="section">
                <div className="sl">Stage 1 · Pre-filters</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {["Salary band", "Location"].map((l) => (
                    <div key={l} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="ok" size={14} color="var(--success)" />
                      <span style={{ font: "500 12px/1.3 var(--font-sans)" }}>{l}</span>
                      <span className="m-badge success sm" style={{ marginLeft: "auto" }}>
                        Pass
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section">
                <div className="sl">
                  <span className="spark">✦</span> AI research summary
                </div>
                <div className="d-ai-box">
                  Zerodha's brokerage platform team is profitable and engineering-led. Glassdoor 3.6
                  WLB · LinkedIn tenure 2.4y (median). The "rewrite every 18 months" pattern
                  surfaced in 3 interviews — strong learning environment but high context-switching
                  cost.
                </div>
              </div>
              <div className="section">
                <div className="sl">Stage 3 · Scored criteria</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {scores.map((s, i) => (
                    <div
                      key={s.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            font: "500 12px/1.3 var(--font-sans)",
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {s.name}
                          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                            w{s.weight}
                          </span>
                          {s.confidence === "low" && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                background: "var(--amber)",
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="m-stepper" style={{ height: 24 }}>
                        <button style={{ width: 22, height: 22 }}>
                          <Icon name="minus" size={11} />
                        </button>
                        <span className="val" style={{ width: 22, height: 22, fontSize: 12 }}>
                          {s.score}
                        </span>
                        <button style={{ width: 22, height: 22 }}>
                          <Icon name="plus" size={11} />
                        </button>
                      </div>
                      <span
                        style={{
                          font: "500 11px/1 var(--font-sans)",
                          color: "var(--text-muted)",
                          width: 28,
                          textAlign: "right",
                        }}
                      >
                        {s.score * s.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="footer" style={{ flexShrink: 0 }}>
              <button className="d-btn danger">Reject</button>
              <div style={{ flex: 1 }} />
              <button className="d-btn secondary">Accept</button>
              <button className="d-btn primary">Accept · find contacts</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  MobileCompanies,
  MobileCompanyDetail,
  MobileCompanyEthics,
  MobileCompanyContacts,
  DesktopCompanies,
});
