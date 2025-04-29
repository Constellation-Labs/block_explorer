ALTER TABLE public.dag_token_unlocks ALTER COLUMN parent_hash DROP NOT NULL;
ALTER TABLE public.dag_token_unlocks DROP COLUMN lock_reference_ordinal;
