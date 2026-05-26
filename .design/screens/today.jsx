// today.jsx — "Today" home screen. Mirrors the morning digest in-app, with
// an AI-activity surface summarising what happened overnight.

/* ============================================================
   Shared data helpers for the Today screen
   ============================================================ */
const TODAY_AI_ACTIVITY = [
  { num: 3, label: "Drafts written", icon: "mail" },
  { num: 1, label: "Company researched", icon: "building" },
  { num: 2, label: "New contacts found", icon: "user" },
  { num: 1, label: "Contact marked dead", icon: "flag" },
  { num: 1, label: "Re-engage assessed", icon: "retry" },
];

// Helpers: pull live data from CONTACTS/COMPANIES/JOBS so the Today
// content always matches what's in the other screens.
const DRAFTS_READY = CONTACTS.filter((c) => c.status === "draft_ready" && !c.stalled);
const STALLED = CONTACTS.filter((c) => c.stalled);
const NEEDS_INPUT = CONTACTS.filter((c) => c.needsInput);
const COS_REVIEW = COMPANIES.filter((c) => c.status === "waiting_human");
const JOBS_REVIEW = JOBS.filter((j) => j.status === "waiting_human");
const FOLLOWUPS = CONTACTS.filter((c) => c.status === "in_pipeline" && c.nextTouch === "2d");
const FAILED = CONTACTS.filter((c) => c.status === "failed");

/* ============================================================
   MOBILE — /today
   ============================================================ */
function TodayHero({ desktop = false }) {
  const date = new Date("2026-05-20T08:00:00");
  const dateStr = date.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const totalActions =
    DRAFTS_READY.length +
    COS_REVIEW.length +
    NEEDS_INPUT.length +
    STALLED.length +
    JOBS_REVIEW.length +
    FAILED.length;
  return (
    <div
      className={desktop ? "d-today-hero" : "m-section"}
      style={desktop ? {} : { paddingBottom: 8, position: "relative", overflow: "hidden" }}
    >
      {/* Decorative circles — only in non-desktop */}
      {!desktop && (
        <>
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.06,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -10,
              right: 60,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1.5px solid var(--accent)",
              opacity: 0.12,
              pointerEvents: "none",
            }}
          />
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
        <span
          style={{
            font: "500 12px/1 var(--font-sans)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {dateStr}
        </span>
        <h1
          style={{
            font: `600 ${desktop ? 28 : 24}px/1.25 var(--font-sans)`,
            color: "var(--text-primary)",
            letterSpacing: "-0.012em",
            marginTop: 6,
          }}
        >
          Good morning, {USER.name.split(" ")[0]}.
        </h1>
        <p
          style={{
            font: `400 ${desktop ? 14 : 14}px/1.55 var(--font-sans)`,
            color: "var(--text-secondary)",
            marginTop: 8,
            textWrap: "pretty",
          }}
        >
          {totalActions} things waiting for you. ~{Math.round(totalActions * 2.5)} minutes if you
          start now.
        </p>
      </div>
    </div>
  );
}

function AiActivityCard({ desktop = false }) {
  return (
    <div
      className={desktop ? "d-ai-activity-card" : "m-section"}
      style={desktop ? {} : { paddingTop: 0, paddingBottom: 8 }}
    >
      <div className="m-ai-activity">
        <div className="head">
          <Icon name="spark" size={13} />
          AI · overnight (01:00–02:14 IST)
        </div>
        <div>
          {TODAY_AI_ACTIVITY.map((a) => (
            <div key={a.label} className="row">
              <span className="num">{a.num}</span>
              <span className="lbl">{a.label}</span>
              <Icon name={a.icon} size={14} color="var(--amber-text)" />
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid color-mix(in srgb, var(--amber-border) 22%, transparent)",
            font: "400 11px/1.5 var(--font-sans)",
            color: "var(--amber-text)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="warning" size={12} />1 cron task failed after 3 retries — see Needs attention.
        </div>
      </div>
    </div>
  );
}

// Mobile section card — used in Today
function MTodaySection({ count, label, icon, accent, children }) {
  return (
    <div className="m-section" style={{ paddingTop: 0, paddingBottom: 8 }}>
      <div className="m-section-label">
        {icon === "spark" ? (
          <span className="spark">✦</span>
        ) : (
          <Icon name={icon} size={13} color={accent || "var(--text-muted)"} />
        )}
        {label}
        {count != null && <span className="count">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function ContactCard({ c, draftReady = false, stalled = false }) {
  return (
    <a className="m-card tap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name={c.name} sz="md" warm={draftReady} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: "600 14px/1.3 var(--font-sans)",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.name}
        </div>
        <div
          style={{
            font: "400 12px/1.4 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.company} · Touch {c.touch} · {c.channel}
        </div>
        {stalled && (
          <div
            style={{
              font: "500 11px/1 var(--font-sans)",
              color: "var(--warning-text)",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="clock" size={11} /> Draft sat {c.draftAge} — did you send it?
          </div>
        )}
      </div>
      <Icon name="chevR" size={16} color="var(--text-muted)" />
    </a>
  );
}

function CompanyMiniCard({ co }) {
  return (
    <a className="m-card tap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name={co.name} sz="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              font: "600 14px/1.3 var(--font-sans)",
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {co.name}
          </span>
          {co.ethics && <Icon name="warning" size={13} color="var(--warning)" />}
        </div>
        <div
          style={{
            font: "400 12px/1.4 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 2,
          }}
        >
          <Badge fit={co.fitBand} sm />{" "}
          <span style={{ marginLeft: 6 }}>
            {Math.round((co.score / co.max) * 100)}% · {co.industry}
          </span>
        </div>
      </div>
      <Icon name="chevR" size={16} color="var(--text-muted)" />
    </a>
  );
}

function JobMiniCard({ j }) {
  return (
    <a className="m-card tap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="briefcase" size={16} color="var(--text-secondary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: "600 14px/1.3 var(--font-sans)",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {j.title}
        </div>
        <div
          style={{
            font: "400 12px/1.4 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 2,
          }}
        >
          {j.company} · {j.source.replace("_", " ")}
        </div>
      </div>
      <Icon name="chevR" size={16} color="var(--text-muted)" />
    </a>
  );
}

const MobileToday = () => (
  <MShell tabbar={<MTabBar active="today" />}>
    <div className="m-header" style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative circles behind header */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.07,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 30,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.09,
          pointerEvents: "none",
        }}
      />
      <div
        className="grow"
        style={{ display: "flex", alignItems: "center", gap: 7, position: "relative" }}
      >
        <Wordmark size="md" superscript={true} />
      </div>
      <button className="ico-btn">
        <Icon name="bell" size={18} />
      </button>
      <button className="ico-btn">
        <Icon name="settings" size={18} />
      </button>
    </div>
    <div className="m-body">
      <TodayHero />
      <AiActivityCard />

      {NEEDS_INPUT.length > 0 && (
        <MTodaySection
          count={NEEDS_INPUT.length}
          label="Needs your input"
          icon="info"
          accent="var(--accent)"
        >
          <div className="m-callout accent" style={{ marginBottom: 10 }}>
            <strong>AI didn't find personalisation context.</strong> Add what you know, or generate
            anyway.
          </div>
          {NEEDS_INPUT.map((c) => (
            <ContactCard key={c.id} c={c} />
          ))}
        </MTodaySection>
      )}

      {FAILED.length > 0 && (
        <MTodaySection
          count={FAILED.length}
          label="Needs attention"
          icon="warning"
          accent="var(--danger)"
        >
          {FAILED.map((c) => (
            <div
              key={c.id}
              className="m-card"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--danger-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="warning" size={16} color="var(--danger)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--text-primary)" }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    font: "400 12px/1.4 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {c.company} · Apollo enrichment timed out
                </div>
              </div>
              <button className="m-btn sm secondary">Retry</button>
            </div>
          ))}
        </MTodaySection>
      )}

      <MTodaySection
        count={DRAFTS_READY.length}
        label="Drafts ready"
        icon="spark"
        accent="var(--amber)"
      >
        {DRAFTS_READY.map((c) => (
          <ContactCard key={c.id} c={c} draftReady />
        ))}
      </MTodaySection>

      {STALLED.length > 0 && (
        <MTodaySection
          count={STALLED.length}
          label="Stalled drafts"
          icon="clock"
          accent="var(--warning)"
        >
          {STALLED.map((c) => (
            <ContactCard key={c.id} c={c} stalled />
          ))}
        </MTodaySection>
      )}

      <MTodaySection count={COS_REVIEW.length} label="Companies to review" icon="building">
        {COS_REVIEW.slice(0, 3).map((co) => (
          <CompanyMiniCard key={co.id} co={co} />
        ))}
      </MTodaySection>

      <MTodaySection count={JOBS_REVIEW.length} label="Jobs to review" icon="briefcase">
        {JOBS_REVIEW.slice(0, 2).map((j) => (
          <JobMiniCard key={j.id} j={j} />
        ))}
      </MTodaySection>

      {FOLLOWUPS.length > 0 && (
        <MTodaySection count={FOLLOWUPS.length} label="Follow-ups due today" icon="calendar">
          {FOLLOWUPS.map((c) => (
            <ContactCard key={c.id} c={c} />
          ))}
        </MTodaySection>
      )}

      <div style={{ padding: "24px 16px 32px", textAlign: "center" }}>
        <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--text-muted)" }}>
          You're all caught up after these.
        </div>
      </div>
    </div>
  </MShell>
);

/* ============================================================
   DESKTOP — /today
   Two-column layout: hero + sections (left), AI activity (right).
   ============================================================ */
const DesktopToday = () => (
  <DShell active="today">
    <DTopbar
      title="Today"
      sub="Tuesday, May 20, 2026 · 8:14 AM IST"
      actions={
        <>
          <button className="d-btn secondary">
            <Icon name="bell" size={14} /> 3
          </button>
          <button className="d-btn secondary">
            <Icon name="inbox" size={14} /> Preview digest
          </button>
        </>
      }
    />
    <div style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "32px 24px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 32,
        }}
      >
        {/* LEFT — greeting + sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Hero */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "var(--accent)",
                opacity: 0.05,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 80,
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: "1.5px solid var(--accent)",
                opacity: 0.1,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                font: "500 12px/1 var(--font-sans)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                position: "relative",
              }}
            >
              Tuesday, May 20, 2026
            </div>
            <h1
              style={{
                font: "600 28px/1.2 var(--font-sans)",
                color: "var(--text-primary)",
                letterSpacing: "-0.014em",
                marginTop: 8,
                position: "relative",
              }}
            >
              Good morning, {USER.name.split(" ")[0]}.
            </h1>
            <p
              style={{
                font: "400 14px/1.55 var(--font-sans)",
                color: "var(--text-secondary)",
                marginTop: 10,
                maxWidth: 520,
                textWrap: "pretty",
                position: "relative",
              }}
            >
              {DRAFTS_READY.length +
                COS_REVIEW.length +
                NEEDS_INPUT.length +
                STALLED.length +
                JOBS_REVIEW.length +
                FAILED.length}{" "}
              things waiting for you. ~22 minutes if you start now.
            </p>
          </div>

          {/* Section: Needs input */}
          <DTodaySection count={NEEDS_INPUT.length} label="Needs your input" icon="info">
            <div className="m-callout accent" style={{ marginBottom: 10 }}>
              <strong>AI didn't find personalisation context.</strong> Add what you know, or
              generate anyway.
            </div>
            <DTodayRowList>
              {NEEDS_INPUT.map((c) => (
                <DTodayContactRow key={c.id} c={c} />
              ))}
            </DTodayRowList>
          </DTodaySection>

          {/* Section: Needs attention */}
          <DTodaySection count={FAILED.length} label="Needs attention" icon="warning" tone="danger">
            <DTodayRowList>
              {FAILED.map((c) => (
                <div key={c.id} className="d-today-row">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--danger-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="warning" size={15} color="var(--danger)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-cell-name">{c.name}</div>
                    <div className="d-cell-sub">
                      {c.company} · {c.failedReason}
                    </div>
                  </div>
                  <button className="d-btn sm secondary">Retry</button>
                </div>
              ))}
            </DTodayRowList>
          </DTodaySection>

          {/* Section: Drafts ready */}
          <DTodaySection count={DRAFTS_READY.length} label="Drafts ready" icon="mail" tone="accent">
            <DTodayRowList>
              {DRAFTS_READY.map((c) => (
                <DTodayContactRow key={c.id} c={c} action="Open draft" />
              ))}
            </DTodayRowList>
          </DTodaySection>

          {/* Section: Stalled */}
          <DTodaySection count={STALLED.length} label="Stalled drafts" icon="clock" tone="warning">
            <DTodayRowList>
              {STALLED.map((c) => (
                <div key={c.id} className="d-today-row">
                  <Avatar name={c.name} sz="sm" warm />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-cell-name">{c.name}</div>
                    <div className="d-cell-sub">
                      {c.company} · Touch {c.touch} · Draft sat {c.draftAge}
                    </div>
                  </div>
                  <span className="m-badge warning sm">{c.draftAge}</span>
                  <button className="d-btn sm secondary">Mark as sent</button>
                  <button className="d-btn sm ghost">Open</button>
                </div>
              ))}
            </DTodayRowList>
          </DTodaySection>

          {/* Section: Companies */}
          <DTodaySection count={COS_REVIEW.length} label="Companies to review" icon="building">
            <DTodayRowList>
              {COS_REVIEW.map((co) => (
                <div key={co.id} className="d-today-row">
                  <Avatar name={co.name} sz="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="d-cell-name"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {co.name}
                      {co.ethics && <Icon name="warning" size={13} color="var(--warning)" />}
                    </div>
                    <div className="d-cell-sub">
                      {co.industry} · {Math.round((co.score / co.max) * 100)}% match
                    </div>
                  </div>
                  <Badge fit={co.fitBand} sm />
                  <button className="d-btn sm secondary">Review</button>
                </div>
              ))}
            </DTodayRowList>
          </DTodaySection>

          {/* Section: Jobs */}
          <DTodaySection count={JOBS_REVIEW.length} label="Jobs to review" icon="briefcase">
            <DTodayRowList>
              {JOBS_REVIEW.map((j) => (
                <div key={j.id} className="d-today-row">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="briefcase" size={14} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-cell-name">{j.title}</div>
                    <div className="d-cell-sub">
                      {j.company} · {j.location} · {j.source.replace("_", " ")}
                    </div>
                  </div>
                  <span className="m-badge neutral sm">{j.salary}</span>
                  <button className="d-btn sm secondary">Review</button>
                </div>
              ))}
            </DTodayRowList>
          </DTodaySection>
        </div>

        {/* RIGHT — AI activity card pinned */}
        <aside style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}>
          <div className="m-ai-activity" style={{ marginTop: 36 }}>
            <div className="head">
              <Icon name="spark" size={13} />
              AI · overnight
            </div>
            <div
              style={{
                font: "400 12px/1.55 var(--font-sans)",
                color: "var(--amber-text)",
                opacity: 0.85,
                marginBottom: 10,
              }}
            >
              Ran 01:00 — 02:14 IST. Researched Razorpay, drafted 3 touches, found 2 new contacts at
              PhonePe.
            </div>
            <div>
              {TODAY_AI_ACTIVITY.map((a) => (
                <div key={a.label} className="row">
                  <span className="num">{a.num}</span>
                  <span className="lbl">{a.label}</span>
                  <Icon name={a.icon} size={14} color="var(--amber-text)" />
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid color-mix(in srgb, var(--amber-border) 22%, transparent)",
                font: "400 11px/1.55 var(--font-sans)",
                color: "var(--amber-text)",
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <Icon name="warning" size={12} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                1 cron task failed after 3 retries — Karan Shah's enrichment. See Needs attention.
              </span>
            </div>
          </div>

          {/* Pipeline glance */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                font: "600 11px/1 var(--font-sans)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Pipeline this week
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { lbl: "In conversation", n: 4, dot: "var(--pipeline)" },
                { lbl: "Awaiting reply", n: 5, dot: "var(--accent)" },
                { lbl: "Replied", n: 1, dot: "var(--success)" },
                { lbl: "Dead this week", n: 2, dot: "var(--text-muted)" },
              ].map((r) => (
                <div key={r.lbl} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.dot }} />
                  <span
                    style={{
                      font: "500 13px/1 var(--font-sans)",
                      color: "var(--text-primary)",
                      flex: 1,
                    }}
                  >
                    {r.lbl}
                  </span>
                  <span
                    style={{ font: "600 13px/1 var(--font-sans)", color: "var(--text-secondary)" }}
                  >
                    {r.n}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, height: 1, background: "var(--border)" }} />
            <div
              style={{
                marginTop: 12,
                font: "400 12px/1.5 var(--font-sans)",
                color: "var(--text-secondary)",
              }}
            >
              <a href="#" style={{ color: "var(--accent-text)", fontWeight: 500 }}>
                Open A/B analytics →
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </DShell>
);

// Desktop sub-helpers
function DTodaySection({ count, label, icon, tone, children }) {
  const accent =
    tone === "accent"
      ? "var(--accent)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "danger"
          ? "var(--danger)"
          : "var(--text-muted)";
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon name={icon} size={14} color={accent} strokeWidth={1.7} />
        <h2
          style={{
            font: "600 13px/1 var(--font-sans)",
            color: "var(--text-primary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: 11,
          }}
        >
          {label}
        </h2>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 9,
            background: "var(--surface-2)",
            color: "var(--text-secondary)",
            font: "600 10px/1 var(--font-sans)",
          }}
        >
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function DTodayRowList({ children }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function DTodayContactRow({ c, action }) {
  return (
    <div className="d-today-row">
      <Avatar name={c.name} sz="sm" warm={c.status === "draft_ready"} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="d-cell-name">{c.name}</div>
        <div className="d-cell-sub">
          {c.company} · {c.designation}
        </div>
      </div>
      <span className="m-badge accent sm">Touch {c.touch}</span>
      <span className="d-cell-meta">{c.channel}</span>
      <button className="d-btn sm secondary">{action || "Open"}</button>
    </div>
  );
}

// Inline styles for desktop Today rows (added once)
if (typeof document !== "undefined" && !document.getElementById("d-today-styles")) {
  const s = document.createElement("style");
  s.id = "d-today-styles";
  s.textContent = `
    .d-today-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .d-today-row:last-child { border-bottom: none; }
    .d-today-row:hover { background: var(--surface-2); }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { MobileToday, DesktopToday });
