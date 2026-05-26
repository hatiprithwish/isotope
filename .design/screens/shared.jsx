// Isotope shared: icons, badges, buttons, sample data, helpers.
// Loaded before any screen file. Exposes everything to window.

const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   Icons — inline SVG, Tabler-style (1.5 stroke, line)
   ============================================================ */
const ICON_PATHS = {
  // navigation / system
  home: (
    <path d="M5 12l-2 0 9 -9 9 9 -2 0M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  ),
  building: <path d="M3 21h18M5 21V7l8 -4v18M19 21V11l-6 -4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />,
  user: (
    <>
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </>
  ),
  briefcase: (
    <>
      <path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
      <path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2M12 12v.01M3 13a20 20 0 0 0 18 0" />
    </>
  ),
  settings: (
    <>
      <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  bell: (
    <>
      <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </>
  ),
  // arrows
  arrowLeft: <path d="M5 12l14 0M5 12l6 6M5 12l6 -6" />,
  arrowRight: <path d="M5 12l14 0M15 16l4 -4M15 8l4 4" />,
  chevR: <path d="M9 6l6 6l-6 6" />,
  chevD: <path d="M6 9l6 6l6 -6" />,
  chevU: <path d="M6 15l6 -6l6 6" />,
  chevL: <path d="M15 6l-6 6l6 6" />,
  // actions
  plus: <path d="M12 5l0 14M5 12l14 0" />,
  minus: <path d="M5 12l14 0" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M5 12l5 5l10 -10" />,
  copy: (
    <>
      <path d="M9 9m0 2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2z" />
      <path d="M5 15h-1a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v1" />
    </>
  ),
  retry: <path d="M19.95 11a8 8 0 1 0 -.5 4M20 4v5h-5" />,
  search: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M21 21l-6 -6" />
    </>
  ),
  filter: (
    <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  // channels & flags
  mail: (
    <>
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
      <path d="M3 7l9 6l9 -6" />
    </>
  ),
  linkedin: (
    <>
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0 -4 0" />
    </>
  ),
  warning: (
    <>
      <path d="M12 9v4M12 17v.01M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
    </>
  ),
  shield: <path d="M12 3l8 4v6c0 4 -3 7 -8 8c-5 -1 -8 -4 -8 -8v-6l8 -4z" />,
  // misc
  external: (
    <>
      <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
      <path d="M11 13l9 -9M15 4h5v5" />
    </>
  ),
  edit: (
    <>
      <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
      <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97L9 12v3h3l8.385 -8.415zM16 5l3 3" />
    </>
  ),
  trash: (
    <path d="M4 7l16 0M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  ),
  send: (
    <path d="M10 14l11 -11M21 3l-6.5 18a.55 .55 0 0 1 -1 0L10 14L3 10.5a.55 .55 0 0 1 0 -1L21 3" />
  ),
  archive: (
    <>
      <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10M10 12h4" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M4 13h3l3 3h4l3 -3h3" />
    </>
  ),
  star: (
    <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
  ),
  // states
  sparkle: (
    <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zM16 8a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zM6 14a4 4 0 0 1 4 4a4 4 0 0 1 4 -4a4 4 0 0 1 -4 -4a4 4 0 0 1 -4 4z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  calendar: (
    <>
      <path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M16 3v4M8 3v4M4 11h16M8 15h2v2h-2z" />
    </>
  ),
  fire: (
    <path d="M12 21a8 8 0 0 1 -3.95 -1.099A8 8 0 0 1 4 13c0 -2.5 1 -5 3 -7c1 0 2 1.5 2.5 3.5c.5 -1 1 -2 2.5 -4c2 1 4 3 4 6c0 .5 2 -.5 2 -3c1 1 3 4 3 7c0 2.5 -1.5 5.5 -4 7" />
  ),
  flag: <path d="M5 21v-18M5 5h12l-3 4l3 4h-12" />,
  ok: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2l4 -4" />
    </>
  ),
  cross: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 10l4 4M14 10l-4 4" />
    </>
  ),
  // theme
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M3 12h1M12 3v1M20 12h1M12 20v1M5.6 5.6l.7 .7M18.4 5.6l-.7 .7M17.7 17.7l.7 .7M6.3 17.7l-.7 .7" />
    </>
  ),
  moon: (
    <path d="M12 3a9 9 0 1 0 9 9c0 -.46 -.04 -.92 -.1 -1.36a5.389 5.389 0 0 1 -4.4 2.36a5.4 5.4 0 0 1 -4.9 -7.4 9 9 0 0 1 .4 -2.6z" />
  ),
  // misc
  layers: (
    <>
      <path d="M12 3l-9 5l9 5l9 -5l-9 -5" />
      <path d="M3 13l9 5l9 -5M3 18l9 5l9 -5" />
    </>
  ),
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  github: (
    <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3M15 21v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
  ),
  google: <path d="M17.788 5.108a9 9 0 1 0 3.212 6.892h-8" />,
  paperclip: (
    <path d="M15 7l-6.5 6.5a3.5 3.5 0 0 0 5 5l6.5 -6.5a5 5 0 0 0 -7 -7l-6.5 6.5a6.5 6.5 0 0 0 9 9" />
  ),
  // file
  file: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    </>
  ),
  // empty / dashed
  inbox_empty: (
    <>
      <path d="M5 9h14l-2 -6h-10l-2 6M2 14h6v3h8v-3h6M19 14v6a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1v-6" />
    </>
  ),
  // help/info
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
  // company
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8M12 3a9 9 0 0 1 0 18a9 9 0 0 1 0 -18M12 3a9 9 0 0 0 0 18" />
    </>
  ),
};

const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.5, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {ICON_PATHS[name]}
  </svg>
);

/* ============================================================
   Logo / wordmark
   ============================================================ */
const Wordmark = ({ size = "sm", superscript = false }) => {
  const sizes = {
    sm: { font: 15, sup: 9 },
    md: { font: 17, sup: 10 },
    lg: { font: 22, sup: 11 },
    xl: { font: 28, sup: 13 },
  }[size];
  return (
    <span className="iso-mark" style={{ fontSize: sizes.font, gap: 0 }}>
      <span>Isotope</span>
      <span
        style={{
          font: `600 ${sizes.sup}px/1 var(--font-sans)`,
          color: "var(--accent)",
          alignSelf: "flex-start",
          marginTop: -2,
          marginLeft: 2,
        }}
      >
        ¹³
      </span>
    </span>
  );
};

/* ============================================================
   Status + fit meta
   ============================================================ */
const STATUS_META = {
  // contact
  not_started: { label: "Not started", cls: "neutral" },
  draft_ready: { label: "Draft ready", cls: "accent" },
  in_pipeline: { label: "In pipeline", cls: "pipeline" },
  replied: { label: "Replied", cls: "success" },
  closed: { label: "Closed", cls: "success" },
  dead: { label: "Dead", cls: "neutral" },
  re_engage: { label: "Re-engage", cls: "warning" },
  failed: { label: "Failed", cls: "danger" },
  // company
  waiting_human: { label: "Needs review", cls: "warning" },
  accepted: { label: "Accepted", cls: "success" },
  contacts_added: { label: "Contacts added", cls: "pipeline" },
  rejected_human: { label: "Rejected", cls: "neutral" },
  interviewed: { label: "Interviewed", cls: "pipeline" },
  offer: { label: "Offer", cls: "success" },
  // job
  applied: { label: "Applied", cls: "pipeline" },
  interviewing: { label: "Interviewing", cls: "pipeline" },
};

const FIT_META = {
  strong_fit: { label: "Strong fit", cls: "success" },
  conditional_fit: { label: "Conditional", cls: "warning" },
  weak_fit: { label: "Weak fit", cls: "neutral" },
  disqualified: { label: "Disqualified", cls: "danger" },
};

const Badge = ({ status, fit, custom, sm, dot, children }) => {
  if (status && STATUS_META[status]) {
    const m = STATUS_META[status];
    return (
      <span className={`m-badge ${m.cls}${sm ? " sm" : ""}`}>
        {dot && <span className="dot" />}
        {m.label}
      </span>
    );
  }
  if (fit && FIT_META[fit]) {
    const m = FIT_META[fit];
    return <span className={`m-badge ${m.cls}${sm ? " sm" : ""}`}>{m.label}</span>;
  }
  return <span className={`m-badge ${custom || "neutral"}${sm ? " sm" : ""}`}>{children}</span>;
};

/* ============================================================
   Sample data — Indian tech market (matches PRD context)
   ============================================================ */
const USER = {
  name: "Aditya Kumar",
  email: "aditya.kumar@gmail.com",
  initials: "AK",
};

const CONTACTS = [
  {
    id: "c1",
    name: "Priya Sharma",
    designation: "Engineering Manager, Payments",
    company: "Razorpay",
    companyId: "co1",
    fitBand: "strong_fit",
    email: "priya.sharma@razorpay.com",
    linkedin: "linkedin.com/in/priyasharma",
    linkedinConnected: true,
    touch: 1,
    channel: "Email + LinkedIn",
    status: "draft_ready",
    nextTouch: null,
    abVariant: "B",
    abVariable: "Subject line",
    aiResearch:
      "Priya led the payments infra rewrite at Razorpay in 2024. Recently spoke at IndiaFOSS about idempotent webhooks and posted a thread on database sharding. Contributes to standard-webhooks on GitHub. Generally writes about reliability over scale.",
    userNotes: "",
    draftSubject: "noticed your IndiaFOSS talk on idempotent webhooks",
    draftBody:
      "Hi Priya,\n\nCaught your IndiaFOSS talk on idempotency — the bit about partial-replay invariants made me rethink how I designed our retry layer.\n\nI've spent the last 4 years on payments infra — most recently reduced sync time by 72% on a 500K-record reconciliation job at $current. Razorpay's reliability work is the kind of problem I want to be in the room for next.\n\nIs there a senior backend role on your team I should be aware of? Happy with a yes/no.\n\nBest,\nAditya",
    draftAge: "2h",
    history: [],
  },
  {
    id: "c2",
    name: "Arjun Mehta",
    designation: "Senior SWE, Trading Systems",
    company: "Zerodha",
    companyId: "co2",
    fitBand: "conditional_fit",
    email: "arjun@zerodha.com",
    linkedin: "linkedin.com/in/arjunmehta",
    linkedinConnected: false,
    touch: 1,
    channel: "Email",
    status: "in_pipeline",
    nextTouch: "5d",
    abVariant: "A",
    abVariable: "Subject line",
    aiResearch: null,
    userNotes:
      "Met briefly at Bangalore Tech Meetup, March 2024. He mentioned the team rewrites their order-matching engine every 18 months — interesting culture signal.",
    draftSubject: "quick question about Zerodha's order-matching rewrite cycle",
    draftBody:
      "Hi Arjun,\n\nYou mentioned at the Bangalore meetup that your team rewrites the matching engine every ~18 months. Is that still the cadence?\n\nI've been working on low-latency execution at $current and would love to learn how Zerodha thinks about it. Two-sentence reply is fine.\n\nBest,\nAditya",
    history: [
      {
        type: "email_sent",
        date: "5 days ago",
        channel: "email",
        touch: 1,
        preview:
          "Hi Arjun, you mentioned at the Bangalore meetup that your team rewrites the matching engine every ~18 months. Is that still the cadence?",
      },
    ],
  },
  {
    id: "c3",
    name: "Kavya Iyer",
    designation: "Staff Engineer, Platform",
    company: "CRED",
    companyId: "co3",
    fitBand: "weak_fit",
    email: null,
    linkedin: "linkedin.com/in/kavyaiyer",
    linkedinConnected: true,
    touch: 0,
    channel: "LinkedIn",
    status: "not_started",
    nextTouch: null,
    abVariant: null,
    abVariable: null,
    aiResearch: null,
    userNotes: "",
    needsInput: true,
  },
  {
    id: "c4",
    name: "Rohan Krishnan",
    designation: "Director of Engineering",
    company: "Postman",
    companyId: "co4",
    fitBand: "strong_fit",
    email: "rohan@postman.com",
    linkedin: null,
    touch: 2,
    channel: "Email",
    status: "replied",
    abVariant: "A",
    aiResearch:
      "Rohan was IC for 8 years before stepping into management. Public talks emphasize developer experience metrics over engineering velocity. Posted a postmortem on Postman's API mock service in Feb.",
    history: [
      {
        type: "email_sent",
        date: "14 days ago",
        channel: "email",
        touch: 1,
        preview:
          "Hi Rohan, your postmortem on the mock service rollback was the clearest one I've read in months...",
      },
      {
        type: "email_received",
        date: "11 days ago",
        channel: "email",
        touch: 1,
        preview:
          "Thanks Aditya — let's chat. Can you do Tuesday next week? I'd be curious to hear more about the 72% number.",
      },
    ],
  },
  {
    id: "c5",
    name: "Nikhil Rao",
    designation: "Engineering Manager",
    company: "Swiggy",
    companyId: "co5",
    fitBand: "conditional_fit",
    email: "nikhil.rao@swiggy.in",
    linkedin: "linkedin.com/in/nikhilrao",
    linkedinConnected: true,
    touch: 2,
    channel: "Email + LinkedIn",
    status: "in_pipeline",
    nextTouch: "2d",
    abVariant: "B",
    abVariable: "Subject line",
  },
  {
    id: "c6",
    name: "Sneha Pillai",
    designation: "Tech Lead, Search",
    company: "Meesho",
    companyId: "co6",
    fitBand: "strong_fit",
    email: "sneha.p@meesho.com",
    linkedin: null,
    touch: 1,
    channel: "Email",
    status: "draft_ready",
    abVariant: "A",
    abVariable: "Subject line",
    draftAge: "8h",
  },
  {
    id: "c7",
    name: "Vikram Desai",
    designation: "VP Engineering",
    company: "Freshworks",
    companyId: "co7",
    fitBand: "conditional_fit",
    email: "vikram@freshworks.com",
    linkedin: "linkedin.com/in/vikramdesai",
    linkedinConnected: true,
    touch: 3,
    channel: "Email",
    status: "re_engage",
    abVariant: "B",
    abVariable: "Subject line",
    reEngageRec:
      "Vikram has gone quiet across all 3 touches. Two other contacts at Freshworks (one Director, one Staff Eng) replied within 7 days — consider pivoting outreach there before sending Vikram a fourth message.",
  },
  {
    id: "c8",
    name: "Ananya Reddy",
    designation: "Senior Engineering Manager",
    company: "Atlassian (India)",
    companyId: "co8",
    fitBand: "strong_fit",
    email: "areddy@atlassian.com",
    linkedin: "linkedin.com/in/ananyareddy",
    linkedinConnected: true,
    touch: 2,
    channel: "LinkedIn",
    status: "in_pipeline",
    nextTouch: "4d",
    abVariant: "A",
    abVariable: "Subject line",
  },
  {
    id: "c9",
    name: "Karan Shah",
    designation: "Staff Software Engineer",
    company: "PhonePe",
    companyId: "co9",
    fitBand: "strong_fit",
    email: "karan.shah@phonepe.com",
    linkedin: null,
    touch: 1,
    channel: "Email",
    status: "failed",
    failedReason: "Apollo enrichment timeout after 3 retries (last attempt 02:14 IST).",
  },
  {
    id: "c10",
    name: "Meera Joshi",
    designation: "Principal Engineer",
    company: "Razorpay",
    companyId: "co1",
    fitBand: "strong_fit",
    email: "meera@razorpay.com",
    linkedin: "linkedin.com/in/meerajoshi",
    touch: 0,
    channel: "Email",
    status: "not_started",
  },
  {
    id: "c11",
    name: "Tanvi Ramesh",
    designation: "Head of Engineering",
    company: "PhonePe",
    companyId: "co9",
    fitBand: "strong_fit",
    email: "tanvi@phonepe.com",
    linkedin: "linkedin.com/in/tanviramesh",
    linkedinConnected: true,
    touch: 1,
    channel: "Email + LinkedIn",
    status: "draft_ready",
    abVariant: "B",
    abVariable: "Subject line",
    draftAge: "4d",
    stalled: true,
  },
];

const COMPANIES = [
  {
    id: "co1",
    name: "Razorpay",
    website: "razorpay.com",
    industry: "Fintech / Payments",
    size: "1000+",
    fitBand: "strong_fit",
    score: 112,
    max: 135,
    ethics: false,
    status: "accepted",
    updated: "2h ago",
  },
  {
    id: "co2",
    name: "Zerodha",
    website: "zerodha.com",
    industry: "Fintech / Brokerage",
    size: "1000+",
    fitBand: "conditional_fit",
    score: 89,
    max: 135,
    ethics: false,
    status: "waiting_human",
    updated: "4h ago",
  },
  {
    id: "co3",
    name: "CRED",
    website: "cred.club",
    industry: "Consumer fintech",
    size: "500-1000",
    fitBand: "weak_fit",
    score: 64,
    max: 135,
    ethics: true,
    status: "waiting_human",
    updated: "6h ago",
  },
  {
    id: "co4",
    name: "Postman",
    website: "postman.com",
    industry: "Dev tools",
    size: "500-1000",
    fitBand: "strong_fit",
    score: 119,
    max: 135,
    ethics: false,
    status: "contacts_added",
    updated: "1d ago",
  },
  {
    id: "co5",
    name: "Swiggy",
    website: "swiggy.com",
    industry: "Food delivery",
    size: "5000+",
    fitBand: "conditional_fit",
    score: 92,
    max: 135,
    ethics: false,
    status: "accepted",
    updated: "1d ago",
  },
  {
    id: "co6",
    name: "Meesho",
    website: "meesho.com",
    industry: "E-commerce",
    size: "1000+",
    fitBand: "strong_fit",
    score: 108,
    max: 135,
    ethics: false,
    status: "contacts_added",
    updated: "2d ago",
  },
  {
    id: "co7",
    name: "Freshworks",
    website: "freshworks.com",
    industry: "SaaS / CRM",
    size: "5000+",
    fitBand: "conditional_fit",
    score: 87,
    max: 135,
    ethics: false,
    status: "accepted",
    updated: "3d ago",
  },
  {
    id: "co8",
    name: "Atlassian (India)",
    website: "atlassian.com",
    industry: "Dev tools / SaaS",
    size: "10000+",
    fitBand: "strong_fit",
    score: 121,
    max: 135,
    ethics: false,
    status: "contacts_added",
    updated: "3d ago",
  },
  {
    id: "co9",
    name: "PhonePe",
    website: "phonepe.com",
    industry: "Fintech / Payments",
    size: "5000+",
    fitBand: "strong_fit",
    score: 110,
    max: 135,
    ethics: false,
    status: "waiting_human",
    updated: "5h ago",
  },
  {
    id: "co10",
    name: "Byju\u2019s",
    website: "byjus.com",
    industry: "Edtech",
    size: "5000+",
    fitBand: "disqualified",
    score: 0,
    max: 135,
    ethics: true,
    status: "waiting_human",
    updated: "8h ago",
  },
];

const JOBS = [
  {
    id: "j1",
    title: "Senior Backend Engineer",
    company: "Razorpay",
    companyId: "co1",
    fitBand: "strong_fit",
    location: "Bengaluru / Remote",
    source: "linkedin",
    status: "accepted",
    added: "2h ago",
    salary: "24–32 LPA",
  },
  {
    id: "j2",
    title: "Staff Engineer, Platform",
    company: "Postman",
    companyId: "co4",
    fitBand: "strong_fit",
    location: "Bengaluru",
    source: "ai_suggested",
    status: "waiting_human",
    added: "6h ago",
    salary: "38–48 LPA",
  },
  {
    id: "j3",
    title: "Senior SDE-II, Trading",
    company: "Zerodha",
    companyId: "co2",
    fitBand: "conditional_fit",
    location: "Bengaluru",
    source: "naukri",
    status: "waiting_human",
    added: "1d ago",
    salary: "28–35 LPA",
  },
  {
    id: "j4",
    title: "Engineering Manager, Search",
    company: "Meesho",
    companyId: "co6",
    fitBand: "strong_fit",
    location: "Bengaluru / Remote",
    source: "linkedin",
    status: "applied",
    added: "2d ago",
    salary: "40–55 LPA",
  },
  {
    id: "j5",
    title: "Senior Software Engineer",
    company: "Atlassian",
    companyId: "co8",
    fitBand: "strong_fit",
    location: "Bengaluru",
    source: "ai_suggested",
    status: "accepted",
    added: "3d ago",
    salary: "32–42 LPA",
  },
  {
    id: "j6",
    title: "Lead Engineer, Logistics",
    company: "Swiggy",
    companyId: "co5",
    fitBand: "conditional_fit",
    location: "Bengaluru",
    source: "linkedin",
    status: "rejected_human",
    added: "5d ago",
    salary: "30–38 LPA",
  },
];

// Scored criteria (one company in detail) — matches Appendix A defaults
const SAMPLE_FIT_SCORES = [
  { priority: 1, name: "Work-Life Balance & Culture", weight: 5, score: 4, confidence: "high" },
  {
    priority: 2,
    name: "Manager Quality & Role Clarity",
    weight: 5,
    score: 4,
    confidence: "medium",
  },
  { priority: 3, name: "Company Stability", weight: 4, score: 5, confidence: "high" },
  { priority: 4, name: "Learning & Mentorship", weight: 4, score: 4, confidence: "medium" },
  { priority: 5, name: "Clear Advancement Pathways", weight: 3, score: 3, confidence: "low" },
  { priority: 6, name: "Tech Health & Stack", weight: 3, score: 5, confidence: "high" },
  { priority: 7, name: "Team Integration & Culture", weight: 2, score: 4, confidence: "medium" },
  { priority: 8, name: "Impactful Projects", weight: 1, score: 5, confidence: "high" },
];

const SAMPLE_FIT_SCORES_ETHICS = [
  { priority: 1, name: "Work-Life Balance & Culture", weight: 5, score: 2, confidence: "high" },
  {
    priority: 2,
    name: "Manager Quality & Role Clarity",
    weight: 5,
    score: 3,
    confidence: "medium",
  },
  { priority: 3, name: "Company Stability", weight: 4, score: 3, confidence: "medium" },
  { priority: 4, name: "Learning & Mentorship", weight: 4, score: 3, confidence: "low" },
  { priority: 5, name: "Clear Advancement Pathways", weight: 3, score: 2, confidence: "low" },
  { priority: 6, name: "Tech Health & Stack", weight: 3, score: 4, confidence: "medium" },
  { priority: 7, name: "Team Integration & Culture", weight: 2, score: 3, confidence: "low" },
  { priority: 8, name: "Impactful Projects", weight: 1, score: 3, confidence: "medium" },
];

const initials = (name) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const computeScore = (scores) => scores.reduce((sum, s) => sum + s.score * s.weight, 0);
const computeMax = (scores) => scores.reduce((sum, s) => sum + 5 * s.weight, 0);

/* ============================================================
   Mobile chrome helpers
   ============================================================ */

// Mobile status bar — overrides the Android starter's status bar with
// a brand-tinted version so the screen reads as a real product surface.
const MStatusBar = ({ dark = false }) => {
  const c = dark ? "#FAF9F7" : "#1C1917";
  return (
    <div
      style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        position: "relative",
        flexShrink: 0,
        fontFamily: "var(--font-sans)",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: 100, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.1, color: c }}>9:41</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 6,
          transform: "translateX(-50%)",
          width: 22,
          height: 22,
          borderRadius: 100,
          background: "#0a0a0a",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <svg width="13" height="11" viewBox="0 0 16 13">
          <rect x="0" y="9" width="3" height="3" rx="0.5" fill={c} />
          <rect x="4.5" y="6.5" width="3" height="5.5" rx="0.5" fill={c} />
          <rect x="9" y="3.5" width="3" height="8.5" rx="0.5" fill={c} />
          <rect x="13.5" y="0.5" width="3" height="11.5" rx="0.5" fill={c} />
        </svg>
        <svg width="14" height="11" viewBox="0 0 16 13" style={{ marginLeft: 1 }}>
          <path d="M8 10.5L1 4.5a9.5 9.5 0 0114 0L8 10.5z" fill={c} />
        </svg>
        <svg width="22" height="11" viewBox="0 0 26 13" style={{ marginLeft: 2 }}>
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3"
            fill="none"
            stroke={c}
            strokeOpacity="0.5"
          />
          <rect x="2.5" y="2.5" width="16" height="8" rx="1.5" fill={c} />
          <rect x="23.5" y="4" width="1.5" height="5" rx="0.5" fill={c} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
};

const MNavBar = ({ dark = false }) => (
  <div
    style={{
      height: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: "var(--surface)",
    }}
  >
    <div
      style={{
        width: 108,
        height: 4,
        borderRadius: 2,
        background: dark ? "#FAF9F7" : "#1C1917",
        opacity: 0.4,
      }}
    />
  </div>
);

// Mobile bottom tab nav (Today / Companies / Contacts / Jobs)
const MTabBar = ({ active = "today" }) => {
  const tabs = [
    { id: "today", label: "Today", icon: "home" },
    { id: "companies", label: "Companies", icon: "building" },
    { id: "contacts", label: "Contacts", icon: "user" },
    { id: "jobs", label: "Jobs", icon: "briefcase" },
  ];
  return (
    <div className="m-tabbar">
      {tabs.map((t) => (
        <button key={t.id} className={`tab ${active === t.id ? "active" : ""}`}>
          <span className="ico">
            <Icon name={t.icon} size={20} strokeWidth={active === t.id ? 1.8 : 1.5} />
          </span>
          {t.label}
        </button>
      ))}
    </div>
  );
};

// Mobile header with back button
const MHeader = ({ title, sub, back, action, actions, surface }) => (
  <div className={`m-header ${surface ? "surface" : ""}`}>
    {back && (
      <button className="ico-btn back" aria-label="Back">
        <Icon name="arrowLeft" size={20} />
      </button>
    )}
    <div className="col grow" style={{ minWidth: 0 }}>
      <div className="title">{title}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
    {action}
    {actions}
  </div>
);

// Mobile shell — combines status bar, screen content, nav bar pill
const MShell = ({ children, dark = false, tabbar = null, fab = null }) => (
  <div className="iso-screen" data-theme={dark ? "dark" : "light"}>
    <div className="m-screen">
      <MStatusBar dark={dark} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {children}
      </div>
      {tabbar}
      <MNavBar dark={dark} />
      {fab}
    </div>
  </div>
);

/* ============================================================
   Desktop chrome helpers — sidebar, topbar
   ============================================================ */
const DSidebar = ({ active = "today" }) => {
  const items = [
    { id: "today", label: "Today", icon: "home" },
    { id: "companies", label: "Companies", icon: "building" },
    { id: "contacts", label: "Contacts", icon: "user" },
    { id: "jobs", label: "Jobs", icon: "briefcase" },
  ];
  return (
    <aside className="d-sidebar">
      <div className="logo">
        <Wordmark size="sm" />
      </div>
      <nav className="nav">
        {items.map((it) => (
          <a key={it.id} href="#" className={`nav-item ${active === it.id ? "active" : ""}`}>
            <Icon name={it.icon} size={16} />
            {it.label}
          </a>
        ))}
      </nav>
      <div className="spacer" />
      <div className="divider" />
      <a href="#" className="nav-item">
        <Icon name="settings" size={16} />
        Settings
      </a>
      <div className="user">
        <span
          className="m-avatar sm"
          style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
        >
          {USER.initials}
        </span>
        <div className="col">
          <span className="name">{USER.name}</span>
          <span className="email">{USER.email}</span>
        </div>
      </div>
    </aside>
  );
};

const DTopbar = ({ title, sub, actions }) => (
  <header className="d-topbar">
    <div>
      <div className="title">{title}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
    {actions && <div className="right">{actions}</div>}
  </header>
);

const DShell = ({ children, active = "today", dark = false }) => (
  <div className="iso-screen" data-theme={dark ? "dark" : "light"}>
    <div className="d-screen">
      <DSidebar active={active} />
      <div className="d-main">{children}</div>
    </div>
  </div>
);

/* ============================================================
   Shared helpers — avatars, dots, etc.
   ============================================================ */
const Avatar = ({ name, sz = "md", warm = false }) => {
  const palette = warm
    ? { bg: "var(--accent-bg)", color: "var(--accent-text)" }
    : { bg: "var(--surface-2)", color: "var(--text-secondary)" };
  return (
    <span className={`m-avatar ${sz === "sm" ? "sm" : sz === "lg" ? "lg" : ""}`} style={palette}>
      {initials(name)}
    </span>
  );
};

const AbPill = ({ variant, variable = "Subject line" }) => (
  <span className="m-abpill" title={`A/B: ${variable}`}>
    <Icon name="spark" size={11} />
    Variant {variant}
  </span>
);

// Expose to window
Object.assign(window, {
  Icon,
  Wordmark,
  Badge,
  Avatar,
  AbPill,
  STATUS_META,
  FIT_META,
  USER,
  CONTACTS,
  COMPANIES,
  JOBS,
  SAMPLE_FIT_SCORES,
  SAMPLE_FIT_SCORES_ETHICS,
  initials,
  computeScore,
  computeMax,
  MStatusBar,
  MNavBar,
  MTabBar,
  MHeader,
  MShell,
  DSidebar,
  DTopbar,
  DShell,
});
