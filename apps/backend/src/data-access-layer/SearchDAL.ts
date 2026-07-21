import { sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

const DEFAULT_LIMIT = 20;

// Title col ordinal 3 (0-based: entity_type, entity_id, created_by, title, body) for snippet().
const TITLE_COLUMN_INDEX = 3;

export default class SearchDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  // Builds a safe FTS5 MATCH expression from free-text user input: strips all
  // FTS5 syntax characters the user didn't intend (not just the ones the
  // quote-wrap below happens to neutralize today), tokenizes, and ANDs
  // together prefix-phrase matches so raw user input can never throw a MATCH
  // syntax error even if the wrapping logic changes later.
  private buildMatchQuery(query: string): string {
    const tokens = query
      .replace(/["*^:()+\-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    return tokens.map((token) => `"${token}"*`).join(" ");
  }

  async search(params: Schemas.SearchDALRequest) {
    const response: Schemas.SearchApiResponse = { isSuccess: false };

    try {
      const matchQuery = this.buildMatchQuery(params.query);

      if (!matchQuery) {
        response.isSuccess = true;
        response.message = "Search results fetched successfully";
        response.results = [];
        return response;
      }

      const limit = params.limit ?? DEFAULT_LIMIT;

      const rows = await this.db.all<{
        entity_type: string;
        entity_id: number;
        title: string;
        snippet: string | null;
        score: number;
      }>(sql`
        SELECT entity_type, entity_id, title,
               snippet(search_index, ${TITLE_COLUMN_INDEX}, '<mark>', '</mark>', '…', 12) AS snippet,
               bm25(search_index, 10.0, 1.0) AS score
        FROM search_index
        WHERE search_index MATCH ${matchQuery}
          AND created_by = ${params.createdBy}
        ORDER BY score
        LIMIT ${limit}
      `);

      response.isSuccess = true;
      response.message = "Search results fetched successfully";
      response.results = rows.map((row) => ({
        entityType: row.entity_type as Schemas.SearchEntityType,
        entityId: row.entity_id,
        title: row.title,
        snippet: row.snippet,
        score: row.score,
      }));
    } catch (error) {
      const message = "Unknown error in global search";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GlobalSearch,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
