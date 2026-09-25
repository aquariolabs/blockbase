---
name: sync-template
description: Manually sync the current child repository with aquariolabs/blockbase, resolve conflicts, validate, create a pull request, and merge it.
---

# Sync template

Use `aquariolabs/blockbase`, branch `main`, as the template. Run only when explicitly invoked. Invocation authorizes pushing the sync branch, creating or updating its PR, and merging after validation, unless the user narrows the request (for example, PR only). Use existing Git and GitHub CLI authentication; no GitHub App, embedded tokens, or scheduled workflow is needed.

## Prepare

1. Read the target repository's instructions. Inspect Git status, remotes, and `gh auth status`. Resolve the target repository and its default branch from GitHub, rather than assuming the current branch is the destination. Stop if the target is `aquariolabs/blockbase` itself. Confirm access to both repositories without printing credentials.

2. Fetch the target base and template `main` through credential-free remote URLs using the existing credential helper or SSH setup. Record both full commit SHAs. Keep any existing remote named `template` intact if it points elsewhere. Use a separate worktree based on the fetched target default branch so local edits and unrelated branches remain untouched.

3. If the template SHA is already an ancestor of the target base, report that it is up to date. Otherwise use `codex/template-sync-<short-template-sha>` and look for an existing PR with that exact head and target base. Reuse a compatible open sync PR after inspecting its commits and ownership. Preserve work added by others; do not overwrite or force-push it. If the name belongs to unrelated work or a closed PR, use a new branch suffix.

## Integrate

4. Merge the recorded template commit into the sync branch with `--no-ff --no-commit`, keeping a real merge commit so future runs can use ancestry. If the histories have no common ancestor, verify that the target was generated from this template using GitHub metadata or repository documentation. Only then use `--allow-unrelated-histories`; ask for clarification when provenance cannot be established.

5. Resolve conflicts by reading both changes and their intent, preserving the child's application behavior and configuration while bringing in template improvements. Ask the user about incompatible product decisions. Keep unresolved conflicts local; never commit conflict markers or choose an entire side indiscriminately. Review cleanly merged changes for child-specific regressions as well. Workflow changes also need review.

6. Inspect the complete diff against the recorded target base. Run the repository's required install and validation commands in the isolated worktree. For Vite+ repositories, inspect `package.json` and `vite.config.ts`, run `vp install`, `vp check`, `vp test`, and any additional required scripts via `vp run`. Fix integration failures within scope; report unrelated failures and leave the PR unmerged until required checks pass. Stage only the intended integration changes and finish the merge commit. Even when the file diff is empty, preserve the ancestry merge if it records a previously unmerged template commit; explain this in the PR.

## Publish and merge

7. Push the sync branch normally. Create or update its PR against the target default branch with a title such as `Sync Blockbase template`. Write the body to a temporary file and use `--body-file`. Include the template's full SHA and link, changes affecting the child, conflict-resolution decisions, and validation results. If publishing is blocked by missing workflow permissions or branch rules, report the specific blocker without changing permissions or protections.

8. Inspect CI and review requirements for the current PR head. Before merging, refresh the target base. If it moved, merge it into the sync branch, resolve conflicts, rerun affected validations, push, and check the new head. Merge only the exact reviewed and validated head with `gh pr merge --merge --match-head-commit <head-sha>`. Preserve the template ancestry: if merge commits are disabled, leave the PR open and explain the repository setting that blocks completion. Respect required checks and reviews; do not use admin bypass, squash, or rebase. If external approval is pending or checks fail, leave the PR open and report what is needed rather than retrying indefinitely.

9. Verify GitHub reports the PR as merged and fetch the target base to confirm the recorded template commit is an ancestor. Report the PR link, template SHA, validation results, and verified outcome. Remove only worktrees and temporary files created by this run once their work is safely preserved; retain local work that has not been published.
