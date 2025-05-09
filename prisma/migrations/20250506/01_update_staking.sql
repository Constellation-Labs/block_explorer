ALTER TABLE delegate_stake_create_events DROP COLUMN is_update;
ALTER TABLE delegate_stake_create_events ADD transfer_from_hash varchar NULL; 
ALTER TABLE delegate_stake_position_changes RENAME TO delegate_stake_position_changes;
ALTER TABLE delegate_stake_withdraw_events ADD unlock_epoch int8 NULL;
ALTER TABLE delegate_stake_withdraw_events ADD created_at_epoch int8 NULL;
ALTER TABLE public.delegate_stake_withdraw_events ADD is_completed boolean NULL;

ALTER TABLE public.delegate_stake_rewards ADD stake_create_hash varchar NOT NULL;
ALTER TABLE public.delegate_stake_rewards ADD CONSTRAINT delegate_stake_rewards_delegate_stake_create_events_fk FOREIGN KEY (stake_create_hash) REFERENCES public.delegate_stake_create_events(hash);


--TODO Update is_completed






CREATE TABLE delegate_stake_create_events (
    hash varchar PRIMARY KEY,
    ordinal int8 NOT NULL,
    source_addr varchar NOT NULL REFERENCES addresses(address) ON DELETE CASCADE,
    node_id varchar NOT NULL,
    amount int8 NOT NULL,
    fee int8 NOT NULL DEFAULT 0,
    lock_reference_hash varchar NOT NULL REFERENCES dag_token_locks(hash) ON DELETE CASCADE,
    parent_hash varchar NOT NULL,
    global_snapshot_hash varchar NOT NULL REFERENCES global_snapshots(hash) ON DELETE CASCADE,
    transfer_from_hash varchar NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX delegate_stake_create_events_source_addr_idx ON delegate_stake_create_events USING btree (source_addr);
CREATE INDEX delegate_stake_create_changes_node_id ON delegate_stake_position_changes USING btree (node_id);
CREATE INDEX delegate_stake_create_events_lock_reference_hash_idx ON delegate_stake_create_events USING btree (lock_reference_hash);
CREATE INDEX delegate_stake_create_events_global_snapshot_hash_idx ON delegate_stake_create_events USING btree (global_snapshot_hash);



CREATE TABLE delegate_stake_withdraw_events (
    hash varchar PRIMARY KEY,
    source_addr varchar NOT NULL REFERENCES addresses(address) ON DELETE CASCADE,
    stake_create_hash varchar NOT NULL REFERENCES delegate_stake_create_events(hash) ON DELETE CASCADE,
    global_snapshot_hash varchar NOT NULL REFERENCES global_snapshots(hash) ON DELETE CASCADE,
    unlock_epoch int8 NULL,
    created_at_epoch int8 NULL,
    is_completed boolean NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX delegate_stake_withdraw_events_source_addr_idx ON delegate_stake_withdraw_events USING btree (source_addr);
CREATE INDEX delegate_stake_withdraw_events_stake_create_hash_idx ON delegate_stake_withdraw_events USING btree (stake_create_hash);
CREATE INDEX delegate_stake_withdraw_events_global_snapshot_hash_idx ON delegate_stake_withdraw_events USING btree (global_snapshot_hash);

CREATE TABLE delegate_stake_rewards (
       global_snapshot_hash varchar NOT NULL REFERENCES global_snapshots(hash) ON DELETE CASCADE,
       address varchar NOT NULL REFERENCES addresses(address) ON DELETE CASCADE,
       node_id varchar NOT NULL,
       rewards int8 NOT NULL,
       stake_create_hash varchar NOT NULL,
       created_at timestamp DEFAULT now() NOT NULL,
       updated_at timestamp DEFAULT now() NOT NULL,
       PRIMARY KEY (global_snapshot_hash, stake_create_hash)
);
CREATE INDEX delegate_stake_rewards_changes_global_snapshot_hash_idx ON delegate_stake_position_changes USING btree (global_snapshot_hash);
CREATE INDEX delegate_stake_rewards_changes_address ON delegate_stake_position_changes USING btree (address);
CREATE INDEX delegate_stake_rewards_changes_node_id ON delegate_stake_position_changes USING btree (node_id);
ALTER TABLE delegate_stake_rewards ADD CONSTRAINT delegate_stake_rewards_changes_unique UNIQUE (global_snapshot_hash, address, node_id, rewards);
