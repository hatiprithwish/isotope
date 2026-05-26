// digest.jsx — Gmail-style inbox preview + full opened digest email
// Mobile: Gmail app inbox + opened view
// Desktop: Gmail desktop with digest opened

/* ============================================================
   Digest data
   ============================================================ */
const DIGEST_DATE = "Wednesday, May 21, 2026 · 8:00 AM IST";
const DIGEST_SUBJECT = "Isotope · 5 things to review today";
const DIGEST_PREVIEW =
  "Drafts ready: Priya Sharma · T1, Sneha Pillai · T1, Tanvi Ramesh · T1 (stalled). Companies: Zerodha, PhonePe, CRED, Byju's...";

/* ============================================================
   Gmail-skin helpers
   ============================================================ */
const GM = {
  bg: "#F6F8FC",
  surface: "#FFFFFF",
  border: "#E0E0E0",
  text: "#202124",
  sub: "#5F6368",
  muted: "#9AA0A6",
  blue: "#1A73E8",
  red: "#D93025",
  star: "#F4B400",
};

function GmailStatusBar({ dark = false }) {
  return (
    <div
      style={{
        height: 32,
        background: dark ? "#1F1F1F" : GM.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      <span style={{ font: '600 13px/1 "Google Sans", system-ui', color: dark ? "#FFF" : GM.text }}>
        9:41
      </span>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 100,
          background: dark ? "#2E2E2E" : "#2e2e2e",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div style={{ display: "flex", gap: 5 }}>
        {/* Signal bars, WiFi, battery (minimal) */}
        <svg width="14" height="11" viewBox="0 0 16 13">
          <rect x="0" y="9" width="3" height="3" rx="0.5" fill={dark ? "#FFF" : GM.text} />
          <rect x="4.5" y="6.5" width="3" height="5.5" rx="0.5" fill={dark ? "#FFF" : GM.text} />
          <rect x="9" y="3.5" width="3" height="8.5" rx="0.5" fill={dark ? "#FFF" : GM.text} />
        </svg>
        <svg width="14" height="11" viewBox="0 0 16 13">
          <path d="M8 10.5L1 4.5a9.5 9.5 0 0114 0L8 10.5z" fill={dark ? "#FFF" : GM.text} />
        </svg>
        <svg width="22" height="11" viewBox="0 0 26 13">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3"
            fill="none"
            stroke={dark ? "#FFF" : GM.text}
            strokeOpacity="0.5"
          />
          <rect x="2.5" y="2.5" width="16" height="8" rx="1.5" fill={dark ? "#FFF" : GM.text} />
        </svg>
      </div>
    </div>
  );
}

function GmailNavBar() {
  return (
    <div
      style={{
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: GM.bg,
        flexShrink: 0,
      }}
    >
      <div style={{ width: 108, height: 4, borderRadius: 2, background: GM.text, opacity: 0.4 }} />
    </div>
  );
}

/* ============================================================
   Mobile — Gmail inbox
   ============================================================ */
const MobileDigestInbox = () => (
  <div
    className="iso-screen"
    style={{ background: GM.bg, fontFamily: '"Google Sans", system-ui, sans-serif' }}
  >
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <GmailStatusBar />

      {/* Toolbar */}
      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: GM.bg,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 44,
            borderRadius: 22,
            background: GM.surface,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={GM.sub}>
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
          <span style={{ flex: 1, font: '400 15px/1 "Google Sans"', color: GM.sub }}>
            Search in mail
          </span>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#4285F4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: '600 13px/1 "Google Sans"',
              color: "#fff",
            }}
          >
            A
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{ display: "flex", borderBottom: `1px solid ${GM.border}`, background: GM.surface }}
      >
        {["Primary", "Social", "Promotions"].map((t, i) => (
          <div
            key={t}
            style={{
              flex: 1,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: `${i === 0 ? 600 : 400} 13px/1 "Google Sans"`,
              color: i === 0 ? GM.blue : GM.sub,
              borderBottom: i === 0 ? `2px solid ${GM.blue}` : "none",
              marginBottom: -1,
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Email list */}
      <div style={{ flex: 1, overflow: "auto", background: GM.bg }}>
        {/* Today section */}
        <div style={{ padding: "8px 16px 4px", font: '500 12px/1 "Google Sans"', color: GM.sub }}>
          Today
        </div>

        {/* Isotope digest — highlighted/unread */}
        <div
          style={{
            background: GM.surface,
            borderBottom: `1px solid ${GM.border}`,
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#4D7C0F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: '600 14px/1 "Google Sans"',
              color: "#fff",
              flexShrink: 0,
            }}
          >
            Is
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <span style={{ font: '700 15px/1 "Google Sans"', color: GM.text }}>Isotope</span>
              <span style={{ font: '400 12px/1 "Google Sans"', color: GM.sub }}>8:00 AM</span>
            </div>
            <div style={{ font: '600 13px/1.4 "Google Sans"', color: GM.text, marginBottom: 2 }}>
              {DIGEST_SUBJECT}
            </div>
            <div
              style={{
                font: '400 13px/1.4 "Google Sans"',
                color: GM.sub,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {DIGEST_PREVIEW}
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={GM.star} style={{ flexShrink: 0 }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>

        {/* Other emails (background) */}
        {[
          {
            from: "GitHub",
            sub: "[Isotope] new issue: ContactsPage render error",
            time: "7:12 AM",
            read: true,
          },
          {
            from: "LinkedIn",
            sub: "Priya Sharma viewed your profile",
            time: "Yesterday",
            read: true,
          },
          {
            from: "Rohan Krishnan",
            sub: "Re: Postman backend role — Zoom Tuesday?",
            time: "Yesterday",
            read: false,
          },
          {
            from: "Naukri Jobs",
            sub: '18 new jobs matching "Backend Engineer Bengaluru"',
            time: "Yesterday",
            read: true,
          },
          {
            from: "Apollo.io",
            sub: "Weekly credits summary — 12 used",
            time: "May 20",
            read: true,
          },
          {
            from: "Freshworks Careers",
            sub: "Your application was received",
            time: "May 19",
            read: true,
          },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              background: m.read ? GM.bg : GM.surface,
              borderBottom: `1px solid ${GM.border}`,
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: m.read ? "#e0e0e0" : "#9AA0A6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: '600 14px/1 "Google Sans"',
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {m.from[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span
                  style={{ font: `${m.read ? 400 : 700} 15px/1 "Google Sans"`, color: GM.text }}
                >
                  {m.from}
                </span>
                <span style={{ font: '400 12px/1 "Google Sans"', color: GM.sub }}>{m.time}</span>
              </div>
              <div
                style={{
                  font: `${m.read ? 400 : 600} 13px/1.4 "Google Sans"`,
                  color: m.read ? GM.sub : GM.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <GmailNavBar />
    </div>
  </div>
);

/* ============================================================
   Mobile — Gmail digest opened
   ============================================================ */
const MobileDigestOpened = () => (
  <div
    className="iso-screen"
    style={{ background: GM.bg, fontFamily: '"Google Sans", system-ui, sans-serif' }}
  >
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <GmailStatusBar />

      {/* Back bar */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          gap: 4,
          background: GM.bg,
          flexShrink: 0,
        }}
      >
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={GM.sub}>
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <span
          style={{
            flex: 1,
            font: '500 18px/1 "Google Sans"',
            color: GM.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {DIGEST_SUBJECT}
        </span>
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={GM.sub}>
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 24px" }}>
        {/* Sender meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 14,
            borderBottom: `1px solid ${GM.border}`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#4D7C0F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: '600 15px/1 "Google Sans"',
              color: "#fff",
              flexShrink: 0,
            }}
          >
            Is
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 14px/1.2 "Google Sans"', color: GM.text }}>
              Isotope{" "}
              <span style={{ color: GM.sub, fontWeight: 400 }}>&lt;digest@isotope.work&gt;</span>
            </div>
            <div style={{ font: '400 12px/1.4 "Google Sans"', color: GM.sub, marginTop: 2 }}>
              to me · {DIGEST_DATE}
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={GM.sub}>
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </div>

        {/* Digest body — actual styled email */}
        <div
          style={{
            fontFamily: '"Google Sans", system-ui',
            color: GM.text,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {/* Logo line */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <span
              style={{
                font: '600 17px/1 "Google Sans"',
                color: "#1C1917",
                letterSpacing: "-0.01em",
              }}
            >
              Isotope
            </span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4D7C0F" }} />
          </div>

          <h1
            style={{
              font: '600 20px/1.25 "Google Sans"',
              color: "#1C1917",
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            Good morning, Aditya.
          </h1>
          <p style={{ font: '400 13px/1.6 "Google Sans"', color: "#5F6368", marginBottom: 20 }}>
            {DIGEST_DATE}
          </p>

          {/* Section 0 — Needs input */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                font: '600 11px/1 "Google Sans"',
                color: "#5F6368",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 10,
              }}
            >
              ● Needs your input (1)
            </div>
            <div
              style={{
                background: "#F0F5E0",
                borderRadius: 8,
                padding: "12px 14px",
                borderLeft: "3px solid #4D7C0F",
                marginBottom: 10,
                font: '400 12px/1.55 "Google Sans"',
                color: "#1C1917",
              }}
            >
              AI couldn't find personalisation context for Kavya Iyer. Add what you know, or
              generate without context.
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #E0E0E0",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.2 "Google Sans"', color: "#1C1917" }}>
                  Kavya Iyer
                </div>
                <div style={{ font: '400 12px/1.3 "Google Sans"', color: "#5F6368", marginTop: 2 }}>
                  Staff Engineer, Platform · CRED · LinkedIn only
                </div>
              </div>
              <a
                href="app.isotope.work/contacts/c3"
                style={{
                  display: "inline-block",
                  padding: "7px 14px",
                  background: "#4D7C0F",
                  color: "#fff",
                  borderRadius: 6,
                  font: '500 12px/1 "Google Sans"',
                  textDecoration: "none",
                }}
              >
                Add context →
              </a>
            </div>
          </div>

          {/* Section 1 — Drafts ready */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                font: '600 11px/1 "Google Sans"',
                color: "#5F6368",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 10,
              }}
            >
              ✦ Drafts ready (3)
            </div>
            {[
              {
                name: "Priya Sharma",
                co: "Razorpay",
                touch: "T1",
                ch: "Email + LinkedIn",
                stalled: false,
              },
              { name: "Sneha Pillai", co: "Meesho", touch: "T1", ch: "Email", stalled: false },
              {
                name: "Tanvi Ramesh",
                co: "PhonePe",
                touch: "T1",
                ch: "Email + LinkedIn",
                stalled: true,
              },
            ].map((r) => (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid #E0E0E0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      font: '600 13px/1.2 "Google Sans"',
                      color: "#1C1917",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {r.name}
                    {r.stalled && (
                      <span
                        style={{
                          font: '500 10px/1 "Google Sans"',
                          color: "#C2410C",
                          background: "#FDECE2",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        STALLED
                      </span>
                    )}
                  </div>
                  <div
                    style={{ font: '400 12px/1.3 "Google Sans"', color: "#5F6368", marginTop: 2 }}
                  >
                    {r.co} · {r.touch} · {r.ch}
                  </div>
                </div>
                <a
                  href={`app.isotope.work/contacts/`}
                  style={{
                    display: "inline-block",
                    padding: "7px 14px",
                    background: r.stalled ? "#FDECE2" : "#4D7C0F",
                    color: r.stalled ? "#C2410C" : "#fff",
                    borderRadius: 6,
                    font: '500 12px/1 "Google Sans"',
                    textDecoration: "none",
                  }}
                >
                  {r.stalled ? "Did you send it?" : "Open draft →"}
                </a>
              </div>
            ))}
          </div>

          {/* Section 3 — Companies */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                font: '600 11px/1 "Google Sans"',
                color: "#5F6368",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 10,
              }}
            >
              ⬡ Companies to review (4)
            </div>
            {[
              { name: "Zerodha", band: "Conditional", score: "66%", flag: false },
              { name: "PhonePe", band: "Strong fit", score: "81%", flag: false },
              { name: "CRED", band: "Weak fit", score: "47%", flag: true },
              { name: "Byju's", band: "Disqualified", score: "0%", flag: true },
            ].map((r) => (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid #E0E0E0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      font: '600 13px/1.2 "Google Sans"',
                      color: "#1C1917",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {r.name}
                    {r.flag && <span style={{ fontSize: 12 }}>⚠️</span>}
                  </div>
                  <div
                    style={{ font: '400 12px/1.3 "Google Sans"', color: "#5F6368", marginTop: 2 }}
                  >
                    {r.band} · {r.score} match
                  </div>
                </div>
                <a
                  href={`app.isotope.work/companies/`}
                  style={{
                    display: "inline-block",
                    padding: "7px 14px",
                    background: "#F2EFE9",
                    color: "#4D7C0F",
                    borderRadius: 6,
                    font: '500 12px/1 "Google Sans"',
                    textDecoration: "none",
                  }}
                >
                  Review →
                </a>
              </div>
            ))}
          </div>

          {/* Section 6 — Needs attention */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                font: '600 11px/1 "Google Sans"',
                color: "#5F6368",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 10,
              }}
            >
              ⚠ Needs attention (1)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.2 "Google Sans"', color: "#9F1239" }}>
                  Karan Shah
                </div>
                <div style={{ font: '400 12px/1.3 "Google Sans"', color: "#5F6368", marginTop: 2 }}>
                  PhonePe · Contact · Apollo enrichment failed after 3 retries
                </div>
              </div>
              <a
                href={`app.isotope.work/contacts/c9`}
                style={{
                  display: "inline-block",
                  padding: "7px 14px",
                  background: "#FCE7EC",
                  color: "#9F1239",
                  borderRadius: 6,
                  font: '500 12px/1 "Google Sans"',
                  textDecoration: "none",
                }}
              >
                Retry →
              </a>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid #E0E0E0",
              font: '400 11px/1.6 "Google Sans"',
              color: "#9AA0A6",
              textAlign: "center",
            }}
          >
            <div
              style={{
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  font: '600 13px/1 "Google Sans"',
                  color: "#9AA0A6",
                  letterSpacing: "-0.01em",
                }}
              >
                Isotope
              </span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9AA0A6" }} />
            </div>
            <a
              href="app.isotope.work"
              style={{ color: "#4D7C0F", textDecoration: "none", fontWeight: 500 }}
            >
              Open app
            </a>
            {" · "}
            <a
              href="app.isotope.work/settings/digest"
              style={{ color: "#4D7C0F", textDecoration: "none", fontWeight: 500 }}
            >
              Digest settings
            </a>
            {" · "}
            <span>Sent by Resend · v1.7</span>
          </div>
        </div>
      </div>

      <GmailNavBar />
    </div>
  </div>
);

/* ============================================================
   Desktop — Gmail digest opened
   ============================================================ */
const DesktopDigest = () => (
  <div className="iso-screen">
    <div
      style={{
        height: "100%",
        display: "flex",
        fontFamily: '"Google Sans", system-ui, sans-serif',
        background: GM.bg,
        color: GM.text,
        overflow: "hidden",
      }}
    >
      {/* Gmail left sidebar */}
      <aside
        style={{
          width: 250,
          flexShrink: 0,
          padding: "16px 0",
          background: GM.surface,
          borderRight: `1px solid ${GM.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Gmail logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 16px 16px",
            font: '400 22px/1 "Product Sans", system-ui',
            color: "#5F6368",
          }}
        >
          <svg width="36" height="28" viewBox="0 0 36 28">
            <path d="M0 4l18 11L36 4v20H0z" fill="#EA4335" />
            <path d="M0 4l18 11L36 4H0z" fill="#FBBC04" />
            <path d="M36 4v20H24V14l12-10z" fill="#34A853" />
            <path d="M0 4v20h12V14L0 4z" fill="#4285F4" />
            <path d="M0 4l12 10 6-4-6-6H0z" fill="#C5221F" />
          </svg>
          <span>Gmail</span>
        </div>

        {/* Compose */}
        <div style={{ padding: "0 16px 16px" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 24px",
              background: "#C2E7FF",
              borderRadius: 16,
              border: "none",
              font: '500 14px/1 "Google Sans"',
              color: "#001D35",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#001D35">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Compose
          </button>
        </div>

        {/* Nav items */}
        {[
          { label: "Inbox", count: 3, active: true },
          { label: "Starred", count: null, active: false },
          { label: "Sent", count: null, active: false },
          { label: "Drafts", count: 2, active: false },
          { label: "All mail", count: null, active: false },
          { label: "Spam", count: null, active: false },
          { label: "Trash", count: null, active: false },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 24px",
              background: item.active ? "#D3E3FD" : "transparent",
              borderRadius: item.active ? "0 16px 16px 0" : 0,
              margin: "0 8px 0 0",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                font: `${item.active ? 600 : 400} 14px/1 "Google Sans"`,
                color: item.active ? "#001D35" : GM.sub,
              }}
            >
              {item.label}
            </span>
            {item.count && (
              <span
                style={{
                  font: '600 12px/1 "Google Sans"',
                  color: item.active ? "#001D35" : GM.sub,
                }}
              >
                {item.count}
              </span>
            )}
          </div>
        ))}
      </aside>

      {/* Main pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 16,
            borderBottom: `1px solid ${GM.border}`,
            background: GM.surface,
            flexShrink: 0,
          }}
        >
          <button
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={GM.sub}>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h2 style={{ font: '500 18px/1 "Google Sans"', color: GM.text, flex: 1 }}>
            {DIGEST_SUBJECT}
          </h2>
          <div style={{ display: "flex", gap: 4 }}>
            {["archive", "trash", "mark-unread", "snooze", "move", "more"].map((b) => (
              <button
                key={b}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 18, height: 18, borderRadius: 3, background: "#e0e0e0" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Email thread */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 48px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* Sender */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#4D7C0F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: '600 16px/1 "Google Sans"',
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                Is
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ font: '500 14px/1 "Google Sans"', color: GM.text }}>
                      Isotope{" "}
                      <span style={{ color: GM.sub, fontWeight: 400 }}>
                        &lt;digest@isotope.work&gt;
                      </span>
                    </div>
                    <div
                      style={{ font: '400 12px/1.6 "Google Sans"', color: GM.sub, marginTop: 2 }}
                    >
                      to me · {DIGEST_DATE}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={GM.sub}>
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                    <button
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={GM.sub}>
                        <path d="M6 6c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1V6zm2.5 10h1.5V8H8.5v8zm3.5 0h1.5V8H12v8zm3.5 0H17V8h-1.5v8zM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Email HTML body */}
            <div
              style={{
                background: "#FFF",
                border: `1px solid ${GM.border}`,
                borderRadius: 8,
                padding: "32px 40px",
                lineHeight: 1.6,
              }}
            >
              {/* Isotope wordmark */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
                <span
                  style={{
                    font: '600 20px/1 "Google Sans"',
                    color: "#1C1917",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Isotope
                </span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4D7C0F" }} />
              </div>

              <h1
                style={{
                  font: '600 24px/1.25 "Google Sans"',
                  color: "#1C1917",
                  letterSpacing: "-0.01em",
                  marginBottom: 4,
                }}
              >
                Good morning, Aditya.
              </h1>
              <p style={{ font: '400 14px/1.6 "Google Sans"', color: "#5F6368", marginBottom: 28 }}>
                {DIGEST_DATE}
              </p>

              {/* Each section */}
              {[
                {
                  title: "● Needs your input",
                  count: 1,
                  color: "#4D7C0F",
                  rows: [
                    {
                      name: "Kavya Iyer",
                      sub: "Staff Engineer, Platform · CRED · LinkedIn only",
                      action: "Add context",
                      actionBg: "#4D7C0F",
                      actionColor: "#fff",
                      href: "c3",
                    },
                  ],
                },
                {
                  title: "✦ Drafts ready",
                  count: 3,
                  color: "#B45309",
                  rows: [
                    {
                      name: "Priya Sharma",
                      sub: "Razorpay · T1 · Email + LinkedIn",
                      action: "Open draft",
                      actionBg: "#4D7C0F",
                      actionColor: "#fff",
                      href: "c1",
                    },
                    {
                      name: "Sneha Pillai",
                      sub: "Meesho · T1 · Email",
                      action: "Open draft",
                      actionBg: "#4D7C0F",
                      actionColor: "#fff",
                      href: "c6",
                    },
                    {
                      name: "Tanvi Ramesh ⏱ stalled 4d",
                      sub: "PhonePe · T1 · Email + LinkedIn",
                      action: "Did you send it?",
                      actionBg: "#FDECE2",
                      actionColor: "#C2410C",
                      href: "c11",
                    },
                  ],
                },
                {
                  title: "⬡ Companies to review",
                  count: 4,
                  color: "#5F6368",
                  rows: [
                    {
                      name: "Zerodha",
                      sub: "Conditional · 66% · Fintech",
                      action: "Review",
                      actionBg: "#F2EFE9",
                      actionColor: "#4D7C0F",
                      href: "co2",
                    },
                    {
                      name: "PhonePe",
                      sub: "Strong fit · 81% · Fintech",
                      action: "Review",
                      actionBg: "#F2EFE9",
                      actionColor: "#4D7C0F",
                      href: "co9",
                    },
                    {
                      name: "CRED ⚠",
                      sub: "Weak fit · 47% · ethics flagged",
                      action: "Review",
                      actionBg: "#F2EFE9",
                      actionColor: "#4D7C0F",
                      href: "co3",
                    },
                    {
                      name: "Byju's ⚠",
                      sub: "Disqualified · 0% · ethics + pre-filter fail",
                      action: "Review",
                      actionBg: "#F2EFE9",
                      actionColor: "#4D7C0F",
                      href: "co10",
                    },
                  ],
                },
                {
                  title: "⚠ Needs attention",
                  count: 1,
                  color: "#9F1239",
                  rows: [
                    {
                      name: "Karan Shah",
                      sub: "PhonePe · Contact · Apollo enrichment failed (3 retries)",
                      action: "Retry",
                      actionBg: "#FCE7EC",
                      actionColor: "#9F1239",
                      href: "c9",
                    },
                  ],
                },
              ].map((sec) => (
                <div key={sec.title} style={{ marginBottom: 28 }}>
                  <div
                    style={{
                      font: '600 11px/1 "Google Sans"',
                      color: "#5F6368",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 12,
                    }}
                  >
                    {sec.title} ({sec.count})
                  </div>
                  <div
                    style={{
                      border: `1px solid ${GM.border}`,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {sec.rows.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 16px",
                          borderBottom: i < sec.rows.length - 1 ? `1px solid ${GM.border}` : "none",
                          background: "#FFF",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ font: '600 14px/1.25 "Google Sans"', color: "#1C1917" }}>
                            {r.name}
                          </div>
                          <div
                            style={{
                              font: '400 12px/1.4 "Google Sans"',
                              color: "#5F6368",
                              marginTop: 3,
                            }}
                          >
                            {r.sub}
                          </div>
                        </div>
                        <a
                          href={`app.isotope.work/${r.href.startsWith("c") ? "contacts" : "companies"}/${r.href}`}
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            background: r.actionBg,
                            color: r.actionColor,
                            borderRadius: 6,
                            font: '500 13px/1 "Google Sans"',
                            textDecoration: "none",
                            flexShrink: 0,
                          }}
                        >
                          {r.action} →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div
                style={{
                  marginTop: 32,
                  paddingTop: 20,
                  borderTop: `1px solid ${GM.border}`,
                  font: '400 11px/1.8 "Google Sans"',
                  color: "#9AA0A6",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ font: '600 14px/1 "Google Sans"', color: "#9AA0A6" }}>
                    Isotope
                  </span>
                  <span
                    style={{ width: 5, height: 5, borderRadius: "50%", background: "#9AA0A6" }}
                  />
                </div>
                <a href="app.isotope.work" style={{ color: "#4D7C0F", fontWeight: 500 }}>
                  Open app
                </a>
                {" · "}
                <a
                  href="app.isotope.work/settings/digest"
                  style={{ color: "#4D7C0F", fontWeight: 500 }}
                >
                  Digest settings
                </a>
                {" · "}
                <span>Sent by Resend · No expiry · Auth via Clerk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { MobileDigestInbox, MobileDigestOpened, DesktopDigest });
