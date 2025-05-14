#!/bin/bash

# Check if .env.local exists, if not create it
if [ ! -f .env.local ]; then
  touch .env.local
  echo "Created new .env.local file"
else
  echo ".env.local file already exists"
fi

# Check if NEXT_PUBLIC_SITE_URL exists in .env.local
if grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
  # Update existing NEXT_PUBLIC_SITE_URL
  sed -i '' 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://whisprtalk.vercel.app|g' .env.local
  echo "Updated NEXT_PUBLIC_SITE_URL in .env.local"
else
  # Add NEXT_PUBLIC_SITE_URL to .env.local
  echo "NEXT_PUBLIC_SITE_URL=https://whisprtalk.vercel.app" >> .env.local
  echo "Added NEXT_PUBLIC_SITE_URL to .env.local"
fi

echo "Environment configuration updated successfully!"
echo "Remember to add this environment variable in your Vercel project settings too!" 