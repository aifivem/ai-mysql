# ai-mysql

The database engine for third-party scripts: it stands in for oxmysql (`provide 'oxmysql'`, also `mysql-async` and `ghmattimysql`), so scripts that call `exports.oxmysql:*` or load `@oxmysql/lib/MySQL.lua` run unchanged on its pool. Server only. The engine itself is the `@aicore-fivem/mysql` package; ai-* resources use that package in-process and never go through this resource.

## Decisions

- Own engine instead of oxmysql (owner decision): ai-* resources skip the export hop per query, third-party scripts keep working through this stand-in. oxmysql is not installed on the server.
- The export surface, callback rules, result types and `lib/MySQL.lua` follow oxmysql exactly (adapted from oxmysql, LGPL-3.0, Overextended; license in `lib/LICENSE-oxmysql`). oxmysql's mysql2/named-placeholders patches are reproduced in code (`@aicore-fivem/mysql`), not by patching packages.
- Pool size: `ai_mysql_shared_pool_size` convar (default 10); each ai-* resource's own pool uses `ai_mysql_pool_size` (default 5).
- The manifest `version` is the oxmysql version whose behaviour this resource mirrors (`fxVersion` in package.json, now 2.14.3), not the package version: scripts read `GetResourceMetadata("oxmysql", "version")` (resolved to this resource through `provide`) and switch to old oxmysql 1.x code paths below 2.0. Raise it together with the engine when following a newer oxmysql.

## Contracts

- Exports under both `ai-mysql` and `oxmysql`: `query`, `single`, `scalar`, `insert`, `update`, `prepare`, `rawExecute`, `transaction`, `startTransaction`, `store`, `isReady`, `awaitConnection`, `execute`, `fetch`, each also as `<name>_async` / `<name>Sync` (promise form). ghmattimysql (`execute`, `scalar`, `transaction`, `store` + `Sync`) and mysql-async (`mysql_execute`, `mysql_insert`, `mysql_fetch_all`, `mysql_fetch_scalar`, `mysql_transaction`, `mysql_store`) aliases.
- Events like oxmysql: `oxmysql:error`, `oxmysql:transaction-error`.
- Convars like oxmysql: `mysql_connection_string` (needs `add_convar_permission ai-mysql read mysql_connection_string`), `mysql_slow_query_warning`, `mysql_resultset_warning`, `mysql_transaction_isolation_level`.

## Pitfalls

- `provide` does not alias exports: every oxmysql export name is answered by hand through `__cfx_export_oxmysql_<name>` handlers. It does make `GetResourceState('oxmysql')` return `started`, satisfies `dependency 'oxmysql'`, resolves `GetResourceMetadata('oxmysql', ...)` and `@oxmysql/...` file includes to this resource (verified on the dev server with Lua tests of every call shape, `startTransaction` included).
- `lib/MySQL.lua` waits for `ai-mysql` or `oxmysql` to be started; keep that line when updating the file from upstream.
- mysql2 tries an optional `require("cardinal")`; the template's tsdown plugin `aicore-no-cardinal` removes it, or the sandbox prints a permission warning at every start.

## Entry points

- Export registration: `resource/server/index.ts`. Engine and the oxmysql-compatible functions: `packages/mysql/src` (`engine.ts`, `compat.ts`).
- Lua wrapper for scripts: `lib/MySQL.lua`.
