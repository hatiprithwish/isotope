// jobs.jsx — list, detail (JD review), manual add

const JD_SAMPLE = `About the Role

Postman is looking for a Staff Engineer to join our Platform Infrastructure team in Bengaluru. You will own the design and delivery of systems that serve 20M+ developers daily — from API gateway reliability to internal developer platforms.

Responsibilities

• Drive the architecture and execution of platform-level initiatives across storage, networking, and compute abstraction layers
• Partner with product engineering teams to define platform contracts and SLAs
• Lead incident response for platform-layer outages; own the post-mortem culture
• Mentor senior engineers and contribute to the leveling process

Required

• 8+ years of backend engineering experience
• Deep expertise in distributed systems: consensus, replication, partition tolerance
• Proficiency in Node.js, Go, or Rust at production scale
• Experience with Kubernetes, Terraform, and CI/CD at scale
• Strong written communication — this role produces a lot of design docs

Preferred

• Experience building internal developer platforms or platform-as-a-service tooling
• Open source contributions in observability or reliability tooling
• Prior tech lead or Staff+ experience

Compensation

• ₹38–48 LPA + equity + benefits
• Learning budget: ₹1.2L/year
• Bengaluru · in-office 3 days/week`;

/* ============================================================
   Mobile — /jobs list
   ============================================================ */
function JobListRow({ j }) {
  const srcLabel =
    { linkedin: "LinkedIn", naukri: "Naukri", ai_suggested: "AI suggested", manual: "Manual" }[
      j.source
    ] || j.source;
  return (
    <a className="m-row">
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
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="name">{j.title}</div>
        <div className="meta">
          {j.company} · {j.location}
        </div>
      </div>
      <div className="right">
        <Badge status={j.status} sm />
      </div>
      <Icon name="chevR" size={16} color="var(--text-muted)" className="chev" />
    </a>
  );
}

const MobileJobs = () => (
  <MShell
    tabbar={<MTabBar active="jobs" />}
    fab={
      <button className="m-fab">
        <Icon name="plus" size={22} color="#fff" />
      </button>
    }
  >
    <div className="m-header">
      <div className="title">Jobs</div>
      <button className="ico-btn">
        <Icon name="search" size={18} />
      </button>
      <button className="ico-btn">
        <Icon name="filter" size={18} />
      </button>
    </div>

    <div className="m-chips">
      <button className="m-chip active">
        All <span className="count">{JOBS.length}</span>
      </button>
      <button className="m-chip">
        Needs review <span className="count">2</span>
      </button>
      <button className="m-chip">
        Accepted <span className="count">2</span>
      </button>
      <button className="m-chip">Applied</button>
      <button className="m-chip">AI suggested</button>
      <button className="m-chip">Rejected</button>
    </div>

    <div className="m-body surface" style={{ background: "var(--surface)" }}>
      {/* AI discover strip */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--amber-bg)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="spark" style={{ color: "var(--amber)", fontSize: 15 }}>
          ✦
        </span>
        <span
          style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--amber-text)", flex: 1 }}
        >
          Find new jobs matching your framework
        </span>
        <button className="m-btn sm secondary" style={{ height: 30, fontSize: 12 }}>
          Discover
        </button>
      </div>

      <div style={{ padding: "12px 16px 6px" }}>
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          Needs review <span className="count">2</span>
        </div>
      </div>
      {JOBS.filter((j) => j.status === "waiting_human").map((j) => (
        <JobListRow key={j.id} j={j} />
      ))}

      <div style={{ padding: "20px 16px 6px" }}>
        <div className="m-section-label" style={{ marginBottom: 0 }}>
          In progress{" "}
          <span className="count">
            {
              JOBS.filter((j) => j.status !== "waiting_human" && j.status !== "rejected_human")
                .length
            }
          </span>
        </div>
      </div>
      {JOBS.filter((j) => j.status !== "waiting_human" && j.status !== "rejected_human").map(
        (j) => (
          <JobListRow key={j.id} j={j} />
        ),
      )}

      {JOBS.filter((j) => j.status === "rejected_human").length > 0 && (
        <>
          <div style={{ padding: "20px 16px 6px" }}>
            <div className="m-section-label" style={{ marginBottom: 0 }}>
              Rejected{" "}
              <span className="count">
                {JOBS.filter((j) => j.status === "rejected_human").length}
              </span>
            </div>
          </div>
          {JOBS.filter((j) => j.status === "rejected_human").map((j) => (
            <JobListRow key={j.id} j={j} />
          ))}
        </>
      )}
    </div>
  </MShell>
);

/* ============================================================
   /jobs/[id] — JD review detail
   ============================================================ */
const MobileJobDetail = () => {
  const j = JOBS.find((j) => j.id === "j2"); // Postman Staff Eng — waiting human
  return (
    <MShell>
      <div className="m-header">
        <button className="ico-btn back">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="col grow" style={{ minWidth: 0 }}>
          <div className="title">{j.title}</div>
          <div className="sub">
            {j.company} · {j.location}
          </div>
        </div>
        <button className="ico-btn">
          <Icon name="more" size={18} />
        </button>
      </div>

      <div className="m-body">
        {/* Meta card */}
        <div className="m-section" style={{ paddingTop: 12 }}>
          <div className="m-card" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <Badge status={j.status} />
              <Badge fit={j.fitBand} />
              <span className="m-badge neutral sm">{j.source.replace("_", " ")}</span>
              <span className="m-badge neutral sm">{j.salary}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Company", j.company],
                ["Location", j.location],
                ["Salary", j.salary],
                ["Added", j.added],
              ].map(([k, v]) => (
                <div key={k}>
                  <div
                    style={{
                      font: "600 10px/1 var(--font-sans)",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 3,
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Linked company */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">Linked company</div>
          <a className="m-card tap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={j.company} sz="md" warm />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>
                {j.company}
              </div>
              <div
                style={{
                  font: "400 12px/1.3 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 2,
                }}
              >
                Dev tools · contacts added
              </div>
            </div>
            <Badge fit="strong_fit" sm />
            <Icon name="chevR" size={16} color="var(--text-muted)" />
          </a>
          <p className="m-field-help">
            Accepting this job will link it to the existing Postman company record — no new research
            needed.
          </p>
        </div>

        {/* JD text */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">Job description</div>
          <div className="m-card" style={{ padding: 16 }}>
            <pre
              style={{
                font: "400 13px/1.75 var(--font-sans)",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontFamily: "var(--font-sans)",
              }}
            >
              {JD_SAMPLE}
            </pre>
          </div>
        </div>

        {/* Source */}
        <div className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section-label">Source</div>
          <a className="m-card tap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="external" size={16} color="var(--text-secondary)" />
            <span
              style={{
                flex: 1,
                font: "400 13px/1.3 var(--font-sans)",
                color: "var(--text-primary)",
              }}
            >
              linkedin.com/jobs/view/3891234
            </span>
            <Icon name="chevR" size={14} color="var(--text-muted)" />
          </a>
        </div>

        {/* Notes */}
        <div className="m-section" style={{ paddingTop: 0, paddingBottom: 100 }}>
          <div className="m-section-label">Notes</div>
          <textarea className="m-textarea" placeholder="Add a note about this role…" rows={3} />
        </div>
      </div>

      <div className="m-actionbar">
        <button className="m-btn danger">Reject</button>
        <button className="m-btn primary full">Accept · add company</button>
      </div>
    </MShell>
  );
};

/* ============================================================
   /jobs/new — manual add
   ============================================================ */
const MobileJobNew = () => (
  <MShell>
    <div className="m-header">
      <button className="ico-btn back">
        <Icon name="close" size={20} />
      </button>
      <div className="title">New job</div>
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
          Paste the job description and fill in the details. Once you accept, this links to a
          company and contacts can be found.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Job title *</label>
          <input className="m-input" placeholder="e.g. Senior Backend Engineer" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Company *</label>
          <input className="m-input" placeholder="Search or add new…" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label className="m-field-label">Location</label>
            <input className="m-input" placeholder="Bengaluru / Remote" />
          </div>
          <div>
            <label className="m-field-label">Salary range</label>
            <input className="m-input" placeholder="e.g. 24–32 LPA" />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Source URL</label>
          <input className="m-input" placeholder="linkedin.com/jobs/…" type="url" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="m-field-label">Source</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {["LinkedIn", "Naukri", "Manual", "Other"].map((s, i) => (
              <button
                key={s}
                className={`m-btn ${i === 2 ? "primary" : "secondary"}`}
                style={{ height: 38, fontSize: 12 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label className="m-field-label">Job description *</label>
          <textarea
            className="m-textarea"
            placeholder="Paste the full JD here. AI uses this to personalise outreach for linked contacts."
            rows={8}
          />
        </div>

        <div className="m-callout accent">
          <strong>Accepting this job</strong> will trigger company research if the company isn't in
          your pipeline yet. Otherwise it links to the existing record.
        </div>
      </div>
    </div>
  </MShell>
);

/* ============================================================
   DESKTOP — /jobs
   ============================================================ */
const DesktopJobs = () => {
  const j = JOBS.find((j) => j.id === "j2");
  return (
    <div className="iso-screen">
      <div className="d-screen">
        <DSidebar active="jobs" />
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
              <div className="title">Jobs</div>
              <div className="right">
                <button className="d-btn secondary">
                  <Icon name="spark" size={13} /> Discover jobs
                </button>
                <button className="d-btn secondary">
                  <Icon name="plus" size={13} /> Add manually
                </button>
              </div>
            </header>
            <div className="d-filters">
              <button className="d-chip">
                <span className="lbl">Status:</span>
                <span className="val"> All</span> <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Source:</span>
                <span className="val"> All</span> <Icon name="chevD" size={11} />
              </button>
              <button className="d-chip">
                <span className="lbl">Fit:</span>
                <span className="val"> All bands</span> <Icon name="chevD" size={11} />
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>
                {JOBS.length} jobs
              </span>
            </div>
            <div style={{ overflow: "auto", flex: 1, background: "var(--bg)" }}>
              <div
                className="d-thead"
                style={{ gridTemplateColumns: "2fr 1.2fr 0.8fr 120px 110px 80px" }}
              >
                <div>Title</div>
                <div>Company</div>
                <div>Location</div>
                <div>Salary</div>
                <div>Status</div>
                <div>Added</div>
              </div>
              {JOBS.map((jb) => (
                <div
                  key={jb.id}
                  className={`d-trow ${jb.id === j.id ? "active" : ""}`}
                  style={{ gridTemplateColumns: "2fr 1.2fr 0.8fr 120px 110px 80px" }}
                >
                  <div>
                    <div className="d-cell-name">{jb.title}</div>
                    <div style={{ marginTop: 3 }}>
                      <Badge fit={jb.fitBand} sm />
                    </div>
                  </div>
                  <div
                    className="d-cell-name"
                    style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)" }}
                  >
                    {jb.company}
                  </div>
                  <div className="d-cell-meta">{jb.location}</div>
                  <div className="d-cell-meta">{jb.salary}</div>
                  <div>
                    <Badge status={jb.status} sm />
                  </div>
                  <div className="d-cell-meta">{jb.added}</div>
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
                <div style={{ minWidth: 0 }}>
                  <div className="name">{j.title}</div>
                  <div className="sub">
                    <a href="#" style={{ color: "var(--accent-text)" }}>
                      {j.company}
                    </a>{" "}
                    · {j.location}
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
                <Badge status={j.status} />
                <Badge fit={j.fitBand} />
                <span className="m-badge neutral sm">{j.source.replace("_", " ")}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    font: "500 11px/1 var(--font-sans)",
                    color: "var(--text-muted)",
                  }}
                >
                  {j.salary}
                </span>
              </div>
            </div>
            <div className="body" style={{ flex: 1, overflow: "auto" }}>
              <div className="section">
                <div className="sl">Linked company</div>
                <a
                  href="#"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--bg)",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <Avatar name={j.company} sz="sm" warm />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        font: "500 13px/1.2 var(--font-sans)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {j.company}
                    </div>
                    <div
                      style={{
                        font: "400 11px/1.3 var(--font-sans)",
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      Dev tools · contacts added
                    </div>
                  </div>
                  <Badge fit="strong_fit" sm />
                  <Icon name="chevR" size={13} color="var(--text-muted)" />
                </a>
              </div>
              <div className="section">
                <div className="sl">Job description</div>
                <div
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 14px",
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  <pre
                    style={{
                      font: "400 12px/1.75 var(--font-sans)",
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      margin: 0,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {JD_SAMPLE.slice(0, 700) + "…"}
                  </pre>
                </div>
              </div>
              <div className="section">
                <div className="sl">Notes</div>
                <textarea className="d-input d-textarea" placeholder="Add a note…" rows={2} />
              </div>
            </div>
            <div className="footer" style={{ flexShrink: 0 }}>
              <button className="d-btn danger">Reject</button>
              <div style={{ flex: 1 }} />
              <button className="d-btn primary">Accept · add company</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { MobileJobs, MobileJobDetail, MobileJobNew, DesktopJobs });
