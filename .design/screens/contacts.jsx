// contacts.jsx — list + many detail states (Draft / History / About tabs).

/* ============================================================
   Mobile — /contacts list
   ============================================================ */
function ContactListRow({ c, accent = false }) {
  return (
    <a className="m-row">
      <Avatar name={c.name} sz="md" warm={accent} />
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="name">{c.name}</div>
        <div className="meta">
          {c.company} · {c.designation}
        </div>
      </div>
      <div className="right">
        <Badge status={c.status} sm />
        {c.nextTouch && (
          <span className="meta" style={{ color: "var(--text-secondary)" }}>
            in {c.nextTouch}
          </span>
        )}
        {c.touch > 0 && !c.nextTouch && <span className="meta">T{c.touch}</span>}
      </div>
      <Icon name="chevR" size={16} color="var(--text-muted)" className="chev" />
    </a>
  );
}

const MobileContacts = () => (
  <MShell
    tabbar={<MTabBar active="contacts" />}
    fab={
      <button className="m-fab">
        <Icon name="plus" size={22} color="#fff" />
      </button>
    }
  >
    <div className="m-header">
      <div className="title">Contacts</div>
      <button className="ico-btn">
        <Icon name="search" size={18} />
      </button>
      <button className="ico-btn">
        <Icon name="filter" size={18} />
      </button>
    </div>

    <div className="m-chips">
      <button className="m-chip active">
        All <span className="count">{CONTACTS.length}</span>
      </button>
      <button className="m-chip">
        Draft ready <span className="count">3</span>
      </button>
      <button className="m-chip">
        In pipeline <span className="count">3</span>
      </button>
      <button className="m-chip">
        Needs input <span className="count">1</span>
      </button>
      <button className="m-chip">Replied</button>
      <button className="m-chip">Re-engage</button>
      <button className="m-chip">Dead</button>
    </div>

    <div className="m-body surface" style={{ background: "var(--surface)" }}>
      <div style={{ padding: "12px 16px 6px" }}>
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          Drafts ready · ready to send <span className="count">3</span>
        </div>
      </div>
      {CONTACTS.filter((c) => c.status === "draft_ready").map((c) => (
        <ContactListRow key={c.id} c={c} accent />
      ))}

      <div style={{ padding: "20px 16px 6px" }}>
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          In pipeline <span className="count">3</span>
        </div>
      </div>
      {CONTACTS.filter((c) => c.status === "in_pipeline").map((c) => (
        <ContactListRow key={c.id} c={c} />
      ))}

      <div style={{ padding: "20px 16px 6px" }}>
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          Other <span className="count">{CONTACTS.length - 6}</span>
        </div>
      </div>
      {CONTACTS.filter((c) => c.status !== "draft_ready" && c.status !== "in_pipeline")
        .slice(0, 5)
        .map((c) => (
          <ContactListRow key={c.id} c={c} />
        ))}
    </div>
  </MShell>
);

/* ============================================================
   /contacts — empty + loading states
   ============================================================ */
const MobileContactsEmpty = () => (
  <MShell
    tabbar={<MTabBar active="contacts" />}
    fab={
      <button className="m-fab">
        <Icon name="plus" size={22} color="#fff" />
      </button>
    }
  >
    <div className="m-header">
      <div className="title">Contacts</div>
      <button className="ico-btn">
        <Icon name="search" size={18} />
      </button>
    </div>
    <div
      className="m-body"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.05,
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
          border: "1.5px solid var(--accent)",
          opacity: 0.1,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          position: "relative",
        }}
      >
        <Icon name="user" size={32} color="var(--text-muted)" />
      </div>
      <h2
        style={{
          font: "600 18px/1.3 var(--font-sans)",
          color: "var(--text-primary)",
          marginBottom: 6,
        }}
      >
        No contacts yet
      </h2>
      <p
        style={{
          font: "400 14px/1.55 var(--font-sans)",
          color: "var(--text-secondary)",
          textAlign: "center",
          textWrap: "pretty",
          maxWidth: 280,
        }}
      >
        Accept a company to trigger contact discovery, or add someone manually.
      </p>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
          maxWidth: 280,
        }}
      >
        <button className="m-btn primary full">
          <Icon name="building" size={16} color="#fff" /> Open Companies
        </button>
        <button className="m-btn secondary full">
          <Icon name="plus" size={16} /> Add contact manually
        </button>
      </div>
    </div>
  </MShell>
);

const MobileContactsLoading = () => (
  <MShell tabbar={<MTabBar active="contacts" />}>
    <div className="m-header">
      <div className="title">Contacts</div>
      <button className="ico-btn">
        <Icon name="search" size={18} />
      </button>
      <button className="ico-btn">
        <Icon name="filter" size={18} />
      </button>
    </div>
    <div className="m-chips">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="skel"
          style={{ width: 80 + i * 12, height: 32, borderRadius: 999, flexShrink: 0 }}
        />
      ))}
    </div>
    <div className="m-body surface" style={{ background: "var(--surface)" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="skel" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ width: 140 - i * 6, height: 12 }} />
            <div className="skel" style={{ width: 200 - i * 14, height: 10, marginTop: 8 }} />
          </div>
          <div className="skel" style={{ width: 60, height: 18, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  </MShell>
);

/* ============================================================
   Detail screen — shared shell, with tabs (Draft | History | About)
   ============================================================ */
function MContactDetailShell({
  contact,
  activeTab = "draft",
  children,
  banner = null,
  footer = null,
}) {
  return (
    <MShell>
      <div className="m-header surface">
        <button className="ico-btn back">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="col grow" style={{ minWidth: 0 }}>
          <div className="title">{contact.name}</div>
          <div className="sub">{contact.designation}</div>
        </div>
        <button className="ico-btn">
          <Icon name="more" size={18} />
        </button>
      </div>

      {/* Meta bar */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <a
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            font: "500 12px/1 var(--font-sans)",
            color: "var(--accent-text)",
          }}
        >
          <Icon name="building" size={12} /> {contact.company}
        </a>
        <Badge fit={contact.fitBand} sm />
        <Badge status={contact.status} sm />
        {contact.abVariant && <AbPill variant={contact.abVariant} variable={contact.abVariable} />}
      </div>

      {/* Tabs */}
      <div className="m-tabs">
        <button className={`tab ${activeTab === "draft" ? "active" : ""}`}>
          <span
            className="spark"
            style={{ color: activeTab === "draft" ? "var(--accent)" : "var(--text-muted)" }}
          >
            ✦
          </span>{" "}
          Draft
        </button>
        <button className={`tab ${activeTab === "history" ? "active" : ""}`}>
          History <span className="count">{contact.history?.length || 0}</span>
        </button>
        <button className={`tab ${activeTab === "about" ? "active" : ""}`}>About</button>
      </div>

      {banner}

      <div className="m-body">{children}</div>

      {footer}
    </MShell>
  );
}

/* ============================================================
   Draft tab (Priya — draft ready)
   ============================================================ */
const MobileContactDraft = () => {
  const c = CONTACTS.find((c) => c.id === "c1");
  return (
    <MContactDetailShell
      contact={c}
      activeTab="draft"
      footer={
        <div className="m-actionbar">
          <button className="m-btn secondary">Mark replied</button>
          <button className="m-btn primary full">Mark as sent</button>
        </div>
      }
    >
      <div className="m-section" style={{ paddingTop: 12 }}>
        <div className="m-section-label">
          <span className="spark">✦</span> Touch {c.touch} · {c.channel}
          <span className="right">Drafted {c.draftAge} ago</span>
        </div>

        <div className="m-draft">
          <div className="subj">{c.draftSubject}</div>
          <div className="body">{c.draftBody}</div>
          <div className="actions">
            <button>
              <Icon name="copy" size={14} /> Copy subject
            </button>
            <button>
              <Icon name="copy" size={14} /> Copy body
            </button>
            <button>
              <Icon name="copy" size={14} /> Copy all
            </button>
          </div>
        </div>

        <div className="m-callout" style={{ marginTop: 14 }}>
          <strong>Variant B · observation-based.</strong> Subject leads with a specific observation
          about her IndiaFOSS talk. Win condition: a reply within 7 days.
        </div>
      </div>

      {/* AI research + context — compact, secondary to draft */}
      <div
        style={{
          margin: "0 16px 16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              font: "600 10px/1 var(--font-sans)",
              color: "var(--amber-text)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <Icon name="spark" size={11} color="var(--amber)" style={{ marginRight: 4 }} /> Context
            used in draft
          </span>
          <span
            style={{
              marginLeft: "auto",
              font: "500 11px/1 var(--font-sans)",
              color: "var(--accent-text)",
            }}
          >
            Edit in About
          </span>
        </div>
        <div
          style={{
            padding: "10px 14px",
            font: "400 12px/1.65 var(--font-sans)",
            color: "var(--text-secondary)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {c.aiResearch}
        </div>
        <div style={{ padding: "10px 14px" }}>
          <textarea
            className="m-textarea"
            style={{ fontSize: 12 }}
            placeholder="Add your context — overrides AI research in the draft…"
            rows={2}
          />
        </div>
      </div>
    </MContactDetailShell>
  );
};

/* Inline confirm variant of the Draft tab */
const MobileContactConfirm = () => {
  const c = CONTACTS.find((c) => c.id === "c1");
  return (
    <MContactDetailShell
      contact={c}
      activeTab="draft"
      footer={
        <div
          style={{
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="m-confirm">
            <span className="q">Did you send this to Priya?</span>
            <button className="m-btn sm secondary" style={{ height: 32 }}>
              Not yet
            </button>
            <button className="m-btn sm primary" style={{ height: 32 }}>
              Yes, sent
            </button>
          </div>
        </div>
      }
    >
      <div className="m-section" style={{ paddingTop: 12 }}>
        <div className="m-section-label">
          <span className="spark">✦</span> Touch {c.touch} · {c.channel}
          <span className="right">Drafted {c.draftAge} ago</span>
        </div>
        <div className="m-draft">
          <div className="subj">{c.draftSubject}</div>
          <div className="body">{c.draftBody}</div>
          <div className="actions">
            <button>
              <Icon name="copy" size={14} /> Copy subject
            </button>
            <button>
              <Icon name="copy" size={14} /> Copy body
            </button>
            <button>
              <Icon name="copy" size={14} /> Copy all
            </button>
          </div>
        </div>
      </div>
      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-callout accent">
          <strong>Sequence advances on confirmation.</strong> Touch 2 will be drafted at 1:00 AM if
          you don't hear back in 7 days.
        </div>
      </div>
    </MContactDetailShell>
  );
};

/* ============================================================
   History tab
   ============================================================ */
const MobileContactHistory = () => {
  const c = CONTACTS.find((c) => c.id === "c4"); // Rohan — replied
  const history = [
    {
      sent: true,
      date: "May 6",
      label: "Touch 1 · Email",
      ch: "email",
      text: "Hi Rohan, your postmortem on the mock service rollback was the clearest one I've read in months. The revert via traffic shaping — not a deploy — was the bit I keep thinking about.\n\nI've spent 4 years on payments infra — most recently reduced sync time by 72% on a 500K-record reconciliation job. Is there a backend role on your team I should know about? Happy with a yes/no.",
    },
    {
      sent: false,
      date: "May 9",
      label: "Reply",
      ch: "email",
      text: "Thanks Aditya — let's chat. Can you do Tuesday next week? I'd be curious to hear more about the 72% number — we've been debating a similar approach for our reconciliation pipeline.",
    },
    {
      sent: true,
      date: "May 9",
      label: "Reply",
      ch: "email",
      text: "Tuesday works — 5:30 PM IST? I'll send a calendar invite. The 72% was mostly batching writes + a cheap idempotency token — happy to walk through it.",
    },
  ];

  return (
    <MContactDetailShell contact={c} activeTab="history">
      <div style={{ paddingBottom: 24 }}>
        {/* Thread summary */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
            3 messages
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "var(--border-strong)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              font: "500 12px/1 var(--font-sans)",
              color: "var(--success-text)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="check" size={12} color="var(--success)" /> 1 reply
          </span>
          <span
            style={{
              font: "400 11px/1 var(--font-sans)",
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            Email
          </span>
        </div>

        {/* Chat bubbles */}
        <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
          {history.map((h, i) => (
            <div key={i} style={{ padding: "6px 16px" }}>
              {/* Date + touch label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: h.sent ? "flex-end" : "flex-start",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                  {h.label} · {h.date}
                </span>
                <Icon
                  name={h.ch === "email" ? "mail" : "linkedin"}
                  size={11}
                  color="var(--text-muted)"
                />
              </div>
              {/* Bubble row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  justifyContent: h.sent ? "flex-end" : "flex-start",
                }}
              >
                {!h.sent && <Avatar name={c.name} sz="sm" />}
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "11px 14px",
                    borderRadius: h.sent ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: h.sent ? "var(--accent-bg)" : "var(--surface)",
                    border: h.sent
                      ? "1px solid color-mix(in srgb, var(--accent) 25%, transparent)"
                      : "1px solid var(--border)",
                    font: "400 13px/1.7 var(--font-sans)",
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {h.text}
                </div>
                {h.sent && <Avatar name={USER.name} sz="sm" warm />}
              </div>
            </div>
          ))}
        </div>

        {/* Replied badge */}
        <div
          style={{
            margin: "8px 16px 0",
            padding: "11px 14px",
            background: "var(--success-bg)",
            border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="ok" size={18} color="var(--success)" />
          <div>
            <div style={{ font: "600 13px/1.2 var(--font-sans)", color: "var(--success-text)" }}>
              Marked as replied
            </div>
            <div
              style={{
                font: "400 11px/1.3 var(--font-sans)",
                color: "var(--success-text)",
                opacity: 0.75,
                marginTop: 3,
              }}
            >
              May 9, 11:24 AM · Touch 1 · ab_replied = true
            </div>
          </div>
        </div>
      </div>
    </MContactDetailShell>
  );
};

/* ============================================================
   About tab
   ============================================================ */
const MobileContactAbout = () => {
  const c = CONTACTS.find((c) => c.id === "c1");
  return (
    <MContactDetailShell contact={c} activeTab="about">
      <div className="m-section" style={{ paddingTop: 14 }}>
        {/* Identity card */}
        <div
          className="m-card"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}
        >
          <Avatar name={c.name} sz="lg" warm />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 16px/1.25 var(--font-sans)", color: "var(--text-primary)" }}>
              {c.name}
            </div>
            <div
              style={{
                font: "400 12px/1.4 var(--font-sans)",
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              {c.designation}
            </div>
          </div>
        </div>

        {/* Contact channels */}
        <div className="m-card" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
          <a
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Icon name="mail" size={16} color="var(--text-secondary)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
                {c.email}
              </div>
              <div
                style={{
                  font: "400 11px/1.3 var(--font-sans)",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Work email
              </div>
            </div>
            <button className="ico-btn">
              <Icon name="copy" size={14} />
            </button>
          </a>
          <a style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
            <Icon name="linkedin" size={16} color="var(--text-secondary)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
                {c.linkedin}
              </div>
              <div
                style={{
                  font: "400 11px/1.3 var(--font-sans)",
                  color: "var(--success-text)",
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{ width: 5, height: 5, borderRadius: 999, background: "var(--success)" }}
                />{" "}
                Connection accepted
              </div>
            </div>
            <button className="ico-btn">
              <Icon name="external" size={14} />
            </button>
          </a>
        </div>
      </div>

      {/* Linked company */}
      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">Linked company</div>
        <a className="m-card tap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={c.company} sz="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
              {c.company}
            </div>
            <div
              style={{
                font: "400 12px/1.3 var(--font-sans)",
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              Fintech / Payments
            </div>
          </div>
          <Badge fit="strong_fit" sm />
          <Icon name="chevR" size={16} color="var(--text-muted)" />
        </a>
      </div>

      {/* Source + sequence info */}
      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">Sequence</div>
        <div className="m-card" style={{ padding: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-secondary)" }}>
              Touch
            </span>
            <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
              {c.touch} of 3
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-secondary)" }}>
              Channel
            </span>
            <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--text-primary)" }}>
              {c.channel}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-secondary)" }}>
              A/B
            </span>
            <AbPill variant={c.abVariant} variable={c.abVariable} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--text-secondary)" }}>
              Source
            </span>
            <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--text-muted)" }}>
              Apollo · enriched 18 May
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">Notes</div>
        <textarea
          className="m-textarea"
          placeholder="Add a note…"
          defaultValue="Mention the standard-webhooks contributors thread if she replies — she's listed as a maintainer."
          rows={3}
        />
      </div>

      <div className="m-section" style={{ paddingTop: 0 }}>
        <button className="m-btn danger full">Mark as dead</button>
      </div>
    </MContactDetailShell>
  );
};

/* ============================================================
   Re-engage state
   ============================================================ */
const MobileContactReengage = () => {
  const c = CONTACTS.find((c) => c.id === "c7");
  return (
    <MContactDetailShell
      contact={c}
      activeTab="draft"
      banner={
        <div style={{ padding: "12px 16px 0" }}>
          <div className="m-callout">
            <strong>Re-engage recommended.</strong> {c.reEngageRec}
          </div>
        </div>
      }
      footer={
        <div className="m-actionbar">
          <button className="m-btn secondary">Skip · don't send</button>
          <button className="m-btn primary full">Send re-engage</button>
        </div>
      }
    >
      <div className="m-section" style={{ paddingTop: 14 }}>
        <div className="m-section-label">
          <span className="spark">✦</span> Re-engage draft · Touch 1
          <span className="right">60 days since last touch</span>
        </div>

        <div className="m-draft">
          <div className="subj">following up — re: that thread on multi-tenant routing</div>
          <div className="body">{`Hi Vikram,

We were trading messages back in March about Freshworks' multi-tenant routing approach — then life got busy on both sides.

Two months later your team shipped the V2 of the routing layer (saw the blog post — the cache-key invalidation story is wild). I'm now full-time hunting for senior backend roles, and you were the engineering leader I most wanted to talk to.

Are you still hiring? Even a quick "no, but try X" would be helpful.

Best,
Aditya`}</div>
          <div className="actions">
            <button>
              <Icon name="copy" size={14} /> Copy subject
            </button>
            <button>
              <Icon name="copy" size={14} /> Copy body
            </button>
            <button>
              <Icon name="copy" size={14} /> Copy all
            </button>
          </div>
        </div>
      </div>

      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">Prior sequence</div>
        <div className="m-card" style={{ padding: 14, background: "var(--surface-2)" }}>
          <div style={{ font: "400 12px/1.65 var(--font-sans)", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Touch 1 (email)</span>
              <span>Mar 17 · no reply</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Touch 2 (email)</span>
              <span>Mar 24 · no reply</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Touch 3 (email)</span>
              <span>Mar 31 · no reply</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid var(--border)",
                paddingTop: 6,
                marginTop: 6,
              }}
            >
              <span>Marked dead</span>
              <span>Apr 7</span>
            </div>
          </div>
        </div>
      </div>
    </MContactDetailShell>
  );
};

/* ============================================================
   Needs input — held at Not Started
   ============================================================ */
const MobileContactNeedsInput = () => {
  const c = CONTACTS.find((c) => c.id === "c3");
  return (
    <MContactDetailShell
      contact={c}
      activeTab="draft"
      footer={
        <div className="m-actionbar">
          <button className="m-btn secondary">
            <Icon name="spark" size={14} /> Generate anyway
          </button>
          <button className="m-btn primary full">Save context</button>
        </div>
      }
    >
      <div className="m-section" style={{ paddingTop: 14 }}>
        <div className="m-callout">
          <strong>Held at Not started.</strong> AI ran personalisation search but didn't find public
          writing, talks, or shared context for Kavya. Add what you know, or generate without
          context.
        </div>
      </div>

      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">
          <span className="spark">✦</span> AI search results
        </div>
        <div className="m-card" style={{ padding: 14, background: "var(--surface-2)" }}>
          <div style={{ font: "400 12px/1.7 var(--font-sans)", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <Icon name="cross" size={14} color="var(--text-muted)" /> "Kavya Iyer" CRED engineer
              <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>0 useful</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <Icon name="cross" size={14} color="var(--text-muted)" /> "Kavya Iyer" medium.com OR
              dev.to OR talk
              <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>0 useful</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <Icon name="cross" size={14} color="var(--text-muted)" /> "Kavya Iyer" site:github.com
              <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>0 useful</span>
            </div>
          </div>
          <p
            style={{
              font: "400 12px/1.55 var(--font-sans)",
              color: "var(--text-muted)",
              marginTop: 10,
              textWrap: "pretty",
            }}
          >
            Haiku returned null. Personalisation will be company-level only unless you add context
            below.
          </p>
        </div>
      </div>

      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">Your context for personalisation</div>
        <textarea
          className="m-textarea"
          placeholder="Add insider knowledge, referrals, shared interests, or anything you know about Kavya that AI couldn't find online."
          rows={5}
        />

        <p className="m-field-help">Saving this triggers a new draft tonight at 1:00 AM.</p>
      </div>
    </MContactDetailShell>
  );
};

/* ============================================================
   Failed state
   ============================================================ */
const MobileContactFailed = () => {
  const c = CONTACTS.find((c) => c.id === "c9");
  return (
    <MContactDetailShell
      contact={c}
      activeTab="draft"
      footer={
        <div className="m-actionbar">
          <button className="m-btn ghost">View error log</button>
          <button className="m-btn primary full">
            <Icon name="retry" size={14} color="#fff" /> Retry now
          </button>
        </div>
      }
    >
      <div className="m-section" style={{ paddingTop: 14 }}>
        <div className="m-callout danger">
          <strong style={{ color: "var(--danger-text)" }}>Drafting failed after 3 retries.</strong>{" "}
          Apollo enrichment timed out at 02:14, 02:38, and 03:04 IST last night. Most likely Apollo
          rate-limiting — retrying manually usually clears it.
        </div>
      </div>

      <div className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-section-label">Failure log</div>
        <div className="m-card" style={{ padding: 0, overflow: "hidden" }}>
          {[
            { time: "May 19 · 02:14", err: "Apollo people/match · 429 rate-limited" },
            { time: "May 19 · 02:38", err: "Apollo people/match · 504 gateway" },
            { time: "May 19 · 03:04", err: "Apollo people/match · 429 rate-limited" },
          ].map((l, i) => (
            <div
              key={i}
              style={{
                padding: "12px 14px",
                borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="warning" size={14} color="var(--warning)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ font: "500 12px/1.3 var(--font-sans)", color: "var(--text-primary)" }}
                >
                  {l.time}
                </div>
                <div
                  style={{
                    font: "400 11px/1.3 var(--font-sans)",
                    color: "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {l.err}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="m-field-help">
          After 3 failures, status moved to Failed. Surfaced in this morning's digest under "Needs
          attention".
        </p>
      </div>
    </MContactDetailShell>
  );
};

/* ============================================================
   /contacts/new — manual add
   ============================================================ */
const MobileContactNew = () => (
  <MShell>
    <div className="m-header">
      <button className="ico-btn back">
        <Icon name="close" size={20} />
      </button>
      <div className="title">New contact</div>
      <button className="m-btn sm primary" style={{ height: 32 }}>
        Save
      </button>
    </div>
    <div className="m-body" style={{ background: "var(--bg)" }}>
      <div className="m-section">
        <p
          style={{
            font: "400 13px/1.55 var(--font-sans)",
            color: "var(--text-secondary)",
            textWrap: "pretty",
            marginBottom: 20,
          }}
        >
          Manual contacts skip the Apollo search. AI will still run personalisation research on
          Claude Haiku before drafting.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Full name *</label>
          <input className="m-input" placeholder="e.g. Priya Sharma" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Company *</label>
          <input className="m-input" placeholder="Search or add new…" defaultValue="Razorpay" />
          <p className="m-field-help">Linked to existing companies in your pipeline.</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Designation</label>
          <input className="m-input" placeholder="e.g. Engineering Manager, Payments" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Email</label>
          <input className="m-input" placeholder="name@company.com" type="email" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">LinkedIn URL</label>
          <input className="m-input" placeholder="linkedin.com/in/…" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 12,
              padding: "12px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: "1.5px solid var(--accent)",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />
            </span>
            <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
              LinkedIn connection accepted
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Your personalisation context</label>
          <textarea
            className="m-textarea"
            placeholder="Anything that should personalise outreach — shared context, referrals, meetings."
            rows={4}
          />
          <p className="m-field-help">
            Optional. If empty, AI runs DuckDuckGo + Haiku before drafting.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="m-field-label">Linked job (optional)</label>
          <select className="m-input">
            <option>No job linked — exploratory outreach</option>
            <option>Senior Backend Engineer · Razorpay</option>
          </select>
        </div>
      </div>
    </div>
  </MShell>
);

/* ============================================================
   DESKTOP — /contacts (table + side panel)
   ============================================================ */
const DesktopContacts = () => {
  const c = CONTACTS.find((c) => c.id === "c1");
  return (
    // Custom shell: panel stretches full height alongside the entire left column
    <div className="iso-screen">
      <div className="d-screen">
        <DSidebar active="contacts" />
        {/* Two-column grid: left = topbar+filters+table, right = panel */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* LEFT: topbar + filters + scrollable table */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRight: "1px solid var(--border)",
            }}
          >
            <header className="d-topbar">
              <div className="title">Contacts</div>
              <div className="right">
                <button className="d-btn ghost">
                  <Icon name="search" size={14} />
                </button>
                <button className="d-btn secondary">
                  <Icon name="plus" size={13} /> Add manually
                </button>
              </div>
            </header>
            <div className="d-filters">
              <button className="d-chip">
                <span className="lbl">Status:</span> <span className="val">Draft ready</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Company:</span> <span className="val">All</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Channel:</span> <span className="val">All</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Fit:</span> <span className="val">All bands</span>{" "}
                <Icon name="chevD" size={11} />
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                {CONTACTS.length} contacts
              </span>
            </div>
            <div style={{ overflow: "auto", flex: 1, background: "var(--bg)" }}>
              <div
                className="d-thead"
                style={{ gridTemplateColumns: "2fr 1.4fr 80px 1fr 110px 90px" }}
              >
                <div>Name</div>
                <div>Company</div>
                <div>Touch</div>
                <div>Channel</div>
                <div>Status</div>
                <div>Next</div>
              </div>
              {CONTACTS.map((co) => (
                <div
                  key={co.id}
                  className={`d-trow ${co.id === c.id ? "active" : ""}`}
                  style={{ gridTemplateColumns: "2fr 1.4fr 80px 1fr 110px 90px" }}
                >
                  <div>
                    <div className="d-cell-name">{co.name}</div>
                    <div className="d-cell-sub">{co.designation}</div>
                  </div>
                  <div>
                    <div className="d-cell-name" style={{ fontSize: 12, fontWeight: 500 }}>
                      {co.company}
                    </div>
                    <div className="d-cell-sub">
                      <Badge fit={co.fitBand} sm />
                    </div>
                  </div>
                  <div>
                    <span className="d-cell-accent">{co.touch > 0 ? `T${co.touch}` : "—"}</span>
                  </div>
                  <div className="d-cell-meta">{co.channel || "—"}</div>
                  <div>
                    <Badge status={co.status} sm />
                  </div>
                  <div className="d-cell-meta">{co.nextTouch ? `in ${co.nextTouch}` : "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: panel — full height, starts at top */}
          <aside
            className="d-panel"
            style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Panel header */}
            <div className="head" style={{ flexShrink: 0 }}>
              <div className="head-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={c.name} sz="md" warm />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{c.name}</div>
                    <div className="sub">
                      {c.designation} ·{" "}
                      <a href="#" style={{ color: "var(--accent-text)" }}>
                        {c.company}
                      </a>
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
                <Badge status={c.status} />
                <AbPill variant={c.abVariant} variable={c.abVariable} />
                <span
                  style={{
                    marginLeft: "auto",
                    font: "400 11px/1 var(--font-sans)",
                    color: "var(--text-muted)",
                  }}
                >
                  Touch {c.touch} · {c.channel}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface)",
                flexShrink: 0,
                padding: "0 4px",
              }}
            >
              {[
                { id: "draft", label: "✦ Draft", active: true },
                { id: "history", label: "History", active: false },
                { id: "about", label: "About", active: false },
              ].map((t) => (
                <button
                  key={t.id}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    font: `${t.active ? 600 : 400} 12px/1 var(--font-sans)`,
                    color: t.active ? "var(--text-primary)" : "var(--text-secondary)",
                    borderBottom: t.active ? "2px solid var(--accent)" : "2px solid transparent",
                    background: "transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="body" style={{ flex: 1, overflow: "auto" }}>
              {/* DRAFT FIRST — primary action */}
              <div className="section">
                <div className="sl" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>✦ Draft · Touch {c.touch}</span>
                  <Badge status={c.status} sm />
                </div>
                <div className="d-draft">
                  <div className="subj">{c.draftSubject}</div>
                  <button className="copy">
                    <Icon name="copy" size={11} /> Copy
                  </button>
                </div>
                <div className="d-draft" style={{ marginTop: 8 }}>
                  <div className="body">{c.draftBody}</div>
                  <button className="copy">
                    <Icon name="copy" size={11} /> Copy body
                  </button>
                </div>
                {/* Copy all — single action below both boxes */}
                <button
                  className="d-btn secondary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                >
                  <Icon name="copy" size={13} /> Copy subject + body
                </button>
              </div>

              {/* Context used — compact, below draft, secondary importance */}
              <div
                className="section"
                style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
              >
                <div className="sl" style={{ marginBottom: 8 }}>
                  <span className="spark">✦</span> Context used in draft
                  <span
                    style={{
                      marginLeft: "auto",
                      font: "400 10px/1 var(--font-sans)",
                      color: "var(--text-muted)",
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    edit in About tab
                  </span>
                </div>
                <div className="d-ai-box" style={{ fontSize: 12, lineHeight: 1.6 }}>
                  {c.aiResearch}
                </div>
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="d-input d-textarea"
                    placeholder="Add your own context (overrides AI research)…"
                    rows={2}
                  />
                </div>
              </div>

              {/* History preview */}
              <div className="section">
                <div className="sl">Conversation history</div>
                <div className="d-timeline">
                  {[
                    {
                      ch: "mail",
                      meta: "Touch 1 · Email sent · 7 days ago",
                      preview:
                        "Hi Priya, saw the team is hiring senior backend engineers in payments…",
                    },
                    {
                      ch: "linkedin",
                      meta: "Touch 1 · LinkedIn sent · 7 days ago",
                      preview: "Hi Priya, also dropped a quick LinkedIn DM…",
                    },
                  ].map((h, i) => (
                    <div key={i} className="d-tl-item">
                      <span className="d-tl-ico">
                        <Icon name={h.ch} size={13} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="d-tl-meta">{h.meta}</div>
                        <div className="d-tl-preview">{h.preview}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="footer" style={{ flexShrink: 0 }}>
              <button className="d-btn primary">Mark as sent</button>
              <button className="d-btn secondary">Mark as replied</button>
              <div style={{ flex: 1 }} />
              <button className="d-btn danger">Mark dead</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const DesktopContactDetail = () => DesktopContacts(); // Same view; the panel is the detail.

Object.assign(window, {
  MobileContacts,
  MobileContactsEmpty,
  MobileContactsLoading,
  MobileContactDraft,
  MobileContactConfirm,
  MobileContactHistory,
  MobileContactAbout,
  MobileContactReengage,
  MobileContactNeedsInput,
  MobileContactFailed,
  MobileContactNew,
  DesktopContacts,
  DesktopContactDetail,
});
