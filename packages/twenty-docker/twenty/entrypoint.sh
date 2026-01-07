#!/bin/sh
set -e

setup_and_migrate_db() {
    if [ "${DISABLE_DB_MIGRATIONS}" = "true" ]; then
        echo "Database setup and migrations are disabled, skipping..."
        return 1  # Return 1 to indicate migrations were skipped
    fi

    echo "Running database setup and migrations..."

    # Run setup and migration scripts
    has_schema=$(psql -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core')" ${PG_DATABASE_URL})
    if [ "$has_schema" = "f" ]; then
        echo "Database appears to be empty, running migrations."
        NODE_OPTIONS="--max-old-space-size=1500" tsx ./scripts/setup-db.ts
        yarn database:migrate:prod
        return 0  # Return 0 to indicate fresh database
    fi

    yarn command:prod upgrade
    echo "Successfully migrated DB!"
    return 1  # Return 1 to indicate existing database
}

seed_demo_data() {
    echo "Seeding demo data (Apple & YCombinator workspaces)..."
    if yarn command:prod workspace:seed:dev; then
        echo "Successfully seeded demo data!"
    else
        echo "Warning: Failed to seed demo data, but continuing startup..."
    fi
}

register_background_jobs() {
    if [ "${DISABLE_CRON_JOBS_REGISTRATION}" = "true" ]; then
        echo "Cron job registration is disabled, skipping..."
        return
    fi

    echo "Registering background sync jobs..."
    if yarn command:prod cron:register:all; then
        echo "Successfully registered all background sync jobs!"
    else
        echo "Warning: Failed to register background jobs, but continuing startup..."
    fi
}

# Run migrations and check if this is a fresh database
if setup_and_migrate_db; then
    # Fresh database - seed demo data
    seed_demo_data
fi

register_background_jobs

# Continue with the original Docker command
exec "$@"
