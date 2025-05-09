-- ALTER TABLE dag_token_unlocks ALTER COLUMN parent_hash DROP NOT NULL;
-- ALTER TABLE dag_token_unlocks ALTER COLUMN lock_reference_ordinal DROP NOT NULL;
ALTER TABLE dag_token_unlocks DROP COLUMN parent_hash;
ALTER TABLE dag_token_unlocks DROP COLUMN lock_reference_ordinal;
