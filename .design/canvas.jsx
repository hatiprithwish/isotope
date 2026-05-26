// canvas.jsx — Final assembly. All DCArtboard elements are direct children
// of DCSection (the design-canvas starter requires this).
// Phone/desktop wrapping is done via helper FUNCTIONS (not components).

// ── phone bezel style ──────────────────────────────────────────────────────
function phoneBz(dark) {
  return {
    width: 393,
    height: 852,
    borderRadius: 50,
    overflow: "hidden",
    background: dark ? "#1C1917" : "#F7F5F2",
    border: `10px solid ${dark ? "rgba(90,85,80,0.7)" : "rgba(116,119,117,0.5)"}`,
    boxSizing: "border-box",
    boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  };
}

// Helper: returns a DCArtboard element (phone)
function mArt(id, label, screen, dark) {
  return (
    <DCArtboard key={id} id={id} label={label} width={393} height={852}>
      <div style={phoneBz(dark || false)}>{screen}</div>
    </DCArtboard>
  );
}

// Helper: returns a DCArtboard element (desktop Chrome window)
function dArt(id, label, screen, url, tab) {
  return (
    <DCArtboard key={id} id={id} label={label} width={1280} height={800}>
      <ChromeWindow
        width={1280}
        height={800}
        tabs={[{ title: tab || "Isotope" }]}
        url={url || "app.isotope.work"}
      >
        {screen}
      </ChromeWindow>
    </DCArtboard>
  );
}

// Dark variant of phone helper
function mArtDk(id, label, screen) {
  return mArt(id, label, screen, true);
}

// Null-safe screen renderer — shows a placeholder if screen not ready
function safe(Comp, label) {
  if (!Comp)
    return (
      <div style={{ padding: 20, color: "#999", fontFamily: "sans-serif" }}>Loading: {label}</div>
    );
  return <Comp />;
}

// ── Main canvas ────────────────────────────────────────────────────────────
function App() {
  return (
    <DesignCanvas
      title="Isotope — Full app design"
      subtitle="Every route · mobile (Android) + desktop · light/dark toggle top-right"
    >
      {/* ── TODAY ─────────────────────────────────────────────────────── */}
      <DCSection
        id="today"
        title="Today (home)"
        subtitle="Daily ritual screen — AI activity + all 7 digest sections in-app"
      >
        {mArt("today-m", "/today · mobile", safe(window.MobileToday, "MobileToday"))}
        {dArt(
          "today-d",
          "/today · desktop",
          safe(window.DesktopToday, "DesktopToday"),
          "app.isotope.work/today",
          "Isotope · Today",
        )}
      </DCSection>

      {/* ── AUTH ──────────────────────────────────────────────────────── */}
      <DCSection
        id="auth"
        title="Authentication"
        subtitle="Clerk-hosted login · signup · SSO callback"
      >
        {mArt("login-m", "/login · mobile", safe(window.MobileLogin, "MobileLogin"))}
        {mArt("signup-m", "/signup · mobile", safe(window.MobileSignup, "MobileSignup"))}
        {mArt("sso-m", "/sso/callback · mobile", safe(window.MobileSso, "MobileSso"))}
        {dArt(
          "login-d",
          "/login · desktop",
          safe(window.DesktopLogin, "DesktopLogin"),
          "app.isotope.work/login",
          "Sign in · Isotope",
        )}
        {dArt(
          "signup-d",
          "/signup · desktop",
          safe(window.DesktopSignup, "DesktopSignup"),
          "app.isotope.work/signup",
          "Sign up · Isotope",
        )}
      </DCSection>

      {/* ── ONBOARDING ────────────────────────────────────────────────── */}
      <DCSection
        id="onboarding"
        title="Onboarding"
        subtitle="Path picker → quick-start → wizard step 1 (form + review) → step 2 → step 3"
      >
        {mArt(
          "onb-path-m",
          "/onboarding · path picker",
          safe(window.MobileOnbPath, "MobileOnbPath"),
        )}
        {mArt(
          "onb-quick-m",
          "/onboarding/quick · confirm",
          safe(window.MobileOnbQuick, "MobileOnbQuick"),
        )}
        {mArt(
          "onb-s1-m",
          "wizard/step/1 · Company Research form",
          safe(window.MobileOnbStep1, "MobileOnbStep1"),
        )}
        {mArt(
          "onb-s1r-m",
          "wizard/step/1 · generated text review",
          safe(window.MobileOnbStep1Review, "MobileOnbStep1Review"),
        )}
        {mArt(
          "onb-s2-m",
          "wizard/step/2 · Job Search form",
          safe(window.MobileOnbStep2, "MobileOnbStep2"),
        )}
        {mArt(
          "onb-s3-m",
          "wizard/step/3 · A/B Testing form",
          safe(window.MobileOnbStep3, "MobileOnbStep3"),
        )}
        {dArt(
          "onb-path-d",
          "/onboarding · path picker · desktop",
          safe(window.DesktopOnbPath, "DesktopOnbPath"),
          "app.isotope.work/onboarding",
          "Welcome · Isotope",
        )}
        {dArt(
          "onb-s1-d",
          "wizard/step/1 · Company Research · desktop",
          safe(window.DesktopOnbStep1, "DesktopOnbStep1"),
          "app.isotope.work/onboarding/wizard/step/1",
          "Company Research · Isotope",
        )}
      </DCSection>

      {/* ── COMPANIES ─────────────────────────────────────────────────── */}
      <DCSection
        id="companies"
        title="Companies"
        subtitle="List · detail (inline scoring) · ethics-flagged state · linked contacts subpage"
      >
        {mArt("cos-list-m", "/companies · list", safe(window.MobileCompanies, "MobileCompanies"))}
        {mArt(
          "cos-detail-m",
          "/companies/[id] · scoring",
          safe(window.MobileCompanyDetail, "MobileCompanyDetail"),
        )}
        {mArt(
          "cos-ethics-m",
          "/companies/[id] · ethics flag",
          safe(window.MobileCompanyEthics, "MobileCompanyEthics"),
        )}
        {mArt(
          "cos-contacts-m",
          "/companies/[id]/contacts",
          safe(window.MobileCompanyContacts, "MobileCompanyContacts"),
        )}
        {dArt(
          "cos-d",
          "/companies · desktop (table + panel)",
          safe(window.DesktopCompanies, "DesktopCompanies"),
          "app.isotope.work/companies",
          "Companies · Isotope",
        )}
      </DCSection>

      {/* ── CONTACTS ──────────────────────────────────────────────────── */}
      <DCSection
        id="contacts"
        title="Contacts"
        subtitle="List · Draft tab · inline confirm · History tab · About tab · Re-engage · needs input · failed · new · empty · skeleton"
      >
        {mArt(
          "con-list-m",
          "/contacts · list + filters",
          safe(window.MobileContacts, "MobileContacts"),
        )}
        {mArt(
          "con-draft-m",
          "/contacts/[id] · Draft tab",
          safe(window.MobileContactDraft, "MobileContactDraft"),
        )}
        {mArt(
          "con-confirm-m",
          "/contacts/[id] · inline confirm",
          safe(window.MobileContactConfirm, "MobileContactConfirm"),
        )}
        {mArt(
          "con-history-m",
          "/contacts/[id] · History tab",
          safe(window.MobileContactHistory, "MobileContactHistory"),
        )}
        {mArt(
          "con-about-m",
          "/contacts/[id] · About tab",
          safe(window.MobileContactAbout, "MobileContactAbout"),
        )}
        {mArt(
          "con-reengage-m",
          "/contacts/[id] · Re-engage state",
          safe(window.MobileContactReengage, "MobileContactReengage"),
        )}
        {mArt(
          "con-input-m",
          "/contacts/[id] · Needs input (held)",
          safe(window.MobileContactNeedsInput, "MobileContactNeedsInput"),
        )}
        {mArt(
          "con-failed-m",
          "/contacts/[id] · Failed state",
          safe(window.MobileContactFailed, "MobileContactFailed"),
        )}
        {mArt(
          "con-new-m",
          "/contacts/new · manual add",
          safe(window.MobileContactNew, "MobileContactNew"),
        )}
        {mArt(
          "con-empty-m",
          "/contacts · empty state",
          safe(window.MobileContactsEmpty, "MobileContactsEmpty"),
        )}
        {mArt(
          "con-skel-m",
          "/contacts · loading skeleton",
          safe(window.MobileContactsLoading, "MobileContactsLoading"),
        )}
        {dArt(
          "con-d",
          "/contacts · desktop (table + panel)",
          safe(window.DesktopContacts, "DesktopContacts"),
          "app.isotope.work/contacts",
          "Contacts · Isotope",
        )}
        {dArt(
          "con-detail-d",
          "/contacts/[id] · desktop draft tab",
          safe(window.DesktopContactDetail, "DesktopContactDetail"),
          "app.isotope.work/contacts/c1",
          "Priya Sharma · Isotope",
        )}
      </DCSection>

      {/* ── JOBS ──────────────────────────────────────────────────────── */}
      <DCSection
        id="jobs"
        title="Jobs"
        subtitle="List · JD review + accept/reject · manual add form"
      >
        {mArt("jobs-list-m", "/jobs · list", safe(window.MobileJobs, "MobileJobs"))}
        {mArt(
          "jobs-detail-m",
          "/jobs/[id] · JD review",
          safe(window.MobileJobDetail, "MobileJobDetail"),
        )}
        {mArt("jobs-new-m", "/jobs/new · manual add", safe(window.MobileJobNew, "MobileJobNew"))}
        {dArt(
          "jobs-d",
          "/jobs · desktop",
          safe(window.DesktopJobs, "DesktopJobs"),
          "app.isotope.work/jobs",
          "Jobs · Isotope",
        )}
      </DCSection>

      {/* ── SETTINGS ──────────────────────────────────────────────────── */}
      <DCSection
        id="settings"
        title="Settings"
        subtitle="Frameworks (defaults banner) · A/B analytics (data + no-data) · digest config · account (Clerk)"
      >
        {mArt(
          "set-fw-m",
          "/settings/frameworks",
          safe(window.MobileSetFrameworks, "MobileSetFrameworks"),
        )}
        {mArt(
          "set-ab-m",
          "/settings/ab · results (medium confidence)",
          safe(window.MobileSetAb, "MobileSetAb"),
        )}
        {mArt(
          "set-ab-low-m",
          "/settings/ab · not enough data",
          safe(window.MobileSetAbLow, "MobileSetAbLow"),
        )}
        {mArt(
          "set-digest-m",
          "/settings/digest · time + tz",
          safe(window.MobileSetDigest, "MobileSetDigest"),
        )}
        {mArt(
          "set-account-m",
          "/settings/account · Clerk-hosted",
          safe(window.MobileSetAccount, "MobileSetAccount"),
        )}
        {dArt(
          "set-d",
          "/settings/frameworks · desktop",
          safe(window.DesktopSettings, "DesktopSettings"),
          "app.isotope.work/settings/frameworks",
          "Settings · Isotope",
        )}
      </DCSection>

      {/* ── DIGEST EMAIL ──────────────────────────────────────────────── */}
      <DCSection
        id="digest"
        title="Morning digest email"
        subtitle="Gmail inbox preview (unread) · opened digest · Gmail desktop · Resend → app.isotope.work deep links"
      >
        {mArt(
          "digest-inbox-m",
          "Gmail inbox · digest unread",
          safe(window.MobileDigestInbox, "MobileDigestInbox"),
        )}
        {mArt(
          "digest-open-m",
          "Gmail opened · full digest body",
          safe(window.MobileDigestOpened, "MobileDigestOpened"),
        )}
        {dArt(
          "digest-d",
          "Gmail desktop · digest opened",
          safe(window.DesktopDigest, "DesktopDigest"),
          "mail.google.com",
          "Isotope · 5 to review — Gmail",
        )}
      </DCSection>
    </DesignCanvas>
  );
}

const rootEl = document.getElementById("root");
if (rootEl && !rootEl._reactRoot) {
  rootEl._reactRoot = ReactDOM.createRoot(rootEl);
}
rootEl._reactRoot.render(<App />);
