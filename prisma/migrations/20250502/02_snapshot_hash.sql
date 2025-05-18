-- Add snapshot_hash column to abstract_transactions
ALTER TABLE public.abstract_transactions
ADD COLUMN snapshot_hash varchar NULL;

-- Replace the trigger function to propagate snapshot_hash
CREATE OR REPLACE FUNCTION public.insert_into_parent_abstract_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO abstract_transactions (hash, source_addr, amount, created_at, snapshot_hash)
    VALUES (NEW.hash, NEW.source_addr, NEW.amount, NEW.created_at, NEW.snapshot_hash)
    ON CONFLICT (hash) DO NOTHING;
    RETURN NEW;
END;
$function$
;

-- For dag snapshot transactions
CREATE OR REPLACE FUNCTION insert_into_parent_abstract_transactions_from_block()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    snap_hash varchar;
BEGIN
    SELECT snapshot_hash INTO snap_hash
    FROM dag_blocks
    WHERE hash = NEW.block_hash;

    INSERT INTO abstract_transactions (hash, source_addr, amount, created_at, snapshot_hash)
    VALUES (NEW.hash, NEW.source_addr, NEW.amount, NEW.created_at, snap_hash)
    ON CONFLICT (hash) DO NOTHING;

    --temporarily until new streaming is deployed
    UPDATE dag_transactions
    SET snapshot_hash = snap_hash
    WHERE hash = NEW.hash;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_insert_abstract_transactions_dag_transactions ON dag_transactions;

CREATE TRIGGER trigger_insert_abstract_transactions_dag_transactions
AFTER INSERT ON public.dag_transactions
FOR EACH ROW
EXECUTE FUNCTION insert_into_parent_abstract_transactions_from_block();

-- For metagraph snapshot transactions
CREATE OR REPLACE FUNCTION insert_into_parent_abstract_transactions_from_metagraph_block()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    snap_hash varchar;
BEGIN
    SELECT metagraph_snapshot_hash INTO snap_hash
    FROM metagraph_blocks
    WHERE metagraph_id = NEW.metagraph_id AND hash = NEW.block_hash;

    INSERT INTO abstract_transactions (hash, source_addr, amount, created_at, snapshot_hash)
    VALUES (NEW.hash, NEW.source_addr, NEW.amount, NEW.created_at, snap_hash)
    ON CONFLICT (hash) DO NOTHING;

    --temporarily until new streaming is deployed
    UPDATE metagraph_transactions
    SET snapshot_hash = snap_hash
    WHERE hash = NEW.hash;

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trigger_insert_abstract_transactions_metagraph_transactions ON metagraph_transactions;

CREATE TRIGGER trigger_insert_abstract_transactions_metagraph_transactions
AFTER INSERT ON metagraph_transactions
FOR EACH ROW
EXECUTE FUNCTION insert_into_parent_abstract_transactions_from_metagraph_block();


-- Backfill snapshot_hash from DAG child tables


UPDATE abstract_transactions
SET snapshot_hash = db.snapshot_hash
FROM dag_transactions dt
JOIN dag_blocks db ON dt.block_hash = db.hash
WHERE abstract_transactions.hash = dt.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM dag_allow_spends child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM dag_expired_spend_transactions child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM dag_spend_transactions child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM dag_token_locks child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM dag_token_unlocks child
WHERE abstract_transactions.hash = child.hash;

-- Backfill snapshot_hash from Metagraph child tables

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM metagraph_allow_spends child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM metagraph_expired_spend_transactions child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM metagraph_spend_transactions child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM metagraph_token_locks child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM metagraph_token_unlocks child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = child.snapshot_hash
FROM metagraph_fee_transactions child
WHERE abstract_transactions.hash = child.hash;

UPDATE abstract_transactions
SET snapshot_hash = mb.metagraph_snapshot_hash
FROM metagraph_transactions mt
JOIN metagraph_blocks mb
  ON mt.block_hash = mb.hash AND mt.metagraph_id = mb.metagraph_id
WHERE abstract_transactions.hash = mt.hash;


-- Update view

CREATE OR REPLACE VIEW abstract_transactions_view AS
SELECT
    tx.hash,
    tx.source_addr,
    tx.amount,
    tx.created_at,
    tx.updated_at,
    p.relname AS table_name,
    tx.snapshot_hash 
FROM abstract_transactions tx
JOIN pg_class p ON tx.tableoid = p.oid
WHERE p.relname <> 'abstract_transactions'::name;

-- Enforce NOT NULL constraint after data backfill
ALTER TABLE public.abstract_transactions
ALTER COLUMN snapshot_hash SET NOT NULL;
