import {
  delegatedStakes,
  delegatedStake,
  addressDelegatedStakes,
  delegatedStakeWithdrawals,
  delegatedStakeWithdrawal,
  addressDelegatedStakeWithdrawals,
  stakingBalanceByAddress,
} from "../../src/handlers/delegatedStakingHandler";

import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";

import {
  data_addresses,
  data_dag_token_locks,
  data_global_snapshots,
  prisma,
} from "../../prisma/seed";
import { randomUUID } from "crypto";

const data_delegate_stake_create_events = [
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
    is_update: false,
  },
  {
    hash: "stake-event-hash-002",
    ordinal: 10002n,
    source_addr: data_addresses[0].address,
    node_id: "NODE_ABC123",
    amount: 3333300000000n,
    fee: 500000n,
    lock_reference_hash: data_dag_token_locks[1].hash,
    parent_hash: "stake-event-hash-001",
    global_snapshot_hash: data_global_snapshots[1].hash,
    is_update: false,
  },
  {
    hash: "stake-event-hash-003",
    ordinal: 10003n,
    source_addr: data_addresses[0].address,
    node_id: "NODE_ABC123",
    amount: 2222222222,
    fee: 500000n,
    lock_reference_hash: data_dag_token_locks[1].hash,
    parent_hash: "stake-event-hash-001",
    global_snapshot_hash: data_global_snapshots[1].hash,
    is_update: true,
  },
];

const data_delegate_stake_withdraw_events = [
  {
    hash: "withdraw-event-hash-001",
    source_addr: data_addresses[0].address,
    stake_create_hash: data_delegate_stake_create_events[0].hash,
    global_snapshot_hash: data_global_snapshots[1].hash,
  },
];
const data_delegate_stake_balance_changes = [
  {
    global_snapshot_hash: data_global_snapshots[1].hash,
    global_snapshot_ordinal: data_global_snapshots[1].ordinal,
    address: data_addresses[0].address,
    node_id: "NODE_DEF456",
    balance: 700000000000n,
    rewards: 1000000000n,
  },
];
const data_delegate_stake_rewards = [
  {
    global_snapshot_hash: data_global_snapshots[2].hash,
    address: data_addresses[0].address,
    node_id: "NODE_ABC123",
    rewards: 2500000000n,
  },
];
const seedData = async () => {
  await prisma.delegate_stake_create_events.createMany({
    data: data_delegate_stake_create_events,
  });

  await prisma.delegate_stake_withdraw_events.createMany({
    data: data_delegate_stake_withdraw_events,
  });

  await prisma.delegate_stake_balance_changes.createMany({
    data: data_delegate_stake_balance_changes,
  });

  await prisma.delegate_stake_rewards.createMany({
    data: data_delegate_stake_rewards,
  });
};

const validateCreateStake = (tx) => {
  const match = data_delegate_stake_create_events.find(
    (d) => d.hash === tx.hash
  );
  expect(tx.source).toBe(match.source_addr);
  expect(tx.nodeId).toBe(match.node_id);
  expect(Number(tx.amount)).toBe(Number(match.amount));
  expect(tx.timestamp).toBeDefined();
};

const validateWithdrawStake = (tx) => {
  const match = data_delegate_stake_withdraw_events.find(
    (d) => d.hash === tx.hash
  );
  expect(tx.source).toBe(match.source_addr);
  expect(tx.stakeHash).toBe(match.stake_create_hash);
  expect(tx.timestamp).toBeDefined();
};

const validateBalanceChange = (tx) => {
  const match = data_delegate_stake_balance_changes.find(
    (d) => d.address === tx.address && d.node_id === tx.nodeId
  );
  expect(tx.balance).toBe(Number(match.balance));
  expect(tx.rewards).toBe(Number(match.rewards));
  expect(tx.timestamp).toBeDefined();
};

describe("Delegated Stake Handler Integration Tests", () => {
  beforeAll(async () => {
    await seedData();
  });

  describe("delegatedStakes", () => {
    it("should return a list of delegated stakes", async () => {
      const activeStates = [
        data_delegate_stake_create_events[1],
        data_delegate_stake_create_events[2],
      ];
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await delegatedStakes(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(activeStates.length);
      validateCreateStake(body.data[0]);
    });
  });

  describe("delegatedStake", () => {
    it("should return a specific delegated stake by hash", async () => {
      const test = data_delegate_stake_create_events[0];
      const event = createAPIGatewayEvent({ hash: test.hash });

      const response = await delegatedStake(event);
      expect(response.statusCode).toBe(200);

      const body = validateResponseStructure(response)["data"];
      validateCreateStake(body);
    });
  });

  describe("addressDelegatedStakes", () => {
    it("should return stakes for a specific address", async () => {
      const test = data_delegate_stake_create_events[0];
      const event = createAPIGatewayEvent({ address: test.source_addr });

      const response = await addressDelegatedStakes(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      body.data.forEach(validateCreateStake);
    });
  });

  describe("delegatedStakeWithdrawals", () => {
    it("should return a list of stake withdrawals", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await delegatedStakeWithdrawals(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_delegate_stake_withdraw_events.length);
      validateWithdrawStake(body.data[0]);
    });
  });

  describe("delegatedStakeWithdrawal", () => {
    it("should return a specific stake withdrawal by hash", async () => {
      const test = data_delegate_stake_withdraw_events[0];
      const event = createAPIGatewayEvent({ hash: test.hash });

      const response = await delegatedStakeWithdrawal(event);
      expect(response.statusCode).toBe(200);

      const body = validateResponseStructure(response)["data"];
      validateWithdrawStake(body);
    });
  });

  describe("addressDelegatedStakeWithdrawals", () => {
    it("should return withdrawals for a specific address", async () => {
      const test = data_delegate_stake_withdraw_events[0];
      const event = createAPIGatewayEvent({ address: test.source_addr });

      const response = await addressDelegatedStakeWithdrawals(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      body.data.forEach(validateWithdrawStake);
    });
  });

  describe("stakingBalanceByAddress", () => {
    it("should return staking balance per node for an address", async () => {
      const test = data_delegate_stake_balance_changes[0];
      const event = createAPIGatewayEvent({ address: test.address });

      const response = await stakingBalanceByAddress(event);
      expect(response.statusCode).toBe(200);

      const body = validateResponseStructure(response)["data"];
      expect(Array.isArray(body)).toBe(true);
      body.forEach(validateBalanceChange);
    });
  });
});
