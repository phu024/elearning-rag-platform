#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed || echo "⚠️  Seed already exists or failed, continuing..."

echo "🚀 Starting application..."
exec npm start
