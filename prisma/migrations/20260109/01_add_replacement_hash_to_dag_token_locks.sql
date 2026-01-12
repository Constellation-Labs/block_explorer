-- Add replacement_hash field to dag_token_locks

ALTER TABLE dag_token_locks
ADD COLUMN replacement_hash varchar NULL;
