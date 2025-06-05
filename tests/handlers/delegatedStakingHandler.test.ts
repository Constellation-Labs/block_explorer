import {
  delegatedStakes,
  delegatedStake,
  addressDelegatedStakes,
  delegatedStakeWithdrawals,
  delegatedStakeWithdrawal,
  addressDelegatedStakeWithdrawals,
  stakingPositions,
} from "../../src/handlers/delegatedStakingHandler";

import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";

import {
  data_addresses,
  data_dag_token_locks,
  data_delegate_stake_create_events,
  data_delegate_stake_rewards,
  data_delegate_stake_withdraw_events,
  data_global_snapshots,
  prisma,
} from "../../prisma/seed";

expect.extend({
  toBeBigInt(received, expected) {
    const pass = BigInt(received) === BigInt(expected);
    return {
      pass,
      message: () =>
        `expected ${received} to be the same BigInt as ${expected}`,
    };
  },
});

const validateCreateStake = (tx) => {
  const match = data_delegate_stake_create_events.find(
    (d) => d.hash === tx.hash
  );
  expect(tx.source).toBe(match.source_addr);
  expect(tx.nodeId).toBe(match.node_id);
  expect(tx.amount).toBeBigInt(match.amount);
  expect(tx.fee).toBeBigInt(match.fee);
  expect(tx.timestamp).toBeDefined();
  expect(tx.type).toBe(match.transfer_from_hash ? "transfer" : "create");
  expect(tx.globalSnapshotHash).toBeDefined();
  expect(tx.globalSnapshotOrdinal).toBeDefined();
};

const validateWithdrawStake = (tx) => {
  const match = data_delegate_stake_withdraw_events.find(
    (d) => d.hash === tx.hash
  );
  expect(tx.source).toBe(match.source_addr);
  expect(tx.stake.hash).toBe(match.stake_create_hash);
  expect(tx.unlockEpoch).toBeBigInt(match.unlock_epoch);
  expect(tx.status).toBe(
    match.is_completed ? "withdrawalComplete" : "pendingWithdrawal"
  );
  expect(tx.timestamp).toBeDefined();
  expect(tx.globalSnapshotHash).toBeDefined();
  expect(tx.globalSnapshotOrdinal).toBeDefined();
};

const validateStakingPosition = (tx) => {
  const match = data_delegate_stake_create_events.find(
    (d) => d.hash === tx.stakeHash
  );
  expect(tx.address).toBe(match.source_addr);
  expect(tx.nodeId).toBe(match.node_id);
  expect(tx.lockAmount).toBeBigInt(match.amount);
  //rewards for this staking event
  expect(tx.rewardsAccrued).toBeBigInt(
    data_delegate_stake_rewards
      .filter((r) => r.stake_create_hash === match.hash)
      .reduce((sum, r) => sum + r.rewards, BigInt(0))
  );
  //total amount including rewards of transferred events
  if (tx.withdrawalCompletedAt != null) {
    expect(tx.withdrawnAmount).toBeBigInt(
      data_delegate_stake_rewards
        .filter((r) =>
          data_delegate_stake_create_events.some(
            (event) =>
              event.lock_reference_hash === match.lock_reference_hash &&
              event.hash === r.stake_create_hash
          )
        )
        .reduce((sum, r) => sum + r.rewards, BigInt(0))
    );
  }
};

describe("Delegated Stake Handler Integration Tests", () => {
  describe("delegatedStakes", () => {
    it("should return a list of delegated stakes with default filtering", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await delegatedStakes(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
      body.data.forEach(validateCreateStake);
    });

    it("should handle status filtering", async () => {
      const event = createAPIGatewayEvent(
        {},
        {
          limit: "10",
          status: "transferred,active,pendingWithdrawal,withdrawalComplete",
        }
      );
      const response = await delegatedStakes(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(4);
      body.data.forEach((tx) => {
        expect([
          "transferred",
          "active",
          "pendingWithdrawal",
          "withdrawalComplete",
        ]).toContain(tx.status);
      });
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
      body.data.forEach(validateWithdrawStake);
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

  describe("stakingPositions", () => {
    it("should return staking positions", async () => {
      const event = createAPIGatewayEvent();

      const response = await stakingPositions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
      body.data.forEach(validateStakingPosition);
    });

    it("should handle status filtering", async () => {
      const event = createAPIGatewayEvent(
        {},
        {
          limit: "10",
          status: "pendingWithdrawal",
        }
      );
      const response = await stakingPositions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach((tx) => {
        expect(["pendingWithdrawal"]).toContain(tx.status);
      });
    });

    it("should return staking positions for an address", async () => {
      const test = data_delegate_stake_create_events[0];
      const event = createAPIGatewayEvent({ address: test.source_addr });

      const response = await stakingPositions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      body.data.forEach(validateStakingPosition);
    });

    it("should return staking positions for a node", async () => {
      const test = data_delegate_stake_create_events[0];
      const event = createAPIGatewayEvent({}, { nodeId: "NODE_ABC123" });

      const response = await stakingPositions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      body.data.forEach(validateStakingPosition);
    });
  });
});
