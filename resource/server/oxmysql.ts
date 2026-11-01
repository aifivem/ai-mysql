import {
  onStop,
  provideExport,
  registerExport,
} from "@aicore-fivem/lib/server";
import { mysql } from "@aicore-fivem/mysql";
import {
  GHMATTIMYSQL_ALIASES,
  MYSQL_ASYNC_ALIASES,
  OXMYSQL_EXPORTS,
  promiseForm,
} from "@aicore-fivem/mysql/compat";

/**
 * Stands in for oxmysql (the manifest `provide`s oxmysql, mysql-async and ghmattimysql): third-party scripts call
 * `exports.oxmysql:*` or load `@oxmysql/lib/MySQL.lua` and reach this resource's pool. ai-* resources do not go
 * through here; each runs `@aicore-fivem/mysql` in-process.
 */

// Shared by every third-party script, so larger than an ai-* resource's own pool.
mysql.setPoolSize(GetConvarInt("ai_mysql_shared_pool_size", 10));

for (const [name, fn] of Object.entries(OXMYSQL_EXPORTS)) {
  const promised = promiseForm(name);
  for (const [exportName, handler] of [
    [name, fn],
    [`${name}_async`, promised],
    [`${name}Sync`, promised],
  ] as const) {
    registerExport(exportName, handler as (...args: unknown[]) => unknown);
    provideExport("oxmysql", exportName, handler);
  }

  const ghmatti = GHMATTIMYSQL_ALIASES[name];
  if (ghmatti) {
    provideExport("ghmattimysql", ghmatti, fn);
    provideExport("ghmattimysql", `${ghmatti}Sync`, promised);
  }
  const mysqlAsync = MYSQL_ASYNC_ALIASES[name];
  if (mysqlAsync) provideExport("mysql-async", mysqlAsync, fn);
}

// Open the pool at start so the connection result shows up in the console right away.
mysql.awaitConnection().catch(() => undefined);

onStop(() => void mysql.close());
