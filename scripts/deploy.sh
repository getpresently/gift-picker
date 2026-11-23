#!/bin/bash
# Deploys exactly what's on GitHub's main, never a working copy, so one
# session's deploy can't roll back another session's pushed work.
# Usage: push your commits to main first, then run scripts/deploy.sh.
# Builds in ~/Sites/gift-picker-deploy, a folder used only for this.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY="$HOME/Sites/gift-picker-deploy"
git -C "$REPO" fetch -q origin
if [ ! -d "$DEPLOY" ]; then
  git -C "$REPO" worktree add -q --detach "$DEPLOY" origin/main
  ln -s "$REPO/node_modules" "$DEPLOY/node_modules"
  ln -s "$REPO/workers-site/node_modules" "$DEPLOY/workers-site/node_modules"
fi
cd "$DEPLOY"
git checkout -q --detach origin/main
git reset -q --hard origin/main
echo "Deploying $(git log --oneline -1)"
npm test
npm run build
npx wrangler deploy
