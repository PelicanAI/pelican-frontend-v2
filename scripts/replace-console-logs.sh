#!/bin/bash

# Script to find and count remaining console.log statements
# Run this script to see where console statements still exist

echo "=== Remaining console.log statements by file ==="
echo ""

# Find all console statements and count them per file
grep -r "console\.(log|error|warn|info)" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.sh" \
  app/ components/ hooks/ lib/ 2>/dev/null | \
  cut -d: -f1 | sort | uniq -c | sort -rn

echo ""
echo "=== Total count ==="
grep -r "console\.(log|error|warn|info)" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.sh" \
  app/ components/ hooks/ lib/ 2>/dev/null | wc -l

echo ""
echo "=== Files to still update ==="
grep -r "console\.(log|error|warn|info)" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.sh" \
  app/ components/ hooks/ lib/ 2>/dev/null | \
  cut -d: -f1 | sort | uniq

echo ""
echo "Run 'npm run build' to check for TypeScript/ESLint errors after Next.js config changes."

