// Generates the FTS5 sync-trigger + backfill SQL block for every entity in
// SEARCH_PROJECTIONS (packages/schemas/src/search/SearchCommon.ts).
//
// Run: pnpm search:gen-triggers
//
// Paste the output into a new hand-written migration file
// (src/db/migrations/00NN_isotope.sql) — this script only prints SQL, it
// never touches the DB or writes files, so a stale/duplicate migration can
// never be silently created.
import { SEARCH_PROJECTIONS, SearchEntityType } from "@app/schemas";

function bodyExpression(columns: string[]): string {
  return columns.map((col) => `coalesce(new.${col}, '')`).join(" || ' ' || ");
}

function bodyExpressionForBackfill(columns: string[]): string {
  return columns.map((col) => `coalesce(${col}, '')`).join(" || ' ' || ");
}

function triggersFor(entityType: SearchEntityType): string {
  const { table, title, body } = SEARCH_PROJECTIONS[entityType];
  const bodyExpr = bodyExpression(body);

  return `-- ${table[0]?.toUpperCase()}${table.slice(1)}
CREATE TRIGGER \`${table}_search_ai\` AFTER INSERT ON \`${table}\` BEGIN
  INSERT INTO \`search_index\`(entity_type, entity_id, created_by, title, body)
  VALUES ('${entityType}', new.id, new.created_by, new.${title}, ${bodyExpr});
END;
--> statement-breakpoint
CREATE TRIGGER \`${table}_search_ad\` AFTER DELETE ON \`${table}\` BEGIN
  DELETE FROM \`search_index\` WHERE entity_type = '${entityType}' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER \`${table}_search_au\` AFTER UPDATE ON \`${table}\` BEGIN
  DELETE FROM \`search_index\` WHERE entity_type = '${entityType}' AND entity_id = old.id;
  INSERT INTO \`search_index\`(entity_type, entity_id, created_by, title, body)
  VALUES ('${entityType}', new.id, new.created_by, new.${title}, ${bodyExpr});
END;
--> statement-breakpoint`;
}

function backfillFor(entityType: SearchEntityType): string {
  const { table, title, body } = SEARCH_PROJECTIONS[entityType];
  const bodyExpr = bodyExpressionForBackfill(body);

  return `INSERT INTO \`search_index\`(entity_type, entity_id, created_by, title, body)
SELECT '${entityType}', id, created_by, ${title}, ${bodyExpr}
FROM \`${table}\`;`;
}

function main(): void {
  const entityTypes = Object.values(SearchEntityType);

  const triggerBlocks = entityTypes.map(triggersFor).join("\n");
  const backfillBlocks = entityTypes.map(backfillFor).join("\n--> statement-breakpoint\n");

  console.log(triggerBlocks);
  console.log(backfillBlocks);
}

main();
