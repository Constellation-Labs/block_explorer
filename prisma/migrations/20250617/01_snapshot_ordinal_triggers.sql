ALTER TABLE metagraph_transactions ADD CONSTRAINT metagraph_transactions_unique_hash UNIQUE (hash);

ALTER TABLE metagraph_transactions ALTER COLUMN snapshot_hash SET NOT NULL;
ALTER TABLE metagraph_transactions ADD snapshot_ordinal int8 NULL;
ALTER TABLE dag_transactions ADD snapshot_ordinal int8 NULL;


CREATE INDEX idx_transactions_sorting ON metagraph_transactions (snapshot_hash, created_at DESC, hash DESC);

CREATE OR REPLACE FUNCTION batch_set_mg_tx_snapshot_ordinal()
RETURNS trigger AS $$
BEGIN
  UPDATE metagraph_transactions tx
  SET snapshot_ordinal = s.ordinal
  FROM metagraph_snapshots s
  WHERE tx.snapshot_hash = s.hash
    AND tx.snapshot_ordinal IS NULL;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_trigger_set_mg_tx_snapshot_ordinal
AFTER INSERT
ON metagraph_transactions
FOR EACH STATEMENT
EXECUTE FUNCTION batch_set_mg_tx_snapshot_ordinal();



CREATE OR REPLACE FUNCTION batch_set_dag_tx_snapshot_ordinal()
RETURNS trigger AS $$
BEGIN
  UPDATE dag_transactions tx
  SET snapshot_ordinal = s.ordinal
  FROM global_snapshots s
  WHERE tx.snapshot_hash = s.hash
    AND tx.snapshot_ordinal IS NULL;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_trigger_set_dag_tx_snapshot_ordinal
AFTER INSERT
ON dag_transactions
FOR EACH STATEMENT
EXECUTE FUNCTION batch_set_dag_tx_snapshot_ordinal();


CREATE INDEX CONCURRENTLY idx_meta_txn_filter_order
ON metagraph_transactions (
  metagraph_id,
  source_addr,
  snapshot_ordinal DESC,
  created_at DESC,
  hash DESC
);

CREATE INDEX CONCURRENTLY idx_global_snapshots_created_ordinal
ON global_snapshots (created_at DESC, ordinal DESC);