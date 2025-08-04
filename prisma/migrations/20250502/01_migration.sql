-- remove intermediate block tables
ALTER TABLE metagraph_allow_spends DROP CONSTRAINT allow_spends_block_fk;

DROP TABLE dag_token_lock_blocks;
DROP TABLE metagraph_token_lock_blocks;
DROP TABLE dag_allow_spend_blocks;
DROP TABLE metagraph_allow_spend_blocks;

ALTER TABLE dag_token_unlocks 
    DROP COLUMN lock_reference_ordinal, -- replaced by lock reference hash
    DROP COLUMN parent_hash; -- not used by tessellation

ALTER TABLE dag_token_locks 
    DROP COLUMN global_snapshot_hash, -- replaced by snapshot hash hash
    ADD CONSTRAINT dag_token_locks_global_snapshots_fk FOREIGN KEY (snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE;

ALTER TABLE dag_spend_transactions
    ADD CONSTRAINT dag_spend_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
    ADD CONSTRAINT dag_spend_transactions_global_snapshots_fk FOREIGN KEY (hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE,
    ADD CONSTRAINT dag_spend_transactions_source_addresses_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE;

ALTER TABLE dag_token_unlocks 
    DROP CONSTRAINT dag_token_unlocks_pk,
    ADD CONSTRAINT dag_token_unlocks_pk PRIMARY KEY (hash),
    ADD CONSTRAINT dag_token_unlocks_dag_token_locks_fk FOREIGN KEY (lock_reference_hash) REFERENCES dag_token_locks(hash);


ALTER TABLE metagraph_token_unlocks 
    DROP CONSTRAINT metagraph_token_unlocks_pk,
    ADD CONSTRAINT metagraph_token_unlocks_pk PRIMARY KEY (hash,metagraph_id);


CREATE INDEX dag_spend_transactions_allow_spend_ref_idx ON public.dag_spend_transactions USING btree (allow_spend_ref);
CREATE INDEX dag_spend_transactions_destination_addr_idx ON public.dag_spend_transactions USING btree (destination_addr);
CREATE INDEX dag_spend_transactions_snapshot_hash_idx ON public.dag_spend_transactions USING btree (snapshot_hash);
CREATE INDEX dag_spend_transactions_source_addr_idx ON public.dag_spend_transactions USING btree (source_addr);
CREATE INDEX dag_expired_spend_transactions_allow_spend_ref_idx ON dag_expired_spend_transactions USING btree (allow_spend_ref);
CREATE INDEX dag_expired_spend_transactions_snapshot_hash_idx ON dag_expired_spend_transactions USING btree (snapshot_hash);
CREATE INDEX dag_expired_spend_transactions_source_addr_idx ON dag_expired_spend_transactions USING btree (source_addr);

CREATE INDEX dag_token_locks_snapshot_hash_idx ON dag_token_locks USING btree (snapshot_hash);

CREATE INDEX dag_allow_spends_destination_addr_idx ON dag_allow_spends USING btree (destination_addr);
CREATE INDEX dag_allow_spends_source_addr_idx ON dag_allow_spends USING btree (source_addr);

CREATE INDEX dag_balance_changes_snapshot_hash_idx ON dag_balance_changes USING btree (snapshot_hash);




ALTER TABLE dag_allow_spends DROP CONSTRAINT dag_allow_spends_ordinal;
ALTER TABLE metagraph_allow_spends DROP CONSTRAINT metagraph_allow_spends_ordinal;




ALTER TABLE public.metagraph_spend_transactions ADD CONSTRAINT dag_spend_transactions_metagraph_allow_spends_fk FOREIGN KEY (allow_spend_ref) REFERENCES metagraph_allow_spends(hash)