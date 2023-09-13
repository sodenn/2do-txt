#!/bin/bash

echo "VERCEL_GIT_COMMIT_AUTHOR_LOGIN: $VERCEL_GIT_COMMIT_AUTHOR_LOGIN"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ $VERCEL_GIT_COMMIT_REF == main ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == feat* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == style* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == test* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == chore* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == fix* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == refactor* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == renovate* ]] || \
   [[ $VERCEL_GIT_COMMIT_REF == build* ]] ; then
  # Proceed with the build
  echo "✅ - Build can proceed"
  exit 1;
else
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
fi
