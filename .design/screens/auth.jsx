// auth.jsx — login, signup, sso/callback. Clerk-hosted but styled to brand.

function AuthShellMobile({ title, sub, children, footer, dark = false }) {
  return (
    <MShell dark={dark}>
      <div
        className="m-body"
        style={{ background: "var(--bg)", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            padding: "40px 24px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.07,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              left: -20,
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "1.5px solid var(--accent)",
              opacity: 0.12,
              pointerEvents: "none",
            }}
          />
          <Wordmark size="xl" superscript={true} />
        </div>
        <div style={{ padding: "0 24px", textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              font: "600 22px/1.25 var(--font-sans)",
              color: "var(--text-primary)",
              letterSpacing: "-0.012em",
            }}
          >
            {title}
          </h1>
          {sub && (
            <p
              style={{
                font: "400 14px/1.55 var(--font-sans)",
                color: "var(--text-secondary)",
                marginTop: 8,
                textWrap: "pretty",
              }}
            >
              {sub}
            </p>
          )}
        </div>
        <div style={{ padding: "0 24px", flex: 1 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "20px 24px 32px",
              textAlign: "center",
              font: "400 13px/1.6 var(--font-sans)",
              color: "var(--text-secondary)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </MShell>
  );
}

function ClerkBrand() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        font: "400 11px/1 var(--font-sans)",
        color: "var(--text-muted)",
        marginTop: 24,
      }}
    >
      Secured by
      <span
        style={{
          font: "600 11px/1 var(--font-sans)",
          color: "var(--text-secondary)",
          letterSpacing: "-0.01em",
        }}
      >
        Clerk
      </span>
    </div>
  );
}

const MobileLogin = () => (
  <AuthShellMobile
    title="Welcome back"
    sub="Sign in to continue your job search."
    footer={
      <>
        New here?{" "}
        <a href="#" style={{ color: "var(--accent-text)", fontWeight: 500 }}>
          Create an account
        </a>
      </>
    }
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        className="m-input"
        placeholder="you@email.com"
        defaultValue="aditya.kumar@gmail.com"
      />
      <input className="m-input" placeholder="Password" type="password" defaultValue="••••••••••" />
      <a
        href="#"
        style={{
          font: "500 12px/1 var(--font-sans)",
          color: "var(--text-secondary)",
          textAlign: "right",
          marginTop: -4,
        }}
      >
        Forgot password?
      </a>
      <button className="m-btn primary full" style={{ marginTop: 4 }}>
        Sign in
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "8px 0",
          color: "var(--text-muted)",
          font: "500 11px/1 var(--font-sans)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        Or
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <button className="m-btn secondary full">
        <Icon name="google" size={16} /> Continue with Google
      </button>
      <button className="m-btn secondary full">
        <Icon name="github" size={16} /> Continue with GitHub
      </button>
    </div>
    <ClerkBrand />
  </AuthShellMobile>
);

const MobileSignup = () => (
  <AuthShellMobile
    title="Create your account"
    sub="Calm daily ritual for job search ops. Free while in beta."
    footer={
      <>
        Have an account?{" "}
        <a href="#" style={{ color: "var(--accent-text)", fontWeight: 500 }}>
          Sign in
        </a>
      </>
    }
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input className="m-input" placeholder="Full name" defaultValue="Aditya Kumar" />
      <input
        className="m-input"
        placeholder="you@email.com"
        defaultValue="aditya.kumar@gmail.com"
      />
      <input
        className="m-input"
        placeholder="Create a password"
        type="password"
        defaultValue="••••••••••"
      />
      <button className="m-btn primary full" style={{ marginTop: 4 }}>
        Create account
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "8px 0",
          color: "var(--text-muted)",
          font: "500 11px/1 var(--font-sans)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        Or
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <button className="m-btn secondary full">
        <Icon name="google" size={16} /> Continue with Google
      </button>
      <button className="m-btn secondary full">
        <Icon name="github" size={16} /> Continue with GitHub
      </button>
      <p
        style={{
          font: "400 11px/1.55 var(--font-sans)",
          color: "var(--text-muted)",
          textAlign: "center",
          marginTop: 12,
          textWrap: "pretty",
        }}
      >
        By creating an account you agree to the{" "}
        <a href="#" style={{ color: "var(--text-secondary)" }}>
          Terms
        </a>{" "}
        and{" "}
        <a href="#" style={{ color: "var(--text-secondary)" }}>
          Privacy Policy
        </a>
        .
      </p>
    </div>
    <ClerkBrand />
  </AuthShellMobile>
);

const MobileSso = () => (
  <MShell>
    <div
      className="m-body"
      style={{
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}
    >
      <Wordmark size="lg" superscript={true} />
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--accent-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 32,
          marginBottom: 20,
        }}
      >
        <Icon name="check" size={32} color="var(--accent)" />
      </div>
      <h2
        style={{
          font: "600 18px/1.3 var(--font-sans)",
          color: "var(--text-primary)",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Signing you in…
      </h2>
      <p
        style={{
          font: "400 14px/1.55 var(--font-sans)",
          color: "var(--text-secondary)",
          textAlign: "center",
          maxWidth: 280,
          textWrap: "pretty",
        }}
      >
        Returning from Google. This will only take a moment.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 4 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "var(--accent)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "var(--accent)",
            animation: "pulse 1.4s ease-in-out 0.2s infinite",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "var(--accent)",
            animation: "pulse 1.4s ease-in-out 0.4s infinite",
          }}
        />
      </div>
    </div>
  </MShell>
);

/* ============================================================
   DESKTOP — auth (Clerk-hosted)
   Centred card on warm background.
   ============================================================ */
function AuthShellDesktop({ children, title, sub, footer, sideQuote = true }) {
  return (
    <div className="iso-screen">
      <div
        style={{
          height: "100%",
          display: "grid",
          gridTemplateColumns: sideQuote ? "1fr 1fr" : "1fr",
          background: "var(--bg)",
        }}
      >
        {/* LEFT — brand panel */}
        {sideQuote && (
          <aside
            style={{
              padding: 56,
              background: "var(--sidebar)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 240,
                height: 240,
                borderRadius: "50%",
                background: "var(--accent)",
                opacity: 0.07,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 40,
                right: -30,
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: "1.5px solid var(--accent)",
                opacity: 0.1,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 100,
                left: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "var(--accent)",
                opacity: 0.05,
                pointerEvents: "none",
              }}
            />
            <Wordmark size="xl" superscript={true} />
            <div style={{ maxWidth: 460 }}>
              <h2
                style={{
                  font: "600 28px/1.25 var(--font-sans)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.012em",
                  textWrap: "balance",
                }}
              >
                Find your exact match.
              </h2>
              <p
                style={{
                  font: "400 15px/1.65 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 16,
                  textWrap: "pretty",
                }}
              >
                AI handles research, contact discovery, and email drafting overnight. You review,
                approve, and send each morning. 15–30 minutes a day.
              </p>
              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "No spam blasts. Every draft is reviewed.",
                  "3-stage research before any company enters your pipeline.",
                  "A/B testing built in — find what gets replies.",
                ].map((line) => (
                  <div
                    key={line}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      font: "400 13px/1.55 var(--font-sans)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: "var(--accent)",
                        flexShrink: 0,
                      }}
                    />
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ font: "400 11px/1.5 var(--font-sans)", color: "var(--text-muted)" }}>
              v1.7 · Secured by Clerk · Made for engineers in India
            </div>
          </aside>
        )}
        {/* RIGHT — form */}
        <main
          style={{
            padding: 56,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 520,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                font: "600 26px/1.25 var(--font-sans)",
                color: "var(--text-primary)",
                letterSpacing: "-0.012em",
              }}
            >
              {title}
            </h1>
            {sub && (
              <p
                style={{
                  font: "400 14px/1.55 var(--font-sans)",
                  color: "var(--text-secondary)",
                  marginTop: 8,
                  textWrap: "pretty",
                }}
              >
                {sub}
              </p>
            )}
          </div>
          {children}
          {footer && (
            <div
              style={{
                marginTop: 28,
                font: "400 13px/1.6 var(--font-sans)",
                color: "var(--text-secondary)",
              }}
            >
              {footer}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 6,
              font: "400 11px/1 var(--font-sans)",
              color: "var(--text-muted)",
              marginTop: 32,
            }}
          >
            Secured by
            <span style={{ font: "600 11px/1 var(--font-sans)", color: "var(--text-secondary)" }}>
              Clerk
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

const DesktopLogin = () => (
  <AuthShellDesktop
    title="Welcome back"
    sub="Sign in to continue your job search."
    footer={
      <>
        New here?{" "}
        <a href="#" style={{ color: "var(--accent-text)", fontWeight: 500 }}>
          Create an account
        </a>
      </>
    }
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label className="d-field-label">Email</label>
        <input className="d-input" defaultValue="aditya.kumar@gmail.com" />
      </div>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label className="d-field-label" style={{ marginBottom: 0 }}>
            Password
          </label>
          <a
            href="#"
            style={{ font: "500 11px/1 var(--font-sans)", color: "var(--text-secondary)" }}
          >
            Forgot?
          </a>
        </div>
        <input className="d-input" type="password" defaultValue="••••••••••" />
      </div>
      <button className="d-btn primary lg" style={{ width: "100%", marginTop: 8 }}>
        Sign in
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "8px 0",
          color: "var(--text-muted)",
          font: "500 11px/1 var(--font-sans)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        Or
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button className="d-btn secondary lg" style={{ justifyContent: "center" }}>
          <Icon name="google" size={15} /> Google
        </button>
        <button className="d-btn secondary lg" style={{ justifyContent: "center" }}>
          <Icon name="github" size={15} /> GitHub
        </button>
      </div>
    </div>
  </AuthShellDesktop>
);

const DesktopSignup = () => (
  <AuthShellDesktop
    title="Create your account"
    sub="Free while in beta. AI runs overnight, results land at 8:00 AM."
    footer={
      <>
        Have an account?{" "}
        <a href="#" style={{ color: "var(--accent-text)", fontWeight: 500 }}>
          Sign in
        </a>
      </>
    }
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label className="d-field-label">Full name</label>
        <input className="d-input" defaultValue="Aditya Kumar" />
      </div>
      <div>
        <label className="d-field-label">Email</label>
        <input className="d-input" defaultValue="aditya.kumar@gmail.com" />
      </div>
      <div>
        <label className="d-field-label">Password</label>
        <input className="d-input" type="password" defaultValue="••••••••••" />
      </div>
      <button
        className="d-btn primary lg"
        style={{ width: "100%", marginTop: 8, color: "rgb(255, 255, 255)" }}
      >
        Create account
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "8px 0",
          color: "var(--text-muted)",
          font: "500 11px/1 var(--font-sans)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        Or
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button className="d-btn secondary lg" style={{ justifyContent: "center" }}>
          <Icon name="google" size={15} /> Google
        </button>
        <button className="d-btn secondary lg" style={{ justifyContent: "center" }}>
          <Icon name="github" size={15} /> GitHub
        </button>
      </div>
      <p
        style={{
          font: "400 11px/1.5 var(--font-sans)",
          color: "var(--text-muted)",
          textWrap: "pretty",
          marginTop: 8,
        }}
      >
        By creating an account you agree to the{" "}
        <a href="#" style={{ color: "var(--text-secondary)" }}>
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" style={{ color: "var(--text-secondary)" }}>
          Privacy Policy
        </a>
        .
      </p>
    </div>
  </AuthShellDesktop>
);

// Pulse animation for SSO callback
if (typeof document !== "undefined" && !document.getElementById("auth-pulse-styles")) {
  const s = document.createElement("style");
  s.id = "auth-pulse-styles";
  s.textContent = `@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`;
  document.head.appendChild(s);
}

Object.assign(window, { MobileLogin, MobileSignup, MobileSso, DesktopLogin, DesktopSignup });
