export default class Utilities {
  // test
  static getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }

  static relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private static titleCaseTokens(raw: string): string {
    return raw
      .split(/[._\-+]+/)
      .filter(Boolean)
      .filter((token) => !/^\d+$/.test(token))
      .map((token) => token[0]?.toUpperCase() + token.slice(1).toLowerCase())
      .join(" ");
  }

  static guessNameFromEmailOrLinkedin(email: string, linkedinUrl: string): string {
    const localPart = email.trim().split("@")[0];
    if (localPart) {
      const guess = Utilities.titleCaseTokens(localPart);
      if (guess) return guess;
    }

    const slugMatch = linkedinUrl.trim().match(/linkedin\.com\/in\/([^/?#]+)/i);
    const slug = slugMatch?.[1];
    if (slug) {
      const withoutTrailingId = slug.replace(/-[a-z0-9]{6,}$/i, "");
      const guess = Utilities.titleCaseTokens(withoutTrailingId);
      if (guess) return guess;
    }

    return "";
  }
}
