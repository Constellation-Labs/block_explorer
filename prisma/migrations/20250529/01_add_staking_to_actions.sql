-- DAG Tables                                                                                            
CREATE OR REPLACE VIEW dag_actions_view AS
    SELECT 
        hash, source_addr, amount, created_at, updated_at, 'AllowSpend' as transaction_type, snapshot_hash,            
        destination_addr, last_valid_epoch_progress AS unlock_epoch, parent_hash, fee
    FROM dag_allow_spends
UNION ALL
    SELECT 
        hash, source_addr, amount, created_at, updated_at, 'SpendTransaction', snapshot_hash, 
        destination_addr, null, allow_spend_ref, null
    FROM dag_spend_transactions
UNION ALL
    SELECT 
        hash, source_addr, amount, created_at, updated_at, 'ExpiredSpendTransaction', snapshot_hash, 
        null, null, allow_spend_ref, null
    FROM dag_expired_spend_transactions
UNION ALL
    SELECT 
        hash, source_addr, amount, created_at, updated_at, 'TokenLock', snapshot_hash, 
        null, unlock_epoch, parent_hash, null
    FROM dag_token_locks
UNION ALL
        SELECT hash, source_addr, amount, created_at, updated_at, 'TokenUnlock', snapshot_hash, 
        null, null, lock_reference_hash, null
    FROM dag_token_unlocks
UNION ALL
    SELECT 
        hash, source_addr, amount, created_at, updated_at, 'DelegateStakeCreate', global_snapshot_hash,
        null, null, parent_hash, fee
    FROM delegate_stake_create_events
UNION ALL
    SELECT 
        dswe.hash, dswe.source_addr, dsce.amount, dswe.created_at, dswe.updated_at,  'DelegateStakeWithdraw', dswe.global_snapshot_hash, 
        null, dswe.unlock_epoch, dswe.stake_create_hash, null
    FROM delegate_stake_withdraw_events dswe
    LEFT JOIN delegate_stake_create_events dsce ON dswe.stake_create_hash = dsce.hash;
-- UNION ALL
    -- SELECT
    --     hash, source_addr, amount, created_at, updated_at, 'Transaction', snapshot_hash, 
    --     destination_addr, null, parent_hash, fee
    -- FROM dag_transactions


-- Metagraph Tables
CREATE OR REPLACE VIEW metagraph_actions_view AS
    SELECT hash, source_addr, amount, created_at, updated_at, 'AllowSpend' as transaction_type, snapshot_hash,
    destination_addr, last_valid_epoch_progress AS unlock_epoch, parent_hash, fee
    FROM metagraph_allow_spends
UNION ALL
    SELECT hash, source_addr, amount, created_at, updated_at, 'SpendTransaction', snapshot_hash, 
    destination_addr, null, allow_spend_ref, null
    FROM metagraph_spend_transactions
UNION ALL
    SELECT hash, source_addr, amount, created_at, updated_at, 'ExpiredSpendTransaction', snapshot_hash, 
    null, null, allow_spend_ref, null
    FROM metagraph_expired_spend_transactions
UNION ALL
    SELECT hash, source_addr, amount, created_at, updated_at, 'TokenLock' as transaction_type, snapshot_hash, 
    null, unlock_epoch, parent_hash, null
    FROM metagraph_token_locks
UNION ALL
    SELECT hash, source_addr, amount, created_at, updated_at, 'TokenUnlock', snapshot_hash, 
    null, null, lock_reference_hash, null
    FROM metagraph_token_unlocks
UNION ALL
    SELECT hash, source_addr, amount, created_at, updated_at, 'FeeTransaction', metagraph_snapshot_hash, 
    destination_addr, null, data_update_ref, null
    FROM metagraph_fee_transactions
-- UNION ALL
--     SELECT hash, source_addr, amount, created_at, updated_at, 'Transaction', snapshot_hash, 
--     destination_addr, null, parent_hash, fee
--     FROM metagraph_transactions;

