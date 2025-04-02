-- CreateTable
CREATE TABLE "abstract_blocks" (
    "hash" VARCHAR NOT NULL,
    "height" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "abstract_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hash_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "abstract_transactions_view" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "table_name" TEXT NOT NULL,

    CONSTRAINT "abstract_transactions_view_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "addresses" (
    "address" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "address_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "block_parents" (
    "hash" VARCHAR NOT NULL,
    "parent_proof_hash" VARCHAR NOT NULL,
    "parent_height" BIGINT NOT NULL,

    CONSTRAINT "block_parents_pkey" PRIMARY KEY ("hash","parent_proof_hash")
);

-- CreateTable
CREATE TABLE "dag_allow_spend_approvers" (
    "allow_spend_hash" VARCHAR NOT NULL,
    "approver_address" VARCHAR NOT NULL,

    CONSTRAINT "dag_allow_spend_approvers_pk" PRIMARY KEY ("allow_spend_hash","approver_address")
);

-- CreateTable
CREATE TABLE "dag_allow_spend_blocks" (
    "round_id" UUID NOT NULL,
    "global_snapshot_hash" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dag_allow_spend_blocks_pkey" PRIMARY KEY ("global_snapshot_hash")
);

-- CreateTable
CREATE TABLE "dag_allow_spends" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination_addr" VARCHAR NOT NULL,
    "fee" BIGINT NOT NULL,
    "parent_ordinal" BIGINT,
    "parent_hash" VARCHAR,
    "last_valid_epoch_progress" BIGINT NOT NULL,
    "round_id" UUID NOT NULL,
    "ordinal" BIGINT NOT NULL,
    "snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "dag_allow_spends_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "dag_balance_changes" (
    "snapshot_hash" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "balance" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot_ordinal" BIGINT NOT NULL,

    CONSTRAINT "dag_balance_change_pk" PRIMARY KEY ("snapshot_ordinal","address")
);

-- CreateTable
CREATE TABLE "dag_blocks" (
    "hash" VARCHAR NOT NULL,
    "height" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "dag_block_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "dag_reward_transactions" (
    "global_snapshot_hash" VARCHAR NOT NULL,
    "destination_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dag_reward_transaction_pk" PRIMARY KEY ("global_snapshot_hash","destination_addr")
);

-- CreateTable
CREATE TABLE "dag_spend_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination_addr" VARCHAR,
    "allow_spend_ref" VARCHAR,
    "snapshot_hash" VARCHAR,

    CONSTRAINT "dag_spend_transactions_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "dag_token_lock_blocks" (
    "round_id" UUID NOT NULL,
    "global_snapshot_hash" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dag_token_lock_blocks_pkey" PRIMARY KEY ("round_id")
);

-- CreateTable
CREATE TABLE "dag_token_locks" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordinal" BIGINT NOT NULL,
    "unlock_epoch" BIGINT,
    "round_id" UUID NOT NULL,
    "global_snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "dag_token_locks_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "dag_token_unlocks" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lock_reference_hash" VARCHAR NOT NULL,
    "snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "dag_token_unlocks_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "dag_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination_addr" VARCHAR NOT NULL,
    "fee" BIGINT NOT NULL,
    "salt" BIGINT NOT NULL,
    "parent_ordinal" BIGINT,
    "parent_hash" VARCHAR,
    "ordinal" BIGINT NOT NULL,
    "block_hash" VARCHAR NOT NULL,

    CONSTRAINT "dag_transaction_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "global_snapshot_proofs" (
    "id" VARCHAR NOT NULL,
    "signature" VARCHAR NOT NULL,
    "snapshot_hash" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_pk" PRIMARY KEY ("snapshot_hash","id")
);

-- CreateTable
CREATE TABLE "global_snapshots" (
    "hash" VARCHAR NOT NULL,
    "ordinal" BIGINT NOT NULL,
    "height" BIGINT NOT NULL,
    "subheight" INTEGER NOT NULL,
    "last_snapshot_hash" VARCHAR NOT NULL,
    "metagraph_snapshot_count" BIGINT,
    "epoch_progress" BIGINT,
    "version" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_snapshot_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_allow_spend_approvers" (
    "allow_spend_hash" VARCHAR NOT NULL,
    "approver_address" VARCHAR NOT NULL,

    CONSTRAINT "metagraph_allow_spend_approvers_pk" PRIMARY KEY ("allow_spend_hash","approver_address")
);

-- CreateTable
CREATE TABLE "metagraph_allow_spend_blocks" (
    "metagraph_id" VARCHAR NOT NULL,
    "round_id" UUID NOT NULL,
    "metagraph_snapshot_hash" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metagraph_allow_spend_blocks_pkey" PRIMARY KEY ("round_id")
);

-- CreateTable
CREATE TABLE "metagraph_allow_spends" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "destination_addr" VARCHAR NOT NULL,
    "fee" BIGINT NOT NULL,
    "parent_ordinal" BIGINT,
    "parent_hash" VARCHAR,
    "last_valid_epoch_progress" BIGINT NOT NULL,
    "round_id" UUID NOT NULL,
    "ordinal" BIGINT NOT NULL,
    "snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "metagraph_allow_spends_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_balance_changes" (
    "metagraph_id" VARCHAR NOT NULL,
    "metagraph_snapshot_hash" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "balance" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_snapshot_ordinal" BIGINT NOT NULL,

    CONSTRAINT "metagraph_balance_change_pk" PRIMARY KEY ("metagraph_id","address","metagraph_snapshot_ordinal")
);

-- CreateTable
CREATE TABLE "metagraph_blocks" (
    "hash" VARCHAR NOT NULL,
    "height" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "metagraph_snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "metagraph_block_pk" PRIMARY KEY ("metagraph_id","hash")
);

-- CreateTable
CREATE TABLE "metagraph_fee_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "metagraph_snapshot_hash" VARCHAR NOT NULL,
    "destination_addr" VARCHAR NOT NULL,
    "data_update_ref" VARCHAR,
    "metagraph_snapshot_ordinal" BIGINT,

    CONSTRAINT "fee_transaction_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_reward_transactions" (
    "metagraph_id" VARCHAR NOT NULL,
    "metagraph_snapshot_hash" VARCHAR NOT NULL,
    "destination_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metagraph_reward_transaction_pk" PRIMARY KEY ("metagraph_id","metagraph_snapshot_hash","destination_addr")
);

-- CreateTable
CREATE TABLE "metagraph_snapshots" (
    "metagraph_id" VARCHAR NOT NULL,
    "ordinal" BIGINT NOT NULL,
    "global_snapshot_hash" VARCHAR,
    "hash" VARCHAR NOT NULL,
    "height" BIGINT NOT NULL,
    "subheight" INTEGER NOT NULL,
    "last_snapshot_hash" VARCHAR,
    "fee" BIGINT,
    "owner_address" VARCHAR,
    "staking_address" VARCHAR,
    "epoch_progress" BIGINT,
    "version" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metagraph_snapshot_pk" PRIMARY KEY ("metagraph_id","hash")
);

-- CreateTable
CREATE TABLE "metagraph_spend_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "destination_addr" VARCHAR NOT NULL,
    "allow_spend_ref" VARCHAR,
    "snapshot_hash" VARCHAR,

    CONSTRAINT "metagraph_spend_transactions_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_token_lock_blocks" (
    "metagraph_id" VARCHAR NOT NULL,
    "metagraph_snapshot_hash" VARCHAR NOT NULL,
    "round_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metagraph_token_lock_blocks_pkey" PRIMARY KEY ("metagraph_id","metagraph_snapshot_hash")
);

-- CreateTable
CREATE TABLE "metagraph_token_locks" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "ordinal" BIGINT NOT NULL,
    "unlock_epoch" BIGINT,
    "round_id" UUID NOT NULL,
    "snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "metagraph_token_locks_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_token_unlocks" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "lock_reference_ordinal" BIGINT NOT NULL,
    "lock_reference_hash" VARCHAR NOT NULL,
    "snapshot_hash" VARCHAR NOT NULL,

    CONSTRAINT "metagraph_token_unlocks_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "destination_addr" VARCHAR NOT NULL,
    "fee" BIGINT NOT NULL,
    "salt" BIGINT NOT NULL,
    "parent_ordinal" BIGINT NOT NULL,
    "parent_hash" VARCHAR NOT NULL,
    "ordinal" BIGINT NOT NULL,
    "block_hash" VARCHAR NOT NULL,

    CONSTRAINT "metagraph_transaction_pk" PRIMARY KEY ("metagraph_id","hash")
);

-- CreateTable
CREATE TABLE "metagraphs" (
    "id" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metagraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_expired_spend_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allow_spend_ref" VARCHAR,
    "snapshot_hash" VARCHAR,

    CONSTRAINT "dag_expired_spend_transactions_pk" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "metagraph_expired_spend_transactions" (
    "hash" VARCHAR NOT NULL,
    "source_addr" VARCHAR NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metagraph_id" VARCHAR NOT NULL,
    "allow_spend_ref" VARCHAR,
    "snapshot_hash" VARCHAR,

    CONSTRAINT "metagraph_expired_spend_transactions_pk" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE INDEX "block_parents_hash_idx" ON "block_parents"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "dag_allow_spend_blocks_unique" ON "dag_allow_spend_blocks"("round_id");

-- CreateIndex
CREATE UNIQUE INDEX "dag_allow_spends_ordinal" ON "dag_allow_spends"("ordinal");

-- CreateIndex
CREATE INDEX "dag_allow_spends_round_id_idx" ON "dag_allow_spends"("round_id");

-- CreateIndex
CREATE INDEX "dag_balance_changes_address_idx" ON "dag_balance_changes"("address", "created_at");

-- CreateIndex
CREATE INDEX "dag_blocks_snapshot_hash_idx" ON "dag_blocks"("snapshot_hash");

-- CreateIndex
CREATE INDEX "dag_reward_transactions_global_snapshot_hash_idx" ON "dag_reward_transactions"("global_snapshot_hash");

-- CreateIndex
CREATE UNIQUE INDEX "dag_token_lock_blocks_unique" ON "dag_token_lock_blocks"("global_snapshot_hash");

-- CreateIndex
CREATE UNIQUE INDEX "dag_token_locks_unique" ON "dag_token_locks"("ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "dag_token_unlocks_lock_reference_hash_key" ON "dag_token_unlocks"("lock_reference_hash");

-- CreateIndex
CREATE UNIQUE INDEX "global_snapshot_unique" ON "global_snapshots"("ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "metagraph_allow_spends_ordinal" ON "metagraph_allow_spends"("ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "hash" ON "metagraph_blocks"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "metagraph_snapshot_unique" ON "metagraph_snapshots"("metagraph_id", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "metagraph_token_lock_blocks_unique" ON "metagraph_token_lock_blocks"("metagraph_id", "round_id");

-- CreateIndex
CREATE UNIQUE INDEX "metagraph_token_locks_unique" ON "metagraph_token_locks"("metagraph_id", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "metagraph_token_unlocks_lock_reference_hash_key" ON "metagraph_token_unlocks"("lock_reference_hash");

-- CreateIndex
CREATE UNIQUE INDEX "metagraph_token_unlocks_lock_reference_ordinal_key" ON "metagraph_token_unlocks"("lock_reference_ordinal");

-- AddForeignKey
ALTER TABLE "abstract_blocks" ADD CONSTRAINT "dag_blocks_hash_fk" FOREIGN KEY ("hash") REFERENCES "dag_blocks"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_blocks" ADD CONSTRAINT "metagraph_blocks_hash_fk" FOREIGN KEY ("hash") REFERENCES "metagraph_blocks"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "dag_token_locks_ref" FOREIGN KEY ("hash") REFERENCES "dag_token_locks"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "metagraph_token_locks_ref" FOREIGN KEY ("hash") REFERENCES "metagraph_token_locks"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "dag_token_unlocks_ref" FOREIGN KEY ("hash") REFERENCES "dag_token_unlocks"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "metagraph_token_unlocks_ref" FOREIGN KEY ("hash") REFERENCES "metagraph_token_unlocks"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "dag_allow_spend_ref" FOREIGN KEY ("hash") REFERENCES "dag_allow_spends"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "metagraph_allow_spend_ref" FOREIGN KEY ("hash") REFERENCES "metagraph_allow_spends"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "dag_spend_transaction_ref" FOREIGN KEY ("hash") REFERENCES "dag_spend_transactions"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "metagraph_spend_transaction_ref" FOREIGN KEY ("hash") REFERENCES "metagraph_spend_transactions"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "dag_expired_spend_transaction_ref" FOREIGN KEY ("hash") REFERENCES "dag_expired_spend_transactions"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "metagraph_expired_spend_transaction_ref" FOREIGN KEY ("hash") REFERENCES "metagraph_expired_spend_transactions"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abstract_transactions_view" ADD CONSTRAINT "metagraph_fee_transaction_ref" FOREIGN KEY ("hash") REFERENCES "metagraph_fee_transactions"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_parents" ADD CONSTRAINT "block_parents_block_fk" FOREIGN KEY ("hash") REFERENCES "abstract_blocks"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_allow_spend_approvers" ADD CONSTRAINT "dag_allow_spend_approvers_address_fk" FOREIGN KEY ("approver_address") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_allow_spend_approvers" ADD CONSTRAINT "dag_allow_spends_fk" FOREIGN KEY ("allow_spend_hash") REFERENCES "dag_allow_spends"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_allow_spend_blocks" ADD CONSTRAINT "dag_allow_spend_blocks_global_snapshot_fk" FOREIGN KEY ("global_snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_allow_spends" ADD CONSTRAINT "dag_allow_spends_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_allow_spends" ADD CONSTRAINT "dag_allow_spends_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_allow_spends" ADD CONSTRAINT "dag_allow_spend_blocks_global_snapshot_fk" FOREIGN KEY ("snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_balance_changes" ADD CONSTRAINT "dag_balance_change_address_fk" FOREIGN KEY ("address") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_balance_changes" ADD CONSTRAINT "dag_balance_change_global_snapshot_fk" FOREIGN KEY ("snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_blocks" ADD CONSTRAINT "dag_block_global_snapshot_fk" FOREIGN KEY ("snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_reward_transactions" ADD CONSTRAINT "dag_reward_transaction_global_snapshot_fk" FOREIGN KEY ("global_snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_reward_transactions" ADD CONSTRAINT "dag_reward_transactions_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_spend_transactions" ADD CONSTRAINT "dag_spend_transactions_dag_allow_spends_fk" FOREIGN KEY ("allow_spend_ref") REFERENCES "dag_allow_spends"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_spend_transactions" ADD CONSTRAINT "dag_spend_transactions_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_token_lock_blocks" ADD CONSTRAINT "dag_token_lock_blocks_global_snapshot_fk" FOREIGN KEY ("global_snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_token_locks" ADD CONSTRAINT "dag_token_locks_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_token_locks" ADD CONSTRAINT "dag_token_locks_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "dag_token_lock_blocks"("round_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_token_locks" ADD CONSTRAINT "dag_token_lock_global_snapshot_fk" FOREIGN KEY ("global_snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_token_unlocks" ADD CONSTRAINT "dag_token_unlocks_token_locks_fk" FOREIGN KEY ("lock_reference_hash") REFERENCES "dag_token_locks"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_token_unlocks" ADD CONSTRAINT "ddag_token_unlocks_address_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_token_unlocks" ADD CONSTRAINT "dag_token_unlock_global_snapshot_fk" FOREIGN KEY ("snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_transactions" ADD CONSTRAINT "dag_transaction_dag_block_fk" FOREIGN KEY ("block_hash") REFERENCES "dag_blocks"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_transactions" ADD CONSTRAINT "dag_transactions_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_transactions" ADD CONSTRAINT "dag_transactions_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "global_snapshot_proofs" ADD CONSTRAINT "proof_global_snapshot_fk" FOREIGN KEY ("snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spend_approvers" ADD CONSTRAINT "ametagraph_llow_spends_fk" FOREIGN KEY ("allow_spend_hash") REFERENCES "metagraph_allow_spends"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spend_approvers" ADD CONSTRAINT "metagraph_allow_spend_approvers_address_fk" FOREIGN KEY ("approver_address") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spend_blocks" ADD CONSTRAINT "metagraph_allow_spend_blocks_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "metagraph_snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spends" ADD CONSTRAINT "allow_spends_block_fk" FOREIGN KEY ("round_id") REFERENCES "metagraph_allow_spend_blocks"("round_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spends" ADD CONSTRAINT "metagraph_allow_spends_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spends" ADD CONSTRAINT "metagraph_allow_spends_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spends" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_allow_spends" ADD CONSTRAINT "metagraph_allow_spend_blocks_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_balance_changes" ADD CONSTRAINT "address_fk" FOREIGN KEY ("address") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_balance_changes" ADD CONSTRAINT "metagraph_balance_change_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "metagraph_snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_balance_changes" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_blocks" ADD CONSTRAINT "metagraph_block_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "metagraph_snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_blocks" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_fee_transactions" ADD CONSTRAINT "fee_transaction_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "metagraph_snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_fee_transactions" ADD CONSTRAINT "metagraph_fee_transactions_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_fee_transactions" ADD CONSTRAINT "metagraph_fee_transactions_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_fee_transactions" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_reward_transactions" ADD CONSTRAINT "metagraph_reward_transaction_metagraph_reward_transaction_fk" FOREIGN KEY ("metagraph_id", "metagraph_snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_reward_transactions" ADD CONSTRAINT "metagraph_reward_transactions_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_reward_transactions" ADD CONSTRAINT "metagraph_reward_transactions_metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_snapshots" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_snapshots" ADD CONSTRAINT "metagraph_snapshots_global_snapshots_fk" FOREIGN KEY ("global_snapshot_hash") REFERENCES "global_snapshots"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_snapshots" ADD CONSTRAINT "owner_address_fk" FOREIGN KEY ("owner_address") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_snapshots" ADD CONSTRAINT "staking_address_fk" FOREIGN KEY ("staking_address") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_spend_transactions" ADD CONSTRAINT "mg_spend_transactions_mg_allow_spends_fk" FOREIGN KEY ("allow_spend_ref") REFERENCES "metagraph_allow_spends"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_spend_transactions" ADD CONSTRAINT "metagraph_spend_transactions_destination_addr_fk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_spend_transactions" ADD CONSTRAINT "metagraph_spend_transactions_metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_lock_blocks" ADD CONSTRAINT "metagraph_token_lock_blocks_metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_lock_blocks" ADD CONSTRAINT "metagraph_token_lock_blocks_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "metagraph_snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_locks" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_locks" ADD CONSTRAINT "metagraph_token_locks_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_locks" ADD CONSTRAINT "metagraph_lock_blocks_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_unlocks" ADD CONSTRAINT "address_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_unlocks" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_unlocks" ADD CONSTRAINT "metagraph_token_unlocks_token_locks_fk" FOREIGN KEY ("lock_reference_hash") REFERENCES "metagraph_token_locks"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_token_unlocks" ADD CONSTRAINT "metagraph_unlock_blocks_metagraph_snapshot_fk" FOREIGN KEY ("metagraph_id", "snapshot_hash") REFERENCES "metagraph_snapshots"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_transactions" ADD CONSTRAINT "metagraph_id_fk" FOREIGN KEY ("metagraph_id") REFERENCES "metagraphs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_transactions" ADD CONSTRAINT "metagraph_transaction_metagraph_block_fk" FOREIGN KEY ("metagraph_id", "block_hash") REFERENCES "metagraph_blocks"("metagraph_id", "hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_transactions" ADD CONSTRAINT "metagraph_transactions_destination_addrfk" FOREIGN KEY ("destination_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_transactions" ADD CONSTRAINT "metagraph_transactions_source_addr_fk" FOREIGN KEY ("source_addr") REFERENCES "addresses"("address") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dag_expired_spend_transactions" ADD CONSTRAINT "dag_expired_spend_transactions_dag_allow_spends_fk" FOREIGN KEY ("allow_spend_ref") REFERENCES "dag_allow_spends"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metagraph_expired_spend_transactions" ADD CONSTRAINT "metagraph_expired_spend_transactions_metagraph_allow_spends_fk" FOREIGN KEY ("allow_spend_ref") REFERENCES "metagraph_allow_spends"("hash") ON DELETE CASCADE ON UPDATE NO ACTION;
