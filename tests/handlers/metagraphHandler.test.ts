import { APIGatewayProxyResult } from "aws-lambda";
import * as metagraphHandler from "../../src/handlers/metagraphHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import {
  data_addresses,
  data_global_snapshots,
  data_metagraph_snapshots,
  data_metagraphs,
  prisma,
} from "../../prisma/seed";


const data_metagraph_blocks = [
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "33374138dd6f5f9846261d541dab33dadcbae8c9f5a39026336a34a3e2aafb93",
    height: 12n,
    metagraph_snapshot_hash: data_metagraph_snapshots[0].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "3d5a9616d65a6d98fe629f1a056489df9245a40d1e8589ed9d655c6fcb3ee361",
    height: 14n,
    metagraph_snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: data_metagraphs[1].id,
    hash: "3d5a9616d65666666666666666666666666666666666666d9d655c6fcb3ee361",
    height: 14n,
    metagraph_snapshot_hash: data_metagraph_snapshots[2].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];
const data_metagraph_transactions = [
  {
    metagraph_id: data_metagraphs[0].id,
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
    metagraph_id: data_metagraphs[0].id,
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
  {
    metagraph_id: data_metagraphs[1].id,
    hash: "aa50e85a32e3e84c9b496666666666666666666666666666666606f6c936af6f",
    source_addr: data_addresses[2].address,
    destination_addr: data_addresses[3].address,
    amount: 123123n,
    fee: 10000n,
    salt: 124n,
    parent_ordinal: 21338n,
    parent_hash:
      "39c9909d3b006666666666666666666666666666666666666c5ca9917cb7e72b",
    ordinal: 123n,
    block_hash: data_metagraph_blocks[2].hash,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];
const data_metagraph_balance_changes = [
  {
    metagraph_id: data_metagraphs[0].id,
    metagraph_snapshot_hash: data_metagraph_snapshots[0].hash,
    snapshot_ordinal: data_metagraph_snapshots[0].ordinal,
    address: data_metagraph_transactions[0].destination_addr,
    balance: data_metagraph_transactions[0].amount,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id: data_metagraphs[0].id,
    metagraph_snapshot_hash: data_metagraph_snapshots[1].hash,
    snapshot_ordinal: data_metagraph_snapshots[1].ordinal,
    address: data_metagraph_transactions[1].destination_addr,
    balance: data_metagraph_transactions[1].amount,
    created_at: new Date("2025-04-02T10:00:02Z"),
    updated_at: new Date(),
  },
  {
    metagraph_id:  data_metagraphs[1].id,
    metagraph_snapshot_hash: data_metagraph_snapshots[2].hash,
    snapshot_ordinal: data_metagraph_snapshots[2].ordinal,
    address: data_metagraph_transactions[2].destination_addr,
    balance: data_metagraph_transactions[2].amount,
    created_at: new Date("2025-04-02T00:00:02Z"),
    updated_at: new Date(),
  },
];

const seedData = async () => {

 
  await prisma.metagraph_blocks.createManyAndReturn({
    data: data_metagraph_blocks,
  });

  await prisma.metagraph_transactions.createManyAndReturn({
    data: data_metagraph_transactions,
  });

  await prisma.metagraph_balance_changes.createManyAndReturn({
    data: data_metagraph_balance_changes,
  });
}

  beforeAll(async () => {
      await seedData();
  });


const validateTransaction = (tx, expected) => {

  const dbBlock = data_metagraph_blocks.filter(
    (_dbBlock) => _dbBlock.hash === expected.block_hash
  )[0];

  const dbSnapshot = data_metagraph_snapshots.filter(
    (_dbSnapshot) => _dbSnapshot.hash === dbBlock.metagraph_snapshot_hash
  )[0];

  expect(tx.hash).toBe(expected.hash);
  expect(tx.source).toBe(expected.source_addr);
  expect(tx.destination).toBe(expected.destination_addr);
  expect(tx.amount).toBe(Number(expected.amount));
  expect(tx.fee).toBe(Number(expected.fee));
  expect(tx.snapshotHash).toBe(dbSnapshot.hash);
  expect(tx.snapshotOrdinal).toBe(Number(dbSnapshot.ordinal));
  expect(+new Date(tx.timestamp)).toBe(+new Date(expected.created_at));
};

describe("Metagraph Handler Integration Tests", () => {
  describe("currencySnapshots", () => {
    it("should return a list of metagraph snapshots", async () => {
      const metagraph_id = data_metagraphs[0].id

      const event = createAPIGatewayEvent({identifier: metagraph_id}, { limit: "10" });
      const response: APIGatewayProxyResult =
        await metagraphHandler.currencySnapshots(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      const expected = data_metagraph_snapshots.filter(ms => ms.metagraph_id === metagraph_id)

      expect(body.data.length).toBe(expected.length);

      const testSnapshot = data_metagraph_snapshots.sort((a, b): number => {
        return a.ordinal < b.ordinal ? 1 : -1;
      })[0];

      // Verify the structure of the returned data
      const snapshot = body.data[0];
      expect(snapshot.ordinal).toBe(Number(testSnapshot.ordinal));
      expect(snapshot.hash).toBe(testSnapshot.hash);
      expect(snapshot.height).toBe(Number(testSnapshot.height));
      expect(snapshot.subHeight).toBe(Number(testSnapshot.subheight));
      expect(Array.isArray(snapshot.blocks)).toBe(true);
      expect(snapshot.timestamp).toBeDefined();
    });

    it("should handle pagination correctly", async () => {
      const metagraph_id = data_metagraphs[0].id
      const event = createAPIGatewayEvent({identifier: metagraph_id}, { limit: "1" });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencySnapshots(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      // Ensure pagination is working
      expect(body.meta.next).toBeDefined();

      // Try getting the next page
      const nextEvent = createAPIGatewayEvent(
        {identifier: metagraph_id},
        {
          limit: "1",
          next: body.meta.next,
        }
      );

      const nextResponse = await metagraphHandler.currencySnapshots(nextEvent);
      expect(nextResponse.statusCode).toBe(200);

      const nextBody = validatePaginatedResponse(nextResponse);

      // Ensure we got a different set of results
      expect(nextBody.data[0].hash).not.toBe(body.data[0].hash);
    });

    it("should return not found on invalid metagraph", async () => {
      const identifier = "1234567"
      const event = createAPIGatewayEvent({ identifier }, { limit: "10" });
      const response: APIGatewayProxyResult =
        await metagraphHandler.currencySnapshots(event);

      expect(response.statusCode).toBe(404);

      expect(response.body).toBe('{"message":"Not found","errors":["metagraph"]}');

    });
    
  });

  describe("currencyTransactions", () => {
    it("should return transactions sorted by snapshot ordinal descending", async () => {
      const metagraph_id = data_metagraphs[0].id

      const event = createAPIGatewayEvent({identifier: metagraph_id});

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyTransactions(event);

      const transactions = data_metagraph_transactions.filter(tx => tx.metagraph_id === metagraph_id)

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      expect([
        body.data[0].snapshotOrdinal,
        body.data[1].snapshotOrdinal,
      ]).toEqual([2, 1]);

      validateTransaction(body.data[0], data_metagraph_transactions[1]);
      validateTransaction(body.data[1], data_metagraph_transactions[0]);
    });

    it("should return not found on invalid metagraph", async () => {
      const identifier = ""
      const event = createAPIGatewayEvent({ identifier }, { limit: "10" });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyTransactions(event);

      expect(response.statusCode).toBe(404);

      expect(response.body).toBe('{"message":"Not found","errors":["metagraph"]}');

    });
  });

  describe("currencyTransactionsByAddress", () => {
    it("should return transactions for specified address sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0].address;
      const metagraph_id = data_metagraphs[0].id

      const event = createAPIGatewayEvent({ address, identifier: metagraph_id}, { limit: "10" });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyTransactionsByAddress(event);

      const transactions = data_metagraph_transactions.filter(tx => tx.metagraph_id === metagraph_id && (tx.source_addr === address || tx.destination_addr === address))

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      expect([
        body.data[0].snapshotOrdinal,
        body.data[1].snapshotOrdinal,
      ]).toEqual([2, 1]);    

      validateTransaction(body.data[0], data_metagraph_transactions[1]);
      validateTransaction(body.data[1], data_metagraph_transactions[0]);
    });
  });

  describe("currencyBalanceByAddress", () => {
    it("should return the latest balance for a given address", async () => {
      const testBalance = data_metagraph_balance_changes[1];
      const metagraph_id = testBalance.metagraph_id;

      const event = createAPIGatewayEvent({
        identifier: metagraph_id,
        address: testBalance.address,
      });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyBalanceByAddress(event);

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];

      expect(body.balance).toBe(Number(testBalance.balance));
      expect(body.address).toBe(testBalance.address);
      expect(body.ordinal).toBeDefined();
    });
  });
});
