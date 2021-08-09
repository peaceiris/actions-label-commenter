#!/usr/bin/env bash

# fail on unset variables and command errors
set -eu -o pipefail # -x: is for debugging

NEXT_VERSION=$(git rev-parse HEAD)
sed -i "s/Version: '.*'/Version: '${NEXT_VERSION}'/" ./src/constants.ts
npm run build
git checkout ./src/constants.ts
git add ./lib/*
git commit -m "chore(release): Add build assets"
