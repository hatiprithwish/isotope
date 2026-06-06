export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

export interface WebSearchProvider {
  search(
    query: string,
    options?: { maxResults?: number; timeRange?: "day" | "week" | "month" | "year" },
  ): Promise<WebSearchResult[]>;
}

interface TavilySearchResultRaw {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilySearchResponseRaw {
  results: TavilySearchResultRaw[];
}

export class TavilySearchProvider implements WebSearchProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    options?: { maxResults?: number; timeRange?: "day" | "week" | "month" | "year" },
  ): Promise<WebSearchResult[]> {
    const body: Record<string, unknown> = {
      query,
      search_depth: "basic",
      max_results: options?.maxResults ?? 10,
    };
    if (options?.timeRange) {
      body.time_range = options.timeRange;
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tavily search failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as TavilySearchResponseRaw;

    return (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  }
}
