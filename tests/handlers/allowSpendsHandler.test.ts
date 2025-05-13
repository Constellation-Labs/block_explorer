import { APIGatewayProxyResult } from "aws-lambda";
import * as allowSpendsHandler from "../../src/handlers/allowSpendsHandler";
import {
  createAPIGatewayEvent,
  validatePaginatedResponse,
  validateResponseStructure,
} from "../testUtils";
import {
  data_addresses,
  data_global_snapshots,
  data_metagraph_snapshots,
  data_metagraphs,
  prisma,
} from "../../prisma/seed";

export const data_dag_allow_spends = [
  {
    hash: "allowSpendHash1",
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
];

export const data_dag_spend_transactions = [
  {
    hash: "spendTxHash1",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 1000n,
    allow_spend_ref: data_dag_allow_spends[0].hash,
    snapshot_hash: data_global_snapshots[2].hash,
    created_at: new Date("2024-01-05T10:00:00Z"),
    updated_at: new Date("2024-01-05T10:00:00Z"),
  },
];

export const data_dag_expired_spend_transactions = [
  {
    hash: "expiredSpendTxHash1",
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
];

export const data_metagraph_spend_transactions = [
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaSpendTxHash1",
    source_addr: data_addresses[0].address,
    destination_addr: data_addresses[1].address,
    amount: 500n,
    allow_spend_ref: data_metagraph_allow_spends[0].hash,
    snapshot_hash: data_metagraph_snapshots[0].hash,
    created_at: new Date("2024-01-03T11:00:00Z"),
    updated_at: new Date("2024-01-03T11:00:00Z"),
  },
];

export const data_metagraph_expired_spend_transactions = [
  {
    metagraph_id: data_metagraphs[0].id,
    hash: "metaExpiredTxHash1",
    source_addr: data_addresses[2].address,
    amount: 750n,
    allow_spend_ref: data_metagraph_allow_spends[2].hash,
    snapshot_hash: data_metagraph_snapshots[1].hash,
    created_at: new Date("2024-01-04T11:00:00Z"),
    updated_at: new Date("2024-01-04T11:00:00Z"),
  },
];

const seedData = async () => {
  await prisma.dag_allow_spends.createMany({
    data: data_dag_allow_spends,
  });

  await prisma.dag_spend_transactions.createMany({
    data: data_dag_spend_transactions,
  });

  await prisma.dag_expired_spend_transactions.createMany({
    data: data_dag_expired_spend_transactions,
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
};

beforeAll(async () => {
  await seedData();
});

// Helper validations
const validateDagAllowSpend = (entry) => {
  const match = data_dag_allow_spends.find((d) => d.hash === entry.hash);
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.hash).toBe(match.hash);
  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(Number(entry.fee)).toBe(Number(match.fee));
  expect(Number(entry.ordinal)).toBe(Number(match.ordinal));
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateDagSpendTransaction = (entry) => {
  const match = data_dag_spend_transactions.find((d) => d.hash === entry.hash);
  expect(match).toBeDefined();
  if (!match) return;

  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateDagExpiredSpend = (entry) => {
  const match = data_dag_expired_spend_transactions.find(
    (d) => d.hash === entry.hash
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateMgAllowSpend = (entry) => {
  const match = data_metagraph_allow_spends.find((d) => d.hash === entry.hash);
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.hash).toBe(match.hash);
  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(Number(entry.fee)).toBe(Number(match.fee));
  expect(entry.timestamp).toBeDefined();
};

const validateMgSpendTransaction = (entry) => {
  const match = data_metagraph_spend_transactions.find(
    (d) => d.hash === entry.hash
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateMgExpiredSpend = (entry) => {
  const match = data_metagraph_expired_spend_transactions.find(
    (d) => d.hash === entry.hash
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

describe("AllowSpends Handler Integration Tests", () => {
  describe("allowSpends", () => {
    it("should return a list of allow spends", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult =
        await allowSpendsHandler.allowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_dag_allow_spends.length);
      body.data.forEach(validateDagAllowSpend);
    });

    it("should return active allow spends", async () => {
      const event = createAPIGatewayEvent({}, { active: "true" });
      const response: APIGatewayProxyResult =
        await allowSpendsHandler.allowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
      body.data.forEach(validateDagAllowSpend);
    });
  });

  describe("allowSpend", () => {
    it("should return a specific allow spend by hash", async () => {
      const hash = data_dag_allow_spends[0].hash;
      const event = createAPIGatewayEvent({ hash });

      const response = await allowSpendsHandler.allowSpend(event);
      expect(response.statusCode).toBe(200);

      const body = validateResponseStructure(response)["data"];
      validateDagAllowSpend(body);
    });
  });

  describe("globalSnapshotAllowSpends", () => {
    it("should return allow spends for a specific global snapshot", async () => {
      const hash_or_ordinal = data_global_snapshots[0].hash;
      const event = createAPIGatewayEvent({ hash_or_ordinal });

      const response = await allowSpendsHandler.globalSnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(3);
      body.data.forEach(validateDagAllowSpend);
    });

    it("should return active only allow spends for a specific global snapshot", async () => {
      const hash_or_ordinal = data_global_snapshots[0].hash;
      const event = createAPIGatewayEvent(
        { hash_or_ordinal },
        { active: "true" }
      );

      const response = await allowSpendsHandler.globalSnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateDagAllowSpend);
    });
  });

  describe("addressAllowSpends", () => {
    it("should return allow spends for a specific address", async () => {
      const address = data_addresses[3].address;
      const event = createAPIGatewayEvent({ address });

      const response = await allowSpendsHandler.addressAllowSpends(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateDagAllowSpend);
    });
    it("should return active only allow spends for a specific address", async () => {
      const address = data_addresses[3].address;
      const event = createAPIGatewayEvent({ address }, { active: "true" });

      const response = await allowSpendsHandler.addressAllowSpends(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateDagAllowSpend);
    });
  });

  describe("spendTransactions", () => {
    it("should return spend transactions", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await allowSpendsHandler.spendTransactions(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_dag_spend_transactions.length);
      validateDagSpendTransaction(body.data[0]);
    });
  });

  describe("allowSpendExpirations", () => {
    it("should return expired spend transactions", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await allowSpendsHandler.allowSpendExpirations(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_dag_expired_spend_transactions.length);
      validateDagExpiredSpend(body.data[0]);
    });
  });

  describe("addressSpendTransactions", () => {
    it("should return spend transactions for a specific address", async () => {
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ address });

      const response = await allowSpendsHandler.addressSpendTransactions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(validateDagSpendTransaction);
    });
  });

  describe("addressAllowSpendExpirations", () => {
    it("should return expired spend transactions for an address", async () => {
      const address = data_addresses[2].address;
      const event = createAPIGatewayEvent({ address });

      const response = await allowSpendsHandler.addressAllowSpendExpirations(
        event
      );
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(validateDagExpiredSpend);
    });
  });
});

describe("Metagraph AllowSpends Handler Integration Tests", () => {
  describe("currencyAllowSpends", () => {
    it("should return all allow spends", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
      });
      const response = await allowSpendsHandler.currencyAllowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(3);
      body.data.forEach(validateMgAllowSpend);
    });

    it("should return active allow spends only", async () => {
      const event = createAPIGatewayEvent(
        { metagraph_id: data_metagraphs[0].id },
        { active: "true" }
      );
      const response = await allowSpendsHandler.currencyAllowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgAllowSpend);
    });
  });

  describe("currencySpendTransactions", () => {
    it("should return spend transactions", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
      });
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_metagraph_spend_transactions.length);
      body.data.forEach(validateMgSpendTransaction);
    });
  });

  describe("currencyAllowSpendExpirations", () => {
    it("should return expired spend transactions", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
      });
      const response = await allowSpendsHandler.currencyAllowSpendExpirations(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(
        data_metagraph_expired_spend_transactions.length
      );
      body.data.forEach(validateMgExpiredSpend);
    });
  });

  describe("currencySnapshotAllowSpends", () => {
    it("should return allow spends for a snapshot", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        hash_or_ordinal: data_metagraph_snapshots[0].hash,
      });

      const response = await allowSpendsHandler.currencySnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgAllowSpend);
    });
    it("should return active only allow spends for a snapshot", async () => {
      const event = createAPIGatewayEvent(
        {
          metagraph_id: data_metagraphs[0].id,
          hash_or_ordinal: data_metagraph_snapshots[1].hash,
        },
        { active: "true" }
      );

      const response = await allowSpendsHandler.currencySnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgAllowSpend);
    });
  });

  describe("currencySnapshotSpendTransactions", () => {
    it("should return spend transactions for a snapshot", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        hash_or_ordinal: data_metagraph_snapshots[0].hash,
      });

      const response =
        await allowSpendsHandler.currencySnapshotSpendTransactions(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgSpendTransaction);
    });
  });

  describe("currencySnapshotAllowSpendExpirations", () => {
    it("should return expired spend transactions for a snapshot", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        hash_or_ordinal: data_metagraph_snapshots[1].hash,
      });

      const response =
        await allowSpendsHandler.currencySnapshotAllowSpendExpirations(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgExpiredSpend);
    });
  });

  describe("currencyAddressAllowSpends", () => {
    it("should return allow spends for an address", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        address: data_addresses[1].address,
      });

      const response = await allowSpendsHandler.currencyAddressAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
    });
    it("should return active only allow spends for an address", async () => {
      const event = createAPIGatewayEvent(
        {
          metagraph_id: data_metagraphs[0].id,
          address: data_addresses[1].address,
        },
        { active: "true" }
      );

      const response = await allowSpendsHandler.currencyAddressAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
    });
  });

  describe("currencyAddressSpendTransactions", () => {
    it("should return spend transactions for an address", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        address: data_addresses[1].address,
      });

      const response =
        await allowSpendsHandler.currencyAddressSpendTransactions(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
    });
  });

  describe("currencyAddressAllowSpendExpirations", () => {
    it("should return expired spend transactions for an address", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        address: data_addresses[2].address,
      });

      const response =
        await allowSpendsHandler.currencyAddressAllowSpendExpirations(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
    });
  });
});
