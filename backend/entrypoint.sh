#!/bin/bash
set -e

# Start SQL Server in the background
/opt/mssql/bin/sqlservr &

# Wait for SQL Server to be ready
until /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -N -Q "SELECT 1" &> /dev/null
do
  echo "Waiting for SQL Server to start..."
  sleep 1
done
echo "SQL Server is ready"

# Run the initialization script
echo "Running initialization script..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -N -t 30 -b -e -I -i /scripts/init-database.sql

# Keep container running
tail -f /dev/null
