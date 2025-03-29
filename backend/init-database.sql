PRINT 'Starting database initialization script...'
GO

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'stuffDb')
BEGIN
    PRINT 'Creating database stuffDb...'
    CREATE DATABASE stuffDb;
    PRINT 'Database created successfully!'
END
ELSE
BEGIN
    PRINT 'Database stuffDb already exists'
END
GO

PRINT 'Switching to stuffDb database...'
USE stuffDb;
GO

-- Create the first user if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'StandardUser')
BEGIN
    PRINT 'Creating login StandardUser...'
    CREATE LOGIN StandardUser WITH PASSWORD = '$(SQL_StandardUser_PASSWORD)';
    PRINT 'Login StandardUser created successfully!'
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'StandardUser')
BEGIN
    PRINT 'Creating user StandardUser...'
    CREATE USER StandardUser FOR LOGIN StandardUser;
    ALTER ROLE db_datareader ADD MEMBER StandardUser;
    ALTER ROLE db_datawriter ADD MEMBER StandardUser;
    PRINT 'User StandardUser created and configured successfully!'
END
GO

-- Create the second user if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'MigrationUser')
BEGIN
    PRINT 'Creating login MigrationUser...'
    CREATE LOGIN MigrationUser WITH PASSWORD = '$(SQL_MigrationUser_PASSWORD)';
    PRINT 'Login MigrationUser created successfully!'
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'MigrationUser')
BEGIN
    PRINT 'Creating user MigrationUser...'
    CREATE USER MigrationUser FOR LOGIN MigrationUser;
    ALTER ROLE db_datareader ADD MEMBER MigrationUser;
    ALTER ROLE db_datawriter ADD MEMBER MigrationUser;
    ALTER ROLE db_ddladmin ADD MEMBER MigrationUser;    -- Add this for table creation
    ALTER ROLE db_owner ADD MEMBER MigrationUser;  --full
    PRINT 'User MigrationUser created and configured successfully!'
END
GO

PRINT 'Database initialization completed!'
GO