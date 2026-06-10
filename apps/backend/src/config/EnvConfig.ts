export default class EnvConfig {
  static validateApi(env: Env): void {
    EnvConfig.assertPresent(env, [
      "CLERK_PUBLISHABLE_KEY",
      "CLERK_SECRET_KEY",
      "ALLOWED_CORS_ORIGIN",
      "RESEND_API_KEY",
      "RESEND_INBOUND_DOMAIN",
      "RESEND_WEBHOOK_SECRET",
      "TAVILY_API_KEY",
    ]);
  }

  static validateProcessor(env: Env): void {
    EnvConfig.assertPresent(env, [
      "RESEND_API_KEY",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_TOKEN_ISOTOPE",
    ]);
  }

  private static assertPresent(env: Env, keys: (keyof Env)[]): void {
    const missing = keys.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(", ")}`);
    }
  }

  static clerkPublishableKey(env: Env): string {
    return env.CLERK_PUBLISHABLE_KEY;
  }

  static clerkSecretKey(env: Env): string {
    return env.CLERK_SECRET_KEY;
  }

  static allowedCorsOrigins(env: Env): string[] {
    return (env.ALLOWED_CORS_ORIGIN ?? "").split(",").filter(Boolean);
  }

  static resendApiKey(env: Env): string {
    return env.RESEND_API_KEY;
  }

  static resendInboundDomain(env: Env): string {
    return env.RESEND_INBOUND_DOMAIN;
  }

  static resendWebhookSecret(env: Env): string {
    return env.RESEND_WEBHOOK_SECRET;
  }

  static tavilyApiKey(env: Env): string {
    return env.TAVILY_API_KEY;
  }

  static cloudflareAccountId(env: Env): string {
    return env.CLOUDFLARE_ACCOUNT_ID;
  }

  static cloudflareIsotopeToken(env: Env): string {
    return env.CLOUDFLARE_TOKEN_ISOTOPE;
  }
}
