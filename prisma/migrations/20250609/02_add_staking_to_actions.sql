-- DAG Tables                                                                                            
CREATE OR REPLACE VIEW dag_actions_view AS
    SELECT 
        das.hash, source_addr, amount, das.created_at, das.updated_at,
        'AllowSpend' as transaction_type, snapshot_hash as global_snapshot_hash, gs.ordinal as global_snapshot_ordinal,
        destination_addr, last_valid_epoch_progress AS unlock_epoch, parent_hash, fee, currency_id
    FROM dag_allow_spends das
    JOIN global_snapshots gs ON das.snapshot_hash = gs.hash

UNION ALL
    SELECT 
        dst.hash, dst.source_addr, dst.amount, dst.created_at, dst.updated_at,
        'SpendTransaction', dst.snapshot_hash, gs.ordinal,
        dst.destination_addr, null, dst.allow_spend_ref, null, currency_id
    FROM dag_spend_transactions dst
    JOIN global_snapshots gs ON dst.snapshot_hash = gs.hash

UNION ALL
    SELECT 
        dest.hash, dest.source_addr, dest.amount, dest.created_at, dest.updated_at,
        'ExpiredAllowSpend', dest.snapshot_hash, gs.ordinal,
        null, null, dest.allow_spend_ref, null, currency_id
    FROM dag_expired_spend_transactions dest
    JOIN global_snapshots gs ON dest.snapshot_hash = gs.hash

UNION ALL
    SELECT 
        dtl.hash, dtl.source_addr, dtl.amount, dtl.created_at, dtl.updated_at,
        'TokenLock', dtl.snapshot_hash, gs.ordinal,
        null, dtl.unlock_epoch, dtl.parent_hash, null, currency_id
    FROM dag_token_locks dtl
    JOIN global_snapshots gs ON dtl.snapshot_hash = gs.hash

UNION ALL
    SELECT
        dtu.hash, dtu.source_addr, dtu.amount, dtu.created_at, dtu.updated_at,
        'TokenUnlock', dtu.snapshot_hash, gs.ordinal,
        null, null, dtu.lock_reference_hash, null, currency_id
    FROM dag_token_unlocks dtu
    JOIN global_snapshots gs ON dtu.snapshot_hash = gs.hash

UNION ALL
    SELECT 
        dsce.hash, dsce.source_addr, dsce.amount, dsce.created_at, dsce.updated_at,
        'DelegateStakeCreate', dsce.global_snapshot_hash, gs.ordinal,
        null, null, dsce.parent_hash, dsce.fee, null
    FROM delegate_stake_create_events dsce
    JOIN global_snapshots gs ON dsce.global_snapshot_hash = gs.hash

UNION ALL
    SELECT 
        dswe.hash, dswe.source_addr, dsce.amount, dswe.created_at, dswe.updated_at,
        'DelegateStakeWithdraw', dswe.global_snapshot_hash, gs.ordinal,
        null, dswe.unlock_epoch, dswe.stake_create_hash, null, null
    FROM delegate_stake_withdraw_events dswe
    LEFT JOIN delegate_stake_create_events dsce ON dswe.stake_create_hash = dsce.hash
    JOIN global_snapshots gs ON dswe.global_snapshot_hash = gs.hash;


-- Metagraph Tables
CREATE OR REPLACE VIEW metagraph_actions_view AS
SELECT
    mas.metagraph_id, mas.hash, mas.source_addr, mas.amount, mas.created_at, mas.updated_at,
    'AllowSpend' AS transaction_type, mas.snapshot_hash as metagraph_snapshot_hash, ms.ordinal  as metagraph_snapshot_ordinal,
    mas.destination_addr, mas.last_valid_epoch_progress AS unlock_epoch,
    mas.parent_hash, mas.fee, currency_id,
    gs.hash AS global_snapshot_hash, gs.ordinal AS global_snapshot_ordinal
FROM metagraph_allow_spends mas
JOIN metagraph_snapshots ms
    ON mas.metagraph_id = ms.metagraph_id AND mas.snapshot_hash = ms.hash
JOIN global_snapshots gs
    ON ms.global_snapshot_hash = gs.hash
UNION ALL
SELECT
    mst.metagraph_id, mst.hash, mst.source_addr, mst.amount, mst.created_at, mst.updated_at,
    'SpendTransaction', mst.snapshot_hash as metagraph_snapshot_hash, ms.ordinal  as metagraph_snapshot_ordinal,
    mst.destination_addr, NULL, mst.allow_spend_ref, NULL, currency_id,
    gs.hash AS global_snapshot_hash, gs.ordinal AS global_snapshot_ordinal
FROM metagraph_spend_transactions mst
JOIN metagraph_snapshots ms
    ON mst.metagraph_id = ms.metagraph_id AND mst.snapshot_hash = ms.hash
JOIN global_snapshots gs
    ON ms.global_snapshot_hash = gs.hash
UNION ALL
SELECT
    mest.metagraph_id, mest.hash, mest.source_addr, mest.amount, mest.created_at, mest.updated_at,
    'ExpiredAllowSpend', mest.snapshot_hash as metagraph_snapshot_hash, ms.ordinal  as metagraph_snapshot_ordinal,
    NULL, NULL, mest.allow_spend_ref, NULL, currency_id,
    gs.hash AS global_snapshot_hash, gs.ordinal AS global_snapshot_ordinal
FROM metagraph_expired_spend_transactions mest
JOIN metagraph_snapshots ms
    ON mest.metagraph_id = ms.metagraph_id AND mest.snapshot_hash = ms.hash
JOIN global_snapshots gs
    ON ms.global_snapshot_hash = gs.hash
UNION ALL
SELECT
    mtl.metagraph_id, mtl.hash, mtl.source_addr, mtl.amount, mtl.created_at, mtl.updated_at,
    'TokenLock', mtl.snapshot_hash as metagraph_snapshot_hash, ms.ordinal  as metagraph_snapshot_ordinal,
    NULL, mtl.unlock_epoch, mtl.parent_hash, NULL, currency_id,
    gs.hash AS global_snapshot_hash, gs.ordinal AS global_snapshot_ordinal
FROM metagraph_token_locks mtl
JOIN metagraph_snapshots ms
    ON mtl.metagraph_id = ms.metagraph_id AND mtl.snapshot_hash = ms.hash
JOIN global_snapshots gs
    ON ms.global_snapshot_hash = gs.hash
UNION ALL
SELECT
    mtu.metagraph_id, mtu.hash, mtu.source_addr, mtu.amount, mtu.created_at, mtu.updated_at,
    'TokenUnlock', mtu.snapshot_hash as metagraph_snapshot_hash, ms.ordinal  as metagraph_snapshot_ordinal,
    NULL, NULL, mtu.lock_reference_hash, NULL, currency_id,
    gs.hash AS global_snapshot_hash, gs.ordinal AS global_snapshot_ordinal
FROM metagraph_token_unlocks mtu
JOIN metagraph_snapshots ms
    ON mtu.metagraph_id = ms.metagraph_id AND mtu.snapshot_hash = ms.hash
JOIN global_snapshots gs
    ON ms.global_snapshot_hash = gs.hash
UNION ALL
SELECT
    mft.metagraph_id, mft.hash, mft.source_addr, mft.amount, mft.created_at, mft.updated_at,
    'FeeTransaction', mft.metagraph_snapshot_hash, ms.ordinal,
    mft.destination_addr, NULL, mft.data_update_ref, NULL, null,
    gs.hash AS global_snapshot_hash, gs.ordinal AS global_snapshot_ordinal
FROM metagraph_fee_transactions mft
JOIN metagraph_snapshots ms
    ON mft.metagraph_id = ms.metagraph_id AND mft.metagraph_snapshot_hash = ms.hash
JOIN global_snapshots gs
    ON ms.global_snapshot_hash = gs.hash;
