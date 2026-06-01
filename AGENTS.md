<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Notes

- `portless` is installed at the workspace root. After creating a new app, configure that app's `package.json` with a `portless` block using the app and repository names, for example: `"portless": { "name": "APP_NAME.REPO_NAME", "script": "dev:app" }`. Keep the underlying framework command in the referenced script, such as `"dev:app": "next dev"`, and have the Vite+ `dev` task run `portless`.
- When adding new apps or packages, review whether their dependencies belong in an existing Renovate group before adding new repository-level rules.
- If a dependency family should be grouped across repositories, prefer updating the shared preset in `github>wladpaiva/renovate-config` instead of creating a one-off rule here.
- Do not add a dedicated Renovate `packageRule` for a single dependency unless the change needs behavior beyond grouping, such as a custom schedule, labels, or approvals.
- Group dependencies only when they are usually reviewed together in practice.
- If a new dependency family needs its own cadence, add a focused rule instead of leaving Renovate to open one PR per package.
