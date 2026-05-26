// onboarding.jsx — path picker, quick-start confirm, and 3-step wizard
// (Company Research, Job Search, A/B Testing). Each wizard step shows the
// form; step 1 also has a "review generated text" variant.

/* ============================================================
   Helpers
   ============================================================ */
function WizardHeader({ step, total = 3, label, onMobile = false }) {
  const dots = [...Array(total)].map((_, i) => (
    <span
      key={i}
      style={{
        width: i + 1 === step ? 18 : 6,
        height: 6,
        borderRadius: 3,
        background: i + 1 <= step ? "var(--accent)" : "var(--border)",
        transition: "all 0.2s ease",
      }}
    />
  ));
  return (
    <div
      className="m-header surface"
      style={
        onMobile
          ? {}
          : { background: "var(--bg)", borderBottom: "none", padding: "0 24px", height: 56 }
      }
    >
      <button className="ico-btn back">
        <Icon name="arrowLeft" size={20} />
      </button>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="title" style={{ fontSize: onMobile ? 17 : 14, fontWeight: 600 }}>
          {label}
        </div>
        <div className="sub" style={{ fontSize: 11 }}>
          Step {step} of {total}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{dots}</div>
    </div>
  );
}

/* ============================================================
   /onboarding — path picker (mobile + desktop)
   ============================================================ */
const MobileOnbPath = () => (
  <MShell>
    <div className="m-body" style={{ background: "var(--bg)" }}>
      {/* Hero — pure visual, no text lists */}
      <div
        style={{
          background: "var(--sidebar)",
          borderBottom: "1px solid var(--border)",
          padding: "48px 24px 36px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        {/* Large decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.08,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.06,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: "1.5px solid var(--accent)",
            opacity: 0.12,
          }}
        />

        <div style={{ position: "relative" }}>
          <Wordmark size="xl" />
        </div>

        <h1
          style={{
            position: "relative",
            font: "600 26px/1.2 var(--font-sans)",
            color: "var(--text-primary)",
            letterSpacing: "-0.015em",
            textWrap: "balance",
            maxWidth: 260,
          }}
        >
          Your job search,
          <br />
          on autopilot.
        </h1>

        {/* Visual time indicator */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--amber-bg)",
            border: "1px solid color-mix(in srgb, var(--amber-border) 50%, transparent)",
            borderRadius: 10,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--amber)",
              flexShrink: 0,
            }}
          />
          <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--amber-text)" }}>
            AI works 1:00 – 2:00 AM · digest at 8:00 AM
          </span>
        </div>
      </div>

      {/* Path options — visual weight, minimal copy */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <a
          className="m-card tap"
          style={{ borderColor: "var(--accent)", background: "var(--accent-bg)", padding: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  font: "600 10px/1 var(--font-sans)",
                  color: "var(--accent-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 6,
                }}
              >
                Recommended · 30 sec
              </div>
              <div
                style={{
                  font: "600 20px/1.2 var(--font-sans)",
                  color: "var(--accent-text)",
                  letterSpacing: "-0.01em",
                }}
              >
                Quick start
              </div>
              <div
                style={{
                  font: "400 13px/1.5 var(--font-sans)",
                  color: "var(--text-primary)",
                  marginTop: 6,
                  maxWidth: 220,
                  textWrap: "pretty",
                }}
              >
                Seed defaults. AI runs tonight.
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--accent)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="arrowRight" size={20} color="#000" />
            </div>
          </div>
        </a>

        <a className="m-card tap" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  font: "600 10px/1 var(--font-sans)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 6,
                }}
              >
                ~8 min
              </div>
              <div
                style={{
                  font: "600 20px/1.2 var(--font-sans)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                Full setup
              </div>
              <div
                style={{
                  font: "400 13px/1.5 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 6,
                  textWrap: "pretty",
                }}
              >
                Configure salary, criteria, roles.
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--surface-2)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="arrowRight" size={20} color="var(--text-secondary)" />
            </div>
          </div>
        </a>
      </div>
    </div>
  </MShell>
);

const MobileOnbQuick = () => (
  <MShell>
    <div
      className="m-body"
      style={{ background: "var(--bg)", display: "flex", flexDirection: "column" }}
    >
      {/* Hero — visual character matching onboarding path picker */}
      <div
        style={{
          background: "var(--sidebar)",
          borderBottom: "1px solid var(--border)",
          padding: "48px 24px 36px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.08,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.06,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 20,
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "1.5px solid var(--accent)",
            opacity: 0.14,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 40,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1.5px solid var(--accent)",
            opacity: 0.12,
            pointerEvents: "none",
          }}
        />

        {/* Check icon — larger, more prominent */}
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--accent-bg)",
            border: "2px solid color-mix(in srgb, var(--accent) 35%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Icon name="check" size={38} color="var(--accent)" strokeWidth={2} />
        </div>

        <h1
          style={{
            position: "relative",
            font: "600 26px/1.2 var(--font-sans)",
            color: "var(--text-primary)",
            letterSpacing: "-0.015em",
          }}
        >
          You're set up.
        </h1>
        <p
          style={{
            position: "relative",
            font: "400 14px/1.6 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 10,
            maxWidth: 280,
            textWrap: "pretty",
          }}
        >
          AI runs tonight at 1 AM. Your first digest lands tomorrow at 8:00 AM.
        </p>

        {/* Time indicator */}
        <div
          style={{
            position: "relative",
            marginTop: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "var(--amber-bg)",
            border: "1px solid color-mix(in srgb, var(--amber-border) 50%, transparent)",
            borderRadius: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--amber)",
              flexShrink: 0,
            }}
          />
          <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--amber-text)" }}>
            Next run: tonight · 1:00 AM IST
          </span>
        </div>
      </div>

      <div className="m-section">
        <div className="m-callout" style={{ marginBottom: 16 }}>
          <strong>Your frameworks are using defaults.</strong> Personalise them in Settings →
          Frameworks to improve results.
        </div>

        <div className="m-card">
          <div
            style={{
              font: "600 11px/1 var(--font-sans)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            What runs overnight
          </div>
          {[
            { i: "building", t: "Companies you add → 3-stage research" },
            { i: "user", t: "Accepted companies → contact discovery" },
            { i: "mail", t: "Drafted outreach for tomorrow morning" },
          ].map((r) => (
            <div
              key={r.t}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}
            >
              <Icon name={r.i} size={16} color="var(--text-secondary)" />
              <span style={{ font: "400 13px/1.4 var(--font-sans)", color: "var(--text-primary)" }}>
                {r.t}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="m-actionbar">
        <button className="m-btn primary full">Take me to Today</button>
      </div>
    </div>
  </MShell>
);

/* ============================================================
   /onboarding/wizard/step/1 — Company Research framework form
   ============================================================ */

const ETHICS_DEFAULTS = [
  "Data privacy violations",
  "Active regulatory action",
  "Predatory monetisation (dark patterns)",
  "Public reputation scandals",
];

/* ============================================================
   CRITERIA IDEATION — 3 approaches for selecting + weighting
   criteria in the Company Research wizard step.
   ============================================================ */

const CRIT_SHORT = [
  {
    name: "Work-Life Balance & Culture",
    weight: 5,
    on: true,
    autoNoGo: true,
    tier: "must",
    signals:
      'Glassdoor WLB ≥ 3.8, avg LinkedIn tenure ≥ 2 yrs, JD language ("family", "many hats", "thrives under pressure") flagged.',
  },
  {
    name: "Manager Quality & Role Clarity",
    weight: 5,
    on: true,
    autoNoGo: false,
    tier: "must",
    signals:
      "JD lists measurable outcomes (not just responsibilities). Hiring manager has mentorship history on LinkedIn. Role is a defined backfill or growth hire.",
  },
  {
    name: "Company Stability",
    weight: 4,
    on: true,
    autoNoGo: false,
    tier: "should",
    signals:
      "Profitable or funded (runway ≥ 18 mo). No recent mass layoffs. Headcount stable or growing on LinkedIn.",
  },
  {
    name: "Learning & Mentorship",
    weight: 4,
    on: true,
    autoNoGo: false,
    tier: "should",
    signals:
      "Learning budget or 20% time mentioned in JD. Senior engineers with mentorship history. Active engineering blog or public talks.",
  },
  {
    name: "Clear Advancement Pathways",
    weight: 3,
    on: true,
    autoNoGo: false,
    tier: "should",
    signals:
      "Levelling framework exists (e.g. SDE1→SDE2). Internal promotions visible on LinkedIn. Defined performance review cycle.",
  },
  {
    name: "Tech Health & Stack",
    weight: 3,
    on: true,
    autoNoGo: false,
    tier: "should",
    signals:
      "Stack aligns with your target skills. CI/CD, observability, modern practices in JD or eng blog. Low Glassdoor complaints about tech debt.",
  },
  {
    name: "Team Integration & Culture",
    weight: 2,
    on: true,
    autoNoGo: false,
    tier: "nice",
    signals:
      "Proportional team size (not 30 engineers : 1 manager). Cross-functional collaboration in JD. Good peer-review sentiment on Glassdoor.",
  },
  {
    name: "Impactful Projects",
    weight: 1,
    on: false,
    autoNoGo: false,
    tier: "nice",
    signals:
      'Real users or revenue mentioned. Non-trivial engineering challenges (scale, reliability, ML). Ask: "What shipped last quarter?"',
  },
];

function MFieldGroup({ label, help, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label className="m-field-label">{label}</label>
      {children}
      {help && <p className="m-field-help">{help}</p>}
    </div>
  );
}

function ExampleBlock({ open = false, label = "See an example", body }) {
  return (
    <div
      className="m-card"
      style={{
        background: "var(--amber-bg)",
        borderLeft: "3px solid var(--amber-border)",
        borderRadius: "0 10px 10px 0",
        padding: "12px 14px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          font: "600 11px/1 var(--font-sans)",
          color: "var(--amber-text)",
          marginBottom: open ? 10 : 0,
        }}
      >
        <Icon name="spark" size={12} /> {label}
        <Icon name={open ? "chevU" : "chevD"} size={14} style={{ marginLeft: "auto" }} />
      </div>
      {open && body}
    </div>
  );
}

const MobileOnbStep1Review = () => (
  <MShell>
    <WizardHeader step={1} label="Review · Company Research" onMobile />
    <div className="m-body" style={{ background: "var(--bg)" }}>
      <div style={{ padding: "20px 16px 8px" }}>
        <h1
          style={{
            font: "600 18px/1.3 var(--font-sans)",
            color: "var(--text-primary)",
            letterSpacing: "-0.008em",
          }}
        >
          AI will use this to score every company.
        </h1>
        <p
          style={{
            font: "400 13px/1.55 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 6,
          }}
        >
          Edit inline or go back to adjust the form.
        </p>
      </div>

      <div className="m-section">
        <div className="m-ai-box" style={{ borderRadius: "0 10px 10px 0" }}>
          <div className="lbl">
            <span className="spark">✦</span> Generated framework · 1,640 chars
          </div>
          <div
            style={{
              font: "400 12.5px/1.75 var(--font-sans)",
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {`STAGE 1 — Pre-Filters (Hard Constraints)
Both must pass. If either fails, stop — do not score.

• Salary band: Confirm offered CTC is within 12–16 LPA. Check JD, Glassdoor, AmbitionBox. If undisclosed, estimate from peer roles.
• Location: Role must be fully remote OR Bengaluru, Hyderabad, Pune. Hybrid acceptable.

STAGE 2 — Ethics Gate
Flag if any of: data privacy violations, active regulatory action, predatory monetisation (dark patterns), public reputation scandals.
A flag does NOT auto-disqualify — surface for conscious human review.

STAGE 3 — Scored Criteria (0–5, × weight)
P1  Work-Life Balance & Culture     (weight 5, AUTO NO-GO)
P2  Manager Quality & Role Clarity  (weight 5)
P3  Company Stability               (weight 4)
P4  Learning & Mentorship           (weight 4)
P5  Clear Advancement Pathways      (weight 3)
P6  Tech Health & Stack             (weight 3)
P7  Team Integration & Culture      (weight 2)
P8  Impactful Projects              (weight 1)

Max possible: 135. Output score_confidence per criterion (high / medium / low).

Decision bands (% of max):
• Strong fit       ≥ 80%
• Conditional fit  60–79%
• Weak fit         < 60%
• Auto No-Go       any AUTO NO-GO criterion scoring 0`}
          </div>
        </div>
      </div>

      <div className="m-section">
        <div
          className="m-card"
          style={{
            background: "var(--accent-bg)",
            border: "1px solid var(--accent)",
            borderRadius: 10,
          }}
        >
          <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--accent-text)" }}>
            Looks good. Save and continue.
          </div>
          <div
            style={{
              font: "400 12px/1.55 var(--font-sans)",
              color: "var(--text-primary)",
              marginTop: 6,
              textWrap: "pretty",
            }}
          >
            This becomes v1 of your Company Research framework. You can edit it any time in Settings
            — the last 5 versions are restorable.
          </div>
        </div>
      </div>
    </div>
    <div className="m-actionbar">
      <button className="m-btn secondary">
        <Icon name="arrowLeft" size={14} /> Back
      </button>
      <button className="m-btn primary full">Save & continue</button>
    </div>
  </MShell>
);

/* ============================================================
   Step 2 — Job Search framework
   ============================================================ */
const MobileOnbStep2 = () => (
  <MShell>
    <WizardHeader step={2} label="Job Search" onMobile />
    <div className="m-body" style={{ background: "var(--bg)" }}>
      <div style={{ padding: "20px 16px 8px" }}>
        <h1
          style={{
            font: "600 20px/1.25 var(--font-sans)",
            color: "var(--text-primary)",
            letterSpacing: "-0.012em",
          }}
        >
          What jobs should AI find?
        </h1>
        <p
          style={{
            font: "400 13px/1.55 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 6,
            textWrap: "pretty",
          }}
        >
          Pre-filled with the Appendix C defaults — backend engineer roles in India.
        </p>
      </div>

      <div className="m-section">
        <ExampleBlock body={null} />

        <MFieldGroup label="Target role titles">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Backend Engineer", "SDE-1", "SDE-2", "Software Engineer", "Backend Developer"].map(
              (l) => (
                <span
                  key={l}
                  className="m-chip active"
                  style={{ height: 30, fontSize: 12, paddingRight: 6 }}
                >
                  {l} <Icon name="close" size={12} />
                </span>
              ),
            )}
            <button className="m-chip" style={{ height: 30 }}>
              <Icon name="plus" size={12} /> Add
            </button>
          </div>
        </MFieldGroup>

        <MFieldGroup label="Hard-required skills" help="Must appear in JD — combined with OR">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Node.js", "Express.js"].map((l) => (
              <span
                key={l}
                className="m-chip active"
                style={{
                  height: 30,
                  fontSize: 12,
                  paddingRight: 6,
                  background: "var(--accent-text)",
                }}
              >
                {l} <Icon name="close" size={12} />
              </span>
            ))}
            <button className="m-chip" style={{ height: 30 }}>
              <Icon name="plus" size={12} /> Add
            </button>
          </div>
        </MFieldGroup>

        <MFieldGroup label="Prioritised skills (ranking signals)">
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {[
              { name: "Node.js", p: "High" },
              { name: "Express.js", p: "High" },
              { name: "AWS", p: "Medium" },
              { name: "Cloudflare (Workers, D1)", p: "Medium" },
            ].map((s) => (
              <div
                key={s.name}
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    font: "500 13px/1.3 var(--font-sans)",
                    color: "var(--text-primary)",
                  }}
                >
                  {s.name}
                </div>
                <span className={`m-badge sm ${s.p === "High" ? "accent" : "neutral"}`}>{s.p}</span>
              </div>
            ))}
          </div>
        </MFieldGroup>

        <MFieldGroup label="Minimum salary">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-muted)", font: "400 14px/1 var(--font-sans)" }}>
              ₹
            </span>
            <input className="m-input" defaultValue="10" type="number" />
            <span style={{ color: "var(--text-muted)" }}>LPA</span>
          </div>
        </MFieldGroup>

        <MFieldGroup label="Experience range (years)">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="m-input" type="number" defaultValue="2" style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)" }}>—</span>
            <input className="m-input" type="number" defaultValue="5" style={{ flex: 1 }} />
          </div>
        </MFieldGroup>

        <MFieldGroup label="Results cap" help="Per scheduled run">
          <input className="m-input" type="number" defaultValue="20" />
        </MFieldGroup>

        <MFieldGroup label="Recency window">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { v: "7d", l: "7 days" },
              { v: "14d", l: "14 days", active: false },
              { v: "30d", l: "30 days" },
            ].map((o) => (
              <button
                key={o.v}
                className={`m-btn ${o.v === "7d" ? "primary" : "secondary"}`}
                style={{ height: 40, fontSize: 13 }}
              >
                {o.l}
              </button>
            ))}
          </div>
        </MFieldGroup>
      </div>
    </div>
    <div className="m-actionbar">
      <button className="m-btn ghost">Skip</button>
      <button className="m-btn primary full">Generate framework</button>
    </div>
  </MShell>
);

/* ============================================================
   Step 3 — A/B Testing config
   ============================================================ */
const MobileOnbStep3 = () => (
  <MShell>
    <WizardHeader step={3} label="A/B Testing" onMobile />
    <div className="m-body" style={{ background: "var(--bg)" }}>
      <div style={{ padding: "20px 16px 8px" }}>
        <h1
          style={{
            font: "600 20px/1.25 var(--font-sans)",
            color: "var(--text-primary)",
            letterSpacing: "-0.012em",
          }}
        >
          What should AI test in your outreach?
        </h1>
        <p
          style={{
            font: "400 13px/1.55 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 6,
            textWrap: "pretty",
          }}
        >
          Strict alternation. Replies define the winner.
        </p>
      </div>

      <div className="m-section">
        <ExampleBlock body={null} />

        <MFieldGroup label="Active variable">
          <select
            className="m-input"
            style={{
              appearance: "none",
              backgroundImage:
                "linear-gradient(45deg, transparent 50%, var(--text-muted) 50%), linear-gradient(135deg, var(--text-muted) 50%, transparent 50%)",
              backgroundPosition: "calc(100% - 18px) 50%, calc(100% - 14px) 50%",
              backgroundSize: "5px 5px",
              backgroundRepeat: "no-repeat",
            }}
          >
            <option>Subject line</option>
            <option>Preview text</option>
            <option>CTA copy/placement</option>
            <option>Send time</option>
            <option>Email body structure</option>
          </select>
        </MFieldGroup>

        <MFieldGroup label="Variant A · style">
          <div className="m-card" style={{ background: "var(--surface)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="m-badge accent">A</span>
              <span style={{ font: "600 14px/1 var(--font-sans)", color: "var(--text-primary)" }}>
                Question-based
              </span>
            </div>
            <p style={{ font: "400 12px/1.55 var(--font-sans)", color: "var(--text-secondary)" }}>
              Direct, specific question tied to recipient's context.
            </p>
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "var(--bg)",
                borderRadius: 7,
                border: "1px solid var(--border)",
                font: "400 12px/1.4 var(--font-sans)",
                color: "var(--text-primary)",
                fontStyle: "italic",
              }}
            >
              "quick question about your backend stack"
            </div>
          </div>
        </MFieldGroup>

        <MFieldGroup label="Variant B · style">
          <div className="m-card" style={{ background: "var(--surface)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="m-badge amber">B</span>
              <span style={{ font: "600 14px/1 var(--font-sans)", color: "var(--text-primary)" }}>
                Observation-based
              </span>
            </div>
            <p style={{ font: "400 12px/1.55 var(--font-sans)", color: "var(--text-secondary)" }}>
              Specific observation about recipient or their company.
            </p>
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "var(--bg)",
                borderRadius: 7,
                border: "1px solid var(--border)",
                font: "400 12px/1.4 var(--font-sans)",
                color: "var(--text-primary)",
                fontStyle: "italic",
              }}
            >
              "noticed you scaled X to Y"
            </div>
          </div>
        </MFieldGroup>

        <MFieldGroup label="Assignment">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                border: "5px solid var(--accent)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
                Alternate (A/B/A/B…)
              </div>
              <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--text-muted)" }}>
                Strict, by processing order.
              </div>
            </div>
            <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--text-muted)" }}>
              v1 only
            </span>
          </div>
        </MFieldGroup>
      </div>
    </div>
    <div className="m-actionbar">
      <button className="m-btn ghost">Skip</button>
      <button className="m-btn primary full">Generate & finish</button>
    </div>
  </MShell>
);

/* ============================================================
   DESKTOP — path picker + step 1
   ============================================================ */
const DesktopOnbPath = () => (
  <div className="iso-screen">
    <div style={{ height: "100%", background: "var(--bg)", overflow: "auto" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 32px 64px" }}>
        <div style={{ marginBottom: 40 }}>
          <Wordmark size="lg" superscript={true} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32 }}>
          {/* Welcome card */}
          <div
            style={{
              background: "var(--accent-bg)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 28,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: "var(--accent)",
                opacity: 0.08,
                borderBottomLeftRadius: "100%",
              }}
            />
            <div
              style={{
                font: "600 10px/1 var(--font-sans)",
                color: "var(--accent-text)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Welcome, Aditya
            </div>
            <h1
              style={{
                font: "600 22px/1.25 var(--font-sans)",
                color: "var(--accent-text)",
                letterSpacing: "-0.012em",
                textWrap: "balance",
              }}
            >
              How should we start?
            </h1>
            <p
              style={{
                font: "400 13px/1.6 var(--font-sans)",
                color: "var(--text-primary)",
                marginTop: 12,
                textWrap: "pretty",
              }}
            >
              Two ways in. Both leave you fully configurable later in Settings.
            </p>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <div
                style={{
                  font: "600 10px/1 var(--font-sans)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Connected accounts
              </div>
              {[
                { name: "Google", email: "aditya.kumar@gmail.com", status: "Connected" },
                {
                  name: "Apollo (contact discovery)",
                  email: "500 credits available",
                  status: "Connected",
                },
                { name: "Resend (digest email)", email: "Default address", status: "Connected" },
              ].map((r) => (
                <div
                  key={r.name}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: "var(--surface-2)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      font: "600 9px/1 var(--font-sans)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.name[0]}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        font: "500 12px/1.3 var(--font-sans)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        font: "400 10.5px/1.3 var(--font-sans)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {r.email}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      font: "500 11px/1 var(--font-sans)",
                      color: "var(--success-text)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: "var(--success)",
                      }}
                    />
                    {r.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two paths */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "var(--surface)",
                border: "2px solid var(--accent)",
                borderRadius: 12,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    font: "600 10px/1 var(--font-sans)",
                    color: "var(--accent-text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Recommended
                </span>
                <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                  ~30 seconds
                </span>
              </div>
              <h3 style={{ font: "600 20px/1.25 var(--font-sans)", color: "var(--text-primary)" }}>
                Quick start
              </h3>
              <p
                style={{
                  font: "400 13px/1.6 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 8,
                  textWrap: "pretty",
                }}
              >
                We seed your Company Research, Job Search, and A/B frameworks from the Appendix
                defaults. AI starts working tonight at 1:00 AM. You can personalise each framework
                later from Settings.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  marginTop: 18,
                  marginBottom: 18,
                }}
              >
                {[
                  ["Salary band", "12–16 LPA"],
                  ["Locations", "Remote / India"],
                  ["Required skills", "Node.js, Express.js"],
                  ["A/B variant", "Subject line"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      font: "400 12px/1.55 var(--font-sans)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{k}:</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="d-btn primary lg" style={{ padding: "0 20px" }}>
                Start with defaults <Icon name="arrowRight" size={14} />
              </button>
            </div>

            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    font: "600 10px/1 var(--font-sans)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Full setup
                </span>
                <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                  ~8 minutes
                </span>
              </div>
              <h3 style={{ font: "600 20px/1.25 var(--font-sans)", color: "var(--text-primary)" }}>
                Configure manually
              </h3>
              <p
                style={{
                  font: "400 13px/1.6 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 8,
                  textWrap: "pretty",
                }}
              >
                Walk through three forms — Company Research scoring, Job Search filters, and your
                A/B variant style — before AI starts working.
              </p>
              <button className="d-btn secondary lg" style={{ padding: "0 20px", marginTop: 18 }}>
                Walk me through <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 48,
            font: "400 12px/1.55 var(--font-sans)",
            color: "var(--text-muted)",
            textWrap: "pretty",
          }}
        >
          Either way, the fixed system prompts (email drafting, contact search) are already active —
          they apply to everyone identically and are not user-configurable.
        </p>
      </div>
    </div>
  </div>
);

const DesktopOnbStep1 = () => (
  <div className="iso-screen">
    <div
      style={{
        height: "100%",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Wordmark size="md" />
        <span
          style={{
            font: "600 11px/1 var(--font-sans)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Setup wizard
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              style={{
                width: n === 1 ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: n <= 1 ? "var(--accent)" : "var(--border)",
                transition: "all 0.2s ease",
              }}
            />
          ))}
          <span
            style={{
              font: "500 12px/1 var(--font-sans)",
              color: "var(--text-secondary)",
              marginLeft: 12,
            }}
          >
            Step 1 of 3
          </span>
        </div>
      </header>

      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {/* Decorative circles in top-right of scrollable content */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: 0,
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.05,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 60,
              width: 70,
              height: 70,
              borderRadius: "50%",
              border: "1.5px solid var(--accent)",
              opacity: 0.1,
            }}
          />
        </div>
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            padding: "40px 32px 120px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                font: "600 24px/1.25 var(--font-sans)",
                color: "var(--text-primary)",
                letterSpacing: "-0.012em",
              }}
            >
              Company Research framework
            </h1>
            <p
              style={{
                font: "400 14px/1.6 var(--font-sans)",
                color: "var(--text-secondary)",
                marginTop: 8,
                textWrap: "pretty",
                maxWidth: 620,
              }}
            >
              How AI evaluates every company in your pipeline. Pre-filled with Appendix A defaults —
              adjust to your situation. You can change everything later.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Stage 1: pre-filters */}
              <section
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    font: "600 13px/1 var(--font-sans)",
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  Stage 1 · Pre-filters
                </h3>
                <p
                  style={{
                    font: "400 12px/1.55 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginBottom: 18,
                  }}
                >
                  Hard gates. If either fails, the company is disqualified before scoring.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="d-field-label">Salary range (LPA)</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input className="d-input" type="number" defaultValue="12" />
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                      <input className="d-input" type="number" defaultValue="16" />
                    </div>
                  </div>
                  <div>
                    <label className="d-field-label">Locations</label>
                    <input
                      className="d-input"
                      defaultValue="Remote, Bengaluru, Hyderabad, Pune, Hybrid (India)"
                    />
                  </div>
                </div>
              </section>

              {/* Stage 2: ethics */}
              <section
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    font: "600 13px/1 var(--font-sans)",
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  Stage 2 · Ethics gate
                </h3>
                <p
                  style={{
                    font: "400 12px/1.55 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginBottom: 18,
                  }}
                >
                  Surface for conscious review — does not auto-disqualify.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ETHICS_DEFAULTS.map((e) => (
                    <span
                      key={e}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 28,
                        padding: "0 11px",
                        borderRadius: 7,
                        background: "var(--accent-bg)",
                        color: "var(--accent-text)",
                        font: "500 12px/1 var(--font-sans)",
                      }}
                    >
                      <Icon name="check" size={12} /> {e}
                    </span>
                  ))}
                  <button
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 28,
                      padding: "0 11px",
                      borderRadius: 7,
                      background: "transparent",
                      border: "1px dashed var(--border-strong)",
                      color: "var(--text-secondary)",
                      font: "500 12px/1 var(--font-sans)",
                    }}
                  >
                    <Icon name="plus" size={12} /> Add custom flag
                  </button>
                </div>
              </section>

              {/* Stage 3: scored criteria */}
              <section
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        font: "600 13px/1 var(--font-sans)",
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      Stage 3 · Scored criteria
                    </h3>
                    <p
                      style={{
                        font: "400 12px/1.55 var(--font-sans)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {CRIT_SHORT.length} criteria · max{" "}
                      {CRIT_SHORT.reduce((s, c) => s + c.weight * 5, 0)} pts
                    </p>
                  </div>
                  <button className="d-btn ghost">
                    <Icon name="plus" size={13} /> Add criterion
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px 1fr 100px 80px 60px",
                      gap: 12,
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                      font: "600 10px/1 var(--font-sans)",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <span />
                    <span>Criterion</span>
                    <span>Weight</span>
                    <span>Auto No-Go</span>
                    <span />
                  </div>
                  {CRIT_SHORT.map((c) => (
                    <div
                      key={c.name}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "20px 1fr 100px 80px 60px",
                        gap: 12,
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <Icon name="drag" size={14} color="var(--text-muted)" />
                      <span
                        style={{
                          font: "500 13px/1.3 var(--font-sans)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {c.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button className="d-icon-btn" style={{ width: 24, height: 24 }}>
                          <Icon name="minus" size={12} />
                        </button>
                        <span
                          style={{
                            width: 32,
                            textAlign: "center",
                            font: "600 13px/1 var(--font-sans)",
                          }}
                        >
                          {c.weight}
                        </span>
                        <button className="d-icon-btn" style={{ width: 24, height: 24 }}>
                          <Icon name="plus" size={12} />
                        </button>
                      </div>
                      <span
                        style={{
                          width: 36,
                          height: 22,
                          borderRadius: 11,
                          background: c.autoNoGo ? "var(--accent)" : "var(--border)",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            left: c.autoNoGo ? 16 : 2,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            background: "#fff",
                            transition: "left 0.15s",
                          }}
                        />
                      </span>
                      <button className="d-icon-btn">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Decision bands */}
              <section
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    font: "600 13px/1 var(--font-sans)",
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  Decision bands
                </h3>
                <p
                  style={{
                    font: "400 12px/1.55 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginBottom: 18,
                  }}
                >
                  Thresholds as a percentage of max — works regardless of your criteria count.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="d-field-label" style={{ color: "var(--success-text)" }}>
                      Strong fit ≥
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        className="d-input"
                        defaultValue="80"
                        type="number"
                        style={{ flex: 1 }}
                      />
                      <span style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                  </div>
                  <div>
                    <label className="d-field-label" style={{ color: "var(--warning-text)" }}>
                      Conditional fit ≥
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        className="d-input"
                        defaultValue="60"
                        type="number"
                        style={{ flex: 1 }}
                      />
                      <span style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right rail — example */}
            <aside>
              <div className="m-ai-box" style={{ position: "sticky", top: 0 }}>
                <div className="lbl">
                  <span className="spark">✦</span> See an example
                </div>
                <p style={{ font: "400 12px/1.65 var(--font-sans)", color: "var(--text-primary)" }}>
                  When you set{" "}
                  <strong style={{ color: "var(--amber-text)" }}>
                    Work-Life Balance weight to 5
                  </strong>
                  , AI flags any company where Glassdoor WLB is below 3.8 as a likely miss.
                </p>
                <p
                  style={{
                    font: "400 12px/1.65 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginTop: 10,
                  }}
                >
                  When AI scores a criterion 3 with <em>low confidence</em>, it's because only one
                  weak signal was found — surfaces an amber dot on the company panel.
                </p>
                <p
                  style={{
                    font: "400 12px/1.65 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginTop: 10,
                  }}
                >
                  Auto No-Go ON means a single zero on that criterion overrides the total. Useful
                  for hard culture lines.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button className="d-btn ghost">Skip this framework</button>
        <span style={{ flex: 1, font: "400 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
          Skipped frameworks block AI jobs until completed.
        </span>
        <button className="d-btn secondary">Save & next: Job Search →</button>
        <button className="d-btn primary lg" style={{ padding: "0 20px" }}>
          Generate framework <Icon name="spark" size={13} />
        </button>
      </div>
    </div>
  </div>
);

const MobileOnbStep1 = () => {
  const [items, setItems] = React.useState(
    CRIT_SHORT.map((c) => ({
      ...c,
      importance: c.weight >= 4 ? "high" : c.weight >= 2 ? "med" : "low",
    })),
  );
  const toggleOn = (i) =>
    setItems((prev) => prev.map((c, idx) => (idx === i ? { ...c, on: !c.on } : c)));
  const setImp = (i, v) =>
    setItems((prev) => prev.map((c, idx) => (idx === i ? { ...c, importance: v } : c)));
  const toggleNoGo = (i) =>
    setItems((prev) => prev.map((c, idx) => (idx === i ? { ...c, autoNoGo: !c.autoNoGo } : c)));

  const impColor = {
    high: "var(--accent-text)",
    med: "var(--warning-text)",
    low: "var(--text-muted)",
  };
  const impBg = { high: "var(--accent-bg)", med: "var(--warning-bg)", low: "var(--surface-2)" };
  const impBorder = { high: "var(--accent)", med: "var(--warning)", low: "var(--border)" };
  const selected = items.filter((c) => c.on);

  return (
    <MShell>
      <WizardHeader step={1} label="Company Research" onMobile />
      <div className="m-body" style={{ background: "var(--bg)" }}>
        <div style={{ padding: "16px 16px 8px" }}>
          <h1
            style={{
              font: "600 19px/1.25 var(--font-sans)",
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            What do you care about?
          </h1>
          <p
            style={{
              font: "400 13px/1.55 var(--font-sans)",
              color: "var(--text-secondary)",
              marginTop: 6,
            }}
          >
            Check what matters. Rate each one. AI uses your ratings to score every company
            overnight.
          </p>
        </div>

        {/* Live summary strip */}
        <div style={{ padding: "10px 16px", display: "flex", gap: 8 }}>
          {[
            { lbl: "Selected", val: selected.length, color: "var(--accent)" },
            {
              lbl: "High priority",
              val: selected.filter((c) => c.importance === "high").length,
              color: "var(--accent-text)",
            },
            {
              lbl: "Dealbreakers",
              val: selected.filter((c) => c.autoNoGo).length,
              color: "var(--danger-text)",
            },
          ].map((s) => (
            <div
              key={s.lbl}
              style={{
                flex: 1,
                padding: "8px 10px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ font: "700 18px/1 var(--font-sans)", color: s.color }}>{s.val}</div>
              <div
                style={{
                  font: "400 10px/1.3 var(--font-sans)",
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            margin: "8px 16px",
            overflow: "hidden",
          }}
        >
          {items.map((c, i) => (
            <div
              key={c.name}
              style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              {/* Criterion select row */}
              <div
                style={{ padding: "13px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <button
                  onClick={() => toggleOn(i)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    flexShrink: 0,
                    marginTop: 1,
                    background: c.on ? "var(--accent)" : "transparent",
                    border: `2px solid ${c.on ? "var(--accent)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {c.on && <Icon name="check" size={12} color="var(--bg)" strokeWidth={2.5} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      font: `${c.on ? 600 : 400} 13px/1.3 var(--font-sans)`,
                      color: c.on ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {c.name}
                  </div>
                  {/* AI signals description — always visible */}
                  <div
                    style={{
                      font: "400 11.5px/1.55 var(--font-sans)",
                      color: c.on ? "var(--text-secondary)" : "var(--text-muted)",
                      marginTop: 4,
                      textWrap: "pretty",
                    }}
                  >
                    <span
                      style={{
                        font: "600 10px/1 var(--font-sans)",
                        color: "var(--amber-text)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginRight: 4,
                      }}
                    >
                      AI looks at:
                    </span>
                    {c.signals}
                  </div>
                </div>
              </div>

              {/* Rating row — only when selected */}
              {c.on && (
                <div
                  style={{
                    padding: "0 14px 12px 46px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {["low", "med", "high"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setImp(i, v)}
                      style={{
                        height: 28,
                        padding: "0 12px",
                        borderRadius: 7,
                        background: c.importance === v ? impBg[v] : "transparent",
                        border: `1.5px solid ${c.importance === v ? impBorder[v] : "var(--border)"}`,
                        font: `${c.importance === v ? 600 : 400} 12px/1 var(--font-sans)`,
                        color: c.importance === v ? impColor[v] : "var(--text-muted)",
                      }}
                    >
                      {v === "low" ? "Low" : v === "med" ? "Medium" : "High"}
                    </button>
                  ))}
                  {c.importance === "high" && (
                    <button
                      onClick={() => toggleNoGo(i)}
                      style={{
                        height: 28,
                        padding: "0 10px",
                        borderRadius: 7,
                        background: c.autoNoGo ? "var(--danger-bg)" : "transparent",
                        border: `1.5px solid ${c.autoNoGo ? "var(--danger)" : "var(--border)"}`,
                        font: `${c.autoNoGo ? 600 : 400} 12px/1 var(--font-sans)`,
                        color: c.autoNoGo ? "var(--danger-text)" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon
                        name="flag"
                        size={11}
                        color={c.autoNoGo ? "var(--danger)" : "var(--text-muted)"}
                      />
                      Dealbreaker
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add custom criterion */}
          <div
            style={{
              padding: "13px 14px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              font: "500 13px/1 var(--font-sans)",
              color: "var(--accent-text)",
            }}
          >
            <Icon name="plus" size={14} /> Add your own criterion
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
      <div className="m-actionbar">
        <button className="m-btn ghost sm">Skip</button>
        <button className="m-btn primary full">Generate framework</button>
      </div>
    </MShell>
  );
};

Object.assign(window, {
  MobileOnbPath,
  MobileOnbQuick,
  MobileOnbStep1,
  MobileOnbStep1Review,
  MobileOnbStep2,
  MobileOnbStep3,
  DesktopOnbPath,
  DesktopOnbStep1,
});
