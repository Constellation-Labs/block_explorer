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
    source_addr: data_addresses[0].address,
    amount: 1200n,
    ordinal: 1n,
    unlock_epoch: 100n,
    round_id: randomUUID(),
    snapshot_hash: data_global_snapshots[0].hash,
  },
  {
    hash: `token-lock-hash-002`,
    source_addr: data_addresses[0].address,
    amount: 1000n,
    ordinal: 2n,
    unlock_epoch: 10n,
    round_id: randomUUID(),
    snapshot_hash: data_global_snapshots[0].hash,
  },
  {
    hash: `token-lock-hash-003`,
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
    source_addr: data_addresses[0].address,
    amount: 3000n,
    lock_reference_hash: data_metagraph_token_locks[0].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
  },
  {
    hash: "metagraph-token-unlock-hash-002",
    metagraph_id: data_metagraphs[0].id,
    source_addr: data_addresses[0].address,
    amount: 3000n,
    lock_reference_hash: data_metagraph_token_locks[2].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
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
