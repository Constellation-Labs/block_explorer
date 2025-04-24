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
