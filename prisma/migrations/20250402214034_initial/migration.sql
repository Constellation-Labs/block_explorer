-- DROP SCHEMA public;




-- DROP FUNCTION public.insert_into_parent_abstract_blocks();

CREATE OR REPLACE FUNCTION public.insert_into_parent_abstract_blocks()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO abstract_blocks (hash, height, created_at)
    VALUES (NEW.hash, NEW.height, NEW.created_at)
    ON CONFLICT (hash) DO NOTHING;
    RETURN NEW;
END;
$function$
;

-- DROP FUNCTION public.insert_into_parent_abstract_transactions();

CREATE OR REPLACE FUNCTION public.insert_into_parent_abstract_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO abstract_transactions (hash, source_addr, amount, created_at)
    VALUES (NEW.hash, NEW.source_addr, NEW.amount, NEW.created_at)
    ON CONFLICT (hash) DO NOTHING;

    RETURN NEW;
END;
$function$
;

-- DROP FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;


-- public.abstract_blocks definition

-- Drop table

-- DROP TABLE abstract_blocks;

CREATE TABLE abstract_blocks (
	hash varchar NOT NULL,
	height int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT block_pkey PRIMARY KEY (hash)
);


-- public.abstract_transactions definition

-- Drop table

-- DROP TABLE abstract_transactions;

CREATE TABLE abstract_transactions (
	hash varchar NOT NULL,
	source_addr varchar NOT NULL,
	amount int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT hash_pkey PRIMARY KEY (hash)
);


-- public.addresses definition

-- Drop table

-- DROP TABLE addresses;

CREATE TABLE addresses (
	address varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT address_pkey PRIMARY KEY (address)
);

-- Table Triggers

create trigger set_updated_at_addresses before
update
    on
    public.addresses for each row execute function update_updated_at_column();


-- public.global_snapshots definition

-- Drop table

-- DROP TABLE global_snapshots;

CREATE TABLE global_snapshots (
	hash varchar NOT NULL,
	ordinal int8 NOT NULL,
	height int8 NOT NULL,
	subheight int4 NOT NULL,
	last_snapshot_hash varchar NOT NULL,
	metagraph_snapshot_count int8 NULL,
	epoch_progress int8 NULL,
	"version" varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT global_snapshot_pk PRIMARY KEY (hash),
	CONSTRAINT global_snapshot_unique UNIQUE (ordinal)
);

-- Table Triggers

create trigger set_updated_at_global_snapshot before
update
    on
    public.global_snapshots for each row execute function update_updated_at_column();


-- public.metagraphs definition

-- Drop table

-- DROP TABLE metagraphs;

CREATE TABLE metagraphs (
	id varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT metagraph_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger set_updated_at_metagraphs before
update
    on
    public.metagraphs for each row execute function update_updated_at_column();


-- public.block_parents definition

-- Drop table

-- DROP TABLE block_parents;

CREATE TABLE block_parents (
	hash varchar NOT NULL,
	parent_proof_hash varchar NOT NULL,
	parent_height int8 NOT NULL,
	CONSTRAINT block_parents_pkey PRIMARY KEY (hash, parent_proof_hash),
	CONSTRAINT block_parents_block_fk FOREIGN KEY (hash) REFERENCES abstract_blocks(hash) ON DELETE CASCADE
);
CREATE INDEX block_parents_hash_idx ON public.block_parents USING btree (hash);

-- public.dag_allow_spends definition

-- Drop table

-- DROP TABLE dag_allow_spends;

CREATE TABLE dag_allow_spends (
	destination_addr varchar NOT NULL,
	fee int8 NOT NULL,
	parent_ordinal int8 NULL,
	parent_hash varchar NULL,
	last_valid_epoch_progress int8 NOT NULL,
	round_id uuid NOT NULL,
	ordinal int8 NOT NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT dag_allow_spends_ordinal UNIQUE (ordinal),
	CONSTRAINT dag_allow_spends_pk PRIMARY KEY (hash),
	CONSTRAINT dag_allow_spends_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT dag_allow_spends_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);
CREATE INDEX dag_allow_spends_round_id_idx ON public.dag_allow_spends USING btree (round_id);

-- Table Triggers

create trigger set_updated_at_dag_allow_spends before
update
    on
    public.dag_allow_spends for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_dag_allow_spends after
insert
    on
    public.dag_allow_spends for each row execute function insert_into_parent_abstract_transactions();


-- public.dag_balance_changes definition

-- Drop table

-- DROP TABLE dag_balance_changes;

CREATE TABLE dag_balance_changes (
	snapshot_hash varchar NOT NULL,
	address varchar NOT NULL,
	balance int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	snapshot_ordinal int8 NOT NULL,
	CONSTRAINT dag_balance_change_pk PRIMARY KEY (snapshot_ordinal, address),
	CONSTRAINT dag_balance_change_address_fk FOREIGN KEY (address) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT dag_balance_change_global_snapshot_fk FOREIGN KEY (snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE
);
CREATE INDEX dag_balance_changes_address_idx ON public.dag_balance_changes USING btree (address, created_at);

-- Table Triggers

create trigger set_updated_at_dag_balance_change before
update
    on
    public.dag_balance_changes for each row execute function update_updated_at_column();


-- public.dag_blocks definition

-- Drop table

-- DROP TABLE dag_blocks;

CREATE TABLE dag_blocks (
	snapshot_hash varchar NOT NULL,
	CONSTRAINT dag_block_pk PRIMARY KEY (hash),
	CONSTRAINT dag_block_global_snapshot_fk FOREIGN KEY (snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE
)
INHERITS (public.abstract_blocks);
CREATE INDEX dag_blocks_snapshot_hash_idx ON public.dag_blocks USING btree (snapshot_hash);

-- Table Triggers

create trigger set_updated_at_dag_blocks before
update
    on
    public.dag_blocks for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_blocks_dag after
insert
    on
    public.dag_blocks for each row execute function insert_into_parent_abstract_blocks();


-- public.dag_reward_transactions definition

-- Drop table

-- DROP TABLE dag_reward_transactions;

CREATE TABLE dag_reward_transactions (
	global_snapshot_hash varchar NOT NULL,
	destination_addr varchar NOT NULL,
	amount int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT dag_reward_transaction_pk PRIMARY KEY (global_snapshot_hash, destination_addr),
	CONSTRAINT dag_reward_transaction_global_snapshot_fk FOREIGN KEY (global_snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE,
	CONSTRAINT dag_reward_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE
);
CREATE INDEX dag_reward_transactions_global_snapshot_hash_idx ON public.dag_reward_transactions USING btree (global_snapshot_hash);

-- Table Triggers

create trigger set_updated_at_dag_reward_transaction before
update
    on
    public.dag_reward_transactions for each row execute function update_updated_at_column();


-- public.dag_spend_transactions definition

-- Drop table

-- DROP TABLE dag_spend_transactions;

CREATE TABLE dag_spend_transactions (
	destination_addr varchar NULL,
	allow_spend_ref varchar NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT dag_spend_transactions_pk PRIMARY KEY (hash),
	CONSTRAINT dag_spend_transactions_dag_allow_spends_fk FOREIGN KEY (allow_spend_ref) REFERENCES dag_allow_spends(hash) ON DELETE CASCADE,
	CONSTRAINT dag_spend_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

create trigger set_updated_at_dag_spend_transactions before
update
    on
    public.dag_spend_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_dag_spend_transactions after
insert
    on
    public.dag_spend_transactions for each row execute function insert_into_parent_abstract_transactions();


CREATE TABLE dag_expired_spend_transactions (
	allow_spend_ref varchar NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT dag_expired_spend_transactions_pk PRIMARY KEY (hash),
	CONSTRAINT dag_expired_spend_transactions_dag_allow_spends_fk FOREIGN KEY (allow_spend_ref) REFERENCES dag_allow_spends(hash) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_dag_expired_spend_transactions before
update
    on
    public.dag_expired_spend_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_dag_expired_spend_transact after
insert
    on
    public.dag_expired_spend_transactions for each row execute function insert_into_parent_abstract_transactions();



-- public.dag_token_lock_blocks definition

-- Drop table

-- DROP TABLE dag_token_lock_blocks;

CREATE TABLE dag_token_lock_blocks (
	round_id uuid NOT NULL,
	global_snapshot_hash varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT dag_token_lock_blocks_pkey PRIMARY KEY (round_id),
	CONSTRAINT dag_token_lock_blocks_unique UNIQUE (global_snapshot_hash),
	CONSTRAINT dag_token_lock_blocks_global_snapshot_fk FOREIGN KEY (global_snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE
);


-- public.dag_token_locks definition

-- Drop table

-- DROP TABLE dag_token_locks;

CREATE TABLE dag_token_locks (
	ordinal int8 NOT NULL,
	unlock_epoch int8 NULL,
	round_id uuid NOT NULL,
	parent_hash varchar NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT dag_token_locks_pk PRIMARY KEY (hash),
	CONSTRAINT dag_token_locks_unique UNIQUE (hash, ordinal),
	CONSTRAINT dag_token_locks_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_dag_token_locks before
update
    on
    public.dag_token_locks for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_dag_token_locks after
insert
    on
    public.dag_token_locks for each row execute function insert_into_parent_abstract_transactions();


-- public.dag_token_unlocks definition

-- Drop table

-- DROP TABLE dag_token_unlocks;

CREATE TABLE dag_token_unlocks (
	lock_reference_ordinal int8 NOT NULL,
	lock_reference_hash varchar NOT NULL,
	snapshot_hash varchar NOT NULL,
	parent_hash varchar NOT NULL,
	CONSTRAINT dag_token_unlocks_pk PRIMARY KEY (lock_reference_ordinal, lock_reference_hash),
	CONSTRAINT dag_token_unlocks_token_locks_fk FOREIGN KEY (lock_reference_hash,lock_reference_ordinal) REFERENCES dag_token_locks(hash,ordinal) ON DELETE CASCADE,
	CONSTRAINT ddag_token_unlocks_address_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_dag_token_unlocks before
update
    on
    public.dag_token_unlocks for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_dag_token_unlocks after
insert
    on
    public.dag_token_unlocks for each row execute function insert_into_parent_abstract_transactions();


-- public.dag_transactions definition

-- Drop table

-- DROP TABLE dag_transactions;

CREATE TABLE dag_transactions (
	destination_addr varchar NOT NULL,
	fee int8 NOT NULL,
	salt int8 NOT NULL,
	parent_ordinal int8 NULL,
	parent_hash varchar NULL,
	ordinal int8 NOT NULL,
	block_hash varchar NOT NULL,
	CONSTRAINT dag_transaction_pk PRIMARY KEY (hash),
	CONSTRAINT dag_transaction_dag_block_fk FOREIGN KEY (block_hash) REFERENCES dag_blocks(hash) ON DELETE CASCADE,
	CONSTRAINT dag_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT dag_transactions_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_dag_transaction before
update
    on
    public.dag_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_dag_transactions after
insert
    on
    public.dag_transactions for each row execute function insert_into_parent_abstract_transactions();


-- public.global_snapshot_proofs definition

-- Drop table

-- DROP TABLE global_snapshot_proofs;

CREATE TABLE global_snapshot_proofs (
	id varchar NOT NULL,
	signature varchar NOT NULL,
	snapshot_hash varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT proof_pk PRIMARY KEY (snapshot_hash, id),
	CONSTRAINT proof_global_snapshot_fk FOREIGN KEY (snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE
);

-- Table Triggers

create trigger set_updated_at_proof before
update
    on
    public.global_snapshot_proofs for each row execute function update_updated_at_column();


-- public.metagraph_snapshots definition

-- Drop table

-- DROP TABLE metagraph_snapshots;

CREATE TABLE metagraph_snapshots (
	metagraph_id varchar NOT NULL,
	ordinal int8 NOT NULL,
	global_snapshot_hash varchar NULL,
	hash varchar NOT NULL,
	height int8 NOT NULL,
	subheight int4 NOT NULL,
	last_snapshot_hash varchar NULL,
	fee int8 NULL,
	owner_address varchar NULL,
	staking_address varchar NULL,
	epoch_progress int8 NULL,
	"size" int8 NULL,
	"version" varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT metagraph_snapshot_pk PRIMARY KEY (metagraph_id, hash),
	CONSTRAINT metagraph_snapshot_unique UNIQUE (metagraph_id, ordinal),
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE,
	CONSTRAINT metagraph_snapshots_global_snapshots_fk FOREIGN KEY (global_snapshot_hash) REFERENCES global_snapshots(hash) ON DELETE CASCADE,
	CONSTRAINT owner_address_fk FOREIGN KEY (owner_address) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT staking_address_fk FOREIGN KEY (staking_address) REFERENCES addresses(address) ON DELETE CASCADE
);

-- Table Triggers

create trigger set_updated_at_metagraph_snapshot before
update
    on
    public.metagraph_snapshots for each row execute function update_updated_at_column();


-- public.metagraph_token_lock_blocks definition

-- Drop table

-- DROP TABLE metagraph_token_lock_blocks;

CREATE TABLE metagraph_token_lock_blocks (
	metagraph_id varchar NOT NULL,
	metagraph_snapshot_hash varchar NOT NULL,
	round_id uuid NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT metagraph_token_lock_blocks_pkey PRIMARY KEY (metagraph_id, metagraph_snapshot_hash),
	CONSTRAINT metagraph_token_lock_blocks_unique UNIQUE (metagraph_id, round_id),
	CONSTRAINT metagraph_token_lock_blocks_metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE,
	CONSTRAINT metagraph_token_lock_blocks_metagraph_snapshot_fk FOREIGN KEY (metagraph_id,metagraph_snapshot_hash) REFERENCES metagraph_snapshots(metagraph_id,hash) ON DELETE CASCADE
);

-- Table Triggers

create trigger set_updated_at_metagraph_token_lock_blocks before
update
    on
    public.metagraph_token_lock_blocks for each row execute function update_updated_at_column();


-- public.metagraph_token_locks definition

-- Drop table

-- DROP TABLE metagraph_token_locks;

CREATE TABLE metagraph_token_locks (
	metagraph_id varchar NOT NULL,
	ordinal int8 NOT NULL,
	unlock_epoch int8 NOT NULL,
	round_id varchar NOT NULL,
	parent_hash varchar NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT metagraph_token_locks_pk PRIMARY KEY (metagraph_id, hash),
	CONSTRAINT metagraph_token_locks_unique UNIQUE (metagraph_id, ordinal),
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE,
	CONSTRAINT metagraph_token_locks_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_token_locks before
update
    on
    public.metagraph_token_locks for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_token_locks after
insert
    on
    public.metagraph_token_locks for each row execute function insert_into_parent_abstract_transactions();


-- public.metagraph_token_unlocks definition

-- Drop table

-- DROP TABLE metagraph_token_unlocks;

CREATE TABLE metagraph_token_unlocks (
	metagraph_id varchar NOT NULL,
	lock_reference_ordinal int8 NOT NULL,
	lock_reference_hash varchar NOT NULL,
	snapshot_hash varchar NOT NULL,
	parent_hash varchar NOT NULL,
	CONSTRAINT metagraph_token_unlocks_pk PRIMARY KEY (lock_reference_ordinal, lock_reference_hash),
	CONSTRAINT address_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE,
	CONSTRAINT metagraph_token_unlocks_token_locks_fk FOREIGN KEY (metagraph_id,lock_reference_hash) REFERENCES metagraph_token_locks(metagraph_id,hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_token_unlocks_token_locks_ordinal_fk FOREIGN KEY (metagraph_id,lock_reference_ordinal) REFERENCES metagraph_token_locks(metagraph_id,ordinal) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_token_unlocks before
update
    on
    public.metagraph_token_unlocks for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_token_unlocks after
insert
    on
    public.metagraph_token_unlocks for each row execute function insert_into_parent_abstract_transactions();


-- public.dag_allow_spend_approvers definition

-- Drop table

-- DROP TABLE dag_allow_spend_approvers;

CREATE TABLE dag_allow_spend_approvers (
	allow_spend_hash varchar NOT NULL,
	approver_address varchar NOT NULL,
	CONSTRAINT dag_allow_spend_approvers_pk PRIMARY KEY (allow_spend_hash, approver_address),
	CONSTRAINT dag_allow_spend_approvers_address_fk FOREIGN KEY (approver_address) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT dag_allow_spends_fk FOREIGN KEY (allow_spend_hash) REFERENCES dag_allow_spends(hash) ON DELETE CASCADE
);


-- public.metagraph_allow_spend_blocks definition

-- Drop table

-- DROP TABLE metagraph_allow_spend_blocks;

CREATE TABLE metagraph_allow_spend_blocks (
	metagraph_id varchar NOT NULL,
	round_id uuid NOT NULL,
	metagraph_snapshot_hash varchar NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT metagraph_allow_spend_blocks_pkey PRIMARY KEY (round_id),
	CONSTRAINT metagraph_allow_spend_blocks_metagraph_snapshot_fk FOREIGN KEY (metagraph_id,metagraph_snapshot_hash) REFERENCES metagraph_snapshots(metagraph_id,hash) ON DELETE CASCADE
);

-- Table Triggers

create trigger set_updated_at_metagraph_allow_spend_blocks before
update
    on
    public.metagraph_allow_spend_blocks for each row execute function update_updated_at_column();


-- public.metagraph_allow_spends definition

-- Drop table

-- DROP TABLE metagraph_allow_spends;

CREATE TABLE metagraph_allow_spends (
	metagraph_id varchar NOT NULL,
	destination_addr varchar NOT NULL,
	fee int8 NOT NULL,
	parent_ordinal int8 NULL,
	parent_hash varchar NULL,
	last_valid_epoch_progress int8 NOT NULL,
	round_id uuid NOT NULL,
	ordinal int8 NOT NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT metagraph_allow_spends_ordinal UNIQUE (ordinal),
	CONSTRAINT metagraph_allow_spends_pk PRIMARY KEY (hash),
	CONSTRAINT allow_spends_block_fk FOREIGN KEY (round_id) REFERENCES metagraph_allow_spend_blocks(round_id) ON DELETE CASCADE,
	CONSTRAINT metagraph_allow_spends_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_allow_spends_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_allow_spends before
update
    on
    public.metagraph_allow_spends for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_allow_spends after
insert
    on
    public.metagraph_allow_spends for each row execute function insert_into_parent_abstract_transactions();


-- public.metagraph_balance_changes definition

-- Drop table

-- DROP TABLE metagraph_balance_changes;

CREATE TABLE metagraph_balance_changes (
	metagraph_id varchar NOT NULL,
	metagraph_snapshot_hash varchar NOT NULL,
	address varchar NOT NULL,
	balance int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	metagraph_snapshot_ordinal int8 NOT NULL,
	CONSTRAINT metagraph_balance_change_pk PRIMARY KEY (metagraph_id, address, metagraph_snapshot_ordinal),
	CONSTRAINT address_fk FOREIGN KEY (address) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_balance_change_metagraph_snapshot_fk FOREIGN KEY (metagraph_id,metagraph_snapshot_hash) REFERENCES metagraph_snapshots(metagraph_id,hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE
);

-- Table Triggers

create trigger set_updated_at_metagraph_balance_change before
update
    on
    public.metagraph_balance_changes for each row execute function update_updated_at_column();


-- public.metagraph_blocks definition

-- Drop table

-- DROP TABLE metagraph_blocks;

CREATE TABLE metagraph_blocks (
	metagraph_id varchar NOT NULL,
	metagraph_snapshot_hash varchar NOT NULL,
	CONSTRAINT metagraph_block_pk PRIMARY KEY (metagraph_id, hash),
	CONSTRAINT metagraph_block_metagraph_snapshot_fk FOREIGN KEY (metagraph_id,metagraph_snapshot_hash) REFERENCES metagraph_snapshots(metagraph_id,hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE
)
INHERITS (public.abstract_blocks);

-- Table Triggers

create trigger set_updated_at_metagraph_blocks before
update
    on
    public.metagraph_blocks for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_blocks_metagraph after
insert
    on
    public.metagraph_blocks for each row execute function insert_into_parent_abstract_blocks();


-- public.metagraph_fee_transactions definition

-- Drop table

-- DROP TABLE metagraph_fee_transactions;

CREATE TABLE metagraph_fee_transactions (
	created_at timestamp DEFAULT now() NOT NULL,
	metagraph_id varchar NOT NULL,
	metagraph_snapshot_hash varchar NOT NULL,
	destination_addr varchar NOT NULL,
	data_update_ref varchar NULL,
	metagraph_snapshot_ordinal int8 NULL,
	CONSTRAINT fee_transaction_pk PRIMARY KEY (metagraph_id, hash),
	CONSTRAINT fee_transaction_metagraph_snapshot_fk FOREIGN KEY (metagraph_id,metagraph_snapshot_hash) REFERENCES metagraph_snapshots(metagraph_id,hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_fee_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_fee_transactions_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_fee_transactions before
update
    on
    public.metagraph_fee_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_fee_transactions after
insert
    on
    public.metagraph_fee_transactions for each row execute function insert_into_parent_abstract_transactions();


-- public.metagraph_reward_transactions definition

-- Drop table

-- DROP TABLE metagraph_reward_transactions;

CREATE TABLE metagraph_reward_transactions (
	metagraph_id varchar NOT NULL,
	metagraph_snapshot_hash varchar NOT NULL,
	destination_addr varchar NOT NULL,
	amount int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT metagraph_reward_transaction_pk PRIMARY KEY (metagraph_id, metagraph_snapshot_hash, destination_addr),
	CONSTRAINT metagraph_reward_transaction_metagraph_reward_transaction_fk FOREIGN KEY (metagraph_id,metagraph_snapshot_hash) REFERENCES metagraph_snapshots(metagraph_id,hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_reward_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_reward_transactions_metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE
);

-- Table Triggers

create trigger set_updated_at_metagraph_reward_transaction before
update
    on
    public.metagraph_reward_transactions for each row execute function update_updated_at_column();


-- public.metagraph_spend_transactions definition

-- Drop table

-- DROP TABLE metagraph_spend_transactions;

CREATE TABLE metagraph_spend_transactions (
	metagraph_id varchar NOT NULL,
	destination_addr varchar NOT NULL,
	allow_spend_ref varchar NULL,
	snapshot_hash varchar NOT NULL,
	CONSTRAINT metagraph_spend_transactions_pk PRIMARY KEY (hash),
	CONSTRAINT metagraph_spend_transactions_metagraph_allow_spends_fk FOREIGN KEY (allow_spend_ref) REFERENCES metagraph_allow_spends(hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_spend_transactions_destination_addr_fk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_spend_transactions_metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_spend_transactions before
update
    on
    public.metagraph_spend_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_spend_transactio after
insert
    on
    public.metagraph_spend_transactions for each row execute function insert_into_parent_abstract_transactions();


CREATE TABLE metagraph_expired_spend_transactions (
	metagraph_id varchar NOT NULL,
	allow_spend_ref varchar NULL,
	snapshot_hash varchar NULL,
	CONSTRAINT metagraph_expired_spend_transactions_pk PRIMARY KEY (hash),
	CONSTRAINT metagraph_expired_spend_transactions_metagraph_allow_spends_fk FOREIGN KEY (allow_spend_ref) REFERENCES metagraph_allow_spends(hash) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_expired_spend_transactions before
update
    on
    public.metagraph_expired_spend_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_expired_spend_tr after
insert
    on
    public.metagraph_expired_spend_transactions for each row execute function insert_into_parent_abstract_transactions();

-- public.metagraph_transactions definition

-- Drop table

-- DROP TABLE metagraph_transactions;

CREATE TABLE metagraph_transactions (
	metagraph_id varchar NOT NULL,
	destination_addr varchar NOT NULL,
	fee int8 NOT NULL,
	salt int8 NOT NULL,
	parent_ordinal int8 NOT NULL,
	parent_hash varchar NOT NULL,
	ordinal int8 NOT NULL,
	block_hash varchar NOT NULL,
	CONSTRAINT metagraph_transaction_pk PRIMARY KEY (metagraph_id, hash),
	CONSTRAINT metagraph_id_fk FOREIGN KEY (metagraph_id) REFERENCES metagraphs(id) ON DELETE CASCADE,
	CONSTRAINT metagraph_transaction_metagraph_block_fk FOREIGN KEY (metagraph_id,block_hash) REFERENCES metagraph_blocks(metagraph_id,hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_transactions_destination_addrfk FOREIGN KEY (destination_addr) REFERENCES addresses(address) ON DELETE CASCADE,
	CONSTRAINT metagraph_transactions_source_addr_fk FOREIGN KEY (source_addr) REFERENCES addresses(address) ON DELETE CASCADE
)
INHERITS (public.abstract_transactions);

-- Table Triggers

create trigger set_updated_at_metagraph_transaction before
update
    on
    public.metagraph_transactions for each row execute function update_updated_at_column();
create trigger trigger_insert_abstract_transactions_metagraph_transactions after
insert
    on
    public.metagraph_transactions for each row execute function insert_into_parent_abstract_transactions();


-- public.metagraph_allow_spend_approvers definition

-- Drop table

-- DROP TABLE metagraph_allow_spend_approvers;

CREATE TABLE metagraph_allow_spend_approvers (
	allow_spend_hash varchar NOT NULL,
	approver_address varchar NOT NULL,
	CONSTRAINT metagraph_allow_spend_approvers_pk PRIMARY KEY (allow_spend_hash, approver_address),
	CONSTRAINT ametagraph_allow_spends_fk FOREIGN KEY (allow_spend_hash) REFERENCES metagraph_allow_spends(hash) ON DELETE CASCADE,
	CONSTRAINT metagraph_allow_spend_approvers_address_fk FOREIGN KEY (approver_address) REFERENCES addresses(address) ON DELETE CASCADE
);


-- public.abstract_transactions_view source

CREATE OR REPLACE VIEW abstract_transactions_view
AS SELECT tx.hash,
    tx.source_addr,
    tx.amount,
    tx.created_at,
    tx.updated_at,
    p.relname AS table_name
   FROM abstract_transactions tx
     JOIN pg_class p ON tx.tableoid = p.oid
  WHERE p.relname <> 'abstract_transactions'::name;

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
    is_update boolean NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX delegate_stake_create_events_source_addr_idx ON public.delegate_stake_create_events USING btree (source_addr);
CREATE INDEX delegate_stake_create_events_lock_reference_hash_idx ON public.delegate_stake_create_events USING btree (lock_reference_hash);
CREATE INDEX delegate_stake_create_events_global_snapshot_hash_idx ON public.delegate_stake_create_events USING btree (global_snapshot_hash);



CREATE TABLE delegate_stake_withdraw_events (
    hash varchar PRIMARY KEY,
    source_addr varchar NOT NULL REFERENCES addresses(address) ON DELETE CASCADE,
    stake_create_hash varchar NOT NULL REFERENCES delegate_stake_create_events(hash) ON DELETE CASCADE,
    global_snapshot_hash varchar NOT NULL REFERENCES global_snapshots(hash) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX delegate_stake_withdraw_events_source_addr_idx ON public.delegate_stake_withdraw_events USING btree (source_addr);
CREATE INDEX delegate_stake_withdraw_events_stake_create_hash_idx ON public.delegate_stake_withdraw_events USING btree (stake_create_hash);
CREATE INDEX delegate_stake_withdraw_events_global_snapshot_hash_idx ON public.delegate_stake_withdraw_events USING btree (global_snapshot_hash);


CREATE TABLE delegate_stake_balance_changes (
	global_snapshot_hash varchar NOT NULL REFERENCES global_snapshots(hash) ON DELETE CASCADE,
	global_snapshot_ordinal int8 NOT NULL REFERENCES global_snapshots(ordinal) ON DELETE CASCADE,
	address varchar NOT NULL REFERENCES addresses(address) ON DELETE CASCADE,
	node_id varchar NOT NULL,
	balance int8 NOT NULL,
	rewards int8 NOT NULL,
	stake_create_hash varchar NULL REFERENCES delegate_stake_create_events(hash) ON DELETE CASCADE,
	stake_withdraw_hash varchar NULL REFERENCES delegate_stake_withdraw_events(hash) ON DELETE CASCADE,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX delegate_stake_balance_changes_global_snapshot_hash_idx ON public.delegate_stake_balance_changes USING btree (global_snapshot_hash);
CREATE INDEX delegate_stake_balance_changes_global_snapshot_ordinal_idx ON public.delegate_stake_balance_changes USING btree (global_snapshot_ordinal);
CREATE INDEX delegate_stake_balance_changes_address ON public.delegate_stake_balance_changes USING btree (address);
CREATE INDEX delegate_stake_balance_changes_node_id ON public.delegate_stake_balance_changes USING btree (node_id);
ALTER TABLE public.delegate_stake_balance_changes ADD CONSTRAINT delegate_stake_balance_changes_unique UNIQUE (global_snapshot_hash, address, node_id, balance, rewards);


CREATE TABLE delegate_stake_rewards (
	global_snapshot_hash varchar NOT NULL REFERENCES global_snapshots(hash) ON DELETE CASCADE,
	address varchar NOT NULL REFERENCES addresses(address) ON DELETE CASCADE,
	node_id varchar NOT NULL,
	rewards int8 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX delegate_stake_rewards_changes_global_snapshot_hash_idx ON public.delegate_stake_balance_changes USING btree (global_snapshot_hash);
CREATE INDEX delegate_stake_rewards_changes_address ON public.delegate_stake_balance_changes USING btree (address);
CREATE INDEX delegate_stake_rewards_changes_node_id ON public.delegate_stake_balance_changes USING btree (node_id);
ALTER TABLE public.delegate_stake_rewards ADD CONSTRAINT delegate_stake_rewards_changes_unique UNIQUE (global_snapshot_hash, address, node_id, rewards);
