// settings.jsx — Frameworks (with defaults banner) · A/B analytics · Digest · Account

/* ============================================================
   Mobile nav — shared settings header + sub-nav
   ============================================================ */
function SettingsShell({ active = "frameworks", children }) {
  const tabs = [
    { id: "frameworks", label: "Frameworks" },
    { id: "ab", label: "Analytics" },
    { id: "digest", label: "Digest" },
    { id: "account", label: "Account" },
  ];

  return (
    <MShell>
      <div className="m-header">
        <button className="ico-btn back">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="title">Settings</div>
      </div>
      <div className="m-tabs" style={{ overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? "active" : ""}`}
            style={{ flex: "none", padding: "0 18px", minWidth: 0 }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="m-body">{children}</div>
    </MShell>
  );
}

/* ============================================================
   /settings/frameworks
   ============================================================ */
function FrameworkCard({ name, tab, seededDefault = false, lastUpdated, desc }) {
  return (
    <div className="m-card" style={{ padding: 16, marginBottom: 12 }}>
      {seededDefault && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--amber-bg)",
            border: "1px solid var(--amber-border)",
            borderRadius: 7,
            padding: "7px 10px",
            marginBottom: 12,
            font: "500 12px/1.4 var(--font-sans)",
            color: "var(--amber-text)",
          }}
        >
          <Icon name="spark" size={12} />
          Using defaults — personalise to improve results
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
            {name}
          </div>
          <div
            style={{
              font: "400 12px/1.55 var(--font-sans)",
              color: "var(--text-secondary)",
              marginTop: 4,
              textWrap: "pretty",
            }}
          >
            {desc}
          </div>
        </div>
        <button className="m-btn sm secondary" style={{ flexShrink: 0 }}>
          Edit
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
        }}
      >
        <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--text-muted)" }}>
          Updated {lastUpdated}
        </span>
        <button
          style={{
            font: "500 11px/1 var(--font-sans)",
            color: "var(--accent-text)",
            marginLeft: "auto",
          }}
        >
          View versions
        </button>
      </div>
    </div>
  );
}

const MobileSetFrameworks = () => (
  <SettingsShell active="frameworks">
    <div className="m-section">
      <div className="m-section-label">User-owned frameworks</div>
      <p
        style={{
          font: "400 12px/1.55 var(--font-sans)",
          color: "var(--text-secondary)",
          marginBottom: 16,
          textWrap: "pretty",
        }}
      >
        AI fetches the latest saved version at runtime — never a cached version. Each save creates a
        new version row; the last 5 are restorable.
      </p>

      <FrameworkCard
        name="Company Research"
        seededDefault={false}
        lastUpdated="May 14, 2026"
        desc="Salary gates, ethics flags, 8 scored criteria, decision bands. Controls how every company in your pipeline is evaluated."
      />

      <FrameworkCard
        name="Job Search"
        seededDefault={true}
        lastUpdated="Seeded May 12, 2026"
        desc="Role titles, required skills, salary floor, experience range, recency window. Controls what jobs AI surfaces each week."
      />

      <FrameworkCard
        name="A/B Testing"
        seededDefault={false}
        lastUpdated="May 16, 2026"
        desc="Active variable (Subject line), Variant A (question-based) and Variant B (observation-based) style instructions."
      />
    </div>

    <div className="m-section" style={{ paddingTop: 0 }}>
      <div className="m-section-label">Fixed system prompts</div>
      <div className="m-callout" style={{ marginBottom: 10 }}>
        <strong>Email Drafting</strong> and <strong>Contact Search</strong> are fixed — they apply
        to all users identically. Not user-configurable.
      </div>
      <div className="m-card" style={{ padding: 14, background: "var(--surface-2)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              name: "Email Drafting",
              desc: "Cold email principles, 4-check filter, follow-up rules, channel notes.",
            },
            {
              name: "Contact Search",
              desc: "Apollo target title list, enrichment pipeline, personalisation research.",
            },
          ].map((f) => (
            <div key={f.name} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: "var(--text-muted)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
                  {f.name}
                </div>
                <div
                  style={{
                    font: "400 12px/1.5 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginTop: 3,
                    textWrap: "pretty",
                  }}
                >
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SettingsShell>
);

/* ============================================================
   /settings/ab — A/B analytics (enough data)
   ============================================================ */
const MobileSetAb = () => (
  <SettingsShell active="ab">
    <div className="m-section">
      <div className="m-section-label">Active variable: Subject line</div>

      <div className="m-card" style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 70px 60px 80px",
            padding: "10px 14px",
            background: "var(--surface-2)",
            font: "600 10px/1 var(--font-sans)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <div>Variant</div>
          <div>Assigned</div>
          <div>Replies</div>
          <div>Rate</div>
        </div>

        {/* Variant A */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 70px 60px 80px",
            padding: "14px",
            alignItems: "start",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span className="m-badge accent sm">A</span>
              <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
                Question-based
              </span>
            </div>
            <div
              style={{
                font: "400 11px/1.4 var(--font-sans)",
                color: "var(--text-secondary)",
                fontStyle: "italic",
              }}
            >
              "quick question about your backend stack"
            </div>
          </div>
          <div
            style={{
              font: "600 16px/1 var(--font-sans)",
              color: "var(--text-primary)",
              textAlign: "right",
              paddingTop: 2,
            }}
          >
            23
          </div>
          <div
            style={{
              font: "600 16px/1 var(--font-sans)",
              color: "var(--text-primary)",
              textAlign: "right",
              paddingTop: 2,
            }}
          >
            4
          </div>
          <div style={{ textAlign: "right", paddingTop: 2 }}>
            <span style={{ font: "700 18px/1 var(--font-sans)", color: "var(--success-text)" }}>
              17%
            </span>
          </div>
        </div>

        {/* Variant B */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 70px 60px 80px",
            padding: "14px",
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span className="m-badge amber sm">B</span>
              <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
                Observation-based
              </span>
            </div>
            <div
              style={{
                font: "400 11px/1.4 var(--font-sans)",
                color: "var(--text-secondary)",
                fontStyle: "italic",
              }}
            >
              "noticed you scaled X to Y"
            </div>
          </div>
          <div
            style={{
              font: "600 16px/1 var(--font-sans)",
              color: "var(--text-primary)",
              textAlign: "right",
              paddingTop: 2,
            }}
          >
            21
          </div>
          <div
            style={{
              font: "600 16px/1 var(--font-sans)",
              color: "var(--text-primary)",
              textAlign: "right",
              paddingTop: 2,
            }}
          >
            5
          </div>
          <div style={{ textAlign: "right", paddingTop: 2 }}>
            <span style={{ font: "700 18px/1 var(--font-sans)", color: "var(--success-text)" }}>
              24%
            </span>
          </div>
        </div>
      </div>

      {/* Visual bar chart */}
      <div className="m-card" style={{ padding: 16 }}>
        <div
          style={{
            font: "600 11px/1 var(--font-sans)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}
        >
          Reply rate comparison
        </div>
        {[
          { lbl: "A · Question", val: 17, color: "var(--accent)", max: 30 },
          { lbl: "B · Observation", val: 24, color: "var(--amber)", max: 30 },
        ].map((r) => (
          <div key={r.lbl} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                font: "500 12px/1 var(--font-sans)",
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              <span>{r.lbl}</span>
              <span style={{ fontWeight: 700 }}>{r.val}%</span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--surface-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(r.val / r.max) * 100}%`,
                  borderRadius: 4,
                  background: r.color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
        <div
          style={{
            font: "400 12px/1.55 var(--font-sans)",
            color: "var(--text-secondary)",
            marginTop: 12,
            textWrap: "pretty",
          }}
        >
          B (observation-based) is leading by 7pp. 44 contacts tested —{" "}
          <strong style={{ color: "var(--text-primary)" }}>moderate confidence</strong>. Collect 6
          more per variant for high confidence.
        </div>
      </div>

      <div className="m-card" style={{ padding: 14, marginTop: 12, background: "var(--surface)" }}>
        <div
          style={{
            font: "600 12px/1 var(--font-sans)",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Win condition
        </div>
        <div style={{ font: "400 12px/1.55 var(--font-sans)", color: "var(--text-secondary)" }}>
          A reply (user clicks "Mark as replied"). Click tracking is manual in v1. Win data never
          changes mid-sequence — variable continuity is guaranteed.
        </div>
      </div>
    </div>

    <div className="m-section" style={{ paddingTop: 0 }}>
      <div className="m-section-label">Switch active variable</div>
      <div className="m-card" style={{ padding: 0, overflow: "hidden" }}>
        {[
          "Subject line ✓",
          "Preview text",
          "CTA copy/placement",
          "Send time",
          "Email body structure",
        ].map((v, i) => (
          <div
            key={v}
            style={{
              padding: "14px 16px",
              borderBottom: i < 4 ? "1px solid var(--border)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {i === 0 ? (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: "5px solid var(--accent)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: "2px solid var(--border)",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                font: `${i === 0 ? 600 : 400} 13px/1 var(--font-sans)`,
                color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              {v.replace(" ✓", "")}
            </span>
            {i === 0 && (
              <span className="m-badge accent sm" style={{ marginLeft: "auto" }}>
                Active
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="m-field-help">
        Historical results are retained when you switch. New contacts get the new variable; existing
        contacts keep theirs.
      </p>
    </div>
  </SettingsShell>
);

/* A/B — not enough data state */
const MobileSetAbLow = () => (
  <SettingsShell active="ab">
    <div className="m-section">
      <div className="m-section-label">Active variable: Subject line</div>
      <div className="m-callout" style={{ marginBottom: 16 }}>
        <strong>Not enough data yet.</strong> You need at least 20 contacts per variant before
        results are shown. Currently: A → 8 contacts, B → 7 contacts.
      </div>
      <div className="m-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { lbl: "A · Question-based", assigned: 8, needed: 20 },
            { lbl: "B · Observation-based", assigned: 7, needed: 20 },
          ].map((r) => (
            <div key={r.lbl}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  font: "500 12px/1 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                <span>{r.lbl}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {r.assigned}/{r.needed}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "var(--surface-2)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(r.assigned / r.needed) * 100}%`,
                    background: "var(--border-strong)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            font: "400 12px/1.55 var(--font-sans)",
            color: "var(--text-muted)",
          }}
        >
          Results will appear once you reach 20 contacts per variant.
        </div>
      </div>
    </div>
  </SettingsShell>
);

/* ============================================================
   /settings/digest
   ============================================================ */
const MobileSetDigest = () => (
  <SettingsShell active="digest">
    <div className="m-section">
      <div className="m-section-label">Delivery time</div>

      <div className="m-card" style={{ padding: 16 }}>
        <label className="m-field-label">Digest time</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {["7:00 AM", "8:00 AM", "9:00 AM"].map((t, i) => (
            <button
              key={t}
              className={`m-btn ${i === 1 ? "primary" : "secondary"}`}
              style={{ height: 42, fontSize: 13 }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input className="m-input" type="time" defaultValue="08:00" style={{ flex: 1 }} />
          <span style={{ font: "400 13px/1 var(--font-sans)", color: "var(--text-muted)" }}>
            Custom
          </span>
        </div>
      </div>

      <div className="m-card" style={{ padding: 16, marginTop: 12 }}>
        <label className="m-field-label">Timezone</label>
        <select className="m-input">
          <option>Asia/Kolkata (IST, UTC+5:30)</option>
          <option>Asia/Dubai (GST, UTC+4:00)</option>
          <option>Europe/London (GMT, UTC+0:00)</option>
          <option>America/New_York (EST, UTC-5:00)</option>
        </select>
        <p className="m-field-help">
          Cron jobs run at 1:00 AM in your timezone. Digest sends at your configured time.
        </p>
      </div>
    </div>

    <div className="m-section" style={{ paddingTop: 0 }}>
      <div className="m-section-label">Delivery address</div>
      <div className="m-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Icon name="mail" size={16} color="var(--text-secondary)" />
          <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
            {USER.email}
          </span>
          <span className="m-badge success sm" style={{ marginLeft: "auto" }}>
            Verified
          </span>
        </div>
        <p
          style={{
            font: "400 12px/1.55 var(--font-sans)",
            color: "var(--text-muted)",
            textWrap: "pretty",
          }}
        >
          Digest goes to your registered Clerk email. All digest links are plain app URLs — no
          expiry, no signed tokens. Clerk handles auth on load.
        </p>
      </div>
    </div>

    <div className="m-section" style={{ paddingTop: 0 }}>
      <div className="m-section-label">Test delivery</div>
      <button className="m-btn secondary full">
        <Icon name="send" size={14} /> Send a preview now
      </button>
      <p className="m-field-help">
        Sends the current digest (all sections with content) to your inbox immediately.
      </p>
    </div>

    <div className="m-section" style={{ paddingTop: 0 }}>
      <div
        className="m-callout accent"
        style={{ background: "var(--success-bg)", borderLeftColor: "var(--success)" }}
      >
        <strong style={{ color: "var(--success-text)" }}>Next digest:</strong> Tomorrow, May 22, at
        8:00 AM IST.
      </div>
    </div>
  </SettingsShell>
);

/* ============================================================
   /settings/account — Clerk-hosted
   ============================================================ */
const MobileSetAccount = () => (
  <SettingsShell active="account">
    <div className="m-section">
      <div className="m-section-label">Profile</div>
      {/* Clerk-hosted UI stub */}
      <div className="m-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={USER.name} sz="lg" warm />
          <div>
            <div style={{ font: "600 16px/1.25 var(--font-sans)", color: "var(--text-primary)" }}>
              {USER.name}
            </div>
            <div
              style={{
                font: "400 13px/1.4 var(--font-sans)",
                color: "var(--text-secondary)",
                marginTop: 3,
              }}
            >
              {USER.email}
            </div>
          </div>
          <button className="ico-btn" style={{ marginLeft: "auto" }}>
            <Icon name="edit" size={16} />
          </button>
        </div>
        {[
          { label: "Username", val: "aditya.kumar" },
          { label: "Member since", val: "May 12, 2026" },
        ].map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                font: "500 13px/1 var(--font-sans)",
                color: "var(--text-secondary)",
                flex: 1,
              }}
            >
              {r.label}
            </span>
            <span style={{ font: "400 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
              {r.val}
            </span>
          </div>
        ))}
      </div>
    </div>
    <div className="m-section" style={{ paddingTop: 0 }}>
      <div className="m-section-label">Connected accounts</div>
      <div className="m-card" style={{ padding: 0, overflow: "hidden" }}>
        {[
          { name: "Google", email: USER.email, connected: true },
          { name: "GitHub", email: "Not connected", connected: false },
        ].map((s, i) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: i === 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={s.name.toLowerCase()} size={16} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "500 13px/1.2 var(--font-sans)", color: "var(--text-primary)" }}>
                {s.name}
              </div>
              <div
                style={{
                  font: "400 11px/1.3 var(--font-sans)",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {s.email}
              </div>
            </div>
            {s.connected ? (
              <span className="m-badge success sm">Connected</span>
            ) : (
              <button className="m-btn sm secondary">Connect</button>
            )}
          </div>
        ))}
      </div>
    </div>
    <div className="m-section" style={{ paddingTop: 0 }}>
      <div className="m-section-label">Danger zone</div>
      <button
        className="m-btn secondary full"
        style={{ color: "var(--danger)", borderColor: "var(--danger-bg)", marginBottom: 10 }}
      >
        Sign out of all devices
      </button>
      <button
        className="m-btn secondary full"
        style={{ color: "var(--danger)", borderColor: "var(--danger-bg)" }}
      >
        Delete account
      </button>
    </div>
  </SettingsShell>
);

/* ============================================================
   DESKTOP — /settings/frameworks
   ============================================================ */
const DesktopSettings = () => (
  <DShell active="today">
    <DTopbar title="Settings" />
    <div
      style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      {/* Settings horizontal tab bar — replaces the inner sidebar */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          display: "flex",
          gap: 0,
          flexShrink: 0,
        }}
      >
        {[
          { id: "frameworks", label: "Frameworks", active: true },
          { id: "ab", label: "Analytics", active: false },
          { id: "digest", label: "Digest", active: false },
          { id: "account", label: "Account", active: false },
        ].map((item) => (
          <a
            key={item.id}
            href="#"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 16px",
              font: `${item.active ? 600 : 400} 13px/1 var(--font-sans)`,
              color: item.active ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: item.active ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
              textDecoration: "none",
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Frameworks content */}
      <div
        style={{
          padding: "32px 40px",
          overflow: "auto",
          flex: 1,
          maxWidth: 900,
          position: "relative",
        }}
      >
        {/* Decorative circles — top right corner */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.05,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 40,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "1.5px solid var(--accent)",
            opacity: 0.1,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1, marginBottom: 28 }}>
          <h1
            style={{
              font: "600 20px/1.25 var(--font-sans)",
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Frameworks
          </h1>
          <p
            style={{
              font: "400 13px/1.6 var(--font-sans)",
              color: "var(--text-secondary)",
              marginTop: 6,
              textWrap: "pretty",
              maxWidth: 580,
            }}
          >
            AI fetches the latest saved version at runtime — never a cached version. Every save
            creates a new version row; the last 5 are restorable.
          </p>
        </div>

        {/* Defaults banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--amber-bg)",
            border: "1px solid var(--amber-border)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
          }}
        >
          <Icon name="spark" size={16} color="var(--amber)" />
          <div
            style={{
              flex: 1,
              font: "400 13px/1.55 var(--font-sans)",
              color: "var(--amber-text)",
              textWrap: "pretty",
            }}
          >
            <strong>Job Search</strong> is still using defaults. Personalise it to improve search
            results for your specific situation.
          </div>
          <button className="d-btn secondary sm" style={{ flexShrink: 0 }}>
            Edit now
          </button>
        </div>

        {/* User-owned frameworks */}
        <h2
          style={{
            font: "600 11px/1 var(--font-sans)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}
        >
          User-owned
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {[
            {
              name: "Company Research",
              updated: "May 14, 2026 · v3",
              seed: false,
              desc: "Salary gates, ethics flags, 8 scored criteria (max 135 pts), decision bands. Controls how every company is evaluated — strong fit ≥80%, conditional 60–79%.",
              tags: ["3 versions", "8 criteria", "Max 135 pts"],
            },
            {
              name: "Job Search",
              updated: "Seeded May 12, 2026 · v1",
              seed: true,
              desc: "Role titles, required skills (Node.js OR Express.js), salary floor, experience range, recency window, results cap. Controls what jobs AI surfaces each week.",
              tags: ["1 version (seeded)", "5 target titles", "7-day recency"],
            },
            {
              name: "A/B Testing",
              updated: "May 16, 2026 · v2",
              seed: false,
              desc: "Active variable: Subject line. Variant A (question-based) and Variant B (observation-based). Strict alternation assignment.",
              tags: ["2 versions", "Subject line active", "44 contacts tested"],
            },
          ].map((fw) => (
            <div
              key={fw.name}
              style={{
                background: "var(--surface)",
                border: `1px solid ${fw.seed ? "var(--amber-border)" : "var(--border)"}`,
                borderRadius: 10,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3
                      style={{
                        font: "600 15px/1.25 var(--font-sans)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {fw.name}
                    </h3>
                    {fw.seed && <span className="m-badge amber sm">Using defaults</span>}
                  </div>
                  <p
                    style={{
                      font: "400 13px/1.6 var(--font-sans)",
                      color: "var(--text-secondary)",
                      textWrap: "pretty",
                    }}
                  >
                    {fw.desc}
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {fw.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 22,
                          padding: "0 8px",
                          borderRadius: 5,
                          background: "var(--surface-2)",
                          font: "500 11px/1 var(--font-sans)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="d-btn ghost sm">View versions</button>
                  <button className="d-btn secondary sm">Edit</button>
                </div>
              </div>
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                  font: "400 11px/1 var(--font-sans)",
                  color: "var(--text-muted)",
                }}
              >
                {fw.updated}
              </div>
            </div>
          ))}
        </div>

        {/* Fixed prompts */}
        <h2
          style={{
            font: "600 11px/1 var(--font-sans)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}
        >
          Fixed system prompts
        </h2>
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              font: "400 13px/1.6 var(--font-sans)",
              color: "var(--text-secondary)",
              marginBottom: 12,
              textWrap: "pretty",
            }}
          >
            These apply to all users identically. They are not user-configurable and do not appear
            in onboarding.
          </div>
          {[
            {
              name: "Email Drafting",
              desc: "Cold email principles, 4-check filter, follow-up rules (Touch 1–3 + Re-engage), channel-specific notes.",
            },
            {
              name: "Contact Search",
              desc: "Apollo target title list, enrichment pipeline with pre-dedup, Haiku personalisation research protocol.",
            },
          ].map((f) => (
            <div
              key={f.name}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 0",
                borderBottom: f.name !== "Contact Search" ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  background: "var(--text-muted)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
                  {f.name}
                </div>
                <div
                  style={{
                    font: "400 12px/1.5 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginTop: 4,
                    textWrap: "pretty",
                  }}
                >
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DShell>
);

Object.assign(window, {
  MobileSetFrameworks,
  MobileSetAb,
  MobileSetAbLow,
  MobileSetDigest,
  MobileSetAccount,
  DesktopSettings,
});
