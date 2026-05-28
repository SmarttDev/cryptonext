-- Auto-loaded by the postgres container the first time the data volume is
-- initialized (mounted into /docker-entrypoint-initdb.d). Creates the
-- throwaway database used by the backend integration tests.

SELECT 'CREATE DATABASE cryptonext_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cryptonext_test')\gexec
