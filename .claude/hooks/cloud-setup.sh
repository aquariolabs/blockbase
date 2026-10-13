#!/usr/bin/env bash
# Prepares a Claude Code cloud session (claude.ai/code, `claude --cloud`).
#
# A cloud session starts from a fresh clone on an Ubuntu VM that has neither
# Vite+ nor this project's Node.js version. This installs both, then the
# dependencies, so the session can run `vp check` and `vp test` right away.
# Local sessions skip it and keep using the developer's own toolchain.
#
# Everything comes from hosts on the default "Trusted" network allowlist, so
# any cloud environment works, including Default, with no setup script.

set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

export VP_HOME="$HOME/.vite-plus"
export PATH="$VP_HOME/bin:$PATH"

setup() {
  if ! command -v vp >/dev/null; then
    # https://vite.plus serves this same installer but is not on the
    # allowlist. Taking the version from the catalog keeps the global CLI on
    # the same release as the workspace's `vite-plus` package.
    local version
    version="$(sed -n 's/^ *vite-plus: *//p' pnpm-workspace.yaml)"
    curl -fsSL "https://raw.githubusercontent.com/voidzero-dev/vite-plus/v$version/packages/cli/install.sh" |
      CI=true VP_VERSION="$version" VP_NODE_MANAGER=yes bash
  fi

  vp install

  # Only projects that pin a Rust toolchain have this file.
  if [ -f rust-toolchain.toml ] && command -v rustup >/dev/null; then
    rustup toolchain install --no-self-update
  fi
}

# The commands Claude runs later read their environment from this file.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export VP_HOME=\"$VP_HOME\""
    echo "export PATH=\"$VP_HOME/bin:\$PATH\""
  } >>"$CLAUDE_ENV_FILE"
fi

# What this prints goes into Claude's context, so the install output is kept
# in a log and only the outcome is printed. `set -e` has no effect inside an
# `if` or `||`, hence the subshell and the explicit status.
log="${TMPDIR:-/tmp}/claude-cloud-setup.log"
set +e
(
  set -e
  setup
) >"$log" 2>&1
status=$?
set -e

if [ "$status" -eq 0 ]; then
  echo "Cloud setup finished: vp, Node.js $(node --version) and the dependencies are installed."
else
  echo "Cloud setup failed (exit $status), so vp or the dependencies may be missing. Log: $log"
fi
