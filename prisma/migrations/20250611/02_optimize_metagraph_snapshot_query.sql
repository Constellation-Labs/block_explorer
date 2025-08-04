CREATE INDEX idx_withdraw_stake_hash_completed ON public.delegate_stake_withdraw_events(stake_create_hash, is_completed);
CREATE INDEX idx_create_events_hash ON public.delegate_stake_create_events(hash);

CREATE INDEX idx_withdraw_stake_hash ON delegate_stake_withdraw_events(stake_create_hash);
CREATE INDEX idx_create_transfer_from_hash ON delegate_stake_create_events(transfer_from_hash);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metagraph_blocks_snap ON metagraph_blocks (metagraph_id, metagraph_snapshot_hash);
CREATE UNIQUE INDEX metagraph_id_ordinal ON metagraph_snapshots (metagraph_id, ordinal);