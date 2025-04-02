import {
  PrismaClient,
  addresses,
  global_snapshots,
  dag_blocks,
  dag_transactions,
  dag_balance_changes,
} from "@prisma/client";

const prisma = new PrismaClient();

type TestData = {
  addresses: addresses[];
  global_snapshots: global_snapshots[];
  dag_blocks: dag_blocks[];
  dag_transactions: dag_transactions[];
  dag_balance_changes: dag_balance_changes[]  
};

export async function seed() {
  const testData = {} as TestData;

  testData.addresses = await prisma.addresses.createManyAndReturn({
    data: [
      { address: "DAG4bQGdnDJ5okVdsdtvJzBwQoPGjLNzN7HC1CBV" },
      { address: "DAG5zSqFVKy399PWxxv1X4TitnVn8PfLXoK7DQQM" },
    ],
  });

  testData.global_snapshots = await prisma.global_snapshots.createManyAndReturn(
    {
      data: [
        {
          hash:
            "5649b42aad4f232ee30fe3e97b473e584ddc11c6a9823e272c32c1bb48f2042b",
          ordinal: 2556535,
          height: 41997,
          subheight: 842,
          last_snapshot_hash:
            "5649b42aad4f232ee30fe3e97b473e584ddc11c6a9823e272c32c1bb48f2042b",
          epoch_progress: 1012463,
          metagraph_snapshot_count: 0,
          version: "0.0.1",
          created_at: "2025-04-02T00:00:01Z", // set explicitly to avoid race condition
        },
        {
          hash:
            "b9fdf9e18ac3225a35b75d4fe73e9ee5d307a21ac3e0bfd4c77a6eda2411a366",
          ordinal: 2556536,
          height: 41998,
          subheight: 845,
          last_snapshot_hash:
            "5649b42aad4f232ee30fe3e97b473e584ddc11c6a9823e272c32c1bb48f2042b",
          epoch_progress: 1012463,
          metagraph_snapshot_count: 0,
          version: "0.0.1",
          created_at: "2025-04-02T00:00:02Z",
        },
      ],
    }
  );

  testData.dag_blocks = await prisma.dag_blocks.createManyAndReturn({
    data: [
      {
        hash:
          "16593f9f612a453c28669b86067e097990ee18742e905afa330674636ca1431c",
        height: 12,
        snapshot_hash: testData.global_snapshots[0].hash,
      },
    ],
  });

  testData.dag_transactions = await prisma.dag_transactions.createManyAndReturn(
    {
      data: [
        {
          hash:
            "1c53bc94c735d8d6eeaddc9f5cb446e7f79144c9aa5bba9479db8dee0ec1aa4c",
          source_addr: testData.addresses[0].address,
          destination_addr: testData.addresses[1].address,
          amount: 90790983,
          fee: 200000,
          salt: 1231231232,
          parent_ordinal: 21337,
          parent_hash:
            "4a6d3aa5715e304b4b5f32d52f0c91e0909acf7c24b3ca9776324da68db2f30c",
          ordinal: testData.global_snapshots[0].ordinal,
          block_hash: testData.dag_blocks[0].hash,
        },
      ],
    }
  );

  testData.dag_balance_changes = await prisma.dag_balance_changes.createManyAndReturn(
    {
      data: [
        {
          snapshot_hash: testData.global_snapshots[0].hash,
          snapshot_ordinal: testData.global_snapshots[0].ordinal,
          address: testData.dag_transactions[0].destination_addr,
          balance: testData.dag_transactions[0].amount,
        },
      ],
    }
  );

  return testData;
}

export async function resetDatabase() {
  // Disable referential integrity temporarily if needed
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "addresses", "global_snapshots", "dag_blocks", "dag_transactions" RESTART IDENTITY CASCADE;`
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
