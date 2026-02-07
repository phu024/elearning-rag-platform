#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
if npx prisma db seed 2>/dev/null; then
  echo "✓ Database seeded successfully"
else
  echo "⚠️  Seed skipped (may already exist) - continuing startup..."
fi

echo "🚀 Starting application..."
exec npm start
