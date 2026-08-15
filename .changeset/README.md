# Changesets

Independent SemVer for workspace apps and packages. Packages stay `private`; do
not run `changeset publish`. Do not bump versions in pre-commit.

Add a changeset when a member’s API or shipped behavior changes. Skip for docs,
specs, formatting, cspell, and agent workflow files.

Impact:

- `patch`: CSS reset fix in `@windwise/ui` with no API change; env validation
  crash fix in `@windwise/consumer-application`.
- `minor`: new Button/Input primitives in `@windwise/ui`; new helper export in
  `@windwise/query`.
- `major`: remove or rename a public export from `@windwise/ui` or
  `@windwise/query`. On `0.y.z`, prefer `minor` unless the record explicitly
  says `major`; `1.0.0` is a product decision.

Multiple pending records for one package: highest impact wins (`major` >
`minor` > `patch`). New members must ship `"version": "0.1.0"` and
`"private": true`; Changesets does not invent the field. Exclude a package via
`.changeset/config.json` `ignore` (currently empty) and explain why in the PR.

```bash
vp run changeset
vp run changeset:version
```

`changeset version` consumes `.changeset/*.md`, bumps each listed
`package.json`, and writes `CHANGELOG.md`. Current baseline is `0.1.0`.

See [AGENTS.md](../AGENTS.md) (Git / package versions).
