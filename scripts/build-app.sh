#!/usr/bin/env bash
set -e

required_files=(
  "app/layout.tsx"
  "app/globals.css"
  "app/page.tsx"
  "app/dashboard/admin/page.tsx"
  "app/dashboard/teacher/page.tsx"
  "app/dashboard/parent/page.tsx"
  "components/SupportCentre.tsx"
  "lib/supabase.ts"
  "tsconfig.json"
  "package.json"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

npm run build
