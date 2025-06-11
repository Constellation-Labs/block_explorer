import { APIGatewayProxyResult } from "aws-lambda";
import * as actionsHandler from "../../src/handlers/actionsHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import {
  data_dag_token_locks,
  data_metagraph_token_locks,
  data_dag_token_unlocks,
  data_metagraph_token_unlocks,
  data_dag_spend_transactions,
  data_metagraph_spend_transactions,
  data_dag_allow_spends,
  data_dag_expired_spend_transactions,
  data_metagraph_allow_spends,
  data_metagraph_expired_spend_transactions,
  data_delegate_stake_withdraw_events,
  data_delegate_stake_create_events,
  data_metagraph_fee_transactions,
  data_metagraph_snapshots,
} from "../../prisma/seed";

const datasets = [
  data_dag_token_locks,
  data_dag_token_unlocks,
  data_dag_spend_transactions,
  data_dag_expired_spend_transactions,
  data_dag_spend_transactions,
  data_dag_allow_spends,
  data_delegate_stake_create_events,
  data_delegate_stake_withdraw_events,
  data_metagraph_token_locks,
  data_metagraph_token_unlocks,
  data_metagraph_spend_transactions,
  data_metagraph_expired_spend_transactions,
  data_metagraph_spend_transactions,
  data_metagraph_allow_spends,
  data_metagraph_fee_transactions,
];

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

const validateAction = (action) => {
  const match = datasets.flat().find((tx) => tx.hash === action.hash);

  expect(match).toBeDefined();
  if (!match) return;

  expect(action.hash).toBe(match.hash);
  if (action.type == "DelegateStakeWithdraw") {
    const stake = data_delegate_stake_create_events.find(
      (tx) => tx.hash === match.stake_create_hash
    );
    expect(action.amount).toBeBigInt(stake.amount);
  } else expect(action.amount).toBeBigInt(match.amount);
  expect(action.source).toBe(match.source_addr);
  expect(action.type).toBeDefined();
  if (action.currencyId !== null) {
    expect(typeof action.currencyId).toBe("string");
  }
};

describe("actionsHandler", () => {
  it("dagActions", async () => {
    const event = createAPIGatewayEvent({}, { pageSize: "10" });
    const result = (await actionsHandler.dagActions(
      event
    )) as APIGatewayProxyResult;
    validateResponseStructure(result);

    expect(result.statusCode).toBe(200);
    const body = validatePaginatedResponse(result);
    expect(body.data.length).toBe(15);
    body.data.forEach(validateAction);
  });

  it("globalSnapshotActions", async () => {
    const event = createAPIGatewayEvent({ term: "1000" }, {});
    const result = (await actionsHandler.globalSnapshotActions(
      event
    )) as APIGatewayProxyResult;
    validateResponseStructure(result);

    expect(result.statusCode).toBe(200);
    const body = validatePaginatedResponse(result);
    body.data.forEach(validateAction);
  });

  it("dagAddressActions", async () => {
    const address = data_dag_token_locks[0].source_addr;
    const event = createAPIGatewayEvent({ address }, {});
    const result = (await actionsHandler.dagAddressActions(
      event
    )) as APIGatewayProxyResult;
    validateResponseStructure(result);

    expect(result.statusCode).toBe(200);
    const body = validatePaginatedResponse(result);
    expect(body.data.length).toBe(11);
    body.data.forEach(validateAction);
  });

  it("currencyActions", async () => {
    const metagraph_id = data_metagraph_token_locks[0].metagraph_id;
    const event = createAPIGatewayEvent({ metagraph_id }, {});
    const result = (await actionsHandler.currencyActions(
      event
    )) as APIGatewayProxyResult;
    validateResponseStructure(result);

    expect(result.statusCode).toBe(200);
    const body = validatePaginatedResponse(result);
    expect(body.data.length).toBe(11);
    body.data.forEach(validateAction);
  });

  it("currencySnapshotActions", async () => {
    const metagraph_id = data_metagraph_token_locks[0].metagraph_id;
    const snapshotHash = data_metagraph_snapshots[0].hash;
    const event = createAPIGatewayEvent(
      { metagraph_id, term: snapshotHash },
      {}
    );
    const result = (await actionsHandler.currencySnapshotActions(
      event
    )) as APIGatewayProxyResult;
    validateResponseStructure(result);

    expect(result.statusCode).toBe(200);
    const body = validatePaginatedResponse(result);
    expect(body.data.length).toBe(4);
    body.data.forEach(validateAction);
  });

  it("currencyAddressActions", async () => {
    const metagraph_id = data_metagraph_token_locks[0].metagraph_id;
    const address = data_metagraph_token_locks[0].source_addr;
    const event = createAPIGatewayEvent({ metagraph_id, address }, {});
    const result = (await actionsHandler.currencyAddressActions(
      event
    )) as APIGatewayProxyResult;
    validateResponseStructure(result);

    expect(result.statusCode).toBe(200);
    const body = validatePaginatedResponse(result);
    expect(body.data.length).toBe(9);
    body.data.forEach(validateAction);
  });
});
