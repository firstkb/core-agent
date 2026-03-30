-- Local example only.
-- In the real model the control DB is one master DB and app DBs can be many.

SELECT 'CREATE DATABASE "108-master"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '108-master') \gexec

SELECT 'CREATE DATABASE "108-sandbox"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '108-sandbox') \gexec

SELECT 'CREATE DATABASE "108-demo"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '108-demo') \gexec
