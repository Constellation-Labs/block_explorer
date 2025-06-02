import { APIGatewayProxyResult } from "aws-lambda";
import * as dagHandler from "../../src/handlers/dagHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import {
  data_addresses,
  data_global_snapshots,
  prisma,
} from "../../prisma/seed";

const data_dag_blocks = [
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

const data_dag_transactions = [
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
    snapshot_hash: data_dag_blocks[0].snapshot_hash,
    transaction_original: {
      fee: 1,
      salt: 8971636413389910,
      amount: 2768293270,
      parent: {
        hash: "ec37fa4b293d4c3d08c8474dad933d37219c94a80d4b934af3b27114cac7bf6e",
        ordinal: 20631,
      },
      source: "DAG4nBMH7KwFAnpfB6VaFRaKEwACNSidzeMuPtgV",
      destination: "DAG5t8AVrmUK2dLF9DNLavMJvFRm4dpMYKBqnd9r",
    },
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
    snapshot_hash: data_dag_blocks[1].snapshot_hash,
    transaction_original: {
      fee: 1,
      salt: 8885443039669825,
      amount: 163220763999,
      parent: {
        hash: "0000000000000000000000000000000000000000000000000000000000000000",
        ordinal: 0,
      },
      source: "DAG8YtxgtUe8rfvpy1n3z4Q3ayATmZ7M2Xck7xeW",
      destination: "DAG1pLpkyX7aTtFZtbF98kgA9QTZRzrsGaFmf4BT",
    },
    created_at: new Date("2025-04-02T00:01:02Z"),
    updated_at: new Date(),
  },
  {
    hash: "1641479831cbb2dcfca627df21cd08ae052edd44b92bbb523f1d0e2b8bd3b058",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[2].address,
    amount: 13245n,
    fee: 10000n,
    salt: 12234n,
    parent_ordinal: 21339n,
    parent_hash:
      "6acc815979e9d1935cce65ba776fde1144c5fc0e97d3a9fe67d82d0e6e21977d",
    ordinal: 3222n,
    block_hash: data_dag_blocks[1].hash,
    snapshot_hash: data_dag_blocks[1].snapshot_hash,
    transaction_original: {
      fee: 200000,
      salt: 8759543125914451,
      amount: 5000000000,
      parent: {
        hash: "ef8e659dabf02247eabdf91ce143c0986efa8b1dbbc0305d8e6c0866820f3c77",
        ordinal: 45,
      },
      source: "DAG3Vj5dp43ZqcJWNzrKVaeaDTkLJZqpbqWuEhBj",
      destination: "DAG85EgRCHMeBYak31AxBzfinmML4bJWdRVH4XxF",
    },
    created_at: new Date("2025-04-02T00:02:02Z"),
    updated_at: new Date(),
  },
];

const data_dag_balance_changes = [
  {
    snapshot_hash: data_global_snapshots[0].hash,
    snapshot_ordinal: data_global_snapshots[0].ordinal,
    address: data_dag_transactions[0].destination_addr,
    balance: data_dag_transactions[0].amount,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

const seedData = async () => {
  await prisma.dag_blocks.createMany({
    data: data_dag_blocks,
  });

  await prisma.dag_transactions.createMany({
    data: data_dag_transactions,
  });

  await prisma.dag_balance_changes.createMany({
    data: data_dag_balance_changes,
  });
};

beforeAll(async () => {
  await seedData();
});

const validateTransaction = (tx) => {
  const dbTxn = data_dag_transactions.filter(
    (_dbTxn) => _dbTxn.hash === tx.hash
  )[0];

  const dbBlock = data_dag_blocks.filter(
    (_dbBlock) => _dbBlock.hash === dbTxn.block_hash
  )[0];

  const dbSnapshot = data_global_snapshots.filter(
    (_dbSnapshot) => _dbSnapshot.hash === dbBlock.snapshot_hash
  )[0];

  expect(tx.hash).toBe(dbTxn.hash);
  expect(tx.source).toBe(dbTxn.source_addr);
  expect(tx.destination).toBe(dbTxn.destination_addr);
  expect(tx.amount).toBe(Number(dbTxn.amount));
  expect(tx.fee).toBe(Number(dbTxn.fee));
  expect(tx.snapshotHash).toBe(dbSnapshot.hash);
  expect(tx.snapshotOrdinal).toBe(Number(dbSnapshot.ordinal));
  expect(tx.transactionOriginal).toEqual(dbTxn.transaction_original);
  expect(+new Date(tx.timestamp)).toBe(+new Date(dbTxn.created_at));
};

// These tests use a real database connection, so they're integration tests
describe("DAG Handler Integration Tests", () => {
  describe("globalSnapshots", () => {
    it("should return a list of global snapshots", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult = await dagHandler.globalSnapshots(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(data_global_snapshots.length);

      const testSnapshot = data_global_snapshots.sort((a, b): number => {
        return a.ordinal < b.ordinal ? 1 : -1;
      })[0];

      // Verify the structure of the returned data
      const snapshot = body.data[0];
      expect(snapshot.ordinal).toBe(Number(testSnapshot.ordinal));
      expect(snapshot.hash).toBe(testSnapshot.hash);
      expect(snapshot.epochProgress).toBe(Number(testSnapshot.epoch_progress));
      expect(snapshot.height).toBe(Number(testSnapshot.height));
      expect(snapshot.subHeight).toBe(Number(testSnapshot.subheight));
      expect(Array.isArray(snapshot.blocks)).toBe(true);
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.metagraphSnashotCount).toBe(
        Number(testSnapshot.metagraph_snapshot_count)
      );
    });

    it("should handle pagination correctly", async () => {
      const event = createAPIGatewayEvent({}, { limit: "1" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshots(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      // Ensure pagination is working
      expect(body.meta.next).toBeDefined();

      // Try getting the next page
      const nextEvent = createAPIGatewayEvent(
        {},
        {
          limit: "1",
          next: body.meta.next,
        }
      );

      const nextResponse = await dagHandler.globalSnapshots(nextEvent);
      expect(nextResponse.statusCode).toBe(200);

      const nextBody = validatePaginatedResponse(nextResponse);

      // Ensure we got a different set of results
      expect(nextBody.data[0].hash).not.toBe(body.data[0].hash);
    });
  });

  describe("globalSnapshot", () => {
    it('should return the latest global snapshot when term is "latest"', async () => {
      const event = createAPIGatewayEvent({ term: "latest" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      const testSnapshot = data_global_snapshots.sort((a, b): number => {
        return a.ordinal < b.ordinal ? 1 : -1;
      })[0];

      // Verify the structure of the returned data
      expect(body.data.ordinal).toBe(Number(testSnapshot.ordinal));
      expect(body.data.hash).toBe(testSnapshot.hash);
      expect(body.data.epochProgress).toBe(Number(testSnapshot.epoch_progress));
      expect(body.data.height).toBe(Number(testSnapshot.height));
      expect(body.data.subHeight).toBe(Number(testSnapshot.subheight));
      expect(Array.isArray(body.data.blocks)).toBe(true);
      expect(body.data.timestamp).toBeDefined();
    });

    it("should return a specific global snapshot when a valid hash is provided", async () => {
      const requestedSnapshot = data_global_snapshots[1];

      // First get the latest global snapshot to get a valid hash
      const event = createAPIGatewayEvent({ term: requestedSnapshot.hash });
      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      // Assert
      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      // Verify we got the same snapshot
      expect(body.data.hash).toBe(requestedSnapshot.hash);
      expect(body.data.ordinal).toBe(Number(requestedSnapshot.ordinal));
    });

    it("should return 404 for non-existent global snapshot", async () => {
      const event = createAPIGatewayEvent({ term: "nonexistent-hash" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      expect(response.statusCode).toBe(404);
    });
  });

  describe("globalSnapshotTransactions", () => {
    it("should return transactions for the latest global snapshot", async () => {
      const requestedSnapshot = data_global_snapshots[1];

      const event = createAPIGatewayEvent(
        { term: requestedSnapshot.ordinal.toString() },
        { limit: "10" }
      );

      const response: APIGatewayProxyResult =
        await dagHandler.globalSnapshotTransactions(event);

      const transactions = await prisma.dag_transactions.findMany({
        where: {
          snapshot_hash: requestedSnapshot.hash,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      const tx = body.data[0];

      const dbTxn = data_dag_transactions.filter(
        (_dbTxn) => _dbTxn.hash === tx.hash
      )[0];

      expect(tx.hash).toBe(dbTxn.hash);
      expect(tx.source).toBe(dbTxn.source_addr);
      expect(tx.destination).toBe(dbTxn.destination_addr);
      expect(tx.amount).toBe(Number(dbTxn.amount));
      expect(tx.fee).toBe(Number(dbTxn.fee));
      expect(tx.snapshotHash).toBe(requestedSnapshot.hash);
      expect(tx.snapshotOrdinal).toBe(Number(requestedSnapshot.ordinal));
      expect(+new Date(tx.timestamp)).toBe(+new Date(dbTxn.created_at));
    });
  });

  describe("dagTransaction", () => {
    it("should return a specific transaction by hash", async () => {
      const event = createAPIGatewayEvent({
        hash: data_dag_transactions[0].hash,
      });

      const response: APIGatewayProxyResult = await dagHandler.dagTransaction(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      const tx = body.data;

      const dbTxn = data_dag_transactions.filter(
        (_dbTxn) => _dbTxn.hash === tx.hash
      )[0];

      expect(tx.hash).toBe(dbTxn.hash);
      expect(tx.source).toBe(dbTxn.source_addr);
      expect(tx.destination).toBe(dbTxn.destination_addr);
      expect(tx.amount).toBe(Number(dbTxn.amount));
      expect(tx.fee).toBe(Number(dbTxn.fee));
      expect(tx.snapshotHash).toBeDefined();
      expect(tx.snapshotOrdinal).toBeDefined();
      expect(+new Date(tx.timestamp)).toBe(+new Date(dbTxn.created_at));
    });

    it("should return 404 for non-existent transaction", async () => {
      const event = createAPIGatewayEvent({ hash: "nonexistent-hash" });

      const response: APIGatewayProxyResult = await dagHandler.dagTransaction(
        event
      );

      expect(response.statusCode).toBe(404);
    });
  });

  describe("dagTransactions", () => {
    it("should return transactions sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0];

      const event = createAPIGatewayEvent();

      const response: APIGatewayProxyResult = await dagHandler.dagTransactions(
        event
      );

      const transactions = await prisma.dag_transactions.findMany({
        include: {
          global_snapshot: { select: { ordinal: true, hash: true } },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      expect([
        body.data[0].snapshotOrdinal,
        body.data[1].snapshotOrdinal,
        body.data[2].snapshotOrdinal,
      ]).toEqual([2556536, 2556536, 2556535]);

      validateTransaction(body.data[0]);
      validateTransaction(body.data[1]);
    });
  });

  describe("dagTransactionsByAddress", () => {
    it("should return transactions for specified address sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0].address;

      const event = createAPIGatewayEvent({ address }, { limit: "10" });

      const response: APIGatewayProxyResult =
        await dagHandler.dagTransactionsByAddress(event);

      const transactions = await prisma.dag_transactions.findMany({
        where: {
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        include: {
          global_snapshot: { select: { ordinal: true } },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      expect([
        body.data[0].snapshotOrdinal,
        body.data[1].snapshotOrdinal,
      ]).toEqual([2556536, 2556535]);

      validateTransaction(body.data[0]);
      validateTransaction(body.data[1]);
    });
  });

  describe("dagBalanceByAddress", () => {
    it("should return balance for a given address", async () => {
      const testTxn = data_dag_transactions[0];

      const event = createAPIGatewayEvent({
        address: testTxn.destination_addr,
      });

      const response: APIGatewayProxyResult =
        await dagHandler.dagBalanceByAddress(event);

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];

      expect(body.balance).toBe(Number(testTxn.amount));
      expect(body.address).toBe(testTxn.destination_addr);
      expect(body.ordinal).toBeDefined();
    });
  });
});
