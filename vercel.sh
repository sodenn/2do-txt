#!/bin/bash

echo "VERCEL_GIT_COMMIT_AUTHOR_LOGIN: $VERCEL_GIT_COMMIT_AUTHOR_LOGIN"
echo "NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: $NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_AUTHOR_LOGIN" == "dependabot[bot]" ]] ; then
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
else
  # Proceed with the build
  echo "✅ - Build can proceed"
  exit 1;
fi