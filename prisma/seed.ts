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
  }
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

export const data_dag_blocks = [
  {
    hash: "16593f9f612a453c28669b86067e097990ee18742e905afa330674636ca1431c",
    height: 12n,
    snapshot_hash: data_global_snapshots[0].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    hash: "48fd7dd45ced78be111174c5262cca65aa44798b6a01b48525590bfcce643bd2",
    height: 14n,
    snapshot_hash: data_global_snapshots[1].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

export const data_dag_transactions = [
  {
    hash: "1c53bc94c735d8d6eeaddc9f5cb446e7f79144c9aa5bba9479db8dee0ec1aa4c",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 90790983n,
    fee: 200000n,
    salt: 1231231232n,
    parent_ordinal: 21337n,
    parent_hash:
      "4a6d3aa5715e304b4b5f32d52f0c91e0909acf7c24b3ca9776324da68db2f30c",
    ordinal: 234n,
    block_hash: data_dag_blocks[0].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    hash: "6acc815979e9d1935cce65ba776fde1144c5fc0e97d3a9fe67d82d0e6e21977d",
    source_addr: data_addresses[1].address,
    destination_addr: data_addresses[0].address,
    amount: 90790983n,
    fee: 100000n,
    salt: 1234n,
    parent_ordinal: 21337n,
    parent_hash:
      "1c53bc94c735d8d6eeaddc9f5cb446e7f79144c9aa5bba9479db8dee0ec1aa4c",
    ordinal: 3222n,
    block_hash: data_dag_blocks[1].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];
export const data_dag_balance_changes = [
  {
    snapshot_hash: data_global_snapshots[0].hash,
    snapshot_ordinal: data_global_snapshots[0].ordinal,
    address: data_dag_transactions[0].destination_addr,
    balance: data_dag_transactions[0].amount,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

export const data_metagraphs = [
  {
    id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

export const data_metagraph_snapshots = [
  {
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
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
    global_snapshot_hash: data_global_snapshots[1].hash,
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
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
];

export const data_metagraph_blocks = [
  {
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    hash: "33374138dd6f5f9846261d541dab33dadcbae8c9f5a39026336a34a3e2aafb93",
    height: 12n,
    metagraph_snapshot_hash: data_metagraph_snapshots[0].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    hash: "3d5a9616d65a6d98fe629f1a056489df9245a40d1e8589ed9d655c6fcb3ee361",
    height: 14n,
    metagraph_snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];
export const data_metagraph_transactions = [
  {
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    hash: "39c9909d3b00552beaa5487c38110267675ab212b3b97654fc5ca9917cb7e72b",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 90790983n,
    fee: 200000n,
    salt: 1231231232n,
    parent_ordinal: 21337n,
    parent_hash:
      "5056fdfbba0637dcecfc0b7fa3f441c745c852cf850c3bfc0dbc8a7410b8d722",
    ordinal: 12n,
    block_hash: data_metagraph_blocks[0].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    hash: "aa50e85a32e3e84c9b49880e103ee240f572a6febd255d97db1406f6c936af6f",
    source_addr: data_addresses[1].address,
    destination_addr: data_addresses[0].address,
    amount: 90790983n,
    fee: 100000n,
    salt: 1234n,
    parent_ordinal: 21337n,
    parent_hash:
      "39c9909d3b00552beaa5487c38110267675ab212b3b97654fc5ca9917cb7e72b",
    ordinal: 123n,
    block_hash: data_metagraph_blocks[1].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];
export const data_metagraph_balance_changes = [
  {
    metagraph_id: "DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C",
    metagraph_snapshot_hash: data_metagraph_snapshots[0].hash,
    snapshot_ordinal: data_metagraph_snapshots[0].ordinal,
    address: data_metagraph_transactions[0].destination_addr,
    balance: data_metagraph_transactions[0].amount,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
    created_at: new Date("2025-04-02T00:10:01Z"), // set explicitly to avoid race condition
    updated_at: new Date("2025-04-02T00:10:01Z"),
  },
];

export async function seed() {
  await prisma.addresses.createManyAndReturn({ data: data_addresses });

  await prisma.global_snapshots.createManyAndReturn({
    data: data_global_snapshots,
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
