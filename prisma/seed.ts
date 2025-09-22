import {
  PrismaClient,
  addresses,
  global_snapshots,
  dag_blocks,
  dag_transactions,
  dag_balance_changes,
  metagraph_snapshots,
  metagraph_blocks,
  metagraph_transactions,
  metagraph_balance_changes,
  metagraphs,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import path from "path";

export const prisma = new PrismaClient();

export const data_addresses = [
  {
    address: "DAG4bQGdnDJ5okVdsdtvJzBwQoPGjLNzN7HC1CBV",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    address: "DAG5zSqFVKy399PWxxv1X4TitnVn8PfLXoK7DQQM",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    address: "DAG8rQeDs5qRsPr2Rt4pUf4R83SKMSAbmECNoSBp",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    address: "DAG8bxrEjLbqPeMsN233MGFGqrLcpgbdXwQzYrYv",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

export const data_global_snapshots = [
  {
    hash: "5649b42aad4f232ee30fe3e97b473e584ddc11c6a9823e272c32c1bb48f2042b",
    ordinal: 2556535n,
    height: 41997n,
    subheight: 842,
    last_snapshot_hash:
      "5649b42aad4f232ee30fe3e97b473e584ddc11c6a9823e272c32c1bb48f2042b",
    epoch_progress: 1012463n,
    metagraph_snapshot_count: 1n,
    version: "0.0.1",
    created_at: new Date("2025-04-02T00:00:01Z"), // set explicitly to avoid race condition
    updated_at: new Date("2025-04-02T00:00:01Z"),
  },
  {
    hash: "b9fdf9e18ac3225a35b75d4fe73e9ee5d307a21ac3e0bfd4c77a6eda2411a366",
    ordinal: 2556536n,
    height: 41998n,
    subheight: 845,
    last_snapshot_hash:
      "5649b42aad4f232ee30fe3e97b473e584ddc11c6a9823e272c32c1bb48f2042b",
    epoch_progress: 1012463n,
    metagraph_snapshot_count: 1n,
    version: "0.0.1",
    created_at: new Date("2025-04-02T00:00:01Z"), // set explicitly to avoid race condition
    updated_at: new Date("2025-04-02T00:00:01Z"),
  },
  {
    hash: "16593f9f612a453c28669b86067e097990ee18742e905afa330674636ca1431c",
    ordinal: 2556537n,
    height: 41999n,
    subheight: 846,
    last_snapshot_hash:
      "b9fdf9e18ac3225a35b75d4fe73e9ee5d307a21ac3e0bfd4c77a6eda2411a366",
    epoch_progress: 1012465n,
    metagraph_snapshot_count: 1n,
    version: "0.0.1",
    created_at: new Date("2025-04-02T10:00:01Z"), // set explicitly to avoid race condition
    updated_at: new Date("2025-04-02T10:00:01Z"),
  },
];

export const data_metagraphs = [
  {
    id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    id: "DAG6666666666666666666666666666666666666",
    created_at: new Date("2025-04-02T00:01:02Z"),
    updated_at: new Date(),
  },
];

export const data_metagraph_snapshots = [
  {
    metagraph_id: data_metagraphs[0].id,
    global_snapshot_hash: data_global_snapshots[0].hash,
    ordinal: 1n,
    hash: "1c1e16746af43bc1f93aadaf006cd981852a706e74f1d24b66a7e5e9fa4188e5",
    height: 1n,
    subheight: 1,
    owner_address: null,
    staking_address: null,
    epoch_progress: 1n,
    size: 1n,
    last_snapshot_hash:
      "0000000000000000000000000000000000000000000000000000000000000000",
    fee: 1n,
    version: "0.0.1",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    global_snapshot_hash: data_global_snapshots[1].hash,
    ordinal: 2n,
    hash: "9bf40b2d2e355401bbca7a7924880ab799ffa91e95d1b93f3298b549758aac64",

    height: 2n,
    subheight: 2,
    owner_address: null,
    staking_address: null,
    epoch_progress: 1n,
    size: 1n,
    last_snapshot_hash:
      "1c1e16746af43bc1f93aadaf006cd981852a706e74f1d24b66a7e5e9fa4188e5",
    fee: 1n,
    version: "0.0.1",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: data_metagraphs[1].id,
    global_snapshot_hash: data_global_snapshots[1].hash,
    ordinal: 1n,
    hash: "9bf40b2d2e3123123123123123123123123123123123123123123549758aac64",

    height: 3n,
    subheight: 2,
    owner_address: null,
    staking_address: null,
    epoch_progress: 1n,
    size: 1n,
    last_snapshot_hash:
      "9bf40b2d2e355401bbca7a7924880ab799ffa91e95d1b93f3298b549758aac64",
    fee: 1n,
    version: "0.0.1",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

export const data_dag_token_locks = [
  {
    hash: `token-lock-hash-001`,
    currency_id: "currency-1",
    source_addr: data_addresses[0].address,
    amount: 1200n,
    ordinal: 1n,
    unlock_epoch: 100n,
    round_id: randomUUID(),
    snapshot_hash: data_global_snapshots[0].hash,
  },
  {
    hash: `token-lock-hash-002`,
    currency_id: "currency-2",
    source_addr: data_addresses[0].address,
    amount: 1000n,
    ordinal: 2n,
    unlock_epoch: 10n,
    round_id: randomUUID(),
    snapshot_hash: data_global_snapshots[0].hash,
  },
  {
    hash: `token-lock-hash-003`,
    currency_id: "currency-3",
    source_addr: data_addresses[0].address,
    amount: 1200n,
    ordinal: 3n,
    unlock_epoch: 10n,
    round_id: randomUUID(),
    snapshot_hash: data_global_snapshots[1].hash,
  },
];

// Test data for DAG token unlocks
export const data_dag_token_unlocks = [
  {
    hash: "token-unlock-hash-0010",
    currency_id: data_dag_token_locks[0].currency_id,
    source_addr: data_addresses[0].address,
    amount: 1000n,
    lock_reference_hash: data_dag_token_locks[0].hash,
    snapshot_hash: data_global_snapshots[1].hash,
  },
];

// Test data for metagraph token locks
export const data_metagraph_token_locks = [
  {
    hash: "metagraph-token-lock-hash-0010",
    currency_id: "currency-1",
    metagraph_id: data_metagraphs[0].id,
    source_addr: data_addresses[0].address,
    amount: 3000n,
    ordinal: 10n,
    unlock_epoch: 15n,
    round_id: randomUUID(),
    snapshot_hash: data_metagraph_snapshots[0].hash,
  },
  {
    hash: "metagraph-token-lock-hash-0020",
    currency_id: "currency-2",
    metagraph_id: data_metagraphs[0].id,
    source_addr: data_addresses[0].address,
    amount: 4000n,
    ordinal: 20n,
    unlock_epoch: 25n,
    round_id: randomUUID(),
    snapshot_hash: data_metagraph_snapshots[1].hash,
  },
  {
    hash: "metagraph-token-lock-hash-0030",
    currency_id: "currency-3",
    metagraph_id: data_metagraphs[0].id,
    source_addr: data_addresses[0].address,
    amount: 4000n,
    ordinal: 21n,
    unlock_epoch: 25n,
    round_id: randomUUID(),
    snapshot_hash: data_metagraph_snapshots[1].hash,
  },
];

// Test data for metagraph token unlocks
export const data_metagraph_token_unlocks = [
  {
    hash: "metagraph-token-unlock-hash-001",
    metagraph_id: data_metagraphs[0].id,
    currency_id: data_metagraph_token_locks[0].currency_id,
    source_addr: data_addresses[0].address,
    amount: 3000n,
    lock_reference_hash: data_metagraph_token_locks[0].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
  },
  {
    hash: "metagraph-token-unlock-hash-002",
    metagraph_id: data_metagraphs[0].id,
    currency_id: data_metagraph_token_locks[2].currency_id,
    source_addr: data_addresses[0].address,
    amount: 3000n,
    lock_reference_hash: data_metagraph_token_locks[2].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
  },
];

export const data_dag_allow_spends = [
  {
    hash: "allowSpendHash1",
    currency_id: "currency-1",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 1000n,
    fee: 5n,
    last_valid_epoch_progress: 100n,
    ordinal: 1n,
    snapshot_hash: data_global_snapshots[0].hash,
    round_id: "11111111-1111-1111-1111-111111111111",
    created_at: new Date("2024-01-01T10:00:00Z"),
    updated_at: new Date("2024-01-01T10:00:00Z"),
  },
  {
    hash: "allowSpendHash2",
    currency_id: "currency-2",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[2].address,
    amount: 2000n,
    fee: 10n,
    last_valid_epoch_progress: 600n,
    ordinal: 2n,
    snapshot_hash: data_global_snapshots[0].hash,
    round_id: "22222222-2222-2222-2222-222222222222",
    created_at: new Date("2024-01-02T10:00:00Z"),
    updated_at: new Date("2024-01-02T10:00:00Z"),
  },
  {
    hash: "allowSpendHash3",
    currency_id: "currency-1",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[1].address,
    amount: 300n,
    fee: 15n,
    last_valid_epoch_progress: 700n,
    ordinal: 3n,
    snapshot_hash: data_global_snapshots[1].hash,
    round_id: "33333333-3333-3333-3333-333333333333",
    created_at: new Date("2024-01-03T10:00:00Z"),
    updated_at: new Date("2024-01-03T10:00:00Z"),
  },
  {
    hash: "allowSpendHash4",
    currency_id: "currency-2",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[3].address,
    amount: 300n,
    fee: 15n,
    last_valid_epoch_progress: 700n,
    ordinal: 4n,
    snapshot_hash: data_global_snapshots[0].hash,
    round_id: "33333333-3333-3333-3333-333333333333",
    created_at: new Date("2024-01-03T10:00:00Z"),
    updated_at: new Date("2024-01-03T10:00:00Z"),
  },
  {
    hash: "allowSpendHash5",
    currency_id: "currency-2",
    source_addr: data_addresses[1].address,
    destination_addr: data_addresses[2].address,
    amount: 3000n,
    fee: 15n,
    last_valid_epoch_progress: 700n,
    ordinal: 5n,
    snapshot_hash: data_global_snapshots[1].hash,
    round_id: "33333333-3333-3333-3333-333333333333",
    created_at: new Date("2024-01-03T10:00:00Z"),
    updated_at: new Date("2024-01-03T10:00:00Z"),
  },
];

export const data_dag_spend_transactions = [
  {
    hash: "spendTxHash1",
    currency_id: data_dag_allow_spends[0].currency_id,
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 1000n,
    allow_spend_ref: data_dag_allow_spends[0].hash,
    snapshot_hash: data_global_snapshots[2].hash,
    created_at: new Date("2024-01-05T10:00:00Z"),
    updated_at: new Date("2024-01-05T10:00:00Z"),
  },
  {
    hash: "spendTxHash5",
    currency_id: data_dag_allow_spends[4].currency_id,
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[1].address,
    amount: 3000n,
    allow_spend_ref: data_dag_allow_spends[4].hash,
    snapshot_hash: data_global_snapshots[2].hash,
    created_at: new Date("2024-01-05T10:00:00Z"),
    updated_at: new Date("2024-01-05T10:00:00Z"),
  },
];

export const data_dag_expired_spend_transactions = [
  {
    hash: "expiredSpendTxHash1",
    currency_id: data_dag_allow_spends[1].currency_id,
    source_addr: data_addresses[2].address,
    amount: 3000n,
    allow_spend_ref: data_dag_allow_spends[1].hash,
    snapshot_hash: data_global_snapshots[2].hash,
    created_at: new Date("2024-01-10T10:00:00Z"),
    updated_at: new Date("2024-01-10T10:00:00Z"),
  },
];

export const data_metagraph_allow_spends = [
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaAllowSpendHash1",
    currency_id: "currency-1",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 500n,
    fee: 3n,
    last_valid_epoch_progress: 50n,
    ordinal: 1n,
    snapshot_hash: data_metagraph_snapshots[0].hash,
    round_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    created_at: new Date("2024-01-01T11:00:00Z"),
    updated_at: new Date("2024-01-01T11:00:00Z"),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaAllowSpendHash2",
    currency_id: "currency-2",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 500n,
    fee: 3n,
    last_valid_epoch_progress: 50n,
    ordinal: 2n,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    round_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    created_at: new Date("2024-01-01T11:00:00Z"),
    updated_at: new Date("2024-01-01T11:00:00Z"),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaAllowSpendHash3",
    currency_id: "currency-3",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[3].address,
    amount: 750n,
    fee: 4n,
    last_valid_epoch_progress: 60n,
    ordinal: 3n,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    round_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    created_at: new Date("2024-01-02T11:00:00Z"),
    updated_at: new Date("2024-01-02T11:00:00Z"),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaAllowSpendHash4",
    currency_id: "currency-3",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[3].address,
    amount: 750n,
    fee: 4n,
    last_valid_epoch_progress: 60n,
    ordinal: 4n,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    round_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    created_at: new Date("2024-01-02T11:00:00Z"),
    updated_at: new Date("2024-01-02T11:00:00Z"),
  },
];

export const data_metagraph_spend_transactions = [
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaSpendTxHash1",
    currency_id: data_metagraph_allow_spends[0].currency_id,
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 500n,
    allow_spend_ref: data_metagraph_allow_spends[0].hash,
    snapshot_hash: data_metagraph_snapshots[0].hash,
    created_at: new Date("2024-01-03T11:00:00Z"),
    updated_at: new Date("2024-01-03T11:00:00Z"),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaSpendTxHash2",
    currency_id: data_metagraph_allow_spends[3].currency_id,
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[3].address,
    amount: 750n,
    allow_spend_ref: data_metagraph_allow_spends[3].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2024-01-03T11:00:00Z"),
    updated_at: new Date("2024-01-03T11:00:00Z"),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "spendTxHash1",
    currency_id: null,
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 1000n,
    allow_spend_ref: data_dag_allow_spends[0].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2024-01-05T10:00:00Z"),
    updated_at: new Date("2024-01-05T10:00:00Z"),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "spendTxHash5",
    currency_id: null,
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[1].address,
    amount: 3000n,
    allow_spend_ref: data_dag_allow_spends[4].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2024-01-05T10:00:00Z"),
    updated_at: new Date("2024-01-05T10:00:00Z"),
  },
];

export const data_metagraph_expired_spend_transactions = [
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaExpiredTxHash1",
    currency_id: data_metagraph_allow_spends[2].currency_id,
    source_addr: data_addresses[2].address,
    amount: 750n,
    allow_spend_ref: data_metagraph_allow_spends[2].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2024-01-04T11:00:00Z"),
    updated_at: new Date("2024-01-04T11:00:00Z"),
  },
];

export const data_delegate_stake_create_events = [
  {
    hash: "stake-event-hash-001",
    ordinal: 10001n,
    source_addr: data_addresses[0].address,
    node_id: "NODE_ABC123",
    amount: 500000000000n,
    fee: 500000n,
    lock_reference_hash: data_dag_token_locks[0].hash,
    parent_hash: "parent-hash-xyz",
    global_snapshot_hash: data_global_snapshots[0].hash,
  },
  {
    hash: "stake-event-hash-002",
    ordinal: 10002n,
    source_addr: data_addresses[1].address,
    node_id: "NODE_ABC234",
    amount: 3333300000000n,
    fee: 500000n,
    lock_reference_hash: data_dag_token_locks[1].hash,
    parent_hash: "stake-event-hash-001",
    global_snapshot_hash: data_global_snapshots[1].hash,
  },
  {
    hash: "stake-event-hash-003",
    ordinal: 10003n,
    source_addr: data_addresses[0].address,
    node_id: "NODE_ABC234",
    amount: 3333300000000n,
    fee: 500000n,
    lock_reference_hash: data_dag_token_locks[1].hash,
    parent_hash: "stake-event-hash-001",
    global_snapshot_hash: data_global_snapshots[2].hash,
    transfer_from_hash: "stake-event-hash-002",
  },
  {
    hash: "stake-event-hash-004",
    ordinal: 10011n,
    source_addr: data_addresses[2].address,
    node_id: "NODE_ABC444",
    amount: 600000000000n,
    fee: 500000n,
    lock_reference_hash: data_dag_token_locks[2].hash,
    parent_hash: "parent-hash-xyz1",
    global_snapshot_hash: data_global_snapshots[2].hash,
  },
];

export const data_delegate_stake_withdraw_events = [
  {
    hash: "withdraw-event-hash-001",
    source_addr: data_addresses[0].address,
    stake_create_hash: data_delegate_stake_create_events[0].hash,
    global_snapshot_hash: data_global_snapshots[1].hash,
    unlock_epoch: 11000n,
    is_completed: false,
  },
  {
    hash: "withdraw-event-hash-002",
    source_addr: data_addresses[0].address,
    stake_create_hash: data_delegate_stake_create_events[2].hash,
    global_snapshot_hash: data_global_snapshots[2].hash,
    unlock_epoch: 8000n,
    is_completed: true,
  },
];

export const data_delegate_stake_rewards = [
  {
    global_snapshot_hash: data_global_snapshots[0].hash,
    address: data_addresses[0].address,
    node_id: data_delegate_stake_create_events[0].node_id,
    rewards: 1000n,
    stake_create_hash: data_delegate_stake_create_events[0].hash,
  },
  {
    global_snapshot_hash: data_global_snapshots[1].hash,
    address: data_addresses[0].address,
    node_id: data_delegate_stake_create_events[0].node_id,
    rewards: 1000n,
    stake_create_hash: data_delegate_stake_create_events[0].hash,
  },
  {
    global_snapshot_hash: data_global_snapshots[1].hash,
    address: data_addresses[1].address,
    node_id: data_delegate_stake_create_events[1].node_id,
    rewards: 2000n,
    stake_create_hash: data_delegate_stake_create_events[1].hash,
  },
  {
    global_snapshot_hash: data_global_snapshots[2].hash,
    address: data_addresses[0].address,
    node_id: data_delegate_stake_create_events[2].node_id,
    rewards: 3000n,
    stake_create_hash: data_delegate_stake_create_events[2].hash,
  },
];

export const data_metagraph_fee_transactions = [
  {
    metagraph_id: data_metagraphs[0].id,
    metagraph_snapshot_hash: data_metagraph_snapshots[0].hash,
    metagraph_snapshot_ordinal: data_metagraph_snapshots[0].ordinal,
    hash: "39c9909d3b00552beaa5487c38110267675ab212b3b97654fc5ca9917cb7e72b1",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 90790983n,
    data_update_ref:
      "5056fdfbba0637dcecfc0b7fa3f441c745c852cf850c3bfc0dbc8a7410b8d722",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: data_metagraphs[1].id,
    metagraph_snapshot_hash: data_metagraph_snapshots[2].hash,
    metagraph_snapshot_ordinal: data_metagraph_snapshots[2].ordinal,
    hash: "39c990000000000000000000000000000000000000007654fc5ca9917cb7e72b1",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[3].address,
    amount: 10090983n,
    data_update_ref:
      "39c9909d3b00552beaa5487c38110267675ab212b3b97654fc5ca9917cb7e72b1",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

export async function seed() {
  await prisma.addresses.createMany({ data: data_addresses });

  await prisma.global_snapshots.createMany({
    data: data_global_snapshots,
  });

  await prisma.metagraphs.createMany({ data: data_metagraphs });

  await prisma.metagraph_snapshots.createMany({
    data: data_metagraph_snapshots,
  });

  // Create DAG token locks
  await prisma.dag_token_locks.createMany({
    data: data_dag_token_locks,
  });

  // Create DAG token unlocks
  await prisma.dag_token_unlocks.createMany({
    data: data_dag_token_unlocks,
  });

  // Create metagraph token locks
  await prisma.metagraph_token_locks.createMany({
    data: data_metagraph_token_locks,
  });

  // Create metagraph token unlocks
  await prisma.metagraph_token_unlocks.createMany({
    data: data_metagraph_token_unlocks,
  });
  await prisma.metagraph_allow_spends.createMany({
    data: data_metagraph_allow_spends,
  });
  await prisma.metagraph_spend_transactions.createMany({
    data: data_metagraph_spend_transactions,
  });
  await prisma.metagraph_expired_spend_transactions.createMany({
    data: data_metagraph_expired_spend_transactions,
  });

  await prisma.metagraph_fee_transactions.createMany({
    data: data_metagraph_fee_transactions,
  });

  await prisma.dag_allow_spends.createMany({
    data: data_dag_allow_spends,
  });

  await prisma.dag_spend_transactions.createMany({
    data: data_dag_spend_transactions,
  });

  await prisma.dag_expired_spend_transactions.createMany({
    data: data_dag_expired_spend_transactions,
  });
  await prisma.delegate_stake_create_events.createMany({
    data: data_delegate_stake_create_events,
  });

  await prisma.delegate_stake_withdraw_events.createMany({
    data: data_delegate_stake_withdraw_events,
  });

  await prisma.delegate_stake_rewards.createMany({
    data: data_delegate_stake_rewards,
  });

  //generate views
  //first drop the prisma generated tables
  await prisma.$executeRawUnsafe("DROP TABLE dag_actions_view");
  await prisma.$executeRawUnsafe("DROP TABLE metagraph_actions_view");
  await prisma.$executeRawUnsafe(
    "DROP TABLE delegate_stake_total_rewards_view"
  );
  await prisma.$executeRawUnsafe("DROP TABLE token_lock_total_rewards_view");
  // runSqlFromFile("./migrations/20250609/02_add_staking_to_actions.sql"); // ?????????????????
  runSqlFromFile("./migrations/20250606/01_total_rewards_view.sql");
  runSqlFromFile("./migrations/20250922/01_dag_spend_txs_in_actions_view.sql");
}

async function runSqlFromFile(filename: string) {
  const filePath = path.resolve(__dirname, filename);
  const sql = readFileSync(filePath, "utf-8");

  const statements = sql
    .split(/;\s*$/m) // splits on semicolon at end of line
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  try {
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log(`Executed ${statements.length} statements from: ${filename}`);
  } catch (err) {
    console.error(`Error executing SQL from: ${filename}`, err);
  }
}

export async function resetDatabase() {
  // Disable referential integrity temporarily if needed
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "addresses", "global_snapshots", "dag_blocks", "dag_transactions", "dag_balance_changes",
    "metagraphs", "metagraph_snapshots" , "metagraph_blocks", "metagraph_transactions", "metagraph_balance_changes" 
     RESTART IDENTITY CASCADE;`
  );
  // Add your own models above

  console.log("Database reset complete.");
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error("err:", e);
      // process.exit(0);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
