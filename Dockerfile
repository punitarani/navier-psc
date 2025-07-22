FROM postgres:16-alpine

# Set environment variables for PostgreSQL
ENV POSTGRES_DB=psc
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV PGDATA=/var/lib/postgresql/data/pgdata

# Expose PostgreSQL port
EXPOSE 5432

# Create a volume for persistent data
# NOTE: we don't need to persist data for this project
# VOLUME ["/var/lib/postgresql/data"]

CMD ["postgres"]
